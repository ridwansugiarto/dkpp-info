import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkCoopBendaharaAuth, createCoopAuditLog } from '@/lib/koperasi/serverHelpers';

// GET /api/koperasi/settings
export async function GET(req: NextRequest) {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('cooperative_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;

    const parsed: Record<string, any> = {};
    (settings || []).forEach((s) => {
      if (s.data_type === 'number') parsed[s.key] = parseFloat(s.value);
      else if (s.data_type === 'boolean') parsed[s.key] = s.value === 'true';
      else parsed[s.key] = s.value;
    });

    return NextResponse.json({ settings: settings || [], parsed });
  } catch (err: any) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PATCH /api/koperasi/settings
// Update settings (Bendahara / Admin)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, userId, userNip, settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Data settings tidak valid' }, { status: 400 });
    }

    const bendaharaCheck = await checkCoopBendaharaAuth(userEmail, userId, userNip);
    if (!bendaharaCheck.authorized) {
      return NextResponse.json({ error: bendaharaCheck.error }, { status: bendaharaCheck.status });
    }

    const updatedKeys: string[] = [];

    for (const [key, val] of Object.entries(settings)) {
      const strVal = String(val);
      const { error } = await supabaseAdmin
        .from('cooperative_settings')
        .update({
          value: strVal,
          updated_at: new Date().toISOString(),
          updated_by: bendaharaCheck.profile?.id || null,
        })
        .eq('key', key);

      if (!error) updatedKeys.push(key);
    }

    await createCoopAuditLog({
      userId: bendaharaCheck.profile?.id,
      userName: bendaharaCheck.profile?.full_name,
      userRole: bendaharaCheck.role,
      action: 'UPDATE_SETTINGS',
      resourceType: 'cooperative_settings',
      description: `Pembaruan pengaturan koperasi untuk kunci: ${updatedKeys.join(', ')}`,
      dataAfter: settings,
    });

    return NextResponse.json({ success: true, updated_keys: updatedKeys });
  } catch (err: any) {
    console.error('Settings PATCH error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
