import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';

// GET /api/koperasi/notifications
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const userId = searchParams.get('userId') || '';
    const userNip = searchParams.get('userNip') || '';

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);
    if (authProfile.role === 'GUEST') {
      return NextResponse.json({ notifications: [] });
    }

    const nip = authProfile.nip || userNip;

    const { data: notifications, error } = await supabaseAdmin
      .from('cooperative_notifications')
      .select('*')
      .or(`recipient_nip.eq.${nip},recipient_id.eq.${authProfile.id}`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    return NextResponse.json({ notifications: notifications || [] });
  } catch (err: any) {
    console.error('Notifications GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PATCH /api/koperasi/notifications
// Mark notification(s) as read
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, userId, userNip, notification_id, mark_all = false } = body;

    const authProfile = await resolveUserAuth(userEmail, userId, userNip);
    if (authProfile.role === 'GUEST') {
      return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
    }

    const nip = authProfile.nip || userNip;

    if (mark_all) {
      const { error } = await supabaseAdmin
        .from('cooperative_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .or(`recipient_nip.eq.${nip},recipient_id.eq.${authProfile.id}`)
        .eq('is_read', false);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
    }

    if (!notification_id) {
      return NextResponse.json({ error: 'Notification ID diperlukan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('cooperative_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notification_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Notifications PATCH error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
