import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { isAuthorizedAdmin } from '@/lib/polling/guards';
import { clearMemoryPoll, deleteUserMemoryVotes, deleteCandidateMemoryVotes } from '@/lib/polling/store';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';

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
    const {
      action,
      poll_id,
      user_id,
      user_email,
      employee_id,
      employee_name,
      vote_id,
      reason,
      adminEmail,
      adminUserId,
      adminNip
    } = body;

    // 1. Verifikasi Superadmin / Admin Access
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
        { error: 'FORBIDDEN: Hanya Super Admin / Administrator Berwenang yang dapat menghapus data polling.' },
        { status: 403 }
      );
    }

    if (!poll_id) {
      return NextResponse.json({ error: 'poll_id wajib disertakan.' }, { status: 400 });
    }

    const cleanCode = poll_id.replace(/^poll-/, '');
    const foundTheme = OFFICIAL_POLL_THEMES.find((t) => t.code === cleanCode || t.id === poll_id);
    const targetPollId = foundTheme ? foundTheme.id : poll_id;

    // Ambil seluruh varian ID dari database polls dengan aman (hindari PostgREST syntax error pada kolom UUID)
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
    } catch (err) {
      console.warn('Could not resolve poll IDs from db:', err);
    }

    const pollIdVariants = Array.from(idSet);

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Browser';

    // 2. Eksekusi Sesuai Aksi

    // Aksi 1: RESET SELURUH POLLING TEMA INI
    if (action === 'RESET_POLL') {
      await supabaseAdmin.from('votes').delete().in('poll_id', pollIdVariants);
      await supabaseAdmin.from('poll_participations').delete().in('poll_id', pollIdVariants);
      await supabaseAdmin.from('poll_results').delete().in('poll_id', pollIdVariants);

      // Bersihkan juga di memory store
      clearMemoryPoll(pollIdVariants);

      // Catat ke Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: callerId,
        action: 'ADMIN_RESET_POLL_DATA',
        poll_id: poll_id,
        payload: {
          admin_email: callerEmail,
          poll_code: cleanCode,
          reason: reason || 'Reset seluruh perolehan suara polling oleh Admin untuk audit',
          timestamp: new Date().toISOString()
        },
        ip_address: ip,
        user_agent: userAgent
      });

      return NextResponse.json({
        success: true,
        message: `Seluruh suara untuk tema polling "${foundTheme?.title || cleanCode}" berhasil direset dan dihapus secara aman.`
      });
    }

    // Aksi 2: HAPUS SUARA KANDIDAT PEGAWAI SPESIFIK (Universal untuk Semua Pegawai & 15 Tema)
    if (action === 'DELETE_CANDIDATE_VOTE') {
      const targetEmp = (employee_id || employee_name || '').trim();
      if (!targetEmp) {
        return NextResponse.json({ error: 'employee_id atau employee_name wajib disertakan.' }, { status: 400 });
      }

      const targetEmpLower = targetEmp.toLowerCase();
      const targetNameLower = (employee_name || '').toLowerCase();

      // Cari semua kemungkinan pegawai di master data (ID, NIP, NIP formatted, Nama Lengkap, Nama tanpa gelar)
      const matchedEmployees = OFFICIAL_DKPP_PEGAWAI.filter((p) => {
        const pNamaLower = p.nama.toLowerCase();
        const pNipClean = p.nip ? p.nip.replace(/\s+/g, '') : '';
        const targetClean = targetEmp.replace(/\s+/g, '');
        return (
          p.id === targetEmp ||
          p.nip === targetEmp ||
          pNipClean === targetClean ||
          pNamaLower === targetEmpLower ||
          pNamaLower === targetNameLower ||
          pNamaLower.includes(targetEmpLower) ||
          targetEmpLower.includes(pNamaLower) ||
          (targetNameLower && pNamaLower.includes(targetNameLower))
        );
      });

      const variantSet = new Set<string>([targetEmp, employee_name, employee_id].filter(Boolean) as string[]);
      for (const emp of matchedEmployees) {
        if (emp.id) variantSet.add(emp.id);
        if (emp.nip) variantSet.add(emp.nip);
        if (emp.nip_formatted) variantSet.add(emp.nip_formatted);
        if (emp.nama) variantSet.add(emp.nama);
      }

      // Query database votes & poll_results untuk menangkap employee_id persis yang tersimpan
      try {
        const { data: dbVotes } = await supabaseAdmin
          .from('votes')
          .select('employee_id')
          .in('poll_id', pollIdVariants);

        if (dbVotes && dbVotes.length > 0) {
          for (const dv of dbVotes) {
            if (!dv.employee_id) continue;
            const devLower = dv.employee_id.toLowerCase();
            if (
              variantSet.has(dv.employee_id) ||
              devLower === targetEmpLower ||
              devLower === targetNameLower ||
              devLower.includes(targetEmpLower) ||
              targetEmpLower.includes(devLower)
            ) {
              variantSet.add(dv.employee_id);
            }
          }
        }

        const { data: dbResults } = await supabaseAdmin
          .from('poll_results')
          .select('employee_id')
          .in('poll_id', pollIdVariants);

        if (dbResults && dbResults.length > 0) {
          for (const dr of dbResults) {
            if (!dr.employee_id) continue;
            const derLower = dr.employee_id.toLowerCase();
            if (
              variantSet.has(dr.employee_id) ||
              derLower === targetEmpLower ||
              derLower === targetNameLower ||
              derLower.includes(targetEmpLower) ||
              targetEmpLower.includes(derLower)
            ) {
              variantSet.add(dr.employee_id);
            }
          }
        }
      } catch (err) {
        console.warn('Error reading DB employee variants:', err);
      }

      const empVariants = Array.from(variantSet);

      // 1. Hapus entri dari tabel votes di Supabase
      await supabaseAdmin
        .from('votes')
        .delete()
        .in('poll_id', pollIdVariants)
        .in('employee_id', empVariants);

      // 2. Hapus dari tabel agregat poll_results di Supabase
      await supabaseAdmin
        .from('poll_results')
        .delete()
        .in('poll_id', pollIdVariants)
        .in('employee_id', empVariants);

      // 3. Bersihkan dari in-memory store
      for (const ev of empVariants) {
        deleteCandidateMemoryVotes(pollIdVariants, ev);
      }

      const candidateDisplayName = matchedEmployees[0]?.nama || employee_name || targetEmp;

      // 4. Catat ke Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: callerId,
        action: 'ADMIN_DELETE_CANDIDATE_VOTE',
        poll_id: poll_id,
        payload: {
          admin_email: callerEmail,
          candidate_name: candidateDisplayName,
          candidate_id: targetEmp,
          matched_variants: empVariants,
          reason: reason || 'Penghapusan suara kandidat oleh Super Admin untuk audit',
          timestamp: new Date().toISOString()
        },
        ip_address: ip,
        user_agent: userAgent
      });

      return NextResponse.json({
        success: true,
        message: `Seluruh suara untuk kandidat "${candidateDisplayName}" berhasil dihapus dari tema ini.`
      });
    }

    // Aksi 3: HAPUS PILIHAN / SUARA DARI AKUN USER (GMAIL / USER ID)
    if (action === 'DELETE_USER_VOTE') {
      const targetUser = (user_id || user_email || '').trim();
      if (!targetUser) {
        return NextResponse.json({ error: 'user_id atau user_email wajib disertakan.' }, { status: 400 });
      }

      const userVariants = Array.from(new Set([targetUser, user_id, user_email].filter(Boolean))) as string[];

      // Ambil suara user sebelum dihapus untuk mengoreksi agregat poll_results
      const { data: userVotes } = await supabaseAdmin
        .from('votes')
        .select('employee_id')
        .in('poll_id', pollIdVariants)
        .in('user_id', userVariants);

      // 1. Hapus dari votes & participations
      await supabaseAdmin
        .from('votes')
        .delete()
        .in('poll_id', pollIdVariants)
        .in('user_id', userVariants);

      await supabaseAdmin
        .from('poll_participations')
        .delete()
        .in('poll_id', pollIdVariants)
        .in('user_id', userVariants);

      // 2. Koreksi atau hapus agregat di poll_results
      if (userVotes && userVotes.length > 0) {
        for (const uv of userVotes) {
          const { data: cur } = await supabaseAdmin
            .from('poll_results')
            .select('total_votes')
            .in('poll_id', pollIdVariants)
            .eq('employee_id', uv.employee_id)
            .maybeSingle();

          if (cur) {
            const updated = Math.max(0, (cur.total_votes || 0) - 1);
            if (updated <= 0) {
              await supabaseAdmin
                .from('poll_results')
                .delete()
                .in('poll_id', pollIdVariants)
                .eq('employee_id', uv.employee_id);
            } else {
              await supabaseAdmin
                .from('poll_results')
                .update({ total_votes: updated })
                .in('poll_id', pollIdVariants)
                .eq('employee_id', uv.employee_id);
            }
          }
        }
      }

      // 3. Bersihkan dari memory store
      for (const uv of userVariants) {
        deleteUserMemoryVotes(pollIdVariants, uv);
      }

      // 4. Catat ke Audit Log
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: callerId,
        action: 'ADMIN_DELETE_USER_VOTE',
        poll_id: poll_id,
        payload: {
          admin_email: callerEmail,
          target_user_id: targetUser,
          target_user_email: user_email || targetUser,
          reason: reason || 'Penghapusan suara user oleh Admin untuk audit keamanan',
          timestamp: new Date().toISOString()
        },
        ip_address: ip,
        user_agent: userAgent
      });

      return NextResponse.json({
        success: true,
        message: `Pilihan suara dari user (${user_email || targetUser}) berhasil dihapus dan partisipasi telah direset.`
      });
    }

    // Aksi 4: HAPUS SATU ENTRI VOTE BY ID
    if (action === 'DELETE_SINGLE_VOTE') {
      if (!vote_id) {
        return NextResponse.json({ error: 'vote_id wajib disertakan.' }, { status: 400 });
      }

      await supabaseAdmin.from('votes').delete().eq('id', vote_id);

      return NextResponse.json({
        success: true,
        message: 'Entri suara berhasil dihapus.'
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin delete poll error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menghapus data polling.' }, { status: 500 });
  }
}
