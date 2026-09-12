import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const AUTHORIZED_ADMIN_EMAIL = 'ridwansugiarto.mail@gmail.com';

// In-memory store untuk menjaga data jika migrasi database belum selesai di Supabase
let inMemoryNips = [
  { id: 'nip-1', nip: '197610182002121002', nama: 'Dr. Ir. Ridwan Sugiarto, M.Si', jabatan: 'Kepala Dinas DKPP (Super Admin)', bidang: 'Pimpinan', is_active: true, created_at: new Date().toISOString() },
  { id: 'nip-2', nip: '198003152006041008', nama: 'Ahmad Fauzi, SP, M.M', jabatan: 'Sekretaris Dinas', bidang: 'Sekretariat', is_active: true, created_at: new Date().toISOString() },
  { id: 'nip-3', nip: '198207182008012014', nama: 'Siti Rahmawati, S.Pt, M.Si', jabatan: 'Kepala Bidang Ketahanan Pangan', bidang: 'Ketahanan Pangan', is_active: true, created_at: new Date().toISOString() },
  { id: 'nip-4', nip: '198509212009021005', nama: 'Budi Santoso, S.P', jabatan: 'Kepala Bidang Pertanian', bidang: 'Pertanian', is_active: true, created_at: new Date().toISOString() },
  { id: 'nip-5', nip: '198811042011011002', nama: 'Dedi Kurniawan, S.Pi', jabatan: 'Kepala Bidang Perikanan & Peternakan', bidang: 'Perikanan & Peternakan', is_active: true, created_at: new Date().toISOString() },
  { id: 'nip-6', nip: '199002142015032007', nama: 'Nurul Hidayah, S.Tr.P', jabatan: 'Analis Ketahanan Pangan Ahli Muda', bidang: 'Ketahanan Pangan', is_active: true, created_at: new Date().toISOString() },
  { id: 'nip-7', nip: '199306282019021004', nama: 'Hendro Wicaksono, A.Md', jabatan: 'Pengelola Sistem Informasi GIS', bidang: 'Sekretariat', is_active: true, created_at: new Date().toISOString() },
  { id: 'nip-8', nip: '199504122020122009', nama: 'Dewi Lestari, S.Si', jabatan: 'Petugas Pendata Panel Harga Sagon', bidang: 'Ketahanan Pangan', is_active: true, created_at: new Date().toISOString() },
  { id: 'nip-9', nip: '199608192022031003', nama: 'Fajar Pratama, S.Tr.Kom', jabatan: 'Operator Database & Telemetri Lengas Tanah', bidang: 'Sekretariat', is_active: true, created_at: new Date().toISOString() },
];

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

    const newRecord = {
      id: `nip-${Date.now()}`,
      nip: cleanNip,
      nama: nama.trim(),
      jabatan: (jabatan || 'Pegawai DKPP').trim(),
      bidang: (bidang || 'DKPP Cilegon').trim(),
      is_active: true,
      created_at: new Date().toISOString(),
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
