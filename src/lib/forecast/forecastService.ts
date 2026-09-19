/**
 * forecastService.ts
 * Service terpusat untuk mengambil data live peramalan harga pangan (ML Forecasting)
 * dari tabel `forecast_result` di Supabase Dashboard Ketapang (fjycaxccbasksjooxrqg.supabase.co).
 */

export interface ForecastTableItem {
  id: string;
  komoditas: string;
  name: string;
  current: number;
  month1: number;
  month3: number;
  changePct: number;
  trend: 'up' | 'down' | 'stable';
  cv?: number;
  growthYoY?: number;
  statusForecast?: string;
  statusCv?: string;
  statusSkpg?: string;
  rekomendasi?: string[];
  drivers?: string[];
}

export interface ForecastTableData {
  items: ForecastTableItem[];
  baselineMonth: string;
  t1Month: string;
  t3Month: string;
  updatedAt?: string;
}

export const COMMODITY_MAP: Record<string, string> = {
  harga_beras: 'Beras Medium',
  harga_bawang_merah: 'Bawang Merah',
  harga_bawang_putih: 'Bawang Putih Bonggol',
  harga_cabai_merah: 'Cabe Merah Besar',
  harga_cabai_merah_keriting: 'Cabe Merah Keriting',
  harga_cabai_rawit_merah: 'Cabe Rawit Merah',
  harga_cabai_rawit_hijau: 'Cabe Rawit Hijau',
  harga_cabai_rawit: 'Cabe Rawit Merah',
  harga_daging_sapi: 'Daging Sapi Murni',
  harga_daging_ayam_ras: 'Daging Ayam Ras',
  harga_telur_ayam_ras: 'Telur Ayam Ras',
  harga_gula_pasir: 'Gula Pasir',
  harga_minyak_goreng: 'Minyak Goreng Kemasan',
  harga_tepung_terigu: 'Tepung Terigu Kemasan',
};

export const COMMODITY_ORDER: string[] = [
  'harga_beras',
  'harga_bawang_merah',
  'harga_bawang_putih',
  'harga_cabai_merah',
  'harga_cabai_merah_keriting',
  'harga_cabai_rawit_merah',
  'harga_cabai_rawit_hijau',
  'harga_daging_sapi',
  'harga_daging_ayam_ras',
  'harga_telur_ayam_ras',
  'harga_gula_pasir',
  'harga_minyak_goreng',
  'harga_tepung_terigu',
];

const getIndonesianMonthName = (monthIndex: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return months[((monthIndex % 12) + 12) % 12];
};

export const getBaselineMonthStr = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${getIndonesianMonthName(d.getMonth()).toUpperCase()} ${d.getFullYear()}`;
};

export const getT1MonthStr = (): string => {
  const d = new Date();
  return `${getIndonesianMonthName(d.getMonth()).toUpperCase()} ${d.getFullYear()}`;
};

export const getT3MonthStr = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  return `${getIndonesianMonthName(d.getMonth()).toUpperCase()} ${d.getFullYear()}`;
};

/**
 * Fallback dataset if Supabase connection fails or is offline
 */
const FALLBACK_FORECASTS: ForecastTableItem[] = [
  { id: 'harga_beras', komoditas: 'harga_beras', name: 'Beras Medium', current: 13833, month1: 13873, month3: 13837, changePct: 0.3, trend: 'stable' },
  { id: 'harga_bawang_merah', komoditas: 'harga_bawang_merah', name: 'Bawang Merah', current: 31580, month1: 33498, month3: 36767, changePct: 6.1, trend: 'up' },
  { id: 'harga_bawang_putih', komoditas: 'harga_bawang_putih', name: 'Bawang Putih Bonggol', current: 36309, month1: 36855, month3: 37035, changePct: 1.5, trend: 'stable' },
  { id: 'harga_cabai_merah', komoditas: 'harga_cabai_merah', name: 'Cabe Merah Besar', current: 40469, month1: 39668, month3: 52927, changePct: -2.0, trend: 'stable' },
  { id: 'harga_cabai_merah_keriting', komoditas: 'harga_cabai_merah_keriting', name: 'Cabe Merah Keriting', current: 37133, month1: 39434, month3: 52077, changePct: 6.2, trend: 'up' },
  { id: 'harga_cabai_rawit_merah', komoditas: 'harga_cabai_rawit_merah', name: 'Cabe Rawit Merah', current: 55946, month1: 53536, month3: 65199, changePct: -4.3, trend: 'down' },
  { id: 'harga_cabai_rawit_hijau', komoditas: 'harga_cabai_rawit_hijau', name: 'Cabe Rawit Hijau', current: 44367, month1: 41290, month3: 57603, changePct: -6.9, trend: 'down' },
  { id: 'harga_daging_sapi', komoditas: 'harga_daging_sapi', name: 'Daging Sapi Murni', current: 140000, month1: 135471, month3: 135631, changePct: -3.2, trend: 'down' },
  { id: 'harga_daging_ayam_ras', komoditas: 'harga_daging_ayam_ras', name: 'Daging Ayam Ras', current: 39975, month1: 39182, month3: 39734, changePct: -2.0, trend: 'stable' },
  { id: 'harga_telur_ayam_ras', komoditas: 'harga_telur_ayam_ras', name: 'Telur Ayam Ras', current: 24506, month1: 26901, month3: 26884, changePct: 9.8, trend: 'up' },
  { id: 'harga_gula_pasir', komoditas: 'harga_gula_pasir', name: 'Gula Pasir', current: 19000, month1: 18603, month3: 18415, changePct: -2.1, trend: 'stable' },
  { id: 'harga_minyak_goreng', komoditas: 'harga_minyak_goreng', name: 'Minyak Goreng Kemasan', current: 20125, month1: 20905, month3: 20571, changePct: 3.9, trend: 'up' },
  { id: 'harga_tepung_terigu', komoditas: 'harga_tepung_terigu', name: 'Tepung Terigu Kemasan', current: 12333, month1: 12740, month3: 12973, changePct: 3.3, trend: 'up' },
];

/**
 * Fetch live forecast table data from Supabase Ketapang
 */
export async function getLiveForecastTableData(): Promise<ForecastTableData> {
  const KT_URL = process.env.KETAPANG_SUPABASE_URL || 'https://fjycaxccbasksjooxrqg.supabase.co';
  const KT_KEY = process.env.KETAPANG_SUPABASE_SERVICE_KEY || process.env.KETAPANG_SUPABASE_ANON_KEY || '';

  const baselineMonth = getBaselineMonthStr();
  const t1Month = getT1MonthStr();
  const t3Month = getT3MonthStr();

  if (!KT_KEY) {
    return {
      items: FALLBACK_FORECASTS,
      baselineMonth,
      t1Month,
      t3Month,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(`${KT_URL}/rest/v1/forecast_result?select=*`, {
      headers: {
        apikey: KT_KEY,
        Authorization: `Bearer ${KT_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.warn(`[forecastService] fetch failed with status ${res.status}`);
      return {
        items: FALLBACK_FORECASTS,
        baselineMonth,
        t1Month,
        t3Month,
        updatedAt: new Date().toISOString(),
      };
    }

    const rawData = await res.json();
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return {
        items: FALLBACK_FORECASTS,
        baselineMonth,
        t1Month,
        t3Month,
        updatedAt: new Date().toISOString(),
      };
    }

    // Filter out old generic 'harga_cabai_rawit' if specific 'harga_cabai_rawit_merah' exists
    const hasSpecificRawit = rawData.some((r) => r.komoditas === 'harga_cabai_rawit_merah');
    const filteredDbData = hasSpecificRawit
      ? rawData.filter((r) => r.komoditas !== 'harga_cabai_rawit')
      : rawData;

    const mappedItems: ForecastTableItem[] = filteredDbData.map((item) => {
      const current = Number(item.harga_aktual) || 0;
      const month1 = Number(item.forecast_1m) || 0;
      const month3 = Number(item.forecast_3m) || 0;

      const rawChangePct = item.perubahan_pct != null
        ? Number(item.perubahan_pct)
        : current > 0 ? ((month1 - current) / current) * 100 : 0;
      
      const changePct = Number(rawChangePct.toFixed(1));

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (changePct > 3) {
        trend = 'up';
      } else if (changePct < -3) {
        trend = 'down';
      } else {
        trend = 'stable';
      }

      return {
        id: item.komoditas,
        komoditas: item.komoditas,
        name: COMMODITY_MAP[item.komoditas] || item.komoditas.replace(/^harga_/, '').replace(/_/g, ' '),
        current,
        month1,
        month3,
        changePct,
        trend,
        cv: item.cv ? Number(item.cv) : undefined,
        growthYoY: item.growth_yoy ? Number(item.growth_yoy) : undefined,
        statusForecast: item.status_forecast || (trend === 'up' ? 'Naik' : trend === 'down' ? 'Turun' : 'Stabil'),
        statusCv: item.status_cv,
        statusSkpg: item.status_skpg,
        rekomendasi: Array.isArray(item.rekomendasi) ? item.rekomendasi : [],
        drivers: Array.isArray(item.drivers) ? item.drivers : [],
      };
    });

    // Sort by official COMMODITY_ORDER
    mappedItems.sort((a, b) => {
      const idxA = COMMODITY_ORDER.indexOf(a.id);
      const idxB = COMMODITY_ORDER.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      items: mappedItems,
      baselineMonth,
      t1Month,
      t3Month,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[forecastService] error fetching live forecast_result:', error);
    return {
      items: FALLBACK_FORECASTS,
      baselineMonth,
      t1Month,
      t3Month,
      updatedAt: new Date().toISOString(),
    };
  }
}
