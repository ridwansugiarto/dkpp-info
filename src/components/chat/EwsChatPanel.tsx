'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Download, ShieldAlert, TrendingUp, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { EwsPanelData, EwsWarningItem } from '@/lib/ketapang/ewsService';

interface EwsChatPanelProps {
  data?: EwsPanelData;
  onOpenActionPlan?: (item: EwsWarningItem) => void;
}

export const EwsChatPanel: React.FC<EwsChatPanelProps> = ({ data, onOpenActionPlan }) => {
  const [expandedCommodity, setExpandedCommodity] = useState<string | null>(
    data?.warnings?.[0]?.name || 'Bawang Merah'
  );
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
          <hr/>
          <h2>Daftar Komoditas Waspada & Rekomendasi Intervensi</h2>
          ${data.warnings.map((item: EwsWarningItem) => `
            <h3>${item.name} - Status CV: <span class="${item.statusCv === 'RENTAN' ? 'badge-danger' : 'badge-warning'}">${item.statusCv}</span> | Status SKPG: ${item.statusSkpg}</h3>
            <table>
              <tr>
                <th>Harga Terkini</th>
                <th>Koefisien Variasi (CV)</th>
                <th>Proyeksi 3 Bulan (ML Prophet)</th>
              </tr>
              <tr>
                <td>Rp ${(item.current || 0).toLocaleString('id-ID')}/kg</td>
                <td>${item.cv.toFixed(1)}%</td>
                <td>Rp ${(item.month3 || 0).toLocaleString('id-ID')}/kg</td>
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
                Early Warning System (EWS ML)
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                EWS AKTIF
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deteksi dini volatilitas harga & kerentanan rantai pasok Cilegon
            </p>
          </div>
        </div>

        {/* Download Docx button */}
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

      {/* Accordion List of Vulnerable Commodities */}
      <div className="p-3 sm:p-4 space-y-2.5">
        {data.warnings.map((item) => {
          const isExpanded = expandedCommodity === item.name;
          const isDanger = item.statusCv === 'RENTAN' || item.statusSkpg === 'RENTAN';

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
                      Saat ini: <strong className="text-slate-700">Rp {(item.current || 0).toLocaleString('id-ID')}</strong>
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

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-amber-100 bg-white/80 space-y-3 animate-in fade-in-50 duration-150">
                  {/* 3-Month Projection */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-amber-600" />
                      Proyeksi Harga 3 Bulan Ke Depan (ML Prophet)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-center">
                        <div className="text-[10px] font-medium text-slate-500">Harga Terkini</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          Rp {(item.current || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2 text-center">
                        <div className="text-[10px] font-medium text-amber-700">Proyeksi Bulan ke-3</div>
                        <div className="text-xs font-bold text-amber-900 mt-0.5">
                          Rp {(item.month3 || 0).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] font-semibold text-red-600 mt-0.5">
                          {item.month3 > item.current
                            ? `+${(((item.month3 - item.current) / (item.current || 1)) * 100).toFixed(1)}%`
                            : `${(((item.month3 - item.current) / (item.current || 1)) * 100).toFixed(1)}%`}
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-center col-span-2 sm:col-span-1">
                        <div className="text-[10px] font-medium text-slate-500">Status SKPG</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">{item.statusSkpg}</div>
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
        <span>Sumber: Model ML Prophet & EWS BAPANAS / DKPP</span>
        <span>Evaluasi: {data.totalEvaluated} Komoditas</span>
      </div>
    </div>
  );
};
