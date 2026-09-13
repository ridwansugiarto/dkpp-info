export interface PegawaiInternalItem {
  id: string;
  nip: string;
  nama: string;
  npwp?: string | null;
  kelas_jabatan?: string | null;
  jabatan: string;
  status_pegawai: string;
  bidang: string;
  golongan?: string | null;
  is_sensitive: boolean;
  is_active: boolean;
}

export const OFFICIAL_DKPP_PEGAWAI: PegawaiInternalItem[] = [
  {
    "id": "asn-1",
    "nip": "197002211999032002",
    "nama": "Efa Sarifah, ST, MT",
    "npwp": "48.167.534.6-417.000",
    "kelas_jabatan": "14",
    "jabatan": "Plt. Kepala Dinas",
    "status_pegawai": "Struktural",
    "bidang": "Pimpinan",
    "golongan": "IV/c",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-2",
    "nip": "197609241996031002",
    "nama": "Agus Purmono, A.P, MM",
    "npwp": null,
    "kelas_jabatan": "11",
    "jabatan": "Sekretaris",
    "status_pegawai": "Struktural",
    "bidang": "Sekretariat",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-3",
    "nip": "196807311997032004",
    "nama": "Ir. Lira Yuliantina, MM",
    "npwp": "48.167.957.9-417.000",
    "kelas_jabatan": "11",
    "jabatan": "Kepala Bidang Perikanan",
    "status_pegawai": "Struktural",
    "bidang": "Perikanan",
    "golongan": "IV/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-4",
    "nip": "196912141992032005",
    "nama": "Cahyaning Sukarti S.K.M, MM",
    "npwp": null,
    "kelas_jabatan": "11",
    "jabatan": "Kepala Bidang Konsumsi dan Keamanan Pangan",
    "status_pegawai": "Struktural",
    "bidang": "Ketahanan Pangan",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-5",
    "nip": "196806292002121003",
    "nama": "H. Mustofa, Sos,Msi",
    "npwp": null,
    "kelas_jabatan": "11",
    "jabatan": "Kepala BidangPertanian",
    "status_pegawai": "Struktural",
    "bidang": "Pertanian",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-6",
    "nip": "196912122002122004",
    "nama": "Drh. Hj. Dina Safitri",
    "npwp": "48.167.961.1-417.000",
    "kelas_jabatan": "9",
    "jabatan": "Medik Veteriner Ahli Muda",
    "status_pegawai": "Fungsional",
    "bidang": "Peternakan & Keswan",
    "golongan": "IV/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-7",
    "nip": "196601082002121004",
    "nama": "H.M.Muchtar,S.Sos,M.Si",
    "npwp": "78.678.925.5-401.000",
    "kelas_jabatan": "10",
    "jabatan": "Analis Ketahanan Pangan ahli Muda",
    "status_pegawai": "Fungsional",
    "bidang": "Ketahanan Pangan",
    "golongan": "IV/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-8",
    "nip": "197707022002121004",
    "nama": "Moch. Dwinanda Y,S.Pt",
    "npwp": "48.167.976.9-417.000",
    "kelas_jabatan": "10",
    "jabatan": "Analis Ketahanan Pangna Ahli Muda Subkoor",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-9",
    "nip": "197604152002121006",
    "nama": "Sutisna, SP",
    "npwp": "48.167.977-417.000",
    "kelas_jabatan": "9",
    "jabatan": "Pengawas Mutu Hasil Pertanian",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-10",
    "nip": "197204081998021002",
    "nama": "Udin Saprudin, SE, M.M.",
    "npwp": "09.174.252.8-417.000",
    "kelas_jabatan": "9",
    "jabatan": "Kepala UPTD Budidaya Air Tawar dan Air Payau",
    "status_pegawai": "Struktural",
    "bidang": "Perikanan",
    "golongan": "IV/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-11",
    "nip": "197912232010011009",
    "nama": "Djadjat Djatnika, S.IP",
    "npwp": "69.821.420.2.417.000",
    "kelas_jabatan": "8",
    "jabatan": "Kasubag TU UPTD Kawasan Pertanian Terpadu",
    "status_pegawai": "Struktural",
    "bidang": "Pertanian",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-12",
    "nip": "197610182002121002",
    "nama": "Ridwan Sugiarto, Spi",
    "npwp": "48.167.978.5-417.000",
    "kelas_jabatan": "10",
    "jabatan": "Analis Ketahanan Pangan Ahli Muda",
    "status_pegawai": "Fungsional",
    "bidang": "Ketahanan Pangan",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-13",
    "nip": "197602132005011003",
    "nama": "Anugroho Nur W, S.Pt",
    "npwp": "48.167.985.0-417.000",
    "kelas_jabatan": "9",
    "jabatan": "Pengawas Mutu Hasil Pertanian - Ahli Muda",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-14",
    "nip": "197703142006041012",
    "nama": "Abdul Latif, S.KH.",
    "npwp": "48.167.987.6-417.000",
    "kelas_jabatan": "9",
    "jabatan": "Kepala UPTD Rumah Potong Hewan dan Pasar Hewan",
    "status_pegawai": "Struktural",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-15",
    "nip": "197511132010012006",
    "nama": "Liva Widiaty, SE, MM",
    "npwp": "77.435.655.4-401.000",
    "kelas_jabatan": "9",
    "jabatan": "Kepala Sub Bagian Umum dan Kepegawaian",
    "status_pegawai": "Struktural",
    "bidang": "Sekretariat",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-16",
    "nip": "198203202010011017",
    "nama": "drh. Abraham Syah",
    "npwp": "59.676.544.6-417.000",
    "kelas_jabatan": "9",
    "jabatan": "Medik Veteriner Ahli Muda",
    "status_pegawai": "Fungsional",
    "bidang": "Peternakan & Keswan",
    "golongan": "IV/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-17",
    "nip": "197508212008032001",
    "nama": "Yessy Desvia, SP",
    "npwp": "89.926.400.6.417.000",
    "kelas_jabatan": "10",
    "jabatan": "Analais Ketahanan Pangan Ahli Muda",
    "status_pegawai": "Fungsional",
    "bidang": "Ketahanan Pangan",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-18",
    "nip": "197708102007011011",
    "nama": "Wahyudi, SE",
    "npwp": "89.062.139.4-417.000",
    "kelas_jabatan": "8",
    "jabatan": "Kasubag Tata Usaha UPTD Rumah Potong Hewan dan Pasar Hewan",
    "status_pegawai": "Struktural",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-19",
    "nip": "198508292010011008",
    "nama": "Ari Priyatna, SP",
    "npwp": "89.062.145.1-417.000",
    "kelas_jabatan": "9",
    "jabatan": "Pengawas Mutu Hasil Pertanian Ahli Muda Subkoor",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-20",
    "nip": "198207232009012001",
    "nama": "Adelina Andi Wiani Putri, SE",
    "npwp": "77.453.047.1-417.000",
    "kelas_jabatan": "8",
    "jabatan": "Kasubag TU UPTD Budidaya Air Tawar dan Air Payau",
    "status_pegawai": "Struktural",
    "bidang": "Perikanan",
    "golongan": "III/c",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-21",
    "nip": "197104092008011004",
    "nama": "Uki Rofika, SE",
    "npwp": "77.100.953.7-417.000",
    "kelas_jabatan": "7",
    "jabatan": "Analis Pangan",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-22",
    "nip": "197603162009011003",
    "nama": "Paulus Dwi  Ari K D, ST",
    "npwp": "77.435.534.1-417.000",
    "kelas_jabatan": "7",
    "jabatan": "Analis Kelautan dan Perikanan",
    "status_pegawai": "Fungsional",
    "bidang": "Perikanan",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-23",
    "nip": "197712262010011006",
    "nama": "Hafid Dasuki, S.Pt",
    "npwp": "89.060.242.8-417.000",
    "kelas_jabatan": "7",
    "jabatan": "Pengawas Mutu Bibit Ternak",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-24",
    "nip": "197910162010012008",
    "nama": "Winda Ratnasari, SP",
    "npwp": "89.060.243.6-417.000",
    "kelas_jabatan": "7",
    "jabatan": "Analis Pangan",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-25",
    "nip": "198111032010012005",
    "nama": "Sanlin Novitriana, SP",
    "npwp": "89.060.241.0-417.000",
    "kelas_jabatan": "7",
    "jabatan": "Penyusun Teknis Usaha Budidaya",
    "status_pegawai": "Fungsional",
    "bidang": "Perikanan",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-26",
    "nip": "198209262010012005",
    "nama": "Linda Setiawati, SP",
    "npwp": "89.062.144.4-417.000",
    "kelas_jabatan": "9",
    "jabatan": "Pengawas Mutu Hasil Pertanian",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-27",
    "nip": "198602152010012006",
    "nama": "Febrika Indah Cahyani, SE, MM",
    "npwp": "68.125.319.1-417.000",
    "kelas_jabatan": "7",
    "jabatan": "Pengawas Sanitasi Usaha Peternakan, dan Kesehatan Masyarakat Veteriner",
    "status_pegawai": "Fungsional",
    "bidang": "Peternakan & Keswan",
    "golongan": "III/d",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-28",
    "nip": "198203222010012008",
    "nama": "Maryori, S.Pi",
    "npwp": "89.062.140.2-417.000",
    "kelas_jabatan": "7",
    "jabatan": "Penyusun kebutuhan barang inventaris",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/c",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-29",
    "nip": "198005242006042018",
    "nama": "Meisaroh, SE",
    "npwp": "77.100.950.3-417.000",
    "kelas_jabatan": "10",
    "jabatan": "Analais Ketahanan Pangan Ahli Muda",
    "status_pegawai": "Fungsional",
    "bidang": "Ketahanan Pangan",
    "golongan": "III/b",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-30",
    "nip": "197105042008011008",
    "nama": "Kusnadi, SE",
    "npwp": "77.100.952.9-401.000",
    "kelas_jabatan": "7",
    "jabatan": "Analis Pola Konsumsi Pangan Masyarakat",
    "status_pegawai": "Fungsional",
    "bidang": "Ketahanan Pangan",
    "golongan": "III/c",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-31",
    "nip": "197705252008011010",
    "nama": "Arifudin, SP",
    "npwp": "77.100.939.6.417.000",
    "kelas_jabatan": "7",
    "jabatan": "Pengawas pupuk dan pestisida",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/c",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-32",
    "nip": "198611152009011001",
    "nama": "Mas Akhmad Rangga P, SE, MM",
    "npwp": "35.865.766.6.401.000",
    "kelas_jabatan": "7",
    "jabatan": "Pengawas Mutu Bibit Ternak",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/c",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-33",
    "nip": "197804052006041006",
    "nama": "Amiruddin, SE",
    "npwp": "48.167.991.8.417.000",
    "kelas_jabatan": "7",
    "jabatan": "Bendahara",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/b",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-34",
    "nip": "197710052008012010",
    "nama": "Lina Octavia, A.Md",
    "npwp": "77.100.951.1-417.000",
    "kelas_jabatan": "6",
    "jabatan": "Pengelola ketahanan pangan",
    "status_pegawai": "Fungsional",
    "bidang": "Ketahanan Pangan",
    "golongan": "III/b",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-35",
    "nip": "198908242015032006",
    "nama": "Ghesika Tiandra Yusty, SP",
    "npwp": "73.209.358.8-324.000",
    "kelas_jabatan": "7",
    "jabatan": "Analis proses akreditasi lembaga sertifikasi produk, personel, halal pangan organik",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/b",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-36",
    "nip": "198407212017062001",
    "nama": "Shofi Nur Prihatin, SP",
    "npwp": "72.108.439.0-419.000",
    "kelas_jabatan": "9",
    "jabatan": "Penyuluh Pertanian Ahli Muda",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "III/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-37",
    "nip": "198907132022211001",
    "nama": "Sandhi Maulana Adha, SP",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Analis Ketahanan Pangan Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Ketahanan Pangan",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-38",
    "nip": "198312162017062001",
    "nama": "Devi Yuningsih, A.Md",
    "npwp": "72.158.616.2-401.000",
    "kelas_jabatan": "6",
    "jabatan": "Penyuluh Pertanian Terampil",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "II/c",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-39",
    "nip": "198107152014062001",
    "nama": "Sri Rahmadani Piliang, SE",
    "npwp": "70.512.021.0-417.000",
    "kelas_jabatan": "7",
    "jabatan": "Bendahara",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "III/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-40",
    "nip": "198705022017061001",
    "nama": "Subandi",
    "npwp": "58.590.082.117.000",
    "kelas_jabatan": "6",
    "jabatan": "Penyuluh Pertanian Terampil",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "II/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-41",
    "nip": "198812312017061001",
    "nama": "Suharyadi",
    "npwp": "89.926.624.3-417.000",
    "kelas_jabatan": "6",
    "jabatan": "Penyuluh Pertanian Terampil",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "II/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-42",
    "nip": "198809182017061001",
    "nama": "Dedi Septriyansa",
    "npwp": "88.286.987.8-417.000",
    "kelas_jabatan": "6",
    "jabatan": "Penyuluh Pertanian Terampil",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "II/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-43",
    "nip": "198503282017061002",
    "nama": "Lahmudin",
    "npwp": "72.164.718.8-417.000",
    "kelas_jabatan": "6",
    "jabatan": "Penyuluh Pertanian Terampil",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "II/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-44",
    "nip": "198507072017061001",
    "nama": "Ahmad Sarbini",
    "npwp": "72.085.256.5-417.000",
    "kelas_jabatan": "6",
    "jabatan": "Penyuluh Pertanian Terampil",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": "II/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-45",
    "nip": "197208112014062001",
    "nama": "Nina Masliana",
    "npwp": "70.505.797.4-417.000",
    "kelas_jabatan": "5",
    "jabatan": "Pengelola sarana dan prasarana kantor",
    "status_pegawai": "Fungsional",
    "bidang": "DKPP Kota Cilegon",
    "golongan": "II/a",
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-46",
    "nip": "199510092023211005",
    "nama": "Afri Rizka Amiardi, S.P",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Penyuluh Pertanian-Ahli Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-47",
    "nip": "198308082023211022",
    "nama": "Maruli Setiawan, S.P",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Penyuluh Pertanian-Ahli Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-48",
    "nip": "198207202023211009",
    "nama": "Oja Fakhruroja, S.T",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Penyuluh Pertanian-Ahli Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-49",
    "nip": "199007192023211019",
    "nama": "Endra Purnama, S.P",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Penyuluh Pertanian-Ahli Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-50",
    "nip": "197604232023212005",
    "nama": "Rosmani Butarbutar, S.P",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Penyuluh Pertanian-Ahli Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-51",
    "nip": "197610142023211003",
    "nama": "Muhamad Hamdi, SP",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Penyuluh Pertanian-Ahli Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-52",
    "nip": "199102022023211020",
    "nama": "Yudi Slamet Hidayat, S.P",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Penyuluh Pertanian-Ahli Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Pertanian",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  },
  {
    "id": "asn-53",
    "nip": "198802272023212032",
    "nama": "Erna Febrianti, SP",
    "npwp": null,
    "kelas_jabatan": "8",
    "jabatan": "Analis Ketahanan Pangan-Ahli Pertama",
    "status_pegawai": "Fungsional",
    "bidang": "Ketahanan Pangan",
    "golongan": null,
    "is_sensitive": true,
    "is_active": true
  }
];

export const OFFICIAL_DKPP_THL = [
  {
    "id": "thl-1",
    "nama": "Minarni.SE",
    "status": "TKK",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-2",
    "nama": "Santawi",
    "status": "TKK",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-3",
    "nama": "Ghoni Syafiulloh, S.Ak",
    "status": "TKK",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-4",
    "nama": "Tandis Destalana, SE.MM",
    "status": "TKK",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-5",
    "nama": "Sri Ratnaningsih, S.Pi",
    "status": "TKK",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-6",
    "nama": "Yuki Suryarizki.S.kom",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-7",
    "nama": "Edwin Maulana,SE",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-8",
    "nama": "Ita Titalia",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-9",
    "nama": "Abi Sukarya",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-10",
    "nama": "Ayu Lestari",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-11",
    "nama": "Haryanto",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-12",
    "nama": "Nova Khaerdayanti, A.Md",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-13",
    "nama": "Maisaroh, SP",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-14",
    "nama": "Rusdi",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-15",
    "nama": "Rofiqoh, S.Sos",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-16",
    "nama": "Driantama Bayu Saputra",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-17",
    "nama": "Tomi Mardiyanto",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-18",
    "nama": "Musfiroh, S.Pi",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-19",
    "nama": "Muhamad Farhan.S.Pi",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-20",
    "nama": "Fani Herawati,SP",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-21",
    "nama": "Rizkyullah, SM",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-22",
    "nama": "Mariatul Hofat, SM",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-23",
    "nama": "Hartono",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-24",
    "nama": "F. Mahmud",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-25",
    "nama": "Maskan",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-26",
    "nama": "Mas Adi Maulana.SP",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-27",
    "nama": "Hadiri",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-28",
    "nama": "Asep Qomaruzzaman, S.AP",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-29",
    "nama": "Ayaza Azzahra, S.M",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-30",
    "nama": "Dede Tri Mulyana, SP",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-31",
    "nama": "Ailsa Bhanuwati, A.Md. Vet",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-32",
    "nama": "Maida Rintan Astuti",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-33",
    "nama": "Reza Maulana Muhammad, SP",
    "status": "THL",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-34",
    "nama": "Iyan Rachman, SE",
    "status": "TENAGA KEAMANAN",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-35",
    "nama": "Heri. S.PdI",
    "status": "TENAGA KEAMANAN",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-36",
    "nama": "Iwan",
    "status": "TENAGA KEAMANAN",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-37",
    "nama": "Muhtadi",
    "status": "TENAGA KEAMANAN",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-38",
    "nama": "Ninin Anjani",
    "status": "CLEANING SERVICE",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-39",
    "nama": "Mastufah",
    "status": "CLEANING SERVICE",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-40",
    "nama": "Muhaemin",
    "status": "CLEANING SERVICE",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-41",
    "nama": "Robet Wahid",
    "status": "CLEANING SERVICE",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-42",
    "nama": "Rofiatul Adawiyah",
    "status": "CLEANING SERVICE",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  },
  {
    "id": "thl-43",
    "nama": "Yusuf Supriatna",
    "status": "CLEANING SERVICE",
    "instansi": "Dinas Ketahanan Pangan dan Pertanian Kota Cilegon",
    "is_sensitive": true
  }
];
