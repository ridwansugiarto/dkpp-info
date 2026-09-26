'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';
import { PollTheme } from '@/lib/polling/types';
import { usePollResults } from '@/hooks/usePollResults';
import { EmployeeMediaAvatar } from './EmployeeMediaAvatar';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiPlay, 
  FiPause, 
  FiX, 
} from 'react-icons/fi';
import { Sparkles, MessageSquare, Trophy, Vote, HelpCircle, ArrowRight, MoveHorizontal } from 'lucide-react';

interface LiveResultsCarouselProps {
  initialThemeCode?: string;
  isModal?: boolean;
  onClose?: () => void;
  onSelectThemeForVoting?: (themeCode: string) => void;
  onAskAi?: (prompt: string) => void;
}

// Sub-komponen drag-to-scroll vertikal untuk body carousel di mobile & desktop
const DraggableScrollContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  hasMoreItems?: boolean;
}> = ({ children, className = '', hasMoreItems = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showBottomHint, setShowBottomHint] = useState(hasMoreItems);
  const startYRef = useRef(0);
  const scrollTopRef = useRef(0);
  const isPointerDownRef = useRef(false);

  const checkScrollPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    setShowBottomHint(!isAtBottom && el.scrollHeight > el.clientHeight);
  }, []);

  useEffect(() => {
    checkScrollPosition();
  }, [hasMoreItems, checkScrollPosition]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    const el = containerRef.current;
    if (!el) return;

    isPointerDownRef.current = true;
    setIsDragging(true);
    startYRef.current = e.clientY;
    scrollTopRef.current = el.scrollTop;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const deltaY = e.clientY - startYRef.current;
    el.scrollTop = scrollTopRef.current - deltaY;
    checkScrollPosition();
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    setIsDragging(false);
  };

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onScroll={checkScrollPosition}
        className={`overflow-y-auto overscroll-y-contain touch-pan-y ${
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        } ${className}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        {children}
      </div>

      {/* Visual Scroll Hint Badge jika data melebihi tinggi container */}
      {showBottomHint && (
        <div className="pointer-events-none sticky bottom-0 left-0 right-0 pt-3 pb-1 flex items-center justify-center bg-gradient-to-t from-white dark:from-gray-900 via-white/85 dark:via-gray-900/85 to-transparent transition-opacity duration-300">
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/95 dark:bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs animate-pulse flex items-center gap-1">
            <span>↕</span>
            <span>Geser / scroll ke bawah untuk peringkat lainnya</span>
          </span>
        </div>
      )}
    </div>
  );
};

// Sub-komponen per slide agar data terisolasi & efisien
const CarouselSlideTheme: React.FC<{
  theme: PollTheme;
  isActive: boolean;
  shouldLoad: boolean;
  onVoteClick?: (code: string) => void;
  onAskAi?: (prompt: string) => void;
}> = ({ theme, isActive, shouldLoad, onVoteClick, onAskAi }) => {
  const [hasLoaded, setHasLoaded] = useState<boolean>(isActive || shouldLoad);

  useEffect(() => {
    if (isActive || shouldLoad) {
      setHasLoaded(true);
    }
  }, [isActive, shouldLoad]);

  const { results, totalVotes, loading, isRestricted, restrictedMessage } = usePollResults(
    hasLoaded ? theme.id : undefined,
    hasLoaded ? theme.code : undefined
  );

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-500 text-white shadow-amber-200 dark:shadow-none shadow-sm';
    if (rank === 2) return 'bg-slate-400 text-white shadow-slate-200 dark:shadow-none shadow-sm';
    if (rank === 3) return 'bg-orange-500 text-white shadow-orange-200 dark:shadow-none shadow-sm';
    return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const topThree = results.slice(0, 3);
  const rest = results.slice(3, 10);

  return (
    <div className="space-y-3.5 select-text">
      {/* Theme Title & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-900 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-xl sm:text-2xl shadow-xs shrink-0">
            {theme.icon || '🏆'}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug truncate">
              {theme.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {theme.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">{isRestricted ? 'Akses Terbatas' : `${totalVotes} Suara Masuk`}</span>
          </div>
        </div>
      </div>

      {/* Restricted State */}
      {isRestricted ? (
        <div className="py-8 text-center space-y-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-dashed border-amber-200 dark:border-amber-800 p-4">
          <div className="text-2xl sm:text-3xl">🔒</div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100">Akses Hasil Polling Dibatasi</p>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300 max-w-sm mx-auto leading-relaxed">
              {restrictedMessage || 'Hasil live polling kepegawaian hanya dapat ditampilkan kepada Pegawai Resmi DKPP Kota Cilegon yang telah terverifikasi melalui Nomor Induk Pegawai (NIP).'}
            </p>
          </div>
        </div>
      ) : loading && results.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center space-y-2.5">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Memuat perolehan suara live...</p>
        </div>
      ) : results.length === 0 ? (
        /* Empty State */
        <div className="py-8 text-center space-y-2.5 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl sm:text-3xl">🗳️</div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">Belum ada suara masuk</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Jadilah pegawai pertama yang memberikan suara apresiasi untuk tema ini!
            </p>
          </div>
          {onVoteClick && (
            <button
              type="button"
              onClick={() => onVoteClick(theme.code)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer mt-1"
            >
              <span>Beri Suara Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        /* Results Table / List (Maksimal 10 Besar & Scrollable / Draggable Vertikal) */
        <div className="space-y-3">
          <DraggableScrollContainer
            hasMoreItems={rest.length > 0}
            className="space-y-2 max-h-[270px] sm:max-h-[320px] pr-1"
          >
            {/* Top 3 Podium Cards */}
            {topThree.map((item) => (
              <div
                key={item.employee_id}
                className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-extrabold shrink-0 ${getRankBadgeStyle(item.rank)}`}>
                    {item.rank}
                  </div>

                  {/* Employee Photo / Avatar Media Placeholder */}
                  <EmployeeMediaAvatar
                    photoUrl={item.photo_url}
                    nip={item.nip}
                    employeeId={item.employee_id}
                    name={item.full_name}
                    rank={item.rank}
                    size="sm"
                  />

                  <div className="min-w-0">
                    <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
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
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                      <span className="font-mono text-gray-400 font-bold w-4 text-[11px] shrink-0">{item.rank}.</span>

                      {/* Employee Photo / Avatar Media Placeholder */}
                      <EmployeeMediaAvatar
                        photoUrl={item.photo_url}
                        nip={item.nip}
                        employeeId={item.employee_id}
                        name={item.full_name}
                        rank={item.rank}
                        size="xs"
                      />

                      {/* Nama Pegawai Urutan 4-10: Font diperbesar & BOLD */}
                      <span className="font-bold text-[12px] sm:text-[13px] text-gray-900 dark:text-gray-100 truncate">
                        {item.full_name}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      {item.total_votes} suara ({item.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DraggableScrollContainer>

          {/* Interactive Chat Response & Discussion Chips */}
          <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Analisis AI & Diskusi:</span>
              </span>
              <span className="text-[10px] text-gray-400 hidden sm:inline">Klik untuk langsung chat</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {onAskAi && (
                <>
                  <button
                    type="button"
                    onClick={() => onAskAi(`Bagaimana analisis perolehan suara sementara untuk tema "${theme.title}" di DKPP Kota Cilegon?`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-[11px] font-medium border border-emerald-200/80 dark:border-emerald-800/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Analisis {theme.short_label}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAskAi(`Siapa saja pegawai pemuncak dan perolehan suara di tema "${theme.title}"?`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-[10px] sm:text-[11px] font-medium border border-teal-200/80 dark:border-teal-800/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Trophy className="w-3 h-3 text-teal-500 shrink-0" />
                    <span>Kandidat teratas</span>
                  </button>
                </>
              )}

              {onVoteClick && (
                <button
                  type="button"
                  onClick={() => onVoteClick(theme.code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[10px] sm:text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer ml-auto"
                >
                  <Vote className="w-3 h-3" />
                  <span>Ikut Vote</span>
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
  const [themes, setThemes] = useState<PollTheme[]>(OFFICIAL_POLL_THEMES);

  useEffect(() => {
    fetch('/api/polling/themes')
      .then((res) => res.json())
      .then((data) => {
        if (data?.themes && data.themes.length > 0) {
          setThemes(data.themes);
        }
      })
      .catch(() => {});
  }, []);

  const initialIndex = initialThemeCode 
    ? Math.max(0, themes.findIndex((t) => t.code === initialThemeCode.replace(/^poll-/, '')))
    : 0;

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex >= 0 ? initialIndex : 0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const pillsContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScroll = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fungsi scroll track ke slide tertentu secara halus
  const scrollToSlide = useCallback((index: number, smooth: boolean = true) => {
    const target = Math.max(0, Math.min(themes.length - 1, (index + themes.length) % themes.length));
    setCurrentIndex(target);
    isProgrammaticScroll.current = true;

    if (trackRef.current) {
      const containerWidth = trackRef.current.clientWidth;
      trackRef.current.scrollTo({
        left: target * containerWidth,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 450);
  }, [themes.length]);

  const nextSlide = useCallback(() => {
    scrollToSlide(currentIndex + 1);
  }, [currentIndex, scrollToSlide]);

  const prevSlide = useCallback(() => {
    scrollToSlide(currentIndex - 1);
  }, [currentIndex, scrollToSlide]);

  // Listener scroll track horisontal pada swipe mobile / touch / scroll
  const handleTrackScroll = () => {
    if (isProgrammaticScroll.current || !trackRef.current) return;
    const scrollLeft = trackRef.current.scrollLeft;
    const width = trackRef.current.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex >= 0 && newIndex < themes.length && newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  // Inisialisasi posisi awal slide
  useEffect(() => {
    if (initialIndex > 0) {
      const timer = setTimeout(() => {
        scrollToSlide(initialIndex, false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialIndex, scrollToSlide]);

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
      }, 7000);
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

  const content = (
    <div className="relative w-full flex items-center justify-center py-2 px-1 xs:px-2 select-none">
      {/* Tombol Neon Chevron Kiri (<) Sesuai Mockup Capture 1 & 2 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        aria-label="Tema Sebelumnya"
        className="absolute left-0.5 sm:left-1 z-30 w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/95 dark:bg-gray-900/90 border-2 border-emerald-400 dark:border-emerald-400 text-emerald-500 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.55),inset_0_0_8px_rgba(16,185,129,0.2)] hover:shadow-[0_0_24px_rgba(16,185,129,0.9),inset_0_0_10px_rgba(16,185,129,0.35)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md"
        title="Tema Sebelumnya"
      >
        <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
      </button>

      {/* Card Bodi Carousel (Diperkecil agar sisi kanan-kiri pas untuk panah neon) */}
      <div 
        className={`w-full max-w-[calc(100%-66px)] xs:max-w-[calc(100%-74px)] sm:max-w-[560px] md:max-w-[620px] bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col mx-auto ${
          isModal ? 'max-w-2xl max-h-[90vh]' : ''
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* 1. Header Bar */}
        <div className="px-3.5 sm:px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="p-1.5 rounded-lg bg-white/15 backdrop-blur-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm md:text-base font-bold leading-tight truncate">
                Live Hasil Polling Pegawai DKPP
              </h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-100/90 truncate">
                {themes.length} Tema Apresiasi Internal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Auto-play toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isAutoPlay 
                  ? 'bg-white text-emerald-800 shadow-xs font-bold' 
                  : 'bg-white/15 text-emerald-100 hover:bg-white/25'
              }`}
              title={isAutoPlay ? 'Jeda Putar Otomatis' : 'Mulai Putar Otomatis'}
            >
              {isAutoPlay ? <FiPause className="w-3 h-3" /> : <FiPlay className="w-3 h-3" />}
              <span className="text-[10px] sm:text-[11px] hidden xs:inline">
                {isAutoPlay ? 'Auto' : 'Auto'}
              </span>
            </button>

            {/* Slide Indicator Badge */}
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/20 text-white text-[10px] sm:text-[11px] font-mono font-bold whitespace-nowrap">
              {currentIndex + 1} / {themes.length}
            </span>

            {/* Close button for modal */}
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer ml-0.5"
                title="Tutup"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Theme Pills Quick Switcher (Horizontal Scrollable) */}
        <div 
          ref={pillsContainerRef}
          className="px-3 py-2 bg-gray-50/90 dark:bg-gray-800/70 border-b border-gray-100 dark:border-gray-800 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {themes.map((t, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={t.code}
                type="button"
                onClick={() => scrollToSlide(idx)}
                className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs scale-102 font-bold'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-gray-600'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.short_label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Main Slide Track (Scrollable Horisontal dengan snap) */}
        <div className="relative w-full overflow-hidden bg-white dark:bg-gray-900">
          {/* Swipe instruction hint bar for mobile */}
          <div className="px-3 py-1 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100/50 dark:border-emerald-900/30 flex items-center justify-between text-[10px] text-emerald-800/80 dark:text-emerald-300/80 sm:hidden">
            <span className="inline-flex items-center gap-1 font-medium">
              <MoveHorizontal className="w-3 h-3 text-emerald-600" />
              Geser kiri/kanan untuk tema lain
            </span>
            <span className="font-mono text-[9px] font-bold">
              Tema {currentIndex + 1} dari {themes.length}
            </span>
          </div>

          {/* Scroll Track Container - menggunakan touch-pan-y agar gesture drag vertikal leluasa */}
          <div
            ref={trackRef}
            onScroll={handleTrackScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar touch-pan-y sm:touch-auto overscroll-x-contain w-full min-h-[280px]"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {themes.map((theme, idx) => (
              <div
                key={theme.code}
                className="min-w-full w-full shrink-0 snap-center snap-always p-3.5 sm:p-5 box-border"
              >
                <CarouselSlideTheme 
                  theme={theme}
                  isActive={idx === currentIndex}
                  shouldLoad={Math.abs(idx - currentIndex) <= 2}
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
            ))}
          </div>
        </div>

        {/* 4. Footer Controls (Compact, clean with dots indicator) */}
        <div className="px-3 py-2 sm:py-2.5 bg-gray-50/90 dark:bg-gray-800/70 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 gap-2">
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Tema <strong className="text-emerald-600 dark:text-emerald-400">{currentIndex + 1}</strong> dari {themes.length}
          </span>

          {/* Dots Pagination */}
          <div className="flex items-center gap-1 max-w-[140px] sm:max-w-[200px] overflow-x-auto no-scrollbar py-0.5 px-1">
            {themes.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => scrollToSlide(dotIdx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  dotIdx === currentIndex
                    ? 'w-4 sm:w-5 bg-emerald-600 dark:bg-emerald-400'
                    : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                }`}
                title={`Tema ${dotIdx + 1}: ${themes[dotIdx].title}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400">
            <span className="hidden xs:inline">Panah neon kiri/kanan</span>
          </div>
        </div>
      </div>

      {/* Tombol Neon Chevron Kanan (>) Sesuai Mockup Capture 1 & 2 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Tema Berikutnya"
        className="absolute right-0.5 sm:right-1 z-30 w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/95 dark:bg-gray-900/90 border-2 border-emerald-400 dark:border-emerald-400 text-emerald-500 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.55),inset_0_0_8px_rgba(16,185,129,0.2)] hover:shadow-[0_0_24px_rgba(16,185,129,0.9),inset_0_0_10px_rgba(16,185,129,0.35)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-md"
        title="Tema Berikutnya"
      >
        <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
      </button>
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


