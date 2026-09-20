'use client';

import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Download, Brain } from 'lucide-react';
import * as XLSX from 'xlsx';
import { IkpPouPanelData } from '@/lib/ketapang/ikpPouService';

interface IkpPouChatPanelProps {
  data?: IkpPouPanelData;
  className?: string;
}

export const IkpPouChatPanel: React.FC<IkpPouChatPanelProps> = ({
  data,
  className = '',
}) => {
  if (!data) return null;

  const { ikp = [], pou = [] } = data;

  const handleDownloadIkp = () => {
    const headers = [['Tahun', 'IKP Cilegon', 'IKP Provinsi Banten', 'IKP Nasional']];
    const rows = ikp.map((d) => [d.year, d.cilegon, d.provinsi ?? '-', d.nasional ?? '-']);
    const sheetData = [...headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IKP Cilegon');
    XLSX.writeFile(wb, `IKP_Kota_Cilegon_5_Tahun_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadPou = () => {
    const headers = [['Tahun', 'PoU Cilegon (%)', 'PoU Provinsi Banten (%)', 'PoU Nasional (%)']];
    const rows = pou.map((d) => [d.year, `${d.cilegon}%`, d.provinsi ? `${d.provinsi}%` : '-', d.nasional ? `${d.nasional}%` : '-']);
    const sheetData = [...headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PoU Cilegon');
    XLSX.writeFile(wb, `PoU_Kota_Cilegon_5_Tahun_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className={`space-y-4 my-3 w-full max-w-full ${className}`}>
      {/* 1. Header Bar Sesuai Capture 1 */}
      <div className="flex items-center gap-2.5">
        <div className="w-[3px] h-4 sm:h-5 bg-emerald-600 rounded-full shrink-0"></div>
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs xs:text-sm sm:text-base leading-tight uppercase tracking-wide">
          IKP & POU KOTA CILEGON 5 TAHUN TERAKHIR
        </h3>
      </div>

      {/* 2. Chart Card 1: Indeks Ketahanan Pangan (IKP) Lintas Tahun */}
      <div className="bg-white dark:bg-[#152721] rounded-2xl sm:rounded-3xl border border-emerald-100 dark:border-emerald-800/60 p-4 sm:p-5 shadow-xs flex flex-col space-y-3 select-none">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base select-none">🌾</span>
              <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base leading-tight">
                Indeks Ketahanan Pangan (IKP) Lintas Tahun
              </h4>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Perbandingan Nilai Indeks Ketahanan Pangan Daerah vs Provinsi & Nasional
            </p>
          </div>
          <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>cilegon</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>nasional</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-500">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>provinsi</span>
          </div>
        </div>

        {/* Recharts Spline */}
        <div className="h-[210px] sm:h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ikp} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cilegonIkpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis domain={[65, 85]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs space-y-1">
                        <p className="font-bold text-slate-800 dark:text-white">Tahun {label}</p>
                        {payload.map((p: any) => (
                          <div key={p.name} className="flex items-center justify-between gap-3 text-[11px]">
                            <span style={{ color: p.color }} className="font-bold capitalize">{p.name}:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{p.value ?? '-'}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="cilegon" name="cilegon" stroke="#10b981" strokeWidth={3} fill="url(#cilegonIkpGrad)" />
              <Line type="monotone" dataKey="provinsi" name="provinsi" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="nasional" name="nasional" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleDownloadIkp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-[11px] font-black text-emerald-800 dark:text-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-lg cursor-pointer transition-all shadow-2xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download xlsx</span>
          </button>
        </div>
      </div>

      {/* 3. Chart Card 2: Prevalence of Undernourishment (PoU) Lintas Tahun (Capture 2) */}
      <div className="bg-white dark:bg-[#152721] rounded-2xl sm:rounded-3xl border border-purple-100 dark:border-purple-900/40 p-4 sm:p-5 shadow-xs flex flex-col space-y-3 select-none">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base select-none">💜</span>
              <h4 className="font-extrabold text-purple-700 dark:text-purple-300 text-sm sm:text-base leading-tight">
                Prevalence of Undernourishment (PoU) Lintas Tahun
              </h4>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tren Perbandingan Angka Prevalensi Kerawanan Konsumsi Pangan (%)
            </p>
          </div>
          <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 text-purple-600">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span>cilegon</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>nasional</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-600">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span>provinsi</span>
          </div>
        </div>

        {/* Recharts Spline */}
        <div className="h-[210px] sm:h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={pou} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cilegonPouGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 12]} tickFormatter={(v) => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs space-y-1">
                        <p className="font-bold text-slate-800 dark:text-white">Tahun {label}</p>
                        {payload.map((p: any) => (
                          <div key={p.name} className="flex items-center justify-between gap-3 text-[11px]">
                            <span style={{ color: p.color }} className="font-bold capitalize">{p.name}:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{p.value ?? '-'}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="nasional" name="nasional" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3.5, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="provinsi" name="provinsi" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3.5, fill: '#06b6d4' }} />
              <Area type="monotone" dataKey="cilegon" name="cilegon" stroke="#9333ea" strokeWidth={3} fill="url(#cilegonPouGrad)" dot={{ r: 4, fill: '#9333ea' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleDownloadPou}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-[11px] font-black text-purple-900 dark:text-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg cursor-pointer transition-all shadow-2xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Download xlsx</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IkpPouChatPanel;
