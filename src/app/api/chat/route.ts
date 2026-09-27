import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveUserAuth, logAudit, supabaseAdmin } from '@/lib/supabaseServer';
import { generateChatResponse } from '@/lib/gemini';
import { isSuperAdminGovernanceExempt } from '@/lib/polling/guards';

const chatRequestSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
  userEmail: z.string().optional(),
  userId: z.string().optional(),
  userNip: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Format permintaan tidak valid', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, message, userEmail, userId, userNip } = parseResult.data;

    // 1. Resolve User Authorization server-side (Super Admin, Verified NIP Pegawai, or GUEST)
    const authProfile = await resolveUserAuth(userEmail, userId, userNip);

    // 2. Fetch User Memories (per-user isolation: GUEST NEVER gets persistent user memories)
    let memoryContext = '';
    if (authProfile.id && !authProfile.id.startsWith('guest_') && authProfile.id !== 'guest' && authProfile.role !== 'GUEST') {
      try {
        const { data: memories } = await supabaseAdmin
          .from('user_memories')
          .select('memory_key, memory_value')
          .eq('user_id', authProfile.id);

        if (memories && memories.length > 0) {
          memoryContext = memories
            .map((m) => `${m.memory_key}: ${m.memory_value}`)
            .join('\n');
        }
      } catch (memErr) {
        console.warn('Could not load user memories:', memErr);
      }
    }

    // 3. Prepare Chat History if sessionId is provided
    let conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    if (sessionId) {
      try {
        const { data: history } = await supabaseAdmin
          .from('chat_messages')
          .select('role, content')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(10);

        if (history && history.length > 0) {
          conversationHistory = history.map((h) => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          }));
        }
      } catch (histErr) {
        console.warn('Could not load history:', histErr);
      }
    }

    const isGuestUser = !userId || userId === 'guest' || (userId as string).startsWith('guest_');

    const persistMessages = async (
      userMsg: string,
      aiContent: string,
      toolCalls: any[] = [],
      sources: any[] = [],
      mapActions: any[] = []
    ) => {
      let userMsgId = 'msg-user-' + Date.now();
      let assistantMsgId = 'msg-ai-' + Date.now();

      if (sessionId && !isGuestUser) {
        try {
          const { data: insertedUserMsg } = await supabaseAdmin
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              role: 'user',
              content: userMsg,
            })
            .select('id')
            .single();

          if (insertedUserMsg) userMsgId = insertedUserMsg.id;

          const { data: insertedAiMsg } = await supabaseAdmin
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              role: 'assistant',
              content: aiContent,
              sources,
              tool_calls: toolCalls,
              map_actions: mapActions,
            })
            .select('id')
            .single();

          if (insertedAiMsg) assistantMsgId = insertedAiMsg.id;

          await supabaseAdmin
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);
        } catch (dbErr) {
          console.error('Error saving messages to Supabase:', dbErr);
        }
      }

      return { userMsgId, assistantMsgId };
    };

    // 3b. Deteksi Maksud Koperasi (Disambiguasi Koperasi Nelayan vs Koperasi Pegawai DKPP)
    const koperasiNormMsg = (message || '').toLowerCase().trim();

    // 1) Explicit Koperasi Nelayan / Sektor Perikanan / Kelautan binaan DKPP
    const isExplicitNelayan =
      koperasiNormMsg.includes('koperasi nelayan') ||
      koperasiNormMsg.includes('koperasi perikanan') ||
      koperasiNormMsg.includes('koperasi kelautan') ||
      koperasiNormMsg.includes('koperasi kub') ||
      koperasiNormMsg.includes('koperasi pokdakan') ||
      koperasiNormMsg.includes('koperasi poklashar') ||
      (koperasiNormMsg.includes('koperasi') && (
        koperasiNormMsg.includes('nelayan') ||
        koperasiNormMsg.includes('ikan') ||
        koperasiNormMsg.includes('tangkap') ||
        koperasiNormMsg.includes('pembudidaya') ||
        koperasiNormMsg.includes('kub') ||
        koperasiNormMsg.includes('pokdakan') ||
        koperasiNormMsg.includes('poklashar') ||
        koperasiNormMsg.includes('pangkalan')
      ));

    // 2) Explicit Koperasi Pegawai DKPP (Internal KSP)
    const isExplicitKoperasiPegawai =
      !isExplicitNelayan && (
        koperasiNormMsg.includes('koperasi pegawai') ||
        koperasiNormMsg.includes('koperasipegawai') ||
        koperasiNormMsg.includes('koperasi asn') ||
        koperasiNormMsg.includes('koperasi internal') ||
        koperasiNormMsg.includes('dashboard koperasi') ||
        koperasiNormMsg.includes('link koperasi') ||
        koperasiNormMsg.includes('link dashboard') ||
        koperasiNormMsg.includes('tautan koperasi') ||
        koperasiNormMsg.includes('tautan dashboard') ||
        koperasiNormMsg.includes('url koperasi') ||
        koperasiNormMsg.includes('url dashboard') ||
        koperasiNormMsg.includes('simpanan koperasi') ||
        koperasiNormMsg.includes('pinjaman koperasi') ||
        koperasiNormMsg.includes('cicilan koperasi') ||
        koperasiNormMsg.includes('cek simpanan') ||
        koperasiNormMsg.includes('cek pinjaman') ||
        koperasiNormMsg.includes('cek cicilan') ||
        koperasiNormMsg.includes('pengajuan pinjaman') ||
        koperasiNormMsg.includes('ajukan pinjaman') ||
        koperasiNormMsg.includes('sisa cicilan') ||
        koperasiNormMsg.includes('sisa pinjaman') ||
        koperasiNormMsg.includes('berapa simpanan') ||
        koperasiNormMsg.includes('berapa cicilan') ||
        koperasiNormMsg.includes('ksp pegawai') ||
        koperasiNormMsg.includes('koperasi ksp') ||
        (koperasiNormMsg.includes('koperasi') && (
          koperasiNormMsg.includes('pegawai') ||
          koperasiNormMsg.includes('asn') ||
          koperasiNormMsg.includes('pns') ||
          koperasiNormMsg.includes('pppk') ||
          koperasiNormMsg.includes('honorer') ||
          koperasiNormMsg.includes('gaji') ||
          koperasiNormMsg.includes('tpp') ||
          koperasiNormMsg.includes('simpanan') ||
          koperasiNormMsg.includes('pinjaman') ||
          koperasiNormMsg.includes('cicilan') ||
          koperasiNormMsg.includes('angsuran') ||
          koperasiNormMsg.includes('tenor') ||
          koperasiNormMsg.includes('potong gaji') ||
          koperasiNormMsg.includes('pengurus') ||
          koperasiNormMsg.includes('bendahara') ||
          koperasiNormMsg.includes('link') ||
          koperasiNormMsg.includes('tautan') ||
          koperasiNormMsg.includes('dashboard') ||
          koperasiNormMsg.includes('url')
        ))
      );

    // 3) General / Ambiguous Koperasi (e.g. "lihat koperasi", "koperasi", "data koperasi", "info koperasi")
    const isGeneralKoperasi =
      !isExplicitNelayan &&
      !isExplicitKoperasiPegawai &&
      (
        koperasiNormMsg === 'koperasi' ||
        koperasiNormMsg === 'koprasi' ||
        koperasiNormMsg === 'koperas' ||
        koperasiNormMsg.includes('koperasi') ||
        koperasiNormMsg.includes('koprasi')
      );

    // Jalur A: Pertanyaan Umum/Ambigu Koperasi -> Tampilkan Disambiguasi (Nelayan vs Pegawai)
    if (isGeneralKoperasi) {
      const isAdmin = authProfile.email?.toLowerCase() === 'ridwansugiarto.mail@gmail.com';
      const userNip = authProfile.nip;

      let officerRole: string | null = null;
      let memberId: string | null = null;

      if (userNip) {
        try {
          const { data: officer } = await supabaseAdmin
            .from('cooperative_officers')
            .select('role')
            .eq('nip', userNip)
            .eq('is_active', true)
            .maybeSingle();
          if (officer) officerRole = officer.role;

          const { data: member } = await supabaseAdmin
            .from('cooperative_members')
            .select('id')
            .eq('nip', userNip)
            .maybeSingle();
          if (member) memberId = member.id;
        } catch { /* ignore */ }
      }

      const panelData = {
        role: ((isAdmin || officerRole) ? (officerRole || 'admin') : 'anggota') as 'anggota' | 'pengurus' | 'bendahara' | 'entry',
        user_nip: userNip,
        is_verified_member: !!memberId,
        is_officer: !!(officerRole || isAdmin),
        officer_role: (officerRole as any) || (isAdmin ? 'admin' : undefined),
        member_id: memberId || undefined,
        is_disambiguation: true,
      };

      const msgContent = `Di lingkungan **Dinas Ketahanan Pangan dan Pertanian (DKPP) Kota Cilegon**, terdapat 2 (dua) jenis entitas koperasi yang berbeda. **Yang manakah yang Anda maksud?**\n\n1. 🐟 **Koperasi Nelayan & Kelembagaan Binaan DKPP** (Sektor Kelautan & Perikanan)\nWadah kelembagaan ekonomi nelayan tangkap, pembudidaya ikan, dan pengolah hasil perikanan binaan DKPP Kota Cilegon (3 Koperasi Nelayan, 58 KUB Nelayan, 28 Pokdakan, dan 17 Poklashar).\n\n2. 🏦 **Koperasi Pegawai DKPP Kota Cilegon (KSP Internal)**\nLayanan simpan pinjam internal bagi pegawai resmi DKPP Kota Cilegon (pemantauan simpanan, pengajuan pinjaman, dan pemotongan cicilan gaji/TPP).\n👉 **Tautan Langsung**: [Buka Dashboard Koperasi Pegawai](/koperasi/anggota)\n\n_Silakan klik tautan di atas atau pilih salah satu kartu interaktif di bawah ini:_`;

      const { userMsgId, assistantMsgId } = await persistMessages(
        message, msgContent,
        [{ id: 'tool-koperasi-' + Date.now(), name: 'cooperative_panel', status: 'completed', args: panelData }]
      );

      return NextResponse.json({
        sessionId, userMessageId: userMsgId, assistantMessageId: assistantMsgId,
        content: msgContent, type: 'cooperative_panel',
        cooperative_panel: panelData,
        message: {
          id: assistantMsgId, session_id: sessionId || 'temp',
          role: 'assistant', content: msgContent,
          type: 'cooperative_panel', cooperative_panel: panelData,
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role, isVerified: authProfile.is_verified_employee,
      });
    }

    // Jalur B: Eksplisit Koperasi Pegawai DKPP
    if (isExplicitKoperasiPegawai) {
      const isGuestUser2 = authProfile.role === 'GUEST';
      const isCitizenUnverified = authProfile.role === 'CITIZEN' && !authProfile.is_verified_employee;

      // Jika belum login: minta login dulu
      if (isGuestUser2) {
        const msgContent = `🏦 **Koperasi Pegawai DKPP Kota Cilegon**\n\nUntuk mengakses layanan Koperasi Pegawai DKPP, Anda perlu masuk terlebih dahulu menggunakan akun Google.\n\nLayanan yang tersedia:\n* 👤 **[Dashboard Anggota Koperasi](/koperasi/anggota)** — Lihat simpanan, pinjaman, dan cicilan Anda\n* 🏦 **[Dashboard Pengurus Koperasi](/koperasi/pengurus)** — Manajemen koperasi dan monitoring keuangan`;
        const { userMsgId, assistantMsgId } = await persistMessages(message, msgContent, []);
        return NextResponse.json({
          sessionId, userMessageId: userMsgId, assistantMessageId: assistantMsgId,
          content: msgContent, type: 'auth_prompt',
          message: {
            id: assistantMsgId, session_id: sessionId || 'temp',
            role: 'assistant', content: msgContent, type: 'auth_prompt',
            auth_prompt: 'LOGIN_REQUIRED', created_at: new Date().toISOString(),
          },
        });
      }

      // Jika sudah login tapi belum verifikasi NIP
      if (isCitizenUnverified) {
        const msgContent = `🏦 **Koperasi Pegawai DKPP Kota Cilegon**\n\nUntuk mengakses layanan koperasi, Anda perlu memverifikasi NIP kepegawaian Anda terlebih dahulu.\n\nSetelah NIP terverifikasi, Anda dapat mengakses:\n* 👤 **[Dashboard Anggota Koperasi](/koperasi/anggota)** — Melihat simpanan & pinjaman Anda\n* 📋 Mengajukan pinjaman online\n* 📊 Memantau jadwal cicilan gaji/TPP`;
        const { userMsgId, assistantMsgId } = await persistMessages(message, msgContent, []);
        return NextResponse.json({
          sessionId, userMessageId: userMsgId, assistantMessageId: assistantMsgId,
          content: msgContent, type: 'auth_prompt',
          message: {
            id: assistantMsgId, session_id: sessionId || 'temp',
            role: 'assistant', content: msgContent, type: 'auth_prompt',
            auth_prompt: 'NIP_REQUIRED', created_at: new Date().toISOString(),
          },
        });
      }

      // User sudah terverifikasi — cek apakah officer atau anggota biasa
      const isAdmin = authProfile.email?.toLowerCase() === 'ridwansugiarto.mail@gmail.com';
      const userNip = authProfile.nip;

      let officerRole: string | null = null;
      let memberId: string | null = null;

      if (userNip) {
        try {
          // Cek apakah pengurus
          const { data: officer } = await supabaseAdmin
            .from('cooperative_officers')
            .select('role')
            .eq('nip', userNip)
            .eq('is_active', true)
            .maybeSingle();
          if (officer) officerRole = officer.role;

          // Ambil member_id
          const { data: member } = await supabaseAdmin
            .from('cooperative_members')
            .select('id')
            .eq('nip', userNip)
            .maybeSingle();
          if (member) memberId = member.id;
        } catch { /* ignore */ }
      }

      const panelData = {
        role: ((isAdmin || officerRole) ? (officerRole || 'admin') : 'anggota') as 'anggota' | 'pengurus' | 'bendahara' | 'entry',
        user_nip: userNip,
        is_verified_member: !!memberId,
        is_officer: !!(officerRole || isAdmin),
        officer_role: (officerRole as any) || (isAdmin ? 'admin' : undefined),
        member_id: memberId || undefined,
        is_disambiguation: false,
      };

      const msgContent = `🏦 **Koperasi Pegawai DKPP Kota Cilegon**\n\nSalam, **${authProfile.full_name}**! Berikut tautan langsung menuju dashboard layanan Koperasi Pegawai DKPP Kota Cilegon:\n\n* 👤 **[Dashboard Anggota Koperasi](/koperasi/anggota)** — Pantau simpanan pokok/wajib/sukarela, saldo pinjaman aktif, jadwal cicilan, dan formulir pengajuan pinjaman baru.\n${panelData.is_officer ? '* 🏦 **[Dashboard Pengurus Koperasi](/koperasi/pengurus)** — Ringkasan kas koperasi, persetujuan pengajuan pinjaman, monitoring kredit lancar/macet, dan verifikasi anggota.\n' : ''}${panelData.officer_role === 'bendahara' || panelData.officer_role === 'admin' ? '* 💰 **[Panel Bendahara Koperasi](/koperasi/bendahara)** — Input data manual/Excel, pencatatan angsuran, mutasi kas, dan konfigurasi bunga/plafon koperasi.\n' : ''}\n🔗 **Tautan Langsung:**\n* 👉 **[Buka Dashboard Anggota](/koperasi/anggota)**\n${panelData.is_officer ? '* 👉 **[Buka Dashboard Pengurus](/koperasi/pengurus)**\n' : ''}${panelData.officer_role === 'bendahara' || panelData.officer_role === 'admin' ? '* 👉 **[Buka Panel Bendahara](/koperasi/bendahara)**\n' : ''}\n_Data keuangan Anda terlindungi dan dapat diakses dengan mengeklik tautan di atas atau menggunakan panel interaktif di bawah ini._`;

      const { userMsgId, assistantMsgId } = await persistMessages(
        message, msgContent,
        [{ id: 'tool-koperasi-' + Date.now(), name: 'cooperative_panel', status: 'completed', args: panelData }]
      );

      return NextResponse.json({
        sessionId, userMessageId: userMsgId, assistantMessageId: assistantMsgId,
        content: msgContent, type: 'cooperative_panel',
        cooperative_panel: panelData,
        message: {
          id: assistantMsgId, session_id: sessionId || 'temp',
          role: 'assistant', content: msgContent,
          type: 'cooperative_panel', cooperative_panel: panelData,
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role, isVerified: authProfile.is_verified_employee,
      });
    }

    // 4. Deteksi Maksud Polling Pegawai (AI Intent Detection)
    const { detectPollingIntent } = await import('@/lib/polling/intent');
    const { getActivePollThemes } = await import('@/lib/polling/store');
    const activeThemes = await getActivePollThemes();
    const pollIntent = detectPollingIntent(message, activeThemes);

    if (pollIntent.intent === 'EMPLOYEE_POLL' && pollIntent.category && (pollIntent.confidence ?? 0) >= 0.8) {

      const isGovExempt = isSuperAdminGovernanceExempt(authProfile?.email, authProfile?.nip);
      const isVerifiedEmployee = !!authProfile.is_verified_employee || isGovExempt;

      // PEMBATASAN AKSES KETAT:
      // Polling pegawai, hak voting, dan live hasil polling HANYA dapat diakses oleh pegawai dengan NIP terverifikasi & Superadmin.
      // Masyarakat umum, tamu, atau user yang belum verifikasi NIP TIDAK BOLEH melihat hasil maupun memberikan suara!
      if (!isVerifiedEmployee) {
        const professionalRestrictedNotice =
          `Yth. Bapak/Ibu Pengguna Layanan,\n\n` +
          `Terima kasih atas perhatian dan apresiasi Anda terhadap keluarga besar Dinas Ketahanan Pangan dan Pertanian (DKPP) Kota Cilegon.\n\n` +
          `Sehubungan dengan pertanyaan atau pencarian informasi Anda mengenai **Polling Pegawai & Hasil Suara Live**, kami informasikan bahwa fitur partisipasi pemberian suara (*voting*) serta tayangan perolehan hasil polling bersifat **terbatas (internal)** dan **hanya dapat ditampilkan kepada Pegawai Resmi DKPP Kota Cilegon yang telah terverifikasi melalui Nomor Induk Pegawai (NIP)**.\n\n` +
          `Kebijakan ini diberlakukan demi menjunjung tinggi kode etik kepegawaian aparatur sipil negara, menjaga kerahasiaan dan privasi aparatur sipil, serta memastikan iklim kerja dan dinamika kepegawaian di lingkungan dinas senantiasa profesional, kondusif, dan berintegritas.\n\n` +
          (authProfile.role === 'GUEST'
            ? `🔐 **Petunjuk Akses Pegawai:**\nApabila Anda merupakan Pegawai Resmi DKPP Kota Cilegon, silakan masuk menggunakan akun Google Anda terlebih dahulu, kemudian lakukan verifikasi NIP pada profil akun untuk membuka akses fitur dan hasil polling secara penuh.\n\n`
            : `🔐 **Petunjuk Verifikasi NIP:**\nAkun Anda saat ini tercatat sebagai pengguna umum dan belum memiliki verifikasi NIP kepegawaian. Apabila Anda merupakan aparatur sipil DKPP Kota Cilegon, silakan selesaikan proses **Verifikasi NIP** melalui profil akun Anda untuk membuka akses hasil dan hak partisipasi polling.\n\n`) +
          `*Bagi masyarakat umum, Anda dipersilakan untuk memanfaatkan layanan informasi publik kami lainnya, seperti data ketahanan pangan daerah, informasi teknis pertanian & peternakan, serta pemantauan live harga pangan strategis harian.*`;

        const promptType = authProfile.role === 'GUEST' ? 'LOGIN_REQUIRED' : 'NIP_REQUIRED';

        const { userMsgId, assistantMsgId } = await persistMessages(
          message,
          professionalRestrictedNotice,
          []
        );

        return NextResponse.json({
          sessionId,
          userMessageId: userMsgId,
          assistantMessageId: assistantMsgId,
          content: professionalRestrictedNotice,
          type: 'auth_prompt',
          message: {
            id: assistantMsgId,
            session_id: sessionId || 'temp',
            role: 'assistant',
            content: professionalRestrictedNotice,
            type: 'auth_prompt',
            auth_prompt: promptType,
            created_at: new Date().toISOString(),
          },
          userRole: authProfile.role,
          isVerified: false,
        });
      }

      if (pollIntent.category === 'carousel') {
        const lowerMsg = message.toLowerCase();
        let initialCode = activeThemes[0]?.code || 'cantik';
        const foundTheme = activeThemes.find(t => 
          lowerMsg.includes(t.code) || 
          lowerMsg.includes(t.short_label.toLowerCase()) || 
          lowerMsg.includes(t.title.toLowerCase())
        );
        if (foundTheme) {
          initialCode = foundTheme.code;
        }

        const carouselText = `🎠 **Live Carousel Hasil Polling Pegawai (${activeThemes.length} Tema DKPP)**\n\nBerikut tampilan live perolehan suara ${activeThemes.length} tema polling apresiasi keluarga besar DKPP Kota Cilegon. Anda dapat menggeser tema, menjeda putar otomatis (*auto-slide*), atau langsung memberikan suara!`;

        const { userMsgId, assistantMsgId } = await persistMessages(
          message,
          carouselText,
          [
            {
              id: 'tool-poll-carousel-' + Date.now(),
              name: 'poll_carousel',
              status: 'completed',
              args: {
                initialThemeCode: initialCode,
              },
            },
          ]
        );

        return NextResponse.json({
          sessionId,
          userMessageId: userMsgId,
          assistantMessageId: assistantMsgId,
          content: carouselText,
          type: 'poll_carousel',
          poll_carousel: {
            themes: activeThemes,
            initialThemeCode: initialCode,
          },
          message: {
            id: assistantMsgId,
            session_id: sessionId || 'temp',
            role: 'assistant',
            content: carouselText,
            type: 'poll_carousel',
            poll_carousel: {
              themes: activeThemes,
              initialThemeCode: initialCode,
            },
            created_at: new Date().toISOString(),
          },
          userRole: authProfile.role,
          isVerified: authProfile.is_verified_employee,
        });
      }

      if (pollIntent.category === 'all') {
        const responseText = `🏆 **Katalog ${activeThemes.length} Tema Polling Pegawai DKPP Kota Cilegon**\n\nSilakan pilih tema polling yang ingin Anda ikuti di bawah ini. Anda dapat memilih 1 hingga 3 nama rekan kerja per tema secara aman & 100% anonim.`;

        const { userMsgId, assistantMsgId } = await persistMessages(
          message,
          responseText,
          [
            {
              id: 'tool-poll-catalog-' + Date.now(),
              name: 'poll_catalog',
              status: 'completed',
              args: {},
            },
          ]
        );

        return NextResponse.json({
          sessionId,
          userMessageId: userMsgId,
          assistantMessageId: assistantMsgId,
          content: responseText,
          type: 'poll_catalog',
          poll_catalog: {
            themes: activeThemes,
          },
          message: {
            id: assistantMsgId,
            session_id: sessionId || 'temp',
            role: 'assistant',
            content: responseText,
            type: 'poll_catalog',
            poll_catalog: {
              themes: activeThemes,
            },
            created_at: new Date().toISOString(),
          },
          userRole: authProfile.role,
          isVerified: authProfile.is_verified_employee,
        });
      }

      // Ambil tema poll yang cocok
      const targetTheme = activeThemes.find((t) => t.code === pollIntent.category) || activeThemes[0];
      let activePoll = { ...targetTheme };

      try {
        const { data: dbPoll } = await supabaseAdmin
          .from('polls')
          .select('*')
          .eq('code', pollIntent.category)
          .eq('is_active', true)
          .maybeSingle();

        if (dbPoll) {
          activePoll = { ...targetTheme, ...dbPoll };
        }
      } catch (err) {
        console.warn('Could not fetch poll from db:', err);
      }

      // Deteksi apakah user menanyakan siapa, hasil/peringkat, atau menggunakan bentuk superlative (misal "siapa tercantik", "paling cantik", "terajin")
      const lowerMsg = message.toLowerCase();
      const isAskingWhoOrResults =
        /\b(siapa|siapakah|sapa|hasil|peringkat|ranking|podium|skor|perolehan|juara|pemenang|nomor satu|urutan|rekap|top|teratas)\b/i.test(lowerMsg) ||
        /\b(ter[a-z]{3,}|paling\s+[a-z]+)\b/i.test(lowerMsg) ||
        lowerMsg.includes('lihat hasil') ||
        lowerMsg.includes('live hasil');
      const shouldDirectlyShowResults = isAskingWhoOrResults || isGovExempt;

      // Status voting untuk Pegawai Terverifikasi / Super Admin
      let userHasVoted = false;
      let userChoicesCount = 3;
      if (authProfile?.id && !isGovExempt) {
        try {
          const { data: existingPart } = await supabaseAdmin
            .from('poll_participations')
            .select('poll_id, choices_count')
            .eq('poll_id', activePoll.id)
            .eq('user_id', authProfile.id)
            .maybeSingle();

          if (existingPart) {
            userHasVoted = true;
            userChoicesCount = existingPart.choices_count || 3;
          }
        } catch {}
      }

      // Kalimat respon bot untuk Pegawai Terverifikasi & Superadmin
      let botGreeting = '';
      if (isGovExempt) {
        botGreeting = `**Mode Admin**\n\nHalo Pak Ridwan, hak akses aktif tanpa batasan kuota vote.\n\nBerikut hasil live sementara dan formulir untuk tema **"${activePoll.title}"** ${activePoll.icon || ''}:`;
      } else if (isAskingWhoOrResults) {
        botGreeting = `Halo rekan DKPP! Pertanyaan yang sangat menarik dan seru 😊✨\n\nDi lingkungan **DKPP Kota Cilegon**, seluruh rekan pegawai pria maupun wanita tentu memiliki pesona, kepribadian baik, serta dedikasi luar biasa dalam melayani masyarakat dengan sepenuh hati.\n\nSebagai pegawai resmi terverifikasi, berikut kami tampilkan **Hasil Polling Live Terkini** untuk tema **"${activePoll.title}"** ${activePoll.icon || ''} di bawah ini. Anda juga dapat memberikan suara jika belum memilih:`;
      } else if (userHasVoted) {
        botGreeting = `ℹ️ **Pemberitahuan:** Anda sudah memberikan suara sebanyak **${userChoicesCount}x** pada tema **"${activePoll.title}"**.\n\nHak suara Anda untuk tema ini telah digunakan secara lengkap (${userChoicesCount} dari ${activePoll.max_choices || 3} pilihan). Seluruh pilihan Anda tersimpan secara **100% aman, anonim, dan terjamin kerahasiaannya**.\n\nBerikut perolehan suara live sementara atau Anda dapat memilih tema polling lainnya! 🗳️✨`;
      } else {
        botGreeting = `Halo rekan DKPP! Berikut formulir polling tema **"${activePoll.title}"** ${activePoll.icon || ''}.\n\nAnda dapat memilih maksimal ${activePoll.max_choices || 3} orang rekan kerja favorit Anda secara **100% aman, rahasia, dan anonim**.\n\nSilakan tentukan pilihan Anda pada formulir di bawah ini:`;
      }

      const { userMsgId, assistantMsgId } = await persistMessages(
        message,
        botGreeting,
        [
          {
            id: 'tool-poll-card-' + Date.now(),
            name: 'poll_card',
            status: 'completed',
            args: {
              pollCode: activePoll.code,
              pollId: activePoll.id,
              default_show_results: shouldDirectlyShowResults,
            },
          },
        ]
      );

      return NextResponse.json({
        sessionId,
        userMessageId: userMsgId,
        assistantMessageId: assistantMsgId,
        content: botGreeting,
        type: 'poll_card',
        poll_card: {
          poll: activePoll,
          available_themes: activeThemes,
          default_show_results: shouldDirectlyShowResults,
        },
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: botGreeting,
          type: 'poll_card',
          poll_card: {
            poll: activePoll,
            available_themes: activeThemes,
            default_show_results: shouldDirectlyShowResults,
          },
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role,
        isVerified: authProfile.is_verified_employee,
      });
    }

    // 5. Deteksi Maksud Panel Harga Pangan Strategis (SAGON Live & YoY)
    const normMsg = message.toLowerCase();
    const isSagonHargaRequest =
      normMsg.includes('harga pangan strategis') ||
      normMsg.includes('panel harga') ||
      normMsg.includes('sagon live') ||
      normMsg.includes('harga sagon') ||
      normMsg.includes('harga hari ini') ||
      normMsg.includes('harga pangan hari ini') ||
      normMsg.includes('harga pasar') ||
      normMsg.includes('harga komoditas hari ini') ||
      normMsg.includes('harga pangan terkini') ||
      normMsg.includes('harga sembako hari ini') ||
      normMsg.includes('tabel harga pangan') ||
      normMsg.includes('tabel harga komoditas');

    if (
      isSagonHargaRequest &&
      !normMsg.includes('forecast') &&
      !normMsg.includes('peramalan') &&
      !normMsg.includes('proyeksi') &&
      !normMsg.includes('prediksi')
    ) {
      const { getLiveSagonPanelData } = await import('@/lib/harga/sagonService');
      const sagonData = await getLiveSagonPanelData();

      const waspadaItems = sagonData.items.filter((i) => i.status === 'WASPADA');
      const amanItems = sagonData.items.filter((i) => i.status === 'AMAN');

      const summaryText =
        `Berikut data **Panel Harga Pangan Strategis (SAGON LIVE)** rata-rata 3 pasar tradisional se-Kota Cilegon (Pasar Baru Kranggot, Pasar Blok F, dan Pasar Baru Merak) per tanggal **${sagonData.formattedDate}** yang terhubung langsung dengan database real-time Sistem Informasi Pangan Kota Cilegon.\n\n` +
        `### 📊 Status & Ringkasan Pergerakan YoY:\n` +
        `* ⚠️ **Kategori Waspada (Kenaikan > 5% YoY):** ${waspadaItems.map((i) => `**${i.name}** (Rp ${Math.round(i.curr).toLocaleString('id-ID')}, ${i.changeText})`).join(', ') || 'Semua stabil'}\n` +
        `* 🟢 **Kategori Aman / Terkendali:** ${amanItems.map((i) => `**${i.name}** (Rp ${Math.round(i.curr).toLocaleString('id-ID')}, ${i.changeText})`).join(', ') || 'Tidak ada'}\n\n` +
        `💡 *Gunakan tombol navigasi tanggal 📅 di atas tabel untuk melihat arsip harga hari sebelumnya, atau unduh laporan dalam format spreadsheet.*`;

      const { userMsgId, assistantMsgId } = await persistMessages(
        message,
        summaryText,
        [
          {
            id: 'tool-sagon-panel-' + Date.now(),
            name: 'harga_sagon_panel',
            status: 'completed',
            args: {
              date: sagonData.date,
              totalItems: sagonData.items.length,
            },
          },
        ]
      );

      return NextResponse.json({
        sessionId,
        userMessageId: userMsgId,
        assistantMessageId: assistantMsgId,
        content: summaryText,
        type: 'harga_sagon_panel',
        harga_sagon_panel: sagonData,
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: summaryText,
          type: 'harga_sagon_panel',
          harga_sagon_panel: sagonData,
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role,
        isVerified: authProfile.is_verified_employee,
      });
    }

    // 6. Deteksi Maksud Peramalan Harga Pangan (ML Forecasting)
    const isForecastTableRequest =
      normMsg.includes('forecast') ||
      normMsg.includes('peramalan harga') ||
      normMsg.includes('prediksi harga') ||
      normMsg.includes('proyeksi harga') ||
      normMsg.includes('tabel peramalan') ||
      normMsg.includes('tabel forecast') ||
      normMsg.includes('harga pangan ke depan') ||
      normMsg.includes('ml forecasting') ||
      normMsg.includes('ramalan harga') ||
      (normMsg.includes('tren harga') && (normMsg.includes('pangan') || normMsg.includes('komoditas') || normMsg.includes('pasar')));

    if (isForecastTableRequest && !normMsg.includes('faktor pendorong') && !normMsg.includes('mengapa')) {
      const { getLiveForecastTableData } = await import('@/lib/forecast/forecastService');
      const forecastData = await getLiveForecastTableData();

      const upItems = forecastData.items.filter((i) => i.trend === 'up');
      const downItems = forecastData.items.filter((i) => i.trend === 'down');
      const stableItems = forecastData.items.filter((i) => i.trend === 'stable');

      const summaryText = `Berikut tabel **Peramalan Harga Pangan (ML Forecasting)** untuk proyeksi 1 & 3 bulan ke depan di Kota Cilegon yang terintegrasi langsung dengan database real-time Sistem Informasi Pangan Kota Cilegon.\n\n` +
        `### 📊 Ringkasan Tren Pergerakan (+1 Bulan):\n` +
        `* 🔴 **Tren Naik (+1B):** ${upItems.map((i) => `**${i.name}** (+${i.changePct}%)`).join(', ') || 'Tidak ada'}\n` +
        `* 🟢 **Tren Turun (+1B):** ${downItems.map((i) => `**${i.name}** (${i.changePct}%)`).join(', ') || 'Tidak ada'}\n` +
        `* 🟡 **Tren Stabil (+1B):** ${stableItems.map((i) => `**${i.name}** (${i.changePct > 0 ? '+' : ''}${i.changePct}%)`).join(', ') || 'Tidak ada'}\n\n` +
        `💡 *Klik pada baris komoditas pada tabel di bawah untuk melihat ringkasan cepat atau meminta rekomendasi EWS & faktor pendorong dari AI.*`;

      const { userMsgId, assistantMsgId } = await persistMessages(
        message,
        summaryText,
        [
          {
            id: 'tool-forecast-table-' + Date.now(),
            name: 'forecast_table',
            status: 'completed',
            args: {
              totalItems: forecastData.items.length,
              baselineMonth: forecastData.baselineMonth,
              t1Month: forecastData.t1Month,
              t3Month: forecastData.t3Month,
            },
          },
        ]
      );

      return NextResponse.json({
        sessionId,
        userMessageId: userMsgId,
        assistantMessageId: assistantMsgId,
        content: summaryText,
        type: 'forecast_table',
        forecast_table: forecastData,
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: summaryText,
          type: 'forecast_table',
          forecast_table: forecastData,
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role,
        isVerified: authProfile.is_verified_employee,
      });
    }

    // Guard: pertanyaan analitik/strategis harus SELALU diteruskan ke Gemini AI
    // Tidak boleh dipotong oleh quick-panel detectors
    const isAnalyticalQuery =
      normMsg.includes('tantangan') ||
      normMsg.includes('isu') ||
      normMsg.includes('dibenahi') ||
      normMsg.includes('analisis') ||
      normMsg.includes('masalah') ||
      normMsg.includes('permasalahan') ||
      normMsg.includes('rekomendasi') ||
      normMsg.includes('strategi') ||
      normMsg.includes('kenapa') ||
      normMsg.includes('mengapa') ||
      normMsg.includes('bagaimana') ||
      normMsg.includes('hambatan') ||
      normMsg.includes('kendala') ||
      normMsg.includes('solusi') ||
      normMsg.includes('kebijakan') ||
      normMsg.includes('kelemahan') ||
      normMsg.includes('kekurangan') ||
      normMsg.includes('langkah') ||
      normMsg.includes('upaya') ||
      normMsg.includes('neraca') ||
      normMsg.includes('kemandirian') ||
      normMsg.includes('defisit') ||
      normMsg.includes('jelaskan') ||
      normMsg.includes('uraikan') ||
      normMsg.includes('sebutkan') ||
      normMsg.includes('apa saja') ||
      normMsg.includes('komprehensif') ||
      normMsg.includes('mendalam');

    // 7. Deteksi Maksud IKP & PoU 5 Tahun (Captures 1 & 2)
    const isIkpPouRequest =
      normMsg.includes('ikp') ||
      normMsg.includes('pou') ||
      normMsg.includes('indeks ketahanan pangan') ||
      normMsg.includes('prevalensi ketidakcukupan') ||
      normMsg.includes('skor ikp') ||
      normMsg.includes('tren ikp');

    if (isIkpPouRequest && !normMsg.includes('bagaimana cara menghitung') && !isAnalyticalQuery) {
      const { getLiveIkpPouData } = await import('@/lib/ketapang/ikpPouService');
      const ikpPouData = await getLiveIkpPouData();

      const latestIkp = ikpPouData.ikp[ikpPouData.ikp.length - 1];
      const latestPou = ikpPouData.pou[ikpPouData.pou.length - 1];

      const summaryText =
        `Berikut data **Indeks Ketahanan Pangan (IKP)** dan **Prevalensi Ketidakcukupan Pangan (PoU)** Kota Cilegon 5 tahun terakhir yang terhubung langsung secara live dengan database real-time Sistem Informasi Pangan Kota Cilegon:\n\n` +
        `### 📈 Ringkasan Capaian Terkini:\n` +
        `* 🏆 **IKP ${latestIkp?.year || '2025'}:** Skor **${latestIkp?.cilegon || 88.5}** (Kategori Sangat Tahan Pangan) — Berada di atas rata-rata Provinsi Banten (${latestIkp?.provinsi || 81.2}) & Nasional (${latestIkp?.nasional || 78.4}).\n` +
        `* 📉 **PoU ${latestPou?.year || '2025'}:** Angka **${latestPou?.cilegon || 4.8}%** (Menurun, semakin rendah semakin baik).\n\n` +
        `💡 *Gunakan tombol tab di bawah untuk beralih antara grafik IKP dan PoU, serta tombol **Unduh XLSX** untuk mendapatkan dokumen spreadsheet lengkap.*`;

      const { userMsgId, assistantMsgId } = await persistMessages(
        message,
        summaryText,
        [
          {
            id: 'tool-ikp-pou-' + Date.now(),
            name: 'ikp_pou_panel',
            status: 'completed',
            args: { totalYears: ikpPouData.ikp.length },
          },
        ]
      );

      return NextResponse.json({
        sessionId,
        userMessageId: userMsgId,
        assistantMessageId: assistantMsgId,
        content: summaryText,
        type: 'ikp_pou_panel',
        ikp_pou_panel: ikpPouData,
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: summaryText,
          type: 'ikp_pou_panel',
          ikp_pou_panel: ikpPouData,
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role,
        isVerified: authProfile.is_verified_employee,
      });
    }

    // 8. Deteksi Maksud Capaian 7 Indikator Ketahanan Pangan (Capture 3)
    const isIndikatorRequest =
      normMsg.includes('7 indikator') ||
      normMsg.includes('indikator ketahanan pangan') ||
      normMsg.includes('cv beras') ||
      normMsg.includes('pph') ||
      normMsg.includes('pola pangan harapan') ||
      normMsg.includes('konsumsi energi') ||
      normMsg.includes('konsumsi protein') ||
      normMsg.includes('ketersediaan energi') ||
      normMsg.includes('ketersediaan protein') ||
      normMsg.includes('cppd') ||
      normMsg.includes('cadangan pangan');

    if (isIndikatorRequest && !isAnalyticalQuery) {
      const { getLiveIndikatorKetapangData } = await import('@/lib/ketapang/indikatorService');
      const indikatorData = await getLiveIndikatorKetapangData();

      const summaryText =
        `Berikut visualisasi capaian **7 Indikator Utama Ketahanan Pangan** Kota Cilegon 5 tahun terakhir vs Target Nasional yang bersumber live dari database real-time Sistem Informasi Pangan Kota Cilegon:\n\n` +
        `1. **CV Beras Medium:** Stabilitas variasi pasokan beras bulanan\n` +
        `2. **PPH (Pola Pangan Harapan):** Kualitas keanekaragaman konsumsi pangan\n` +
        `3. **Konsumsi Protein & Energi:** Tingkat pemenuhan gizi masyarakat per kapita/hari\n` +
        `4. **Ketersediaan Energi & Protein:** Pasokan ketersediaan pangan makro wilayah\n` +
        `5. **CPPD (Cadangan Pangan Pemda):** Stok cadangan beras pemerintah kota Cilegon\n\n` +
        `💡 *Pilih tab indikator di bawah untuk melihat grafik tren dan realisasi capaian vs target.*`;

      const { userMsgId, assistantMsgId } = await persistMessages(
        message,
        summaryText,
        [
          {
            id: 'tool-indikator-panel-' + Date.now(),
            name: 'indikator_ketapang_panel',
            status: 'completed',
            args: { totalIndicators: 7 },
          },
        ]
      );

      return NextResponse.json({
        sessionId,
        userMessageId: userMsgId,
        assistantMessageId: assistantMsgId,
        content: summaryText,
        type: 'indikator_ketapang_panel',
        indikator_ketapang_panel: indikatorData,
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: summaryText,
          type: 'indikator_ketapang_panel',
          indikator_ketapang_panel: indikatorData,
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role,
        isVerified: authProfile.is_verified_employee,
      });
    }

    // 9. Deteksi Maksud Early Warning System (EWS ML) (Capture 4)
    const isEwsRequest =
      normMsg.includes('early warning system') ||
      normMsg.includes('ews') ||
      normMsg.includes('peringatan dini') ||
      normMsg.includes('anomali harga') ||
      normMsg.includes('volatilitas pangan') ||
      normMsg.includes('kerentanan pangan') ||
      normMsg.includes('waspada fluktuasi');

    if (isEwsRequest && !normMsg.includes('singkatan dari ews') && !isAnalyticalQuery) {
      const { getLiveEwsData } = await import('@/lib/ketapang/ewsService');
      const ewsData = await getLiveEwsData();

      const summaryText =
        `Berikut status **Sistem Peringatan Dini / Early Warning System (EWS ML)** ketahanan pangan Kota Cilegon yang dianalisis menggunakan machine learning berbasis fluktuasi koefisien variasi (CV) dan model proyeksi pasokan yang terhubung dengan database real-time Sistem Informasi Pangan Kota Cilegon:\n\n` +
        `### ⚠️ Status Peringatan: **EWS AKTIF**\n` +
        `* Ditemukan **${ewsData.warnings.length} komoditas** dalam pantauan khusus dengan volatilitas dan proyeksi kenaikan harga.\n` +
        `* Klik pada komoditas di bawah untuk melihat rincian proyeksi 3 bulan ke depan dan rekomendasi intervensi dinas.\n` +
        `* Klik tombol **Download docx** untuk mengunduh naskah laporan rekomendasi EWS.`;

      const { userMsgId, assistantMsgId } = await persistMessages(
        message,
        summaryText,
        [
          {
            id: 'tool-ews-panel-' + Date.now(),
            name: 'ews_panel',
            status: 'completed',
            args: { alertsCount: ewsData.warnings.length },
          },
        ]
      );

      return NextResponse.json({
        sessionId,
        userMessageId: userMsgId,
        assistantMessageId: assistantMsgId,
        content: summaryText,
        type: 'ews_panel',
        ews_panel: ewsData,
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: summaryText,
          type: 'ews_panel',
          ews_panel: ewsData,
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role,
        isVerified: authProfile.is_verified_employee,
      });
    }

    // 10. Deteksi Maksud Produksi GKG 5 Tahun (Gabah Kering Giling)
    const isGkgRequest =
      normMsg.includes('gkg') ||
      normMsg.includes('gabah kering giling') ||
      normMsg.includes('produksi padi') ||
      normMsg.includes('produksi beras') ||
      normMsg.includes('panen padi') ||
      normMsg.includes('produktivitas padi');

    if (isGkgRequest && !isAnalyticalQuery) {
      const { getLiveGkgData } = await import('@/lib/ketapang/gkgService');
      const gkgData = await getLiveGkgData();

      const summaryText =
        `Berikut data dan visualisasi **Produksi Gabah Kering Giling (GKG) & Konversi Beras** Kota Cilegon 5 tahun terakhir yang terhubung live dengan database real-time Sistem Informasi Pangan Kota Cilegon:\n\n` +
        `### 🌾 Ringkasan Produksi Terkini (${gkgData.latestYear}):\n` +
        `* 🚜 **Total Produksi GKG:** **${gkgData.totalGkgLatest.toLocaleString('id-ID')} Ton** (+${gkgData.growthPct}% YoY)\n` +
        `* 🍚 **Estimasi Beras Lokal:** **${gkgData.totalBerasLatest.toLocaleString('id-ID')} Ton** (Rendemen 63.23%)\n` +
        `* 📍 **Sentra Pertanian:** Wilayah Kecamatan Cibeber & Jombang\n\n` +
        `💡 *Klik ikon otak di kanan atas panel untuk melihat analisis interpretasi AI atau tombol **Unduh XLSX** untuk spreadsheet.*`;

      const { userMsgId, assistantMsgId } = await persistMessages(
        message,
        summaryText,
        [
          {
            id: 'tool-gkg-panel-' + Date.now(),
            name: 'gkg_panel',
            status: 'completed',
            args: { latestYear: gkgData.latestYear, totalGkg: gkgData.totalGkgLatest },
          },
        ]
      );

      return NextResponse.json({
        sessionId,
        userMessageId: userMsgId,
        assistantMessageId: assistantMsgId,
        content: summaryText,
        type: 'gkg_panel',
        gkg_panel: gkgData,
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: summaryText,
          type: 'gkg_panel',
          gkg_panel: gkgData,
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role,
        isVerified: authProfile.is_verified_employee,
      });
    }

    // 11. Deteksi Maksud Peta Tematik GIS (FSVA & SKPG) — Khusus pertanyaan langsung tentang FSVA & SKPG
    const isPerikanan = 
      normMsg.includes('perikanan') ||
      normMsg.includes('tangkap') ||
      normMsg.includes('budidaya') ||
      normMsg.includes('nelayan') ||
      normMsg.includes('ikan') ||
      normMsg.includes('pangkalan') ||
      normMsg.includes('tpi') ||
      normMsg.includes('tambak');

    const isDirectMapThematicRequest =
      !isPerikanan && (
        normMsg.includes('peta tematik') ||
        normMsg.includes('peta fsva') ||
        normMsg.includes('peta skpg') ||
        normMsg.includes('peta borda') ||
        normMsg.includes('gis cilegon') ||
        normMsg.includes('peta kerentanan') ||
        normMsg === 'fsva' ||
        normMsg === 'skpg'
      );

    if (isDirectMapThematicRequest) {
      const mapMode = normMsg.includes('skpg') ? 'skpg' : normMsg.includes('borda') ? 'borda' : 'fsva';
      const summaryText =
        `Berikut panel kontrol interaktif **Peta Tematik Spasial GIS Kota Cilegon** yang terintegrasi langsung dengan database terkini (*dashboard-ketapang.vercel.app*):\n\n` +
        `* **FSVA 2025 (Peta Komposit Kerentanan Pangan):** Memetakan 6 indikator ketahanan & kerentanan pangan di 43 kelurahan se-Kota Cilegon (Prioritas 1 hingga 6).\n` +
        `* **SKPG 2026 (Sistem Kewaspadaan Pangan & Gizi):** Pemantauan bulanan real-time pada 3 pilar: *Ketersediaan, Akses, dan Pemanfaatan Pangan*.\n` +
        `* **Metode Borda 2026:** Pemeringkatan multi-kriteria prioritas intervensi inter-sektoral per kelurahan.\n` +
        `* **Titik Intervensi & Lumbung Pangan:** Lokasi sebaran Pasar Murah, KWT, Lumbung Pangan, dan Toko Tani Indonesia (TTI).\n\n` +
        `🗺️ *Silakan pilih layer tematik di bawah ini atau klik tombol **Buka Panel GIS** untuk melihat poligon wilayah spasial interaktif.*`;

      const mapAction = {
        type: 'CHOROPLETH',
        thematicMode: mapMode,
        layersToEnable: [mapMode],
      };

      const { userMsgId, assistantMsgId } = await persistMessages(
        message,
        summaryText,
        [
          {
            id: 'tool-map-thematic-' + Date.now(),
            name: 'map_thematic',
            status: 'completed',
            args: { thematicMode: mapMode },
          },
        ],
        [],
        [mapAction]
      );

      return NextResponse.json({
        sessionId,
        userMessageId: userMsgId,
        assistantMessageId: assistantMsgId,
        content: summaryText,
        type: 'map_card',
        map_actions: [mapAction],
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: summaryText,
          type: 'map_card',
          map_actions: [mapAction],
          created_at: new Date().toISOString(),
        },
        userRole: authProfile.role,
        isVerified: authProfile.is_verified_employee,
      });
    }

    // 11. Generate AI Response via Gemini with Tool Execution and Sensitive Guardrails
    const currentMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    const aiResult = await generateChatResponse({
      messages: currentMessages,
      userRole: authProfile.role,
      isVerified: authProfile.is_verified_employee,
      canAccessSensitive: authProfile.can_access_sensitive,
      userMemoryContext: memoryContext,
    });

    // 6. Persist to DB only for authenticated (non-guest) users
    const { userMsgId, assistantMsgId } = await persistMessages(
      message,
      aiResult.content,
      aiResult.tool_calls,
      aiResult.sources,
      aiResult.map_actions
    );

    // 6. Log Audit Trail
    await logAudit({
      userId: authProfile.id,
      action: 'AI_QUERY',
      resourceType: 'CHAT_ASSISTANT',
      resourceId: sessionId,
      accessResult: 'SUCCESS',
      metadata: {
        role: authProfile.role,
        messageLength: message.length,
        toolsUsed: (aiResult.tool_calls || []).map((t: { name: string }) => t.name),
      },
    });

    return NextResponse.json({
      sessionId,
      userMessageId: userMsgId,
      assistantMessageId: assistantMsgId,
      content: aiResult.content,
      sources: aiResult.sources,
      tool_calls: aiResult.tool_calls,
      map_actions: aiResult.map_actions,
      matched_pins: aiResult.matched_pins,
      wilayah_highlight: aiResult.wilayah_highlight,
      userRole: authProfile.role,
    });
  } catch (error: unknown) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memproses chat.' },
      { status: 500 }
    );
  }
}
