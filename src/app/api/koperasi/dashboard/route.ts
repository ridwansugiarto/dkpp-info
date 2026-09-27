import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth, ADMIN_NIP } from '@/lib/supabaseServer';

// GET /api/koperasi/dashboard
// Returns dashboard data for current user (member or officer)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const userId = searchParams.get('userId') || '';
    const userNip = searchParams.get('userNip') || '';

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);

    if (authProfile.role === 'GUEST') {
      return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
    }

    const nip = authProfile.nip || userNip;
    if (!nip) {
      return NextResponse.json({ error: 'NIP tidak ditemukan' }, { status: 403 });
    }

    const isAdmin = authProfile.email?.toLowerCase() === 'ridwansugiarto.mail@gmail.com';

    // Cek officer role
    const { data: officer } = await supabaseAdmin
      .from('cooperative_officers')
      .select('*')
      .eq('nip', nip)
      .eq('is_active', true)
      .maybeSingle();

    // Cek member dengan sinkronisasi sistemik ke dkpp_pegawai_nip
    let { data: member } = await supabaseAdmin
      .from('cooperative_members')
      .select('*')
      .eq('nip', nip)
      .maybeSingle();

    // Jika belum ada di cooperative_members, cek master data kepegawaian dkpp_pegawai_nip
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
          .select()
          .single();

        if (autoMember) {
          member = autoMember;
        }
      }
    } else if (member && !member.user_id && authProfile.id && !authProfile.id.startsWith('guest_')) {
      await supabaseAdmin
        .from('cooperative_members')
        .update({ user_id: authProfile.id })
        .eq('id', member.id);
    }

    const isOfficer = !!(officer || isAdmin);
    const isBendahara = officer?.role === 'bendahara' || officer?.role === 'admin' || isAdmin;

    if (isOfficer) {
      // Officer dashboard via RPC
      const { data: officerDash, error } = await supabaseAdmin.rpc('rpc_get_officer_dashboard');
      if (error) throw error;

      // Pending applications
      const { data: pendingApps } = await supabaseAdmin
        .from('cooperative_loan_applications')
        .select('*, member:cooperative_members(id, nip, nama, jabatan, bidang, gaji, tpp, total_pendapatan)')
        .eq('status', 'diajukan')
        .order('submitted_at', { ascending: false })
        .limit(10);

      // Recent transactions
      const { data: recentTx } = await supabaseAdmin
        .from('cooperative_transactions')
        .select('*')
        .order('tanggal', { ascending: false })
        .limit(20);

      // Kredit macet
      const { data: loansMacet } = await supabaseAdmin
        .from('cooperative_loans')
        .select('*, member:cooperative_members(id, nip, nama, jabatan, bidang)')
        .eq('status', 'macet')
        .order('updated_at', { ascending: false });

      // Settings
      const { data: settings } = await supabaseAdmin
        .from('cooperative_settings')
        .select('*');

      return NextResponse.json({
        role: isBendahara ? 'bendahara' : 'pengurus',
        officer,
        dashboard: officerDash,
        pending_applications: pendingApps || [],
        recent_transactions: recentTx || [],
        loans_macet: loansMacet || [],
        settings: settings || [],
      });
    }

    // Member dashboard
    if (!member) {
      return NextResponse.json({
        role: 'anggota',
        is_registered: false,
        message: 'NIP Anda belum terdaftar sebagai anggota koperasi. Hubungi pengurus untuk pendaftaran.',
      });
    }

    // Member dashboard via RPC
    const { data: memberDash, error: memberErr } = await supabaseAdmin
      .rpc('rpc_get_member_dashboard', { p_member_id: member.id });
    if (memberErr) throw memberErr;

    // Installments for active loans
    const { data: installments } = await supabaseAdmin
      .from('cooperative_installments')
      .select('*')
      .eq('member_id', member.id)
      .order('due_date', { ascending: true });

    // Savings history
    const { data: savingsHistory } = await supabaseAdmin
      .from('cooperative_savings')
      .select('*')
      .eq('member_id', member.id)
      .order('tanggal', { ascending: false })
      .limit(24);

    // Loan applications
    const { data: applications } = await supabaseAdmin
      .from('cooperative_loan_applications')
      .select('*')
      .eq('member_id', member.id)
      .order('submitted_at', { ascending: false });

    // Notifications
    const { data: notifications } = await supabaseAdmin
      .from('cooperative_notifications')
      .select('*')
      .eq('recipient_nip', nip)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // Settings
    const { data: settings } = await supabaseAdmin
      .from('cooperative_settings')
      .select('*');

    return NextResponse.json({
      role: 'anggota',
      is_registered: true,
      member,
      dashboard: memberDash,
      installments: installments || [],
      savings_history: savingsHistory || [],
      applications: applications || [],
      notifications: notifications || [],
      settings: settings || [],
    });
  } catch (err) {
    console.error('Koperasi dashboard error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
