import { PollIntentResult, PollTheme } from './types';
import { OFFICIAL_POLL_THEMES } from './constants';

/**
 * SYNONYM_MAP — Peta sinonim semantik per kode tema (code-based, bukan title-based).
 *
 * TUJUAN: Menyimpan kata-kata yang TIDAK bisa di-generate secara mekanis dari judul/label tema,
 *         namun secara semantik/kultural erat kaitannya dengan tema tersebut.
 *
 * ATURAN:
 *   - Kunci = code tema (tidak berubah meski admin ganti judul)
 *   - Isi  = kata-kata sinonim/kolokial yang user mungkin ketik di chat
 *   - Kata yang bisa di-generate dari judul (mis: "sibuk" dari "Paling Sibuk") TIDAK perlu di sini
 *   - Map ini TIDAK perlu di-update manual saat admin ganti judul
 *
 * Dengan struktur ini, admin bebas ganti judul kapan pun,
 * dan SYNONYM_MAP tidak perlu diubah kecuali ada penambahan sinonim baru.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  // code: ganteng — sinonim maskulin yang tidak berasal dari judul
  ganteng:      ['tampan', 'tertampan', 'cakep', 'tercakep', 'pria tertampan', 'cowok ganteng', 'macho'],

  // code: cantik — sinonim feminim
  cantik:       ['anggun', 'teranggun', 'jelita', 'terjelita', 'manis', 'termanis', 'wanita tercantik', 'cewek cantik', 'ayu'],

  // code: cerdas — sinonim intelektual
  cerdas:       ['pintar', 'terpintar', 'genius', 'jenius', 'otak encer', 'solutif', 'brilian', 'wawasan luas', 'tahu segala', 'kamus berjalan'],

  // code: rajin — sinonim etos kerja
  rajin:        ['disiplin', 'terdisiplin', 'ulet', 'tepat waktu', 'pekerja keras', 'giat', 'tekun'],

  // code: soleh — sinonim religius (kode tidak berubah meski judul diubah admin ke "Religius")
  soleh:        ['sholeh', 'alim', 'ibadah', 'agamis', 'religius', 'taqwa', 'mushola', 'paling religius', 'ustaz', 'ustazah'],

  // code: dermawan — sinonim kebersihan (kode tidak berubah meski judul diubah ke "Bersih")
  dermawan:     ['bersih', 'terbersih', 'beberes', 'rajin bersih', 'menjaga kebersihan', 'bersih-bersih', 'rapi'],

  // code: royal — sinonim sosial/traktir
  royal:        ['traktir', 'suka traktir', 'jajanin', 'bayarin', 'ter-royal', 'sponsoran'],

  // code: baik — sinonim empati
  baik:         ['baik hati', 'tulus', 'penolong', 'pengertian', 'empati', 'penyabar'],

  // code: tahu_segala — sinonim ramah (kode tidak berubah meski judul diubah ke "Ramah")
  tahu_segala:  ['ramah', 'teramah', 'ramah tamah', 'menyapa', 'suka sapa', 'friendly', 'senyum sapa', 'sapaan'],

  // code: update — sinonim pendiam (kode tidak berubah meski judul diubah ke "Pendiam")
  update:       ['pendiam', 'terpendiam', 'diam', 'jarang bicara', 'pemalu', 'introvert', 'diam-diam menghanyutkan'],

  // code: gaptek — sinonim jajan (kode tidak berubah meski judul diubah ke "Suka Jajan")
  gaptek:       ['suka jajan', 'banyak jajan', 'doyan jajan', 'ngemil', 'cemilan', 'ke warung', 'jajanan'],

  // code: murah_senyum — sinonim senyum
  murah_senyum: ['sumringah', 'sumringgah', 'selalu senyum', 'ceria', 'riang'],

  // code: cool — sinonim santai/kalem
  cool:         ['nyantai', 'santai', 'kalem', 'terkalem', 'karismatik', 'kharisma', 'tidak panik', 'tenang'],

  // code: trendy — sinonim "Paling Sibuk" (judul aktif DB). Slug 'trendy' dipertahankan karena sudah ada data votes.
  // Tambahkan sinonim kata-kata terkait kesibukan yang tidak bisa di-generate dari judul "Paling Sibuk"
  trendy:       ['sibuk', 'tersibuk', 'sibuk terus', 'selalu sibuk', 'produktif', 'aktif terus', 'kerja terus', 'kesibukan', 'workaholic', 'overwork', 'super sibuk', 'nonstop kerja', 'multitasking'],

  // code: lucu — sinonim humor
  lucu:         ['komika', 'lawak', 'ngelawak', 'humoris', 'terkocak', 'bikin ketawa', 'kocak', 'pelawak'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Topik resmi kedinasan/pertanian/pangan/perikanan yang BUKAN polling
// ─────────────────────────────────────────────────────────────────────────────
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

// Stopwords yang dikecualikan dari keyword extraction
const STOPWORDS = new Set([
  'pegawai', 'paling', 'yang', 'dan', 'atau', 'di', 'dkpp', 'kota', 'cilegon', 'siapa', 'ini', 'itu',
  'dengan', 'para', 'bisa', 'kolega', 'rekan', 'kerja', 'selalu', 'untuk', 'dari', 'juga', 'apa',
]);

/**
 * buildRulesFromThemes — Bangun aturan deteksi intent sepenuhnya dari data DB.
 *
 * Strategi per tema:
 *   1. Keyword dari code tema itu sendiri
 *   2. Keyword dari title + short_label yang diedit admin di DB (DINAMIS)
 *   3. Keyword sinonim semantik dari SYNONYM_MAP (code-based, tidak perlu update)
 *
 * Jika DB kosong/tidak tersedia → fallback ke OFFICIAL_POLL_THEMES (dari constants.ts)
 */
function buildRulesFromThemes(themes?: PollTheme[]): Array<{ category: string; keywords: string[]; title: string }> {
  // Fallback: gunakan konstanta resmi jika DB tidak tersedia
  const sourceThemes = (themes && themes.length > 0) ? themes : OFFICIAL_POLL_THEMES;

  return sourceThemes.map((theme) => {
    const kws = new Set<string>();

    // 1. Code sebagai keyword dasar
    kws.add(theme.code.toLowerCase().replace(/_/g, ' '));

    // 2. Ekstraksi dinamis dari title & short_label (hasil edit admin di DB)
    const titleLower = (theme.title || '').toLowerCase();
    const shortLower = (theme.short_label || '').toLowerCase();

    // Bersihkan prefix umum lalu tambahkan sebagai keyword frasa
    const cleanTitle = titleLower.replace(/^(pegawai|staf|kategori|tema)\s+/i, '').trim();
    if (cleanTitle) kws.add(cleanTitle);

    // short_label tanpa "paling" prefix → kata inti + variasi prefiks
    const cleanShort = shortLower.replace(/^paling\s+/i, '').trim();
    if (cleanShort) {
      kws.add(cleanShort);
      kws.add(`paling ${cleanShort}`);
      kws.add(`ter${cleanShort}`);
      kws.add(`ter-${cleanShort}`);
    }

    // Tokenisasi: ambil semua kata bermakna (≥3 huruf) dari title + short_label
    const tokens = `${titleLower} ${shortLower}`
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

    for (const tok of tokens) {
      kws.add(tok);
      kws.add(`paling ${tok}`);
      kws.add(`ter${tok}`);
    }

    // 3. Sinonim semantik dari SYNONYM_MAP (code-based, tidak perlu update saat admin ganti judul)
    const synonyms = SYNONYM_MAP[theme.code] || [];
    for (const syn of synonyms) {
      kws.add(syn);
      // Tambahkan variasi prefiks untuk sinonim tunggal (bukan frasa)
      if (!syn.includes(' ')) {
        kws.add(`paling ${syn}`);
        kws.add(`ter${syn}`);
      }
    }

    return {
      category: theme.code,
      keywords: Array.from(kws).filter(Boolean),
      title: theme.title,
    };
  });
}

/**
 * detectPollingIntent — Deteksi maksud pengguna secara kontekstual.
 *
 * Menerima customThemes dari DB (via getActivePollThemes) sehingga
 * detection selalu sinkron dengan data terbaru yang admin edit.
 * Tidak ada lagi RULE_MAP statis yang perlu di-sync manual.
 */
export function detectPollingIntent(userMessage: string, customThemes?: PollTheme[]): PollIntentResult {
  if (!userMessage || typeof userMessage !== 'string') {
    return { intent: 'GENERAL_CHAT', confidence: 0 };
  }

  const raw = userMessage.trim();
  const text = raw.toLowerCase();
  // Normalisasi typo umum
  const normalized = text
    .replace(/pooling/g, 'polling')
    .replace(/carousell/g, 'carousel');
  const words = normalized.split(/\s+/).filter(Boolean);

  // 1. Cek frasa eksplisit polling/voting
  const hasExplicitPollPhrase = EXPLICIT_POLL_PHRASES.some((phrase) => normalized.includes(phrase));

  // 2. Cek topik resmi kedinasan — jika ada dan bukan polling eksplisit, skip
  const hasFormalTopic = FORMAL_GOV_TOPICS.some((topic) => normalized.includes(topic));
  if (hasFormalTopic && !hasExplicitPollPhrase) {
    return { intent: 'GENERAL_CHAT', confidence: 0 };
  }

  // 3. Bangun aturan dari DB themes (sepenuhnya dinamis)
  const activeRules = buildRulesFromThemes(customThemes);

  // 4. Cari kecocokan tema
  let matchedTheme: string | null = null;
  let matchedTitle: string | null = null;
  for (const rule of activeRules) {
    if (rule.keywords.some((kw) => {
      // Pencocokan kata utuh / frasa, bukan substring acak
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\b|\\s)${escaped}(\\b|\\s|$)`, 'i');
      return regex.test(normalized);
    })) {
      matchedTheme = rule.category;
      matchedTitle = rule.title;
      break;
    }
  }

  // 5. Konteks superlative / kepegawaian
  const hasWho            = /\b(siapa|siapakah)\b/i.test(normalized);
  const hasSuperlative    = /\b(paling|ter)\b/i.test(normalized);
  const hasEmployeeCtx    = /\b(pegawai|staf|staff|asn|pejabat|karyawan|orang|cowok|cewek|pria|wanita|dkpp|kantor|dinas)\b/i.test(normalized);
  const isEmployeeInquiry = (hasWho && hasSuperlative) || (hasEmployeeCtx && hasSuperlative) || (hasWho && hasEmployeeCtx);

  // 6. Deteksi permintaan Live Carousel
  const isCarouselRequest =
    normalized.includes('carousel') ||
    normalized.includes('karosel') ||
    normalized.includes('live hasil') ||
    normalized.includes('live polling') ||
    normalized.includes('hasil polling') ||
    normalized.includes('hasil voting') ||
    normalized.includes('hasil vote') ||
    normalized.includes('perolehan suara') ||
    normalized.includes('rekap suara') ||
    (normalized.includes('peringkat') && hasEmployeeCtx) ||
    (normalized.includes('podium') && hasEmployeeCtx);

  if (isCarouselRequest) {
    const targetCode = matchedTheme || (customThemes?.[0]?.code || 'cantik');
    return {
      intent: 'EMPLOYEE_POLL',
      category: 'carousel',
      poll_title: `Live Hasil Polling (Carousel - ${targetCode})`,
      confidence: 0.99,
    };
  }

  // 7. Tema spesifik terdeteksi + konteks kepegawaian
  if (matchedTheme) {
    const isShortCommand =
      words.length <= 5 &&
      (normalized.includes('poll') ||
       normalized.includes('vote') ||
       normalized.includes('pilih') ||
       isEmployeeInquiry);

    if (hasExplicitPollPhrase || isEmployeeInquiry || isShortCommand) {
      return {
        intent: 'EMPLOYEE_POLL',
        category: matchedTheme,
        poll_title: matchedTitle || 'Polling Pegawai DKPP',
        confidence: 0.95,
      };
    }
  }

  // 8. Permintaan katalog semua polling
  const isCatalogRequest =
    normalized.includes('katalog polling') ||
    normalized.includes('daftar polling') ||
    normalized.includes('menu polling') ||
    normalized.includes('semua polling') ||
    normalized.includes('list polling') ||
    (normalized.includes('polling pegawai') &&
      (normalized.includes('katalog') ||
       normalized.includes('daftar') ||
       normalized.includes('menu') ||
       normalized.includes('semua')));

  if (isCatalogRequest) {
    return {
      intent: 'EMPLOYEE_POLL',
      category: 'all',
      poll_title: 'Katalog Semua Polling',
      confidence: 0.95,
    };
  }

  // 9. Default: serahkan ke Gemini
  return { intent: 'GENERAL_CHAT', confidence: 0 };
}
