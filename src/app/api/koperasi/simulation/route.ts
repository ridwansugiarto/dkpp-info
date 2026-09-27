import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';

// POST /api/koperasi/simulation
// Server-side loan eligibility check via RPC (cannot be bypassed from frontend)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, userId, userNip, jumlah_pinjaman, tenor_bulan, jasa_rate, sumber_pembayaran } = body;

    if (!jumlah_pinjaman || !tenor_bulan) {
      return NextResponse.json({ error: 'Jumlah pinjaman dan tenor wajib diisi' }, { status: 400 });
    }

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);
    if (authProfile.role === 'GUEST' || !authProfile.is_verified_employee) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const nip = authProfile.nip || userNip;
    let { data: member } = await supabaseAdmin
      .from('cooperative_members')
      .select('id')
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
          .select('id')
          .single();

        if (autoMember) {
          member = autoMember;
        }
      }
    }

    if (!member) {
      return NextResponse.json({ error: 'NIP belum terdaftar sebagai anggota koperasi' }, { status: 404 });
    }

    // Get default jasa_rate from settings if not provided
    let effectiveJasaRate = jasa_rate;
    if (!effectiveJasaRate) {
      const { data: setting } = await supabaseAdmin
        .from('cooperative_settings')
        .select('value')
        .eq('key', 'default_service_rate')
        .maybeSingle();
      effectiveJasaRate = setting ? parseFloat(setting.value) : 0.02;
    }

    // Server-side eligibility via RPC (cannot be bypassed from browser dev tools)
    const { data: eligibility, error } = await supabaseAdmin.rpc('rpc_check_loan_eligibility', {
      p_member_id: member.id,
      p_jumlah_pinjaman: jumlah_pinjaman,
      p_tenor_bulan: tenor_bulan,
      p_jasa_rate: effectiveJasaRate,
      p_sumber_pembayaran: sumber_pembayaran || 'gaji',
    });

    if (error) throw error;

    return NextResponse.json({ eligibility, jasa_rate: effectiveJasaRate });
  } catch (err) {
    console.error('Simulation error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
