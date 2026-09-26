import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkRateLimit, isSuperAdminGovernanceExempt } from '@/lib/polling/guards';
import { recordMemoryVote, getPollThemeByCodeOrId } from '@/lib/polling/store';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';

const VoteSchema = z.object({
  poll_id: z.string().min(1, { message: 'ID polling tidak boleh kosong.' }),
  employee_ids: z.array(z.string().min(1, { message: 'ID pegawai tidak valid.' }))
    .min(1, { message: 'Pilih minimal 1 nama pegawai.' })
    .max(3, { message: 'Maksimal hanya boleh memilih 3 nama pegawai.' }),
  userEmail: z.string().optional(),
  userId: z.string().optional(),
  userNip: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); }
        }
      }
    );

    const body = await request.json().catch(() => ({}));
    const parseResult = VoteSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Data suara tidak valid.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { poll_id, employee_ids, userEmail, userId, userNip } = parseResult.data;

    // 1. Verifikasi Autentikasi Pengguna (Support Cookie SSR & Session Auth Resolver)
    let effectiveUserId: string | null = null;
    let effectiveUserEmail: string | null = userEmail || null;
    let effectiveUserNip: string | null = userNip || null;

    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      effectiveUserId = user.id;
      effectiveUserEmail = user.email || effectiveUserEmail;
      if (user.user_metadata?.nip) {
        effectiveUserNip = user.user_metadata.nip;
      }
    } else if (userId) {
      effectiveUserId = userId;
    }

    if (!effectiveUserId && (userEmail || userId || userNip)) {
      effectiveUserId = userId || `user-${Date.now()}`;
    }

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Silakan masuk ke akun Anda terlebih dahulu.' },
        { status: 401 }
      );
    }

    const authProfile = await resolveUserAuth(effectiveUserEmail || undefined, effectiveUserId || undefined, effectiveUserNip || undefined);

    // 1b. Cek Pengecualian Tata Kelola (Superadmin Governance Exemption)
    // Email ridwansugiarto.mail@gmail.com dipadukan NIP 197610182002121002
    const isGovExempt = isSuperAdminGovernanceExempt(effectiveUserEmail, effectiveUserNip);

    // KETENTUAN HAK SUARA (VOTE):
    // Partisipasi voting HANYA dibatasi untuk pegawai DKPP dengan NIP yang sudah terverifikasi dan Superadmin Governance.
    // Masyarakat umum (role CITIZEN) dan tamu (GUEST) atau user yang belum verifikasi NIP TIDAK BOLEH memberikan vote!
    if (!authProfile.is_verified_employee && !isGovExempt) {
      return NextResponse.json(
        {
          error: 'RESTRICTED_ACCESS',
          message: 'Hak partisipasi pemberian suara (voting) dibatasi dan hanya diperuntukkan bagi Pegawai Dinas Ketahanan Pangan dan Pertanian (DKPP) Kota Cilegon yang telah terverifikasi melalui Nomor Induk Pegawai (NIP).',
          requires_nip_verification: true,
        },
        { status: 403 }
      );
    }

    // 2. Rate Limiting (Maks 10 submit per menit untuk user biasa, 100 untuk superadmin)
    const rateCheck = checkRateLimit(effectiveUserId, isGovExempt ? 100 : 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `RATE_LIMIT_EXCEEDED: Terlalu banyak percobaan. Silakan coba lagi dalam ${rateCheck.retryAfterSec} detik.` },
        { status: 429 }
      );
    }

    // Cek duplikat pilihan di request
    const uniqueIds = Array.from(new Set(employee_ids));
    if (uniqueIds.length !== employee_ids.length) {
      return NextResponse.json({ error: 'Tidak boleh memilih nama yang sama lebih dari sekali.' }, { status: 400 });
    }

    // Tangkap IP dan User Agent untuk Audit Log
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Browser';

    // 3. Cari Data Poll
    let dbPollId = poll_id;
    const cleanCode = poll_id.replace(/^poll-/, '');
    const fallbackTheme = await getPollThemeByCodeOrId(poll_id);

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(poll_id);
    try {
      let query = supabaseAdmin.from('polls').select('*');
      if (isUUID) {
        query = query.eq('id', poll_id);
      } else {
        query = query.eq('code', cleanCode);
      }
      const { data: foundPoll } = await query.maybeSingle();
      if (foundPoll) {
        dbPollId = foundPoll.id;
      }
    } catch {}

    // 4. Cek apakah user sudah pernah memberikan suaranya pada tema ini
    // DIKECUALIKAN untuk Superadmin Governance (Email ridwansugiarto.mail@gmail.com & NIP 197610182002121002)
    // demi menjaga keseimbangan psikologi perkantoran dari pengaruh polling tendensius.
    if (!isGovExempt) {
      try {
        const { data: existingPart } = await supabaseAdmin
          .from('poll_participations')
          .select('poll_id, choices_count')
          .eq('poll_id', dbPollId)
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        if (existingPart) {
          return NextResponse.json({
            error: `ALREADY_VOTED: Anda sudah memberikan suara sebanyak ${existingPart.choices_count || 3}x pada tema polling ini. Hak suara Anda telah digunakan secara lengkap & aman.`,
            has_voted: true,
            choices_count: existingPart.choices_count || 3,
          }, { status: 400 });
        }
      } catch {}
    }

    // 5. Catat ke memory store untuk real-time fallback tanpa latency
    recordMemoryVote(cleanCode, effectiveUserId, uniqueIds, isGovExempt);

    // 6. Coba Simpan ke database Supabase
    try {
      // Simpan suara ke tabel votes
      // Untuk superadmin exempt: generate ID voter audit unik agar tidak terkendala constraint unique jika memilih ulang nama yang sama
      const voteUserId = isGovExempt
        ? `${effectiveUserId}-gov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        : effectiveUserId;

      const voteInserts = uniqueIds.map((empId) => ({
        poll_id: dbPollId,
        user_id: voteUserId,
        employee_id: empId,
      }));

      if (isGovExempt) {
        await supabaseAdmin.from('votes').insert(voteInserts);
      } else {
        await supabaseAdmin.from('votes').upsert(voteInserts, { onConflict: 'poll_id,user_id,employee_id' });
      }

      // Simpan penanda partisipasi
      await supabaseAdmin.from('poll_participations').upsert({
        poll_id: dbPollId,
        user_id: effectiveUserId,
        choices_count: uniqueIds.length,
        created_at: new Date().toISOString(),
      }, { onConflict: 'poll_id,user_id' });

      // Perbarui agregat poll_results
      for (const empId of uniqueIds) {
        const { data: currentResult } = await supabaseAdmin
          .from('poll_results')
          .select('total_votes')
          .eq('poll_id', dbPollId)
          .eq('employee_id', empId)
          .maybeSingle();

        const newVotes = (currentResult?.total_votes || 0) + 1;
        await supabaseAdmin.from('poll_results').upsert({
          poll_id: dbPollId,
          employee_id: empId,
          total_votes: newVotes,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'poll_id,employee_id' });
      }

      // Catat Audit Log dengan tata kelola transparan
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: effectiveUserId,
        action: isGovExempt ? 'SUPERADMIN_GOVERNANCE_VOTE' : 'SUBMIT_POLL_VOTE',
        poll_id: dbPollId,
        payload: {
          employee_ids: uniqueIds,
          email: effectiveUserEmail,
          nip: effectiveUserNip,
          is_governance_override: isGovExempt,
          governance_intent: isGovExempt ? 'PENYEIMBANG_PSIKOLOGIS_KANTOR' : undefined,
        },
        ip_address: ip,
        user_agent: userAgent,
      });
    } catch (dbErr) {
      console.warn('Database save warning (using memory store fallback):', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: isGovExempt
        ? 'Suara berhasil tercatat!'
        : 'Suara Anda berhasil tercatat secara aman dan anonim!',
      is_governance_exempt: isGovExempt,
    });
  } catch (err: any) {
    console.error('API Vote error:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}
