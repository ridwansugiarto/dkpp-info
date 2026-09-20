'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Download, ShieldAlert, TrendingUp, Brain, Sparkles, ArrowRight } from 'lucide-react';
import { EwsPanelData, EwsWarningItem } from '@/lib/ketapang/ewsService';

interface EwsChatPanelProps {
  data?: EwsPanelData;
  onOpenActionPlan?: (item: EwsWarningItem) => void;
}

export const EwsChatPanel: React.FC<EwsChatPanelProps> = ({ data, onOpenActionPlan }) => {
  const [expandedCommodity, setExpandedCommodity] = useState<string | null>(
    data?.warnings?.[0]?.name || 'Bawang Merah'
  );
  const [showAiInterpretation, setShowAiInterpretation] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!data || !data.warnings || data.warnings.length === 0) {
    return null;
  }

  const toggleAccordion = (commodityName: string) => {
    setExpandedCommodity((prev) => (prev === commodityName ? null : commodityName));
  };

  const handleDownloadDocx = () => {
    setIsExporting(true);
    try {
      const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>Laporan Early Warning System (EWS) Pangan Kota Cilegon</title>
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
            h1 { color: #b45309; font-size: 16pt; border-bottom: 2px solid #f59e0b; padding-bottom: 4px; }
            h2 { color: #1e293b; font-size: 13pt; margin-top: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .badge-danger { color: #dc2626; font-weight: bold; }
            .badge-warning { color: #d97706; font-weight: bold; }
            .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <h1>LAPORAN SISTEM PERINGATAN DINI (EWS) PANGAN KOTA CILEGON</h1>
          <p><strong>Tanggal Terbit:</strong> ${new Date(data.updatedAt).toLocaleDateString('id-ID')}</p>
          <p><strong>Status EWS:</strong> AKTIF (${data.warnings.length} Komoditas Terdeteksi Anomali/Volatilitas Tinggi)</p>
          <p><strong>Metode Pemodelan:</strong> Model Regresi Multi-Variabel (OLS) & Time-Series BAPANAS</p>
          <hr/>
          <h2>Daftar Komoditas Waspada & Rekomendasi Intervensi</h2>
          ${data.warnings.map((item: EwsWarningItem) => `
            <h3>${item.name} - Status: <span class="${item.statusCv === 'RENTAN' ? 'badge-danger' : 'badge-warning'}">${item.statusCv}</span></h3>
            <table>
              <tr>
                <th>Harga Aktual Rata-Rata Agustus 2026</th>
                <th>Koefisien Variasi (CV)</th>
                <th>Peramalan +3 Bulan November 2026</th>
                <th>Arah Tren</th>
              </tr>
              <tr>
                <td>Rp ${(item.current || 0).toLocaleString('id-ID')}/kg</td>
                <td>${item.cv.toFixed(1)}%</td>
                <td>Rp ${(item.month3 || 0).toLocaleString('id-ID')}/kg</td>
                <td>${item.month3 > item.current ? 'Naik' : 'Stabil'}</td>
              </tr>
            </table>
            <div class="recommendation">
              <strong>Rekomendasi Aksi DKPP:</strong>
              <ul>
                ${item.rekomendasi.map((rec: string) => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
          <p style="margin-top: 30px; font-size: 9pt; color: #64748b;">
            Dokumen ini di-generate secara otomatis oleh ChatDKPP Intelligent Engine terintegrasi dengan Dashboard Ketahanan Pangan Supabase.
          </p>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', docHtml], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_EWS_Pangan_Cilegon_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export docx:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="my-3 rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 via-white to-white shadow-md shadow-amber-500/5 overflow-hidden transition-all duration-200">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-400/40 shadow-xs">
            <ShieldAlert className="w-5 h-5 animate-pulse text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                Early Warning System (EWS)
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                EWS AKTIF
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Model Regresi Multi-Variabel (OLS) & Deteksi Kerentanan Pasokan Cilegon
            </p>
          </div>
        </div>

        {/* Action Buttons: Brain Icon (Capture 1) + Download docx */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowAiInterpretation((prev) => !prev)}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-xs active:scale-95 ${
              showAiInterpretation
                ? 'bg-emerald-100 border-emerald-400 text-emerald-800 ring-2 ring-emerald-400/30'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
            title="Interpretasi AI EWS Pangan"
          >
            <Brain className="w-4 h-4 text-emerald-700" />
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 hover:border-amber-400 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Download Rekomendasi EWS sebagai Dokumen Word"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>{isExporting ? 'Memproses...' : 'Download docx'}</span>
          </button>
        </div>
      </div>

      {/* AI Interpretation Box (Capture 1) */}
      {showAiInterpretation && (
        <div className="mx-3.5 sm:mx-4 mt-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-slate-800 space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-bold text-amber-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Interpretasi AI & Diagnosis Kerentanan EWS:</span>
            </div>
            <button
              onClick={() => setShowAiInterpretation(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11.5px] leading-relaxed text-slate-700">
            Sistem mendeteksi <strong>{data.warnings.length} komoditas hortikultura & unggas</strong> berada pada kategori waspada/rentan akibat volatilitas pasokan daerah sentra produksi dan tekanan permintaan musiman. Komoditas <strong>Cabai Merah</strong> dan <strong>Bawang Merah</strong> mencatatkan Koefisien Variasi (CV) di atas ambang batas aman (10%), dengan proyeksi kenaikan harga hingga +30% dalam 3 bulan ke depan. Direkomendasikan percepatan fasilitasi distribusi pangan dan Gerakan Pangan Murah (GPM).
          </p>
        </div>
      )}

      {/* Accordion List of Vulnerable Commodities */}
      <div className="p-3 sm:p-4 space-y-2.5">
        {data.warnings.map((item) => {
          const isExpanded = expandedCommodity === item.name;
          const isDanger = item.statusCv === 'RENTAN' || item.statusSkpg === 'RENTAN';
          const isUp = item.month3 > item.current;

          return (
            <div
              key={item.id}
              className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'border-amber-300 bg-amber-50/30 shadow-xs'
                  : 'border-slate-200 hover:border-amber-200 bg-white'
              }`}
            >
              {/* Accordion Trigger Header */}
              <button
                onClick={() => toggleAccordion(item.name)}
                className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-amber-50/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isDanger ? 'bg-red-500 shadow-xs shadow-red-500/50' : 'bg-amber-500 shadow-xs shadow-amber-500/50'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Aktual: <strong className="text-slate-700">Rp {(item.current || 0).toLocaleString('id-ID')}</strong>
                      {' • '}CV: <span className="font-semibold text-amber-700">{item.cv.toFixed(1)}%</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md border ${
                      isDanger
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {item.statusCv}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Accordion Content (Capture 2 & 3 exact layout) */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-amber-100 bg-white/80 space-y-3 animate-in fade-in-50 duration-150">
                  {/* 3 Metric Cards Sesuai Capture 2 & 3 */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-amber-600" />
                      Proyeksi Harga 3 Bulan Ke Depan (Model OLS)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Card 1: Harga Aktual Rata-Rata Agustus 2026 */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                          HARGA AKTUAL RATA-RATA AGUSTUS 2026
                        </div>
                        <div className="text-sm font-extrabold text-slate-800 mt-1">
                          Rp {(item.current || 0).toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Card 2: Peramalan +3 Bulan November 2026 */}
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-2.5 text-center shadow-2xs">
                        <div className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">
                          PERAMALAN +3 BULAN NOVEMBER 2026
                        </div>
                        <div className="text-sm font-extrabold text-amber-950 mt-1">
                          Rp {(item.month3 || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] font-bold text-red-600 mt-0.5">
                          {item.month3 > item.current
                            ? `+${(((item.month3 - item.current) / (item.current || 1)) * 100).toFixed(1)}%`
                            : `${(((item.month3 - item.current) / (item.current || 1)) * 100).toFixed(1)}%`}
                        </div>
                      </div>

                      {/* Card 3: Arah Tren */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                          ARAH TREN
                        </div>
                        <div className={`text-sm font-extrabold mt-1 ${isUp ? 'text-red-600' : 'text-emerald-700'}`}>
                          {isUp ? '↗ Naik' : '— Stabil'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Status SKPG: {item.statusSkpg}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations Box */}
                  <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-2.5 text-xs">
                    <div className="font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Rekomendasi Tindakan DKPP Kota Cilegon:
                    </div>
                    <ul className="space-y-1 text-slate-700 pl-4 list-disc text-[11px] leading-relaxed">
                      {item.rekomendasi.map((rec: string, rIdx: number) => (
                        <li key={rIdx}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Action trigger if provided */}
                  {onOpenActionPlan && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onOpenActionPlan(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                      >
                        Simulasikan Intervensi Pasar
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Sumber: Model Regresi Multi-Variabel OLS & EWS BAPANAS / DKPP</span>
        <span>Evaluasi: {data.totalEvaluated} Komoditas</span>
      </div>
    </div>
  );
};
