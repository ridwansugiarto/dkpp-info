import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';
import { getEmployeeGender } from '@/lib/polling/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const pollId = searchParams.get('pollId') || '';
    const pollCode = searchParams.get('pollCode') || '';

    if (!q || q.length < 1) {
      return NextResponse.json({ employees: [] });
    }

    const cleanQ = q.toLowerCase();

    // Tentukan filter gender jika tema polling adalah cantik (P) atau ganteng (L)
    const normalizedPoll = `${pollId} ${pollCode}`.toLowerCase();
    const requiredGender: 'L' | 'P' | null = 
      normalizedPoll.includes('cantik') ? 'P' :
      normalizedPoll.includes('ganteng') ? 'L' :
      null;

    // 1. Coba kueri RPC search_employees di database Supabase
    try {
      const { data, error } = await supabase.rpc('search_employees', {
        q: cleanQ,
        poll_id: pollId || null
      });

      if (!error && data && data.length > 0) {
        let filtered = data;
        if (requiredGender) {
          filtered = filtered.filter((emp: any) => getEmployeeGender(emp.nip, emp.full_name) === requiredGender);
        }
        if (filtered.length > 0) {
          return NextResponse.json({ employees: filtered });
        }
      }
    } catch {
      // Fallback
    }

    // 2. Coba kueri tabel employees langsung
    try {
      const { data: dbEmployees, error: dbErr } = await supabase
        .from('employees')
        .select('id, nip, full_name, position, unit, photo_url, is_active')
        .eq('is_active', true)
        .ilike('full_name', `%${cleanQ}%`)
        .limit(30);

      if (!dbErr && dbEmployees && dbEmployees.length > 0) {
        let filtered = dbEmployees;
        if (requiredGender) {
          filtered = filtered.filter((emp) => getEmployeeGender(emp.nip, emp.full_name) === requiredGender);
        }

        if (filtered.length > 0) {
          const tiered = filtered.map((emp) => {
            const fn = emp.full_name.toLowerCase();
            let match_tier = 4;
            if (fn.startsWith(cleanQ)) match_tier = 1;
            else if (new RegExp(`(^|\\s)${cleanQ}`).test(fn)) match_tier = 2;
            else if (fn.includes(cleanQ)) match_tier = 3;
            return { ...emp, match_tier };
          }).sort((a, b) => a.match_tier - b.match_tier || a.full_name.localeCompare(b.full_name));

          return NextResponse.json({ employees: tiered.slice(0, 20) });
        }
      }
    } catch {
      // Fallback ke OFFICIAL_DKPP_PEGAWAI
    }

    // 3. Fallback Dataset Resmi Pegawai DKPP 2026
    const activePegawai = OFFICIAL_DKPP_PEGAWAI.filter(p => p.is_active);
    let candidatePool = activePegawai;

    // Filter khusus jenis kelamin:
    if (requiredGender) {
      candidatePool = candidatePool.filter(p => getEmployeeGender(p.nip, p.nama) === requiredGender);
    }

    const matched = candidatePool
      .filter(p => p.nama.toLowerCase().includes(cleanQ) || (p.jabatan && p.jabatan.toLowerCase().includes(cleanQ)))
      .map(p => {
        const fn = p.nama.toLowerCase();
        let match_tier = 4;
        if (fn.startsWith(cleanQ)) match_tier = 1;
        else if (new RegExp(`(^|\\s)${cleanQ}`).test(fn)) match_tier = 2;
        else if (fn.includes(cleanQ)) match_tier = 3;

        return {
          id: p.id,
          nip: p.nip,
          full_name: p.nama,
          position: p.jabatan,
          unit: p.bidang,
          photo_url: null,
          is_active: true,
          gender: getEmployeeGender(p.nip, p.nama),
          match_tier
        };
      })
      .sort((a, b) => a.match_tier - b.match_tier || a.full_name.localeCompare(b.full_name))
      .slice(0, 20);

    return NextResponse.json({ employees: matched });
  } catch (err: any) {
    console.error('Search employees error:', err);
    return NextResponse.json({ error: 'Gagal melakukan pencarian pegawai.' }, { status: 500 });
  }
}
