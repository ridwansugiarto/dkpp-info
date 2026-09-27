import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkCoopOfficerAuth, checkCoopBendaharaAuth, createCoopAuditLog } from '@/lib/koperasi/serverHelpers';

// GET /api/koperasi/members
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const userId = searchParams.get('userId') || '';
    const userNip = searchParams.get('userNip') || '';
    const queryNip = searchParams.get('nip') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') === 'true';

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);
    if (authProfile.role === 'GUEST') {
      return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
    }

    if (all || queryNip) {
      const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
      if (!officerCheck.authorized && queryNip !== authProfile.nip) {
        return NextResponse.json({ error: officerCheck.error }, { status: officerCheck.status });
      }

      let query = supabaseAdmin
        .from('cooperative_members')
        .select('*')
        .order('nama', { ascending: true });

      if (queryNip) query = query.eq('nip', queryNip);
      if (status) query = query.eq('status_keanggotaan', status);
      if (search) {
        query = query.or(`nama.ilike.%${search}%,nip.ilike.%${search}%,bidang.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return NextResponse.json({ members: data || [] });
    }

    // Default: Return current user's member record
    const nip = authProfile.nip || userNip;
    const { data: member, error } = await supabaseAdmin
      .from('cooperative_members')
      .select('*')
      .eq('nip', nip)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ member });
  } catch (err: any) {
    console.error('Members GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/koperasi/members
// Register new member (Bendahara / Admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userId,
      userNip,
      nip,
      nama,
      jabatan,
      bidang,
      golongan,
      status_pegawai = 'PNS',
      gaji = 0,
      tpp = 0,
      status_keanggotaan = 'aktif',
      tanggal_bergabung,
      catatan,
    } = body;

    if (!nip || !nama) {
      return NextResponse.json({ error: 'NIP dan Nama wajib diisi' }, { status: 400 });
    }

    const bendaharaCheck = await checkCoopBendaharaAuth(userEmail, userId, userNip);
    if (!bendaharaCheck.authorized) {
      return NextResponse.json({ error: bendaharaCheck.error }, { status: bendaharaCheck.status });
    }

    // Notice: total_pendapatan is GENERATED ALWAYS AS (gaji + tpp) STORED, so omit it
    const insertPayload: any = {
      nip: nip.trim(),
      nama: nama.trim(),
      jabatan: jabatan || '',
      bidang: bidang || '',
      golongan: golongan || '',
      status_pegawai,
      gaji: Number(gaji) || 0,
      tpp: Number(tpp) || 0,
      status_keanggotaan,
      tanggal_bergabung: tanggal_bergabung || new Date().toISOString().split('T')[0],
      catatan: catatan || '',
    };

    const { data: newMember, error } = await supabaseAdmin
      .from('cooperative_members')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'NIP ini sudah terdaftar sebagai anggota koperasi' }, { status: 409 });
      }
      throw error;
    }

    await createCoopAuditLog({
      userId: bendaharaCheck.profile?.id,
      userName: bendaharaCheck.profile?.full_name,
      userRole: bendaharaCheck.role,
      action: 'REGISTER_MEMBER',
      resourceType: 'cooperative_members',
      resourceId: newMember.id,
      description: `Mendaftarkan anggota baru: ${newMember.nama} (${newMember.nip})`,
      dataAfter: newMember,
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (err: any) {
    console.error('Members POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat mendaftarkan anggota' }, { status: 500 });
  }
}

// PATCH /api/koperasi/members
// Update member data
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userId,
      userNip,
      member_id,
      nama,
      jabatan,
      bidang,
      golongan,
      status_pegawai,
      gaji,
      tpp,
      status_keanggotaan,
      catatan,
    } = body;

    if (!member_id) {
      return NextResponse.json({ error: 'ID anggota wajib disertakan' }, { status: 400 });
    }

    const bendaharaCheck = await checkCoopBendaharaAuth(userEmail, userId, userNip);
    if (!bendaharaCheck.authorized) {
      return NextResponse.json({ error: bendaharaCheck.error }, { status: bendaharaCheck.status });
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('cooperative_members')
      .select('*')
      .eq('id', member_id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Data anggota tidak ditemukan' }, { status: 404 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (nama !== undefined) updatePayload.nama = nama;
    if (jabatan !== undefined) updatePayload.jabatan = jabatan;
    if (bidang !== undefined) updatePayload.bidang = bidang;
    if (golongan !== undefined) updatePayload.golongan = golongan;
    if (status_pegawai !== undefined) updatePayload.status_pegawai = status_pegawai;
    if (gaji !== undefined) updatePayload.gaji = Number(gaji);
    if (tpp !== undefined) updatePayload.tpp = Number(tpp);
    if (status_keanggotaan !== undefined) updatePayload.status_keanggotaan = status_keanggotaan;
    if (catatan !== undefined) updatePayload.catatan = catatan;

    const { data: updatedMember, error: updErr } = await supabaseAdmin
      .from('cooperative_members')
      .update(updatePayload)
      .eq('id', member_id)
      .select()
      .single();

    if (updErr) throw updErr;

    await createCoopAuditLog({
      userId: bendaharaCheck.profile?.id,
      userName: bendaharaCheck.profile?.full_name,
      userRole: bendaharaCheck.role,
      action: 'UPDATE_MEMBER',
      resourceType: 'cooperative_members',
      resourceId: member_id,
      description: `Pembaruan data anggota: ${updatedMember.nama} (${updatedMember.nip})`,
      dataBefore: existing,
      dataAfter: updatedMember,
    });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (err: any) {
    console.error('Members PATCH error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memperbarui data anggota' }, { status: 500 });
  }
}
