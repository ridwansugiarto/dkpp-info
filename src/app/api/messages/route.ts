import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getActivePollThemes } from '@/lib/polling/store';
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

    const hasForecast = (rawMessages || []).some((m) => {
      const toolCalls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      return toolCalls.some((t: any) => t?.name === 'forecast_table') ||
        (typeof m.content === 'string' && m.content.includes('Peramalan Harga Pangan (ML Forecasting)'));
    });

    let cachedForecastData: any = null;
    if (hasForecast) {
      const { getLiveForecastTableData } = await import('@/lib/forecast/forecastService');
      cachedForecastData = await getLiveForecastTableData();
    }

    const hasSagonPanel = (rawMessages || []).some((m) => {
      const toolCalls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      return toolCalls.some((t: any) => t?.name === 'harga_sagon_panel') ||
        (typeof m.content === 'string' && m.content.includes('Panel Harga Pangan Strategis (SAGON LIVE)'));
    });

    let cachedSagonData: any = null;
    if (hasSagonPanel) {
      const { getLiveSagonPanelData } = await import('@/lib/harga/sagonService');
      cachedSagonData = await getLiveSagonPanelData();
    }

    const hasIkpPou = (rawMessages || []).some((m) => {
      const toolCalls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      return toolCalls.some((t: any) => t?.name === 'ikp_pou_panel') ||
        (typeof m.content === 'string' && (m.content.includes('Indeks Ketahanan Pangan (IKP)') || m.content.includes('ikp_pou_panel')));
    });

    let cachedIkpPouData: any = null;
    if (hasIkpPou) {
      const { getLiveIkpPouData } = await import('@/lib/ketapang/ikpPouService');
      cachedIkpPouData = await getLiveIkpPouData();
    }

    const hasIndikator = (rawMessages || []).some((m) => {
      const toolCalls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      return toolCalls.some((t: any) => t?.name === 'indikator_ketapang_panel') ||
        (typeof m.content === 'string' && (m.content.includes('7 Indikator Utama Ketahanan Pangan') || m.content.includes('indikator_ketapang_panel')));
    });

    let cachedIndikatorData: any = null;
    if (hasIndikator) {
      const { getLiveIndikatorKetapangData } = await import('@/lib/ketapang/indikatorService');
      cachedIndikatorData = await getLiveIndikatorKetapangData();
    }

    const hasEws = (rawMessages || []).some((m) => {
      const toolCalls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      return toolCalls.some((t: any) => t?.name === 'ews_panel') ||
        (typeof m.content === 'string' && (m.content.includes('Early Warning System (EWS ML)') || m.content.includes('EWS AKTIF') || m.content.includes('ews_panel')));
    });

    let cachedEwsData: any = null;
    if (hasEws) {
      const { getLiveEwsData } = await import('@/lib/ketapang/ewsService');
      cachedEwsData = await getLiveEwsData();
    }

    const hasGkg = (rawMessages || []).some((m) => {
      const toolCalls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      return toolCalls.some((t: any) => t?.name === 'gkg_panel') ||
        (typeof m.content === 'string' && (m.content.includes('Produksi Gabah Kering Giling') || m.content.includes('gkg_panel')));
    });

    let cachedGkgData: any = null;
    if (hasGkg) {
      const { getLiveGkgData } = await import('@/lib/ketapang/gkgService');
      cachedGkgData = await getLiveGkgData();
    }

    // Ambil seluruh tema aktif terbaru
    const activeThemes = await getActivePollThemes();

    // Hydrate interactive polling / carousel widgets from tool_calls or content
    const messages = (rawMessages || []).map((msg) => {
      const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
      
      // 1. Check for poll_carousel
      const carouselTool = toolCalls.find((t: any) => t?.name === 'poll_carousel');
      const isCarouselContent = typeof msg.content === 'string' && (
        msg.content.includes('🎠 **Live Carousel Hasil Polling Pegawai') ||
        msg.content.includes('Live Carousel Hasil Polling') ||
        msg.content.includes('Carousel')
      );

      if (carouselTool || isCarouselContent) {
        const initialCode = carouselTool?.args?.initialThemeCode || (activeThemes[0]?.code || 'cantik');
        return {
          ...msg,
          type: 'poll_carousel',
          poll_carousel: {
            themes: activeThemes,
            initialThemeCode: initialCode,
          },
        };
      }

      // 2. Check for poll_catalog
      const catalogTool = toolCalls.find((t: any) => t?.name === 'poll_catalog');
      const isCatalogContent = typeof msg.content === 'string' && (
        msg.content.includes('🏆 **Katalog') ||
        msg.content.includes('Katalog') && msg.content.includes('Tema Polling') ||
        msg.content.includes('Daftar Tema Polling Pegawai')
      );

      if (catalogTool || isCatalogContent) {
        return {
          ...msg,
          type: 'poll_catalog',
          poll_catalog: {
            themes: activeThemes,
          },
        };
      }

      // 3. Check for poll_card
      const pollCardTool = toolCalls.find((t: any) => t?.name === 'poll_card');
      const isPollCardContent = typeof msg.content === 'string' && (
        msg.content.includes('Berikut ini formulir polling') ||
        msg.content.includes('Berikut ini polling') ||
        msg.content.includes('formulir polling')
      );

      if (pollCardTool || isPollCardContent) {
        let pollCode = pollCardTool?.args?.pollCode || (activeThemes[0]?.code || 'cantik');
        if (!pollCardTool && isPollCardContent) {
          const match = msg.content.match(/polling "([^"]+)"/);
          if (match) {
            const found = activeThemes.find(t => t.title.toLowerCase() === match[1].toLowerCase());
            if (found) pollCode = found.code;
          }
        }
        const foundTheme = activeThemes.find((t) => t.code === pollCode || t.id === pollCode) || activeThemes[0];
        return {
          ...msg,
          type: 'poll_card',
          poll_card: {
            poll: foundTheme,
            available_themes: activeThemes,
          },
        };
      }

      // 4. Check for forecast_table
      const forecastTool = toolCalls.find((t: any) => t?.name === 'forecast_table');
      const isForecastContent = typeof msg.content === 'string' && (
        msg.content.includes('Peramalan Harga Pangan (ML Forecasting)') ||
        msg.content.includes('tabel **Peramalan Harga Pangan')
      );

      if (forecastTool || isForecastContent) {
        return {
          ...msg,
          type: 'forecast_table',
          forecast_table: cachedForecastData,
        };
      }

      // 5. Check for harga_sagon_panel (Panel Harga Pangan Strategis)
      const sagonTool = toolCalls.find((t: any) => t?.name === 'harga_sagon_panel');
      const isSagonContent = typeof msg.content === 'string' && (
        msg.content.includes('Panel Harga Pangan Strategis (SAGON LIVE)') ||
        msg.content.includes('PANEL HARGA PANGAN STRATEGIS')
      );

      if (sagonTool || isSagonContent) {
        return {
          ...msg,
          type: 'harga_sagon_panel',
          harga_sagon_panel: cachedSagonData,
        };
      }

      // 6. Check for ikp_pou_panel
      const ikpTool = toolCalls.find((t: any) => t?.name === 'ikp_pou_panel');
      const isIkpContent = typeof msg.content === 'string' && (
        msg.content.includes('Indeks Ketahanan Pangan (IKP)') ||
        msg.content.includes('Prevalensi Ketidakcukupan Pangan (PoU)')
      );

      if (ikpTool || isIkpContent) {
        return {
          ...msg,
          type: 'ikp_pou_panel',
          ikp_pou_panel: cachedIkpPouData,
        };
      }

      // 7. Check for indikator_ketapang_panel
      const indikatorTool = toolCalls.find((t: any) => t?.name === 'indikator_ketapang_panel');
      const isIndikatorContent = typeof msg.content === 'string' && (
        msg.content.includes('7 Indikator Utama Ketahanan Pangan') ||
        msg.content.includes('CV Beras Medium')
      );

      if (indikatorTool || isIndikatorContent) {
        return {
          ...msg,
          type: 'indikator_ketapang_panel',
          indikator_ketapang_panel: cachedIndikatorData,
        };
      }

      // 8. Check for ews_panel
      const ewsTool = toolCalls.find((t: any) => t?.name === 'ews_panel');
      const isEwsContent = typeof msg.content === 'string' && (
        msg.content.includes('Early Warning System (EWS ML)') ||
        msg.content.includes('EWS AKTIF')
      );

      if (ewsTool || isEwsContent) {
        return {
          ...msg,
          type: 'ews_panel',
          ews_panel: cachedEwsData,
        };
      }

      // 9. Check for gkg_panel
      const gkgTool = toolCalls.find((t: any) => t?.name === 'gkg_panel');
      const isGkgContent = typeof msg.content === 'string' && (
        msg.content.includes('Produksi Gabah Kering Giling') ||
        msg.content.includes('gkg_panel')
      );

      if (gkgTool || isGkgContent) {
        return {
          ...msg,
          type: 'gkg_panel',
          gkg_panel: cachedGkgData,
        };
      }

      return msg;
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil pesan chat' }, { status: 500 });
  }
}

