import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';

const AUTHORIZED_ADMIN_EMAIL = 'ridwansugiarto.mail@gmail.com';

// Data resmi 53 Pegawai ASN DKPP Kota Cilegon
let inMemoryNips = [...OFFICIAL_DKPP_PEGAWAI];

function checkAdminAuth(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}

// GET: Ambil daftar seluruh NIP
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get('userEmail');

  if (!checkAdminAuth(userEmail)) {
    return NextResponse.json(
      { error: 'Akses ditolak. Panel Tata Kelola NIP hanya dapat diakses oleh Administrator Resmi (ridwansugiarto.mail@gmail.com).' },
      { status: 403 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('dkpp_pegawai_nip')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return NextResponse.json({ nips: data, source: 'DATABASE' });
    }
  } catch {
    // Gunakan in-memory jika table belum siap
  }

  return NextResponse.json({ nips: inMemoryNips, source: 'IN_MEMORY' });
}

// POST: Tambah NIP Baru oleh Admin
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userEmail, nip, nama, jabatan, bidang } = body;

    if (!checkAdminAuth(userEmail)) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Administrator Resmi (ridwansugiarto.mail@gmail.com) yang berwenang menambahkan NIP.' },
        { status: 403 }
      );
    }

    const cleanNip = (nip || '').trim().replace(/\s+/g, '');
    if (!cleanNip || cleanNip.length < 9) {
      return NextResponse.json({ error: 'NIP wajib diisi dengan format yang valid (minimal 9 digit).' }, { status: 400 });
    }
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: 'Nama Pegawai wajib diisi.' }, { status: 400 });
    }

    const newRecord: import('@/data/pegawai_dkpp').PegawaiInternalItem = {
      id: `nip-${Date.now()}`,
      nip: cleanNip,
      nama: nama.trim(),
      npwp: null,
      kelas_jabatan: null,
      jabatan: (jabatan || 'Pegawai DKPP').trim(),
      status_pegawai: 'Fungsional',
      kategori_pegawai: 'PNS',
      bidang: (bidang || 'DKPP Cilegon').trim(),
      is_sensitive: true,
      is_active: true,
    };

    // Coba simpan ke Supabase
    try {
      const { data, error } = await supabase
        .from('dkpp_pegawai_nip')
        .insert([{
          nip: newRecord.nip,
          nama: newRecord.nama,
          jabatan: newRecord.jabatan,
          bidang: newRecord.bidang,
          status_pegawai: newRecord.status_pegawai,
          is_sensitive: true,
          is_active: true
        }])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, item: data });
      }
    } catch {
      // In-memory fallback
    }

    // In-memory duplicate check
    if (inMemoryNips.some((n) => n.nip === cleanNip)) {
      return NextResponse.json({ error: `NIP ${cleanNip} sudah terdaftar sebelumnya.` }, { status: 400 });
    }

    inMemoryNips.unshift(newRecord);
    return NextResponse.json({ success: true, item: newRecord, note: 'Tersimpan di sistem' });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Hapus NIP oleh Admin
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get('userEmail');
  const nip = searchParams.get('nip');

  if (!checkAdminAuth(userEmail)) {
    return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
  }

  if (!nip) {
    return NextResponse.json({ error: 'Parameter NIP dibutuhkan.' }, { status: 400 });
  }

  try {
    await supabase.from('dkpp_pegawai_nip').delete().eq('nip', nip);
  } catch {}

  inMemoryNips = inMemoryNips.filter((n) => n.nip !== nip);
  return NextResponse.json({ success: true, deletedNip: nip });
}

// PATCH: Toggle Status Aktif NIP oleh Admin
export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userEmail, nip, is_active } = body;

    if (!checkAdminAuth(userEmail)) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
      await supabase.from('dkpp_pegawai_nip').update({ is_active }).eq('nip', nip);
    } catch {}

    const target = inMemoryNips.find((n) => n.nip === nip);
    if (target) {
      target.is_active = is_active;
    }

    return NextResponse.json({ success: true, nip, is_active });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
