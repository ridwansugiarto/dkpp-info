import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawNip = (body.nip || '').trim();
    const cleanNip = rawNip.replace(/\s+/g, '');

    if (!cleanNip) {
      return NextResponse.json({ valid: false, error: 'NIP tidak boleh kosong.' }, { status: 400 });
    }

    // 1. Coba kueri ke Supabase table dkpp_pegawai_nip (mendukung input 18 digit atau format berjarak)
    try {
      const { data, error } = await supabase
        .from('dkpp_pegawai_nip')
        .select('nip, nama, jabatan, bidang, status_pegawai, kelas_jabatan, is_sensitive, is_active')
        .or(`nip.eq.${cleanNip},nip.eq.${rawNip}`)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({
          valid: true,
          nip: data.nip,
          nama: data.nama,
          jabatan: data.jabatan,
          bidang: data.bidang,
          status_pegawai: data.status_pegawai,
          kelas_jabatan: data.kelas_jabatan,
          is_sensitive: data.is_sensitive,
          source: 'DATABASE_SUPABASE'
        });
      }
    } catch {
      // Lanjut ke fallback data resmi jika tabel Supabase belum siap
    }

    // 2. Cek ke basis data resmi 53 Pegawai DKPP
    const found = OFFICIAL_DKPP_PEGAWAI.find((p) => p.nip === cleanNip && p.is_active);
    if (found) {
      return NextResponse.json({
        valid: true,
        nip: found.nip,
        nama: found.nama,
        jabatan: found.jabatan,
        bidang: found.bidang,
        status_pegawai: found.status_pegawai,
        kelas_jabatan: found.kelas_jabatan,
        is_sensitive: found.is_sensitive,
        source: 'OFFICIAL_DATASET'
      });
    }

    return NextResponse.json({
      valid: false,
      error: 'NIP tidak terdaftar dalam basis data Pegawai Resmi DKPP Kota Cilegon.'
    }, { status: 404 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ valid: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
