/**
 * serumpunpadi.ts
 * Fetches live agricultural & fisheries data from serumpunpadi.web.id Supabase project.
 * Tables: nelayan_tangkap, kolam_budidaya, poktan_kwt, peternakan,
 *         produksi_pangan, sawah_status, warning_opt,
 *         komoditas_hortikultura, komoditas_palawija
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface NelayenPin {
  lat: number; lng: number; name: string; category: 'nelayan';
  kelurahan: string; kecamatan: string;
  jumlah_nelayan: number; alat_tangkap: string; perahu_motor_tempel: number;
}
export interface KolamPin {
  lat: number; lng: number; name: string; category: 'kolam';
  kelurahan: string; kecamatan: string;
  jenis_ikan: string; luas_m2: number; pemilik: string;
}
export interface PokTanPin {
  lat: number; lng: number; name: string; category: 'poktan' | 'kwt';
  kelurahan: string; kecamatan: string;
  jumlah_anggota: number; komoditas: string;
}
export interface TernakPin {
  lat: number; lng: number; name: string; category: 'ternak';
  kelurahan: string; kecamatan: string;
  jenis_ternak: string; jumlah: number;
}

export interface SerumpunData {
  nelayan: NelayenPin[];
  kolam: KolamPin[];
  poktan: PokTanPin[];
  ternak: TernakPin[];
  produksi: Record<string, unknown>[];
  sawahStatus: Record<string, unknown>[];
  warningOpt: Record<string, unknown>[];
  hortikultura: Record<string, unknown>[];
  palawija: Record<string, unknown>[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const SP_URL = process.env.SERUMPUNPADI_SUPABASE_URL || 'https://xxdbgnxxlumdfczflytg.supabase.co';
const SP_KEY = process.env.SERUMPUNPADI_SUPABASE_SERVICE_KEY || process.env.SERUMPUNPADI_SUPABASE_ANON_KEY || '';

async function spFetch(table: string, select = '*', extra = ''): Promise<unknown[]> {
  if (!SP_KEY) return [];
  try {
    const res = await fetch(
      `${SP_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${extra ? `&${extra}` : ''}`,
      {
        headers: { apikey: SP_KEY, Authorization: `Bearer ${SP_KEY}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) {
      console.warn(`[serumpunpadi] ${table} fetch ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn(`[serumpunpadi] ${table} error:`, e);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback static data (dari snapshot capture — dipakai jika RLS belum diset)
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_NELAYAN: NelayenPin[] = [
  { lat: -5.975357, lng: 105.995321, name: 'Nelayan Lelean',         category: 'nelayan', kelurahan: 'Kubangsari',  kecamatan: 'Ciwandan',  jumlah_nelayan: 110, alat_tangkap: 'Jaring:110,Pancing:110',  perahu_motor_tempel: 54  },
  { lat: -6.002651, lng: 106.087916, name: 'Nelayan Terate',         category: 'nelayan', kelurahan: 'Tamansari',   kecamatan: 'Pulomerak', jumlah_nelayan: 18,  alat_tangkap: 'Pancing:18,Jaring:18',    perahu_motor_tempel: 24  },
  { lat: -6.021219, lng: 105.951858, name: 'Nelayan Tanjung Leneng', category: 'nelayan', kelurahan: 'Gunung Sugih', kecamatan: 'Ciwandan', jumlah_nelayan: 72,  alat_tangkap: 'Jaring:72,Pancing:72',   perahu_motor_tempel: 72  },
  { lat: -5.984192, lng: 105.990793, name: 'Nelayan Tanjung Peni',   category: 'nelayan', kelurahan: 'Kubangsari',  kecamatan: 'Ciwandan',  jumlah_nelayan: 191, alat_tangkap: 'Pancing:191,Jaring:191', perahu_motor_tempel: 102 },
  { lat: -5.896859, lng: 106.017739, name: 'Nelayan Suralaya',       category: 'nelayan', kelurahan: 'Suralaya',    kecamatan: 'Pulomerak', jumlah_nelayan: 144, alat_tangkap: 'Jaring:67,Pancing:144',  perahu_motor_tempel: 67  },
  { lat: -5.937475, lng: 106.000567, name: 'Nelayan Mabak',          category: 'nelayan', kelurahan: 'Mekarsari',   kecamatan: 'Pulomerak', jumlah_nelayan: 40,  alat_tangkap: 'Jaring:10,Pancing:10',   perahu_motor_tempel: 10  },
  { lat: -5.918805, lng: 106.006285, name: 'Nelayan Lebak Gede',     category: 'nelayan', kelurahan: 'Lebakgede',   kecamatan: 'Pulomerak', jumlah_nelayan: 24,  alat_tangkap: 'Pancing:24',              perahu_motor_tempel: 16  },
  { lat: -5.940004, lng: 105.999956, name: 'Nelayan Medaksa',        category: 'nelayan', kelurahan: 'Tamansari',   kecamatan: 'Pulomerak', jumlah_nelayan: 52,  alat_tangkap: 'Jaring:52,Pancing:52',   perahu_motor_tempel: 24  },
  { lat: -5.936557, lng: 106.000481, name: 'Nelayan Kaltex',         category: 'nelayan', kelurahan: 'Tamansari',   kecamatan: 'Pulomerak', jumlah_nelayan: 40,  alat_tangkap: 'Jaring:40,Pancing:40',   perahu_motor_tempel: 40  },
];

const FALLBACK_KOLAM: KolamPin[] = [
  { lat: -6.029540, lng: 106.008430, name: 'Kolam Nurholis', category: 'kolam', kelurahan: 'Citangkil', kecamatan: 'Citangkil', jenis_ikan: 'Lele, Nila, Gurame', luas_m2: 170, pemilik: 'Nurholis' },
];

const FALLBACK_POKTAN: PokTanPin[] = [
  { lat: -5.973230, lng: 106.032310, name: 'KWT Gerogol',  category: 'kwt',    kelurahan: 'Gerogol',  kecamatan: 'Gerogol',    jumlah_anggota: 23, komoditas: 'Cabai' },
  { lat: -5.956250, lng: 106.035230, name: 'KWT Gerem',    category: 'kwt',    kelurahan: 'Gerem',    kecamatan: 'Gerogol',    jumlah_anggota: 23, komoditas: 'Sayuran' },
  { lat: -5.989120, lng: 106.042150, name: 'KWT Kotabumi', category: 'kwt',    kelurahan: 'Kotabumi', kecamatan: 'Purwakarta', jumlah_anggota: 33, komoditas: 'Hortikultura' },
];

const FALLBACK_TERNAK: TernakPin[] = [
  { lat: -6.007230, lng: 106.057950, name: 'Peternakan Masigit', category: 'ternak', kelurahan: 'Masigit', kecamatan: 'Jombang', jenis_ternak: 'Sapi, Kambing', jumlah: 4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Fetch helpers per tabel
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchNelayenTangkap(): Promise<NelayenPin[]> {
  const rows = await spFetch(
    'nelayan_tangkap',
    '*',
    'order=nama_nelayan.asc'
  ) as Array<Record<string, unknown>>;

  if (!rows.length) return FALLBACK_NELAYAN;

  return rows
    .filter(r => r.lat != null && r.lng != null && r.nama_nelayan)
    .map(r => {
      // Parse perahu motor tempel
      let perahuMotor = 0;
      if (r.perahu) {
        if (typeof r.perahu === 'object') {
          perahuMotor = Number((r.perahu as Record<string, unknown>)['Perahu motor tempel'] || Object.values(r.perahu as Record<string, unknown>)[0] || 0);
        } else if (typeof r.perahu === 'string') {
          try {
            const obj = JSON.parse(r.perahu);
            perahuMotor = Number(obj['Perahu motor tempel'] || Object.values(obj)[0] || 0);
          } catch {
            const m = (r.perahu as string).match(/\d+/);
            if (m) perahuMotor = parseInt(m[0], 10);
          }
        }
      } else if (r.perahu_motor_tempel != null) {
        perahuMotor = Number(r.perahu_motor_tempel);
      }

      // Parse jumlah nelayan (disimpan di no_hp atau jumlah_nelayan)
      let jmlNelayan = 0;
      if (r.jumlah_nelayan != null && !isNaN(Number(r.jumlah_nelayan))) {
        jmlNelayan = Number(r.jumlah_nelayan);
      } else if (r.no_hp && !isNaN(Number(r.no_hp))) {
        jmlNelayan = Number(r.no_hp);
      } else if (typeof r.alat_tangkap === 'string') {
        const m = (r.alat_tangkap as string).match(/:(\d+)/);
        if (m) jmlNelayan = parseInt(m[1], 10);
      }

      const nama = String(r.nama_nelayan);
      const lat = Number(r.lat);
      const lng = Number(r.lng);

      return {
        lat,
        lng,
        name: nama,
        category: 'nelayan' as const,
        kelurahan: String(r.kelurahan || resolveKelurahan(nama)),
        kecamatan: String(r.kecamatan || resolveKecamatan(lat, lng)),
        jumlah_nelayan: jmlNelayan,
        alat_tangkap: String(r.alat_tangkap || '-'),
        perahu_motor_tempel: perahuMotor,
      };
    });
}

export async function fetchKolamBudidaya(): Promise<KolamPin[]> {
  const rows = await spFetch(
    'kolam_budidaya',
    '*'
  ) as Array<Record<string, unknown>>;

  if (!rows.length) return FALLBACK_KOLAM;

  return rows
    .filter(r => r.lat != null && r.lng != null)
    .map(r => ({
      lat: Number(r.lat), lng: Number(r.lng),
      name: String(r.nama || r.pemilik || 'Kolam Budidaya'),
      category: 'kolam' as const,
      kelurahan: String(r.kelurahan || ''),
      kecamatan: String(r.kecamatan || ''),
      jenis_ikan: String(r.jenis_ikan || '-'),
      luas_m2: Number(r.luas_m2 ?? 0),
      pemilik: String(r.pemilik || '-'),
    }));
}

export async function fetchPokTanKwt(): Promise<PokTanPin[]> {
  const rows = await spFetch(
    'poktan_kwt',
    '*'
  ) as Array<Record<string, unknown>>;

  if (!rows.length) return FALLBACK_POKTAN;

  return rows
    .filter(r => r.lat != null && r.lng != null)
    .map(r => ({
      lat: Number(r.lat), lng: Number(r.lng),
      name: String(r.nama || 'Kelompok Tani'),
      category: (String(r.jenis || 'poktan').toLowerCase().includes('kwt') ? 'kwt' : 'poktan') as 'poktan' | 'kwt',
      kelurahan: String(r.kelurahan || ''),
      kecamatan: String(r.kecamatan || ''),
      jumlah_anggota: Number(r.jumlah_anggota ?? 0),
      komoditas: String(r.komoditas || '-'),
    }));
}

export async function fetchPeternakan(): Promise<TernakPin[]> {
  const rows = await spFetch(
    'peternakan',
    '*'
  ) as Array<Record<string, unknown>>;

  if (!rows.length) return FALLBACK_TERNAK;

  return rows
    .filter(r => r.lat != null && r.lng != null)
    .map(r => ({
      lat: Number(r.lat), lng: Number(r.lng),
      name: String(r.nama || r.pemilik || 'Peternakan'),
      category: 'ternak' as const,
      kelurahan: String(r.kelurahan || ''),
      kecamatan: String(r.kecamatan || ''),
      jenis_ternak: String(r.jenis_ternak || '-'),
      jumlah: Number(r.jumlah ?? 0),
    }));
}

export async function fetchTabularData(): Promise<{
  produksi: Record<string, unknown>[];
  sawahStatus: Record<string, unknown>[];
  warningOpt: Record<string, unknown>[];
  hortikultura: Record<string, unknown>[];
  palawija: Record<string, unknown>[];
}> {
  const [produksi, sawahStatus, warningOpt, hortikultura, palawija] = await Promise.allSettled([
    spFetch('produksi_pangan', '*', 'order=tahun.desc&limit=20'),
    spFetch('sawah_status', '*', 'order=updated_at.desc&limit=43'),
    spFetch('warning_opt', '*', 'order=tanggal.desc&limit=10'),
    spFetch('komoditas_hortikultura', '*', 'limit=30'),
    spFetch('komoditas_palawija', '*', 'limit=30'),
  ]);

  return {
    produksi:     produksi.status     === 'fulfilled' ? produksi.value     as Record<string, unknown>[] : [],
    sawahStatus:  sawahStatus.status  === 'fulfilled' ? sawahStatus.value  as Record<string, unknown>[] : [],
    warningOpt:   warningOpt.status   === 'fulfilled' ? warningOpt.value   as Record<string, unknown>[] : [],
    hortikultura: hortikultura.status === 'fulfilled' ? hortikultura.value as Record<string, unknown>[] : [],
    palawija:     palawija.status     === 'fulfilled' ? palawija.value     as Record<string, unknown>[] : [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch ALL — satu panggilan paralel untuk semua tabel
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAllSerumpunData(): Promise<SerumpunData> {
  const [nelayan, kolam, poktan, ternak, tabular] = await Promise.allSettled([
    fetchNelayenTangkap(),
    fetchKolamBudidaya(),
    fetchPokTanKwt(),
    fetchPeternakan(),
    fetchTabularData(),
  ]);

  return {
    nelayan:    nelayan.status    === 'fulfilled' ? nelayan.value    : FALLBACK_NELAYAN,
    kolam:      kolam.status      === 'fulfilled' ? kolam.value      : FALLBACK_KOLAM,
    poktan:     poktan.status     === 'fulfilled' ? poktan.value     : FALLBACK_POKTAN,
    ternak:     ternak.status     === 'fulfilled' ? ternak.value     : FALLBACK_TERNAK,
    produksi:   tabular.status    === 'fulfilled' ? tabular.value.produksi    : [],
    sawahStatus:tabular.status    === 'fulfilled' ? tabular.value.sawahStatus : [],
    warningOpt: tabular.status    === 'fulfilled' ? tabular.value.warningOpt  : [],
    hortikultura:tabular.status   === 'fulfilled' ? tabular.value.hortikultura: [],
    palawija:   tabular.status    === 'fulfilled' ? tabular.value.palawija    : [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context builders — menghasilkan teks terstruktur untuk system prompt AI
// ─────────────────────────────────────────────────────────────────────────────
export function buildSerumpunContext(d: SerumpunData): string {
  const lines: string[] = ['\n=== DATA LIVE SERUMPUNPADI.WEB.ID (REALTIME GIS PERTANIAN & PERIKANAN CILEGON) ==='];

  // --- Nelayan Tangkap ---
  if (d.nelayan.length) {
    const totN = d.nelayan.reduce((s, p) => s + (p.jumlah_nelayan || 0), 0);
    const totP = d.nelayan.reduce((s, p) => s + (p.perahu_motor_tempel || 0), 0);
    lines.push(`\n[PERIKANAN TANGKAP] ${d.nelayan.length} Pangkalan | ${totN} Nelayan | ${totP} Perahu Motor Tempel`);
    for (const p of d.nelayan) {
      lines.push(`  • ${p.name} — Kel. ${p.kelurahan}, Kec. ${p.kecamatan} | Lat: ${p.lat.toFixed(6)}, Lng: ${p.lng.toFixed(6)} | ${p.jumlah_nelayan} nelayan | Alat: ${p.alat_tangkap} | Perahu: ${p.perahu_motor_tempel} unit`);
    }
  }

  // --- Kolam Budidaya ---
  if (d.kolam.length) {
    const totLuas = d.kolam.reduce((s, k) => s + (k.luas_m2 || 0), 0);
    lines.push(`\n[PERIKANAN BUDIDAYA] ${d.kolam.length} Kolam Aktif | Total Luas: ${totLuas} m²`);
    for (const k of d.kolam) {
      lines.push(`  • ${k.name} (${k.pemilik}) — Kel. ${k.kelurahan}, Kec. ${k.kecamatan} | Lat: ${k.lat.toFixed(6)}, Lng: ${k.lng.toFixed(6)} | Ikan: ${k.jenis_ikan} | Luas: ${k.luas_m2} m²`);
    }
  }

  // --- Poktan & KWT ---
  if (d.poktan.length) {
    const kwt = d.poktan.filter(p => p.category === 'kwt');
    const poktan = d.poktan.filter(p => p.category === 'poktan');
    const totAnggota = d.poktan.reduce((s, p) => s + (p.jumlah_anggota || 0), 0);
    lines.push(`\n[POKTAN & KWT] ${d.poktan.length} Kelompok (KWT: ${kwt.length}, Poktan: ${poktan.length}) | ${totAnggota} Total Anggota`);
    for (const p of d.poktan) {
      lines.push(`  • ${p.name} [${p.category.toUpperCase()}] — Kel. ${p.kelurahan}, Kec. ${p.kecamatan} | Lat: ${p.lat.toFixed(6)}, Lng: ${p.lng.toFixed(6)} | ${p.jumlah_anggota} anggota | Komoditas: ${p.komoditas}`);
    }
  }

  // --- Peternakan ---
  if (d.ternak.length) {
    const totTernak = d.ternak.reduce((s, t) => s + (t.jumlah || 0), 0);
    lines.push(`\n[PETERNAKAN] ${d.ternak.length} Lokasi | ${totTernak} Ekor Total`);
    for (const t of d.ternak) {
      lines.push(`  • ${t.name} — Kel. ${t.kelurahan}, Kec. ${t.kecamatan} | Lat: ${t.lat.toFixed(6)}, Lng: ${t.lng.toFixed(6)} | Ternak: ${t.jenis_ternak} (${t.jumlah} ekor)`);
    }
  }

  // --- Produksi Pangan ---
  if (d.produksi.length) {
    lines.push(`\n[PRODUKSI PANGAN LIVE] ${d.produksi.length} record terbaru:`);
    for (const r of d.produksi.slice(0, 8)) {
      const tahun = r.tahun ?? r.periode ?? '-';
      const komoditas = r.komoditas ?? r.jenis ?? '-';
      const produksi = r.produksi ?? r.volume ?? r.hasil ?? '-';
      const satuan = r.satuan ?? 'Ton';
      lines.push(`  • ${tahun} | ${komoditas}: ${produksi} ${satuan}`);
    }
  }

  // --- Hortikultura ---
  if (d.hortikultura.length) {
    lines.push(`\n[KOMODITAS HORTIKULTURA] ${d.hortikultura.length} data:`);
    for (const r of d.hortikultura.slice(0, 6)) {
      lines.push(`  • ${r.nama ?? r.komoditas ?? '-'}: ${r.produksi ?? r.luas ?? '-'} ${r.satuan ?? ''}`);
    }
  }

  // --- Palawija ---
  if (d.palawija.length) {
    lines.push(`\n[KOMODITAS PALAWIJA] ${d.palawija.length} data:`);
    for (const r of d.palawija.slice(0, 6)) {
      lines.push(`  • ${r.nama ?? r.komoditas ?? '-'}: ${r.produksi ?? r.luas ?? '-'} ${r.satuan ?? ''}`);
    }
  }

  // --- Warning OPT ---
  if (d.warningOpt.length) {
    lines.push(`\n[⚠️ PERINGATAN OPT AKTIF] ${d.warningOpt.length} peringatan:`);
    for (const w of d.warningOpt.slice(0, 5)) {
      lines.push(`  • ${w.tanggal ?? '-'} | ${w.lokasi ?? w.kelurahan ?? '-'}: ${w.jenis_opt ?? w.hama ?? '-'} — ${w.status ?? '-'}`);
    }
  }

  // --- Sawah Status ---
  if (d.sawahStatus.length) {
    lines.push(`\n[STATUS SAWAH LIVE] ${d.sawahStatus.length} petak terpantau (sample 5 terbaru):`);
    for (const s of d.sawahStatus.slice(0, 5)) {
      lines.push(`  • ${s.kelurahan ?? '-'}: ${s.status ?? '-'} | Fase: ${s.fase_tanam ?? '-'} | Luas: ${s.luas_ha ?? '-'} Ha`);
    }
  }

  return lines.join('\n');
}

// Backward compat: dipakai oleh gemini.ts lama yang hanya pakai nelayan
export function buildNelayenContext(pins: NelayenPin[]): string {
  if (!pins.length) return '';
  const total = pins.reduce((s, p) => s + (p.jumlah_nelayan || 0), 0);
  const totalPerahu = pins.reduce((s, p) => s + (p.perahu_motor_tempel || 0), 0);
  return [
    `\n=== DATA LIVE PANGKALAN NELAYAN TANGKAP (serumpunpadi.web.id) ===`,
    `Total Pangkalan: ${pins.length} | Total Nelayan: ${total} Orang | Total Perahu: ${totalPerahu} Unit`,
    ...pins.map(p => `• ${p.name} — (${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}) | Kel. ${p.kelurahan}, Kec. ${p.kecamatan} | ${p.jumlah_nelayan} nelayan | ${p.alat_tangkap} | ${p.perahu_motor_tempel} perahu`),
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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
  if (lat > -5.945) return 'Pulomerak';
  if (lng < 106.005) return 'Ciwandan';
  return 'Cilegon';
}
