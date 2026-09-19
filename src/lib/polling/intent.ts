import { PollIntentResult } from './types';

interface RuleTheme {
  category: string;
  keywords: string[];
  title: string;
}

const RULE_MAP: RuleTheme[] = [
  { category: 'ganteng', keywords: ['ganteng', 'terganteng', 'tampan', 'tertampan', 'cakep', 'tercakep', 'pria tertampan', 'cowok ganteng'], title: 'Pegawai Paling Ganteng' },
  { category: 'cantik', keywords: ['cantik', 'tercantik', 'anggun', 'teranggun', 'jelita', 'terjelita', 'manis', 'termanis', 'wanita tercantik', 'cewek cantik'], title: 'Pegawai Paling Cantik' },
  { category: 'cerdas', keywords: ['cerdas', 'tercerdas', 'pintar', 'terpintar', 'genius', 'jenius', 'otak encer', 'solutif'], title: 'Pegawai Paling Cerdas' },
  { category: 'rajin', keywords: ['rajin', 'terajin', 'disiplin', 'terdisiplin', 'ulet', 'tepat waktu', 'pekerja keras'], title: 'Pegawai Paling Rajin' },
  { category: 'soleh', keywords: ['soleh', 'tersoleh', 'sholeh', 'tersholeh', 'alim', 'santun', 'ibadah', 'agamis'], title: 'Pegawai Paling Soleh & Santun' },
  { category: 'dermawan', keywords: ['dermawan', 'terdermawan', 'pemurah', 'suka berbagi', 'sedekah', 'ringan tangan'], title: 'Pegawai Paling Dermawan' },
  { category: 'royal', keywords: ['royal', 'ter-royal', 'traktir', 'suka traktir', 'jajanin', 'bayarin'], title: 'Pegawai Paling Royal' },
  { category: 'baik', keywords: ['baik hati', 'paling baik', 'terbaik hati', 'tulus', 'teramah', 'penolong'], title: 'Pegawai Paling Baik Hati' },
  { category: 'tahu_segala', keywords: ['tahu segala', 'paling tahu', 'kamus berjalan', 'serba tahu', 'wawasan luas'], title: 'Pegawai Paling Tahu Segala' },
  { category: 'update', keywords: ['terupdate', 'ter-update', 'paling update', 'up to date'], title: 'Pegawai Paling Update' },
  { category: 'gaptek', keywords: ['gaptek', 'tergaptek', 'gagap teknologi', 'bingung mouse'], title: 'Pegawai Paling Gaptek' },
  { category: 'murah_senyum', keywords: ['murah senyum', 'paling murah senyum', 'sumringah'], title: 'Pegawai Paling Murah Senyum' },
  { category: 'cool', keywords: ['cool', 'tercool', 'paling cool', 'terkalem', 'karismatik', 'kharisma'], title: 'Pegawai Paling Cool & Tenang' },
  { category: 'trendy', keywords: ['trendy', 'tertrendy', 'modis', 'termodis', 'stylish', 'fashionable'], title: 'Pegawai Paling Trendy' },
  { category: 'lucu', keywords: ['terlucu', 'paling lucu', 'komika', 'lawak', 'ngelawak', 'humoris', 'terkocak', 'bikin ketawa'], title: 'Pegawai Paling Lucu' },
];

// Topik resmi kedinasan/pertanian/pangan/perikanan yang BUKAN polling
const FORMAL_GOV_TOPICS = [
  'panen', 'padi', 'sawah', 'pupuk', 'benih', 'bibit', 'kwt', 'poktan', 'gapoktan', 'kelompok tani',
  'jagung', 'singkong', 'cabai', 'bawang', 'sayur', 'sayuran', 'ternak', 'sapi', 'kambing', 'ayam', 'telur',
  'ikan', 'nelayan', 'budidaya', 'tambak', 'perikanan', 'tangkapan', 'rabies', 'vaksin', 'puskeswan',
  'skpg', 'fsva', 'ikp', 'pou', 'neraca', 'cppd', 'bulog', 'pasar', 'kranggot', 'inflasi', 'stok pangan',
  'bansos', 'anggaran', 'renstra', 'iku', 'ikk', 'ikd', 'proposal', 'surat', 'bantuan', 'layanan', 'bpp',
  'kelurahan', 'kecamatan'
];

// Frasa eksplisit mengenai polling / voting
const EXPLICIT_POLL_PHRASES = [
  'polling pegawai', 'polling asn', 'polling staf', 'voting pegawai', 'voting asn', 'vote pegawai',
  'vote staf', 'carousel polling', 'karosel polling', 'live polling', 'hasil polling', 'hasil voting',
  'hasil vote', 'katalog polling', 'daftar polling', 'menu polling', 'fitur polling', 'suara polling',
  'live hasil polling', 'live hasil'
];

/**
 * Deteksi maksud pengguna secara kontekstual:
 * Menghindari penafsiran membabi-buta terhadap kata seperti "baik", "cantik", "hasil", dsb.
 * yang berada dalam kalimat panjang atau konteks kedinasan formal.
 */
export function detectPollingIntent(userMessage: string): PollIntentResult {
  if (!userMessage || typeof userMessage !== 'string') {
    return { intent: 'GENERAL_CHAT', confidence: 0 };
  }

  const raw = userMessage.trim();
  const text = raw.toLowerCase();
  // Normalisasi typo umum: 'pooling' -> 'polling', 'carousell' -> 'carousel'
  const normalized = text.replace(/pooling/g, 'polling').replace(/carousell/g, 'carousel');
  const words = normalized.split(/\s+/).filter(Boolean);

  // 1. Cek apakah ada frasa eksplisit polling/voting
  const hasExplicitPollPhrase = EXPLICIT_POLL_PHRASES.some((phrase) => normalized.includes(phrase));

  // 2. Cek apakah pesan membahas topik resmi kedinasan/pertanian/pangan
  const hasFormalTopic = FORMAL_GOV_TOPICS.some((topic) => normalized.includes(topic));

  // Jika pesan panjang atau mengandung topik resmi, DAN TIDAK secara eksplisit meminta polling,
  // maka JANGAN PERNAH intersep sebagai polling pegawai!
  if (hasFormalTopic && !hasExplicitPollPhrase) {
    return { intent: 'GENERAL_CHAT', confidence: 0 };
  }

  // 3. Deteksi tema dari RULE_MAP
  let matchedTheme: string | null = null;
  let matchedTitle: string | null = null;
  for (const rule of RULE_MAP) {
    if (rule.keywords.some((kw) => {
      // Pastikan pencocokan kata utuh atau frasa jelas, bukan substring acak
      const regex = new RegExp(`(^|\\b|\\s)${kw}(\\b|\\s|$)`, 'i');
      return regex.test(normalized);
    })) {
      matchedTheme = rule.category;
      matchedTitle = rule.title;
      break;
    }
  }

  // 4. Deteksi apakah pertanyaan menanyakan predikat pegawai (Superlative inquiry)
  // Contoh: "siapa pegawai paling ganteng?", "siapa staf terajin?", "siapa yang paling soleh di dkpp?"
  const hasWho = /\b(siapa|siapakah)\b/i.test(normalized);
  const hasSuperlative = /\b(paling|ter|ter-)\b/i.test(normalized);
  const hasEmployeeContext = /\b(pegawai|staf|staff|asn|pejabat|karyawan|orang|cowok|cewek|pria|wanita|dkpp|kantor|dinas)\b/i.test(normalized);
  const isEmployeeInquiry = (hasWho && hasSuperlative) || (hasEmployeeContext && hasSuperlative) || (hasWho && hasEmployeeContext);

  // 5. Periksa apakah query meminta Live Carousel Hasil Polling
  // Disambiguasi: kata "hasil" HANYA dianggap polling jika bersama konteks polling/voting/live/carousel/suara
  const isCarouselOrLiveRequest =
    normalized.includes('carousel') ||
    normalized.includes('karosel') ||
    normalized.includes('live hasil') ||
    normalized.includes('live polling') ||
    normalized.includes('hasil polling') ||
    normalized.includes('hasil voting') ||
    normalized.includes('hasil vote') ||
    normalized.includes('perolehan suara') ||
    normalized.includes('rekap suara') ||
    (normalized.includes('peringkat') && hasEmployeeContext) ||
    (normalized.includes('podium') && hasEmployeeContext);

  // Jika query meminta carousel live hasil
  if (isCarouselOrLiveRequest) {
    const targetCode = matchedTheme || 'cantik';
    return {
      intent: 'EMPLOYEE_POLL',
      category: 'carousel',
      poll_title: `Live Hasil Polling (Carousel 15 Tema - ${targetCode})`,
      confidence: 0.99,
    };
  }

  // 6. Jika query menyebut tema tertentu UNTUK voting / nominasi pegawai
  // Hanya berlaku jika:
  // a. Disertai konteks kepegawaian / pertanyaan "siapa paling..."
  // b. Atau perintah pendek eksplisit (<= 5 kata, cth: "polling cantik", "vote pegawai ganteng", "pilih soleh")
  // c. Atau ada frasa eksplisit polling
  if (matchedTheme) {
    const isShortDirectCommand =
      words.length <= 5 &&
      (normalized.includes('poll') || normalized.includes('vote') || normalized.includes('pilih') || isEmployeeInquiry);

    if (hasExplicitPollPhrase || isEmployeeInquiry || isShortDirectCommand) {
      return {
        intent: 'EMPLOYEE_POLL',
        category: matchedTheme,
        poll_title: matchedTitle || 'Polling Pegawai DKPP',
        confidence: 0.95,
      };
    }
  }

  // 7. Jika query meminta katalog seluruh polling secara eksplisit
  // (BUKAN hanya kata "menu", "semua", atau "daftar" biasa)
  const isCatalogRequest =
    normalized.includes('katalog polling') ||
    normalized.includes('daftar polling') ||
    normalized.includes('menu polling') ||
    normalized.includes('semua polling') ||
    normalized.includes('list polling') ||
    (normalized.includes('polling pegawai') && (normalized.includes('katalog') || normalized.includes('daftar') || normalized.includes('menu') || normalized.includes('semua')));

  if (isCatalogRequest) {
    return {
      intent: 'EMPLOYEE_POLL',
      category: 'all',
      poll_title: 'Katalog Semua Polling',
      confidence: 0.95,
    };
  }

  // 8. Default: Biarkan AI Gemini menjawab secara kontekstual dan menyeluruh
  return { intent: 'GENERAL_CHAT', confidence: 0 };
}

