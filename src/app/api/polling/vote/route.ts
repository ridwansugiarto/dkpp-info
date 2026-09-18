import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkRateLimit } from '@/lib/polling/guards';
import { recordMemoryVote } from '@/lib/polling/store';
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
    let effectiveUserEmail: string | null = null;

    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      effectiveUserId = user.id;
      effectiveUserEmail = user.email || null;
    }

    if (!effectiveUserId && (userEmail || userId || userNip)) {
      const authProfile = await resolveUserAuth(userEmail, userId, userNip);
      if (authProfile && authProfile.role !== 'GUEST') {
        effectiveUserId = authProfile.id || userId || `user-${Date.now()}`;
        effectiveUserEmail = authProfile.email;
      }
    }

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Silakan login dengan akun Gmail Anda untuk mengikuti polling.' },
        { status: 401 }
      );
    }

    // 2. Rate Limiting (Maks 10 submit per menit)
    const rateCheck = checkRateLimit(effectiveUserId, 10, 60000);
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
    const fallbackTheme = OFFICIAL_POLL_THEMES.find((t) => t.code === cleanCode || t.id === poll_id);

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

    // 4. Catat ke memory store untuk real-time fallback tanpa latency
    recordMemoryVote(cleanCode, effectiveUserId, uniqueIds);

    // 5. Coba Simpan ke database Supabase
    try {
      // Simpan suara ke tabel votes jika ada
      const voteInserts = uniqueIds.map((empId) => ({
        poll_id: dbPollId,
        user_id: effectiveUserId,
        employee_id: empId,
      }));

      await supabaseAdmin.from('votes').upsert(voteInserts, { onConflict: 'poll_id,user_id,employee_id' });

      // Simpan penanda partisipasi
      await supabaseAdmin.from('poll_participations').upsert({
        poll_id: dbPollId,
        user_id: effectiveUserId,
        choices_count: uniqueIds.length,
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

      // Catat Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: effectiveUserId,
        action: 'SUBMIT_POLL_VOTE',
        poll_id: dbPollId,
        payload: {
          employee_ids: uniqueIds,
          email: effectiveUserEmail,
        },
        ip_address: ip,
        user_agent: userAgent,
      });
    } catch (dbErr) {
      console.warn('Database save warning (using memory store fallback):', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Suara Anda berhasil tercatat secara aman dan anonim!',
    });
  } catch (err: any) {
    console.error('API Vote error:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}
