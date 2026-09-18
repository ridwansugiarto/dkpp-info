import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { isAuthorizedAdmin } from '@/lib/polling/guards';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';
import { memoryVotes } from '@/lib/polling/store';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); }
        }
      }
    );

    const body = await request.json().catch(() => ({}));
    const { poll_id, reason, adminEmail, adminUserId, adminNip } = body;

    // 1. Verifikasi Izin Superadmin
    let callerEmail: string | null = null;
    let callerId: string | null = null;

    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      callerEmail = user.email || null;
      callerId = user.id;
    }

    if (!callerEmail && (adminEmail || adminUserId || adminNip)) {
      const authProfile = await resolveUserAuth(adminEmail, adminUserId, adminNip);
      if (authProfile && authProfile.role === 'ADMIN') {
        callerEmail = authProfile.email;
        callerId = authProfile.id;
      }
    }

    const isAdmin = isAuthorizedAdmin(callerEmail);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN: Hanya Super Administrator yang berwenang melihat log aktivitas dan identitas pemilih.' },
        { status: 403 }
      );
    }

    if (!poll_id) {
      return NextResponse.json({ error: 'poll_id wajib disertakan.' }, { status: 400 });
    }

    const cleanCode = poll_id.replace(/^poll-/, '');
    const foundTheme = OFFICIAL_POLL_THEMES.find((t) => t.code === cleanCode || t.id === poll_id);
    const targetPollId = foundTheme ? foundTheme.id : poll_id;

    // Ambil seluruh varian ID dari database polls dengan aman
    const idSet = new Set<string>([poll_id, cleanCode, `poll-${cleanCode}`, targetPollId].filter(Boolean));
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(poll_id);
      let query = supabaseAdmin.from('polls').select('id, code');
      if (isUUID) {
        query = query.or(`id.eq.${poll_id},code.eq.${cleanCode}`);
      } else {
        query = query.eq('code', cleanCode);
      }
      const { data: dbPolls } = await query;
      if (dbPolls && dbPolls.length > 0) {
        for (const p of dbPolls) {
          if (p.id) idSet.add(p.id);
          if (p.code) idSet.add(p.code);
        }
      }
    } catch {}

    const pollIdVariants = Array.from(idSet);

    // 2. Catat AUDIT LOG bahwa superadmin membuka detail aktivitas
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Browser';

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: callerId,
      action: 'ADMIN_VIEW_VOTER_IDENTITY',
      poll_id: poll_id,
      payload: {
        admin_email: callerEmail,
        poll_code: cleanCode,
        reason: reason || 'Audit integritas data dan keamanan sistem polling',
        timestamp: new Date().toISOString()
      },
      ip_address: ip,
      user_agent: userAgent
    });

    // 3. Ambil data Audit Logs vote untuk mendapatkan email dan IP
    const { data: submitLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('action', 'SUBMIT_POLL_VOTE')
      .in('poll_id', pollIdVariants)
      .order('created_at', { ascending: false });

    const userMetaMap = new Map<string, { email?: string; ip?: string; user_agent?: string }>();
    for (const log of submitLogs || []) {
      if (log.actor_user_id && !userMetaMap.has(log.actor_user_id)) {
        userMetaMap.set(log.actor_user_id, {
          email: log.payload?.email || undefined,
          ip: log.ip_address || undefined,
          user_agent: log.user_agent || undefined,
        });
      }
    }

    // 4. Ambil data votes dari Supabase Database
    const { data: dbVotes } = await supabaseAdmin
      .from('votes')
      .select('id, user_id, poll_id, created_at, employee_id')
      .in('poll_id', pollIdVariants)
      .order('created_at', { ascending: false });

    // Gabungkan dengan Memory Store
    const combinedVotes = [...(dbVotes || [])];
    const memoryMatched = memoryVotes.filter(
      (mv) => pollIdVariants.includes(mv.poll_id) || pollIdVariants.includes(mv.poll_id.replace(/^poll-/, ''))
    );

    for (const mv of memoryMatched) {
      if (!combinedVotes.some((cv) => cv.user_id === mv.user_id && cv.employee_id === mv.employee_id)) {
        combinedVotes.push({
          id: `mem-${mv.user_id}-${mv.employee_id}`,
          user_id: mv.user_id,
          poll_id: mv.poll_id,
          created_at: mv.created_at,
          employee_id: mv.employee_id,
        });
      }
    }

    // Kelompokkan per user_id
    const userVotesMap = new Map<string, any>();
    for (const v of combinedVotes) {
      if (!userVotesMap.has(v.user_id)) {
        const meta = userMetaMap.get(v.user_id);
        userVotesMap.set(v.user_id, {
          user_id: v.user_id,
          email: meta?.email || (v.user_id.includes('@') ? v.user_id : 'User DKPP'),
          ip_address: meta?.ip || ip,
          user_agent: meta?.user_agent || userAgent,
          voted_at: v.created_at,
          choices: []
        });
      }

      // Cari profil pegawai dari master data
      const emp = OFFICIAL_DKPP_PEGAWAI.find(
        (p) => p.id === v.employee_id || p.nip === v.employee_id || p.nama.toLowerCase() === v.employee_id.toLowerCase()
      );

      userVotesMap.get(v.user_id).choices.push({
        vote_id: v.id,
        employee_id: v.employee_id,
        full_name: emp?.nama || v.employee_id,
        position: emp?.jabatan || 'Pegawai DKPP Kota Cilegon',
        unit: emp?.bidang || 'DKPP'
      });
    }

    const voterDetails = Array.from(userVotesMap.values());

    return NextResponse.json({
      success: true,
      total_voters: voterDetails.length,
      voters: voterDetails,
      audit_logs: submitLogs || [],
      audit_note: 'Akses identitas pemilih telah dicatat ke Audit Log sesuai standar kepatuhan.'
    });
  } catch (err: any) {
    console.error('Admin voters view error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memproses data pemilih.' }, { status: 500 });
  }
}
