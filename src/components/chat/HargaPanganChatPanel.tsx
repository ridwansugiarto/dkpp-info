'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, Sparkles, ChevronRight as ChevronNext } from 'lucide-react';
import * as XLSX from 'xlsx';
import CommodityIcon from '@/components/CommodityIcon';
import { SagonPanelData, SagonCommodityItem, formatIndoDate, getYoYStats } from '@/lib/harga/sagonService';

interface HargaPanganChatPanelProps {
  data?: SagonPanelData;
  onAskCommodity?: (prompt: string) => void;
  className?: string;
}

export const HargaPanganChatPanel: React.FC<HargaPanganChatPanelProps> = ({
  data,
  onAskCommodity,
  className = '',
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState<SagonCommodityItem | null>(null);

  // Available dates for navigation
  const availableDates = data?.availableDates && data.availableDates.length > 0
    ? data.availableDates
    : [data?.date || new Date().toISOString().split('T')[0]];

  const [dateIndex, setDateIndex] = useState<number>(availableDates.length - 1);

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        <span>Memuat panel harga pangan strategis...</span>
      </div>
    );
  }

  const currentDate = availableDates[dateIndex] || data.date;
  const currentFormattedDate = formatIndoDate(currentDate);

  // Calculate items based on current active date if history is available
  const historyForDate = data.historyByDate?.[currentDate];
  const items: SagonCommodityItem[] = data.items.map((item) => {
    if (historyForDate && historyForDate[item.id] !== undefined && historyForDate[item.id] > 0) {
      const curr = historyForDate[item.id];
      const stats = getYoYStats(curr, item.prev);
      return {
        ...item,
        curr,
        changePct: stats.changePct,
        changeText: stats.changeText,
        isUp: stats.isUp,
        isZero: stats.isZero,
        status: stats.status,
        colorClass: stats.colorClass,
      };
    }
    return item;
  });

  const isLatestDate = dateIndex === availableDates.length - 1;

  const handleDownloadXlsx = () => {
    const headers = [
      ['No', 'Komoditas', 'Harga Rata-Rata (Rp)', 'Harga Acuan YoY (Rp)', 'Perubahan (YoY)', 'Status', 'Tanggal', 'Sumber Data'],
    ];

    const rows = items.map((item, i) => [
      i + 1,
      item.name,
      item.curr,
      item.prev,
      item.changeText,
      item.status,
      currentDate,
      'sagon.cilegon.go.id - Rata-rata Seluruh Pasar',
    ]);

    const sheetData = [...headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Harga Pangan SAGON');
    XLSX.writeFile(wb, `Panel_Harga_Pangan_SAGON_${currentDate}.xlsx`);
  };

  return (
    <div className={`space-y-2.5 my-3 w-full max-w-full ${className}`}>
      {/* 1. Header Bar Sesuai Capture */}
      <div className="flex items-center gap-2.5">
        <div className="w-[3px] h-4 sm:h-5 bg-emerald-600 rounded-full shrink-0"></div>
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs xs:text-sm sm:text-base leading-tight uppercase tracking-wide">
          PANEL HARGA PANGAN STRATEGIS
        </h3>
      </div>

      {/* 2. Main Card Container (Warna & Aksen Persis Sesuai Mockup #E6FDF4) */}
      <div className="flex flex-col bg-[#E6FDF4] dark:bg-[#0f2820] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm select-none">
        
        {/* Top Source & Live Badge */}
        <div className="flex justify-between items-center gap-2 pb-1">
          <p className="text-[9.5px] sm:text-[10.5px] text-[#0B7A53]/90 dark:text-emerald-300 font-semibold leading-tight">
            Sumber: sagon.cilegon.go.id - Rata-rata Seluruh Pasar ({currentFormattedDate})
          </p>
          <div className="shrink-0">
            {isLatestDate ? (
              <span className="text-[8px] sm:text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full border border-red-600 font-extrabold flex items-center gap-1.5 animate-pulse shadow-xs">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                <span>SAGON LIVE</span>
              </span>
            ) : (
              <span className="text-[8px] sm:text-[9px] bg-emerald-700 text-white px-2 py-0.5 rounded-full border border-emerald-800 font-extrabold flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 bg-emerald-200 rounded-full"></span>
                <span>ARSIP SAGON</span>
              </span>
            )}
          </div>
        </div>

        {/* Date Navigation Pill Row (Mockup Match) */}
        <div className="mt-1.5 flex items-center justify-between bg-white dark:bg-[#18352b] border border-emerald-100 dark:border-emerald-800/50 p-1.5 rounded-2xl w-full shadow-xs">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setDateIndex((prev) => Math.max(0, prev - 1))}
            disabled={dateIndex === 0}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 border-none cursor-pointer ${
              dateIndex === 0
                ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                : 'bg-[#10B981] hover:bg-[#0B7A53] text-white hover:scale-105 active:scale-95 shadow-xs'
            }`}
            title="Tanggal Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Calendar Display */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            <span className="text-sm">📅</span>
            <span>{currentFormattedDate}</span>
          </div>

          {/* Forward Button */}
          <button
            type="button"
            onClick={() => setDateIndex((prev) => Math.min(availableDates.length - 1, prev + 1))}
            disabled={isLatestDate}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 border-none ${
              isLatestDate
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-inner'
                : 'bg-[#10B981] hover:bg-[#0B7A53] text-white hover:scale-105 active:scale-95 shadow-xs cursor-pointer'
            }`}
            title="Tanggal Berikutnya"
          >
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 3. Table */}
        <div className="mt-3 overflow-x-auto w-full [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-emerald-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#0B7A53]/15 text-[9px] sm:text-[10px] font-black uppercase text-[#0B7A53] dark:text-emerald-300 tracking-wider">
                <th className="pb-2 font-bold w-[36%] pl-1">KOMODITAS</th>
                <th className="pb-2 font-bold text-right w-[24%]">HARGA RATA-RATA</th>
                <th className="pb-2 font-bold text-center w-[22%]">PERUBAHAN (YOY)</th>
                <th className="pb-2 font-bold text-right w-[18%] pr-1">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0B7A53]/8 dark:divide-emerald-800/40">
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedCommodity(item === selectedCommodity ? null : item)}
                  className={`transition-colors cursor-pointer ${
                    selectedCommodity?.id === item.id
                      ? 'bg-emerald-200/80 dark:bg-emerald-900/60'
                      : 'hover:bg-white/50 dark:hover:bg-emerald-900/30'
                  }`}
                  title="Klik untuk detail komoditas"
                >
                  {/* Komoditas */}
                  <td className="py-2 flex items-center gap-1.5 text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs font-bold whitespace-normal leading-tight pl-1">
                    <span className="text-[10px] font-bold text-slate-400 font-mono w-4 shrink-0 text-right">
                      {i + 1}.
                    </span>
                    <CommodityIcon id={item.id} name={item.name} size={18} className="shrink-0" />
                    <span>{item.name}</span>
                  </td>

                  {/* Harga Rata-Rata */}
                  <td className="py-2 text-right font-extrabold text-slate-900 dark:text-white text-[11px] sm:text-xs whitespace-nowrap font-mono">
                    Rp {Math.round(item.curr).toLocaleString('id-ID')}
                  </td>

                  {/* Perubahan (YoY) */}
                  <td className="py-2 text-center whitespace-nowrap">
                    <span
                      className={`text-[10.5px] sm:text-[11px] font-bold ${
                        item.isZero
                          ? 'text-slate-500 dark:text-slate-400'
                          : item.isUp
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.changeText}
                    </span>
                  </td>

                  {/* Status Pill */}
                  <td className="py-2 text-right pr-1 whitespace-nowrap">
                    <span
                      className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full uppercase border shadow-2xs ${
                        item.status === 'WASPADA'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Commodity Mini Deep-Dive Drawer */}
        {selectedCommodity && (
          <div className="mt-2.5 p-3 bg-white/95 dark:bg-[#18352b] rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <CommodityIcon id={selectedCommodity.id} name={selectedCommodity.name} size={16} />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {selectedCommodity.name}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    selectedCommodity.status === 'WASPADA'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedCommodity.status} ({selectedCommodity.changeText})
                </span>
              </div>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-300">
                Harga Rata-rata: <strong>Rp {Math.round(selectedCommodity.curr).toLocaleString('id-ID')}</strong> | Acuan YoY: <strong>Rp {Math.round(selectedCommodity.prev).toLocaleString('id-ID')}</strong>
              </p>
            </div>

            {onAskCommodity && (
              <button
                type="button"
                onClick={() => onAskCommodity(`Jelaskan perkembangan harga ${selectedCommodity.name} di pasar Cilegon dan perbandingan dengan tahun lalu`)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10.5px] font-bold shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Analisis AI</span>
                <ChevronNext className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 4. Footer Benchmark YoY & Unduh XLSX */}
        <div className="mt-3 pt-2.5 border-t border-[#0B7A53]/20 dark:border-emerald-800 flex justify-between items-center text-[9.5px] font-bold text-[#0B7A53] dark:text-emerald-300">
          <span className="italic">*Benchmark YoY • Ter-update otomatis</span>
          
          <button
            type="button"
            onClick={handleDownloadXlsx}
            className="flex items-center gap-1.5 bg-[#0B7A53] hover:bg-[#086343] active:scale-95 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black transition-all shadow-xs cursor-pointer"
            title="Unduh data harga komoditas format Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Unduh XLSX</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HargaPanganChatPanel;
