// Master Data Pendukung Internal DKPP (Mode Bercanda / Humor)
// Catatan: Data ini KHUSUS untuk mencairkan suasana jika user bertanya hal santai/bercanda
// DILARANG DICAMPURKAN DENGAN PERTANYAAN SERIUS / FORMAL KEDINASAN

export interface PegawaiHumorItem {
  nomor: number | null;
  nama: string;
  jenis_kelamin: 'L' | 'P' | null;
  skor_ketampanan_kecantikan: number | null; // 1-10
  skor_daya_tarik_aura: number | null; // 1-10
  jumlah_terpesona: number | null; // Jumlah perempuan/penggemar yang terpesona
  skor_rajin_kehadiran: number | null; // 1-10
  skor_kecerdasan: number | null; // 1-10
  is_sensitive: boolean;
  kategori: string;
}

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
  },
  {
    "nomor": 5,
    "nama": "H. Mustofa, Sos,Msi",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 7,
    "nama": "H.M.Muchtar,S.Sos,M.Si",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 11,
    "nama": "Djadjat Djatnika, S.IP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 13,
    "nama": "Anugroho Nur W, S.Pt",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 16,
    "nama": "drh. Abraham Syah",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 19,
    "nama": "Ari Priyatna, SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 21,
    "nama": "Uki Rofika, SE",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 23,
    "nama": "Hafid Dasuki, S.Pt",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 33,
    "nama": "Amiruddin, SE",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 9,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 34,
    "nama": "Lina Octavia, A.Md",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 41,
    "nama": "Suharyadi",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 42,
    "nama": "Dedi Septriyansa",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 43,
    "nama": "Lahmudin",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 5,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 44,
    "nama": "Ahmad Sarbini",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 45,
    "nama": "Nina Masliana",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 5,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 52,
    "nama": "Yudi Slamet Hidayat, S.P",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 5,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 53,
    "nama": "Erna Febrianti, SP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 55,
    "nama": "Santawi",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 56,
    "nama": "Ghoni Syafiulloh, S.Ak",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 67,
    "nama": "Rusdi",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 68,
    "nama": "Rofiqoh, S.Sos",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 4,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 5,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 71,
    "nama": "Musfiroh, S.Pi",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 73,
    "nama": "Fani Herawati,SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 6,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 74,
    "nama": "Rizkyullah, SM",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 78,
    "nama": "Maskan",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 82,
    "nama": "Ayaza Azzahra, S.M",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 8,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 83,
    "nama": "Dede Tri Mulyana, SP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 6,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 5,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 85,
    "nama": "Maida Rintan Astuti",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 86,
    "nama": "Reza Maulana Muhammad, SP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 7,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 87,
    "nama": "Iyan Rachman, SE",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 4,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 3,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 88,
    "nama": "Heri. S.PdI",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 90,
    "nama": "Muhtadi",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 94,
    "nama": "Robet Wahid",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 95,
    "nama": "Rofiatul Adawiyah",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 96,
    "nama": "Yusuf Supriatna",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": 5,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 1,
    "nama": "Efa Sarifah, ST, MT",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 2,
    "nama": "Agus Purmono, A.P, MM",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 3,
    "nama": "Ir. Lira Yuliantina, MM",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 9,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 4,
    "nama": "Cahyaning Sukarti S.K.M, MM",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 7,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 6,
    "nama": "Drh. Hj. Dina Safitri",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 10,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 8,
    "nama": "Moch. Dwinanda Y,S.Pt",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 15,
    "nama": "Liva Widiaty, SE, MM",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 4,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 17,
    "nama": "Yessy Desvia, SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 20,
    "nama": "Adelina Andi Wiani Putri, SE",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": 8,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 29,
    "nama": "Meisaroh, SE",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 30,
    "nama": "Kusnadi, SE",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 36,
    "nama": "Shofi Nur Prihatin, SP",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 38,
    "nama": "Devi Yuningsih, A.Md",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 46,
    "nama": "Afri Rizka Amiardi, S.P",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 47,
    "nama": "Maruli Setiawan, S.P",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 48,
    "nama": "Oja Fakhruroja, S.T",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 49,
    "nama": "Endra Purnama, S.P",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 50,
    "nama": "Rosmani Butarbutar, S.P",
    "jenis_kelamin": "P",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 51,
    "nama": "Muhamad Hamdi, SP",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 62,
    "nama": "Abi Sukarya",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 64,
    "nama": "Haryanto",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 72,
    "nama": "Muhamad Farhan.S.Pi",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 76,
    "nama": "Hartono",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 77,
    "nama": "F. Mahmud",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 89,
    "nama": "Iwan",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  },
  {
    "nomor": 93,
    "nama": "Muhaemin",
    "jenis_kelamin": "L",
    "skor_ketampanan_kecantikan": null,
    "skor_daya_tarik_aura": null,
    "jumlah_terpesona": null,
    "skor_rajin_kehadiran": null,
    "skor_kecerdasan": null,
    "is_sensitive": true,
    "kategori": "MODE_BERCANDA_INTERNAL"
  }
];

// Helper functions untuk merespons pertanyaan santai
export function getTopGanteng(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jenis_kelamin === 'L' && p.skor_ketampanan_kecantikan !== null)
    .sort((a, b) => (b.skor_ketampanan_kecantikan ?? 0) - (a.skor_ketampanan_kecantikan ?? 0))
    .slice(0, limit);
}

export function getTopCantik(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jenis_kelamin === 'P' && p.skor_ketampanan_kecantikan !== null)
    .sort((a, b) => (b.skor_ketampanan_kecantikan ?? 0) - (a.skor_ketampanan_kecantikan ?? 0))
    .slice(0, limit);
}

export function getTopAura(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.skor_daya_tarik_aura !== null)
    .sort((a, b) => (b.skor_daya_tarik_aura ?? 0) - (a.skor_daya_tarik_aura ?? 0))
    .slice(0, limit);
}

export function getTopTerpesona(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jumlah_terpesona !== null)
    .sort((a, b) => (b.jumlah_terpesona ?? 0) - (a.jumlah_terpesona ?? 0))
    .slice(0, limit);
}

export function getTopCerdas(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.skor_kecerdasan !== null)
    .sort((a, b) => (b.skor_kecerdasan ?? 0) - (a.skor_kecerdasan ?? 0))
    .slice(0, limit);
}

export function getTopRajin(limit = 5): PegawaiHumorItem[] {
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.skor_rajin_kehadiran !== null)
    .sort((a, b) => (b.skor_rajin_kehadiran ?? 0) - (a.skor_rajin_kehadiran ?? 0))
    .slice(0, limit);
}

export function findPegawaiHumorByName(namaQuery: string): PegawaiHumorItem | undefined {
  const q = namaQuery.toLowerCase().trim();
  return OFFICIAL_DKPP_HUMOR_DATA.find(p => p.nama.toLowerCase().includes(q));
}

/**
 * Deteksi apakah pertanyaan user adalah pertanyaan bercanda / santai seputar pegawai
 */
export function isPegawaiHumorQuery(userMessage: string): boolean {
  const q = userMessage.toLowerCase();
  
  // Kata kunci humor/santai khusus atribut fisik, pesona, ketampanan, dsb
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
  
  // Harus ada konteks pegawai, dkpp, orang, staf, asn, atau nama orang
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
  result += `CATATAN PENTING: Pertanyaan pengguna terdeteksi sebagai pertanyaan santai/bercanda seputar keakraban pegawai DKPP.\n`;
  result += `Jawablah dengan nada yang ramah, hangat, jenaka, dan sopan. Berikan disclaimer di akhir bahwa ini adalah catatan internal humor/candaan DKPP untuk keakraban bersama, bukan penilaian kedinasan resmi.\n\n`;

  if (q.includes('ganteng') || q.includes('tampan') || q.includes('cowok')) {
    const topGanteng = getTopGanteng(6);
    result += `DAFTAR PEGAWAI PALING GANTENG / TAMPAN (Skor 1-10):\n`;
    topGanteng.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Skor Ketampanan: ${p.skor_ketampanan_kecantikan}/10, Aura: ${p.skor_daya_tarik_aura}/10)\n`;
    });
    result += `\n`;
  }

  if (q.includes('cantik') || q.includes('ayu') || q.includes('cewek') || q.includes('wanita')) {
    const topCantik = getTopCantik(6);
    result += `DAFTAR PEGAWAI PALING CANTIK (Skor 1-10):\n`;
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
    result += `DAFTAR PEGAWAI DENGAN JUMLAH ORANG / WANITA YANG TERPESONA TERBANYAK:\n`;
    topTerpesona.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Mencapai ${p.jumlah_terpesona} orang yang terpikat/terpesona)\n`;
    });
    result += `\n`;
  }

  if (q.includes('cerdas') || q.includes('pintar') || q.includes('jenius')) {
    const topCerdas = getTopCerdas(6);
    result += `DAFTAR PEGAWAI PALING CERDAS / JENIUS:\n`;
    topCerdas.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Skor Kecerdasan: ${p.skor_kecerdasan}/10, Rajin: ${p.skor_rajin_kehadiran}/10)\n`;
    });
    result += `\n`;
  }

  if (q.includes('rajin') || q.includes('hadir') || q.includes('kehadiran')) {
    const topRajin = getTopRajin(6);
    result += `DAFTAR PEGAWAI PALING RAJIN & DISIPLIN KEHADIRAN:\n`;
    topRajin.forEach((p, idx) => {
      result += `${idx + 1}. ${p.nama} (Skor Kehadiran: ${p.skor_rajin_kehadiran}/10)\n`;
    });
    result += `\n`;
  }

  // Jika umum (misal: "siapa saja yang ada di daftar candaan?")
  if (!q.includes('ganteng') && !q.includes('cantik') && !q.includes('aura') && !q.includes('terpesona') && !q.includes('cerdas') && !q.includes('rajin')) {
    result += `RINGKASAN MODE BERCANDA:\n`;
    result += `- Paling Ganteng: Paulus Dwi Ari K D, ST, Subandi, Yuki Suryarizki, S.Kom, Asep Qomaruzzaman, S.AP, Ridwan Sugiarto, S.Pi, Udin Saprudin, SE\n`;
    result += `- Paling Cantik: Sri Rahmadani Piliang, SE, Minarni, SE, Sri Ratnaningsih, S.Pi, Winda Ratnasari, SP, Maisaroh, SP\n`;
    result += `- Juara Pemikat Terpesona: Subandi (50 orang), Asep Qomaruzzaman (48 orang), Yuki Suryarizki (45 orang)\n`;
    result += `- Paling Cerdas: Ridwan Sugiarto, S.Pi (10/10), Wahyudi, SE (10/10), Mas Akhmad Rangga P, SE (10/10), Sandhi Maulana Adha, SP (10/10), Ibu Plt. Kadis Efa Sarifah (10/10)\n`;
  }

  return result;
}
