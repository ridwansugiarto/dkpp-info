import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// GET /api/koperasi/template?type=loans | members | savings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'loans';

    const wb = XLSX.utils.book_new();

    if (type === 'loans') {
      const headers = [
        'NIP',
        'Nama Pegawai',
        'Jumlah Pinjaman',
        'Tenor (Bulan)',
        'Jasa Bulanan (%)',
        'Jenis Pinjaman',
        'Sumber Pembayaran',
        'Status Pinjaman',
        'Tanggal Mulai Cicilan',
        'Keterangan',
      ];

      const sampleRows = [
        {
          'NIP': '197610182002121002',
          'Nama Pegawai': 'Ridwan Sugiarto, S.Pi',
          'Jumlah Pinjaman': 15000000,
          'Tenor (Bulan)': 12,
          'Jasa Bulanan (%)': 2,
          'Jenis Pinjaman': 'reguler',
          'Sumber Pembayaran': 'gaji',
          'Status Pinjaman': 'aktif',
          'Tanggal Mulai Cicilan': '2026-04-01',
          'Keterangan': 'Pinjaman pendidikan anak',
        },
        {
          'NIP': '197707022002121004',
          'Nama Pegawai': 'Moch. Dwinanda Y, S.Pt',
          'Jumlah Pinjaman': 20000000,
          'Tenor (Bulan)': 24,
          'Jasa Bulanan (%)': 2,
          'Jenis Pinjaman': 'reguler',
          'Sumber Pembayaran': 'gaji_tpp',
          'Status Pinjaman': 'aktif',
          'Tanggal Mulai Cicilan': '2026-04-01',
          'Keterangan': 'Renovasi rumah',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
      ws['!cols'] = [
        { wch: 22 }, // NIP
        { wch: 28 }, // Nama
        { wch: 18 }, // Jumlah Pinjaman
        { wch: 14 }, // Tenor
        { wch: 18 }, // Jasa Bulanan
        { wch: 16 }, // Jenis Pinjaman
        { wch: 20 }, // Sumber Pembayaran
        { wch: 16 }, // Status
        { wch: 22 }, // Tgl Mulai Cicilan
        { wch: 30 }, // Keterangan
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Data Pinjaman');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        headers: {
          'Content-Disposition': 'attachment; filename="Template_Pinjaman_Koperasi_DKPP.xlsx"',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    }

    if (type === 'members') {
      const headers = [
        'NIP',
        'Nama Pegawai',
        'Jabatan',
        'Bidang',
        'Golongan',
        'Status Pegawai',
        'Gaji Pokok',
        'TPP',
      ];

      const sampleRows = [
        {
          'NIP': '197610182002121002',
          'Nama Pegawai': 'Ridwan Sugiarto, S.Pi',
          'Jabatan': 'Analis Ketahanan Pangan Ahli Muda',
          'Bidang': 'Ketahanan Pangan',
          'Golongan': 'III/d',
          'Status Pegawai': 'PNS',
          'Gaji Pokok': 4500000,
          'TPP': 4000000,
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
      ws['!cols'] = [
        { wch: 22 },
        { wch: 28 },
        { wch: 32 },
        { wch: 20 },
        { wch: 12 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Data Anggota');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        headers: {
          'Content-Disposition': 'attachment; filename="Template_Anggota_Koperasi_DKPP.xlsx"',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    }

    if (type === 'savings') {
      const headers = [
        'NIP',
        'Nama Pegawai',
        'Jenis Simpanan',
        'Nominal',
        'Tanggal',
        'Bulan',
        'Tahun',
        'Keterangan',
      ];

      const sampleRows = [
        {
          'NIP': '197610182002121002',
          'Nama Pegawai': 'Ridwan Sugiarto, S.Pi',
          'Jenis Simpanan': 'wajib',
          'Nominal': 100000,
          'Tanggal': '2026-04-01',
          'Bulan': 4,
          'Tahun': 2026,
          'Keterangan': 'Potong Gaji Simpanan Wajib April 2026',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
      ws['!cols'] = [
        { wch: 22 },
        { wch: 28 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 },
        { wch: 10 },
        { wch: 10 },
        { wch: 35 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Setoran Simpanan');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        headers: {
          'Content-Disposition': 'attachment; filename="Template_Simpanan_Koperasi_DKPP.xlsx"',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    }

    return NextResponse.json({ error: 'Tipe template tidak valid' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat berkas template' }, { status: 500 });
  }
}
