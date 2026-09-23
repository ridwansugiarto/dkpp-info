import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { isAuthorizedAdmin, validateThemeGovernance } from '@/lib/polling/guards';
import { clearMemoryPoll } from '@/lib/polling/store';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';

// Helper verifikasi Superadmin
async function checkAdminAuth(request: Request, body?: any) {
  let callerEmail: string | null = null;
  let callerId: string | null = null;

  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      callerEmail = user.email || null;
      callerId = user.id;
    }
  } catch {}

  const adminEmail = body?.adminEmail || new URL(request.url).searchParams.get('adminEmail');
  const adminUserId = body?.adminUserId || new URL(request.url).searchParams.get('adminUserId');
  const adminNip = body?.adminNip || new URL(request.url).searchParams.get('adminNip');

  if (!callerEmail && (adminEmail || adminUserId || adminNip)) {
    const authProfile = await resolveUserAuth(adminEmail, adminUserId, adminNip);
    if (authProfile && authProfile.role === 'ADMIN') {
      callerEmail = authProfile.email;
      callerId = authProfile.id;
    }
  }

  const authorized = isAuthorizedAdmin(callerEmail);
  return { authorized, callerEmail, callerId };
}

// 1. GET: Ambil seluruh tema polling untuk Panel Superadmin
export async function GET(request: Request) {
  try {
    const { authorized, callerEmail } = await checkAdminAuth(request);
    if (!authorized) {
      return NextResponse.json(
        { error: 'FORBIDDEN: Hanya Super Administrator yang berwenang mengelola tema polling.' },
        { status: 403 }
      );
    }

    // Ambil dari database polls
    const { data: dbPolls, error } = await supabaseAdmin
      .from('polls')
      .select('*')
      .order('created_at', { ascending: true });

    let polls = dbPolls || [];

    // Jika tabel masih kosong, seed otomatis dari OFFICIAL_POLL_THEMES
    if (!error && polls.length === 0 && OFFICIAL_POLL_THEMES.length > 0) {
      try {
        const seedData = OFFICIAL_POLL_THEMES.map((t) => ({
          code: t.code,
          title: t.title,
          short_label: t.short_label,
          icon: t.icon || '🏆',
          description: t.description || '',
          max_choices: t.max_choices || 3,
          allow_self_vote: t.allow_self_vote || false,
          is_active: t.is_active ?? true,
        }));
        const { data: seeded } = await supabaseAdmin.from('polls').insert(seedData).select('*');
        if (seeded && seeded.length > 0) {
          polls = seeded;
        }
      } catch (seedErr) {
        console.warn('Auto seed polls error:', seedErr);
        polls = OFFICIAL_POLL_THEMES as any[];
      }
    }

    // Ambil statistik perolehan suara per tema
    const { data: votesCount } = await supabaseAdmin
      .from('votes')
      .select('poll_id');

    const votesCountMap = new Map<string, number>();
    if (votesCount) {
      for (const v of votesCount) {
        if (v.poll_id) {
          votesCountMap.set(v.poll_id, (votesCountMap.get(v.poll_id) || 0) + 1);
        }
      }
    }

    const enhancedPolls = polls.map((p) => {
      const voteCount = votesCountMap.get(p.id) || votesCountMap.get(p.code) || 0;
      return {
        ...p,
        total_votes: voteCount,
      };
    });

    return NextResponse.json({
      success: true,
      polls: enhancedPolls,
    });
  } catch (err: any) {
    console.error('Admin GET polls error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memuat daftar tema.' }, { status: 500 });
  }
}

// 2. POST: Tambah Tema Polling Baru
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { authorized, callerEmail, callerId } = await checkAdminAuth(request, body);

    if (!authorized) {
      return NextResponse.json(
        { error: 'FORBIDDEN: Hanya Super Administrator yang berwenang menambah tema polling.' },
        { status: 403 }
      );
    }

    const { code, title, short_label, icon, description, max_choices, is_active } = body;

    if (!code || !title || !short_label) {
      return NextResponse.json(
        { error: 'Kode (slug), Judul Polling, dan Label Pendek wajib diisi.' },
        { status: 400 }
      );
    }

    // Governance Check
    const gov = validateThemeGovernance(title, description || '');
    if (!gov.valid) {
      return NextResponse.json(
        { error: `Peringatan Governance: Judul mengandung kata tidak pantas "${gov.blockedWord}". Hindari kategori yang bernuansa negatif, SARA, atau kondisi fisik/ekonomi.` },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Cek duplikasi kode
    const { data: existing } = await supabaseAdmin
      .from('polls')
      .select('id')
      .eq('code', cleanCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Tema dengan kode slug "${cleanCode}" sudah digunakan. Silakan gunakan kode lain.` },
        { status: 400 }
      );
    }

    const newPollData = {
      code: cleanCode,
      title: title.trim(),
      short_label: short_label.trim(),
      icon: icon?.trim() || '🏆',
      description: (description || '').trim(),
      max_choices: typeof max_choices === 'number' ? Math.max(1, Math.min(3, max_choices)) : 3,
      allow_self_vote: false,
      is_active: is_active !== false,
    };

    const { data: created, error } = await supabaseAdmin
      .from('polls')
      .insert([newPollData])
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Catat ke Audit Log
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Browser';

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: callerId,
      action: 'ADMIN_CREATE_POLL_THEME',
      poll_id: created.id,
      payload: {
        admin_email: callerEmail,
        theme_code: cleanCode,
        theme_title: title,
        timestamp: new Date().toISOString(),
      },
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Tema polling "${title}" berhasil dibuat!`,
      poll: created,
    });
  } catch (err: any) {
    console.error('Admin POST poll error:', err);
    return NextResponse.json({ error: err.message || 'Gagal membuat tema baru.' }, { status: 500 });
  }
}

// 3. PUT / PATCH: Ubah / Edit Tema Polling yang Ada
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { authorized, callerEmail, callerId } = await checkAdminAuth(request, body);

    if (!authorized) {
      return NextResponse.json(
        { error: 'FORBIDDEN: Hanya Super Administrator yang berwenang mengubah tema polling.' },
        { status: 403 }
      );
    }

    const { id, code, title, short_label, icon, description, max_choices, is_active } = body;

    if (!id && !code) {
      return NextResponse.json({ error: 'ID atau kode tema polling wajib disertakan.' }, { status: 400 });
    }

    // Governance Check jika title/desc diupdate
    if (title || description) {
      const gov = validateThemeGovernance(title || '', description || '');
      if (!gov.valid) {
        return NextResponse.json(
          { error: `Peringatan Governance: Judul mengandung kata tidak pantas "${gov.blockedWord}".` },
          { status: 400 }
        );
      }
    }

    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (short_label !== undefined) updateFields.short_label = short_label.trim();
    if (icon !== undefined) updateFields.icon = icon.trim() || '🏆';
    if (description !== undefined) updateFields.description = description.trim();
    if (typeof max_choices === 'number') updateFields.max_choices = Math.max(1, Math.min(3, max_choices));
    if (is_active !== undefined) updateFields.is_active = Boolean(is_active);

    let query = supabaseAdmin.from('polls').update(updateFields);
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('code', code);
    }

    const { data: updated, error } = await query.select('*').single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Catat ke Audit Log
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Browser';

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: callerId,
      action: 'ADMIN_UPDATE_POLL_THEME',
      poll_id: updated.id,
      payload: {
        admin_email: callerEmail,
        theme_code: updated.code,
        changes: updateFields,
        timestamp: new Date().toISOString(),
      },
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Tema polling "${updated.title}" berhasil diperbarui!`,
      poll: updated,
    });
  } catch (err: any) {
    console.error('Admin PUT poll error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mengubah tema polling.' }, { status: 500 });
  }
}

// 4. DELETE: Hapus Tema Polling
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { authorized, callerEmail, callerId } = await checkAdminAuth(request, body);

    if (!authorized) {
      return NextResponse.json(
        { error: 'FORBIDDEN: Hanya Super Administrator yang berwenang menghapus tema polling.' },
        { status: 403 }
      );
    }

    const id = body?.id || new URL(request.url).searchParams.get('id');
    const code = body?.code || new URL(request.url).searchParams.get('code');
    const reason = body?.reason || 'Penghapusan tema polling oleh Super Admin';

    if (!id && !code) {
      return NextResponse.json({ error: 'ID atau kode tema polling wajib disertakan.' }, { status: 400 });
    }

    // Ambil detail poll sebelum dihapus
    let query = supabaseAdmin.from('polls').select('*');
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('code', code);
    }
    const { data: targetPoll } = await query.maybeSingle();

    if (!targetPoll) {
      return NextResponse.json({ error: 'Tema polling tidak ditemukan di database.' }, { status: 404 });
    }

    const pollIdVariants = [targetPoll.id, targetPoll.code, `poll-${targetPoll.code}`].filter(Boolean);

    // 1. Hapus relasi di votes, poll_participations, dan poll_results
    await supabaseAdmin.from('votes').delete().in('poll_id', pollIdVariants);
    await supabaseAdmin.from('poll_participations').delete().in('poll_id', pollIdVariants);
    await supabaseAdmin.from('poll_results').delete().in('poll_id', pollIdVariants);

    // 2. Bersihkan di memory store
    clearMemoryPoll(pollIdVariants);

    // 3. Hapus entri polls
    const { error: delError } = await supabaseAdmin.from('polls').delete().eq('id', targetPoll.id);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    // 4. Catat ke Audit Log
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Browser';

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: callerId,
      action: 'ADMIN_DELETE_POLL_THEME',
      poll_id: targetPoll.id,
      payload: {
        admin_email: callerEmail,
        deleted_theme_code: targetPoll.code,
        deleted_theme_title: targetPoll.title,
        reason: reason,
        timestamp: new Date().toISOString(),
      },
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Tema polling "${targetPoll.title}" dan seluruh data suaranya berhasil dihapus secara permanen.`,
    });
  } catch (err: any) {
    console.error('Admin DELETE poll error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menghapus tema polling.' }, { status: 500 });
  }
}
