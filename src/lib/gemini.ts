import { SourceCitation, MapAction, ToolCall } from '@/types/dkpp';
import fsvaData from './fsva-official-data.json';
import fsvaForm2Data from './fsva-form2-official-data.json';
import { supabase } from './supabase';

// Model chain yang valid dan aktif di Google Gemini API
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

// Koordinat resmi kelurahan Kota Cilegon untuk aksi geospasial
const KELURAHAN_COORDS: Record<string, { lat: number; lng: number; kec: string }> = {
  'Bulakan': { lat: -6.042, lng: 106.071, kec: 'Cibeber' },
  'Cibeber': { lat: -6.035, lng: 106.065, kec: 'Cibeber' },
  'Cikerai': { lat: -6.051, lng: 106.058, kec: 'Cibeber' },
  'Kalitimbang': { lat: -6.030, lng: 106.082, kec: 'Cibeber' },
  'Karang Asem': { lat: -6.028, lng: 106.061, kec: 'Cibeber' },
  'Kedaleman': { lat: -6.039, lng: 106.052, kec: 'Cibeber' },
  'Bagendung': { lat: -6.028, lng: 106.035, kec: 'Cilegon' },
  'Bendungan': { lat: -6.015, lng: 106.051, kec: 'Cilegon' },
  'Ciwaduk': { lat: -6.019, lng: 106.045, kec: 'Cilegon' },
  'Ciwedus': { lat: -6.012, lng: 106.062, kec: 'Cilegon' },
  'Ketileng': { lat: -6.025, lng: 106.058, kec: 'Cilegon' },
  'Citangkil': { lat: -6.012, lng: 106.015, kec: 'Citangkil' },
  'Deringo': { lat: -6.002, lng: 106.018, kec: 'Citangkil' },
  'Kebonsari': { lat: -6.021, lng: 106.008, kec: 'Citangkil' },
  'Lebak Denok': { lat: -6.018, lng: 106.025, kec: 'Citangkil' },
  'Samangraya': { lat: -6.008, lng: 105.998, kec: 'Citangkil' },
  'Taman Baru': { lat: -6.015, lng: 106.032, kec: 'Citangkil' },
  'Warnasari': { lat: -6.029, lng: 106.019, kec: 'Citangkil' },
  'Banjar Negara': { lat: -6.031, lng: 105.945, kec: 'Ciwandan' },
  'Gunung Sugih': { lat: -6.042, lng: 105.932, kec: 'Ciwandan' },
  'Kepuh': { lat: -6.015, lng: 105.962, kec: 'Ciwandan' },
  'Kubangsari': { lat: -6.025, lng: 105.952, kec: 'Ciwandan' },
  'Randakari': { lat: -6.008, lng: 105.972, kec: 'Ciwandan' },
  'Tegal Ratu': { lat: -6.018, lng: 105.938, kec: 'Ciwandan' },
  'Gerem': { lat: -5.961, lng: 106.015, kec: 'Gerogol' },
  'Gerogol': { lat: -5.972, lng: 106.025, kec: 'Gerogol' },
  'Kotasari': { lat: -5.981, lng: 106.035, kec: 'Gerogol' },
  'Rawa Arum': { lat: -5.968, lng: 106.038, kec: 'Gerogol' },
  'Gedong Dalem': { lat: -6.002, lng: 106.068, kec: 'Jombang' },
  'Jombang Wetan': { lat: -6.010, lng: 106.052, kec: 'Jombang' },
  'Masigit': { lat: -6.015, lng: 106.058, kec: 'Jombang' },
  'Panggung Rawi': { lat: -5.995, lng: 106.061, kec: 'Jombang' },
  'Sukmajaya': { lat: -6.008, lng: 106.075, kec: 'Jombang' },
  'Lebakgede': { lat: -5.915, lng: 106.012, kec: 'Pulomerak' },
  'Mekarsari': { lat: -5.928, lng: 106.002, kec: 'Pulomerak' },
  'Suralaya': { lat: -5.892, lng: 106.025, kec: 'Pulomerak' },
  'Tamansari': { lat: -5.935, lng: 106.018, kec: 'Pulomerak' },
  'Kebon Dalem': { lat: -5.988, lng: 106.042, kec: 'Purwakarta' },
  'Kotabumi': { lat: -5.975, lng: 106.058, kec: 'Purwakarta' },
  'Pabean': { lat: -5.965, lng: 106.065, kec: 'Purwakarta' },
  'Purwakarta': { lat: -5.980, lng: 106.050, kec: 'Purwakarta' },
  'Ramanuju': { lat: -5.992, lng: 106.038, kec: 'Purwakarta' },
  'Tegal Bunder': { lat: -5.970, lng: 106.052, kec: 'Purwakarta' }
};

export const BASE_SYSTEM_INSTRUCTION = `
Kamu adalah DKPP-INFO — Sistem Intelijen Ketahanan Pangan, Pertanian, Perikanan, dan Peternakan Kota Cilegon.

PRINSIP JAWABAN:
1. Gunakan fakta riil terverifikasi data resmi DKPP Kota Cilegon.
2. Jawab secara jelas, profesional, komprehensif, berbasis data statistik presisi dan terstruktur dengan Markdown (gunakan bullet points, bold key data, dan tabel bila relevan).
3. Klasifikasikan:
   - [FAKTA]: Data riil angka, status, surveilans.
   - [ANALISIS/INFERENSI]: Dampak, korelasi, atau tren.
   - [REKOMENDASI]: Aksi kebijakan atau mitigasi intervensi pangan.
4. Jangan halusinasi; jika data spesifik sangat teknis belum ada, jelaskan berbasis data makro terdekat.
`;

// Helper untuk membangun konteks domain lengkap (FSVA, SKPG, Harga SAGON, KPI, Produksi, dll)
export function getDomainKnowledgeContext(): string {
  const lines: string[] = [];

  lines.push('=== 1. INDIKATOR MAKRO & BENCHMARK RPJMD KOTA CILEGON (KPI UTAMA) ===');
  lines.push('• Skor Pola Pangan Harapan (PPH) Konsumsi: 90.9 Poin (Standar Nasional: 90.0) -> STATUS: MELAMPAUI TARGET');
  lines.push('• % Agregat Konsumsi Energi & Protein: 100.22% (Target: 100%) -> STATUS: TERCAPAI LENGKAP');
  lines.push('• Tingkat Konsumsi Energi: 2.021 kkal/kapita/hari (Standar: 2.100 kkal)');
  lines.push('• Tingkat Konsumsi Protein: 59.0 gram/kapita/hari (Standar: 57.0 gram) -> STATUS: SURPLUS AMAN');
  lines.push('• % Agregat Ketersediaan Energi & Protein: 121.0% (Standar: 100%) -> STATUS: SURPLUS TINGGI');
  lines.push('• Tingkat Ketersediaan Energi: 2.582 kkal/kapita/hari (Standar: 2.400 kkal)');
  lines.push('• Tingkat Ketersediaan Protein: 85.0 gram/kapita/hari (Standar: 63.0 gram)');
  lines.push('• Cadangan Pangan Pemerintah Daerah (CPPD): 132.7 Ton Beras di Gudang Bulog (Target RPJMD: 115.0 Ton) -> STATUS: SANGAT AMAN');
  lines.push('• Stabilitas Harga Beras (Koefisien Variasi / CV): 0.74% - 3.65% (Batas Aman Nasional: CV < 10%) -> STATUS: SANGAT STABIL');
  lines.push('• Indeks Ketahanan Pangan (IKP) Kota Cilegon: 80.12 (Kategori: Sangat Tahan, di atas rata-rata Banten 79.25)');
  lines.push('• Prevalence of Undernourishment (PoU): 2.78% (Jauh lebih baik dari rata-rata Nasional 7.89%)');

  lines.push('\n=== 2. SISTEM KEWASPADAAN PANGAN DAN GIZI (SKPG) BULANAN & STATUS GIZI BALITA ===');
  lines.push('• Metodologi SKPG Tri-Aspek:');
  lines.push('  1. Aspek Ketersediaan: Luas panen padi, produksi palawija (ubi kayu buffer), produksi ikan budidaya & tangkap, stok CPPD 132.7 Ton di Bulog.');
  lines.push('  2. Aspek Akses Pangan: Stabilitas harga pangan bulanan, CV Beras 0.74%, keterjangkauan daya beli, dan intervensi Gerakan Pangan Murah (GPM).');
  lines.push('  3. Aspek Pemanfaatan / Gizi: Surveilans antropometri bulanan balita (BB/U) di seluruh Posyandu 43 kelurahan.');
  lines.push('• HASIL SURVEILANS GIZI BALITA POSYANDU SE-KOTA CILEGON:');
  lines.push('  - Total Balita Ditimbang: 27.286 Anak');
  lines.push('  - Balita Gizi Normal: 25.044 Anak (91.78%)');
  lines.push('  - Balita Gizi Lebih: 1.064 Anak (3.90%)');
  lines.push('  - Balita Gizi Kurang: 946 Anak (3.47%)');
  lines.push('  - Balita Gizi Sangat Kurang: 232 Anak (0.85%)');
  lines.push('  - Prevalensi Balita Gizi Kurang: 3.47% (Jauh di bawah batas waspada SKPG 10%) -> STATUS SKPG KOTA: AMAN (HIJAU)');
  lines.push('• Status SKPG 8 Kecamatan: Semua kecamatan (Cibeber, Cilegon, Pulomerak, Ciwandan, Jombang, Gerogol, Purwakarta, Citangkil) berstatus AMAN (HIJAU).');

  lines.push('\n=== 3. PANEL HARGA PANGAN HARIAN REAL-TIME SAGON & PASAR UTAMA ===');
  lines.push('• Pemantauan Pasar Kranggot, Pasar Blok F, dan Pasar Merak:');
  lines.push('  - Beras Medium: Rp 13.500 - 14.000 /kg (Stabil, pasokan lancar)');
  lines.push('  - Beras Premium: Rp 15.000 - 16.000 /kg (Stabil)');
  lines.push('  - Minyakita: Rp 16.000 /liter (Sesuai HET Pemerintah)');
  lines.push('  - Minyak Goreng Kemasan: Rp 21.000 - 22.000 /liter');
  lines.push('  - Telur Ayam Ras: Rp 29.500 - 31.500 /kg (Stabil)');
  lines.push('  - Daging Ayam Ras: Rp 35.000 - 37.000 /kg (Stabil)');
  lines.push('  - Daging Sapi Murni: Rp 140.000 - 150.000 /kg');
  lines.push('  - Cabai Merah Keriting: Rp 35.000 - 45.000 /kg');
  lines.push('  - Cabai Rawit Merah: Rp 45.000 - 55.000 /kg');
  lines.push('  - Bawang Merah: Rp 38.000 - 42.000 /kg');
  lines.push('  - Gula Pasir: Rp 16.500 - 17.500 /kg');
  lines.push('• EWS Status: Beras, Minyak, Telur [AMAN/HIJAU]. Cabai & Bawang [WASPADA/KUNING] karena fluktuasi cuaca sentra produksi luar daerah.');

  lines.push('\n=== 4. DATA PERTANIAN, LAHAN SAWAH (LBS) & PRODUKSI PANGAN (2014-2025) ===');
  lines.push('• Total Luas Baku Sawah (LBS) Kota Cilegon: 1.151,97 Ha (407 Petak Poligon GIS Spasial)');
  lines.push('• Jumlah Penduduk Kota Cilegon: 480.378 Jiwa');
  lines.push('• Produksi Gabah Kering Giling (GKG): 13.772 Ton GKG (2025) | Panen 2.428 Ha | Produktivitas 56.7 Ku/Ha');
  lines.push('• Produksi Ubi Kayu (Singkong Buffer): 2.007,6 Ton (2025) dari panen 167,3 Ha (Produktivitas 120 Ku/Ha)');
  lines.push('• Sebaran Sawah per Kecamatan: Ciwandan (266.41 Ha), Jombang (229.40 Ha), Purwakarta (201.36 Ha), Cibeber (181.16 Ha), Citangkil (132.65 Ha), Gerogol (99.00 Ha), Cilegon (28.38 Ha), Pulomerak (13.60 Ha).');

  lines.push('\n=== 5. FOOD SECURITY AND VULNERABILITY ATLAS (FSVA) 43 KELURAHAN (2024-2025) ===');
  lines.push('• Tidak ada kelurahan berstatus Rentan (Prioritas 1-3).');
  lines.push('• Prioritas 6 (Sangat Tahan): Bulakan, Panggung Rawi, Pabean, Purwakarta (IKP > 77.5).');
  lines.push('• Prioritas 5 (Tahan): Cibeber, Kedaleman, Karang Asem, Citangkil, Tegal Ratu, Gunung Sugih, Gerogol, Kotabumi, Sukmajaya, dll.');
  lines.push('• Prioritas 4 (Agak Tahan/Pengawasan): Kalitimbang, Bagendung, Ketileng, Banjar Negara, Gerem, Rawa Arum, Lebakgede, Mekarsari, Suralaya.');

  return lines.join('\n');
}

// Deterministic intelligent fallback engine jika AI Gemini mengalami rate-limit atau timeout
function generateRuleBasedAnswer(userQuery: string): { content: string; mapActions: MapAction[]; sources: SourceCitation[] } {
  const q = userQuery.toLowerCase();
  const sources: SourceCitation[] = [
    { type: 'LOCAL DATA', title: 'Sistem Informasi Ketahanan Pangan DKPP Kota Cilegon', detail: 'Realisasi SKPG, FSVA, dan SAGON 2025-2026' }
  ];
  const mapActions: MapAction[] = [];

  // 1. Pertanyaan seputar SKPG dan Gizi Balita / Kerawanan
  if (q.includes('skpg') || q.includes('balita') || q.includes('gizi') || q.includes('posyandu') || q.includes('waspada')) {
    mapActions.push({
      type: 'CHOROPLETH',
      thematicMode: 'skpg',
      layersToEnable: ['kelurahan', 'skpg']
    });

    const content = `### 📊 Ringkasan Laporan Bulanan SKPG Kota Cilegon & Stabilitas Pangan

**Status Komposit SKPG Kota Cilegon:** 🟢 **AMAN (HIJAU)**

Berdasarkan analisis tri-aspek Sistem Kewaspadaan Pangan dan Gizi (SKPG) Dinas Ketahanan Pangan dan Pertanian Kota Cilegon:

#### 1. [FAKTA] Hasil Surveilans Gizi Balita (Aspek Pemanfaatan/Gizi)
- **Total Balita Ditimbang di Posyandu:** **27.286 Anak**
- **Balita Status Gizi Normal:** **25.044 Anak (91,78%)**
- **Balita Gizi Lebih:** **1.064 Anak (3,90%)**
- **Balita Gizi Kurang (Underweight):** **946 Anak (3,47%)**
- **Balita Gizi Sangat Kurang:** **232 Anak (0,85%)**
- **Prevalensi Balita Kurang:** **3,47%** *(Jauh di bawah batas ambang waspada nasional SKPG sebesar 10%)*.
- **Status Seluruh 8 Kecamatan:** Seluruh kecamatan (Cibeber, Cilegon, Citangkil, Ciwandan, Gerogol, Jombang, Pulomerak, Purwakarta) berada pada kategori **AMAN (Skor SKPG 3 / Hijau)**.

#### 2. [FAKTA] Ketersediaan & Stabilitas Pasokan Beras
- **Stabilitas Harga Beras (CV):** **0,74% – 3,65%** *(Kategori Sangat Stabil, ambang batas waspada CV > 10%)*.
- **Cadangan Pangan Pemerintah Daerah (CPPD):** **132,7 Ton Beras** tersimpan aman di Gudang Bulog (melampaui target RPJMD 115 Ton).
- **Produksi Padi Lokal (2025):** **13.772 Ton GKG** dari 2.428 Ha panen dengan produktivitas **56,7 Ku/Ha**.
- **Buffer Karbohidrat (Ubi Kayu/Singkong):** **2.007,6 Ton** panen lokal.

#### 3. [FAKTA] Pantauan Harga Komoditas Strategis Harian (SAGON)
| Komoditas | Kisaran Harga Pasar | Status EWS |
| :--- | :--- | :---: |
| **Beras Medium** | Rp 13.500 – 14.000 /kg | 🟢 **Aman** |
| **Beras Premium** | Rp 15.000 – 16.000 /kg | 🟢 **Aman** |
| **Minyakita (HET)** | Rp 16.000 /liter | 🟢 **Aman** |
| **Telur Ayam Ras** | Rp 29.500 – 31.500 /kg | 🟢 **Aman** |
| **Daging Ayam Broiler** | Rp 35.000 – 37.000 /kg | 🟢 **Aman** |
| **Daging Sapi Murni** | Rp 140.000 – 150.000 /kg | 🟢 **Aman** |
| **Cabai & Bawang** | Rp 38.000 – 55.000 /kg | 🟡 **Waspada Cuaca** |

#### 4. [REKOMENDASI] Aksi Kebijakan DKPP
1. Mempertahankan stok CPPD Bulog dan pengawasan pasokan beras harian di 3 pasar utama (Kranggot, Blok F, Merak).
2. Melaksanakan Gerakan Pangan Murah (GPM) terpadu di kelurahan padat penduduk jika terjadi lonjakan harga cabai/bawang.
3. Melanjutkan intervensi gizi spesifik di Posyandu untuk 232 balita gizi sangat kurang melalui program PMT (Pemberian Makanan Tambahan).`;

    return { content, mapActions, sources };
  }

  // 2. Pertanyaan seputar FSVA, Kerawanan Pangan, IKP
  if (q.includes('fsva') || q.includes('ikp') || q.includes('rawan') || q.includes('rentan') || q.includes('prioritas')) {
    mapActions.push({
      type: 'CHOROPLETH',
      thematicMode: 'fsva',
      layersToEnable: ['kelurahan', 'fsva']
    });

    const content = `### 🗺️ Ringkasan Food Security and Vulnerability Atlas (FSVA) Kota Cilegon

**Status Umum:** Kota Cilegon **Bebas dari Kerawanan Pangan Kronis** (0 Kelurahan pada Prioritas 1–3).

#### 1. [FAKTA] Capaian Indeks Ketahanan Pangan (IKP)
- **Skor IKP Kota Cilegon:** **80,12** *(Kategori: Sangat Tahan)*, melampaui rata-rata Provinsi Banten (79,25).
- **Prevalence of Undernourishment (PoU):** **2,78%** *(Standar Nasional 7,89%)*.

#### 2. [FAKTA] Zonasi Prioritas 43 Kelurahan
- **Prioritas 6 (Sangat Tahan):** Kelurahan Bulakan, Panggung Rawi, Pabean, Purwakarta, Kedaleman, Taman Baru (IKP > 76.5).
- **Prioritas 5 (Tahan):** 30 Kelurahan termasuk Cibeber, Citangkil, Tegal Ratu, Gunung Sugih, Gerogol, Sukmajaya, Ciwaduk.
- **Prioritas 4 (Agak Tahan / Perlu Pengawasan):** 9 Kelurahan (Kalitimbang, Bagendung, Ketileng, Banjar Negara, Gerem, Rawa Arum, Lebakgede, Mekarsari, Suralaya).

#### 3. [REKOMENDASI]
Fasilitasi program kawasan pekarangan pangan lestari (KWT) dan diversifikasi konsumsi berbasis pangan lokal (singkong/sukun) pada kelurahan Prioritas 4.`;

    return { content, mapActions, sources };
  }

  // 3. Pertanyaan Sawah, Pertanian, LBS
  if (q.includes('sawah') || q.includes('lbs') || q.includes('tani') || q.includes('panen') || q.includes('produksi')) {
    mapActions.push({
      type: 'FLY_TO',
      target: 'Cilegon Sawah',
      lat: -6.015,
      lng: 106.035,
      zoom: 13,
      layersToEnable: ['kelurahan', 'sawah', 'poktan']
    });

    const content = `### 🌾 Profil Lahan Baku Sawah & Produksi Pertanian Kota Cilegon

#### 1. [FAKTA] Data Lahan Sawah (LBS Spasial 2025)
- **Total Luas Baku Sawah Baku:** **1.151,97 Hektar** (tersebar dalam **407 Petak Poligon GIS**).
- **Sebaran per Kecamatan:**
  1. Ciwandan: **266,41 Ha** (95 Petak)
  2. Jombang: **229,40 Ha** (41 Petak)
  3. Purwakarta: **201,36 Ha** (58 Petak)
  4. Cibeber: **181,16 Ha** (78 Petak)
  5. Citangkil: **132,65 Ha** (92 Petak)
  6. Gerogol: **99,00 Ha** (22 Petak)
  7. Cilegon: **28,38 Ha** (28 Petak)
  8. Pulomerak: **13,60 Ha**

#### 2. [FAKTA] Realisasi Produksi
- **Produksi Padi Sawah 2025:** **13.772 Ton GKG** *(Produktivitas 56,7 Ku/Ha)*.
- **Ubi Kayu (Singkong):** **2.007,6 Ton** *(Produktivitas 120 Ku/Ha)*.
- **Kelompok Tani (Poktan):** 89 Kelompok Tani aktif terdaftar di Simluhtan & DKPP.`;

    return { content, mapActions, sources };
  }

  // 4. Default Domain Overview
  return {
    content: `### 🌾 Informasi Terpadu DKPP Kota Cilegon

Kota Cilegon memiliki ketahanan pangan yang tangguh dengan skor **IKP 80,12 (Sangat Tahan)** dan status **SKPG AMAN (Hijau)**.

- **Cadangan Beras Pemerintah Daerah (CPPD):** 132,7 Ton di Bulog.
- **Stabilitas Harga Beras:** CV 0,74% (Sangat Stabil).
- **Luas Sawah Baku (LBS):** 1.151,97 Ha di 407 petak sawah.
- **Surveilans Balita SKPG:** 91,78% balita berstatus gizi normal dari 27.286 balita yang dipantau.

Silakan ajukan pertanyaan lebih spesifik mengenai data **SKPG bulanan, peta FSVA 43 kelurahan, harga pasar SAGON, atau geospasial petak sawah & kelompok tani**.`,
    mapActions: [{ type: 'CHOROPLETH', thematicMode: 'ikp', layersToEnable: ['kelurahan'] }],
    sources
  };
}

/**
 * Panggil Google Gemini API dengan fallback multi-model yang tangguh
 */
async function callGeminiApi(
  apiKey: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  systemPrompt: string
): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  for (const model of GEMINI_MODELS) {
    try {
      const payload: Record<string, unknown> = {
        contents,
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text;
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Gemini API] Model ${model} returned ${res.status}:`, errText.substring(0, 100));
      }
    } catch (e) {
      console.warn(`[Gemini API] Model ${model} fetch failed:`, (e as Error).message);
    }
  }

  throw new Error('Semua model Gemini sedang tidak dapat diakses.');
}

/**
 * Generate AI Response untuk Chat DKPP App dengan multi-model fallback & domain knowledge
 */
export async function generateChatResponse(params: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userRole?: string;
  isVerified?: boolean;
  userMemoryContext?: string;
}) {
  const { messages, userRole = 'GUEST', isVerified = false, userMemoryContext = '' } = params;
  const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

  // 1. Bangun System Instruction lengkap dengan Domain Knowledge
  const domainContext = getDomainKnowledgeContext();
  let fullSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\n${domainContext}`;
  if (userMemoryContext) {
    fullSystemInstruction += `\n\n[USER PREFERENCES & MEMORY]:\n${userMemoryContext}`;
  }
  fullSystemInstruction += `\n\n[USER ACCESS CONTEXT]:\nRole: ${userRole}\nis_verified_employee: ${isVerified}`;

  const apiKey = process.env.GEMINI_API_KEY || '';

  // 2. Deteksi Aksi Peta Spasial otomatis dari teks pertanyaan user
  const collectedMapActions: MapAction[] = [];
  const qLower = lastUserMsg.toLowerCase();

  for (const [kelName, coord] of Object.entries(KELURAHAN_COORDS)) {
    if (qLower.includes(kelName.toLowerCase())) {
      collectedMapActions.push({
        type: 'FLY_TO',
        target: kelName,
        lat: coord.lat,
        lng: coord.lng,
        zoom: 15.5,
        layersToEnable: ['kelurahan', 'sawah'],
        pin: {
          lat: coord.lat,
          lng: coord.lng,
          name: `Kelurahan ${kelName}`,
          category: 'wilayah',
          kelurahan: kelName,
          kecamatan: coord.kec
        }
      });
      break;
    }
  }

  if (collectedMapActions.length === 0) {
    if (qLower.includes('skpg') || qLower.includes('gizi') || qLower.includes('balita')) {
      collectedMapActions.push({ type: 'CHOROPLETH', thematicMode: 'skpg', layersToEnable: ['kelurahan', 'skpg'] });
    } else if (qLower.includes('fsva') || qLower.includes('rawan') || qLower.includes('rentan')) {
      collectedMapActions.push({ type: 'CHOROPLETH', thematicMode: 'fsva', layersToEnable: ['kelurahan', 'fsva'] });
    } else if (qLower.includes('sawah') || qLower.includes('lbs') || qLower.includes('tani')) {
      collectedMapActions.push({ type: 'FLY_TO', target: 'Lahan Sawah Cilegon', lat: -6.015, lng: 106.035, zoom: 13, layersToEnable: ['kelurahan', 'sawah', 'poktan'] });
    }
  }

  const collectedSources: SourceCitation[] = [
    {
      type: 'LOCAL DATA',
      title: 'Basis Data & Portal Informasi DKPP Kota Cilegon',
      detail: 'Dinas Ketahanan Pangan dan Pertanian Kota Cilegon 2026'
    }
  ];

  const executedTools: ToolCall[] = [];

  // 3. Coba panggil Gemini API dengan multi-model fallback
  if (apiKey) {
    try {
      const generatedText = await callGeminiApi(apiKey, messages, fullSystemInstruction);
      return {
        content: generatedText,
        sources: collectedSources,
        tool_calls: executedTools,
        map_actions: collectedMapActions
      };
    } catch (apiErr) {
      console.warn('[Chat DKPP] Gemini API call failed, activating smart domain synthesizer fallback:', apiErr);
    }
  }

  // 4. Jika Gemini offline / API key habis kuota, gunakan Smart Domain Synthesizer
  const fallback = generateRuleBasedAnswer(lastUserMsg);
  return {
    content: fallback.content,
    sources: fallback.sources,
    tool_calls: executedTools,
    map_actions: collectedMapActions.length > 0 ? collectedMapActions : fallback.mapActions
  };
}
