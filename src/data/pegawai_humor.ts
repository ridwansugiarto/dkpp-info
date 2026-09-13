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

// Rumus Komposit Berstandar Indeks (Skala Persentase: 75% - 99.5%)
export function getIndeksKecantikanNum(p: PegawaiHumorItem): number {
  const base = (p.skor_ketampanan_kecantikan * 5.0) + (p.skor_daya_tarik_aura * 2.8) + (p.skor_rajin_kehadiran * 1.2) + (p.skor_kecerdasan * 0.8);
  const tune = ((p.jumlah_terpesona * 0.03) + ((p.nomor || 1) % 7) * 0.04);
  return Math.min(99.45, Math.max(76.20, base + tune));
}

export function formatIndeksKecantikan(p: PegawaiHumorItem): string {
  return getIndeksKecantikanNum(p).toFixed(2).replace('.', ',') + '%';
}

export function getIndeksKetampananNum(p: PegawaiHumorItem): number {
  const base = (p.skor_ketampanan_kecantikan * 5.0) + (p.skor_daya_tarik_aura * 2.8) + (p.skor_rajin_kehadiran * 1.2) + (p.skor_kecerdasan * 0.8);
  const tune = (Math.min(50, p.jumlah_terpesona) * 0.03) + (((p.nomor || 1) % 5) * 0.03);
  return Math.min(99.35, Math.max(76.20, base + tune));
}

export function formatIndeksKetampanan(p: PegawaiHumorItem): string {
  return getIndeksKetampananNum(p).toFixed(2).replace('.', ',') + '%';
}

export function getIndeksCerdasNum(p: PegawaiHumorItem): number {
  const base = (p.skor_kecerdasan * 6.0) + (p.skor_rajin_kehadiran * 2.5) + (p.skor_daya_tarik_aura * 1.3);
  const tune = (((p.nomor || 1) % 9) * 0.03);
  return Math.min(99.50, Math.max(76.00, base + tune));
}

export function formatIndeksCerdas(p: PegawaiHumorItem): string {
  return getIndeksCerdasNum(p).toFixed(2).replace('.', ',') + '%';
}

export function getIndeksAuraNum(p: PegawaiHumorItem): number {
  const base = (p.skor_daya_tarik_aura * 5.0) + (p.skor_ketampanan_kecantikan * 3.0) + (p.skor_rajin_kehadiran * 1.0) + (Math.min(50, p.jumlah_terpesona) * 0.15);
  const tune = (((p.nomor || 1) % 7) * 0.04);
  return Math.min(99.60, Math.max(76.00, base + tune));
}

export function formatIndeksAura(p: PegawaiHumorItem): string {
  return getIndeksAuraNum(p).toFixed(2).replace('.', ',') + '%';
}

// Helper functions untuk merespons pertanyaan santai
export function getTopGanteng(limit = 6): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jenis_kelamin === 'L')
    .sort((a, b) => getIndeksKetampananNum(b) - getIndeksKetampananNum(a))
    .slice(0, limit);
}

export function getTopCantik(limit = 6): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jenis_kelamin === 'P')
    .sort((a, b) => getIndeksKecantikanNum(b) - getIndeksKecantikanNum(a))
    .slice(0, limit);
}

export function getTopAura(limit = 6): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .sort((a, b) => getIndeksAuraNum(b) - getIndeksAuraNum(a))
    .slice(0, limit);
}

export function getTopCerdas(limit = 6): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .sort((a, b) => getIndeksCerdasNum(b) - getIndeksCerdasNum(a))
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
  result += `ATURAN GAYA JAWABAN & FORMAT (WAJIB DIIKUTI TANPA KECUALI):\n`;
  result += `1. DILARANG KERAS MENAMPILKAN ANGKA MENTAH ATAU SKOR PECAHAN SEPERTI "10/10", "9/10", ATAU "Skor 8"!\n`;
  result += `2. BERIKAN SKOR GABUNGAN DALAM SATUAN INDEKS PERSENTASE (contoh: "1. Sri Rahmadani Piliang, SE — dengan indeks kecantikan komposit 97,66%").\n`;
  result += `3. HANYA proses nama-nama yang ada dalam daftar di bawah ini (yang seluruh datanya terisi). JANGAN PERNAH mencatut nama pimpinan atau pegawai yang dikecualikan.\n`;
  result += `4. Berikan narasi yang santun, elegan, hangat, dan bernada apresiasi keakraban.\n`;
  result += `5. Akhiri jawaban dengan catatan santai bahwa ini bersumber dari catatan internal mode santai/keakraban DKPP.\n\n`;

  if (q.includes('cantik') || q.includes('ayu') || q.includes('cewek') || q.includes('wanita')) {
    const topCantik = getTopCantik(6);
    result += `DAFTAR PEGAWAI PALING CANTIK (DENGAN INDEKS KECANTIKAN KOMPOSIT DALAM PERSENTASE):\n`;
    topCantik.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} — dengan Indeks Kecantikan Komposit sebesar ${formatIndeksKecantikan(p)}\n`;
    });
    result += `\n`;
  } else if (q.includes('ganteng') || q.includes('tampan') || q.includes('cowok')) {
    const topGanteng = getTopGanteng(6);
    result += `DAFTAR PEGAWAI PALING GANTENG / TAMPAN (DENGAN INDEKS KETAMPANAN KOMPOSIT DALAM PERSENTASE):\n`;
    topGanteng.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} — dengan Indeks Ketampanan Komposit sebesar ${formatIndeksKetampanan(p)}\n`;
    });
    result += `\n`;
  } else if (q.includes('aura') || q.includes('daya tarik') || q.includes('kharisma') || q.includes('karisma') || q.includes('terpesona')) {
    const topAura = getTopAura(6);
    result += `DAFTAR PEGAWAI DENGAN DAYA TARIK & AURA TERTINGGI (DENGAN INDEKS AURA KOMPOSIT DALAM PERSENTASE):\n`;
    topAura.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} — dengan Indeks Kharisma/Aura Komposit sebesar ${formatIndeksAura(p)}\n`;
    });
    result += `\n`;
  } else if (q.includes('cerdas') || q.includes('pintar') || q.includes('jenius')) {
    const topCerdas = getTopCerdas(6);
    result += `DAFTAR PEGAWAI DENGAN INDEKS KECERDASAN KOMPOSIT TERTINGGI (DALAM PERSENTASE):\n`;
    topCerdas.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} — dengan Indeks Kecerdasan Komposit sebesar ${formatIndeksCerdas(p)}\n`;
    });
    result += `\n`;
  } else {
    result += `RINGKASAN INDEKS KOMPOSIT MODE SANTAI DKPP:\n`;
    result += `- Indeks Kecantikan Tertinggi: Sri Rahmadani Piliang, SE (97,66%), Sri Ratnaningsih, S.Pi (96,58%), Minarni, SE (95,20%)\n`;
    result += `- Indeks Ketampanan Tertinggi: Subandi (95,10%), Asep Qomaruzzaman, S.AP (94,67%), Paulus Dwi Ari K D, ST (94,42%), Yuki Suryarizki, S.Kom (93,47%)\n`;
    result += `- Indeks Kecerdasan Komposit: Ridwan Sugiarto, S.Pi (96,79%), Mas Akhmad Rangga P, SE, MM (95,55%)\n`;
  }

  return result;
}
