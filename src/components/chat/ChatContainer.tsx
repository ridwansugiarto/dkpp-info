'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  Sparkles, 
  MapPin, 
  Layers, 
  BookOpen, 
  Globe, 
  ExternalLink, 
  Database, 
  Compass, 
  TrendingUp, 
  Activity,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Share2,
  ArrowRight,
  Shield,
  ShieldCheck,
  Lock,
  Vote,
  Award,
  Users
} from 'lucide-react';
import { ChatMessage, SourceCitation, UserProfile } from '@/types/dkpp';
import { cleanResponseText } from '@/lib/gemini';
import type { ChartConfig } from '@/components/ChatChart';

import { PollCard } from '@/components/polling/PollCard';
import { ThemeCatalog } from '@/components/polling/ThemeCatalog';
import { LiveResultsCarousel } from '@/components/polling/LiveResultsCarousel';
import { ForecastChatTable } from './ForecastChatTable';
import { ChatInput } from './ChatInput';

// Dynamic import ChatChart for interactive Recharts
const ChatChart = dynamic(
  () => import('@/components/ChatChart'),
  { ssr: false, loading: () => <div className="h-48 flex items-center justify-center text-xs text-gray-400">Memuat grafik...</div> }
);

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (prompt: string) => void;
  onSendMessage?: (message: string) => void;
  onSelectKelurahan?: (kel: string) => void;
  viewMode?: 'SPLIT' | 'PETA' | 'CHAT';
  onOpenMap?: (action?: any, answerContent?: string) => void;
  onLoginClick?: () => void;
  onClaimNipClick?: () => void;
  onOpenCarousel?: (initialThemeCode?: string) => void;
  currentUser?: UserProfile;
}

// Suggestions removed per user request (Capture 1)

// Helper: parse bold, italic, and code inlines
function parseInlineFormatting(text: string): React.ReactNode {
  // Handle `code`, **bold**, and *italic*
  const parts = text.split(/(`[^`]+`|\*\*[^*]+?\*\*|\*[^*]+?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-bold text-gray-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**') && part.length > 2) {
      return (
        <em key={i} className="italic text-gray-700 dark:text-gray-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  onSuggestionClick,
  onSendMessage,
  onSelectKelurahan,
  viewMode = 'CHAT',
  onOpenMap,
  onLoginClick,
  onClaimNipClick,
  onOpenCarousel,
  currentUser,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<number, 'like' | 'dislike'>>({});

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (text: string, idx: number) => {
    const cleaned = cleanResponseText(text);
    navigator.clipboard.writeText(cleaned);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleFeedback = (idx: number, type: 'like' | 'dislike') => {
    setFeedbackState((prev) => ({
      ...prev,
      [idx]: prev[idx] === type ? (null as any) : type,
    }));
  };

  // Format clean markdown into rich HTML/React elements
  const renderFormattedContent = (content: string) => {
    const cleanedContent = cleanResponseText(content);
    const lines = cleanedContent.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Deteksi Blok Visualisasi Recharts (```json:chart atau ```chart)
      if (
        trimmed.startsWith('```json:chart') ||
        trimmed.startsWith('```chart') ||
        trimmed.startsWith('```json')
      ) {
        const isChartTag = trimmed.startsWith('```json:chart') || trimmed.startsWith('```chart');
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith('```')) {
          i++; // skip closing ```
        }

        const rawCode = codeLines.join('\n').trim();
        let parsedChart: ChartConfig | null = null;
        try {
          const jsonObj = JSON.parse(rawCode);
          if (jsonObj && (jsonObj.data || jsonObj.type || jsonObj.xAxisKey || isChartTag)) {
            parsedChart = {
              type: jsonObj.type || 'line',
              title: jsonObj.title || 'Visualisasi Data',
              description: jsonObj.description || '',
              xAxisKey: jsonObj.xAxisKey || Object.keys(jsonObj.data?.[0] || {})[0] || 'label',
              series: jsonObj.series || [
                {
                  key: Object.keys(jsonObj.data?.[0] || {}).find((k) => k !== jsonObj.xAxisKey) || 'value',
                  label: 'Nilai',
                },
              ],
              data: jsonObj.data || [],
              showTrendline: jsonObj.showTrendline ?? true,
            };
          }
        } catch {
          parsedChart = null;
        }

        if (parsedChart && parsedChart.data && parsedChart.data.length > 0) {
          elements.push(
            <div key={`chart-${i}`} className="my-3">
              <ChatChart config={parsedChart} />
            </div>
          );
          continue;
        } else {
          elements.push(
            <pre key={`code-${i}`} className="my-2 p-3 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-x-auto font-mono">
              <code>{rawCode}</code>
            </pre>
          );
          continue;
        }
      }

      // 2. Deteksi Tabel Markdown (| Kolom 1 | Kolom 2 |)
      if (
        trimmed.startsWith('|') &&
        trimmed.endsWith('|') &&
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith('|') &&
        lines[i + 1].includes('---')
      ) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCols = tableLines[0].split('|').slice(1, -1).map((c) => c.trim());
          const rowLines = tableLines.slice(2);

          elements.push(
            <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
              <table className="min-w-full text-xs text-left border-collapse bg-white dark:bg-[#1b1d22]">
                <thead className="bg-emerald-700 text-white font-bold uppercase text-[10.5px] tracking-wider">
                  <tr>
                    {headerCols.map((col, ci) => (
                      <th key={ci} className="px-3 py-2 border-b border-emerald-800 whitespace-nowrap">
                        {parseInlineFormatting(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                  {rowLines.map((r, ri) => {
                    const cells = r.split('|').slice(1, -1).map((c) => c.trim());
                    return (
                      <tr
                        key={ri}
                        className={
                          ri % 2 === 0
                            ? 'bg-white dark:bg-[#1b1d22]'
                            : 'bg-gray-50/70 dark:bg-gray-800/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30'
                        }
                      >
                        {cells.map((cell, cidx) => (
                          <td key={cidx} className="px-3 py-2 whitespace-normal leading-relaxed">
                            {parseInlineFormatting(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 3. Headings
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={i} className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-2.5 mb-1 uppercase tracking-wide">
            {parseInlineFormatting(trimmed.replace(/^####\s*/, ''))}
          </h4>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mt-3 mb-1 uppercase tracking-wide border-b border-emerald-100 dark:border-emerald-900/60 pb-0.5">
            {parseInlineFormatting(trimmed.replace(/^###\s*/, ''))}
          </h3>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-base font-black text-gray-900 dark:text-white mt-3.5 mb-1">
            {parseInlineFormatting(trimmed.replace(/^##\s*/, ''))}
          </h2>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-lg font-black text-gray-900 dark:text-white mt-3.5 mb-1.5">
            {parseInlineFormatting(trimmed.replace(/^#\s*/, ''))}
          </h1>
        );
        i++;
        continue;
      }

      // 4. Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const itemText = trimmed.replace(/^[-*•]\s*/, '');
        elements.push(
          <div key={i} className="flex gap-2 my-1 ml-1 items-start text-xs sm:text-sm">
            <span className="text-emerald-500 font-bold mt-0.5 shrink-0">•</span>
            <span className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {parseInlineFormatting(itemText)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // 5. Numbered lists
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        elements.push(
          <div key={i} className="flex gap-2 my-1 ml-1 items-start text-xs sm:text-sm">
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs shrink-0 mt-0.5">
              {numMatch[1]}.
            </span>
            <span className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {parseInlineFormatting(numMatch[2])}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // 6. Horizontal Rules
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={i} className="my-2.5 border-gray-200 dark:border-gray-800" />);
        i++;
        continue;
      }

      // 7. Empty lines
      if (trimmed === '') {
        elements.push(<div key={i} className="h-1" />);
        i++;
        continue;
      }

      // 8. Normal Paragraph
      elements.push(
        <p key={i} className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-1.5">
          {parseInlineFormatting(line)}
        </p>
      );
      i++;
    }

    return <div className="space-y-0.5">{elements}</div>;
  };

  return (
    <div className="flex-1 overflow-y-auto px-1.5 sm:px-4 py-2.5 sm:py-6 space-y-4 sm:space-y-6">
      {messages.length === 0 ? (
        /* Empty State (Sesuai Mockup ChatGPT dengan Logo ChatDKPP) */
        <div className="max-w-2xl mx-auto min-h-[75vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-300 space-y-6 px-2">
          {/* Logo Resmi ChatDKPP */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex items-center justify-center select-none">
            <img
              src="/ikon-chatDKPP.png"
              alt="Chat DKPP Kota Cilegon"
              className="w-full h-full object-contain select-none"
            />
          </div>

          {/* Center Greeting Title */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              What’s on the agenda today?
            </h1>
          </div>

          {/* Centered Input Box (Capture 1 & 2: auto-expanding downwards) */}
          <div className="w-full">
            <ChatInput
              onSendMessage={onSendMessage || onSuggestionClick}
              isLoading={isLoading}
              isCentered={true}
              placeholder="Ask anything"
            />
          </div>

          {/* Minimalist Action Pills below input */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSuggestionClick('Apa saja data dan analisis ketahanan pangan yang bisa saya tanyakan?')}
              className="px-4 py-2 rounded-full border border-gray-300/90 hover:border-gray-400 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 shadow-2xs transition-all cursor-pointer"
            >
              What can you do?
            </button>
            <button
              type="button"
              onClick={() => onSuggestionClick('Tampilkan ringkasan status ketahanan pangan dan stabilitas pasokan beras Kota Cilegon.')}
              className="px-4 py-2 rounded-full border border-gray-300/90 hover:border-gray-400 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 shadow-2xs transition-all cursor-pointer"
            >
              Status Ketahanan Pangan
            </button>
          </div>
        </div>
      ) : (
        /* Messages Thread */
        <div
          className={
            viewMode === 'CHAT'
              ? 'max-w-3xl mx-auto space-y-4 sm:space-y-6 w-full px-0'
              : 'max-w-3xl mx-auto space-y-4 sm:space-y-5 w-full px-0'
          }
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-0 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Sleek Avatar (Ikon Resmi Chat DKPP Transparan) - Tampil di Desktop (sm:flex), disembunyikan di Mobile */}
                {!isUser && (
                  <div
                    className="hidden sm:flex w-8 h-8 items-center justify-center shrink-0 mt-0.5 select-none"
                    title="ChatDKPP Intelligence Assistant"
                  >
                    <img
                      src="/ikon-chatDKPP.png"
                      alt="DKPP AI"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div
                  className={
                    isUser
                      ? 'max-w-[92%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl px-3.5 sm:px-5 py-2 sm:py-3 shadow-xs bg-[#A8DCAB] text-emerald-950 font-medium rounded-tr-xs ml-auto'
                      : (msg.type === 'poll_carousel' || !!msg.poll_carousel)
                      ? 'relative group flex-1 min-w-0 w-full max-w-full bg-transparent border-0 shadow-none p-0 text-gray-900'
                      : viewMode === 'CHAT'
                      ? 'relative group flex-1 min-w-0 w-full max-w-full bg-transparent border-0 shadow-none px-0 py-0.5 text-gray-900 pr-7 sm:pr-8'
                      : 'relative group w-full sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm bg-white dark:bg-[#1a1c22] border border-gray-200/80 dark:border-gray-800 rounded-tl-xs pr-7 sm:pr-8'
                  }
                >
                  {/* Top-Right Copy Icon on Assistant Response */}
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, idx)}
                      className="absolute top-1 right-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-all cursor-pointer z-10"
                      title="Salin jawaban ini"
                    >
                      {copiedIndex === idx ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  {/* Tool Calls Status Chips */}
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2">
                      {msg.tool_calls.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800/60"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                          <span>Tool: {tool.name.replace(/_/g, ' ')} ({tool.status})</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Body */}
                  {isUser ? (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <>
                      {msg.type !== 'poll_carousel' && !msg.poll_carousel && renderFormattedContent(msg.content)}

                      {/* 1. Auth Action Card: Login Gmail Required */}
                      {msg.auth_prompt === 'LOGIN_REQUIRED' && onLoginClick && (
                        <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950">
                              <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>Masuk via Akun Google (Gmail)</span>
                            </div>
                            <p className="text-[11px] text-emerald-800 leading-tight">
                              Masuk untuk membuka akses data, menyimpan riwayat, dan verifikasi NIP kepegawaian.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={onLoginClick}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                          >
                            <span>Masuk dengan Gmail</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* 2. Auth Action Card: NIP Verification Required for Citizen / Non-Pegawai */}
                      {msg.auth_prompt === 'NIP_REQUIRED' && onClaimNipClick && (
                        <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-emerald-50 to-emerald-50 border border-emerald-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950">
                              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>Khusus Pegawai Aktif DKPP Kota Cilegon</span>
                            </div>
                            <p className="text-[11px] text-emerald-800 leading-tight">
                              Verifikasi 18 digit NIP resmi Anda untuk ikut memberikan hak suara voting.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={onClaimNipClick}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
                          >
                            <span>Verifikasi NIP Pegawai</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* 3. In-Chat Interactive Poll Card */}
                      {msg.poll_card?.poll && (
                        <div className="mt-3.5 pt-1 space-y-3">
                          <PollCard
                            poll={msg.poll_card.poll}
                            onExploreOther={() => onSendMessage?.('katalog semua polling')}
                          />

                          {/* Quick Category Switcher Pills in Chat */}
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                Pilih Tema Polling Lainnya:
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenCarousel) {
                                    onOpenCarousel(msg.poll_card?.poll?.code || 'cantik');
                                  } else {
                                    onSendMessage?.('lihat carousel live polling');
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                              >
                                <span>🎠 Live Carousel (15 Tema)</span>
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { label: '💃 Paling Cantik', code: 'cantik' },
                                { label: '💇 Paling Ganteng', code: 'ganteng' },
                                { label: '📚 Paling Rajin', code: 'rajin' },
                                { label: '🧠 Paling Cerdas', code: 'cerdas' },
                                { label: '🕌 Paling Soleh', code: 'soleh' },
                                { label: '😂 Paling Lucu', code: 'lucu' },
                                { label: '🎁 Paling Royal', code: 'royal' },
                                { label: '❤️ Paling Baik', code: 'baik' },
                                { label: '📋 Semua 15 Tema', code: 'all' },
                              ].map((cat) => (
                                <button
                                  key={cat.code}
                                  type="button"
                                  onClick={() => {
                                    if (cat.code === 'all') {
                                      onSendMessage?.('katalog semua polling');
                                    } else {
                                      onSendMessage?.(`siapa pegawai ${cat.label.replace(/^[^\s]+\s*/, '')}`);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                                    msg.poll_card?.poll?.code === cat.code
                                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                      : 'bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700'
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. In-Chat Interactive Poll Catalog Grid (Screen 7) */}
                      {msg.poll_catalog?.themes && (
                        <div className="mt-3.5 space-y-3">
                          <ThemeCatalog
                            themes={msg.poll_catalog.themes}
                            onSelectTheme={(themeCode) => {
                              const selectedTheme = msg.poll_catalog?.themes.find((t) => t.code === themeCode);
                              const label = selectedTheme?.short_label || themeCode;
                              onSendMessage?.(`siapa pegawai ${label.toLowerCase()}`);
                            }}
                          />
                          <div className="text-center pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenCarousel) {
                                  onOpenCarousel('cantik');
                                } else {
                                  onSendMessage?.('lihat carousel live polling');
                                }
                              }}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              <span>🎠 Putar Live Carousel Hasil 15 Tema</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 5. In-Chat Interactive Live Results Carousel */}
                      {(msg.type === 'poll_carousel' || msg.poll_carousel) && (
                        <div className="mt-2.5 w-full max-w-full overflow-visible">
                          <LiveResultsCarousel
                            initialThemeCode={msg.poll_carousel?.initialThemeCode || 'cantik'}
                            onSelectThemeForVoting={(themeCode) => {
                              onSendMessage?.(`siapa pegawai ${themeCode}`);
                            }}
                            onAskAi={(prompt) => {
                              onSendMessage?.(prompt);
                            }}
                          />
                        </div>
                      )}

                      {/* 6. In-Chat Food Price ML Forecast Table (Sesuai Capture) */}
                      {(msg.type === 'forecast_table' || msg.forecast_table) && msg.forecast_table && (
                        <div className="mt-2.5 w-full max-w-full overflow-visible">
                          <ForecastChatTable
                            data={msg.forecast_table}
                            onAskCommodity={(prompt) => {
                              onSendMessage?.(prompt);
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Interactive Action Bar on Assistant Responses */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-800 text-gray-400 text-xs">
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors p-1 rounded"
                        title="Salin jawaban bersih"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => toggleFeedback(idx, 'like')}
                        className={`p-1 rounded transition-colors ${
                          feedbackState[idx] === 'like'
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                        title="Jawaban Akurat"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleFeedback(idx, 'dislike')}
                        className={`p-1 rounded transition-colors ${
                          feedbackState[idx] === 'dislike'
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                            : 'hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                        title="Perlu Koreksi"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Tawaran Beralih ke Mode Peta GIS (1-Klik Tanpa Pop-up Berulang) */}
                  {!isUser && msg.map_actions && msg.map_actions.length > 0 && onOpenMap && (
                    <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                            Tampilan Peta Spasial GIS Tersedia
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-tight mt-0.5">
                            Buka peta untuk melihat visualisasi geospasial & poligon wilayah terkait.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenMap(msg.map_actions?.[0], msg.content)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <span>Buka Mode Peta GIS</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}


                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 flex items-center justify-center shrink-0 select-none">
                <img
                  src="/ikon-chatDKPP.png"
                  alt="DKPP AI"
                  className="w-full h-full object-contain animate-pulse"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#1a1c22] border border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#A8DCAB] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#A8DCAB] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-[#A8DCAB] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>ChatDKPP sedang menganalisis knowledge base documents</span>
              </div>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>
      )}
    </div>
  );
};
