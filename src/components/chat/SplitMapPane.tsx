'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapAction } from '@/types/dkpp';

// Dynamically import AIIntelligenceMap with client-only rendering
const AIIntelligenceMap = dynamic(
  () => import('@/components/AIIntelligenceMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-900 rounded-2xl text-white">
        <div className="flex flex-col items-center gap-2.5 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-300">
            Memuat Peta Spasial GIS Cilegon (407 Petak Sawah & Telemetri Lengas Tanah 10m)...
          </span>
        </div>
      </div>
    ),
  }
);

interface SplitMapPaneProps {
  lastAction?: MapAction | null;
  onSelectKelurahan?: (name: string) => void;
  className?: string;
}

export const SplitMapPane: React.FC<SplitMapPaneProps> = ({
  lastAction,
  onSelectKelurahan,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200/80 dark:border-gray-800/80 ${className}`}>
      <AIIntelligenceMap
        activeTab="split"
        mapAction={lastAction as any}
        onTriggerChatPrompt={(prompt) => {
          if (onSelectKelurahan) {
            onSelectKelurahan(prompt);
          }
        }}
      />
    </div>
  );
};
