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

    if (type === 'loans') {
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
        const member = memberMap.get(nip);

        if (!member) {
          errorRows.push({ row: i + 1, nip, reason: `Anggota dengan NIP ${nip} tidak ditemukan di database` });
          continue;
        }

        const jumlahPinjaman = Number(
          row.jumlah_pinjaman || row['Jumlah Pinjaman'] || row.nominal || row.Nominal || 0
        );
        const tenorBulan = Number(
          row.tenor_bulan || row['Tenor (Bulan)'] || row.tenor || row.Tenor || 12
        );
        let jasaRate = Number(
          row.jasa_rate || row['Jasa Bulanan (%)'] || row.jasa || 2
        );
        // If entered as percentage e.g. 2 -> 0.02
        if (jasaRate > 0.5) jasaRate = jasaRate / 100;
        if (jasaRate <= 0) jasaRate = 0.02;

        if (jumlahPinjaman <= 0) {
          errorRows.push({ row: i + 1, nip, reason: 'Jumlah pinjaman harus lebih dari 0' });
          continue;
        }

        if (tenorBulan <= 0 || tenorBulan > 60) {
          errorRows.push({ row: i + 1, nip, reason: 'Tenor harus antara 1 sampai 60 bulan' });
          continue;
        }

        let jenis = String(row.jenis_pinjaman || row['Jenis Pinjaman'] || 'reguler').toLowerCase().trim();
        if (!['reguler', 'tempo'].includes(jenis)) jenis = 'reguler';

        let sumber = String(row.sumber_pembayaran || row['Sumber Pembayaran'] || 'gaji').toLowerCase().trim();
        if (!['gaji', 'tpp', 'gaji_tpp'].includes(sumber)) sumber = 'gaji';

        let status = String(row.status || row['Status Pinjaman'] || 'aktif').toLowerCase().trim();
        if (!['aktif', 'lunas', 'macet', 'diajukan', 'disetujui'].includes(status)) status = 'aktif';

        const tglMulai = row.tanggal_mulai_cicilan || row['Tanggal Mulai Cicilan'] || new Date().toISOString().split('T')[0];
        const keterangan = String(row.keterangan || row.Keterangan || 'Import/Update Pinjaman Excel');

        const totalJasa = Math.round(jumlahPinjaman * jasaRate * tenorBulan);
        const totalKewajiban = jumlahPinjaman + totalJasa;
        const angsuranPerBulan = Math.round(totalKewajiban / tenorBulan);

        validRows.push({
          member_id: member.id,
          member_nama: member.nama,
          nip,
          jumlah_pinjaman: jumlahPinjaman,
          tenor_bulan: tenorBulan,
          jasa_rate: jasaRate,
          jenis_pinjaman: jenis,
          sumber_pembayaran: sumber,
          total_jasa: totalJasa,
          total_kewajiban: totalKewajiban,
          angsuran_per_bulan: angsuranPerBulan,
          status,
          tanggal_mulai_cicilan: tglMulai,
          tanggal_pengajuan: tglMulai,
          tanggal_pencairan: tglMulai,
          catatan_pengurus: keterangan,
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

      // Commit: insert or update loans
      let processed = 0;
      for (const item of validRows) {
        const { member_nama, nip: _, ...loanPayload } = item;

        // Check if member already has an active loan to update
        const { data: existingLoan } = await supabaseAdmin
          .from('cooperative_loans')
          .select('id, nomor_pinjaman')
          .eq('member_id', loanPayload.member_id)
          .eq('status', 'aktif')
          .maybeSingle();

        let loanId: string;

        if (existingLoan) {
          // Update existing active loan
          const { data: updated, error: updErr } = await supabaseAdmin
            .from('cooperative_loans')
            .update({
              jumlah_pinjaman: loanPayload.jumlah_pinjaman,
              tenor_bulan: loanPayload.tenor_bulan,
              jasa_rate: loanPayload.jasa_rate,
              jenis_pinjaman: loanPayload.jenis_pinjaman,
              sumber_pembayaran: loanPayload.sumber_pembayaran,
              total_jasa: loanPayload.total_jasa,
              total_kewajiban: loanPayload.total_kewajiban,
              angsuran_per_bulan: loanPayload.angsuran_per_bulan,
              status: loanPayload.status,
              tanggal_mulai_cicilan: loanPayload.tanggal_mulai_cicilan,
              catatan_pengurus: loanPayload.catatan_pengurus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLoan.id)
            .select()
            .single();

          if (!updErr && updated) {
            loanId = updated.id;
            processed++;
          } else {
            continue;
          }
        } else {
          // Insert new loan
          const loanNumber = `PINJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const { data: inserted, error: insErr } = await supabaseAdmin
            .from('cooperative_loans')
            .insert({
              ...loanPayload,
              nomor_pinjaman: loanNumber,
            })
            .select()
            .single();

          if (!insErr && inserted) {
            loanId = inserted.id;
            processed++;
          } else {
            continue;
          }
        }

        // Generate or re-generate installment schedule if active
        if (loanPayload.status === 'aktif' && loanId) {
          try {
            await supabaseAdmin.rpc('rpc_generate_installment_schedule', {
              p_loan_id: loanId,
            });
          } catch {
            // Fallback manual installment generation if RPC is missing
            const startDate = new Date(loanPayload.tanggal_mulai_cicilan);
            const principalPerMonth = Math.round(loanPayload.jumlah_pinjaman / loanPayload.tenor_bulan);
            const servicePerMonth = Math.round(loanPayload.total_jasa / loanPayload.tenor_bulan);

            // Delete old unpaid installments if any
            await supabaseAdmin
              .from('cooperative_installments')
              .delete()
              .eq('loan_id', loanId)
              .neq('status', 'dibayar');

            const instList = [];
            for (let m = 1; m <= loanPayload.tenor_bulan; m++) {
              const d = new Date(startDate);
              d.setMonth(d.getMonth() + m);
              instList.push({
                loan_id: loanId,
                member_id: loanPayload.member_id,
                installment_number: m,
                due_date: d.toISOString().split('T')[0],
                principal_amount: principalPerMonth,
                service_fee_amount: servicePerMonth,
                total_amount: loanPayload.angsuran_per_bulan,
                paid_amount: 0,
                status: 'belum_jatuh_tempo',
                payment_source: loanPayload.sumber_pembayaran,
                keterangan: `Cicilan ke-${m} (${loanPayload.tenor_bulan} bln)`,
              });
            }
            await supabaseAdmin.from('cooperative_installments').insert(instList);
          }
        }
      }

      await createCoopAuditLog({
        userId: bendaharaCheck.profile?.id,
        userName: bendaharaCheck.profile?.full_name,
        userRole: bendaharaCheck.role,
        action: 'IMPORT_LOANS',
        resourceType: 'cooperative_loans',
        description: `Import/Update massal data pinjaman: ${processed} berhasil dari total ${rows.length}`,
      });

      return NextResponse.json({
        success: true,
        total: rows.length,
        imported: processed,
        message: `Berhasil mengimpor dan memperbarui ${processed} data pinjaman anggota.`,
      });
    }

    return NextResponse.json({ error: 'Tipe impor tidak didukung' }, { status: 400 });
  } catch (err: any) {
    console.error('Import POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memproses berkas impor' }, { status: 500 });
  }
}
