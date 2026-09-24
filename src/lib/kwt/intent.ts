/**
 * KWT Intent Detection
 * Mendeteksi apakah pesan user berkaitan dengan query KWT (Kelompok Wanita Tani).
 */

export interface KwtIntentResult {
  intent: 'KWT_QUERY' | 'KWT_LIST' | 'KWT_MAP' | 'NONE';
  kwt_name?: string;    // nama spesifik KWT yang ditanyakan
  kecamatan?: string;   // filter kecamatan
  kelurahan?: string;   // filter kelurahan
  want_map?: boolean;   // user ingin lihat peta/GIS
  confidence: number;
}

const KWT_TRIGGER_WORDS = [
  'kwt', 'kelompok wanita tani', 'kelompok tani wanita', 'wanita tani',
  'poktan wanita', 'gapoktan wanita', 'tani wanita',
];

const LOCATION_TRIGGERS = [
  'di mana', 'dimana', 'lokasi', 'alamat', 'sekretariat', 'letak',
  'posisi', 'maps', 'peta', 'gis', 'koordinat', 'pin',
];

const LIST_TRIGGERS = [
  'daftar', 'list', 'semua', 'berapa', 'total', 'ada berapa',
  'ada kwt', 'kwt apa saja', 'kwt mana saja',
];

const KECAMATAN_ALIASES: Record<string, string> = {
  'citangkil': 'CITANGKIL',
  'ciwandan': 'CIWANDAN',
  'pulomerak': 'PULOMERAK',
  'grogol': 'GROGOL',
  'jombang': 'JOMBANG',
  'purwakarta': 'PURWAKARTA',
  'cibeber': 'CIBEBER',
  'cilegon': 'CILEGON',
};

export function detectKwtIntent(message: string): KwtIntentResult {
  if (!message) return { intent: 'NONE', confidence: 0 };

  const text = message.toLowerCase().trim();

  // Apakah ada trigger kata KWT?
  const hasKwtTrigger = KWT_TRIGGER_WORDS.some((w) => text.includes(w));
  if (!hasKwtTrigger) return { intent: 'NONE', confidence: 0 };

  const wantMap = LOCATION_TRIGGERS.some((t) => text.includes(t));
  const wantList = LIST_TRIGGERS.some((t) => text.includes(t));

  // Deteksi kecamatan yang disebut
  let kecamatan: string | undefined;
  for (const [alias, canon] of Object.entries(KECAMATAN_ALIASES)) {
    if (text.includes(alias)) {
      kecamatan = canon;
      break;
    }
  }

  // Ekstrak nama KWT spesifik (pola: "kwt [nama]" atau "kelompok [nama]")
  let kwt_name: string | undefined;
  const kwtNameMatch = text.match(/kwt\s+([a-z\s]+?)(?:\s+(?:di|itu|yang|ada|berapa|lokasi|alamat|mana|peta)|$)/i);
  if (kwtNameMatch?.[1]) {
    const candidate = kwtNameMatch[1].trim();
    // Minimal 3 karakter dan bukan stopword
    if (candidate.length >= 3 && !['ini', 'itu', 'ada', 'apa'].includes(candidate)) {
      kwt_name = candidate.toUpperCase();
    }
  }

  if (wantList || kecamatan) {
    return {
      intent: 'KWT_LIST',
      kecamatan,
      want_map: wantMap,
      confidence: 0.92,
    };
  }

  if (kwt_name) {
    return {
      intent: wantMap ? 'KWT_MAP' : 'KWT_QUERY',
      kwt_name,
      kecamatan,
      want_map: wantMap,
      confidence: 0.95,
    };
  }

  return {
    intent: 'KWT_QUERY',
    kecamatan,
    want_map: wantMap,
    confidence: 0.80,
  };
}

/**
 * Format profil KWT untuk ditampilkan di chat
 */
export function formatKwtProfile(kwt: Record<string, any>, wantMap = false): string {
  const lines: string[] = [];

  lines.push(`🌱 **${kwt.nama_kwt}**`);
  lines.push(`📍 ${kwt.kelurahan}, Kec. ${kwt.kecamatan}, Kota Cilegon`);

  if (kwt.alamat_sekretariat) {
    lines.push(`🏠 Sekretariat: ${kwt.alamat_sekretariat}`);
  }
  if (kwt.nama_ketua) {
    lines.push(`👩 Ketua: ${kwt.nama_ketua}`);
  }
  if (kwt.no_wa_ketua || kwt.no_hp_ketua) {
    const contact = kwt.no_wa_ketua || kwt.no_hp_ketua;
    lines.push(`📱 Kontak: ${contact}`);
  }
  if (kwt.jenis_usaha) {
    lines.push(`🌾 Usaha: ${kwt.jenis_usaha}`);
  }
  if (kwt.bantuan) {
    lines.push(`🎁 Bantuan: ${kwt.bantuan}`);
  }
  if (kwt.keterangan) {
    lines.push(`📋 Status: ${kwt.keterangan}`);
  }

  if (wantMap && kwt.latitude && kwt.longitude) {
    lines.push('');
    lines.push(`🗺️ **Lokasi di peta tersedia.** Klik tombol GIS di bawah untuk melihat pin lokasi KWT ini.`);
  } else if (wantMap && kwt.maps_link) {
    lines.push('');
    lines.push(`🗺️ [Lihat di Google Maps](${kwt.maps_link})`);
  } else if (!kwt.latitude) {
    lines.push('');
    lines.push(`📌 *Koordinat belum tersedia, silakan hubungi DKPP untuk detail lokasi.*`);
  }

  return lines.join('\n');
}
