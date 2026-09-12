import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, pruneOldSessions, resolveUserAuth } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'guest';

    const { data: sessions, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch {
    return NextResponse.json({ error: 'Gagal memuat sesi chat' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || 'guest';
    const title = body.title || 'Chat Baru';

    // Create session
    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Prune so user only has max 10 active sessions
    await pruneOldSessions(userId);

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: 'Gagal membuat sesi chat' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title } = body;

    if (!id || !title) {
      return NextResponse.json({ error: 'Parameter id dan title wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  } catch {
    return NextResponse.json({ error: 'Gagal mengubah judul sesi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID sesi tidak ditemukan' }, { status: 400 });
    }

    // Cascade delete or archive
    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus sesi' }, { status: 500 });
  }
}
