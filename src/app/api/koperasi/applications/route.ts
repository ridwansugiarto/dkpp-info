import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkCoopOfficerAuth, createCoopAuditLog, createCoopNotification } from '@/lib/koperasi/serverHelpers';
import { formatRupiah } from '@/lib/koperasi/calculations';

// GET /api/koperasi/applications
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const userId = searchParams.get('userId') || '';
    const userNip = searchParams.get('userNip') || '';
    const status = searchParams.get('status') || '';
    const all = searchParams.get('all') === 'true';

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);
    if (authProfile.role === 'GUEST') {
      return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
    }

    const nip = authProfile.nip || userNip;

    if (all) {
      // Check officer authorization
      const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
      if (!officerCheck.authorized) {
        return NextResponse.json({ error: officerCheck.error }, { status: officerCheck.status });
      }

      let query = supabaseAdmin
        .from('cooperative_loan_applications')
        .select(`
          *,
          member:cooperative_members(id, nip, nama, jabatan, bidang, golongan, gaji, tpp, total_pendapatan)
        `)
        .order('submitted_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ applications: data || [] });
    }

    // Member only views own applications
    const { data: member } = await supabaseAdmin
      .from('cooperative_members')
      .select('id')
      .eq('nip', nip)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ applications: [] });
    }

    let query = supabaseAdmin
      .from('cooperative_loan_applications')
      .select('*')
      .eq('member_id', member.id)
      .order('submitted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ applications: data || [] });
  } catch (err: any) {
    console.error('Applications GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/koperasi/applications
// Submit loan application with server-side validation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userId,
      userNip,
      jumlah_diajukan,
      tenor_bulan,
      jenis_pinjaman = 'reguler',
      sumber_pembayaran = 'gaji',
      catatan_pengajuan = '',
    } = body;

    if (!jumlah_diajukan || !tenor_bulan) {
      return NextResponse.json({ error: 'Jumlah pinjaman dan tenor wajib diisi' }, { status: 400 });
    }

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);
    if (authProfile.role === 'GUEST' || !authProfile.is_verified_employee) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const nip = authProfile.nip || userNip;
    let { data: member, error: memberErr } = await supabaseAdmin
      .from('cooperative_members')
      .select('*')
      .eq('nip', nip)
      .maybeSingle();

    if (!member && nip) {
      const { data: pegawai } = await supabaseAdmin
        .from('dkpp_pegawai_nip')
        .select('*')
        .eq('nip', nip)
        .eq('is_active', true)
        .maybeSingle();

      if (pegawai) {
        const isPppk = pegawai.status_pegawai?.toLowerCase().includes('pppk');
        const isHonorer =
          pegawai.status_pegawai?.toLowerCase().includes('honorer') ||
          pegawai.status_pegawai?.toLowerCase().includes('thl');
        const statusPegawai = isPppk ? 'PPPK' : isHonorer ? 'Honorer' : 'PNS';

        const { data: autoMember } = await supabaseAdmin
          .from('cooperative_members')
          .insert({
            user_id: authProfile.id?.startsWith('guest_') ? null : authProfile.id,
            nip: pegawai.nip.trim(),
            nama: pegawai.nama.trim(),
            jabatan: pegawai.jabatan || 'Pegawai DKPP',
            bidang: pegawai.bidang || 'DKPP Kota Cilegon',
            golongan: pegawai.golongan || 'III/a',
            status_pegawai: statusPegawai,
            gaji: 4000000,
            tpp: 3500000,
            status_keanggotaan: 'aktif',
          })
          .select('*')
          .single();

        if (autoMember) {
          member = autoMember;
          memberErr = null;
        }
      }
    }

    if (memberErr || !member) {
      return NextResponse.json({ error: 'Data anggota tidak ditemukan' }, { status: 404 });
    }

    if (member.status_keanggotaan !== 'aktif') {
      return NextResponse.json({ error: 'Status keanggotaan tidak aktif' }, { status: 400 });
    }

    // Ambil default service rate dari settings
    const { data: settingRate } = await supabaseAdmin
      .from('cooperative_settings')
      .select('value')
      .eq('key', 'default_service_rate')
      .maybeSingle();
    const jasaRate = settingRate ? parseFloat(settingRate.value) : 0.02;

    // Server-side check loan eligibility via RPC (cannot be bypassed from client)
    const { data: eligibility, error: rpcErr } = await supabaseAdmin.rpc('rpc_check_loan_eligibility', {
      p_member_id: member.id,
      p_jumlah_pinjaman: jumlah_diajukan,
      p_tenor_bulan: tenor_bulan,
      p_jasa_rate: jasaRate,
      p_sumber_pembayaran: sumber_pembayaran,
    });

    if (rpcErr) throw rpcErr;

    if (!eligibility || !eligibility.eligible) {
      return NextResponse.json({
        error: eligibility?.reason || 'Pengajuan pinjaman tidak memenuhi kriteria kemampuan pembayaran.',
        eligibility,
      }, { status: 422 });
    }

    // Insert loan application
    const { data: newApp, error: insertErr } = await supabaseAdmin
      .from('cooperative_loan_applications')
      .insert({
        member_id: member.id,
        jumlah_diajukan,
        tenor_bulan,
        jenis_pinjaman,
        sumber_pembayaran,
        estimasi_cicilan: eligibility.angsuran_bulanan,
        pendapatan_dasar: eligibility.pendapatan_dasar,
        batas_cicilan: eligibility.batas_cicilan,
        cicilan_aktif: eligibility.cicilan_aktif,
        ruang_cicilan: eligibility.ruang_cicilan,
        jasa_rate: jasaRate,
        status: 'diajukan',
        catatan_pengajuan,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Notify all active officers
    const { data: officers } = await supabaseAdmin
      .from('cooperative_officers')
      .select('nip, user_id')
      .eq('is_active', true);

    if (officers && officers.length > 0) {
      for (const off of officers) {
        await createCoopNotification({
          recipientNip: off.nip,
          recipientId: off.user_id,
          recipientRole: 'pengurus',
          type: 'loan_application',
          title: 'Pengajuan Pinjaman Baru',
          body: `${member.nama} mengajukan pinjaman sebesar ${formatRupiah(jumlah_diajukan)} dengan tenor ${tenor_bulan} bulan.`,
          referenceType: 'cooperative_loan_applications',
          referenceId: newApp.id,
        });
      }
    }

    // Log audit
    await createCoopAuditLog({
      userId: authProfile.id,
      userName: member.nama,
      userRole: 'anggota',
      action: 'SUBMIT_LOAN_APPLICATION',
      resourceType: 'cooperative_loan_applications',
      resourceId: newApp.id,
      description: `Pengajuan pinjaman ${formatRupiah(jumlah_diajukan)} diajukan oleh ${member.nama} (${member.nip})`,
      dataAfter: newApp,
    });

    return NextResponse.json({
      success: true,
      application: newApp,
      eligibility,
      message: 'Pengajuan pinjaman berhasil dikirim dan menunggu verifikasi pengurus.',
    });
  } catch (err: any) {
    console.error('Applications POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memproses pengajuan' }, { status: 500 });
  }
}

// PATCH /api/koperasi/applications
// Officer verifies, approves, rejects, or marks disbursed
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userId,
      userNip,
      application_id,
      action, // 'diverifikasi' | 'disetujui' | 'ditolak' | 'dicairkan'
      catatan_pengurus,
      alasan_penolakan,
    } = body;

    if (!application_id || !action) {
      return NextResponse.json({ error: 'ID pengajuan dan aksi wajib diisi' }, { status: 400 });
    }

    const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
    if (!officerCheck.authorized) {
      return NextResponse.json({ error: officerCheck.error }, { status: officerCheck.status });
    }

    const { data: app, error: appErr } = await supabaseAdmin
      .from('cooperative_loan_applications')
      .select('*, member:cooperative_members(*)')
      .eq('id', application_id)
      .maybeSingle();

    if (appErr || !app) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 });
    }

    const member = app.member;

    if (action === 'ditolak') {
      if (!alasan_penolakan) {
        return NextResponse.json({ error: 'Alasan penolakan wajib diisi' }, { status: 400 });
      }

      const { data: updatedApp, error: updErr } = await supabaseAdmin
        .from('cooperative_loan_applications')
        .update({
          status: 'ditolak',
          alasan_penolakan,
          catatan_pengurus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: officerCheck.profile?.id || null,
        })
        .eq('id', application_id)
        .select()
        .single();

      if (updErr) throw updErr;

      // Notify member
      if (member) {
        await createCoopNotification({
          recipientNip: member.nip,
          recipientId: member.user_id,
          recipientRole: 'anggota',
          type: 'loan_rejected',
          title: 'Pengajuan Pinjaman Ditolak',
          body: `Pengajuan pinjaman Anda sebesar ${formatRupiah(app.jumlah_diajukan)} belum disetujui. Alasan: ${alasan_penolakan}`,
          referenceType: 'cooperative_loan_applications',
          referenceId: application_id,
        });
      }

      await createCoopAuditLog({
        userId: officerCheck.profile?.id,
        userName: officerCheck.profile?.full_name,
        userRole: officerCheck.role,
        action: 'REJECT_LOAN_APPLICATION',
        resourceType: 'cooperative_loan_applications',
        resourceId: application_id,
        description: `Pengajuan pinjaman ${formatRupiah(app.jumlah_diajukan)} untuk ${member?.nama} ditolak: ${alasan_penolakan}`,
        dataBefore: app,
        dataAfter: updatedApp,
      });

      return NextResponse.json({ success: true, application: updatedApp });
    }

    if (action === 'disetujui') {
      // 1. Create cooperative_loans record
      const { data: loan, error: loanErr } = await supabaseAdmin
        .from('cooperative_loans')
        .insert({
          member_id: app.member_id,
          jumlah_pinjaman: app.jumlah_diajukan,
          jasa_rate: app.jasa_rate,
          jenis_pinjaman: app.jenis_pinjaman,
          tenor_bulan: app.tenor_bulan,
          sumber_pembayaran: app.sumber_pembayaran,
          tanggal_pengajuan: new Date(app.submitted_at).toISOString().split('T')[0],
          tanggal_persetujuan: new Date().toISOString().split('T')[0],
          status: 'disetujui',
          catatan_pengurus,
          application_id: app.id,
          disetujui_oleh: officerCheck.profile?.id || null,
        })
        .select()
        .single();

      if (loanErr) throw loanErr;

      // 2. Generate installment schedule via RPC
      const { error: rpcErr } = await supabaseAdmin.rpc('rpc_generate_installment_schedule', {
        p_loan_id: loan.id,
      });
      if (rpcErr) throw rpcErr;

      // 3. Update application record
      const { data: updatedApp, error: updErr } = await supabaseAdmin
        .from('cooperative_loan_applications')
        .update({
          status: 'disetujui',
          catatan_pengurus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: officerCheck.profile?.id || null,
          loan_id: loan.id,
        })
        .eq('id', application_id)
        .select()
        .single();

      if (updErr) throw updErr;

      // 4. Notify member
      if (member) {
        await createCoopNotification({
          recipientNip: member.nip,
          recipientId: member.user_id,
          recipientRole: 'anggota',
          type: 'loan_approved',
          title: 'Pengajuan Pinjaman Disetujui',
          body: `Selamat! Pengajuan pinjaman Anda sebesar ${formatRupiah(app.jumlah_diajukan)} telah disetujui. Menunggu proses pencairan oleh bendahara.`,
          referenceType: 'cooperative_loans',
          referenceId: loan.id,
        });
      }

      await createCoopAuditLog({
        userId: officerCheck.profile?.id,
        userName: officerCheck.profile?.full_name,
        userRole: officerCheck.role,
        action: 'APPROVE_LOAN_APPLICATION',
        resourceType: 'cooperative_loans',
        resourceId: loan.id,
        description: `Persetujuan pinjaman ${formatRupiah(app.jumlah_diajukan)} tenor ${app.tenor_bulan} bln untuk ${member?.nama}`,
        dataAfter: { application: updatedApp, loan },
      });

      return NextResponse.json({ success: true, application: updatedApp, loan });
    }

    if (action === 'dicairkan') {
      const bendaharaCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
      if (!bendaharaCheck.authorized) {
        return NextResponse.json({ error: bendaharaCheck.error }, { status: bendaharaCheck.status });
      }

      if (!app.loan_id) {
        return NextResponse.json({ error: 'Pinjaman belum dibuat atau belum disetujui' }, { status: 400 });
      }

      // 1. Update loan status to 'aktif', tanggal pencairan & tanggal mulai cicilan
      const today = new Date().toISOString().split('T')[0];
      const { data: updatedLoan, error: loanUpdErr } = await supabaseAdmin
        .from('cooperative_loans')
        .update({
          status: 'aktif',
          tanggal_pencairan: today,
          tanggal_mulai_cicilan: today,
        })
        .eq('id', app.loan_id)
        .select()
        .single();

      if (loanUpdErr) throw loanUpdErr;

      // Re-generate installment schedule with actual start date
      await supabaseAdmin.rpc('rpc_generate_installment_schedule', {
        p_loan_id: app.loan_id,
      });

      // 2. Record transaction out (pengeluaran)
      await supabaseAdmin.from('cooperative_transactions').insert({
        tanggal: today,
        jenis: 'pengeluaran',
        kategori: 'Pencairan Pinjaman',
        nominal: app.jumlah_diajukan,
        sumber: 'Kas Koperasi',
        keterangan: `Pencairan pinjaman #${updatedLoan.nomor_pinjaman || app.loan_id} untuk ${member?.nama} (${member?.nip})`,
        reference_type: 'cooperative_loans',
        reference_id: app.loan_id,
        created_by: officerCheck.profile?.id || null,
      });

      // 3. Update application to 'dicairkan'
      const { data: updatedApp } = await supabaseAdmin
        .from('cooperative_loan_applications')
        .update({
          status: 'dicairkan',
          disbursed_at: new Date().toISOString(),
          disbursed_by: officerCheck.profile?.id || null,
        })
        .eq('id', application_id)
        .select()
        .single();

      // 4. Notify member
      if (member) {
        await createCoopNotification({
          recipientNip: member.nip,
          recipientId: member.user_id,
          recipientRole: 'anggota',
          type: 'loan_disbursed',
          title: 'Pinjaman Telah Dicairkan',
          body: `Dana pinjaman sebesar ${formatRupiah(app.jumlah_diajukan)} telah dicairkan oleh Bendahara. Silakan cek rekening Anda.`,
          referenceType: 'cooperative_loans',
          referenceId: app.loan_id,
        });
      }

      await createCoopAuditLog({
        userId: officerCheck.profile?.id,
        userName: officerCheck.profile?.full_name,
        userRole: officerCheck.role,
        action: 'DISBURSE_LOAN',
        resourceType: 'cooperative_loans',
        resourceId: app.loan_id,
        description: `Pencairan dana pinjaman ${formatRupiah(app.jumlah_diajukan)} untuk ${member?.nama}`,
      });

      return NextResponse.json({ success: true, application: updatedApp, loan: updatedLoan });
    }

    if (action === 'diverifikasi') {
      const { data: updatedApp, error: updErr } = await supabaseAdmin
        .from('cooperative_loan_applications')
        .update({
          status: 'diverifikasi',
          catatan_pengurus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: officerCheck.profile?.id || null,
        })
        .eq('id', application_id)
        .select()
        .single();

      if (updErr) throw updErr;

      return NextResponse.json({ success: true, application: updatedApp });
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
  } catch (err: any) {
    console.error('Applications PATCH error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memperbarui pengajuan' }, { status: 500 });
  }
}
