import { SourceCitation, MapAction, ToolCall } from '@/types/dkpp';
import { BASELINE_KELURAHAN_DATA } from './thematic-indicators';
import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Model chain: Gemini multi-model fallback (dari terbaru ke lama)
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

// ─────────────────────────────────────────────────────────────────────────────
// Data koordinat kelurahan untuk aksi peta
// ─────────────────────────────────────────────────────────────────────────────
export const KELURAHAN_COORDS: Record<string, { lat: number; lng: number; kec: string }> = {
  'Bulakan':       { lat: -6.042, lng: 106.071, kec: 'Cibeber' },
  'Cibeber':       { lat: -6.035, lng: 106.065, kec: 'Cibeber' },
  'Cikerai':       { lat: -6.051, lng: 106.058, kec: 'Cibeber' },
  'Kalitimbang':   { lat: -6.030, lng: 106.082, kec: 'Cibeber' },
  'Karang Asem':   { lat: -6.028, lng: 106.061, kec: 'Cibeber' },
  'Kedaleman':     { lat: -6.039, lng: 106.052, kec: 'Cibeber' },
  'Bagendung':     { lat: -6.028, lng: 106.035, kec: 'Cilegon' },
  'Bendungan':     { lat: -6.015, lng: 106.051, kec: 'Cilegon' },
  'Ciwaduk':       { lat: -6.019, lng: 106.045, kec: 'Cilegon' },
  'Ciwedus':       { lat: -6.012, lng: 106.062, kec: 'Cilegon' },
  'Ketileng':      { lat: -6.025, lng: 106.058, kec: 'Cilegon' },
  'Citangkil':     { lat: -6.012, lng: 106.015, kec: 'Citangkil' },
  'Deringo':       { lat: -6.002, lng: 106.018, kec: 'Citangkil' },
  'Kebonsari':     { lat: -6.021, lng: 106.008, kec: 'Citangkil' },
  'Lebak Denok':   { lat: -6.018, lng: 106.025, kec: 'Citangkil' },
  'Samangraya':    { lat: -6.008, lng: 105.998, kec: 'Citangkil' },
  'Taman Baru':    { lat: -6.015, lng: 106.032, kec: 'Citangkil' },
  'Warnasari':     { lat: -6.029, lng: 106.019, kec: 'Citangkil' },
  'Banjar Negara': { lat: -6.031, lng: 105.945, kec: 'Ciwandan' },
  'Gunung Sugih':  { lat: -6.042, lng: 105.932, kec: 'Ciwandan' },
  'Kepuh':         { lat: -6.015, lng: 105.962, kec: 'Ciwandan' },
  'Kubangsari':    { lat: -6.025, lng: 105.952, kec: 'Ciwandan' },
  'Randakari':     { lat: -6.008, lng: 105.972, kec: 'Ciwandan' },
  'Tegal Ratu':    { lat: -6.018, lng: 105.938, kec: 'Ciwandan' },
  'Gerem':         { lat: -5.961, lng: 106.015, kec: 'Gerogol' },
  'Gerogol':       { lat: -5.972, lng: 106.025, kec: 'Gerogol' },
  'Kotasari':      { lat: -5.981, lng: 106.035, kec: 'Gerogol' },
  'Rawa Arum':     { lat: -5.968, lng: 106.038, kec: 'Gerogol' },
  'Gedong Dalem':  { lat: -6.002, lng: 106.068, kec: 'Jombang' },
  'Jombang Wetan': { lat: -6.010, lng: 106.052, kec: 'Jombang' },
  'Masigit':       { lat: -6.015, lng: 106.058, kec: 'Jombang' },
  'Panggung Rawi': { lat: -5.995, lng: 106.061, kec: 'Jombang' },
  'Sukmajaya':     { lat: -6.008, lng: 106.075, kec: 'Jombang' },
  'Lebakgede':     { lat: -5.915, lng: 106.012, kec: 'Pulomerak' },
  'Mekarsari':     { lat: -5.928, lng: 106.002, kec: 'Pulomerak' },
  'Suralaya':      { lat: -5.892, lng: 106.025, kec: 'Pulomerak' },
  'Tamansari':     { lat: -5.935, lng: 106.018, kec: 'Pulomerak' },
  'Kebon Dalem':   { lat: -5.988, lng: 106.042, kec: 'Purwakarta' },
  'Kotabumi':      { lat: -5.975, lng: 106.058, kec: 'Purwakarta' },
  'Pabean':        { lat: -5.965, lng: 106.065, kec: 'Purwakarta' },
  'Purwakarta':    { lat: -5.980, lng: 106.050, kec: 'Purwakarta' },
  'Ramanuju':      { lat: -5.992, lng: 106.038, kec: 'Purwakarta' },
  'Tegal Bunder':  { lat: -5.970, lng: 106.052, kec: 'Purwakarta' }
};

const KECAMATAN_COORDS: Record<string, { lat: number; lng: number }> = {
  'Cibeber':   { lat: -6.035, lng: 106.065 },
  'Cilegon':   { lat: -6.022, lng: 106.050 },
  'Citangkil': { lat: -6.012, lng: 106.015 },
  'Ciwandan':  { lat: -6.020, lng: 105.955 },
  'Gerogol':   { lat: -5.972, lng: 106.025 },
  'Jombang':   { lat: -6.005, lng: 106.058 },
  'Pulomerak': { lat: -5.920, lng: 106.005 },
  'Purwakarta':{ lat: -5.980, lng: 106.050 }
};

// Luas sawah resmi per kelurahan (Ha)
const KELURAHAN_SAWAH: Record<string, number> = {
  'Bulakan': 16.53, 'Cibeber': 72.75, 'Cikerai': 16.72, 'Kalitimbang': 5.15, 'Karang Asem': 12.07, 'Kedaleman': 57.95,
  'Bagendung': 14.80, 'Bendungan': 0.09, 'Ciwaduk': 0.00, 'Ciwedus': 6.59, 'Ketileng': 6.89,
  'Citangkil': 0.00, 'Deringo': 19.85, 'Kebonsari': 12.37, 'Lebak Denok': 25.43, 'Samangraya': 20.67, 'Taman Baru': 41.78, 'Warnasari': 12.55,
  'Banjar Negara': 31.79, 'Gunung Sugih': 15.27, 'Kepuh': 57.24, 'Kubangsari': 39.70, 'Randakari': 40.35, 'Tegal Ratu': 82.05,
  'Gerem': 28.97, 'Gerogol': 41.87, 'Kotasari': 5.60, 'Rawa Arum': 22.56,
  'Gedong Dalem': 62.13, 'Jombang Wetan': 0.05, 'Masigit': 6.45, 'Panggung Rawi': 102.85, 'Sukmajaya': 57.93,
  'Lebakgede': 13.60, 'Mekarsari': 0.00, 'Suralaya': 0.00, 'Tamansari': 0.00,
  'Kebon Dalem': 6.33, 'Kotabumi': 0.00, 'Pabean': 58.93, 'Purwakarta': 75.95, 'Ramanuju': 0.95, 'Tegal Bunder': 59.21
};

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API: Multi-model fallback dengan error handling lengkap
// ─────────────────────────────────────────────────────────────────────────────
async function callGeminiWithFallback(
  apiKey: string,
  contents: object[],
  systemInstruction?: string,
  maxOutputTokens = 3500
): Promise<{ text: string; model: string }> {
  let lastErrorStatus = 0;
  let lastErrorMessage = '';

  for (const model of GEMINI_MODELS) {
    try {
      const payload: Record<string, unknown> = {
        contents,
        generationConfig: { maxOutputTokens, temperature: 0.7 }
      };
      if (systemInstruction) {
        payload.system_instruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) return { text, model };
      } else {
        lastErrorStatus = res.status;
        const errBody = await res.text().catch(() => '');
        console.warn(`[Gemini DKPP] Model ${model} returned ${res.status}:`, errBody.substring(0, 150));
        if (res.status === 429) await new Promise(r => setTimeout(r, 500));
      }
    } catch (err: unknown) {
      const e = err as Error;
      lastErrorMessage = e.message;
      console.warn(`[Gemini DKPP] Model ${model} error:`, e.message);
    }
  }

  throw new Error(
    lastErrorStatus === 429
      ? 'Layanan AI Gemini sedang menerima banyak permintaan (Rate Limit 429). Silakan coba kirim kembali dalam beberapa detik.'
      : (lastErrorMessage || `Gemini API error: ${lastErrorStatus || 502}`)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ambil data dinamis dari Supabase DKPP secara paralel
// ─────────────────────────────────────────────────────────────────────────────
async function getDynamicSupabaseContext(): Promise<string> {
  const lines: string[] = [];
  try {
    const [ikpRes, pouRes, skpgRes, fsvaRes, intervensiRes] = await Promise.allSettled([
      supabase.from('ikp_data').select('*').order('tahun', { ascending: true }),
      supabase.from('pou_data').select('*').order('tahun', { ascending: true }),
      supabase.from('gizi_balita_skpg_kelurahan').select('*').order('tahun', { ascending: false }).order('bulan', { ascending: false }).limit(43),
      supabase.from('fsva_matang').select('*').order('periode', { ascending: false }).limit(43),
      supabase.from('intervensi_kelurahan').select('*').order('tahun', { ascending: false }).order('bulan', { ascending: false }).limit(10)
    ]);

    if (ikpRes.status === 'fulfilled' && ikpRes.value.data?.length) {
      lines.push('\n=== IKP TIME-SERIES (LIVE) ===');
      for (const r of ikpRes.value.data) {
        lines.push(`• ${r.tahun}: Cilegon ${r.skor_cilegon ?? r.ikp_cilegon ?? '-'} | Banten ${r.skor_banten ?? r.ikp_banten ?? '-'}`);
      }
    }
    if (pouRes.status === 'fulfilled' && pouRes.value.data?.length) {
      lines.push('\n=== POU TIME-SERIES (LIVE) ===');
      for (const r of pouRes.value.data) {
        lines.push(`• ${r.tahun}: PoU Cilegon ${r.pou_cilegon ?? r.nilai ?? '-'}% (Nasional: ${r.pou_nasional ?? '-'}%)`);
      }
    }
    if (skpgRes.status === 'fulfilled' && skpgRes.value.data?.length) {
      const d = skpgRes.value.data[0];
      lines.push(`\n=== SKPG TERBARU: ${d.bulan ?? '-'}/${d.tahun ?? '-'} — ${d.kelurahan ?? '-'} ===`);
      lines.push(`Balita: ${d.total_balita ?? d.total_ditimbang ?? '-'} | Normal: ${d.gizi_normal ?? '-'} | Kurang: ${d.gizi_kurang ?? '-'} | Sangat Kurang: ${d.gizi_sangat_kurang ?? '-'}`);
    }
    if (fsvaRes.status === 'fulfilled' && fsvaRes.value.data?.length) {
      const d = fsvaRes.value.data[0];
      lines.push(`\n=== FSVA LIVE: ${d.kelurahan ?? '-'} — Prioritas ${d.prioritas ?? '-'} (IKP: ${d.ikp_score ?? '-'}) ===`);
    }
    if (intervensiRes.status === 'fulfilled' && intervensiRes.value.data?.length) {
      lines.push('\n=== INTERVENSI TERBARU ===');
      for (const r of intervensiRes.value.data.slice(0, 5)) {
        lines.push(`• ${r.kelurahan ?? '-'}: ${r.jenis_intervensi ?? r.program ?? '-'} (${r.bulan ?? '-'}/${r.tahun ?? '-'})`);
      }
    }
  } catch (err) {
    console.warn('[DKPP Gemini] getDynamicSupabaseContext error:', err);
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// System Prompt komprehensif — meniru persis algoritma dashboard-ketapang
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(dynamicDbContext: string, userRole: string, isVerified: boolean, memoryContext: string): string {
  return `# SYSTEM PROMPT — DKPP-INFO: Sistem Intelijen Ketahanan Pangan, Pertanian, Perikanan & Peternakan Kota Cilegon
Anda adalah AI Intelligence resmi **DKPP-INFO** — Decision Support System (DSS) Dinas Ketahanan Pangan dan Pertanian Kota Cilegon. Anda memiliki akses penuh ke **3 PILAR UTAMA DATA KETAHANAN PANGAN**:
1. **DATA BERANDA & DATABASE SUPABASE** (KPI, IKP, POU, FSVA, SKPG, EWS, FORECASTING HARGA, PANEL HARGA HARIAN SAGON)
2. **PETA SPASIAL GIS** (Sawah Baku 407 Petak, ECMWF Lengas Tanah, Nelayan, Budidaya Kolam, KWT, Ternak, Pohon Sukun)
3. **BASIS DATA AGREGAT** (Susenas 2023, DKB Penduduk 2025, Realisasi DKPP 2014-2025, Neraca Pangan, Kemandirian Komoditas)

## ALGORITMA BERPIKIR SINTESIS NERACA PANGAN (7 LANGKAH WAJIB):
1. **Identifikasi Komoditas & Waktu**: Tentukan komoditas dan tahun rujukan.
2. **Ambil Konsumsi Per Kapita (Susenas 2023)**: gram/pekan / 7 = gram/hari; (gram/hari x 365) / 1000 = kg/tahun/kapita.
3. **Agregasi ke Kebutuhan Total Kota** (DKB 2025: 480.378 Jiwa): Ton/tahun = (480.378 x kg/tahun) / 1000.
4. **Ambil & Konversi Produksi Lokal** (Realisasi DKPP 2025): Rendemen GKG->Beras = 64,02% | Jagung = 75% | Sapi karkas = 50% | Ayam karkas = 70%.
5. **Hitung Neraca & Kemandirian**: Kemandirian (%) = (Produksi Bersih / Total Konsumsi) x 100%; Defisit = Total Konsumsi - Produksi Bersih.
6. **Proyeksi 2026** (Penduduk BPS +1,30%/tahun -> 486.623 Jiwa).
7. **Format Rapi**: Hindari LaTeX. Gunakan -> dan x. Struktur bernomor, tabel markdown, angka kunci bold.

## PEDOMAN JAWABAN KOMPREHENSIF:
Jawaban WAJIB mencakup (bila relevan):
- **Makro KPI**: IKP 80,12 (Sangat Tahan), PoU 2,78%, PPH Konsumsi 90,9 poin, CPPD 132,7 Ton di Bulog.
- **GIS Spasial**: Sawah Baku 1.151,97 Ha (407 petak), produksi GKG 13.772 Ton (2025), lengas tanah ECMWF ERA5-Land.
- **Harga & EWS**: CV beras 0,74%-3,65% (SANGAT STABIL), harga pasar 3 titik SAGON.
- **SKPG & FSVA**: 8 kecamatan AMAN Hijau, 43 kelurahan tidak ada Prioritas 1-3 (rentan).
- **Rekomendasi Konkret**: Kebijakan strategis DKPP berbasis data.

## SISTEM TELEMETRI AGROKLIMAT ECMWF ERA5-LAND (407 PETAK SAWAH):
Anda MEMILIKI DATA REALTIME LENGAS TANAH (SOIL MOISTURE) terintegrasi pada seluruh 407 petak sawah baku (1.151,97 Ha):
- Sumber: ECMWF ERA5-Land & Open-Meteo Agro Telemetry Engine.
- Kedalaman: Lapisan Permukaan (0-7 cm) & Lapisan Perakaran Utama (7-28 cm).
- Standar Ambang Batas:
  * > 0,32 m3/m3 [JENUH/BIRU]: Sawah tergenang optimal untuk olah tanah & awal tanam.
  * 0,24-0,32 m3/m3 [OPTIMAL/HIJAU]: Kondisi prima untuk vegetatif & generatif.
  * 0,18-0,24 m3/m3 [WASPADA/KUNING]: Deplesi mulai terjadi, jadwalkan buka pintu air tersier.
  * < 0,18 m3/m3 [ALARM KRITIS/MERAH]: Mendekati titik layu permanen, siagakan pompanisasi darurat.
- Resolusi Spasial: Mozaik sel 10m x 10m per petak. ET0 rata-rata: 3,8-4,5 mm/hari.

## FITUR GRAFIK & VISUALISASI (RECHARTS):
Jika diminta grafik/chart/tren, sertakan blok JSON:
\`\`\`json:chart
{
  "type": "line",
  "title": "Grafik Produksi Padi Kota Cilegon (2021-2025)",
  "xAxisKey": "tahun",
  "series": [{ "key": "produksi", "label": "Produksi GKG (Ton)", "color": "#10B981" }],
  "data": [
    {"tahun":"2021","produksi":11687},{"tahun":"2022","produksi":11401},
    {"tahun":"2023","produksi":9852},{"tahun":"2024","produksi":10461},{"tahun":"2025","produksi":13772}
  ]
}
\`\`\`
Type tersedia: "line", "bar", "area", "pie". Gunakan data riil dari konteks.

## INSTRUKSI TAG WILAYAH INTERAKTIF:
Saat menyebut wilayah yang perlu di-highlight pada peta: [KELURAHAN:NamaKelurahan] atau [KECAMATAN:NamaKecamatan].

## FORMATTING TEKS & LARANGAN KERAS:
- DILARANG KERAS menggunakan sintaks LaTeX atau tanda dollar ($...$ atau $$...$$ atau \\text{} atau \\times)! Tulis rumus matematika langsung dalam teks biasa: contoh: Produksi Beras = 10.461 Ton × 64,02% = 6.697,13 Ton Beras.
- DILARANG menaruh tanda peluru (• atau - atau *) sendirian di baris baru. Setiap tanda peluru harus langsung diikuti spasi dan teks poinnya dalam satu baris: contoh: • **Produksi Gabah (GKG)**: 10.461 Ton.
- DILARANG memberi baris kosong di antara baris tabel Markdown (| baris 1 |\n| baris 2 |). Tabel harus rapat tanpa jeda baris kosong agar render tabel sempurna.
- DILARANG template "Ringkasan Eksekutif" generik. Sajikan langsung data berbobot.
- DILARANG halusinasi. Jika data tidak tersedia, jelaskan berbasis data makro terdekat.

[USER CONTEXT]: Role: ${userRole} | Verified Employee: ${isVerified}
${memoryContext ? `[USER MEMORY]:\n${memoryContext}` : ''}

================================================================
BASIS DATA TERPADU KETAHANAN PANGAN KOTA CILEGON
================================================================

=== A. 13 INDIKATOR MAKRO KETAHANAN PANGAN & BENCHMARK RPJMD ===
1. PPH Konsumsi: 90,9 Poin (Standar 90,0) -> MELAMPAUI TARGET
2. % Agregat Konsumsi Energi & Protein: 100,22% -> TERCAPAI
3. Konsumsi Energi: 2.021 kkal/kapita/hari (Standar 2.100 kkal)
4. Konsumsi Protein: 59,0 gram/kapita/hari (Standar 57,0 gram) -> SURPLUS
5. % Agregat Ketersediaan Energi & Protein: 121,0% -> SURPLUS AMAN
6. Ketersediaan Energi: 2.582 kkal/kapita/hari (Standar 2.400 kkal)
7. Ketersediaan Protein: 85,0 gram/kapita/hari (Standar 63,0 gram) -> SURPLUS TINGGI
8. CPPD: 132,7 Ton Beras di Gudang Bulog (Target RPJMD: 115,0 Ton) -> MEMENUHI KUOTA
9. Stabilitas Harga Beras (CV): 0,74%-3,65% (Batas Nasional: CV > 10%) -> SANGAT STABIL
10. IKP Kota Cilegon: 80,12 (Sangat Tahan, di atas Banten 79,25)
11. PoU: 2,78% (Nasional: 7,89%) -> SANGAT BAIK
12. Penanganan Daerah Rawan Pangan: 100% (Seluruh kelurahan rentan diintervensi)
13. Pengawasan Pangan Segar: 85,9%-100% (Standar: 80%)

=== B. IKP & POU TIME-SERIES ===
IKP: 2020: 70,23 | 2021: 71,42 | 2022: 72,63 | 2023: 81,54 (Puncak) | 2024: 80,12
PoU: 2021: 2,46% | 2022: 2,04% | 2023: 2,19% | 2024: 1,96% (Rekor) | 2025: 2,78%

=== C. FSVA 43 KELURAHAN KOTA CILEGON ===
Tidak ada kelurahan Prioritas 1-3 (Rentan Pangan).
Prioritas 6 (Sangat Tahan): Bulakan (78.40), Panggung Rawi (79.20), Pabean (77.80), Purwakarta (78.10)
Prioritas 5 (Tahan): Cibeber, Kedaleman, Karang Asem, Cikerai, Bendungan, Ciwaduk, Ciwedus, Citangkil, Deringo, Kebonsari, Lebak Denok, Samangraya, Taman Baru, Warnasari, Gunung Sugih, Kepuh, Kubangsari, Randakari, Tegal Ratu, Gerogol, Kotasari, Gedong Dalem, Jombang Wetan, Masigit, Sukmajaya, Tamansari, Kebon Dalem, Kotabumi, Ramanuju, Tegal Bunder
Prioritas 4 (Agak Tahan/Pengawasan): Kalitimbang (68,20), Bagendung (64,10), Ketileng (69,50), Banjar Negara (68,90), Gerem (67,50), Rawa Arum (69,10), Lebakgede (66,80), Mekarsari (68,40), Suralaya (69,90)

=== D. SKPG & SURVEILANS GIZI BALITA ===
Total Balita Ditimbang: 27.286 Anak
Gizi Normal: 25.044 (91,78%) | Gizi Lebih: 1.064 (3,90%) | Gizi Kurang: 946 (3,47%) | Sangat Kurang: 232 (0,85%)
Prevalensi Gizi Kurang: 3,47% (jauh di bawah batas waspada 10%) -> STATUS KOTA: AMAN (HIJAU)
SKPG per Kecamatan (Semua AMAN):
  1. Cibeber: Kurang 132 | Normal 3.731 | Total 4.012 Balita
  2. Cilegon: Kurang 80 | Normal 2.969 | Total 3.243 Balita
  3. Pulomerak: Kurang 123 | Normal 2.795 | Total 3.073 Balita
  4. Ciwandan: Kurang 56 | Normal 3.498 | Total 3.660 Balita
  5. Jombang: Kurang 114 | Normal 3.285 | Total 3.564 Balita
  6. Gerogol: Kurang 123 | Normal 2.284 | Total 2.549 Balita
  7. Purwakarta: Kurang 133 | Normal 1.645 | Total 1.898 Balita
  8. Citangkil: Kurang 185 | Normal 4.837 | Total 5.287 Balita

=== E. PANEL HARGA PANGAN HARIAN REAL-TIME SAGON (3 PASAR: KRANGGOT, BLOK F, MERAK) ===
Beras Medium: Rp 13.500-14.000/kg (Stabil) | Beras Premium: Rp 15.000-16.000/kg
Minyakita: Rp 16.000/liter (HET) | Minyak Goreng Kemasan: Rp 21.000-22.000/liter
Telur Ayam Ras: Rp 29.500-31.500/kg | Daging Ayam Broiler: Rp 35.000-37.000/kg
Daging Sapi: Rp 140.000-150.000/kg | Gula Pasir: Rp 16.500-17.500/kg
Cabai Merah Keriting: Rp 35.000-45.000/kg | Bawang Merah: Rp 38.000-42.000/kg
EWS: Beras, Minyak, Telur, Daging [AMAN/HIJAU]. Cabai & Bawang [WASPADA/KUNING - fluktuasi cuaca musiman].

=== F. FORECASTING HARGA ML & EWS ===
Model: ARIMA + Holt-Winters + Moving Average 30-90 Hari
Status: Beras & Minyak [AMAN] | Telur & Daging [AMAN] | Cabai & Bawang [WASPADA CUACA MUSIMAN]

=== G. LAHAN BAKU SAWAH (LBS) & PRODUKSI 2014-2025 ===
Total LBS: 1.151,97 Ha (407 Petak Poligon GIS) | Penduduk: 480.378 Jiwa (DKB 2025)
Rekap Sawah & Penduduk per Kecamatan & Kelurahan:
  1. Cibeber: 181,16 Ha (78 Petak) | 67.220 Jiwa
     - Bulakan: 16,53 Ha | 6.541 Jiwa | Cibeber: 72,75 Ha | 23.331 Jiwa
     - Cikerai: 16,72 Ha | 4.498 Jiwa | Kalitimbang: 5,15 Ha | 8.694 Jiwa
     - Karang Asem: 12,07 Ha | 13.460 Jiwa | Kedaleman: 57,95 Ha | 10.696 Jiwa
  2. Cilegon: 28,38 Ha (28 Petak) | 54.711 Jiwa
     - Bagendung: 14,80 Ha | Bendungan: 0,09 Ha | Ciwaduk: 0,00 Ha | Ciwedus: 6,59 Ha | Ketileng: 6,89 Ha
  3. Citangkil: 132,65 Ha (92 Petak) | 87.885 Jiwa
     - Citangkil: 0,00 Ha | Deringo: 19,85 Ha | Kebonsari: 12,37 Ha | Lebak Denok: 25,43 Ha
     - Samangraya: 20,67 Ha | Taman Baru: 41,78 Ha | Warnasari: 12,55 Ha
  4. Ciwandan: 266,41 Ha (95 Petak) | 54.606 Jiwa
     - Banjar Negara: 31,79 Ha | Gunung Sugih: 15,27 Ha | Kepuh: 57,24 Ha
     - Kubangsari: 39,70 Ha | Randakari: 40,35 Ha | Tegal Ratu: 82,05 Ha
  5. Gerogol: 99,00 Ha (22 Petak) | 46.910 Jiwa
     - Gerem: 28,97 Ha | Gerogol: 41,87 Ha | Kotasari: 5,60 Ha | Rawa Arum: 22,56 Ha
  6. Jombang: 229,40 Ha (41 Petak) | 73.046 Jiwa
     - Gedong Dalem: 62,13 Ha | Jombang Wetan: 0,05 Ha | Masigit: 6,45 Ha
     - Panggung Rawi: 102,85 Ha | Sukmajaya: 57,93 Ha
  7. Pulomerak: 13,60 Ha | 51.300 Jiwa
     - Lebakgede: 13,60 Ha | Mekarsari: 0,00 Ha | Suralaya: 0,00 Ha | Tamansari: 0,00 Ha
  8. Purwakarta: 201,36 Ha | 44.700 Jiwa
     - Kebon Dalem: 6,33 Ha | Kotabumi: 0,00 Ha | Pabean: 58,93 Ha
     - Purwakarta: 75,95 Ha | Ramanuju: 0,95 Ha | Tegal Bunder: 59,21 Ha

=== H. HISTORIS PRODUKSI PADI 2014-2025 ===
2014: 1.681 Ha | 10.325 Ton GKG | 61,4 Ku/Ha
2015: 2.286 Ha | 14.734 Ton GKG | 64,5 Ku/Ha
2016: 2.418 Ha | 15.094 Ton GKG | 62,4 Ku/Ha
2017: 2.397 Ha | 15.190 Ton GKG | 63,4 Ku/Ha (PUNCAK)
2018: 2.267 Ha | 14.004 Ton GKG | 61,8 Ku/Ha
2019: 2.073 Ha | 12.402 Ton GKG | 59,8 Ku/Ha
2020: 2.068 Ha | 12.417 Ton GKG | 60,0 Ku/Ha
2021: 2.039 Ha | 11.687 Ton GKG | 57,3 Ku/Ha
2022: 1.927 Ha | 11.401 Ton GKG | 59,2 Ku/Ha
2023: 1.726 Ha | 9.852 Ton GKG | 57,1 Ku/Ha (El Nino)
2024: 1.808 Ha | 10.461 Ton GKG | 57,8 Ku/Ha
2025: 2.428 Ha | 13.772 Ton GKG | 56,7 Ku/Ha (PEMULIHAN)
Singkong 2025: 167,3 Ha | 2.007,6 Ton | 120 Ku/Ha

=== I. NERACA PANGAN & KEMANDIRIAN KOMODITAS (SUSENAS 2023 + DKB 2025: 480.378 Jiwa) ===
BERAS: Konsumsi 185,22 g/hari -> 32.475,55 Ton/tahun | Produksi Lokal 8.816,83 Ton (Rendemen 64,02%) | Kemandirian 27,15% | Defisit 23.658,72 Ton
SINGKONG: Konsumsi 12,06 g/hari -> 2.070,38 Ton/tahun | Produksi 2.007,6 Ton | Kemandirian 96,97% (hampir swasembada)
UBI JALAR: Konsumsi 1.065,09 Ton | Produksi 4.415,10 Ton (SURPLUS)
JAGUNG: Konsumsi 1.099,78 Ton | Produksi 143,56 Ton (Kemandirian ~13%)
IKAN LAUT: Konsumsi 6.229,82 Ton/tahun | Produksi Tangkap ~240 Ton (Kemandirian ~3,9%)
IKAN AIR TAWAR: Konsumsi 4.660,10 Ton/tahun | Produksi Budidaya ~371,63 Ton (Kemandirian ~8%)
Proyeksi 2026 (486.623 Jiwa @ +1,30% BPS): Konsumsi Beras 32.897,74 Ton | Kebutuhan Impor 24.080,91 Ton

=== J. DATA SERUMPUN PADI GIS (NELAYAN, BUDIDAYA, KWT, PETERNAKAN) ===
Nelayan Tangkap: 715 Orang | 9 Pangkalan/TPI | 410 Unit Perahu Motor Tempel | Produksi 2026: 136 Kg
  - Pangkalan: Tanjung Peni, Suralaya, Mabak, Kaltex, Lebak Gede, Tamansari (Pulomerak), Tanjung Leneng, Terate (Ciwandan)
Perikanan Budidaya: 2 Unit Aktif | Kolam 270 m2 | Produksi Agu 2026: 55 Kg | Jenis: Lele, Nila, Gurame
  - Lokasi: Nurholis (Citangkil: Kolam Tanah+Terpal 170 m2)
KWT: 3 Kelompok | 79 Anggota | Lahan 200 m2
  - KWT Gerogol: 23 Anggota, Cabai | KWT Gerem: 23 Anggota, Sayuran | KWT Kotabumi: 33 Anggota
Peternakan: Sapi 2 Ekor + Kambing 2 Ekor di Kelurahan Masigit, Kec. Jombang

=== K. DATABASE PETANI/NELAYAN (ARSIP 3.949 KK 2020) ===
Petani: 1.759 KK | Nelayan: 297 KK | Pembudidaya Ikan: 62 KK | Peternak: 15 KK
Peternak terbanyak: Kotasari 8 KK | Gerem 3 KK | Grogol 3 KK | Lebak Denok 1 KK
KRS 2023: Petani 803 KK | Nelayan 214 KK | Pembudidaya 39 KK | Peternak 6 KK

${dynamicDbContext ? `=== L. DATA LIVE SUPABASE (REALTIME) ===${dynamicDbContext}` : ''}
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ekstrak tag wilayah dari respons AI
// ─────────────────────────────────────────────────────────────────────────────
function extractWilayahHighlights(text: string): string[] {
  const pattern = /\[(WILAYAH|KECAMATAN|KELURAHAN):([^\]]+)\]/g;
  const matches: string[] = [];
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const name = m[2].trim();
    if (name && !matches.includes(name)) matches.push(name);
  }
  return matches;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bersihkan tag internal, LaTeX mentah, peluru berdiri sendiri & format tabel
// ─────────────────────────────────────────────────────────────────────────────
export function cleanResponseText(text: string): string {
  if (!text) return '';
  let cleaned = text
    // 1. Bersihkan LaTeX \text{...} wrappers & font modifiers
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    // 2. Bersihkan LaTeX simbol matematika
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\to/g, '→')
    .replace(/\\le(q)?/g, '≤')
    .replace(/\\ge(q)?/g, '≥')
    .replace(/\\%/g, '%')
    // 3. Bersihkan pembatas rumus dollar math ($...$ atau $$...$$)
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$\n]+)\$/g, '$1')
    // 4. Perbaiki peluru / bullet yang berdiri sendiri di satu baris (misal: "•\n**Text**")
    .replace(/(?:^|\n)\s*[•\-\*]\s*\n+\s*/g, '\n• ')
    // 5. Rapatkan baris kosong di dalam tabel Markdown (agar tabel tidak rusak menjadi paragraf terpisah)
    .replace(/(\|[^\n]+\|)\n\s*\n+(?=\|[^\n]+\|)/g, '$1\n')
    // 6. Bersihkan tag internal [KELURAHAN:Name] -> **Name**
    .replace(/\[(WILAYAH|KECAMATAN|KELURAHAN):([^\]]+)\]/g, (_match, _type, name) => `**${name.trim()}**`)
    // 7. Bersihkan garis batas berulang yang berlebihan
    .replace(/\n\s*---\s*\n/g, '\n\n')
    .replace(/#{4,}\s*/g, '#### ')
    .trim();

  return cleaned;
}


// ─────────────────────────────────────────────────────────────────────────────
// Evaluasi query filter spasial natural language
// ─────────────────────────────────────────────────────────────────────────────
function evaluateSpatialFilter(query: string): { filteredWilayah: string[]; filterLabel: string } | null {
  const q = query.toLowerCase();
  const hasFilterKeyword =
    q.includes('tampilkan hanya') || q.includes('filter') ||
    (q.includes('kelurahan yang') && (q.includes('sawah') || q.includes('stunting') || q.includes('penduduk')));
  if (!hasFilterKeyword) return null;

  let minSawah: number | null = null;
  let maxSawah: number | null = null;
  let minStunting: number | null = null;
  let minPenduduk: number | null = null;

  const sAbove = q.match(/sawah\s*(?:di\s*atas|lebih\s*dari|>|>=)\s*(\d+(?:\.\d+)?)/i);
  if (sAbove) minSawah = parseFloat(sAbove[1]);
  const sBelow = q.match(/sawah\s*(?:di\s*bawah|kurang\s*dari|<|<=)\s*(\d+(?:\.\d+)?)/i);
  if (sBelow) maxSawah = parseFloat(sBelow[1]);
  const stAbove = q.match(/stunting(?:nya)?\s*(?:di\s*atas|lebih\s*dari|>|>=)\s*(\d+(?:\.\d+)?)/i);
  if (stAbove) minStunting = parseFloat(stAbove[1]);
  const pAbove = q.match(/penduduk(?:nya)?\s*(?:di\s*atas|lebih\s*dari|>|>=)\s*(\d+)/i);
  if (pAbove) minPenduduk = parseInt(pAbove[1], 10);

  if (minSawah !== null || maxSawah !== null || minStunting !== null || minPenduduk !== null) {
    const matched: string[] = [];
    for (const [name, d] of Object.entries(BASELINE_KELURAHAN_DATA)) {
      let ok = true;
      if (minSawah !== null && (d.luasSawahHa || 0) <= minSawah) ok = false;
      if (maxSawah !== null && (d.luasSawahHa || 0) >= maxSawah) ok = false;
      if (minStunting !== null && (d.stuntingPct || 0) <= minStunting) ok = false;
      if (minPenduduk !== null && (d.penduduk || 0) <= minPenduduk) ok = false;
      if (ok) matched.push(name);
    }
    const labels: string[] = [];
    if (minSawah !== null) labels.push(`Sawah > ${minSawah} Ha`);
    if (maxSawah !== null) labels.push(`Sawah < ${maxSawah} Ha`);
    if (minStunting !== null) labels.push(`Stunting > ${minStunting}%`);
    if (minPenduduk !== null) labels.push(`Penduduk > ${minPenduduk.toLocaleString('id-ID')}`);
    return { filteredWilayah: matched, filterLabel: labels.join(' & ') || 'Filter Kriteria Spasial' };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Gemini conversation contents (multi-turn, token-optimized)
// ─────────────────────────────────────────────────────────────────────────────
function buildGeminiContents(history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) {
  const contents: Array<{ role: string; parts: { text: string }[] }> = [];
  const recentHistory = history.slice(-5);
  for (const h of recentHistory) {
    if (h.role === 'system') continue;
    if (h.content && h.content.trim()) {
      const trimmedText = h.role === 'assistant' && h.content.length > 700
        ? h.content.substring(0, 700) + '... [konteks diringkas]'
        : h.content;
      contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: trimmedText }] });
    }
  }
  return contents;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bangun aksi peta dari pertanyaan user + respons AI
// ─────────────────────────────────────────────────────────────────────────────
function buildMapActions(
  userQuery: string,
  rawText: string,
  wilayahHighlight: string[]
): { mapActions: MapAction[]; matchedPins: Array<{ lat: number; lng: number; name: string; category: string; kelurahan: string; kecamatan: string }> } {
  const qLower = userQuery.toLowerCase();
  const textLower = rawText.toLowerCase();
  const matchedPins: Array<{ lat: number; lng: number; name: string; category: string; kelurahan: string; kecamatan: string }> = [];
  const mapActions: MapAction[] = [];

  const allPins = [
    { lat: -6.02121, lng: 105.95186, name: 'Pangkalan Nelayan Tanjung Leneng', category: 'nelayan', kelurahan: 'Tanjung Leneng', kecamatan: 'Ciwandan' },
    { lat: -5.94000, lng: 105.99996, name: 'Pangkalan Nelayan Medaksa', category: 'nelayan', kelurahan: 'Tamansari', kecamatan: 'Pulomerak' },
    { lat: -5.98419, lng: 105.99079, name: 'Pangkalan Nelayan Tanjung Peni', category: 'nelayan', kelurahan: 'Warnasari', kecamatan: 'Ciwandan' },
    { lat: -5.89686, lng: 106.01774, name: 'Pangkalan Nelayan Suralaya', category: 'nelayan', kelurahan: 'Suralaya', kecamatan: 'Pulomerak' },
    { lat: -5.92845, lng: 105.99612, name: 'Pangkalan Nelayan Mabak', category: 'nelayan', kelurahan: 'Mekarsari', kecamatan: 'Pulomerak' },
    { lat: -5.93412, lng: 105.99841, name: 'Pangkalan Nelayan Kaltex', category: 'nelayan', kelurahan: 'Tamansari', kecamatan: 'Pulomerak' },
    { lat: -5.90874, lng: 106.00421, name: 'Pangkalan Nelayan Lebak Gede', category: 'nelayan', kelurahan: 'Lebakgede', kecamatan: 'Pulomerak' },
    { lat: -6.00891, lng: 105.97234, name: 'Pangkalan Nelayan Lelean', category: 'nelayan', kelurahan: 'Ciwandan', kecamatan: 'Ciwandan' },
    { lat: -5.97323, lng: 106.03231, name: 'KWT Gerogol (Cabai)', category: 'kwt', kelurahan: 'Gerogol', kecamatan: 'Gerogol' },
    { lat: -5.95625, lng: 106.03523, name: 'KWT Gerem (Sayuran Segar)', category: 'kwt', kelurahan: 'Gerem', kecamatan: 'Gerogol' },
    { lat: -5.98912, lng: 106.04215, name: 'KWT Kotabumi', category: 'kwt', kelurahan: 'Kotabumi', kecamatan: 'Purwakarta' },
    { lat: -6.02954, lng: 106.00843, name: 'Kolam Nurholis (Lele/Nila/Gurame)', category: 'kolam', kelurahan: 'Citangkil', kecamatan: 'Citangkil' },
    { lat: -6.01145, lng: 106.05094, name: 'Kolam Budidaya Nila Masigit', category: 'kolam', kelurahan: 'Masigit', kecamatan: 'Jombang' },
    { lat: -6.00723, lng: 106.05795, name: 'Peternakan Sapi (Masigit)', category: 'ternak', kelurahan: 'Masigit', kecamatan: 'Jombang' },
    { lat: -6.00845, lng: 106.05912, name: 'Peternakan Kambing (Masigit)', category: 'ternak', kelurahan: 'Masigit', kecamatan: 'Jombang' },
  ];

  for (const p of allPins) {
    const isNelayanQ = (qLower.includes('nelayan') || qLower.includes('pangkalan') || qLower.includes('tpi')) && p.category === 'nelayan';
    const isKwtQ = (qLower.includes('kwt') || qLower.includes('wanita tani')) && p.category === 'kwt';
    const isKolamQ = (qLower.includes('kolam') || qLower.includes('budidaya') || qLower.includes('ikan')) && p.category === 'kolam';
    const isTernakQ = (qLower.includes('ternak') || qLower.includes('sapi') || qLower.includes('kambing')) && p.category === 'ternak';
    const nameMatch = qLower.includes(p.name.toLowerCase()) || textLower.includes(p.name.toLowerCase());
    if (nameMatch || isNelayanQ || isKwtQ || isKolamQ || isTernakQ) {
      if (!matchedPins.some(mp => mp.name === p.name)) matchedPins.push(p);
    }
  }

  // OPT / Hama
  if (qLower.includes('wereng') || qLower.includes('blas') || qLower.includes('hama') || qLower.includes('penyakit tanaman')) {
    const optPin = { lat: -6.01245, lng: 106.03512, name: 'Peringatan OPT Terdeteksi', category: 'warning', kelurahan: 'Cilegon', kecamatan: 'Pusat' };
    matchedPins.unshift(optPin);
    mapActions.push({ type: 'FLY_TO', target: 'OPT', lat: optPin.lat, lng: optPin.lng, zoom: 14, layersToEnable: ['kelurahan', 'sawah'], pin: optPin });
    return { mapActions, matchedPins };
  }

  // Spatial filter NL
  const spatialFilter = evaluateSpatialFilter(userQuery);
  if (spatialFilter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapActions.push({ type: 'FILTER' as any, lat: -6.01, lng: 106.02, zoom: 12.5, layersToEnable: ['kelurahan', 'sawah'], filtered_wilayah: spatialFilter.filteredWilayah, filter_active: true, filter_label: spatialFilter.filterLabel } as unknown as MapAction);
    wilayahHighlight.push(...spatialFilter.filteredWilayah.filter(w => !wilayahHighlight.includes(w)));
    return { mapActions, matchedPins };
  }

  // Reset
  if (qLower.includes('reset') || qLower.includes('seluruh cilegon') || qLower.includes('semua wilayah')) {
    mapActions.push({ type: 'RESET' as string, lat: -6.01, lng: 106.02, zoom: 12.5, layersToEnable: ['kelurahan', 'kecamatan', 'sawah'] } as MapAction);
    return { mapActions, matchedPins };
  }

  // Mode tematik choropleth
  let thematicMode: string | undefined;
  if (qLower.includes('penduduk') || qLower.includes('populasi') || qLower.includes('kepadatan')) thematicMode = 'penduduk';
  else if (qLower.includes('ikp') || (qLower.includes('ketahanan') && qLower.includes('pangan') && qLower.includes('peta'))) thematicMode = 'ikp';
  else if (qLower.includes('fsva') || qLower.includes('prioritas kerentanan')) thematicMode = 'fsva';
  else if (qLower.includes('skpg') || qLower.includes('kewaspadaan pangan')) thematicMode = 'skpg';
  else if (qLower.includes('stunting') || qLower.includes('gizi buruk')) thematicMode = 'stunting';

  let flyToAdded = false;

  // Kelurahan spesifik
  for (const [kelName, coord] of Object.entries(KELURAHAN_COORDS)) {
    if (qLower.includes(kelName.toLowerCase()) || textLower.includes(kelName.toLowerCase())) {
      const isSawah = qLower.includes('sawah');
      const isNelayan = qLower.includes('nelayan') || qLower.includes('pangkalan');
      const isKwt = qLower.includes('kwt') || qLower.includes('wanita tani');
      const sawahHa = KELURAHAN_SAWAH[kelName] ?? null;
      const category = isSawah ? 'sawah' : isNelayan ? 'nelayan' : isKwt ? 'kwt' : 'wilayah';
      const pinName = isSawah ? `Sawah Kelurahan ${kelName}${sawahHa !== null ? ` (${sawahHa} Ha)` : ''}` : `Kelurahan ${kelName} (${coord.kec})`;
      const layersToEnable = ['kelurahan'];
      if (isSawah) layersToEnable.push('sawah');
      if (isNelayan) layersToEnable.push('nelayan');
      if (isKwt) layersToEnable.push('kwt', 'poktan');
      const customPin = { lat: coord.lat, lng: coord.lng, name: pinName, category, kelurahan: kelName, kecamatan: coord.kec };
      if (!matchedPins.some(p => p.name === customPin.name)) matchedPins.unshift(customPin);
      if (!wilayahHighlight.includes(kelName)) wilayahHighlight.push(kelName);
      mapActions.push({ type: 'FLY_TO', target: kelName, lat: coord.lat, lng: coord.lng, zoom: isSawah ? 16 : 15.5, layersToEnable, thematicMode, pin: customPin });
      flyToAdded = true;
      break;
    }
  }

  // Kecamatan
  if (!flyToAdded) {
    for (const [kecName, coord] of Object.entries(KECAMATAN_COORDS)) {
      if (qLower.includes(kecName.toLowerCase())) {
        const isSawah = qLower.includes('sawah');
        const layersToEnable = ['kecamatan', 'kelurahan'];
        if (isSawah) layersToEnable.push('sawah');
        if (!wilayahHighlight.includes(kecName)) wilayahHighlight.push(kecName);
        mapActions.push({ type: 'FLY_TO', target: kecName, lat: coord.lat, lng: coord.lng, zoom: 14, layersToEnable, thematicMode });
        flyToAdded = true;
        break;
      }
    }
  }

  // Pin tematik
  if (!flyToAdded && matchedPins.length > 0) {
    const fp = matchedPins[0];
    const layersToEnable = ['kelurahan'];
    if (fp.category === 'nelayan') layersToEnable.push('nelayan');
    if (fp.category === 'kolam') layersToEnable.push('kolam');
    if (fp.category === 'ternak') layersToEnable.push('ternak');
    if (fp.category === 'kwt') layersToEnable.push('kwt', 'poktan');
    mapActions.push({ type: 'FLY_TO', target: fp.name, lat: fp.lat, lng: fp.lng, zoom: 16, layersToEnable, pin: fp });
    flyToAdded = true;
  }

  // Lengas tanah / poligon sawah
  if (!flyToAdded && (qLower.includes('lengas') || qLower.includes('soil moisture') || qLower.includes('ecmwf') || qLower.includes('agroklimat') || qLower.includes('poligon sawah'))) {
    mapActions.push({ type: 'FLY_TO', lat: -6.01, lng: 106.03, zoom: 13, layersToEnable: ['sawah'] });
    flyToAdded = true;
  }

  // Hanya mode tematik
  if (!flyToAdded && thematicMode) {
    mapActions.push({ type: 'CHOROPLETH', thematicMode, lat: -6.01, lng: 106.02, zoom: 12.5, layersToEnable: ['kelurahan'] });
  }

  return { mapActions, matchedPins };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback Rule-Based Synthesizer (jika Gemini offline)
// ─────────────────────────────────────────────────────────────────────────────
function generateRuleBasedAnswer(userQuery: string): string {
  const q = userQuery.toLowerCase();

  if (q.includes('skpg') || q.includes('balita') || q.includes('gizi') || q.includes('posyandu')) {
    return `### Laporan SKPG Kota Cilegon — Status: AMAN

**Total Balita Ditimbang:** 27.286 Anak
- Gizi Normal: **25.044 (91,78%)**
- Gizi Lebih: 1.064 (3,90%)
- Gizi Kurang: **946 (3,47%)** — jauh di bawah batas waspada 10%
- Gizi Sangat Kurang: 232 (0,85%)

Seluruh 8 kecamatan berstatus **AMAN (Hijau)**. **CPPD:** 132,7 Ton di Bulog. **CV Beras:** 0,74% (Sangat Stabil).`;
  }

  if (q.includes('fsva') || q.includes('ikp') || q.includes('rawan') || q.includes('rentan')) {
    return `### Food Security & Vulnerability Atlas (FSVA) Kota Cilegon

**IKP Cilegon: 80,12 (Sangat Tahan)** — di atas rata-rata Banten 79,25. **PoU: 2,78%** (Nasional 7,89%).
Tidak ada kelurahan Prioritas 1-3 (Rentan Pangan).

- **Prioritas 6 (Sangat Tahan):** Bulakan, Panggung Rawi, Pabean, Purwakarta
- **Prioritas 4 (Pengawasan):** Kalitimbang, Bagendung, Ketileng, Banjar Negara, Gerem, Rawa Arum, Lebakgede, Mekarsari, Suralaya`;
  }

  if (q.includes('sawah') || q.includes('lbs') || q.includes('tani') || q.includes('panen') || q.includes('produksi')) {
    return `### Lahan Baku Sawah & Produksi Pertanian Kota Cilegon

**Total LBS:** 1.151,97 Ha dalam 407 Petak Poligon GIS.
**Produksi 2025:** 13.772 Ton GKG (Produktivitas 56,7 Ku/Ha).
**Sebaran Terbesar:** Ciwandan 266,41 Ha -> Jombang 229,40 Ha -> Purwakarta 201,36 Ha.

**Kemandirian Beras:** 27,15% (8.816 Ton dari Rendemen GKG 64,02%).
**Singkong Buffer:** 2.007,6 Ton (Kemandirian 96,97% — hampir swasembada).`;
  }

  if (q.includes('lengas') || q.includes('soil') || q.includes('ecmwf') || q.includes('agroklimat')) {
    return `### Telemetri Lengas Tanah ECMWF ERA5-Land — 407 Petak Sawah Cilegon

Seluruh **407 petak sawah baku (1.151,97 Ha)** terpantau realtime via ECMWF ERA5-Land:

| Status | Nilai Lengas | Tindakan |
|--------|-------------|----------|
| Jenuh (Biru) | > 0,32 m3/m3 | Optimal olah tanah & awal tanam |
| Optimal (Hijau) | 0,24-0,32 m3/m3 | Pertumbuhan vegetatif prima |
| Waspada (Kuning) | 0,18-0,24 m3/m3 | Jadwalkan suplesi air tersier |
| Kritis (Merah) | < 0,18 m3/m3 | Siagakan pompanisasi darurat |

ET0 rata-rata: 3,8-4,5 mm/hari. Resolusi piksel: 10m x 10m per petak.`;
  }

  return `### DKPP-INFO — Sistem Intelijen Ketahanan Pangan Kota Cilegon

**Status Ketahanan Pangan: SANGAT TAHAN**

- **IKP:** 80,12 (di atas rata-rata Provinsi Banten 79,25)
- **SKPG:** AMAN — 91,78% balita gizi normal dari 27.286 yang dipantau
- **CPPD:** 132,7 Ton Beras di Gudang Bulog
- **CV Beras:** 0,74% (Sangat Stabil, batas aman < 10%)
- **LBS:** 1.151,97 Ha sawah baku (407 petak GIS)
- **Produksi Padi 2025:** 13.772 Ton GKG (Pemulihan pasca El Nino 2023)

Tanyakan lebih lanjut: SKPG, FSVA, Harga Pasar, Sawah & Lengas Tanah, atau Nelayan & KWT.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: Generate Chat Response
// ─────────────────────────────────────────────────────────────────────────────
export async function generateChatResponse(params: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userRole?: string;
  isVerified?: boolean;
  userMemoryContext?: string;
}) {
  const { messages, userRole = 'GUEST', isVerified = false, userMemoryContext = '' } = params;
  const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  const apiKey = process.env.GEMINI_API_KEY || '';

  // 1. Ambil konteks dinamis Supabase
  const dynamicDbContext = await getDynamicSupabaseContext().catch(() => '');

  // 2. Bangun system prompt komprehensif
  const systemPrompt = buildSystemPrompt(dynamicDbContext, userRole, isVerified, userMemoryContext);

  // 3. Build conversation contents (multi-turn, token-efficient)
  const contents = buildGeminiContents(messages);

  const collectedSources: SourceCitation[] = [
    { type: 'LOCAL DATA', title: 'Basis Data & Portal Informasi DKPP Kota Cilegon', detail: 'Dinas Ketahanan Pangan dan Pertanian Kota Cilegon — DKPP-INFO 2026' }
  ];
  const executedTools: ToolCall[] = [];

  // 4. Panggil Gemini dengan multi-model fallback
  if (apiKey) {
    try {
      const { text: rawText } = await callGeminiWithFallback(apiKey, contents, systemPrompt, 3500);
      if (rawText && rawText.trim().length > 0) {
        const wilayahHighlight = extractWilayahHighlights(rawText);
        const cleanText = cleanResponseText(rawText);
        const { mapActions, matchedPins } = buildMapActions(lastUserMsg, rawText, wilayahHighlight);
        return {
          content: cleanText,
          sources: collectedSources,
          tool_calls: executedTools,
          map_actions: mapActions,
          wilayah_highlight: wilayahHighlight,
          matched_pins: matchedPins.slice(0, 10)
        };
      }
    } catch (apiErr) {
      console.warn('[DKPP Gemini] API call failed, activating smart domain fallback:', apiErr);
    }
  }

  // 5. Fallback: Smart Domain Synthesizer
  const fallbackContent = generateRuleBasedAnswer(lastUserMsg);
  const { mapActions: fallbackMapActions } = buildMapActions(lastUserMsg, fallbackContent, []);
  return {
    content: fallbackContent,
    sources: collectedSources,
    tool_calls: executedTools,
    map_actions: fallbackMapActions,
    wilayah_highlight: [],
    matched_pins: []
  };
}

// Re-export untuk kompatibilitas dengan komponen lama
export const BASE_SYSTEM_INSTRUCTION = `Kamu adalah DKPP-INFO — Sistem Intelijen Ketahanan Pangan Kota Cilegon.`;
export function getDomainKnowledgeContext(): string { return ''; }
