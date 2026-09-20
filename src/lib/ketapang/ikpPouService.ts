/**
 * ikpPouService.ts
 * Mengambil data live IKP (Indeks Ketahanan Pangan) dan PoU (Prevalence of Undernourishment)
 * dari database Supabase Dashboard Ketapang (fjycaxccbasksjooxrqg.supabase.co).
 */

export interface IkpDataPoint {
  year: string;
  cilegon: number;
  provinsi?: number | null;
  nasional?: number | null;
}

export interface PouDataPoint {
  year: string;
  cilegon: number;
  provinsi?: number | null;
  nasional?: number | null;
}

export interface IkpPouPanelData {
  ikp: IkpDataPoint[];
  pou: PouDataPoint[];
  latestIkpYear: string;
  latestPouYear: string;
  updatedAt: string;
}

const FALLBACK_IKP: IkpDataPoint[] = [
  { year: '2020', cilegon: 70.23, provinsi: 73.48, nasional: 72.44 },
  { year: '2021', cilegon: 71.42, provinsi: 82.69, nasional: 72.44 },
  { year: '2022', cilegon: 72.63, provinsi: 73.78, nasional: 72.91 },
  { year: '2023', cilegon: 81.54, provinsi: 78.71, nasional: 74.20 },
  { year: '2024', cilegon: 80.12, provinsi: 79.25, nasional: 74.91 },
  { year: '2025', cilegon: 76.15, provinsi: 77.78, nasional: 73.00 },
];

const FALLBACK_POU: PouDataPoint[] = [
  { year: '2021', cilegon: 2.46, provinsi: 2.80, nasional: 8.49 },
  { year: '2022', cilegon: 2.04, provinsi: 2.46, nasional: 10.21 },
  { year: '2023', cilegon: 2.19, provinsi: 2.87, nasional: 9.13 },
  { year: '2024', cilegon: 1.96, provinsi: 2.55, nasional: 8.27 },
  { year: '2025', cilegon: 2.78, provinsi: 2.88, nasional: 7.89 },
];

export async function getLiveIkpPouData(): Promise<IkpPouPanelData> {
  const KT_URL = process.env.KETAPANG_SUPABASE_URL || 'https://fjycaxccbasksjooxrqg.supabase.co';
  const KT_KEY = process.env.KETAPANG_SUPABASE_SERVICE_KEY || process.env.KETAPANG_SUPABASE_ANON_KEY || '';

  if (!KT_KEY) {
    return {
      ikp: FALLBACK_IKP,
      pou: FALLBACK_POU,
      latestIkpYear: '2025',
      latestPouYear: '2025',
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const [ikpRes, pouRes] = await Promise.allSettled([
      fetch(`${KT_URL}/rest/v1/ikp_data?select=*&order=tahun.asc`, {
        headers: { apikey: KT_KEY, Authorization: `Bearer ${KT_KEY}` },
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`${KT_URL}/rest/v1/pou_data?select=*&order=tahun.asc`, {
        headers: { apikey: KT_KEY, Authorization: `Bearer ${KT_KEY}` },
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    let ikpList: IkpDataPoint[] = FALLBACK_IKP;
    if (ikpRes.status === 'fulfilled' && ikpRes.value.ok) {
      const raw = await ikpRes.value.json();
      if (Array.isArray(raw) && raw.length > 0) {
        ikpList = raw.map((r) => ({
          year: String(r.tahun || r.periode || ''),
          cilegon: Number(r.ikp_cilegon ?? r.skor_cilegon ?? r.nilai ?? 0),
          provinsi: r.ikp_provinsi != null ? Number(r.ikp_provinsi) : (r.skor_banten != null ? Number(r.skor_banten) : null),
          nasional: r.ikp_nasional != null ? Number(r.ikp_nasional) : (r.skor_nasional != null ? Number(r.skor_nasional) : null),
        })).filter(x => x.year);
      }
    }

    let pouList: PouDataPoint[] = FALLBACK_POU;
    if (pouRes.status === 'fulfilled' && pouRes.value.ok) {
      const raw = await pouRes.value.json();
      if (Array.isArray(raw) && raw.length > 0) {
        pouList = raw.map((r) => ({
          year: String(r.tahun || r.periode || ''),
          cilegon: Number(r.pou_cilegon ?? r.nilai ?? 0),
          provinsi: r.pou_provinsi != null ? Number(r.pou_provinsi) : (r.provinsi != null ? Number(r.provinsi) : null),
          nasional: r.pou_nasional != null ? Number(r.pou_nasional) : (r.nasional != null ? Number(r.nasional) : null),
        })).filter(x => x.year);
      }
    }

    const latestIkpYear = ikpList[ikpList.length - 1]?.year || '2025';
    const latestPouYear = pouList[pouList.length - 1]?.year || '2025';

    return {
      ikp: ikpList,
      pou: pouList,
      latestIkpYear,
      latestPouYear,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[ikpPouService] Error fetching IKP/PoU:', error);
    return {
      ikp: FALLBACK_IKP,
      pou: FALLBACK_POU,
      latestIkpYear: '2025',
      latestPouYear: '2025',
      updatedAt: new Date().toISOString(),
    };
  }
}
