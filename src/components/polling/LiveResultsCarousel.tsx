'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';
import { usePollResults } from '@/hooks/usePollResults';
import { AnimatedPercentage } from './AnimatedPercentage';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiPlay, 
  FiPause, 
  FiX, 
  FiMaximize2, 
  FiCheckCircle,
} from 'react-icons/fi';
import { Sparkles, MessageSquare, Trophy, Vote, HelpCircle, ArrowRight } from 'lucide-react';

interface LiveResultsCarouselProps {
  initialThemeCode?: string;
  isModal?: boolean;
  onClose?: () => void;
  onSelectThemeForVoting?: (themeCode: string) => void;
  onAskAi?: (prompt: string) => void;
}

// Sub-komponen per slide agar hook usePollResults terisolasi dengan performa optimal
const CarouselSlideTheme: React.FC<{
  theme: typeof OFFICIAL_POLL_THEMES[0];
  onVoteClick?: (code: string) => void;
  onAskAi?: (prompt: string) => void;
}> = ({ theme, onVoteClick, onAskAi }) => {
  const { results, totalVotes, loading } = usePollResults(theme.id, theme.code);

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-500 text-white shadow-amber-200 dark:shadow-none shadow-sm';
    if (rank === 2) return 'bg-slate-400 text-white shadow-slate-200 dark:shadow-none shadow-sm';
    if (rank === 3) return 'bg-orange-500 text-white shadow-orange-200 dark:shadow-none shadow-sm';
    return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const topThree = results.slice(0, 3);
  const rest = results.slice(3, 10);

  return (
    <div className="space-y-4">
      {/* Theme Title & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-900 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-2xl shadow-xs shrink-0">
            {theme.icon || '🏆'}
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
              {theme.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {theme.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{totalVotes} Total Suara</span>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && results.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Memuat perolehan suara live...</p>
        </div>
      ) : results.length === 0 ? (
        /* Empty State */
        <div className="py-10 text-center space-y-3 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="text-3xl">🗳️</div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Belum ada suara masuk</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Jadilah pegawai pertama yang memberikan suara apresiasi untuk tema ini!
            </p>
          </div>
          {onVoteClick && (
            <button
              type="button"
              onClick={() => onVoteClick(theme.code)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <span>Beri Suara Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        /* Results Table / List (Maksimal 10 Besar & Scrollable) */
        <div className="space-y-3">
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {/* Top 3 Podium Cards */}
            {topThree.map((item) => (
              <div
                key={item.employee_id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${getRankBadgeStyle(item.rank)}`}>
                    {item.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                      {item.full_name}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {item.position} • {item.unit}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                    {item.percentage}%
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">
                    {item.total_votes} suara
                  </div>
                </div>
              </div>
            ))}

            {/* Rest of rank (Peringkat 4 s/d 10) */}
            {rest.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Peringkat Lainnya (Top 10)</div>
                {rest.map((item) => (
                  <div
                    key={item.employee_id}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white/60 dark:bg-gray-800/40 border border-gray-100/80 dark:border-gray-700/40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-gray-400 font-bold w-5">{item.rank}.</span>
                      <span className="font-medium truncate">{item.full_name}</span>
                    </div>
                    <div className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      {item.total_votes} suara ({item.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Chat Response & Discussion Chips */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Lanjutkan Diskusi & Analisis dengan AI:</span>
              </span>
              <span className="text-[10px] text-gray-400">Klik untuk langsung chat</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {onAskAi && (
                <>
                  <button
                    type="button"
                    onClick={() => onAskAi(`Bagaimana analisis perolehan suara sementara untuk tema "${theme.title}" di DKPP Kota Cilegon?`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200/80 dark:border-emerald-800/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Analisis hasil {theme.short_label}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAskAi(`Siapa saja pegawai pemuncak dan perolehan suara di tema "${theme.title}"?`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-[11px] font-medium border border-teal-200/80 dark:border-teal-800/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Trophy className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>Siapa kandidat teratas?</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAskAi(`Bandingkan hasil polling tema "${theme.title}" dengan tema polling DKPP lainnya.`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200/80 dark:border-slate-700/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Bandingkan tema lain</span>
                  </button>
                </>
              )}

              {onVoteClick && (
                <button
                  type="button"
                  onClick={() => onVoteClick(theme.code)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer ml-auto"
                >
                  <Vote className="w-3.5 h-3.5" />
                  <span>Ikut Vote Tema Ini</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const LiveResultsCarousel: React.FC<LiveResultsCarouselProps> = ({
  initialThemeCode,
  isModal = false,
  onClose,
  onSelectThemeForVoting,
  onAskAi,
}) => {
  const themes = OFFICIAL_POLL_THEMES;
  const initialIndex = initialThemeCode 
    ? Math.max(0, themes.findIndex((t) => t.code === initialThemeCode.replace(/^poll-/, '')))
    : 0;

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex >= 0 ? initialIndex : 0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false); // Default: Pause / Manual hingga user klik Auto
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const pillsContainerRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % themes.length);
  }, [themes.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + themes.length) % themes.length);
  }, [themes.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, onClose]);

  // Auto-play interval
  useEffect(() => {
    if (isAutoPlay && !isPaused) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, 7000); // 7 detik per slide
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlay, isPaused, nextSlide]);

  // Scroll active pill into view smoothly
  useEffect(() => {
    if (pillsContainerRef.current) {
      const activeEl = pillsContainerRef.current.children[currentIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const currentTheme = themes[currentIndex];

  const content = (
    <div 
      className={`bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col ${
        isModal ? 'max-w-2xl w-full max-h-[90vh]' : 'w-full'
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Header Bar */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/15 backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold leading-tight">
              Live Hasil Polling Pegawai DKPP
            </h3>
            <p className="text-[11px] text-emerald-100/90">
              Carousel 15 Tema Apresiasi Internal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-play toggle (Default: Mati/Pause sampai user klik) */}
          <button
            type="button"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAutoPlay 
                ? 'bg-white text-emerald-800 shadow-xs font-bold' 
                : 'bg-white/15 text-emerald-100 hover:bg-white/25'
            }`}
            title={isAutoPlay ? 'Jeda Putar Otomatis' : 'Mulai Putar Otomatis'}
          >
            {isAutoPlay ? <FiPause className="w-3.5 h-3.5" /> : <FiPlay className="w-3.5 h-3.5" />}
            <span className="text-[11px]">
              {isAutoPlay ? 'Auto (Aktif)' : 'Auto'}
            </span>
          </button>

          {/* Slide Indicator Badge */}
          <span className="px-2.5 py-1 rounded-full bg-black/20 text-white text-[11px] font-mono font-bold">
            {currentIndex + 1} / {themes.length}
          </span>

          {/* Close button for modal */}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer ml-1"
              title="Tutup"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Theme Pills Quick Switcher */}
      <div 
        ref={pillsContainerRef}
        className="px-3 py-2.5 bg-gray-50/90 dark:bg-gray-800/70 border-b border-gray-100 dark:border-gray-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0"
      >
        {themes.map((t, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={t.code}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs scale-102'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-gray-600'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.short_label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Slide Area */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 relative min-h-[320px]">
        <CarouselSlideTheme 
          theme={currentTheme} 
          onVoteClick={(code) => {
            if (onSelectThemeForVoting) {
              onSelectThemeForVoting(code);
            }
            if (isModal && onClose) {
              onClose();
            }
          }}
          onAskAi={(prompt) => {
            if (onAskAi) {
              onAskAi(prompt);
            }
            if (isModal && onClose) {
              onClose();
            }
          }}
        />
      </div>

      {/* 4. Footer Controls */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={prevSlide}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
        >
          <FiChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Tema Sebelumnya</span>
        </button>

        {/* Dots Pagination */}
        <div className="flex items-center gap-1 max-w-[200px] overflow-hidden px-2">
          {themes.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setCurrentIndex(dotIdx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                dotIdx === currentIndex
                  ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                  : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              title={`Slide ${dotIdx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={nextSlide}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <span className="hidden sm:inline">Tema Berikutnya</span>
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
