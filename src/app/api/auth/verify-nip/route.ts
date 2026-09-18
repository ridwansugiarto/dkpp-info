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

    // 1. Coba kueri ke Supabase table dkpp_pegawai_nip (mendukung input digit polos atau berjarak)
    try {
      const { data, error } = await supabase
        .from('dkpp_pegawai_nip')
        .select('*')
        .or(`nip.eq.${cleanNip},nip.eq.${rawNip}`)
        .maybeSingle();

      if (!error && data) {
        if (!data.is_active) {
          return NextResponse.json({
            valid: false,
            error: `Pegawai dengan NIP ${data.nip} (${data.nama}) sudah tidak bertugas di DKPP Kota Cilegon (${data.keterangan || 'sudah pindah atau sudah resign'}).`
          }, { status: 400 });
        }

        return NextResponse.json({
          valid: true,
          nip: data.nip,
          nama: data.nama,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: data.tanggal_lahir,
          tanggal_lahir_str: data.tanggal_lahir_str,
          pangkat: data.pangkat,
          golongan: data.golongan,
          jabatan: data.jabatan,
          bidang: data.bidang,
          status_pegawai: data.status_pegawai,
          kategori_pegawai: data.kategori_pegawai,
          kelas_jabatan: data.kelas_jabatan,
          is_sensitive: data.is_sensitive,
          source: 'DATABASE_SUPABASE'
        });
      }
    } catch {
      // Lanjut ke fallback data resmi jika tabel Supabase belum siap
    }

    // 2. Cek ke basis data resmi Pegawai DKPP 2026
    const found = OFFICIAL_DKPP_PEGAWAI.find((p) => p.nip === cleanNip);
    if (found) {
      if (!found.is_active) {
        return NextResponse.json({
          valid: false,
          error: `Pegawai dengan NIP ${found.nip} (${found.nama}) sudah tidak bertugas di DKPP Kota Cilegon (${found.keterangan || 'sudah pindah atau sudah resign'}).`
        }, { status: 400 });
      }

      return NextResponse.json({
        valid: true,
        nip: found.nip,
        nama: found.nama,
        tempat_lahir: found.tempat_lahir,
        tanggal_lahir: found.tanggal_lahir,
        tanggal_lahir_str: found.tanggal_lahir_str,
        pangkat: found.pangkat,
        golongan: found.golongan,
        jabatan: found.jabatan,
        bidang: found.bidang,
        status_pegawai: found.status_pegawai,
        kategori_pegawai: found.kategori_pegawai,
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

