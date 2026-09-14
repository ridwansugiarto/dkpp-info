// Master Data Pendukung Internal DKPP (Mode Bercanda / Humor)
// ATURAN KETAT: HANYA PEGAWAI DENGAN SELURUH CELL RATING LENGKAP YANG DIPROSES!
// PEGAWAI DENGAN CELL KOSONG/EMPTY DIKECUALIKAN KARENA SERIUS DAN TIDAK BISA MENERIMA CANDAAN.

export interface PegawaiHumorItem {
  nomor: number | null;
  nip?: string | null;
  nama: string;
  tanggal_lahir?: string | null; // Format: YYYY-MM-DD (diektrak dari NIP 1-8)
  tanggal_mulai_kerja_cpns?: string | null; // Format: YYYY-MM (diekstrak dari NIP 9-14)
  jenis_kelamin: 'L' | 'P' | null; // L / P (diekstrak dari NIP digit 15: 1=L, 2=P)
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
    "nip": "197604152002121006",
    "nama": "Sutisna, SP",
    "tanggal_lahir": "1976-04-15",
    "tanggal_mulai_kerja_cpns": "2002-12",
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
    "nip": "197204081998021002",
    "nama": "Udin Saprudin, SE, M.M.",
    "tanggal_lahir": "1972-04-08",
    "tanggal_mulai_kerja_cpns": "1998-02",
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
    "nip": "197610182002121002",
    "nama": "Ridwan Sugiarto, Spi",
    "tanggal_lahir": "1976-10-18",
    "tanggal_mulai_kerja_cpns": "2002-12",
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
    "nip": "197703142006041012",
    "nama": "Abdul Latif, S.KH.",
    "tanggal_lahir": "1977-03-14",
    "tanggal_mulai_kerja_cpns": "2006-04",
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
    "nip": "197708102007011011",
    "nama": "Wahyudi, SE",
    "tanggal_lahir": "1977-08-10",
    "tanggal_mulai_kerja_cpns": "2007-01",
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
    "nip": "197603162009011003",
    "nama": "Paulus Dwi  Ari K D, ST",
    "tanggal_lahir": "1976-03-16",
    "tanggal_mulai_kerja_cpns": "2009-01",
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
    "nip": "197910162010012008",
    "nama": "Winda Ratnasari, SP",
    "tanggal_lahir": "1979-10-16",
    "tanggal_mulai_kerja_cpns": "2010-01",
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
    "nip": "198111032010012005",
    "nama": "Sanlin Novitriana, SP",
    "tanggal_lahir": "1981-11-03",
    "tanggal_mulai_kerja_cpns": "2010-01",
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
    "nip": "198209262010012005",
    "nama": "Linda Setiawati, SP",
    "tanggal_lahir": "1982-09-26",
    "tanggal_mulai_kerja_cpns": "2010-01",
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
    "nip": "198602152010012006",
    "nama": "Febrika Indah Cahyani, SE, MM",
    "tanggal_lahir": "1986-02-15",
    "tanggal_mulai_kerja_cpns": "2010-01",
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
    "nip": "198203222010012008",
    "nama": "Maryori, S.Pi",
    "tanggal_lahir": "1982-03-22",
    "tanggal_mulai_kerja_cpns": "2010-01",
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
    "nip": "197705252008011010",
    "nama": "Arifudin, SP",
    "tanggal_lahir": "1977-05-25",
    "tanggal_mulai_kerja_cpns": "2008-01",
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
    "nip": "198611152009011001",
    "nama": "Mas Akhmad Rangga P, SE, MM",
    "tanggal_lahir": "1986-11-15",
    "tanggal_mulai_kerja_cpns": "2009-01",
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
    "nip": "198908242015032006",
    "nama": "Ghesika Tiandra Yusty, SP",
    "tanggal_lahir": "1989-08-24",
    "tanggal_mulai_kerja_cpns": "2015-03",
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
    "nip": "198907132022211001",
    "nama": "Sandhi Maulana Adha, SP",
    "tanggal_lahir": "1989-07-13",
    "tanggal_mulai_kerja_cpns": "2022-21",
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
    "nip": "198107152014062001",
    "nama": "Sri Rahmadani Piliang, SE",
    "tanggal_lahir": "1981-07-15",
    "tanggal_mulai_kerja_cpns": "2014-06",
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
    "nip": "198705022017061001",
    "nama": "Subandi",
    "tanggal_lahir": "1987-05-02",
    "tanggal_mulai_kerja_cpns": "2017-06",
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
    "nip": null,
    "nama": "Minarni.SE",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Tandis Destalana, SE.MM",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Sri Ratnaningsih, S.Pi",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Yuki Suryarizki.S.kom",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Edwin Maulana,SE",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Ita Titalia",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Ayu Lestari",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Nova Khaerdayanti, A.Md",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Maisaroh, SP",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Driantama Bayu Saputra",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Tomi Mardiyanto",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Mariatul Hofat, SM",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Mas Adi Maulana.SP",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Hadiri",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Asep Qomaruzzaman, S.AP",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Ailsa Bhanuwati, A.Md. Vet",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Ninin Anjani",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
    "nip": null,
    "nama": "Mastufah",
    "tanggal_lahir": null,
    "tanggal_mulai_kerja_cpns": null,
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
export function getTopGanteng(dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA, limit = 6): PegawaiHumorItem[] {
  return dataset
    .filter(p => p.jenis_kelamin === 'L')
    .sort((a, b) => getIndeksKetampananNum(b) - getIndeksKetampananNum(a))
    .slice(0, limit);
}

export function getTopCantik(dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA, limit = 6): PegawaiHumorItem[] {
  return dataset
    .filter(p => p.jenis_kelamin === 'P')
    .sort((a, b) => getIndeksKecantikanNum(b) - getIndeksKecantikanNum(a))
    .slice(0, limit);
}

export function getTopAura(dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA, limit = 6): PegawaiHumorItem[] {
  return dataset
    .sort((a, b) => getIndeksAuraNum(b) - getIndeksAuraNum(a))
    .slice(0, limit);
}

export function getTopCerdas(dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA, limit = 6): PegawaiHumorItem[] {
  return dataset
    .sort((a, b) => getIndeksCerdasNum(b) - getIndeksCerdasNum(a))
    .slice(0, limit);
}

export function isSeriousEmployee(nama: string): boolean {
  const q = nama.toLowerCase().trim();
  return EXCLUDED_SERIOUS_PEGAWAI.some(ex => ex.toLowerCase().includes(q) || q.includes(ex.toLowerCase()));
}

export function findPegawaiHumorByName(namaQuery: string, dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA): PegawaiHumorItem | undefined {
  const q = namaQuery.toLowerCase().trim();
  if (isSeriousEmployee(q)) return undefined; // Proteksi pegawai serius
  return dataset.find(p => p.nama.toLowerCase().includes(q));
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
export function buildPegawaiHumorContext(userMessage: string, dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA): string | null {
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
    const topCantik = getTopCantik(dataset, 6);
    result += `DAFTAR PEGAWAI PALING CANTIK (DENGAN INDEKS KECANTIKAN KOMPOSIT DALAM PERSENTASE):\n`;
    topCantik.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} — dengan Indeks Kecantikan Komposit sebesar ${formatIndeksKecantikan(p)}\n`;
    });
    result += `\n`;
  } else if (q.includes('ganteng') || q.includes('tampan') || q.includes('cowok')) {
    const topGanteng = getTopGanteng(dataset, 6);
    result += `DAFTAR PEGAWAI PALING GANTENG / TAMPAN (DENGAN INDEKS KETAMPANAN KOMPOSIT DALAM PERSENTASE):\n`;
    topGanteng.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} — dengan Indeks Ketampanan Komposit sebesar ${formatIndeksKetampanan(p)}\n`;
    });
    result += `\n`;
  } else if (q.includes('aura') || q.includes('daya tarik') || q.includes('kharisma') || q.includes('karisma') || q.includes('terpesona')) {
    const topAura = getTopAura(dataset, 6);
    result += `DAFTAR PEGAWAI DENGAN DAYA TARIK & AURA TERTINGGI (DENGAN INDEKS AURA KOMPOSIT DALAM PERSENTASE):\n`;
    topAura.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} — dengan Indeks Kharisma/Aura Komposit sebesar ${formatIndeksAura(p)}\n`;
    });
    result += `\n`;
  } else if (q.includes('cerdas') || q.includes('pintar') || q.includes('jenius')) {
    const topCerdas = getTopCerdas(dataset, 6);
    result += `DAFTAR PEGAWAI DENGAN INDEKS KECERDASAN KOMPOSIT TERTINGGI (DALAM PERSENTASE):\n`;
    topCerdas.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} — dengan Indeks Kecerdasan Komposit sebesar ${formatIndeksCerdas(p)}\n`;
    });
    result += `\n`;
  } else {
    const topGanteng = getTopGanteng(dataset, 3);
    const topCantik = getTopCantik(dataset, 3);
    result += `RINGKASAN INDEKS KOMPOSIT MODE SANTAI DKPP:\n`;
    result += `- Indeks Kecantikan Tertinggi: ` + topCantik.map(p => `${p.nama} (${formatIndeksKecantikan(p)})`).join(', ') + `\n`;
    result += `- Indeks Ketampanan Tertinggi: ` + topGanteng.map(p => `${p.nama} (${formatIndeksKetampanan(p)})`).join(', ') + `\n`;
  }

  return result;
}
