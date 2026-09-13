/**
 * ketapang.ts
 * Fetches live food security indicator data from the "dashboard ketapang"
 * Supabase project (https://fjycaxccbasksjooxrqg.supabase.co).
 *
 * Tables integrated:
 *   benchmark_data, cv_beras_bulanan, cv_beras_data,
 *   harga_komoditas_skpg, harga_pangan_ml, harga_sagon_harian,
 *   ikp_data, inflasi_ml, intervensi_kelurahan,
 *   ketersediaan_energi_data, ketersediaan_pangan, ketersediaan_protein_data,
 *   konsumsi_energi_data, konsumsi_protein_data, master_wilayah_bps,
 *   pou_data, pph_data, produksi_beras_data, produksi_padi_ml
 */

const KT_URL = process.env.KETAPANG_SUPABASE_URL || 'https://fjycaxccbasksjooxrqg.supabase.co';
const KT_KEY = process.env.KETAPANG_SUPABASE_SERVICE_KEY || process.env.KETAPANG_SUPABASE_ANON_KEY || '';

// ─────────────────────────────────────────────────────────────────────────────
// Generic fetch helper
// ─────────────────────────────────────────────────────────────────────────────
async function ktFetch(
  table: string,
  select = '*',
  extra = '',
  limit = 50
): Promise<Record<string, unknown>[]> {
  if (!KT_KEY) return [];
  try {
    const qs = [`select=${encodeURIComponent(select)}`, `limit=${limit}`, extra].filter(Boolean).join('&');
    const res = await fetch(`${KT_URL}/rest/v1/${table}?${qs}`, {
      headers: {
        apikey: KT_KEY,
        Authorization: `Bearer ${KT_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn(`[ketapang] ${table} fetch ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn(`[ketapang] ${table} error:`, e);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported data shape
// ─────────────────────────────────────────────────────────────────────────────
export interface KetapangData {
  hargaSagonHarian: Record<string, unknown>[];
  hargaKomoditasSkpg: Record<string, unknown>[];
  hargaPanganMl: Record<string, unknown>[];
  ikpData: Record<string, unknown>[];
  pouData: Record<string, unknown>[];
  pphData: Record<string, unknown>[];
  produksiBeras: Record<string, unknown>[];
  produksiPadiMl: Record<string, unknown>[];
  inflasiMl: Record<string, unknown>[];
  cvBeras: Record<string, unknown>[];
  cvBerasBulanan: Record<string, unknown>[];
  benchmarkData: Record<string, unknown>[];
  ketersediaanEnergi: Record<string, unknown>[];
  ketersediaanPangan: Record<string, unknown>[];
  ketersediaanProtein: Record<string, unknown>[];
  konsumsiEnergi: Record<string, unknown>[];
  konsumsiProtein: Record<string, unknown>[];
  intervensiKelurahan: Record<string, unknown>[];
  masterWilayah: Record<string, unknown>[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main fetch — semua tabel paralel
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchKetapangData(): Promise<KetapangData> {
  const results = await Promise.allSettled([
    ktFetch('harga_sagon_harian',         '*', 'order=tanggal.desc', 30),
    ktFetch('harga_komoditas_skpg',       '*', 'order=tanggal.desc', 30),
    ktFetch('harga_pangan_ml',            '*', 'order=tanggal.desc', 30),
    ktFetch('ikp_data',                   '*', 'order=tahun.desc',   20),
    ktFetch('pou_data',                   '*', 'order=tahun.desc',   20),
    ktFetch('pph_data',                   '*', 'order=tahun.desc',   20),
    ktFetch('produksi_beras_data',        '*', 'order=tahun.desc',   20),
    ktFetch('produksi_padi_ml',           '*', 'order=tahun.desc',   20),
    ktFetch('inflasi_ml',                 '*', 'order=tanggal.desc', 20),
    ktFetch('cv_beras_data',              '*', 'order=tanggal.desc', 20),
    ktFetch('cv_beras_bulanan',           '*', 'order=bulan.desc',   24),
    ktFetch('benchmark_data',             '*', '',                   50),
    ktFetch('ketersediaan_energi_data',   '*', 'order=tahun.desc',   20),
    ktFetch('ketersediaan_pangan',        '*', 'order=tahun.desc',   20),
    ktFetch('ketersediaan_protein_data',  '*', 'order=tahun.desc',   20),
    ktFetch('konsumsi_energi_data',       '*', 'order=tahun.desc',   20),
    ktFetch('konsumsi_protein_data',      '*', 'order=tahun.desc',   20),
    ktFetch('intervensi_kelurahan',       '*', 'order=tahun.desc',   30),
    ktFetch('master_wilayah_bps',         '*', '',                   50),
  ]);

  const get = (i: number) =>
    results[i].status === 'fulfilled' ? results[i].value : [];

  return {
    hargaSagonHarian:    get(0),
    hargaKomoditasSkpg: get(1),
    hargaPanganMl:      get(2),
    ikpData:            get(3),
    pouData:            get(4),
    pphData:            get(5),
    produksiBeras:      get(6),
    produksiPadiMl:     get(7),
    inflasiMl:          get(8),
    cvBeras:            get(9),
    cvBerasBulanan:     get(10),
    benchmarkData:      get(11),
    ketersediaanEnergi: get(12),
    ketersediaanPangan: get(13),
    ketersediaanProtein:get(14),
    konsumsiEnergi:     get(15),
    konsumsiProtein:    get(16),
    intervensiKelurahan:get(17),
    masterWilayah:      get(18),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context builder — menghasilkan teks terstruktur untuk system prompt Gemini
// ─────────────────────────────────────────────────────────────────────────────
export function buildKetapangContext(d: KetapangData): string {
  const lines: string[] = ['\n=== DATA LIVE DASHBOARD KETAPANG (fjycaxccbasksjooxrqg.supabase.co) ==='];

  // --- IKP ---
  if (d.ikpData.length) {
    lines.push('\n[IKP LIVE — Indeks Ketahanan Pangan]');
    for (const r of d.ikpData.slice(0, 6)) {
      const tahun = r.tahun ?? r.periode ?? '-';
      const cilegon = r.skor_cilegon ?? r.ikp_cilegon ?? r.nilai ?? '-';
      const banten = r.skor_banten ?? r.ikp_banten ?? '-';
      const nasional = r.skor_nasional ?? r.ikp_nasional ?? '-';
      lines.push(`  • ${tahun}: Cilegon ${cilegon} | Banten ${banten} | Nasional ${nasional}`);
    }
  }

  // --- POU ---
  if (d.pouData.length) {
    lines.push('\n[POU LIVE — Prevalensi Kekurangan Pangan (%)]');
    for (const r of d.pouData.slice(0, 6)) {
      const tahun = r.tahun ?? '-';
      const cilegon = r.pou_cilegon ?? r.nilai ?? '-';
      const nasional = r.pou_nasional ?? '-';
      lines.push(`  • ${tahun}: Cilegon ${cilegon}% | Nasional ${nasional}%`);
    }
  }

  // --- PPH ---
  if (d.pphData.length) {
    lines.push('\n[PPH LIVE — Pola Pangan Harapan]');
    for (const r of d.pphData.slice(0, 6)) {
      lines.push(`  • ${r.tahun ?? '-'}: PPH Konsumsi ${r.pph_konsumsi ?? r.nilai_konsumsi ?? '-'} | PPH Ketersediaan ${r.pph_ketersediaan ?? r.nilai_ketersediaan ?? '-'}`);
    }
  }

  // --- Harga Sagon Harian ---
  if (d.hargaSagonHarian.length) {
    lines.push('\n[HARGA PANGAN HARIAN PASAR SAGON — TERBARU]');
    for (const r of d.hargaSagonHarian.slice(0, 10)) {
      const tgl = r.tanggal ?? r.periode ?? '-';
      const komoditas = r.komoditas ?? r.nama_komoditas ?? '-';
      const harga = r.harga ?? r.harga_rata ?? '-';
      const satuan = r.satuan ?? 'kg';
      const pasar = r.pasar ?? r.lokasi ?? '';
      lines.push(`  • ${tgl} | ${komoditas}${pasar ? ` (${pasar})` : ''}: Rp ${Number(harga).toLocaleString('id-ID')}/${satuan}`);
    }
  }

  // --- Harga Komoditas SKPG ---
  if (d.hargaKomoditasSkpg.length) {
    lines.push(`\n[HARGA KOMODITAS SKPG] ${d.hargaKomoditasSkpg.length} record terbaru:`);
    for (const r of d.hargaKomoditasSkpg.slice(0, 8)) {
      lines.push(`  • ${r.tanggal ?? r.bulan ?? '-'} | ${r.komoditas ?? '-'}: Rp ${Number(r.harga ?? 0).toLocaleString('id-ID')} | CV: ${r.cv ?? '-'}%`);
    }
  }

  // --- CV Beras ---
  if (d.cvBeras.length || d.cvBerasBulanan.length) {
    const src = d.cvBerasBulanan.length ? d.cvBerasBulanan : d.cvBeras;
    lines.push('\n[CV BERAS LIVE — Koefisien Variasi Harga]');
    for (const r of src.slice(0, 6)) {
      const period = r.bulan ?? r.tanggal ?? r.tahun ?? '-';
      const cv = r.cv ?? r.nilai_cv ?? '-';
      const status = r.status ?? (Number(cv) < 5 ? 'STABIL' : Number(cv) < 10 ? 'WASPADA' : 'GEJOLAK');
      lines.push(`  • ${period}: CV ${cv}% — [${status}]`);
    }
  }

  // --- Produksi Padi & Beras ---
  if (d.produksiBeras.length || d.produksiPadiMl.length) {
    lines.push('\n[PRODUKSI BERAS & PADI LIVE]');
    const src = d.produksiBeras.length ? d.produksiBeras : d.produksiPadiMl;
    for (const r of src.slice(0, 8)) {
      const tahun = r.tahun ?? '-';
      const gkg = r.produksi_gkg ?? r.gkg ?? r.produksi ?? '-';
      const beras = r.produksi_beras ?? r.beras ?? '-';
      const luas = r.luas_panen ?? r.luas ?? '-';
      lines.push(`  • ${tahun}: GKG ${gkg} Ton | Beras ${beras} Ton | Luas ${luas} Ha`);
    }
    // ML forecast
    if (d.produksiPadiMl.length > 0 && d.produksiBeras.length > 0) {
      lines.push('  [FORECAST ML]:');
      for (const r of d.produksiPadiMl.filter(r => (r.is_forecast || r.jenis === 'forecast')).slice(0, 3)) {
        lines.push(`    • ${r.tahun ?? '-'} (Proyeksi): ${r.produksi ?? r.gkg ?? '-'} Ton GKG`);
      }
    }
  }

  // --- Inflasi ---
  if (d.inflasiMl.length) {
    lines.push('\n[INFLASI PANGAN LIVE]');
    for (const r of d.inflasiMl.slice(0, 6)) {
      lines.push(`  • ${r.tanggal ?? r.bulan ?? r.tahun ?? '-'}: Inflasi ${r.inflasi ?? r.nilai ?? '-'}% | Komoditas: ${r.komoditas ?? 'Umum'}`);
    }
  }

  // --- Ketersediaan Energi ---
  if (d.ketersediaanEnergi.length) {
    lines.push('\n[KETERSEDIAAN ENERGI LIVE]');
    for (const r of d.ketersediaanEnergi.slice(0, 5)) {
      lines.push(`  • ${r.tahun ?? '-'}: ${r.energi_tersedia ?? r.nilai ?? '-'} kkal/kapita/hari | Target: ${r.target ?? r.standar ?? 2400} kkal`);
    }
  }

  // --- Ketersediaan Protein ---
  if (d.ketersediaanProtein.length) {
    lines.push('\n[KETERSEDIAAN PROTEIN LIVE]');
    for (const r of d.ketersediaanProtein.slice(0, 5)) {
      lines.push(`  • ${r.tahun ?? '-'}: ${r.protein_tersedia ?? r.nilai ?? '-'} g/kapita/hari | Target: ${r.target ?? r.standar ?? 63} g`);
    }
  }

  // --- Konsumsi Energi ---
  if (d.konsumsiEnergi.length) {
    lines.push('\n[KONSUMSI ENERGI LIVE]');
    for (const r of d.konsumsiEnergi.slice(0, 5)) {
      lines.push(`  • ${r.tahun ?? '-'}: ${r.energi_dikonsumsi ?? r.nilai ?? '-'} kkal/kapita/hari`);
    }
  }

  // --- Konsumsi Protein ---
  if (d.konsumsiProtein.length) {
    lines.push('\n[KONSUMSI PROTEIN LIVE]');
    for (const r of d.konsumsiProtein.slice(0, 5)) {
      lines.push(`  • ${r.tahun ?? '-'}: ${r.protein_dikonsumsi ?? r.nilai ?? '-'} g/kapita/hari`);
    }
  }

  // --- Ketersediaan Pangan ---
  if (d.ketersediaanPangan.length) {
    lines.push('\n[KETERSEDIAAN PANGAN NERACA LIVE]');
    for (const r of d.ketersediaanPangan.slice(0, 8)) {
      lines.push(`  • ${r.tahun ?? '-'} | ${r.komoditas ?? '-'}: Tersedia ${r.ketersediaan ?? r.nilai ?? '-'} ${r.satuan ?? 'Ton'}`);
    }
  }

  // --- Benchmark ---
  if (d.benchmarkData.length) {
    lines.push('\n[BENCHMARK INDIKATOR KETAPANG]');
    for (const r of d.benchmarkData.slice(0, 8)) {
      lines.push(`  • ${r.indikator ?? r.nama ?? '-'}: ${r.nilai ?? r.value ?? '-'} ${r.satuan ?? ''} | Target: ${r.target ?? '-'} | Status: ${r.status ?? '-'}`);
    }
  }

  // --- Intervensi Kelurahan ---
  if (d.intervensiKelurahan.length) {
    lines.push('\n[INTERVENSI KELURAHAN LIVE]');
    for (const r of d.intervensiKelurahan.slice(0, 10)) {
      lines.push(`  • ${r.kelurahan ?? '-'} (${r.kecamatan ?? '-'}): ${r.jenis_intervensi ?? r.program ?? '-'} — ${r.bulan ?? '-'}/${r.tahun ?? '-'}`);
    }
  }

  return lines.join('\n');
}
