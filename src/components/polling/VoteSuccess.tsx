'use client';

import React, { useEffect } from 'react';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import confetti from 'canvas-confetti';

interface VoteSuccessProps {
  pollTitle: string;
  choicesCount: number;
  onViewResults: () => void;
}

export const VoteSuccess: React.FC<VoteSuccessProps> = ({
  pollTitle,
  choicesCount,
  onViewResults
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#007A55', '#10B981', '#34D399', '#FBBF24', '#38BDF8']
      });
    } catch {
      // Confetti optional
    }
  }, []);

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs text-center space-y-4 animate-in fade-in duration-200 overflow-hidden relative">
      {/* Festive Background Effect */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-teal-500" />

      {/* Header Trophy & Title */}
      <div className="pt-2">
        <div className="text-3xl mb-1.5 select-none">🏆</div>
        <h3 className="font-bold text-[#1e293b] text-base sm:text-lg">
          Polling: {pollTitle}
        </h3>
      </div>

      {/* Success Green Pill (Screen 5) */}
      <div className="bg-[#E6F4EA] border border-[#CEEAD6] rounded-2xl p-3.5 max-w-xs mx-auto text-center space-y-1">
        <div className="flex items-center justify-center gap-2 font-bold text-[#137333] text-sm sm:text-base">
          <div className="w-5 h-5 rounded-full bg-[#137333] text-white flex items-center justify-center text-xs">
            <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Pilihanmu sudah masuk!</span>
        </div>
        <p className="text-xs text-[#137333]/80 font-medium">
          ({choicesCount} nama)
        </p>
      </div>

      {/* Action Button: Lihat Hasil Live → (Screen 5) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onViewResults}
          className="w-full py-3 px-5 bg-[#007A55] hover:bg-[#006848] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Lihat Hasil Live →</span>
        </button>
      </div>

      {/* Subtext info box */}
      <div className="p-3 bg-[#F8FAFC] rounded-xl text-[11px] text-gray-500 leading-relaxed text-center border border-slate-100">
        Hasil bersifat anonim. Untuk transparansi, semua pilihan dapat dilihat di portal admin (akses terbatas).
      </div>
    </div>
  );
};
