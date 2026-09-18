import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId diperlukan' }, { status: 400 });
    }

    const { data: rawMessages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Hydrate interactive polling / carousel widgets from tool_calls or content
    const messages = (rawMessages || []).map((msg) => {
      const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
      
      // 1. Check for poll_carousel
      const carouselTool = toolCalls.find((t: any) => t?.name === 'poll_carousel');
      const isCarouselContent = typeof msg.content === 'string' && (
        msg.content.includes('🎠 **Live Carousel Hasil Polling Pegawai') ||
        msg.content.includes('Live Carousel Hasil Polling') ||
        msg.content.includes('Carousel 15 Tema')
      );

      if (carouselTool || isCarouselContent) {
        const initialCode = carouselTool?.args?.initialThemeCode || 'cantik';
        return {
          ...msg,
          type: 'poll_carousel',
          poll_carousel: {
            themes: OFFICIAL_POLL_THEMES,
            initialThemeCode: initialCode,
          },
        };
      }

      // 2. Check for poll_catalog
      const catalogTool = toolCalls.find((t: any) => t?.name === 'poll_catalog');
      const isCatalogContent = typeof msg.content === 'string' && (
        msg.content.includes('🏆 **Katalog 15 Tema Polling Pegawai') ||
        msg.content.includes('Daftar Tema Polling Pegawai')
      );

      if (catalogTool || isCatalogContent) {
        return {
          ...msg,
          type: 'poll_catalog',
          poll_catalog: {
            themes: OFFICIAL_POLL_THEMES,
          },
        };
      }

      // 3. Check for poll_card
      const pollCardTool = toolCalls.find((t: any) => t?.name === 'poll_card');
      const isPollCardContent = typeof msg.content === 'string' && msg.content.includes('Berikut ini polling');

      if (pollCardTool || isPollCardContent) {
        let pollCode = pollCardTool?.args?.pollCode || 'cantik';
        if (!pollCardTool && isPollCardContent) {
          const match = msg.content.match(/polling "([^"]+)"/);
          if (match) {
            const found = OFFICIAL_POLL_THEMES.find(t => t.title.toLowerCase() === match[1].toLowerCase());
            if (found) pollCode = found.code;
          }
        }
        const foundTheme = OFFICIAL_POLL_THEMES.find((t) => t.code === pollCode) || OFFICIAL_POLL_THEMES[0];
        return {
          ...msg,
          type: 'poll_card',
          poll_card: {
            poll: foundTheme,
            available_themes: OFFICIAL_POLL_THEMES,
          },
        };
      }

      return msg;
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil pesan chat' }, { status: 500 });
  }
}

