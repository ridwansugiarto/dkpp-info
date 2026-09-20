'use client';

import React, { useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Download, Lightbulb, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { IndikatorKetapangPanelData } from '@/lib/ketapang/indikatorService';

interface IndikatorKetapangChatPanelProps {
  data?: IndikatorKetapangPanelData;
  className?: string;
}

export const IndikatorKetapangChatPanel: React.FC<IndikatorKetapangChatPanelProps> = ({
  data,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>(data?.activeTabId || 'ketersediaan_energi');
  const [showNotes, setShowNotes] = useState<boolean>(false);

  if (!data || !data.indicators || data.indicators.length === 0) return null;

  const currentInd = data.indicators.find((x) => x.id === activeTab) || data.indicators[0];

  const handleDownloadXlsx = () => {
    const headers = [['Tahun', `Capaian Cilegon (${currentInd.unit})`, `${currentInd.targetLabel} (${currentInd.unit})`]];
    const rows = currentInd.data.map((d) => [d.year, d.capaian, d.target ?? currentInd.targetValue]);
    const sheetData = [...headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentInd.tabLabel);
    XLSX.writeFile(wb, `Indikator_${currentInd.id}_Cilegon_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className={`space-y-3.5 my-3 w-full max-w-full ${className}`}>
      {/* 1. Header Bar Sesuai Capture 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-[3px] h-4 sm:h-5 bg-emerald-600 rounded-full shrink-0"></div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs xs:text-sm sm:text-base leading-tight uppercase tracking-wide">
            CAPAIAN INDIKATOR KETAHANAN PANGAN CILEGON & NASIONAL DALAM 5 TAHUN TERAKHIR
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 text-[10.5px] font-bold transition-all self-start sm:self-auto cursor-pointer"
        >
          <Lightbulb className="w-3.5 h-3.5 fill-amber-300 text-amber-600" />
          <span>Catatan Analisis</span>
        </button>
      </div>

      {/* Analysis Notes Alert if Toggled */}
      {showNotes && (
        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 leading-relaxed animate-in fade-in duration-200 space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span>💡 Interpretasi Indikator Ketapang:</span>
            <button type="button" onClick={() => setShowNotes(false)} className="text-amber-600 hover:text-amber-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p>{currentInd.catatan || 'Capaian indikator ketahanan pangan Kota Cilegon menunjukkan tren stabilitas dan ketahanan yang kokoh.'}</p>
        </div>
      )}

      {/* 2. Horizontal Scrollable Tab Pills (7 Indikator Sesuai Mockup) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-emerald-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {data.indicators.map((ind) => {
          const isActive = ind.id === activeTab;
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => setActiveTab(ind.id)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#10B981] text-white shadow-xs border border-emerald-600'
                  : 'bg-[#16382d] hover:bg-[#1d473a] text-emerald-100/90 border border-emerald-800/40'
              }`}
            >
              {ind.tabLabel}
            </button>
          );
        })}
      </div>

      {/* 3. Main Chart Card Container */}
      <div className="bg-white dark:bg-[#152721] rounded-2xl sm:rounded-3xl border border-emerald-100 dark:border-emerald-800/60 p-4 sm:p-5 shadow-xs flex flex-col space-y-3 select-none">
        
        {/* Title & Notes Button inside card */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-tight">
              {currentInd.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {currentInd.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 shrink-0"
          >
            <Lightbulb className="w-3 h-3 text-amber-500 fill-amber-200" />
            <span>Catatan</span>
          </button>
        </div>

        {/* Recharts Area & Target Line */}
        <div className="h-[230px] sm:h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={currentInd.data} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="indikatorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={['dataMin - 50', 'dataMax + 50']}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const cap = payload.find((p: any) => p.dataKey === 'capaian')?.value;
                    const tgt = payload.find((p: any) => p.dataKey === 'target')?.value ?? currentInd.targetValue;
                    return (
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1.5">
                        <p className="font-bold text-slate-800 dark:text-white border-b pb-1">Tahun {label}</p>
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-emerald-600 font-bold">Capaian Cilegon:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{cap} {currentInd.unit}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-orange-500 font-bold">Target Nasional:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{tgt} {currentInd.unit}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="capaian" name="Capaian Cilegon" stroke="#10b981" strokeWidth={3} fill="url(#indikatorGrad)" dot={{ r: 4.5, fill: '#10b981' }} />
              <Line type="monotone" dataKey="target" name={currentInd.targetLabel} stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Download Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-emerald-900/40 text-[10.5px] font-bold">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <div className="w-3 h-1.5 rounded-full bg-emerald-500"></div>
              <span>Capaian Cilegon</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <div className="w-3 h-0.5 border-b-2 border-dashed border-orange-500"></div>
              <span>{currentInd.targetLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadXlsx}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-[11px] font-black text-emerald-800 dark:text-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-lg cursor-pointer transition-all shadow-2xs active:scale-95 ml-auto"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download xlsx</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndikatorKetapangChatPanel;
