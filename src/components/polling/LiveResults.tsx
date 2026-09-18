'use client';

import React, { useState, useEffect } from 'react';
import { PollResultItem, PollTheme } from '@/lib/polling/types';
import { AnimatedPercentage } from './AnimatedPercentage';

interface LiveResultsProps {
  poll: PollTheme;
  results: PollResultItem[];
  totalVotes: number;
  onExploreOther?: () => void;
  showExploreButton?: boolean;
}

export const LiveResults: React.FC<LiveResultsProps> = ({
  poll,
  results,
  totalVotes,
  onExploreOther,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const topThree = results.slice(0, 3);
  const rest = results.slice(3);

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-[#F59E0B] text-white'; // Gold
    if (rank === 2) return 'bg-[#94A3B8] text-white'; // Silver
    if (rank === 3) return 'bg-[#EA580C] text-white'; // Bronze / Orange
    return 'bg-slate-200 text-slate-700';
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden divide-y divide-gray-100">
      {/* Header (Screen 6) */}
      <div className="p-4 sm:p-4.5 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl shrink-0">
            {poll.icon || '🏆'}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1e293b] leading-tight">
              Hasil Polling
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              {poll.title}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse" />
            <span>Live • Update {currentTime || '09:27'}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
            <strong className="text-gray-800">{totalVotes}</strong> suara
          </p>
        </div>
      </div>

      {/* Main Results Body (Screen 6) */}
      <div className="p-4 sm:p-4.5 space-y-4">
        {results.length === 0 ? (
          <div className="text-center py-6 text-gray-500 space-y-1.5">
            <div className="text-2xl">🗳️</div>
            <p className="text-xs font-semibold">Belum ada suara masuk untuk tema ini.</p>
            <p className="text-[11px] text-gray-400">Jadilah yang pertama memberikan suara!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            <div className="space-y-2.5">
              {topThree.map((item) => {
                const badgeClass = getRankBadgeStyle(item.rank);

                return (
                  <div
                    key={item.employee_id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {/* Rank Number Circle */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${badgeClass}`}>
                        {item.rank}
                      </div>

                      {/* Employee Photo / Avatar */}
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {item.photo_url ? (
                          <img src={item.photo_url} alt={item.full_name} className="w-full h-full object-cover" />
                        ) : (
                          item.full_name.substring(0, 2).toUpperCase()
                        )}
                      </div>

                      {/* Name & Position */}
                      <div className="min-w-0 truncate">
                        <p className="font-bold text-[#1e293b] text-xs sm:text-sm truncate">
                          {item.full_name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {item.position || item.unit || 'DKPP Kota Cilegon'}
                        </p>
                      </div>
                    </div>

                    {/* Percentage & Vote Count */}
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-extrabold text-[#1e293b]">
                        <AnimatedPercentage value={item.percentage} />
                      </div>
                      <p className="text-[10.5px] text-gray-400 font-normal">
                        ({item.total_votes} suara)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section: Lainnya (Rank 4+) */}
            {rest.length > 0 && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <span className="text-xs font-semibold text-gray-500 block mb-1">
                  Lainnya
                </span>
                <div className="space-y-2">
                  {rest.map((item) => (
                    <div
                      key={item.employee_id}
                      className="flex items-center justify-between gap-2.5 text-xs text-gray-700 py-1 px-1"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-4 text-center font-bold text-gray-400 shrink-0 text-xs">
                          {item.rank}
                        </span>
                        <span className="font-medium text-gray-800 truncate max-w-[120px] sm:max-w-[160px]">
                          {item.full_name}
                        </span>
                        {/* Progress Bar (Screen 6) */}
                        <div className="flex-1 max-w-[100px] sm:max-w-[140px] bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                          <div
                            className="bg-[#38BDF8] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(item.percentage, 5)}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-[11px] text-gray-500">
                        <strong className="text-gray-800">{item.percentage}%</strong> ({item.total_votes} suara)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom Engagement Banner (Screen 6: Amber card with fire emoji) */}
        <div className="mt-3 p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-center space-y-0.5">
          <p className="text-xs font-bold text-[#92400E] flex items-center justify-center gap-1.5">
            <span>🔥</span>
            <span>Masih ada suara lagi, yuk ikut voting!</span>
          </p>
          <p className="text-[11px] text-[#B45309]">
            Siapa favorit kamu selanjutnya? 😄
          </p>
        </div>
      </div>
    </div>
  );
};
