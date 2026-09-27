import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkCoopOfficerAuth, checkCoopBendaharaAuth, createCoopAuditLog, createCoopNotification } from '@/lib/koperasi/serverHelpers';
import { formatRupiah } from '@/lib/koperasi/calculations';

// GET /api/koperasi/installments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const userId = searchParams.get('userId') || '';
    const userNip = searchParams.get('userNip') || '';
    const loanId = searchParams.get('loanId') || '';
    const status = searchParams.get('status') || '';
    const all = searchParams.get('all') === 'true';

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);
    if (authProfile.role === 'GUEST') {
      return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
    }

    const nip = authProfile.nip || userNip;

    if (all || loanId) {
      const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);

      if (officerCheck.authorized) {
        let query = supabaseAdmin
          .from('cooperative_installments')
          .select(`
            *,
            member:cooperative_members(id, nip, nama, jabatan, bidang),
            loan:cooperative_loans(id, nomor_pinjaman, jumlah_pinjaman, tenor_bulan, status)
          `)
          .order('due_date', { ascending: true });

        if (loanId) query = query.eq('loan_id', loanId);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json({ installments: data || [] });
      }
    }

    // Member view
    const { data: member } = await supabaseAdmin
      .from('cooperative_members')
      .select('id')
      .eq('nip', nip)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ installments: [] });
    }

    let query = supabaseAdmin
      .from('cooperative_installments')
      .select(`
        *,
        loan:cooperative_loans(id, nomor_pinjaman, status)
      `)
      .eq('member_id', member.id)
      .order('due_date', { ascending: true });

    if (loanId) query = query.eq('loan_id', loanId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ installments: data || [] });
  } catch (err: any) {
    console.error('Installments GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/koperasi/installments
// Record payment for an installment (Bendahara / Officer)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userId,
      userNip,
      installment_id,
      paid_amount,
      paid_date,
      payment_source = 'gaji',
      keterangan = '',
    } = body;

    if (!installment_id || !paid_amount) {
      return NextResponse.json({ error: 'ID cicilan dan jumlah bayar wajib diisi' }, { status: 400 });
    }

    const bendaharaCheck = await checkCoopBendaharaAuth(userEmail, userId, userNip);
    if (!bendaharaCheck.authorized) {
      return NextResponse.json({ error: bendaharaCheck.error }, { status: bendaharaCheck.status });
    }

    const { data: inst, error: instErr } = await supabaseAdmin
      .from('cooperative_installments')
      .select(`
        *,
        loan:cooperative_loans(*),
        member:cooperative_members(*)
      `)
      .eq('id', installment_id)
      .maybeSingle();

    if (instErr || !inst) {
      return NextResponse.json({ error: 'Cicilan tidak ditemukan' }, { status: 404 });
    }

    const effectivePaidDate = paid_date || new Date().toISOString().split('T')[0];

    // 1. Update installment status to 'dibayar'
    const { data: updatedInst, error: updErr } = await supabaseAdmin
      .from('cooperative_installments')
      .update({
        status: 'dibayar',
        paid_amount,
        paid_date: effectivePaidDate,
        payment_source,
        keterangan,
        dicatat_oleh: bendaharaCheck.profile?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', installment_id)
      .select()
      .single();

    if (updErr) throw updErr;

    // 2. Record transaction in cooperative_transactions (pemasukan)
    await supabaseAdmin.from('cooperative_transactions').insert({
      tanggal: effectivePaidDate,
      jenis: 'pemasukan',
      kategori: 'Pembayaran Angsuran Pinjaman',
      nominal: paid_amount,
      sumber: payment_source === 'gaji' ? 'Potong Gaji' : payment_source === 'tpp' ? 'Potong TPP' : 'Transfer/Manual',
      keterangan: `Angsuran ke-${inst.installment_number} pinjaman #${inst.loan?.nomor_pinjaman} - ${inst.member?.nama}`,
      reference_type: 'cooperative_installments',
      reference_id: installment_id,
      created_by: bendaharaCheck.profile?.id || null,
    });

    // 3. Check if all installments for this loan are now paid
    const { data: unpaidInstallments, error: countErr } = await supabaseAdmin
      .from('cooperative_installments')
      .select('id')
      .eq('loan_id', inst.loan_id)
      .neq('status', 'dibayar');

    let isLoanFullyPaid = false;
    if (!countErr && (!unpaidInstallments || unpaidInstallments.length === 0)) {
      // Loan is completely paid off!
      isLoanFullyPaid = true;
      await supabaseAdmin
        .from('cooperative_loans')
        .update({
          status: 'lunas',
          updated_at: new Date().toISOString(),
        })
        .eq('id', inst.loan_id);

      // Notify member of full payoff
      if (inst.member) {
        await createCoopNotification({
          recipientNip: inst.member.nip,
          recipientId: inst.member.user_id,
          recipientRole: 'anggota',
          type: 'loan_paid_off',
          title: 'Pinjaman Lunas!',
          body: `Selamat! Pinjaman nomor #${inst.loan?.nomor_pinjaman} telah lunas secara penuh. Terima kasih atas ketepatan pembayaran Anda.`,
          referenceType: 'cooperative_loans',
          referenceId: inst.loan_id,
        });
      }
    } else {
      // Notify member of installment receipt
      if (inst.member) {
        await createCoopNotification({
          recipientNip: inst.member.nip,
          recipientId: inst.member.user_id,
          recipientRole: 'anggota',
          type: 'installment_paid',
          title: 'Pembayaran Cicilan Diterima',
          body: `Pembayaran cicilan ke-${inst.installment_number} sebesar ${formatRupiah(paid_amount)} untuk pinjaman #${inst.loan?.nomor_pinjaman} telah berhasil dicatat.`,
          referenceType: 'cooperative_installments',
          referenceId: installment_id,
        });
      }
    }

    // Log audit
    await createCoopAuditLog({
      userId: bendaharaCheck.profile?.id,
      userName: bendaharaCheck.profile?.full_name,
      userRole: bendaharaCheck.role,
      action: 'RECORD_INSTALLMENT_PAYMENT',
      resourceType: 'cooperative_installments',
      resourceId: installment_id,
      description: `Pencatatan angsuran ke-${inst.installment_number} (${formatRupiah(paid_amount)}) untuk ${inst.member?.nama}`,
      dataBefore: inst,
      dataAfter: updatedInst,
    });

    return NextResponse.json({
      success: true,
      installment: updatedInst,
      is_loan_fully_paid: isLoanFullyPaid,
      message: isLoanFullyPaid
        ? 'Pembayaran cicilan berhasil dicatat. Pinjaman telah LUNAS!'
        : 'Pembayaran cicilan berhasil dicatat.',
    });
  } catch (err: any) {
    console.error('Installment POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat mencatat pembayaran' }, { status: 500 });
  }
}
