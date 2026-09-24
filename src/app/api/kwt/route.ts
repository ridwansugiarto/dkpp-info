import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

function loadLocalKwt(): any[] {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'tabel kwt', 'kwt_geocoded.json');
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to load local kwt_geocoded.json:', err);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const kecamatan = searchParams.get('kecamatan')?.trim() || '';
  const kelurahan = searchParams.get('kelurahan')?.trim() || '';
  const withCoords = searchParams.get('with_coords') === '1';
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);

  try {
    // 1. Coba ambil dari Supabase
    let query = supabase
      .from('kwt')
      .select('*')
      .eq('is_active', true)
      .order('no_urut', { ascending: true })
      .limit(limit);

    if (q) {
      query = query.or(
        `nama_kwt.ilike.%${q}%,kelurahan.ilike.%${q}%,kecamatan.ilike.%${q}%,alamat_sekretariat.ilike.%${q}%`
      );
    }
    if (kecamatan) {
      query = query.ilike('kecamatan', `%${kecamatan}%`);
    }
    if (kelurahan) {
      query = query.ilike('kelurahan', `%${kelurahan}%`);
    }
    if (withCoords) {
      query = query.not('latitude', 'is', null);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return NextResponse.json({
        total: data.length,
        source: 'supabase',
        kwt: data,
      });
    }
  } catch (err) {
    console.warn('Supabase query failed, falling back to local JSON:', err);
  }

  // 2. Fallback ke local kwt_geocoded.json jika Supabase belum dimigrasi
  let list = loadLocalKwt();

  if (q) {
    const qLower = q.toLowerCase();
    list = list.filter(
      (k) =>
        k.nama_kwt?.toLowerCase().includes(qLower) ||
        k.kelurahan?.toLowerCase().includes(qLower) ||
        k.kecamatan?.toLowerCase().includes(qLower) ||
        k.alamat_sekretariat?.toLowerCase().includes(qLower)
    );
  }

  if (kecamatan) {
    const kecLower = kecamatan.toLowerCase();
    list = list.filter((k) => k.kecamatan?.toLowerCase().includes(kecLower));
  }

  if (kelurahan) {
    const kelLower = kelurahan.toLowerCase();
    list = list.filter((k) => k.kelurahan?.toLowerCase().includes(kelLower));
  }

  if (withCoords) {
    list = list.filter((k) => k.latitude !== null && k.latitude !== undefined);
  }

  const result = list.slice(0, limit);

  return NextResponse.json({
    total: result.length,
    source: 'local_geocoded',
    kwt: result,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      no_urut,
      nama_ketua,
      no_wa_ketua,
      no_hp_ketua,
      latitude,
      longitude,
      maps_link,
      is_active,
      alamat_sekretariat,
      keterangan,
      bantuan,
      jenis_usaha,
    } = body;

    if (!id && no_urut === undefined) {
      return NextResponse.json({ error: 'id or no_urut required' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (nama_ketua !== undefined) updatePayload.nama_ketua = nama_ketua;
    if (no_wa_ketua !== undefined) updatePayload.no_wa_ketua = no_wa_ketua;
    if (no_hp_ketua !== undefined) updatePayload.no_hp_ketua = no_hp_ketua;
    if (latitude !== undefined) updatePayload.latitude = latitude;
    if (longitude !== undefined) updatePayload.longitude = longitude;
    if (maps_link !== undefined) updatePayload.maps_link = maps_link;
    if (is_active !== undefined) updatePayload.is_active = is_active;
    if (alamat_sekretariat !== undefined) updatePayload.alamat_sekretariat = alamat_sekretariat;
    if (keterangan !== undefined) updatePayload.keterangan = keterangan;
    if (bantuan !== undefined) updatePayload.bantuan = bantuan;
    if (jenis_usaha !== undefined) updatePayload.jenis_usaha = jenis_usaha;

    // Coba update Supabase jika id tersedia
    if (id) {
      const { data, error } = await supabase
        .from('kwt')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ ok: true, source: 'supabase', kwt: data });
      }
    }

    // Update juga ke local json file agar persist
    try {
      const jsonPath = path.join(process.cwd(), 'public', 'tabel kwt', 'kwt_geocoded.json');
      if (fs.existsSync(jsonPath)) {
        const content = fs.readFileSync(jsonPath, 'utf-8');
        const list: any[] = JSON.parse(content);
        const idx = list.findIndex(
          (k) => (id && k.id === id) || (no_urut !== undefined && k.no_urut === no_urut)
        );
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updatePayload };
          fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), 'utf-8');
          return NextResponse.json({ ok: true, source: 'local_updated', kwt: list[idx] });
        }
      }
    } catch (fsErr) {
      console.error('Failed to update local json:', fsErr);
    }

    return NextResponse.json({ ok: true, message: 'Updated' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
