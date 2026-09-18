import { PollIntentResult } from './types';

const RULE_MAP: Array<{ category: string; keywords: string[]; title: string }> = [
  { category: 'ganteng', keywords: ['ganteng', 'terganteng', 'tampan', 'tertampan', 'cakep', 'tercakep', 'pria tertampan', 'cowok ganteng'], title: 'Pegawai Paling Ganteng' },
  { category: 'cantik', keywords: ['cantik', 'tercantik', 'anggun', 'teranggun', 'jelita', 'terjelita', 'manis', 'termanis', 'wanita tercantik', 'cewek cantik'], title: 'Pegawai Paling Cantik' },
  { category: 'cerdas', keywords: ['cerdas', 'tercerdas', 'pintar', 'terpintar', 'genius', 'jenius', 'otak encer', 'solutif'], title: 'Pegawai Paling Cerdas' },
  { category: 'rajin', keywords: ['rajin', 'terajin', 'disiplin', 'terdisiplin', 'ulet', 'tepat waktu', 'pekerja keras'], title: 'Pegawai Paling Rajin' },
  { category: 'soleh', keywords: ['soleh', 'tersoleh', 'sholeh', 'tersholeh', 'alim', 'santun', 'ibadah', 'agamis'], title: 'Pegawai Paling Soleh & Santun' },
  { category: 'dermawan', keywords: ['dermawan', 'terdermawan', 'pemurah', 'suka berbagi', 'sedekah', 'ringan tangan'], title: 'Pegawai Paling Dermawan' },
  { category: 'royal', keywords: ['royal', 'ter-royal', 'traktir', 'suka traktir', 'jajanin', 'bayarin'], title: 'Pegawai Paling Royal' },
  { category: 'baik', keywords: ['baik', 'terbaik', 'baik hati', 'tulus', 'ramah', 'teramahnya', 'penolong'], title: 'Pegawai Paling Baik Hati' },
  { category: 'tahu_segala', keywords: ['tahu segala', 'paling tahu', 'kamus berjalan', 'serba tahu', 'wawasan luas'], title: 'Pegawai Paling Tahu Segala' },
  { category: 'update', keywords: ['update', 'terupdate', 'ter-update', 'up to date', 'viral', 'tren', 'berita baru'], title: 'Pegawai Paling Update' },
  { category: 'gaptek', keywords: ['gaptek', 'tergaptek', 'gagap teknologi', 'bingung mouse', 'kocak teknologi'], title: 'Pegawai Paling Gaptek' },
  { category: 'murah_senyum', keywords: ['murah senyum', 'senyum', 'tersenyum', 'sumringah', 'ceria'], title: 'Pegawai Paling Murah Senyum' },
  { category: 'cool', keywords: ['cool', 'tercool', 'kalem', 'terkalem', 'tenang', 'karismatik', 'kharisma'], title: 'Pegawai Paling Cool & Tenang' },
  { category: 'trendy', keywords: ['trendy', 'tertrendy', 'modis', 'termodis', 'stylish', 'rapi', 'fashionable', 'kece'], title: 'Pegawai Paling Trendy' },
  { category: 'lucu', keywords: ['lucu', 'terlucu', 'komika', 'lawak', 'ngelawak', 'humoris', 'kocak', 'terkocak', 'bikin ketawa'], title: 'Pegawai Paling Lucu' },
];

export function detectPollingIntent(userMessage: string): PollIntentResult {
  const text = userMessage.toLowerCase().trim();
  // Normalize common typo 'pooling' -> 'polling'
  const normalized = text.replace(/pooling/g, 'polling');

  // Cek apakah ada tema yang cocok dari RULE_MAP
  let matchedTheme: string | null = null;
  let matchedTitle: string | null = null;
  for (const rule of RULE_MAP) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      matchedTheme = rule.category;
      matchedTitle = rule.title;
      break;
    }
  }

  // 1. Kasus Hasil / Live Carousel (cth: "lihat live hasil rajin", "hasil polling ganteng", "carousel", "live hasil")
  const isResultQuery =
    normalized.includes('hasil') ||
    normalized.includes('live') ||
    normalized.includes('carousel') ||
    normalized.includes('karosel') ||
    normalized.includes('slide') ||
    normalized.includes('peringkat') ||
    normalized.includes('perolehan') ||
    normalized.includes('skor') ||
    normalized.includes('rekap') ||
    normalized.includes('teratas') ||
    normalized.includes('pemuncak') ||
    normalized.includes('pemenang') ||
    normalized.includes('juara') ||
    normalized.includes('podium') ||
    normalized.includes('statistik');

  const isPollingContext =
    isResultQuery ||
    normalized.includes('polling') ||
    normalized.includes('voting') ||
    normalized.includes('vote') ||
    normalized.includes('pilih') ||
    normalized.includes('kandidat') ||
    normalized.startsWith('siapa ') ||
    normalized.includes(' paling ') ||
    matchedTheme !== null;

  if (!isPollingContext) {
    return { intent: 'GENERAL_CHAT', confidence: 0 };
  }

  // Jika query meminta hasil / live / carousel
  if (isResultQuery) {
    const targetCode = matchedTheme || 'cantik';
    return {
      intent: 'EMPLOYEE_POLL',
      category: 'carousel',
      poll_title: `Live Hasil Polling (Carousel 15 Tema - ${targetCode})`,
      confidence: 0.99,
    };
  }

  // Jika query menyebut tema tertentu untuk voting / nominasi
  if (matchedTheme) {
    return {
      intent: 'EMPLOYEE_POLL',
      category: matchedTheme,
      poll_title: matchedTitle || 'Polling Pegawai DKPP',
      confidence: 0.95,
    };
  }

  // Jika query bersifat umum mengenai katalog polling
  if (
    normalized.includes('polling') ||
    normalized.includes('voting') ||
    normalized.includes('link') ||
    normalized.includes('katalog') ||
    normalized.includes('daftar') ||
    normalized.includes('semua') ||
    normalized.includes('menu')
  ) {
    return {
      intent: 'EMPLOYEE_POLL',
      category: 'all',
      poll_title: 'Katalog Semua Polling',
      confidence: 0.9,
    };
  }

  return { intent: 'GENERAL_CHAT', confidence: 0.3 };
}
