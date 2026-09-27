import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkCoopOfficerAuth, checkCoopBendaharaAuth, createCoopAuditLog, createCoopNotification } from '@/lib/koperasi/serverHelpers';
import { formatRupiah } from '@/lib/koperasi/calculations';

// GET /api/koperasi/savings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const userId = searchParams.get('userId') || '';
    const userNip = searchParams.get('userNip') || '';
    const memberId = searchParams.get('memberId') || '';
    const jenis = searchParams.get('jenis') || '';
    const all = searchParams.get('all') === 'true';

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);
    if (authProfile.role === 'GUEST') {
      return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
    }

    const nip = authProfile.nip || userNip;

    if (all || memberId) {
      const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
      if (officerCheck.authorized) {
        let query = supabaseAdmin
          .from('cooperative_savings')
          .select(`
            *,
            member:cooperative_members(id, nip, nama, jabatan, bidang)
          `)
          .order('tanggal', { ascending: false });

        if (memberId) query = query.eq('member_id', memberId);
        if (jenis) query = query.eq('jenis_simpanan', jenis);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ savings: data || [] });
      }
    }

    // Member view
    const { data: member } = await supabaseAdmin
      .from('cooperative_members')
      .select('id')
      .eq('nip', nip)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ savings: [], totals: { total: 0, wajib: 0, sukarela: 0, pokok: 0 } });
    }

    let query = supabaseAdmin
      .from('cooperative_savings')
      .select('*')
      .eq('member_id', member.id)
      .order('tanggal', { ascending: false });

    if (jenis) query = query.eq('jenis_simpanan', jenis);

    const { data: savings, error } = await query;
    if (error) throw error;

    // Calculate totals
    const totals = {
      total: 0,
      wajib: 0,
      sukarela: 0,
      pokok: 0,
    };

    (savings || []).forEach((s) => {
      const nom = Number(s.nominal) || 0;
      totals.total += nom;
      if (s.jenis_simpanan === 'wajib') totals.wajib += nom;
      if (s.jenis_simpanan === 'sukarela') totals.sukarela += nom;
      if (s.jenis_simpanan === 'pokok') totals.pokok += nom;
    });

    return NextResponse.json({ savings: savings || [], totals });
  } catch (err: any) {
    console.error('Savings GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/koperasi/savings
// Record savings deposit (Bendahara/Officer)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userId,
      userNip,
      member_id,
      jenis_simpanan,
      nominal,
      tanggal,
      keterangan,
      periode_bulan,
      periode_tahun,
    } = body;

    if (!member_id || !jenis_simpanan || !nominal) {
      return NextResponse.json({ error: 'Data simpanan tidak lengkap' }, { status: 400 });
    }

    const bendaharaCheck = await checkCoopBendaharaAuth(userEmail, userId, userNip);
    if (!bendaharaCheck.authorized) {
      return NextResponse.json({ error: bendaharaCheck.error }, { status: bendaharaCheck.status });
    }

    const effectiveDate = tanggal || new Date().toISOString().split('T')[0];
    const now = new Date(effectiveDate);
    const bulan = periode_bulan || now.getMonth() + 1;
    const tahun = periode_tahun || now.getFullYear();

    const { data: member } = await supabaseAdmin
      .from('cooperative_members')
      .select('*')
      .eq('id', member_id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 });
    }

    // Insert into cooperative_savings
    const { data: saving, error: saveErr } = await supabaseAdmin
      .from('cooperative_savings')
      .insert({
        member_id,
        jenis_simpanan,
        tanggal: effectiveDate,
        nominal,
        keterangan: keterangan || `Simpanan ${jenis_simpanan} periode ${bulan}/${tahun}`,
        periode_bulan: bulan,
        periode_tahun: tahun,
        created_by: bendaharaCheck.profile?.id || null,
      })
      .select()
      .single();

    if (saveErr) throw saveErr;

    // Record into cooperative_transactions (pemasukan)
    await supabaseAdmin.from('cooperative_transactions').insert({
      tanggal: effectiveDate,
      jenis: 'pemasukan',
      kategori: `Simpanan ${jenis_simpanan.toUpperCase()}`,
      nominal,
      sumber: 'Setoran Anggota',
      keterangan: `Simpanan ${jenis_simpanan} - ${member.nama} (${member.nip}) periode ${bulan}/${tahun}`,
      reference_type: 'cooperative_savings',
      reference_id: saving.id,
      periode_bulan: bulan,
      periode_tahun: tahun,
      created_by: bendaharaCheck.profile?.id || null,
    });

    // Notify member
    await createCoopNotification({
      recipientNip: member.nip,
      recipientId: member.user_id,
      recipientRole: 'anggota',
      type: 'saving_deposit',
      title: `Simpanan ${jenis_simpanan.toUpperCase()} Berhasil Masuk`,
      body: `Setoran simpanan ${jenis_simpanan} sebesar ${formatRupiah(nominal)} untuk periode ${bulan}/${tahun} telah dicatat.`,
      referenceType: 'cooperative_savings',
      referenceId: saving.id,
    });

    // Audit log
    await createCoopAuditLog({
      userId: bendaharaCheck.profile?.id,
      userName: bendaharaCheck.profile?.full_name,
      userRole: bendaharaCheck.role,
      action: 'RECORD_SAVINGS',
      resourceType: 'cooperative_savings',
      resourceId: saving.id,
      description: `Setoran simpanan ${jenis_simpanan} ${formatRupiah(nominal)} untuk ${member.nama}`,
      dataAfter: saving,
    });

    return NextResponse.json({
      success: true,
      saving,
      message: `Setoran simpanan ${jenis_simpanan} berhasil dicatat.`,
    });
  } catch (err: any) {
    console.error('Savings POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat mencatat simpanan' }, { status: 500 });
  }
}
