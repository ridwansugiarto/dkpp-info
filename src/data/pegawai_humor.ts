// Master Data Pendukung Internal DKPP (Mode Bercanda / Humor)
// ATURAN KETAT: HANYA PEGAWAI DENGAN SELURUH CELL RATING LENGKAP YANG DIPROSES!
// PEGAWAI DENGAN CELL KOSONG/EMPTY DIKECUALIKAN KARENA SERIUS DAN TIDAK BISA MENERIMA CANDAAN.

export interface PegawaiHumorItem {
  nomor: number | null;
  nip?: string | null;
  nama: string;
  tempat_lahir?: string | null;
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
    "tempat_lahir": "Bojonegara",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Cilegon",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Tangerang",
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
    "tempat_lahir": "Surabaya",
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
    "tempat_lahir": "Teluk Betung",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Cilegon",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Bandung",
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
    "tempat_lahir": "Bandar Lampung",
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
    "tempat_lahir": "Garut",
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
    "tempat_lahir": "Sumatera Utara",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Rangkas Bitung",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Jakarta",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
    "tempat_lahir": "Serang",
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
  },
  {
    "nomor": 93,
    "nip": "197910162010012008",
    "nama": "Winda Ratnasari",
    "tempat_lahir": "Tangerang",
    "tanggal_lahir": "1979-10-16",
    "tanggal_mulai_kerja_cpns": "2010-01",
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
    "nomor": 94,
    "nip": "197610182002121002",
    "nama": "Ridwan Sugiarto, S.Pi",
    "tempat_lahir": "Cilegon",
    "tanggal_lahir": "1976-10-18",
    "tanggal_mulai_kerja_cpns": "2002-12",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 9,
    "skor_daya_tarik_aura": 9,
    "jumlah_terpesona": 25,
    "skor_rajin_kehadiran": 9,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  }
];

export function isSeriousEmployee(nama: string): boolean {
  const q = nama.toLowerCase().trim();
  return EXCLUDED_SERIOUS_PEGAWAI.some(ex => ex.toLowerCase().includes(q) || q.includes(ex.toLowerCase()));
}

export function findPegawaiHumorByName(namaQuery: string, dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA): PegawaiHumorItem | undefined {
  const q = namaQuery.toLowerCase().trim();
  if (isSeriousEmployee(q)) return undefined;
  return dataset.find(p => p.nama.toLowerCase().includes(q));
}

export function isPegawaiHumorQuery(userMessage: string, dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA): boolean {
  const q = userMessage.toLowerCase();
  const qWords = q.split(/\s+/).filter(w => w.length >= 3);
  const matchedEmployee = dataset.some(p => {
    const namaLower = p.nama.toLowerCase();
    return qWords.some(word => namaLower.includes(word));
  });

  const humorKeywords = [
    'ganteng', 'paling ganteng', 'terganteng', 'tampan', 'paling tampan', 'tertampan', 'cakep', 'tercakep',
    'cantik', 'paling cantik', 'tercantik', 'ayu', 'jelita', 'terjelita', 'manis', 'termanis', 'anggun', 'teranggun',
    'aura', 'daya tarik', 'kharisma', 'karisma',
    'terpesona', 'terpikat',
    'paling rajin', 'rajin', 'terajin', 'paling cerdas', 'cerdas', 'tercerdas', 'paling pintar', 'pintar', 'terpintar', 'paling jenius',
    'mode bercanda', 'candaan', 'lucu-lucuan', 'santai',
    'polling', 'vote', 'favorit', 'royal', 'ter-royal', 'traktir', 'dermawan', 'terdermawan', 'gaptek', 'tergaptek', 'update', 'terupdate'
  ];

  const hasHumorKeyword = humorKeywords.some(k => q.includes(k));
  const contextKeywords = ['pegawai', 'dkpp', 'staf', 'staff', 'asn', 'internal', 'kantor', 'dinas', 'orang', 'siapa', 'cowok', 'cewek'];
  const hasContext = contextKeywords.some(c => q.includes(c));

  return (hasHumorKeyword && (hasContext || matchedEmployee));
}

// Catatan: Algoritma perangkingan statis telah dihapus sesuai arahan fitur Polling Pegawai.
// Hasil peringkat ditentukan secara dinamis dan demokratis melalui voting anonim seluruh pegawai di fitur Polling Pegawai.

/**
 * Bangun teks konteks yang mengarahkan ke Polling Pegawai
 */
export function buildPegawaiHumorContext(userMessage: string, _dataset: PegawaiHumorItem[] = OFFICIAL_DKPP_HUMOR_DATA): string | null {
  if (!isPegawaiHumorQuery(userMessage)) return null;

  return `=== INFORMASI SISTEM POLLING PEGAWAI DKPP ===
Aturan Sistem:
1. Peringkat seperti "Paling Ganteng", "Paling Cantik", "Paling Rajin", "Paling Cerdas", dsb. TIDAK LAGI ditentukan oleh formula atau algoritma statis.
2. Seluruh penilaian kini dilakukan secara DEMOKRATIS, ANONIM, dan REAL-TIME oleh seluruh pegawai terverifikasi melalui Fitur "Polling Pegawai".
3. Setiap pegawai terverifikasi dapat memilih hingga 3 nama favorit untuk setiap tema polling.
4. Beritahu user dengan nada ramah, santai, dan mengajak bahwa mereka dapat melihat hasil voting terkini atau langsung memberikan suaranya pada widget Polling Pegawai yang tersedia di sistem ChatDKPP.`;
}


