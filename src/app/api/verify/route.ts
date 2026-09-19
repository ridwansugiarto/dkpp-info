import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, logAudit, ADMIN_EMAIL, ADMIN_NIP } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nip, userId } = body;

    if (!email || !nip) {
      return NextResponse.json(
        { error: 'Email dan NIP wajib diisi untuk verifikasi pegawai' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanNip = String(nip).trim();

    // Check if initial admin
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && cleanNip === ADMIN_NIP) {
      await logAudit({
        userId: userId || 'admin',
        action: 'SENSITIVE_ACCESS_GRANTED',
        resourceType: 'EMPLOYEE_VERIFICATION',
        resourceId: cleanNip,
        accessResult: 'SUCCESS',
        metadata: { role: 'ADMIN', email: cleanEmail },
      });

      return NextResponse.json({
        verified: true,
        role: 'ADMIN',
        full_name: 'Ridwan Sugiarto, S.Pi',
        department: 'Ketahanan Pangan',
        position: 'Analis Ketahanan Pangan Ahli Muda',
        can_access_sensitive: true,
      });
    }

    // Lookup in employees table
    const { data: emp, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('email', cleanEmail)
      .eq('nip', cleanNip)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !emp) {
      await logAudit({
        userId: userId || 'anonymous',
        action: 'SENSITIVE_ACCESS_DENIED',
        resourceType: 'EMPLOYEE_VERIFICATION',
        resourceId: cleanNip,
        accessResult: 'DENIED',
        metadata: { attemptedEmail: cleanEmail },
      });

      return NextResponse.json(
        {
          verified: false,
          error: 'Kombinasi Email dan NIP tidak terdaftar di database kepegawaian aktif DKPP Kota Cilegon.',
        },
        { status: 403 }
      );
    }

    // Success verification
    const role = emp.access_level === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
    const canSensitive = emp.access_level === 'SENSITIVE' || emp.access_level === 'ADMIN';

    // Update profile if userId provided
    if (userId && userId !== 'guest') {
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: cleanEmail,
          full_name: emp.full_name,
          role,
          is_verified_employee: true,
          can_access_sensitive: canSensitive,
        });
    }

    await logAudit({
      userId: userId || emp.id,
      action: 'SENSITIVE_ACCESS_GRANTED',
      resourceType: 'EMPLOYEE_VERIFICATION',
      resourceId: emp.nip,
      accessResult: 'SUCCESS',
      metadata: { role, department: emp.department },
    });

    return NextResponse.json({
      verified: true,
      role,
      full_name: emp.full_name,
      department: emp.department,
      position: emp.position,
      can_access_sensitive: canSensitive,
    });
  } catch (err) {
    console.error('Verify endpoint error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memverifikasi NIP pegawai.' },
      { status: 500 }
    );
  }
}
