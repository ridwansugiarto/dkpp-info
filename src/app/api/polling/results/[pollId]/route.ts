import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';
import { getMemoryResults } from '@/lib/polling/store';
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
    let targetPoll = OFFICIAL_POLL_THEMES.find((t) => t.code === cleanCode || t.id === identifier) || OFFICIAL_POLL_THEMES[0];

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

    // 4. Susun Hasil Terurut
    const totalVotes = Array.from(voteMap.values()).reduce((sum, v) => sum + v, 0);

    const resultsList = Array.from(voteMap.entries()).map(([empId, votes]) => {
      // Cari profil pegawai di master data
      const emp = OFFICIAL_DKPP_PEGAWAI.find(
        (p) => p.id === empId || p.nip === empId || p.nama.toLowerCase() === empId.toLowerCase()
      );

      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 1000) / 10 : 0;

      return {
        poll_id: targetPoll.id,
        employee_id: empId,
        full_name: emp?.nama || empId,
        position: emp?.jabatan || 'Pegawai DKPP Kota Cilegon',
        unit: emp?.bidang || 'DKPP',
        photo_url: null,
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

    // 5. Cek status user
    let has_voted = false;
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
        const { data: part } = await supabaseAdmin
          .from('poll_participations')
          .select('poll_id')
          .eq('poll_id', targetPoll.id)
          .eq('user_id', user.id)
          .maybeSingle();

        has_voted = !!part;
      }
    } catch {}

    return NextResponse.json({
      poll: targetPoll,
      results: resultsList,
      total_votes: totalVotes,
      has_voted,
    });
  } catch (err: any) {
    console.error('API Results error:', err);
    return NextResponse.json({ error: 'Gagal memuat hasil polling.' }, { status: 500 });
  }
}
