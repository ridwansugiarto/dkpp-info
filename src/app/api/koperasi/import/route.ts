import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { checkCoopBendaharaAuth, createCoopAuditLog } from '@/lib/koperasi/serverHelpers';
import * as XLSX from 'xlsx';

// POST /api/koperasi/import
// Import data from Excel/CSV (members, savings, installments)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userId,
      userNip,
      type, // 'members' | 'savings' | 'installments'
      fileBase64, // base64 string of Excel/CSV file
      mode = 'preview', // 'preview' | 'commit'
      rows: rawRows, // or directly pass parsed rows
    } = body;

    const bendaharaCheck = await checkCoopBendaharaAuth(userEmail, userId, userNip);
    if (!bendaharaCheck.authorized) {
      return NextResponse.json({ error: bendaharaCheck.error }, { status: bendaharaCheck.status });
    }

    let rows: any[] = rawRows || [];

    if (fileBase64 && (!rows || rows.length === 0)) {
      // Decode base64 and parse via XLSX
      const buffer = Buffer.from(fileBase64.replace(/^data:.*?;base64,/, ''), 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris data yang ditemukan untuk diimpor' }, { status: 400 });
    }

    // Process based on type
    if (type === 'members') {
      const validRows: any[] = [];
      const errorRows: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nip = String(row.nip || row.NIP || '').trim().replace(/\s+/g, '');
        const nama = String(row.nama || row.Nama || row.NAMA || '').trim();

        if (!nip || !nama) {
          errorRows.push({ row: i + 1, data: row, reason: 'NIP dan Nama tidak boleh kosong' });
          continue;
        }

        const gaji = Number(row.gaji || row.Gaji || 0);
        const tpp = Number(row.tpp || row.TPP || 0);
        const jabatan = String(row.jabatan || row.Jabatan || '').trim();
        const bidang = String(row.bidang || row.Bidang || '').trim();
        const golongan = String(row.golongan || row.Golongan || '').trim();
        const statusPegawai = ['PNS', 'PPPK', 'Honorer'].includes(row.status_pegawai || row.Status)
          ? (row.status_pegawai || row.Status)
          : 'PNS';

        validRows.push({
          nip,
          nama,
          jabatan,
          bidang,
          golongan,
          status_pegawai: statusPegawai,
          gaji,
          tpp,
          status_keanggotaan: 'aktif',
        });
      }

      if (mode === 'preview') {
        return NextResponse.json({
          mode: 'preview',
          type,
          total: rows.length,
          valid_count: validRows.length,
          error_count: errorRows.length,
          preview_rows: validRows.slice(0, 10),
          error_rows: errorRows.slice(0, 10),
        });
      }

      // Commit
      let inserted = 0;
      let updated = 0;
      for (const m of validRows) {
        // total_pendapatan is generated column so not included
        const { error } = await supabaseAdmin
          .from('cooperative_members')
          .upsert(m, { onConflict: 'nip' });

        if (!error) inserted++;
      }

      await createCoopAuditLog({
        userId: bendaharaCheck.profile?.id,
        userName: bendaharaCheck.profile?.full_name,
        userRole: bendaharaCheck.role,
        action: 'IMPORT_MEMBERS',
        resourceType: 'cooperative_members',
        description: `Import massal data anggota: ${inserted} berhasil dari total ${rows.length}`,
      });

      return NextResponse.json({
        success: true,
        total: rows.length,
        imported: inserted,
        message: `Berhasil mengimpor ${inserted} anggota koperasi.`,
      });
    }

    if (type === 'savings') {
      const validRows: any[] = [];
      const errorRows: any[] = [];

      // Pre-fetch all members map by nip
      const { data: allMembers } = await supabaseAdmin
        .from('cooperative_members')
        .select('id, nip, nama');
      const memberMap = new Map((allMembers || []).map((m) => [m.nip, m]));

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nip = String(row.nip || row.NIP || '').trim().replace(/\s+/g, '');
        const nominal = Number(row.nominal || row.Nominal || row.jumlah || row.Jumlah || 0);
        let jenis = String(row.jenis || row.jenis_simpanan || row.Jenis || 'wajib').toLowerCase().trim();
        if (!['wajib', 'sukarela', 'pokok'].includes(jenis)) jenis = 'wajib';

        const member = memberMap.get(nip);
        if (!member) {
          errorRows.push({ row: i + 1, nip, reason: `Anggota dengan NIP ${nip} tidak ditemukan di database` });
          continue;
        }

        if (nominal <= 0) {
          errorRows.push({ row: i + 1, nip, reason: 'Nominal harus lebih dari 0' });
          continue;
        }

        const tanggal = row.tanggal || row.Tanggal || new Date().toISOString().split('T')[0];
        const d = new Date(tanggal);

        validRows.push({
          member_id: member.id,
          member_nama: member.nama,
          nip,
          jenis_simpanan: jenis,
          nominal,
          tanggal,
          periode_bulan: Number(row.bulan || row.periode_bulan) || d.getMonth() + 1,
          periode_tahun: Number(row.tahun || row.periode_tahun) || d.getFullYear(),
          keterangan: String(row.keterangan || row.Keterangan || `Import Simpanan ${jenis}`),
        });
      }

      if (mode === 'preview') {
        return NextResponse.json({
          mode: 'preview',
          type,
          total: rows.length,
          valid_count: validRows.length,
          error_count: errorRows.length,
          preview_rows: validRows.slice(0, 10),
          error_rows: errorRows.slice(0, 10),
        });
      }

      // Commit
      let inserted = 0;
      for (const s of validRows) {
        const { member_nama, nip: _, ...savePayload } = s;
        const { data: saved, error } = await supabaseAdmin
          .from('cooperative_savings')
          .insert({
            ...savePayload,
            created_by: bendaharaCheck.profile?.id || null,
          })
          .select()
          .single();

        if (!error && saved) {
          inserted++;
          // Also record into cooperative_transactions
          await supabaseAdmin.from('cooperative_transactions').insert({
            tanggal: savePayload.tanggal,
            jenis: 'pemasukan',
            kategori: `Simpanan ${savePayload.jenis_simpanan.toUpperCase()}`,
            nominal: savePayload.nominal,
            sumber: 'Import Kas/Setoran',
            keterangan: `Import: ${savePayload.keterangan} - ${member_nama}`,
            reference_type: 'cooperative_savings',
            reference_id: saved.id,
            periode_bulan: savePayload.periode_bulan,
            periode_tahun: savePayload.periode_tahun,
            created_by: bendaharaCheck.profile?.id || null,
          });
        }
      }

      await createCoopAuditLog({
        userId: bendaharaCheck.profile?.id,
        userName: bendaharaCheck.profile?.full_name,
        userRole: bendaharaCheck.role,
        action: 'IMPORT_SAVINGS',
        resourceType: 'cooperative_savings',
        description: `Import massal simpanan: ${inserted} berhasil dari total ${rows.length}`,
      });

      return NextResponse.json({
        success: true,
        total: rows.length,
        imported: inserted,
        message: `Berhasil mengimpor ${inserted} transaksi simpanan.`,
      });
    }

    return NextResponse.json({ error: 'Tipe impor tidak didukung' }, { status: 400 });
  } catch (err: any) {
    console.error('Import POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memproses berkas impor' }, { status: 500 });
  }
}
