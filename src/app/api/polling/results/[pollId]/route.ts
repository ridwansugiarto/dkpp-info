import { NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';
import { getMemoryResults, getPollThemeByCodeOrId } from '@/lib/polling/store';
import { resolveEmployeeProfilesBatch } from '@/lib/polling/resolver';
import { isSuperAdminGovernanceExempt } from '@/lib/polling/guards';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const { pollId } = await params;
    const identifier = (pollId || '').trim();
    const cleanCode = identifier.replace(/^poll-/, '');

    if (!identifier) {
      return NextResponse.json({ error: 'ID atau kode polling wajib diisi.' }, { status: 400 });
    }

    // 1. Ambil Data Tema Poll (dari Database atau Constants Fallback)
    let targetPoll = await getPollThemeByCodeOrId(identifier);

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let query = supabaseAdmin.from('polls').select('*');
      if (isUUID) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('code', cleanCode);
      }
      const { data: dbPoll } = await query.maybeSingle();
      if (dbPoll) {
        targetPoll = { ...targetPoll, ...dbPoll };
      }
    } catch {}

    // 1b. Verifikasi Hak Akses: HANYA PEGAWAI DENGAN NIP TERVERIFIKASI & SUPERADMIN YANG BISA MELIHAT HASIL
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const queryUserEmail = url.searchParams.get('userEmail');
    const queryUserNip = url.searchParams.get('userNip');

    let resolvedUserId: string | null = null;
    let resolvedUserEmail: string | null = queryUserEmail || null;
    let resolvedUserNip: string | null = queryUserNip || null;

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
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        resolvedUserId = user.id;
        resolvedUserEmail = user.email || resolvedUserEmail;
        if (user.user_metadata?.nip) {
          resolvedUserNip = user.user_metadata.nip;
        }
      } else if (queryUserId) {
        resolvedUserId = queryUserId;
      }
    } catch {}

    const authProfile = await resolveUserAuth(resolvedUserEmail || undefined, resolvedUserId || undefined, resolvedUserNip || undefined);
    const isSuperAdmin = isSuperAdminGovernanceExempt(resolvedUserEmail, resolvedUserNip);

    if (!authProfile.is_verified_employee && !isSuperAdmin) {
      return NextResponse.json({
        error: 'RESTRICTED_ACCESS',
        message: 'Hasil live polling apresiasi kepegawaian bersifat terbatas (internal) dan hanya dapat ditampilkan kepada Pegawai Resmi DKPP Kota Cilegon yang telah terverifikasi melalui Nomor Induk Pegawai (NIP).',
        is_restricted: true,
        poll: {
          id: targetPoll.id,
          code: targetPoll.code,
          title: targetPoll.title,
          icon: targetPoll.icon,
        }
      }, { status: 403 });
    }

    // 2. Ambil Suara dari Database Supabase (raw votes sebagai Ground Truth)
    const idSet = new Set<string>(
      [
        identifier,
        cleanCode,
        `poll-${cleanCode}`,
        targetPoll.id,
        targetPoll.code,
      ].filter(Boolean)
    );

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let query = supabaseAdmin.from('polls').select('id, code');
      if (isUUID) {
        query = query.or(`id.eq.${identifier},code.eq.${cleanCode}`);
      } else {
        query = query.eq('code', cleanCode);
      }
      const { data: dbPolls } = await query;
      if (dbPolls && dbPolls.length > 0) {
        for (const p of dbPolls) {
          if (p.id) idSet.add(p.id);
          if (p.code) idSet.add(p.code);
        }
      }
    } catch {}

    const candidatePollIds = Array.from(idSet);
    const voteMap = new Map<string, number>();
    let isDbSuccess = false;

    try {
      // Ambil Suara dari tabel raw votes sebagai Ground Truth
      const { data: rawVotes, error: voteErr } = await supabaseAdmin
        .from('votes')
        .select('employee_id')
        .in('poll_id', candidatePollIds);

      if (!voteErr && rawVotes !== null) {
        isDbSuccess = true;
        // Tally langsung dari entri votes aktif di database
        for (const rv of rawVotes) {
          if (rv.employee_id) {
            voteMap.set(rv.employee_id, (voteMap.get(rv.employee_id) || 0) + 1);
          }
        }
      } else {
        // Fallback ke agregat poll_results jika votes gagal dibaca
        const { data: dbResults, error: resErr } = await supabaseAdmin
          .from('poll_results')
          .select('employee_id, total_votes')
          .in('poll_id', candidatePollIds);

        if (!resErr && dbResults !== null) {
          isDbSuccess = true;
          for (const r of dbResults) {
            if (r.employee_id && (r.total_votes || 0) > 0) {
              voteMap.set(r.employee_id, r.total_votes);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase results fetch fallback:', err);
    }

    // Jika DB gagal terkoneksi / offline, gunakan in-memory store
    if (!isDbSuccess) {
      const memoryData = getMemoryResults(candidatePollIds);
      for (const [empId, count] of Object.entries(memoryData.tally)) {
        voteMap.set(empId, count);
      }
    }

    // 4. Susun Hasil Terurut dengan Profil Pegawai Lengkap
    const totalVotes = Array.from(voteMap.values()).reduce((sum, v) => sum + v, 0);
    const candidateEmpIds = Array.from(voteMap.keys());
    const resolvedProfileMap = await resolveEmployeeProfilesBatch(candidateEmpIds);

    const resultsList = Array.from(voteMap.entries()).map(([empId, votes]) => {
      const profile = resolvedProfileMap.get(empId);
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 1000) / 10 : 0;

      return {
        poll_id: targetPoll.id,
        employee_id: empId,
        nip: profile?.nip || null,
        full_name: profile?.nama || empId,
        position: profile?.jabatan || 'Pegawai DKPP Kota Cilegon',
        unit: profile?.bidang || 'DKPP',
        photo_url: profile?.photo_url || null,
        total_votes: votes,
        percentage,
        rank: 1,
      };
    });

    // Urutkan berdasarkan total suara terbanyak
    resultsList.sort((a, b) => b.total_votes - a.total_votes || a.full_name.localeCompare(b.full_name));

    // Beri nomor peringkat
    resultsList.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    // 5. Cek status partisipasi user (dukung Cookie auth & query params session)
    let has_voted = false;
    let has_voted_before = false;
    let choices_count = 0;
    let is_governance_exempt = false;

    try {
      const url = new URL(request.url);
      const queryUserId = url.searchParams.get('userId');
      const queryUserEmail = url.searchParams.get('userEmail');
      const queryUserNip = url.searchParams.get('userNip');

      let resolvedUserId: string | null = null;
      let resolvedUserEmail: string | null = queryUserEmail || null;
      let resolvedUserNip: string | null = queryUserNip || null;

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
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        resolvedUserId = user.id;
        resolvedUserEmail = user.email || resolvedUserEmail;
        if (user.user_metadata?.nip) {
          resolvedUserNip = user.user_metadata.nip;
        }
      } else if (queryUserId) {
        resolvedUserId = queryUserId;
      }

      // Cek apakah user adalah Superadmin yang dikecualikan (Governance Override)
      is_governance_exempt = isSuperAdminGovernanceExempt(resolvedUserEmail, resolvedUserNip);

      if (resolvedUserId) {
        const { data: part } = await supabaseAdmin
          .from('poll_participations')
          .select('poll_id, choices_count')
          .in('poll_id', candidatePollIds)
          .eq('user_id', resolvedUserId)
          .maybeSingle();

        if (part) {
          has_voted_before = true;
          choices_count = part.choices_count || 3;
          // Untuk user biasa, has_voted = true mengunci form
          // Untuk superadmin, has_voted = false agar form tetap dapat dipilih berulang kali
          has_voted = !is_governance_exempt;
        }
      }
    } catch {}

    return NextResponse.json({
      poll: targetPoll,
      results: resultsList,
      total_votes: totalVotes,
      has_voted,
      has_voted_before,
      choices_count,
      is_governance_exempt,
    });
  } catch (err: any) {
    console.error('API Results error:', err);
    return NextResponse.json({ error: 'Gagal memuat hasil polling.' }, { status: 500 });
  }
}
