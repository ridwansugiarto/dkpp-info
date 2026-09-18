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

    // 4. Deteksi Maksud Polling Pegawai (AI Intent Detection)
    const { detectPollingIntent } = await import('@/lib/polling/intent');
    const { OFFICIAL_POLL_THEMES } = await import('@/lib/polling/constants');
    const pollIntent = detectPollingIntent(message);

    if (pollIntent.intent === 'EMPLOYEE_POLL' && pollIntent.category) {
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
        return NextResponse.json({
          content: carouselText,
          type: 'poll_carousel',
          poll_carousel: {
            themes: OFFICIAL_POLL_THEMES,
            initialThemeCode: initialCode,
          },
          message: {
            id: 'msg-poll-carousel-' + Date.now(),
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
        return NextResponse.json({
          message: {
            id: 'msg-poll-catalog-' + Date.now(),
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
      const botGreeting = `Oke! Aku siap bantu. Berikut ini polling "${activePoll.title}".\n\nKamu bisa pilih maksimal ${activePoll.max_choices || 3} orang, ya!\n\nMulai ketik nama pegawai, dan aku akan menampilkan daftar yang paling mendekati.`;
      return NextResponse.json({
        content: botGreeting,
        type: 'poll_card',
        poll_card: {
          poll: activePoll,
          available_themes: OFFICIAL_POLL_THEMES,
        },
        message: {
          id: 'msg-poll-' + Date.now(),
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

    // 5. Generate AI Response via Gemini with Tool Execution and Sensitive Guardrails
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

    // 5. Persist to DB only for authenticated (non-guest) users
    // Guest messages live only in React state and are cleared when the session ends.
    const isGuestUser = !userId || userId === 'guest' || (userId as string).startsWith('guest_');
    let userMsgId = 'msg-user-' + Date.now();
    let assistantMsgId = 'msg-ai-' + Date.now();

    if (sessionId && !isGuestUser) {
      try {
        const { data: insertedUserMsg } = await supabaseAdmin
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'user',
            content: message,
          })
          .select('id')
          .single();

        if (insertedUserMsg) userMsgId = insertedUserMsg.id;

        const { data: insertedAiMsg } = await supabaseAdmin
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: aiResult.content,
            sources: aiResult.sources,
            tool_calls: aiResult.tool_calls,
            map_actions: aiResult.map_actions,
          })
          .select('id')
          .single();

        if (insertedAiMsg) assistantMsgId = insertedAiMsg.id;

        // Update session's updated_at
        await supabaseAdmin
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId);
      } catch (dbErr) {
        console.error('Error saving messages to Supabase:', dbErr);
      }
    }

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
