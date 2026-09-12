import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth, logAudit } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const authProfile = await resolveUserAuth(userEmail);

    if (authProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus Administrator DKPP' }, { status: 403 });
    }

    const { data: docs, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: docs || [] });
  } catch {
    return NextResponse.json({ error: 'Gagal memuat daftar dokumen' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, filename, folder, category, is_sensitive, visibility, file_size, mime_type } = body;
    
    const authProfile = await resolveUserAuth(userEmail);
    if (authProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Hanya Admin yang dapat mengunggah dokumen' }, { status: 403 });
    }

    const { data: newDoc, error } = await supabaseAdmin
      .from('documents')
      .insert({
        filename,
        folder: folder || 'ketahanan-pangan',
        category: category || 'UMUM',
        is_sensitive: Boolean(is_sensitive),
        visibility: visibility || 'INTERNAL',
        uploaded_by: userEmail,
        file_size: file_size || 0,
        mime_type: mime_type || 'application/pdf',
        status: 'INDEXED',
        indexed_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit({
      userId: authProfile.id,
      action: 'ADMIN_UPLOAD',
      resourceType: 'DOCUMENT',
      resourceId: newDoc.id,
      accessResult: 'SUCCESS',
      metadata: { filename, folder },
    });

    return NextResponse.json({ document: newDoc });
  } catch {
    return NextResponse.json({ error: 'Gagal menambahkan dokumen' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail') || '';

    const authProfile = await resolveUserAuth(userEmail);
    if (authProfile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID dokumen diperlukan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit({
      userId: authProfile.id,
      action: 'ADMIN_DELETE',
      resourceType: 'DOCUMENT',
      resourceId: id,
      accessResult: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus dokumen' }, { status: 500 });
  }
}
