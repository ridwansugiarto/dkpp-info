'use client';

import React from 'react';
import { PollTheme } from '@/lib/polling/types';
import { FiShield } from 'react-icons/fi';

interface ThemeCatalogProps {
  themes: PollTheme[];
  onSelectTheme?: (themeCode: string) => void;
  className?: string;
}

const THEME_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ganteng:     { bg: 'bg-[#EBF5FF]', text: 'text-[#1E40AF]', border: 'border-[#BFDBFE]' },
  cantik:      { bg: 'bg-[#FDF2F8]', text: 'text-[#9D174D]', border: 'border-[#FBCFE8]' },
  cerdas:      { bg: 'bg-[#EEF2FF]', text: 'text-[#3730A3]', border: 'border-[#C7D2FE]' },
  rajin:       { bg: 'bg-[#ECFDF5]', text: 'text-[#065F46]', border: 'border-[#A7F3D0]' },
  soleh:       { bg: 'bg-[#F0FDFA]', text: 'text-[#115E59]', border: 'border-[#99F6E4]' },
  dermawan:    { bg: 'bg-[#FFFBEB]', text: 'text-[#92400E]', border: 'border-[#FDE68A]' },
  royal:       { bg: 'bg-[#FAF5FF]', text: 'text-[#6B21A8]', border: 'border-[#E9D5FF]' },
  baik:        { bg: 'bg-[#FFF1F2]', text: 'text-[#9F1239]', border: 'border-[#FECDD3]' },
  tahu_segala: { bg: 'bg-[#FEFCE8]', text: 'text-[#854D0E]', border: 'border-[#FEF08A]' },
  update:      { bg: 'bg-[#F0F9FF]', text: 'text-[#075985]', border: 'border-[#BAE6FD]' },
  gaptek:      { bg: 'bg-[#F1F5F9]', text: 'text-[#334155]', border: 'border-[#CBD5E1]' },
  murah_senyum:{ bg: 'bg-[#F7FEE7]', text: 'text-[#3F6212]', border: 'border-[#D9F99D]' },
  cool:        { bg: 'bg-[#ECFEFF]', text: 'text-[#155E75]', border: 'border-[#A5F3FC]' },
  trendy:      { bg: 'bg-[#FDF4FF]', text: 'text-[#86198F]', border: 'border-[#F5D0FE]' },
  lucu:        { bg: 'bg-[#FFF7ED]', text: 'text-[#9A3412]', border: 'border-[#FED7AA]' },
};

/**
 * Palet warna fallback untuk tema kustom baru yang kodenya belum ada di THEME_STYLES.
 * Akan dipilih berdasarkan urutan index tema.
 */
const FALLBACK_PALETTE = [
  { bg: 'bg-[#F0FDF4]', text: 'text-[#166534]', border: 'border-[#BBF7D0]' },
  { bg: 'bg-[#EFF6FF]', text: 'text-[#1E3A8A]', border: 'border-[#BFDBFE]' },
  { bg: 'bg-[#FFF7ED]', text: 'text-[#9A3412]', border: 'border-[#FED7AA]' },
  { bg: 'bg-[#FDF4FF]', text: 'text-[#6B21A8]', border: 'border-[#E9D5FF]' },
  { bg: 'bg-[#F0FDFA]', text: 'text-[#134E4A]', border: 'border-[#99F6E4]' },
  { bg: 'bg-[#FAFAFA]', text: 'text-[#374151]', border: 'border-[#E5E7EB]' },
];

export const ThemeCatalog: React.FC<ThemeCatalogProps> = ({
  themes,
  onSelectTheme,
  className = ''
}) => {
  return (
    <div className={`bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="text-2xl shrink-0">🏆</div>
        <div>
          <h3 className="font-bold text-[#1e293b] text-base leading-tight">
            Daftar Tema Polling Pegawai
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pilih tema yang kamu suka, dan beri 3 pilihanmu!
          </p>
        </div>
      </div>

      {/* 2-Column Pastel Cards
          WRAPTEXT: menggunakan whitespace-normal break-words leading-snug
          bukan truncate, sehingga teks panjang tidak terpotong di layar mobile */}
      <div className="grid grid-cols-2 gap-2.5">
        {themes.map((theme, idx) => {
          const style = THEME_STYLES[theme.code] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
          // Tampilkan short_label dinamis dari DB; fallback ke title jika kosong
          const displayLabel = (theme.short_label && theme.short_label.trim())
            ? theme.short_label
            : theme.title;

          return (
            <button
              key={theme.code}
              type="button"
              onClick={() => onSelectTheme?.(theme.code)}
              className={`flex items-start gap-2 p-2.5 sm:p-3 rounded-xl border ${style.bg} ${style.border} hover:scale-[1.02] active:scale-[0.99] transition-all text-left shadow-xs cursor-pointer min-h-[52px]`}
            >
              <span className="text-lg shrink-0 select-none mt-0.5">
                {theme.icon || '🏆'}
              </span>
              {/* WRAPTEXT — tidak ada truncate, teks akan membungkus ke baris baru */}
              <span className={`font-semibold text-xs sm:text-[13px] whitespace-normal break-words leading-snug ${style.text}`}>
                {displayLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer Pill */}
      <div className="pt-1 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600">
          <FiShield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Setiap tema hanya bisa memilih 3 nama. »</span>
        </div>
      </div>
    </div>
  );
};
