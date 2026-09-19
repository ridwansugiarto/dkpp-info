'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Download, RefreshCw, Sparkles, ChevronRight, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import CommodityIcon from '@/components/CommodityIcon';
import type { ForecastTableData, ForecastTableItem } from '@/lib/forecast/forecastService';

interface ForecastChatTableProps {
  data?: ForecastTableData;
  onAskCommodity?: (prompt: string) => void;
  className?: string;
}

export const ForecastChatTable: React.FC<ForecastChatTableProps> = ({
  data,
  onAskCommodity,
  className = '',
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState<ForecastTableItem | null>(null);

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
        <span>Memuat data proyeksi harga pangan...</span>
      </div>
    );
  }

  const { items, baselineMonth, t1Month, t3Month } = data;

  const handleDownloadXlsx = () => {
    const headers = [
      [
        'Komoditas',
        `Harga Aktual (${baselineMonth}) (Rp/kg)`,
        `Peramalan +1 Bulan (${t1Month}) (Rp/kg)`,
        `Peramalan +3 Bulan (${t3Month}) (Rp/kg)`,
        'Arah Tren (+1B)',
        'Perubahan (%)',
        'Status Volatilitas (CV)',
        'Status YoY (SKPG)',
      ],
    ];

    const rows = items.map((item) => [
      item.name,
      item.current,
      item.month1,
      item.month3,
      item.trend === 'up' ? 'Naik' : item.trend === 'down' ? 'Turun' : 'Stabil',
      item.changePct,
      item.statusCv || '-',
      item.statusSkpg || '-',
    ]);

    const sheetData = [...headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Peramalan Pangan');
    XLSX.writeFile(wb, `Peramalan_Harga_Pangan_DKPP_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className={`space-y-2.5 my-3 w-full max-w-full ${className}`}>
      {/* 1. Header Sesuai Capture */}
      <div className="flex flex-col space-y-0.5">
        <div className="flex items-center gap-2.5">
          <div className="w-[3px] h-4 sm:h-5 bg-emerald-600 rounded-full shrink-0"></div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs xs:text-sm sm:text-base leading-tight uppercase tracking-wide flex flex-wrap items-center gap-1.5">
            <span>PERAMALAN HARGA PANGAN</span>
            <span className="text-amber-500 select-none">💡</span>
            <span className="text-slate-700 dark:text-slate-300 font-extrabold">(ML FORECASTING)</span>
          </h3>
        </div>
        <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-400 font-medium italic pl-3">
          Proyeksi 1 & 3 bulan ke depan
        </p>
      </div>

      {/* 2. Main Card Container */}
      <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-emerald-50/50 dark:from-[#132a22] dark:via-[#162723] dark:to-[#0f201b] border border-emerald-200/90 dark:border-emerald-800/70 rounded-2xl sm:rounded-3xl p-0 flex flex-col shadow-sm overflow-hidden">
        
        {/* Table Scroll Area */}
        <div className="overflow-x-auto w-full [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-emerald-50/40 [&::-webkit-scrollbar-thumb]:bg-emerald-300/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-400 transition-all">
          <table className="w-full min-w-[560px] text-left border-collapse text-xs">
            <thead className="bg-white/95 dark:bg-[#182a24] backdrop-blur-xs border-b border-emerald-200/70 dark:border-emerald-800/70">
              <tr className="text-[#0B4D3C] dark:text-emerald-300 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wide">
                <th className="p-2 sm:p-2.5 py-3 bg-emerald-50/70 dark:bg-emerald-950/50 align-middle whitespace-nowrap pl-3">
                  KOMODITAS
                </th>
                <th className="p-2 sm:p-2.5 py-3 bg-emerald-50/70 dark:bg-emerald-950/50 text-right whitespace-nowrap">
                  <div className="leading-tight">HARGA AKTUAL</div>
                  <div className="text-[9px] sm:text-[9.5px] font-bold text-slate-400 dark:text-slate-400 mt-0.5">
                    {baselineMonth}
                  </div>
                </th>
                <th className="p-2 sm:p-2.5 py-3 bg-emerald-50/70 dark:bg-emerald-950/50 text-right whitespace-nowrap">
                  <div className="leading-tight">PERAMALAN +1 BULAN</div>
                  <div className="text-[9px] sm:text-[9.5px] font-bold text-slate-400 dark:text-slate-400 mt-0.5">
                    {t1Month}
                  </div>
                </th>
                <th className="p-2 sm:p-2.5 py-3 bg-emerald-50/70 dark:bg-emerald-950/50 text-right whitespace-nowrap">
                  <div className="leading-tight">PERAMALAN +3 BULAN</div>
                  <div className="text-[9px] sm:text-[9.5px] font-bold text-slate-400 dark:text-slate-400 mt-0.5">
                    {t3Month}
                  </div>
                </th>
                <th className="p-2 sm:p-2.5 py-3 bg-emerald-50/70 dark:bg-emerald-950/50 text-center align-middle whitespace-nowrap pr-3">
                  <div className="leading-tight">ARAH TREN +1 BULAN</div>
                  <div className="text-[9px] sm:text-[9.5px] font-bold text-slate-400 dark:text-slate-400 mt-0.5">
                    (L1)
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="font-medium divide-y divide-emerald-100/60 dark:divide-emerald-900/40">
              {items.map((item, index) => {
                const isPriceUp1m = item.month1 > item.current;
                const isPriceUp3m = item.month3 > item.current;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedCommodity(item === selectedCommodity ? null : item)}
                    className={`transition-colors cursor-pointer ${
                      selectedCommodity?.id === item.id
                        ? 'bg-emerald-200/70 dark:bg-emerald-900/60'
                        : index % 2 === 0
                        ? 'bg-emerald-50/70 dark:bg-[#162722]/60 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                        : 'bg-emerald-100/35 dark:bg-[#14231f]/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                    }`}
                    title="Klik untuk melihat detail / tanya asisten"
                  >
                    {/* Komoditas */}
                    <td className="p-2 sm:p-2.5 py-2.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs pl-3">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 font-mono w-4 shrink-0 text-right">
                        {index + 1}.
                      </span>
                      <CommodityIcon id={item.id} name={item.name} size={18} className="shrink-0" />
                      <span className="leading-tight">{item.name}</span>
                    </td>

                    {/* Harga Aktual */}
                    <td className="p-2 sm:p-2.5 text-right text-slate-800 dark:text-slate-100 font-extrabold text-[11px] sm:text-xs whitespace-nowrap font-mono">
                      Rp{item.current.toLocaleString('id-ID')}
                    </td>

                    {/* Peramalan +1 Bulan */}
                    <td
                      className={`p-2 sm:p-2.5 text-right font-bold text-[11px] sm:text-xs whitespace-nowrap font-mono ${
                        isPriceUp1m ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      Rp{item.month1.toLocaleString('id-ID')}
                    </td>

                    {/* Peramalan +3 Bulan */}
                    <td
                      className={`p-2 sm:p-2.5 text-right font-black text-[11px] sm:text-xs whitespace-nowrap font-mono ${
                        isPriceUp3m ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      Rp{item.month3.toLocaleString('id-ID')}
                    </td>

                    {/* Arah Tren +1 Bulan (L1) */}
                    <td className="p-2 sm:p-2.5 text-center whitespace-nowrap pr-3">
                      <div
                        className={`inline-flex items-center justify-center gap-1 font-bold text-[11px] sm:text-xs ${
                          item.trend === 'up'
                            ? 'text-red-500 dark:text-red-400'
                            : item.trend === 'down'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-500 dark:text-amber-400'
                        }`}
                      >
                        {item.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />}
                        {item.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />}
                        {item.trend === 'stable' && <Minus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />}
                        <span className="font-mono text-[10.5px] sm:text-[11px]">
                          {item.changePct > 0 ? `+${item.changePct.toFixed(1)}%` : `${item.changePct.toFixed(1)}%`}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Commodity Mini Deep-Dive Drawer in Chat */}
        {selectedCommodity && (
          <div className="p-3 sm:p-3.5 bg-white/95 dark:bg-[#1a2f27] border-t border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CommodityIcon id={selectedCommodity.id} name={selectedCommodity.name} size={18} />
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {selectedCommodity.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedCommodity.trend === 'up'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      : selectedCommodity.trend === 'down'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  Tren {selectedCommodity.trend === 'up' ? 'Naik' : selectedCommodity.trend === 'down' ? 'Turun' : 'Stabil'} ({selectedCommodity.changePct > 0 ? `+${selectedCommodity.changePct}%` : `${selectedCommodity.changePct}%`})
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Aktual: <strong>Rp{selectedCommodity.current.toLocaleString('id-ID')}</strong> → +1B: <strong>Rp{selectedCommodity.month1.toLocaleString('id-ID')}</strong> → +3B: <strong>Rp{selectedCommodity.month3.toLocaleString('id-ID')}</strong>
                {selectedCommodity.cv ? ` | CV: ${selectedCommodity.cv}% (${selectedCommodity.statusCv || 'AMAN'})` : ''}
              </p>
            </div>

            {onAskCommodity && (
              <button
                type="button"
                onClick={() => onAskCommodity(`Jelaskan analisis mendalam dan faktor pendorong peramalan harga ${selectedCommodity.name}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisis EWS AI</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 3. Footer / Action Bar Sesuai Mockup */}
        <div className="p-2.5 sm:p-3 px-3 sm:px-4 border-t border-emerald-200/80 dark:border-emerald-800/70 bg-white/90 dark:bg-[#152620] flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-[10px] font-bold text-slate-600 dark:text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
              <span>Turun</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
              <span>Stabil</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
              <span>Naik</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleDownloadXlsx}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[9.5px] font-black text-emerald-800 dark:text-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-lg cursor-pointer transition-all shadow-xs active:scale-95"
              title="Download spreadsheet proyeksi harga pangan"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Download xlsx</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastChatTable;
