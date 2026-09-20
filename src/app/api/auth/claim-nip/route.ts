import { NextResponse } from 'next/server';
import { supabaseAdmin, ADMIN_NIP, ADMIN_EMAIL, logAudit } from '@/lib/supabaseServer';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawNip = (body.nip || '').trim();
    const cleanNip = rawNip.replace(/\s+/g, '');
    const userEmail = (body.userEmail || body.email || '').trim().toLowerCase();
    const userId = (body.userId || body.id || '').trim();
    const fullName = (body.fullName || body.full_name || '').trim();

    if (!cleanNip || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'NIP dan Email akun wajib diisi.' },
        { status: 400 }
      );
    }

    const isSuperAdminNip = cleanNip === ADMIN_NIP || cleanNip === '197610182002121002';

    // 1. Governance verification: Cek apakah NIP ini sudah dimiliki user lain
    if (!isSuperAdminNip) {
      // Cek apakah tabel employees sudah mengaitkan NIP ini ke email lain
      try {
        const { data: existingEmp } = await supabaseAdmin
          .from('employees')
          .select('id, nip, email, user_id, full_name')
          .eq('nip', cleanNip)
          .eq('is_active', true)
          .maybeSingle();

        if (existingEmp && existingEmp.email && existingEmp.email.toLowerCase() !== userEmail) {
          return NextResponse.json({
            success: false,
            alreadyClaimed: true,
            error: `NIP ${cleanNip} telah terverifikasi oleh akun lain. Silakan hubungi Administrator ChatDKPP untuk proses klaim NIP.`
          }, { status: 409 });
        }

        // Cek tabel dkpp_claimed_nips jika ada
        const { data: existingClaim } = await supabaseAdmin
          .from('dkpp_claimed_nips')
          .select('*')
          .eq('nip', cleanNip)
          .maybeSingle();

        if (existingClaim && existingClaim.email && existingClaim.email.toLowerCase() !== userEmail) {
          return NextResponse.json({
            success: false,
            alreadyClaimed: true,
            error: `NIP ${cleanNip} telah terverifikasi oleh akun lain. Silakan hubungi Administrator ChatDKPP untuk proses klaim NIP.`
          }, { status: 409 });
        }
      } catch (err) {
        console.warn('Governance check error in claim-nip:', err);
      }
    }

    // 2. Resolve employee details
    let empName = fullName;
    let empJabatan = 'Pegawai DKPP Cilegon';
    let empBidang = 'DKPP Kota Cilegon';

    const foundLocal = OFFICIAL_DKPP_PEGAWAI.find(p => p.nip === cleanNip);
    if (foundLocal) {
      empName = empName || foundLocal.nama;
      empJabatan = foundLocal.jabatan || empJabatan;
      empBidang = foundLocal.bidang || empBidang;
    }

    if (cleanNip === '197610182002121002' || empName.toLowerCase().includes('ridwan')) {
      empJabatan = 'Analis Ketahanan Pangan Ahli Muda';
      empBidang = 'Ketahanan Pangan';
    }

    // 3. Persist claim governance ke Supabase
    if (!isSuperAdminNip) {
      try {
        // Coba insert/upsert ke tabel dkpp_claimed_nips
        await supabaseAdmin
          .from('dkpp_claimed_nips')
          .upsert({
            nip: cleanNip,
            email: userEmail,
            user_id: userId || null,
            full_name: empName,
            claimed_at: new Date().toISOString()
          }, { onConflict: 'nip' });
      } catch {}

      try {
        // Update user_id & email pada tabel employees
        await supabaseAdmin
          .from('employees')
          .update({
            email: userEmail,
            user_id: userId || null,
            updated_at: new Date().toISOString()
          })
          .eq('nip', cleanNip);
      } catch {}
    }

    // 4. Catat ke audit log
    await logAudit({
      userId: userId || userEmail,
      action: isSuperAdminNip ? 'SUPERADMIN_NIP_CLAIMED' : 'EMPLOYEE_NIP_CLAIMED',
      resourceType: 'NIP_GOVERNANCE',
      resourceId: cleanNip,
      accessResult: 'SUCCESS',
      metadata: {
        email: userEmail,
        nip: cleanNip,
        isSuperAdmin: isSuperAdminNip,
        fullName: empName
      }
    });

    return NextResponse.json({
      success: true,
      nip: cleanNip,
      nama: empName,
      jabatan: empJabatan,
      bidang: empBidang,
      is_superadmin: isSuperAdminNip,
      message: 'Klaim NIP berhasil diverifikasi dan terikat ke akun Anda.'
    });
  } catch (err: any) {
    console.error('Claim NIP API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memproses klaim NIP.' },
      { status: 500 }
    );
  }
}
