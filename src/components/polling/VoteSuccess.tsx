'use client';

import React, { useEffect } from 'react';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import confetti from 'canvas-confetti';

interface VoteSuccessProps {
  pollTitle: string;
  choicesCount: number;
  onViewResults: () => void;
  isGovernanceExempt?: boolean;
  onVoteAgain?: () => void;
}

export const VoteSuccess: React.FC<VoteSuccessProps> = ({
  pollTitle,
  choicesCount,
  onViewResults,
  isGovernanceExempt,
  onVoteAgain
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: isGovernanceExempt
          ? ['#7C3AED', '#9333EA', '#10B981', '#F59E0B', '#3B82F6']
          : ['#007A55', '#10B981', '#34D399', '#FBBF24', '#38BDF8']
      });
    } catch {
      // Confetti optional
    }
  }, [isGovernanceExempt]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 shadow-xs text-center space-y-4 animate-in fade-in duration-200 overflow-hidden relative">
      {/* Festive Background Effect */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-teal-500" />

      {/* Header Trophy & Title */}
      <div className="pt-2">
        <div className="text-3xl mb-1.5 select-none">🏆</div>
        <h3 className="font-bold text-[#1e293b] dark:text-white text-base sm:text-lg">
          Polling: {pollTitle}
        </h3>
      </div>

      {/* Success Pill */}
      <div className="bg-[#E6F4EA] dark:bg-emerald-950/50 border border-[#CEEAD6] dark:border-emerald-800 text-[#137333] dark:text-emerald-300 rounded-2xl p-3.5 max-w-xs mx-auto text-center space-y-1">
        <div className="flex items-center justify-center gap-2 font-bold text-sm sm:text-base">
          <div className="w-5 h-5 rounded-full bg-[#137333] text-white flex items-center justify-center text-xs">
            <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Pilihanmu sudah masuk!</span>
        </div>
        <p className="text-xs opacity-80 font-medium">
          ({choicesCount} nama terpilih)
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-1 space-y-2">
        <button
          type="button"
          onClick={onViewResults}
          className="w-full py-3 px-5 bg-[#007A55] hover:bg-[#006848] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Lihat Hasil Live →</span>
        </button>

        {isGovernanceExempt && onVoteAgain && (
          <button
            type="button"
            onClick={onVoteAgain}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 active:scale-[0.99] text-gray-700 dark:text-gray-200 font-semibold text-xs rounded-xl border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Vote - mode admin</span>
          </button>
        )}
      </div>

      {/* Subtext info box */}
      <div className="p-3 bg-[#F8FAFC] dark:bg-gray-800/60 rounded-xl text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed text-center border border-slate-100 dark:border-gray-800">
        Hasil bersifat anonim. Untuk transparansi, semua pilihan dapat dilihat di portal admin (akses terbatas).
      </div>
    </div>
  );
};
