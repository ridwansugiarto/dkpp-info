// Master Data Pendukung Internal DKPP (Mode Bercanda / Humor)
// ATURAN KETAT: HANYA PEGAWAI DENGAN SELURUH CELL RATING LENGKAP YANG DIPROSES!
// PEGAWAI DENGAN CELL KOSONG/EMPTY DIKECUALIKAN KARENA SERIUS DAN TIDAK BISA MENERIMA CANDAAN.

export interface PegawaiHumorItem {
  nomor: number | null;
  nama: string;
  jenis_kelamin: 'L' | 'P' | null;
  skor_ketampanan_kecantikan: number; // 1-10
  skor_daya_tarik_aura: number; // 1-10
  jumlah_terpesona: number; // Jumlah orang/penggemar yang terpesona
  skor_rajin_kehadiran: number; // 1-10
  skor_kecerdasan: number; // 1-10
  is_sensitive: boolean;
  kategori: string;
}

// Daftar nama pegawai yang SERIUS (memiliki cell kosong di file Excel)
// DILARANG KERAS memproses nama-nama ini dalam candaan/humor:
export const EXCLUDED_SERIOUS_PEGAWAI: string[] = [
  "H. Mustofa, Sos,Msi",
  "H.M.Muchtar,S.Sos,M.Si",
  "Djadjat Djatnika, S.IP",
  "Anugroho Nur W, S.Pt",
  "drh. Abraham Syah",
  "Ari Priyatna, SP",
  "Uki Rofika, SE",
  "Hafid Dasuki, S.Pt",
  "Amiruddin, SE",
  "Lina Octavia, A.Md",
  "Suharyadi",
  "Dedi Septriyansa",
  "Lahmudin",
  "Ahmad Sarbini",
  "Nina Masliana",
  "Yudi Slamet Hidayat, S.P",
  "Erna Febrianti, SP",
  "Santawi",
  "Ghoni Syafiulloh, S.Ak",
  "Rusdi",
  "Rofiqoh, S.Sos",
  "Musfiroh, S.Pi",
  "Fani Herawati,SP",
  "Rizkyullah, SM",
  "Maskan",
  "Ayaza Azzahra, S.M",
  "Dede Tri Mulyana, SP",
  "Maida Rintan Astuti",
  "Reza Maulana Muhammad, SP",
  "Iyan Rachman, SE",
  "Heri. S.PdI",
  "Muhtadi",
  "Robet Wahid",
  "Rofiatul Adawiyah",
  "Yusuf Supriatna",
  "Efa Sarifah, ST, MT",
  "Agus Purmono, A.P, MM",
  "Ir. Lira Yuliantina, MM",
  "Cahyaning Sukarti S.K.M, MM",
  "Drh. Hj. Dina Safitri",
  "Moch. Dwinanda Y,S.Pt",
  "Liva Widiaty, SE, MM",
  "Yessy Desvia, SP",
  "Adelina Andi Wiani Putri, SE",
  "Meisaroh, SE",
  "Kusnadi, SE",
  "Shofi Nur Prihatin, SP",
  "Devi Yuningsih, A.Md",
  "Afri Rizka Amiardi, S.P",
  "Maruli Setiawan, S.P",
  "Oja Fakhruroja, S.T",
  "Endra Purnama, S.P",
  "Rosmani Butarbutar, S.P",
  "Muhamad Hamdi, SP",
  "Abi Sukarya",
  "Haryanto",
  "Muhamad Farhan.S.Pi",
  "Hartono",
  "F. Mahmud",
  "Iwan",
  "Muhaemin"
];

// Hanya pegawai dengan data lengkap yang bersedia masuk mode humor:
export const OFFICIAL_DKPP_HUMOR_DATA: PegawaiHumorItem[] = [
  {
    "nomor": 9,
    "nama": "Sutisna, SP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 5,
    "skor_rajin_kehadiran": 5,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 10,
    "nama": "Udin Saprudin, SE, M.M.",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 9,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 8,
    "skor_rajin_kehadiran": 4,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 12,
    "nama": "Ridwan Sugiarto, Spi",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 9,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 1,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 14,
    "nama": "Abdul Latif, S.KH.",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 6,
    "jumlah_terpesona": 4,
    "skor_rajin_kehadiran": 7,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 18,
    "nama": "Wahyudi, SE",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 8,
    "jumlah_terpesona": 7,
    "skor_rajin_kehadiran": 6,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 22,
    "nama": "Paulus Dwi  Ari K D, ST",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 10,
    "skor_daya_tarik_aura": 10,
    "jumlah_terpesona": 12,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 5,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 24,
    "nama": "Winda Ratnasari, SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 9,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 10,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 25,
    "nama": "Sanlin Novitriana, SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": 6,
    "jumlah_terpesona": 1,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 26,
    "nama": "Linda Setiawati, SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": 7,
    "jumlah_terpesona": 4,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 27,
    "nama": "Febrika Indah Cahyani, SE, MM",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 4,
    "skor_daya_tarik_aura": 4,
    "jumlah_terpesona": 1,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 28,
    "nama": "Maryori, S.Pi",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 10,
    "jumlah_terpesona": 9,
    "skor_rajin_kehadiran": 7,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 31,
    "nama": "Arifudin, SP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 7,
    "jumlah_terpesona": 3,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 32,
    "nama": "Mas Akhmad Rangga P, SE, MM",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 8,
    "jumlah_terpesona": 5,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 35,
    "nama": "Ghesika Tiandra Yusty, SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 7,
    "jumlah_terpesona": 5,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 37,
    "nama": "Sandhi Maulana Adha, SP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": 8,
    "jumlah_terpesona": 3,
    "skor_rajin_kehadiran": 8,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 39,
    "nama": "Sri Rahmadani Piliang, SE",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 10,
    "skor_daya_tarik_aura": 10,
    "jumlah_terpesona": 10,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 40,
    "nama": "Subandi",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 10,
    "skor_daya_tarik_aura": 10,
    "jumlah_terpesona": 50,
    "skor_rajin_kehadiran": 9,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 54,
    "nama": "Minarni.SE",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 10,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 20,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 57,
    "nama": "Tandis Destalana, SE.MM",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 9,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 9,
    "skor_rajin_kehadiran": 6,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 58,
    "nama": "Sri Ratnaningsih, S.Pi",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 10,
    "skor_daya_tarik_aura": 10,
    "jumlah_terpesona": 30,
    "skor_rajin_kehadiran": 10,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 59,
    "nama": "Yuki Suryarizki.S.kom",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 10,
    "skor_daya_tarik_aura": 10,
    "jumlah_terpesona": 45,
    "skor_rajin_kehadiran": 7,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 60,
    "nama": "Edwin Maulana,SE",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": 8,
    "jumlah_terpesona": 12,
    "skor_rajin_kehadiran": 7,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 61,
    "nama": "Ita Titalia",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": 6,
    "jumlah_terpesona": 5,
    "skor_rajin_kehadiran": 7,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 63,
    "nama": "Ayu Lestari",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": 7,
    "jumlah_terpesona": 5,
    "skor_rajin_kehadiran": 9,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 65,
    "nama": "Nova Khaerdayanti, A.Md",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 8,
    "jumlah_terpesona": 12,
    "skor_rajin_kehadiran": 9,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 66,
    "nama": "Maisaroh, SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 9,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 20,
    "skor_rajin_kehadiran": 9,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 69,
    "nama": "Driantama Bayu Saputra",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 8,
    "skor_rajin_kehadiran": 6,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 70,
    "nama": "Tomi Mardiyanto",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 2,
    "skor_daya_tarik_aura": 2,
    "jumlah_terpesona": 1,
    "skor_rajin_kehadiran": 5,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 75,
    "nama": "Mariatul Hofat, SM",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 7,
    "jumlah_terpesona": 5,
    "skor_rajin_kehadiran": 9,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 79,
    "nama": "Mas Adi Maulana.SP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 8,
    "jumlah_terpesona": 5,
    "skor_rajin_kehadiran": 8,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 80,
    "nama": "Hadiri",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": 4,
    "jumlah_terpesona": 2,
    "skor_rajin_kehadiran": 8,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 81,
    "nama": "Asep Qomaruzzaman, S.AP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 10,
    "skor_daya_tarik_aura": 10,
    "jumlah_terpesona": 48,
    "skor_rajin_kehadiran": 6,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 84,
    "nama": "Ailsa Bhanuwati, A.Md. Vet",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": 8,
    "jumlah_terpesona": 15,
    "skor_rajin_kehadiran": 7,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 91,
    "nama": "Ninin Anjani",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": 7,
    "jumlah_terpesona": 8,
    "skor_rajin_kehadiran": 6,
    "skor_kecerdasan": 5,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 92,
    "nama": "Mastufah",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": 4,
    "jumlah_terpesona": 1,
    "skor_rajin_kehadiran": 6,
    "skor_kecerdasan": 2,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  }
];

// Helper functions untuk merespons pertanyaan santai
export function getTopGanteng(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jenis_kelamin === 'L')
    .sort((a, b) => b.skor_ketampanan_kecantikan - a.skor_ketampanan_kecantikan)
    .slice(0, limit);
}

export function getTopCantik(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jenis_kelamin === 'P')
    .sort((a, b) => b.skor_ketampanan_kecantikan - a.skor_ketampanan_kecantikan)
    .slice(0, limit);
}

export function getTopAura(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .sort((a, b) => b.skor_daya_tarik_aura - a.skor_daya_tarik_aura)
    .slice(0, limit);
}

export function getTopTerpesona(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .sort((a, b) => b.jumlah_terpesona - a.jumlah_terpesona)
    .slice(0, limit);
}

export function getTopCerdas(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .sort((a, b) => b.skor_kecerdasan - a.skor_kecerdasan)
    .slice(0, limit);
}

export function getTopRajin(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .sort((a, b) => b.skor_rajin_kehadiran - a.skor_rajin_kehadiran)
    .slice(0, limit);
}

export function isSeriousEmployee(nama: string): boolean {
  const q = nama.toLowerCase().trim();
  return EXCLUDED_SERIOUS_PEGAWAI.some(ex => ex.toLowerCase().includes(q) || q.includes(ex.toLowerCase()));
}

export function findPegawaiHumorByName(namaQuery: string): PegawaiHumorItem | undefined {
  const q = namaQuery.toLowerCase().trim();
  if (isSeriousEmployee(q)) return undefined; // Proteksi pegawai serius
  return OFFICIAL_DKPP_HUMOR_DATA.find(p => p.nama.toLowerCase().includes(q));
}

/**
 * Deteksi apakah pertanyaan user adalah pertanyaan bercanda / santai seputar pegawai
 */
export function isPegawaiHumorQuery(userMessage: string): boolean {
  const q = userMessage.toLowerCase();
  
  const humorKeywords = [
    'ganteng', 'paling ganteng', 'tampan', 'paling tampan',
    'cantik', 'paling cantik', 'ayu', 'jelita',
    'aura', 'daya tarik', 'kharisma', 'karisma',
    'terpesona', 'terpikat', 'banyak cewek', 'banyak perempuan', 'banyak wanita',
    'paling memikat', 'fans', 'idola',
    'paling rajin', 'rajin', 'paling cerdas', 'paling pintar', 'paling jenius',
    'mode bercanda', 'candaan', 'lucu-lucuan', 'santai'
  ];

  const hasHumorKeyword = humorKeywords.some(k => q.includes(k));
  
  const contextKeywords = [
    'pegawai', 'dkpp', 'staf', 'staff', 'asn', 'internal', 'kantor', 'dinas', 'orang',
    'siapa', 'cowok', 'cewek', 'bapak', 'ibu'
  ];
  const hasContext = contextKeywords.some(c => q.includes(c));

  return hasHumorKeyword && hasContext;
}

/**
 * Bangun teks konteks humor yang relevan untuk AI
 */
export function buildPegawaiHumorContext(userMessage: string): string | null {
  if (!isPegawaiHumorQuery(userMessage)) return null;

  const q = userMessage.toLowerCase();
  let result = `=== MODE BERCANDA / HUMOR INTERNAL PEGAWAI DKPP (SENSITIF - INTERNAL ONLY) ===\n`;
  result += `ATURAN WAJIB & MUTLAK:\n`;
  result += `1. HANYA sebutkan nama-nama yang ada di DAFTAR RESMI MODE BERCANDA di bawah ini (nama yang seluruh ratingnya terisi lengkap).\n`;
  result += `2. DILARANG KERAS menyebutkan nama-nama yang memiliki sel kosong / tidak memiliki rating (seperti Ibu Plt. Kadis Efa Sarifah, Sekretaris Dinas Agus Purmono, Kabid Lira, Kabid Cahyaning, H. Mustofa, dll.) dalam konteks candaan/humor, karena beliau-beliau berkarakter serius dan tidak bisa menerima candaan.\n`;
  result += `3. Jawablah dengan nada yang ramah, hangat, jenaka, dan sopan, diakhiri dengan catatan santai bahwa ini khusus keakraban internal DKPP.\n\n`;

  if (q.includes('ganteng') || q.includes('tampan') || q.includes('cowok')) {
    const topGanteng = getTopGanteng(6);
    result += `DAFTAR PEGAWAI PALING GANTENG / TAMPAN (Hanya yang bersedia bercanda):\n`;
    topGanteng.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Skor Ketampanan: ${p.skor_ketampanan_kecantikan}/10, Aura: ${p.skor_daya_tarik_aura}/10)\n`;
    });
    result += `\n`;
  }

  if (q.includes('cantik') || q.includes('ayu') || q.includes('cewek') || q.includes('wanita')) {
    const topCantik = getTopCantik(6);
    result += `DAFTAR PEGAWAI PALING CANTIK (Hanya yang bersedia bercanda):\n`;
    topCantik.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Skor Kecantikan: ${p.skor_ketampanan_kecantikan}/10, Aura: ${p.skor_daya_tarik_aura}/10)\n`;
    });
    result += `\n`;
  }

  if (q.includes('aura') || q.includes('daya tarik') || q.includes('kharisma') || q.includes('karisma')) {
    const topAura = getTopAura(6);
    result += `DAFTAR PEGAWAI DENGAN AURA / DAYA TARIK TERTINGGI:\n`;
    topAura.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Skor Aura: ${p.skor_daya_tarik_aura}/10)\n`;
    });
    result += `\n`;
  }

  if (q.includes('terpesona') || q.includes('terpikat') || q.includes('fans') || q.includes('perempuan') || q.includes('wanita')) {
    const topTerpesona = getTopTerpesona(6);
    result += `DAFTAR PEGAWAI DENGAN JUMLAH YANG TERPESONA TERBANYAK:\n`;
    topTerpesona.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Mencapai ${p.jumlah_terpesona} orang terpesona)\n`;
    });
    result += `\n`;
  }

  if (q.includes('cerdas') || q.includes('pintar') || q.includes('jenius')) {
    const topCerdas = getTopCerdas(6);
    result += `DAFTAR PEGAWAI DENGAN SKOR KECERDASAN TERTINGGI (Mode Santai):\n`;
    topCerdas.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Skor Kecerdasan: ${p.skor_kecerdasan}/10, Rajin: ${p.skor_rajin_kehadiran}/10)\n`;
    });
    result += `\n`;
  }

  if (q.includes('rajin') || q.includes('hadir') || q.includes('kehadiran')) {
    const topRajin = getTopRajin(6);
    result += `DAFTAR PEGAWAI PALING RAJIN KEHADIRAN (Mode Santai):\n`;
    topRajin.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Skor Kehadiran: ${p.skor_rajin_kehadiran}/10)\n`;
    });
    result += `\n`;
  }

  if (!q.includes('ganteng') && !q.includes('cantik') && !q.includes('aura') && !q.includes('terpesona') && !q.includes('cerdas') && !q.includes('rajin')) {
    result += `RINGKASAN MODE BERCANDA (HANYA PEGAWAI DENGAN RATING LENGKAP):\n`;
    result += `- Paling Ganteng: Paulus Dwi Ari K D, ST, Subandi, Yuki Suryarizki, S.Kom, Asep Qomaruzzaman, S.AP, Ridwan Sugiarto, S.Pi, Udin Saprudin, SE\n`;
    result += `- Paling Cantik: Sri Rahmadani Piliang, SE, Minarni, SE, Sri Ratnaningsih, S.Pi, Winda Ratnasari, SP, Maisaroh, SP\n`;
    result += `- Juara Pemikat Terpesona: Subandi (50 orang), Asep Qomaruzzaman (48 orang), Yuki Suryarizki (45 orang)\n`;
    result += `- Paling Cerdas: Ridwan Sugiarto, S.Pi (10/10), Wahyudi, SE (10/10), Mas Akhmad Rangga P, SE (10/10), Sandhi Maulana Adha, SP (10/10), Asep Qomaruzzaman, S.AP (10/10)\n`;
  }

  return result;
}
