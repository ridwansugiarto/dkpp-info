/**
 * serumpunpadi.ts
 * Fetches live fisheries data from serumpunpadi.web.id Supabase project.
 * Table: nelayan_tangkap (lat, lng, nama_nelayan, alat_tangkap, jumlah_nelayan, perahu_motor_tempel, ...)
 */

export interface NelayenTangkapRow {
  id: string;
  lat: number;
  lng: number;
  nama_nelayan: string;
  alat_tangkap: string | null;
  jumlah_nelayan?: number | null;
  perahu_motor_tempel?: number | null;
  kapal_motor?: number | null;
  perahu_tanpa_motor?: number | null;
  kecamatan?: string | null;
  kelurahan?: string | null;
}

export interface NelayenPin {
  lat: number;
  lng: number;
  name: string;
  category: 'nelayan';
  kelurahan: string;
  kecamatan: string;
  jumlah_nelayan: number;
  alat_tangkap: string;
  perahu_motor_tempel: number;
}

const SP_URL = process.env.SERUMPUNPADI_SUPABASE_URL || 'https://xxdbgnxxlumdfczflytg.supabase.co';
const SP_KEY = process.env.SERUMPUNPADI_SUPABASE_SERVICE_KEY || process.env.SERUMPUNPADI_SUPABASE_ANON_KEY || '';

// Fallback static data (dari screenshot serumpunpadi capture 1)
const FALLBACK_NELAYAN: NelayenPin[] = [
  { lat: -5.975357244616, lng: 105.99532127380, name: 'Nelayan Lelean',         category: 'nelayan', kelurahan: 'Kubangsari',  kecamatan: 'Ciwandan',  jumlah_nelayan: 110, alat_tangkap: 'Jaring:110,Pancing:110',   perahu_motor_tempel: 54  },
  { lat: -6.002651813927, lng: 106.08791649341, name: 'Nelayan Terate',         category: 'nelayan', kelurahan: 'Tamansari',   kecamatan: 'Pulomerak', jumlah_nelayan: 18,  alat_tangkap: 'Pancing:18,Jaring:18',     perahu_motor_tempel: 24  },
  { lat: -6.021219806854, lng: 105.95185875892, name: 'Nelayan Tanjung Leneng', category: 'nelayan', kelurahan: 'Gunung Sugih', kecamatan: 'Ciwandan', jumlah_nelayan: 72,  alat_tangkap: 'Jaring:72,Pancing:72',    perahu_motor_tempel: 72  },
  { lat: -5.984192383485, lng: 105.99079370498, name: 'Nelayan Tanjung Peni',  category: 'nelayan', kelurahan: 'Kubangsari',  kecamatan: 'Ciwandan',  jumlah_nelayan: 191, alat_tangkap: 'Pancing:191,Jaring:191',  perahu_motor_tempel: 102 },
  { lat: -5.896859121644, lng: 106.01773917675, name: 'Nelayan Suralaya',      category: 'nelayan', kelurahan: 'Suralaya',    kecamatan: 'Pulomerak', jumlah_nelayan: 144, alat_tangkap: 'Jaring:67,Pancing:144',   perahu_motor_tempel: 67  },
  { lat: -5.937475506435, lng: 106.00056767463, name: 'Nelayan Mabak',         category: 'nelayan', kelurahan: 'Mekarsari',   kecamatan: 'Pulomerak', jumlah_nelayan: 40,  alat_tangkap: 'Jaring:10,Pancing:10',    perahu_motor_tempel: 10  },
  { lat: -5.918805786362, lng: 106.00628539006, name: 'Nelayan Lebak Gede',    category: 'nelayan', kelurahan: 'Lebakgede',   kecamatan: 'Pulomerak', jumlah_nelayan: 24,  alat_tangkap: 'Pancing:24',              perahu_motor_tempel: 16  },
  { lat: -5.940004593941, lng: 105.99995613098, name: 'Nelayan Medaksa',       category: 'nelayan', kelurahan: 'Tamansari',   kecamatan: 'Pulomerak', jumlah_nelayan: 52,  alat_tangkap: 'Jaring:52,Pancing:52',    perahu_motor_tempel: 24  },
  { lat: -5.936557775605, lng: 106.00048184394, name: 'Nelayan Kaltex',        category: 'nelayan', kelurahan: 'Tamansari',   kecamatan: 'Pulomerak', jumlah_nelayan: 40,  alat_tangkap: 'Jaring:40,Pancing:40',    perahu_motor_tempel: 40  },
];

/**
 * Fetch live nelayan data from serumpunpadi Supabase.
 * Falls back to static snapshot if the request fails.
 */
export async function fetchNelayenTangkap(): Promise<NelayenPin[]> {
  if (!SP_KEY) {
    console.warn('[serumpunpadi] No API key configured, using fallback data.');
    return FALLBACK_NELAYAN;
  }

  try {
    const res = await fetch(
      `${SP_URL}/rest/v1/nelayan_tangkap?select=id,lat,lng,nama_nelayan,alat_tangkap,jumlah_nelayan,perahu_motor_tempel,kapal_motor,perahu_tanpa_motor,kelurahan,kecamatan&order=nama_nelayan.asc`,
      {
        headers: {
          apikey: SP_KEY,
          Authorization: `Bearer ${SP_KEY}`,
          'Content-Type': 'application/json',
        },
        // 8-second timeout via AbortController
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[serumpunpadi] Fetch failed (${res.status}): ${errText.slice(0, 200)}`);
      return FALLBACK_NELAYAN;
    }

    const rows: NelayenTangkapRow[] = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return FALLBACK_NELAYAN;
    }

    return rows
      .filter((r) => r.lat != null && r.lng != null && r.nama_nelayan)
      .map((r): NelayenPin => ({
        lat: r.lat,
        lng: r.lng,
        name: r.nama_nelayan,
        category: 'nelayan',
        kelurahan: r.kelurahan || resolveKelurahan(r.nama_nelayan),
        kecamatan: r.kecamatan || resolveKecamatan(r.lat, r.lng),
        jumlah_nelayan: r.jumlah_nelayan ?? 0,
        alat_tangkap: r.alat_tangkap || '-',
        perahu_motor_tempel: r.perahu_motor_tempel ?? 0,
      }));
  } catch (err) {
    console.warn('[serumpunpadi] fetch error, using fallback:', err);
    return FALLBACK_NELAYAN;
  }
}

/**
 * Build a formatted text context block for the AI system prompt.
 */
export function buildNelayenContext(pins: NelayenPin[]): string {
  if (!pins.length) return '';
  const totalNelayan = pins.reduce((s, p) => s + (p.jumlah_nelayan || 0), 0);
  const totalPerahu = pins.reduce((s, p) => s + (p.perahu_motor_tempel || 0), 0);

  const lines = [
    `\n=== DATA LIVE PANGKALAN NELAYAN TANGKAP CILEGON (serumpunpadi.web.id) ===`,
    `Total Pangkalan: ${pins.length} | Total Nelayan: ${totalNelayan} Orang | Total Perahu Motor Tempel: ${totalPerahu} Unit`,
    ``,
    ...pins.map((p) =>
      `• ${p.name} — Koordinat: (${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}) | Kelurahan: ${p.kelurahan}, Kec. ${p.kecamatan} | Nelayan: ${p.jumlah_nelayan} Orang | Alat Tangkap: ${p.alat_tangkap} | Perahu Motor Tempel: ${p.perahu_motor_tempel} Unit`
    ),
  ];
  return lines.join('\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveKelurahan(nama: string): string {
  const map: Record<string, string> = {
    'Tanjung Peni': 'Kubangsari', 'Suralaya': 'Suralaya', 'Mabak': 'Mekarsari',
    'Kaltex': 'Tamansari', 'Lebak Gede': 'Lebakgede', 'Tamansari': 'Tamansari',
    'Tanjung Leneng': 'Gunung Sugih', 'Terate': 'Tamansari', 'Lelean': 'Kubangsari',
    'Medaksa': 'Tamansari',
  };
  for (const [k, v] of Object.entries(map)) {
    if (nama.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '';
}

function resolveKecamatan(lat: number, lng: number): string {
  // Rough bounding-box for Pulomerak (north coast) vs Ciwandan (west coast)
  if (lat > -5.945) return 'Pulomerak';
  if (lng < 106.005) return 'Ciwandan';
  return 'Cilegon';
}
