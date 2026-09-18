'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiX, FiArrowRight, FiTrendingUp } from 'react-icons/fi';

const PULSE_ITEMS = [
  { icon: '😊', label: 'Paling Murah Senyum', count: 37, code: 'murah_senyum' },
  { icon: '💇', label: 'Paling Ganteng', count: 42, code: 'ganteng' },
  { icon: '💃', label: 'Paling Cantik', count: 48, code: 'cantik' },
  { icon: '🎁', label: 'Paling Royal (Suka Traktir)', count: 29, code: 'royal' },
  { icon: '🧠', label: 'Paling Cerdas', count: 35, code: 'cerdas' },
  { icon: '😂', label: 'Paling Lucu', count: 41, code: 'lucu' },
];

export const PollPulseCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    // Check local storage preference
    const dismissed = localStorage.getItem('dkpp_poll_banner_dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % PULSE_ITEMS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('dkpp_poll_banner_dismissed', 'true');
  };

  const currentPulse = PULSE_ITEMS[pulseIndex];

  return (
    <div className="space-y-3">
      {/* 1. Big Hero Polling Banner */}
      {isVisible && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 shadow-xl border border-emerald-500/40 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Background Decorative Circles */}
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup banner"
          >
            <FiX className="w-4 h-4" />
          </button>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-amber-950 uppercase tracking-wide shadow-xs">
                  BARU!
                </span>
                <span className="text-xs text-emerald-100 font-medium bg-emerald-800/60 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Seru • Lucu • Tanpa Nama
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Yuk Ikutan <span className="text-amber-300">POLLING PEGAWAI</span>
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Siapa rekan kerja yang paling ganteng, cantik, rajin, cerdas, atau suka traktir? Pilih 3 nama favoritmu sekarang!
              </p>

              <div className="flex items-center gap-3 pt-1">
                <Link
                  href="/polling"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Lihat Polling Sekarang <FiArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-emerald-200 font-medium">
                  🔥 15 tema aktif
                </span>
              </div>
            </div>

            {/* Mascot / Visual Elements */}
            <div className="hidden sm:flex flex-col items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center w-36 shrink-0 shadow-inner">
              <div className="text-4xl mb-1 animate-bounce">🏆</div>
              <span className="text-xs font-bold text-white">100% Anonim</span>
              <span className="text-[10px] text-emerald-200">Suara terjaga aman</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Polling Pulse Rotating Ticker (Berganti otomatis tiap 8 detik) */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 px-4 shadow-xs flex items-center justify-between gap-3 text-xs text-gray-800 transition-all hover:bg-emerald-50">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex-shrink-0 text-base">👀</span>
          <div className="min-w-0 truncate">
            <span className="font-medium text-emerald-900 mr-1">Lagi ramai di DKPP:</span>
            <span className="font-bold text-gray-900">
              {currentPulse.icon} {currentPulse.label}
            </span>
            <span className="text-gray-500 ml-1.5 hidden sm:inline">
              • {currentPulse.count} pegawai sudah memilih
            </span>
          </div>
        </div>

        <Link
          href={`/polling/${currentPulse.code}`}
          className="flex-shrink-0 inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100/60 px-3 py-1 rounded-lg border border-emerald-300 transition-colors shadow-2xs"
        >
          <span>Ikut Polling</span>
          <FiArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
