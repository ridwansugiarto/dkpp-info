import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Baseline fallback list jika database belum di-migrasi
const BASELINE_NIP_LIST = [
  { nip: '197610182002121002', nama: 'Dr. Ir. Ridwan Sugiarto, M.Si', jabatan: 'Kepala Dinas DKPP (Super Admin)', bidang: 'Pimpinan' },
  { nip: '198003152006041008', nama: 'Ahmad Fauzi, SP, M.M', jabatan: 'Sekretaris Dinas', bidang: 'Sekretariat' },
  { nip: '198207182008012014', nama: 'Siti Rahmawati, S.Pt, M.Si', jabatan: 'Kepala Bidang Ketahanan Pangan', bidang: 'Ketahanan Pangan' },
  { nip: '198509212009021005', nama: 'Budi Santoso, S.P', jabatan: 'Kepala Bidang Pertanian', bidang: 'Pertanian' },
  { nip: '198811042011011002', nama: 'Dedi Kurniawan, S.Pi', jabatan: 'Kepala Bidang Perikanan & Peternakan', bidang: 'Perikanan & Peternakan' },
  { nip: '199002142015032007', nama: 'Nurul Hidayah, S.Tr.P', jabatan: 'Analis Ketahanan Pangan Ahli Muda', bidang: 'Ketahanan Pangan' },
  { nip: '199306282019021004', nama: 'Hendro Wicaksono, A.Md', jabatan: 'Pengelola Sistem Informasi GIS', bidang: 'Sekretariat' },
  { nip: '199504122020122009', nama: 'Dewi Lestari, S.Si', jabatan: 'Petugas Pendata Panel Harga Sagon', bidang: 'Ketahanan Pangan' },
  { nip: '199608192022031003', nama: 'Fajar Pratama, S.Tr.Kom', jabatan: 'Operator Database & Telemetri Lengas Tanah', bidang: 'Sekretariat' },
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const nip = (body.nip || '').trim().replace(/\s+/g, '');

    if (!nip) {
      return NextResponse.json({ valid: false, error: 'NIP tidak boleh kosong.' }, { status: 400 });
    }

    // 1. Coba query ke Supabase table dkpp_pegawai_nip
    try {
      const { data, error } = await supabase
        .from('dkpp_pegawai_nip')
        .select('nip, nama, jabatan, bidang, is_active')
        .eq('nip', nip)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({
          valid: true,
          nip: data.nip,
          nama: data.nama,
          jabatan: data.jabatan,
          bidang: data.bidang,
          source: 'DATABASE_SUPABASE'
        });
      }
    } catch {
      // Fallback ke baseline jika table belum ada
    }

    // 2. Cek ke baseline list
    const found = BASELINE_NIP_LIST.find((p) => p.nip === nip);
    if (found) {
      return NextResponse.json({
        valid: true,
        nip: found.nip,
        nama: found.nama,
        jabatan: found.jabatan,
        bidang: found.bidang,
        source: 'BASELINE_PLACEHOLDER'
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
