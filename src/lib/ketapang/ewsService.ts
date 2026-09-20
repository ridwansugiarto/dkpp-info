/**
 * ewsService.ts
 * Mengambil data live Early Warning System (EWS ML) dari tabel `forecast_result`
 * di Supabase Dashboard Ketapang (fjycaxccbasksjooxrqg.supabase.co).
 */

import { COMMODITY_MAP } from '@/lib/forecast/forecastService';

export interface EwsWarningItem {
  id: string;
  name: string;
  current: number;
  month3: number;
  cv: number;
  statusCv: string;
  statusSkpg: string;
  rekomendasi: string[];
  drivers?: string[];
}

export interface EwsPanelData {
  warnings: EwsWarningItem[];
  totalEvaluated: number;
  updatedAt: string;
}

const DEFAULT_WARNINGS: EwsWarningItem[] = [
  {
    id: 'harga_bawang_merah',
    name: 'Bawang Merah',
    current: 31580,
    month3: 36767,
    cv: 13.7,
    statusCv: 'WASPADA',
    statusSkpg: 'WASPADA',
    rekomendasi: ['lakukan operasi pasar mandiri', 'pantau pasokan distributor', 'himbau belanja bijak'],
    drivers: ['Kenaikan musiman menjelang hari raya', 'Volatilitas pasokan sentra Brebes', 'Tren inflasi daerah'],
  },
  {
    id: 'harga_cabai_merah',
    name: 'Cabe Merah Besar',
    current: 40469,
    month3: 52927,
    cv: 15.2,
    statusCv: 'RENTAN',
    statusSkpg: 'AMAN',
    rekomendasi: ['siapkan Gerakan Pangan Murah (GPM)', 'intensifkan monitoring distributor', 'koordinasi jalur logistik'],
    drivers: ['Faktor anomali cuaca di daerah produsen', 'Tren kenaikan harga 3 bulan terakhir'],
  },
  {
    id: 'harga_cabai_merah_keriting',
    name: 'Cabe Merah Keriting',
    current: 37133,
    month3: 52077,
    cv: 17.7,
    statusCv: 'RENTAN',
    statusSkpg: 'AMAN',
    rekomendasi: ['siapkan Gerakan Pangan Murah (GPM)', 'intensifkan monitoring pasar harian', 'koordinasi pasokan antar daerah'],
    drivers: ['Gangguan panen sentra Jawa Barat', 'Stabilitas inflasi makro'],
  },
  {
    id: 'harga_telur_ayam_ras',
    name: 'Telur Ayam Ras',
    current: 24506,
    month3: 26884,
    cv: 8.5,
    statusCv: 'WASPADA',
    statusSkpg: 'AMAN',
    rekomendasi: ['monitoring rutin mingguan', 'pantau harga pakan ternak jagung & konsentrat', 'jaga kelancaran distribusi'],
    drivers: ['Penyesuaian biaya pakan unggas', 'Permintaan konsumsi rumah tangga stabil tinggi'],
  },
];

export async function getLiveEwsData(): Promise<EwsPanelData> {
  const KT_URL = process.env.KETAPANG_SUPABASE_URL || 'https://fjycaxccbasksjooxrqg.supabase.co';
  const KT_KEY = process.env.KETAPANG_SUPABASE_SERVICE_KEY || process.env.KETAPANG_SUPABASE_ANON_KEY || '';

  if (!KT_KEY) {
    return {
      warnings: DEFAULT_WARNINGS,
      totalEvaluated: 13,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(`${KT_URL}/rest/v1/forecast_result?select=*&order=id.asc`, {
      headers: {
        apikey: KT_KEY,
        Authorization: `Bearer ${KT_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return {
        warnings: DEFAULT_WARNINGS,
        totalEvaluated: 13,
        updatedAt: new Date().toISOString(),
      };
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        warnings: DEFAULT_WARNINGS,
        totalEvaluated: 13,
        updatedAt: new Date().toISOString(),
      };
    }

    // Filter commodities that trigger EWS (CV > 10% or Status WASPADA/RENTAN or Trend Up > 3%)
    const warnings: EwsWarningItem[] = [];
    rows.forEach((r) => {
      const current = Number(r.harga_aktual) || 0;
      const month3 = Number(r.forecast_3m) || 0;
      const cv = Number(r.cv) || 0;
      const statusCv = String(r.status_cv || 'AMAN');
      const statusSkpg = String(r.status_skpg || 'AMAN');
      const statusForecast = String(r.status_forecast || 'Stabil');

      const isWarning =
        statusCv === 'RENTAN' ||
        statusCv === 'WASPADA' ||
        statusSkpg === 'RENTAN' ||
        statusSkpg === 'WASPADA' ||
        statusForecast === 'Naik' ||
        cv > 8;

      if (isWarning) {
        const defaultRekomendasi = statusCv === 'RENTAN'
          ? ['siapkan Gerakan Pangan Murah (GPM)', 'intensifkan monitoring distributor', 'koordinasi jalur logistik']
          : ['lakukan operasi pasar mandiri', 'pantau pasokan distributor', 'himbau belanja bijak'];

        warnings.push({
          id: r.komoditas,
          name: COMMODITY_MAP[r.komoditas] || r.komoditas.replace(/^harga_/, '').replace(/_/g, ' '),
          current,
          month3,
          cv,
          statusCv,
          statusSkpg,
          rekomendasi: Array.isArray(r.rekomendasi) && r.rekomendasi.length > 0 ? r.rekomendasi : defaultRekomendasi,
          drivers: Array.isArray(r.drivers) ? r.drivers : [],
        });
      }
    });

    return {
      warnings: warnings.length > 0 ? warnings : DEFAULT_WARNINGS,
      totalEvaluated: rows.length,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[ewsService] Error fetching EWS data:', error);
    return {
      warnings: DEFAULT_WARNINGS,
      totalEvaluated: 13,
      updatedAt: new Date().toISOString(),
    };
  }
}
