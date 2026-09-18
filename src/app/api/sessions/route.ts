import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, pruneOldSessions, resolveUserAuth } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId || userId === 'guest' || userId.startsWith('guest_')) {
      return NextResponse.json({ sessions: [] });
    }

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

    // Block guest users from persisting sessions to DB
    // Guest chat exists only in React state (ephemeral, cleared on session end)
    if (!userId || userId === 'guest' || userId.startsWith('guest_')) {
      const tempId = `sess-${Date.now()}`;
      return NextResponse.json({
        session: {
          id: tempId,
          user_id: userId,
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      });
    }

    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title,
      })
      .select('*')
      .single();

    if (error) {
      console.warn('Could not insert chat session to Supabase DB (using fallback):', error.message);
      // Fallback session so UI never crashes even if RLS blocks
      const fallbackSession = {
        id: crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`,
        user_id: userId,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return NextResponse.json({ session: fallbackSession });
    }

    // Prune so user only has max 10 active sessions
    await pruneOldSessions(userId);

    return NextResponse.json({ session });
  } catch (err: any) {
    console.error('Session POST error:', err);
    const fallbackSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`,
      user_id: 'user',
      title: 'Chat Baru',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json({ session: fallbackSession });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, is_archived } = body;

    if (!id) {
      return NextResponse.json({ error: 'Parameter id wajib diisi' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof title === 'string') updatePayload.title = title;
    if (typeof is_archived === 'boolean') updatePayload.is_archived = is_archived;

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .update(updatePayload)
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
