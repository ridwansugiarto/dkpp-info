import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkCoopOfficerAuth, createCoopAuditLog, createCoopNotification } from '@/lib/koperasi/serverHelpers';
import { formatRupiah } from '@/lib/koperasi/calculations';

// GET /api/koperasi/loans
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
      const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
      if (!officerCheck.authorized) {
        return NextResponse.json({ error: officerCheck.error }, { status: officerCheck.status });
      }

      let query = supabaseAdmin
        .from('cooperative_loans')
        .select(`
          *,
          member:cooperative_members(id, nip, nama, jabatan, bidang, golongan, gaji, tpp),
          installments:cooperative_installments(id, installment_number, due_date, total_amount, paid_amount, status)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return NextResponse.json({ loans: data || [] });
    }

    // Member self loans
    const { data: member } = await supabaseAdmin
      .from('cooperative_members')
      .select('id')
      .eq('nip', nip)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ loans: [] });
    }

    let query = supabaseAdmin
      .from('cooperative_loans')
      .select(`
        *,
        installments:cooperative_installments(id, installment_number, due_date, total_amount, paid_amount, status, paid_date)
      `)
      .eq('member_id', member.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ loans: data || [] });
  } catch (err: any) {
    console.error('Loans GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PATCH /api/koperasi/loans
// Officer updates loan status (e.g. macet, lunas, catatan)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, userId, userNip, loan_id, status, catatan_pengurus } = body;

    if (!loan_id || !status) {
      return NextResponse.json({ error: 'Loan ID dan status wajib diisi' }, { status: 400 });
    }

    const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
    if (!officerCheck.authorized) {
      return NextResponse.json({ error: officerCheck.error }, { status: officerCheck.status });
    }

    const { data: existingLoan, error: fetchErr } = await supabaseAdmin
      .from('cooperative_loans')
      .select('*, member:cooperative_members(*)')
      .eq('id', loan_id)
      .maybeSingle();

    if (fetchErr || !existingLoan) {
      return NextResponse.json({ error: 'Data pinjaman tidak ditemukan' }, { status: 404 });
    }

    const { data: updatedLoan, error: updErr } = await supabaseAdmin
      .from('cooperative_loans')
      .update({
        status,
        catatan_pengurus: catatan_pengurus || existingLoan.catatan_pengurus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loan_id)
      .select()
      .single();

    if (updErr) throw updErr;

    // Log audit
    await createCoopAuditLog({
      userId: officerCheck.profile?.id,
      userName: officerCheck.profile?.full_name,
      userRole: officerCheck.role,
      action: 'UPDATE_LOAN_STATUS',
      resourceType: 'cooperative_loans',
      resourceId: loan_id,
      description: `Status pinjaman #${existingLoan.nomor_pinjaman} diubah dari ${existingLoan.status} ke ${status}`,
      dataBefore: existingLoan,
      dataAfter: updatedLoan,
    });

    if (existingLoan.member && status === 'macet') {
      await createCoopNotification({
        recipientNip: existingLoan.member.nip,
        recipientId: existingLoan.member.user_id,
        recipientRole: 'anggota',
        type: 'loan_default_warning',
        title: 'Pemberitahuan Status Pinjaman',
        body: `Pinjaman #${existingLoan.nomor_pinjaman} berstatus perlu perhatian (tertunggak). Harap segera hubungi Bendahara Koperasi.`,
        referenceType: 'cooperative_loans',
        referenceId: loan_id,
      });
    }

    return NextResponse.json({ success: true, loan: updatedLoan });
  } catch (err: any) {
    console.error('Loans PATCH error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memperbarui pinjaman' }, { status: 500 });
  }
}
