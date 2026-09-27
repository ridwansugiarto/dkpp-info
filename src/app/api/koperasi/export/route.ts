import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkCoopOfficerAuth } from '@/lib/koperasi/serverHelpers';
import * as XLSX from 'xlsx';

// GET /api/koperasi/export
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const userId = searchParams.get('userId') || '';
    const userNip = searchParams.get('userNip') || '';
    const type = searchParams.get('type') || 'savings'; // 'savings' | 'loans' | 'transactions' | 'members'

    const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
    if (!officerCheck.authorized) {
      return NextResponse.json({ error: officerCheck.error }, { status: officerCheck.status });
    }

    const wb = XLSX.utils.book_new();

    if (type === 'savings') {
      const { data: savings } = await supabaseAdmin
        .from('cooperative_savings')
        .select('*, member:cooperative_members(nip, nama, jabatan, bidang)')
        .order('tanggal', { ascending: false });

      const rows = (savings || []).map((s) => ({
        Tanggal: s.tanggal,
        NIP: s.member?.nip || '',
        Nama: s.member?.nama || '',
        Bidang: s.member?.bidang || '',
        'Jenis Simpanan': s.jenis_simpanan.toUpperCase(),
        Nominal: Number(s.nominal),
        Bulan: s.periode_bulan,
        Tahun: s.periode_tahun,
        Keterangan: s.keterangan || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Simpanan');
    } else if (type === 'loans') {
      const { data: loans } = await supabaseAdmin
        .from('cooperative_loans')
        .select('*, member:cooperative_members(nip, nama, jabatan, bidang)')
        .order('created_at', { ascending: false });

      const rows = (loans || []).map((l) => ({
        'No Pinjaman': l.nomor_pinjaman,
        NIP: l.member?.nip || '',
        Nama: l.member?.nama || '',
        'Jumlah Pinjaman': Number(l.jumlah_pinjaman),
        'Tenor (Bulan)': l.tenor_bulan,
        'Jasa Rate': `${(Number(l.jasa_rate) * 100).toFixed(1)}%`,
        'Total Kewajiban': Number(l.total_kewajiban),
        'Angsuran/Bulan': Number(l.angsuran_per_bulan),
        'Sumber Pembayaran': l.sumber_pembayaran,
        Status: l.status.toUpperCase(),
        'Tgl Pengajuan': l.tanggal_pengajuan,
        'Tgl Pencairan': l.tanggal_pencairan || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Pinjaman');
    } else if (type === 'transactions') {
      const { data: txs } = await supabaseAdmin
        .from('cooperative_transactions')
        .select('*')
        .order('tanggal', { ascending: false });

      const rows = (txs || []).map((t) => ({
        Tanggal: t.tanggal,
        Jenis: t.jenis.toUpperCase(),
        Kategori: t.kategori,
        Nominal: Number(t.nominal),
        Sumber: t.sumber || '',
        Keterangan: t.keterangan || '',
        Bulan: t.periode_bulan,
        Tahun: t.periode_tahun,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Buku Kas');
    } else {
      // members
      const { data: members } = await supabaseAdmin
        .from('cooperative_members')
        .select('*')
        .order('nama', { ascending: true });

      const rows = (members || []).map((m) => ({
        NIP: m.nip,
        Nama: m.nama,
        Jabatan: m.jabatan || '',
        Bidang: m.bidang || '',
        Golongan: m.golongan || '',
        Status: m.status_pegawai,
        Gaji: Number(m.gaji),
        TPP: Number(m.tpp),
        'Total Pendapatan': Number(m.total_pendapatan),
        'Status Keanggotaan': m.status_keanggotaan,
        'Tgl Bergabung': m.tanggal_bergabung,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Daftar Anggota');
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="koperasi_${type}_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 });
  }
}
