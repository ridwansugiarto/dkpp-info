import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveUserAuth, logAudit, supabaseAdmin } from '@/lib/supabaseServer';
import { generateChatResponse } from '@/lib/gemini';

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

    // 4. Deteksi Maksud Polling Pegawai (AI Intent Detection)
    const { detectPollingIntent } = await import('@/lib/polling/intent');
    const { OFFICIAL_POLL_THEMES } = await import('@/lib/polling/constants');
    const pollIntent = detectPollingIntent(message);

    if (pollIntent.intent === 'EMPLOYEE_POLL' && pollIntent.category && (pollIntent.confidence ?? 0) >= 0.8) {
      if (pollIntent.category === 'carousel') {
        if (authProfile.role === 'GUEST') {
          const guestNotice = `### 🔒 Akses Dibatasi — Live Hasil Polling DKPP\n\n` +
            `Hasil **Live Polling Pegawai & Apresiasi Internal (15 Tema)** di DKPP Kota Cilegon berkategori **INTERNAL**.\n\n` +
            `Silakan **Masuk dengan Google (Gmail)** untuk memutar carousel hasil polling secara lengkap.`;
          return NextResponse.json({
            message: {
              id: 'msg-poll-guest-' + Date.now(),
              session_id: sessionId || 'temp',
              role: 'assistant',
              content: guestNotice,
              type: 'auth_prompt',
              auth_prompt: 'LOGIN_REQUIRED',
              created_at: new Date().toISOString(),
            },
            userRole: authProfile.role,
            isVerified: authProfile.is_verified_employee,
          });
        }

        const lowerMsg = message.toLowerCase();
        let initialCode = 'cantik';
        const foundTheme = OFFICIAL_POLL_THEMES.find(t => 
          lowerMsg.includes(t.code) || 
          lowerMsg.includes(t.short_label.toLowerCase()) || 
          lowerMsg.includes(t.title.toLowerCase())
        );
        if (foundTheme) {
          initialCode = foundTheme.code;
        }

        const carouselText = `🎠 **Live Carousel Hasil Polling Pegawai (15 Tema DKPP)**\n\nBerikut tampilan live perolehan suara 15 tema polling apresiasi keluarga besar DKPP Kota Cilegon. Kamu bisa menggeser tema, menjeda putar otomatis (*auto-slide*), atau langsung memberikan suara!`;

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
            themes: OFFICIAL_POLL_THEMES,
            initialThemeCode: initialCode,
          },
          message: {
            id: assistantMsgId,
            session_id: sessionId || 'temp',
            role: 'assistant',
            content: carouselText,
            type: 'poll_carousel',
            poll_carousel: {
              themes: OFFICIAL_POLL_THEMES,
              initialThemeCode: initialCode,
            },
            created_at: new Date().toISOString(),
          },
          userRole: authProfile.role,
          isVerified: authProfile.is_verified_employee,
        });
      }

      if (pollIntent.category === 'all') {
        if (authProfile.role === 'GUEST') {
          const guestNotice = `### 🔒 Akses Dibatasi — Fitur Polling Pegawai DKPP\n\n` +
            `Fitur **Polling Pegawai & Apresiasi Internal** di DKPP Kota Cilegon berkategori **INTERNAL** demi menjaga privasi dan keakraban keluarga besar dinas.\n\n` +
            `Silakan **Masuk dengan Google (Gmail)** untuk berpartisipasi atau melihat statistik suara.`;
          return NextResponse.json({
            message: {
              id: 'msg-poll-guest-' + Date.now(),
              session_id: sessionId || 'temp',
              role: 'assistant',
              content: guestNotice,
              type: 'auth_prompt',
              auth_prompt: 'LOGIN_REQUIRED',
              created_at: new Date().toISOString(),
            },
            userRole: authProfile.role,
            isVerified: authProfile.is_verified_employee,
          });
        }

        const responseText = `🏆 **Katalog 15 Tema Polling Pegawai DKPP Kota Cilegon**\n\nPilih tema polling yang ingin kamu ikuti langsung di bawah ini! Kamu bisa memilih 1 hingga 3 nama rekan kerja per tema secara aman & 100% anonim.`;

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
            themes: OFFICIAL_POLL_THEMES,
          },
          message: {
            id: assistantMsgId,
            session_id: sessionId || 'temp',
            role: 'assistant',
            content: responseText,
            type: 'poll_catalog',
            poll_catalog: {
              themes: OFFICIAL_POLL_THEMES,
            },
            auth_prompt: !authProfile.is_verified_employee ? 'NIP_REQUIRED' : undefined,
            created_at: new Date().toISOString(),
          },
          userRole: authProfile.role,
          isVerified: authProfile.is_verified_employee,
        });
      }

      // Ambil tema poll yang cocok
      const targetTheme = OFFICIAL_POLL_THEMES.find((t) => t.code === pollIntent.category) || OFFICIAL_POLL_THEMES[0];
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

      // Case 1: Pengunjung Tamu (Belum Login Google)
      if (authProfile.role === 'GUEST') {
        const guestNotice = `### 🔒 Akses Dibatasi — Data Polling Internal DKPP\n\n` +
          `Informasi mengenai **profil kepegawaian & polling (${activePoll.title})** di DKPP Kota Cilegon berkategori **INTERNAL / SENSITIF**.\n\n` +
          `Fitur voting ini hanya dapat diakses oleh **Pegawai Resmi DKPP yang telah memverifikasi NIP**.\n\n` +
          `👉 *Silakan **Masuk dengan Google (Gmail)** untuk melanjutkan.*`;
        return NextResponse.json({
          content: guestNotice,
          type: 'auth_prompt',
          auth_prompt: 'LOGIN_REQUIRED',
          message: {
            id: 'msg-poll-guest-' + Date.now(),
            session_id: sessionId || 'temp',
            role: 'assistant',
            content: guestNotice,
            type: 'auth_prompt',
            auth_prompt: 'LOGIN_REQUIRED',
            created_at: new Date().toISOString(),
          },
          userRole: authProfile.role,
          isVerified: authProfile.is_verified_employee,
        });
      }

      // Case 2: User Umum / Non-Pegawai (Sudah Login Gmail, tapi belum verifikasi NIP)
      if (!authProfile.is_verified_employee && authProfile.role === 'CITIZEN') {
        const citizenNotice = `### 🛡️ Verifikasi NIP Pegawai Diperlukan\n\n` +
          `Akun Gmail Anda saat ini berstatus **User Umum (Non-Pegawai)**. Pemberian suara pada polling **${activePoll.title}** ${activePoll.icon || ''} dikhususkan untuk **Pegawai Resmi DKPP Kota Cilegon** demi menjaga keabsahan data.\n\n` +
          `Jika Anda adalah pegawai aktif dinas, silakan verifikasi NIP Anda sekarang. Anda tetap dapat melihat hasil perolehan suara sementara di bawah ini.`;
        return NextResponse.json({
          content: citizenNotice,
          type: 'poll_card',
          auth_prompt: 'NIP_REQUIRED',
          poll_card: {
            poll: activePoll,
            available_themes: OFFICIAL_POLL_THEMES,
          },
          message: {
            id: 'msg-poll-citizen-' + Date.now(),
            session_id: sessionId || 'temp',
            role: 'assistant',
            content: citizenNotice,
            type: 'poll_card',
            auth_prompt: 'NIP_REQUIRED',
            poll_card: {
              poll: activePoll,
              available_themes: OFFICIAL_POLL_THEMES,
            },
            created_at: new Date().toISOString(),
          },
          userRole: authProfile.role,
          isVerified: authProfile.is_verified_employee,
        });
      }

      // Case 3: Pegawai Terverifikasi / Super Admin (Persis Sesuai Mockup Screen 1)
      let userHasVoted = false;
      let userChoicesCount = 3;
      if (authProfile?.id) {
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

      let botGreeting = '';
      if (userHasVoted) {
        botGreeting = `ℹ️ **Pemberitahuan:** Anda sudah memberikan suara sebanyak **${userChoicesCount}x** pada tema **"${activePoll.title}"**.\n\nHak suara Anda untuk tema ini telah digunakan secara lengkap (${userChoicesCount} dari ${activePoll.max_choices || 3} pilihan). Seluruh pilihan Anda tersimpan secara **100% aman, anonim, dan terjamin kerahasiaannya**.\n\nBerikut perolehan suara live sementara atau Anda dapat memilih tema polling lainnya! 🗳️✨`;
      } else {
        botGreeting = `Oke! Aku siap bantu. Berikut ini formulir polling "${activePoll.title}".\n\nKamu bisa memilih maksimal ${activePoll.max_choices || 3} orang rekan kerja favoritmu.\n\n🔒 *Catatan: Polling ini bersifat **100% anonim dan terjamin kerahasiaannya** demi kenyamanan bersama.*\n\nMulai ketik nama pegawai favoritmu pada formulir di bawah ini:`;
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
          available_themes: OFFICIAL_POLL_THEMES,
        },
        message: {
          id: assistantMsgId,
          session_id: sessionId || 'temp',
          role: 'assistant',
          content: botGreeting,
          type: 'poll_card',
          poll_card: {
            poll: activePoll,
            available_themes: OFFICIAL_POLL_THEMES,
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
        `Berikut data **Panel Harga Pangan Strategis (SAGON LIVE)** rata-rata seluruh pasar Kota Cilegon per tanggal **${sagonData.formattedDate}** yang terhubung langsung dengan database real-time Dinas Ketahanan Pangan dan Pertanian Kota Cilegon.\n\n` +
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

      const summaryText = `Berikut tabel **Peramalan Harga Pangan (ML Forecasting)** untuk proyeksi 1 & 3 bulan ke depan di Kota Cilegon yang terintegrasi langsung dengan database real-time Dinas Ketahanan Pangan dan Pertanian.\n\n` +
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

    // 7. Deteksi Maksud IKP & PoU 5 Tahun (Captures 1 & 2)
    const isIkpPouRequest =
      normMsg.includes('ikp') ||
      normMsg.includes('pou') ||
      normMsg.includes('indeks ketahanan pangan') ||
      normMsg.includes('prevalensi ketidakcukupan') ||
      normMsg.includes('skor ikp') ||
      normMsg.includes('tren ikp');

    if (isIkpPouRequest && !normMsg.includes('bagaimana cara menghitung')) {
      const { getLiveIkpPouData } = await import('@/lib/ketapang/ikpPouService');
      const ikpPouData = await getLiveIkpPouData();

      const latestIkp = ikpPouData.ikp[ikpPouData.ikp.length - 1];
      const latestPou = ikpPouData.pou[ikpPouData.pou.length - 1];

      const summaryText =
        `Berikut data **Indeks Ketahanan Pangan (IKP)** dan **Prevalensi Ketidakcukupan Pangan (PoU)** Kota Cilegon 5 tahun terakhir yang terhubung langsung secara live dengan database Ketahanan Pangan:\n\n` +
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

    if (isIndikatorRequest) {
      const { getLiveIndikatorKetapangData } = await import('@/lib/ketapang/indikatorService');
      const indikatorData = await getLiveIndikatorKetapangData();

      const summaryText =
        `Berikut visualisasi capaian **7 Indikator Utama Ketahanan Pangan** Kota Cilegon 5 tahun terakhir vs Target Nasional yang bersumber live dari Dashboard Ketahanan Pangan:\n\n` +
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

    if (isEwsRequest && !normMsg.includes('singkatan dari ews')) {
      const { getLiveEwsData } = await import('@/lib/ketapang/ewsService');
      const ewsData = await getLiveEwsData();

      const summaryText =
        `Berikut status **Sistem Peringatan Dini / Early Warning System (EWS ML)** ketahanan pangan Kota Cilegon yang dianalisis menggunakan machine learning berbasis fluktuasi koefisien variasi (CV) dan model proyeksi pasokan:\n\n` +
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

    if (isGkgRequest) {
      const { getLiveGkgData } = await import('@/lib/ketapang/gkgService');
      const gkgData = await getLiveGkgData();

      const summaryText =
        `Berikut data dan visualisasi **Produksi Gabah Kering Giling (GKG) & Konversi Beras** Kota Cilegon 5 tahun terakhir yang terhubung live dengan database Dinas Ketahanan Pangan dan Pertanian:\n\n` +
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

    // 11. Deteksi Maksud Peta Tematik GIS (FSVA & SKPG)
    const isMapThematicRequest =
      normMsg.includes('peta tematik') ||
      normMsg.includes('peta fsva') ||
      normMsg.includes('peta skpg') ||
      normMsg.includes('peta borda') ||
      normMsg.includes('gis cilegon') ||
      normMsg.includes('peta kerentanan');

    if (isMapThematicRequest) {
      const mapMode = normMsg.includes('skpg') ? 'skpg' : normMsg.includes('borda') ? 'borda' : 'fsva';
      const summaryText =
        `Berikut panel kontrol interaktif **Peta Tematik Spasial GIS Kota Cilegon** untuk memetakan kerentanan pangan tingkat kelurahan:\n\n` +
        `* **FSVA 2025:** 6 Indikator peta komposit kerentanan pangan\n` +
        `* **SKPG 2026:** Sistem Kewaspadaan Pangan & Gizi berkala\n` +
        `* **Metode Borda:** Peringkat prioritas intervensi kelurahan\n` +
        `* **Titik Intervensi:** Lokasi Pasar Murah & Lumbung Pangan\n\n` +
        `💡 *Pilih layer di bawah atau klik tombol **Buka Panel GIS** untuk melihat poligon wilayah spasial.*`;

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
