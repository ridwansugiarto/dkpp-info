import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';

    const authProfile = await resolveUserAuth(userEmail);
    if (authProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus Administrator' }, { status: 403 });
    }

    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch {
    return NextResponse.json({ error: 'Gagal memuat audit logs' }, { status: 500 });
  }
}
