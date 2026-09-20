import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, ADMIN_NIP, ADMIN_EMAIL } from '@/lib/supabaseServer';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawNip = (body.nip || '').trim();
    const cleanNip = rawNip.replace(/\s+/g, '');
    const userEmail = (body.userEmail || body.email || '').trim().toLowerCase();
    const userId = (body.userId || body.id || '').trim();

    if (!cleanNip) {
      return NextResponse.json({ valid: false, error: 'NIP tidak boleh kosong.' }, { status: 400 });
    }

    const isSuperAdminNip = cleanNip === ADMIN_NIP || cleanNip === '197610182002121002';

    // 1. GOVERNANCE CHECK: Cek apakah NIP sudah diverifikasi/diklaim oleh akun lain
    // Pengecualian Superadmin: NIP 197610182002121002 bebas digunakan oleh user dengan gmail apapun tanpa batasan
    if (!isSuperAdminNip && userEmail) {
      try {
        // Cek tabel employees atau dkpp_claimed_nips di Supabase
        const { data: claimedByEmp } = await supabaseAdmin
          .from('employees')
          .select('id, nip, email, user_id, full_name')
          .eq('nip', cleanNip)
          .eq('is_active', true)
          .maybeSingle();

        if (claimedByEmp && claimedByEmp.email && claimedByEmp.email.toLowerCase() !== userEmail) {
          return NextResponse.json({
            valid: false,
            alreadyClaimed: true,
            claimedByOther: true,
            error: `NIP ${cleanNip} telah terverifikasi oleh akun lain. Silakan hubungi Administrator ChatDKPP untuk proses klaim/validasi NIP Anda.`
          }, { status: 409 });
        }

        // Cek tabel dkpp_claimed_nips jika ada
        const { data: claimedRecord } = await supabaseAdmin
          .from('dkpp_claimed_nips')
          .select('*')
          .eq('nip', cleanNip)
          .maybeSingle();

        if (claimedRecord && claimedRecord.email && claimedRecord.email.toLowerCase() !== userEmail) {
          return NextResponse.json({
            valid: false,
            alreadyClaimed: true,
            claimedByOther: true,
            error: `NIP ${cleanNip} telah terverifikasi oleh akun lain. Silakan hubungi Administrator ChatDKPP untuk proses klaim/validasi NIP Anda.`
          }, { status: 409 });
        }
      } catch (govErr) {
        console.warn('Governance check fallback warning:', govErr);
      }
    }

    // 2. Coba kueri ke Supabase table dkpp_pegawai_nip (mendukung input digit polos atau berjarak)
    try {
      const { data, error } = await supabaseAdmin
        .from('dkpp_pegawai_nip')
        .select('*')
        .or(`nip.eq.${cleanNip},nip.eq.${rawNip}`)
        .maybeSingle();

      if (!error && data) {
        if (!data.is_active) {
          return NextResponse.json({
            valid: false,
            error: `Pegawai dengan NIP ${data.nip} (${data.nama}) sudah tidak bertugas di DKPP Kota Cilegon (${data.keterangan || 'sudah pindah atau sudah resign'}).`
          }, { status: 400 });
        }

        const resolvedPosition = (cleanNip === '197610182002121002' || data.nama?.toLowerCase().includes('ridwan'))
          ? 'Analis Ketahanan Pangan Ahli Muda'
          : (data.jabatan || 'Pegawai DKPP Cilegon');

        return NextResponse.json({
          valid: true,
          nip: data.nip,
          nama: data.nama,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: data.tanggal_lahir,
          tanggal_lahir_str: data.tanggal_lahir_str,
          pangkat: data.pangkat,
          golongan: data.golongan,
          jabatan: resolvedPosition,
          bidang: data.bidang || 'DKPP Kota Cilegon',
          status_pegawai: data.status_pegawai,
          kategori_pegawai: data.kategori_pegawai,
          kelas_jabatan: data.kelas_jabatan,
          is_sensitive: data.is_sensitive ?? true,
          is_superadmin: isSuperAdminNip,
          source: 'DATABASE_SUPABASE'
        });
      }
    } catch {
      // Lanjut ke fallback data resmi jika tabel Supabase belum siap
    }

    // 3. Cek ke basis data resmi Pegawai DKPP 2026
    const found = OFFICIAL_DKPP_PEGAWAI.find((p) => p.nip === cleanNip);
    if (found) {
      if (!found.is_active) {
        return NextResponse.json({
          valid: false,
          error: `Pegawai dengan NIP ${found.nip} (${found.nama}) sudah tidak bertugas di DKPP Kota Cilegon (${found.keterangan || 'sudah pindah atau sudah resign'}).`
        }, { status: 400 });
      }

      const resolvedPosition = (cleanNip === '197610182002121002' || found.nama?.toLowerCase().includes('ridwan'))
        ? 'Analis Ketahanan Pangan Ahli Muda'
        : (found.jabatan || 'Pegawai DKPP Cilegon');

      return NextResponse.json({
        valid: true,
        nip: found.nip,
        nama: found.nama,
        tempat_lahir: found.tempat_lahir,
        tanggal_lahir: found.tanggal_lahir,
        tanggal_lahir_str: found.tanggal_lahir_str,
        pangkat: found.pangkat,
        golongan: found.golongan,
        jabatan: resolvedPosition,
        bidang: found.bidang || 'DKPP Kota Cilegon',
        status_pegawai: found.status_pegawai,
        kategori_pegawai: found.kategori_pegawai,
        kelas_jabatan: found.kelas_jabatan,
        is_sensitive: found.is_sensitive ?? true,
        is_superadmin: isSuperAdminNip,
        source: 'OFFICIAL_DATASET'
      });
    }

    return NextResponse.json({
      valid: false,
      error: 'NIP tidak terdaftar dalam basis data Pegawai Resmi DKPP Kota Cilegon.'
    }, { status: 404 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ valid: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

