// ============================================================================
// PERSONALITY & REGIONAL COMPATIBILITY CALCULATOR DKPP — Mode Humor Keakraban Internal
// Berdasarkan: Tempat/Kota Lahir (Karakter Budaya Daerah), Numerologi, Zodiak & Shio
// DISCLAIMER: Dibuat untuk hiburan & refreshing keakraban, BUKAN penilaian psikologis resmi.
// ============================================================================

import type { PegawaiHumorItem } from './pegawai_humor';

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROFIL KARAKTER TEMPAT / KOTA LAHIR (BUDAYA DAERAH & ETOS KERJA HUMOR)
// ─────────────────────────────────────────────────────────────────────────────

export interface KarakterDaerah {
  wilayah: string;
  sub_label: string;
  ikon: string;
  karakter_khas: string;
  gaya_kerja: string;
  humor_khas: string;
}

export const KARAKTER_DAERAH_MAP: Record<string, KarakterDaerah> = {
  'pasundan': {
    wilayah: 'Jawa Barat / Tatar Pasundan (Garut, Cianjur, Sukabumi, Bandung, Ciamis, Bogor, Subang)',
    sub_label: 'Urang Sunda (Someah Hade ka Semah)',
    ikon: '🍵',
    karakter_khas: 'Santun, ramah, murah senyum, guyub, diplomatis, dan piawai mencairkan suasana yang kaku.',
    gaya_kerja: 'Mengutamakan keharmonisan tim, komunikasi persuasif nan luwes, kerja produktif dalam suasana santai tanpa drama.',
    humor_khas: 'Bisa mengubah rapat tegang jadi sesi ngopi santai penuh canda tawa tapi target tetap beres.'
  },
  'banten': {
    wilayah: 'Banten (Serang, Cilegon, Pandeglang, Rangkasbitung, Bojonegara, Pulomerak, Tangerang)',
    sub_label: 'Jawara Tangguh & Pejuang Lapangan Banten',
    ikon: '⚔️',
    karakter_khas: 'Lugas, pemberani, berjiwa ksatria, loyalitas tinggi, apa adanya, dan tidak suka bertele-tele.',
    gaya_kerja: 'Eksekutor lapangan yang tanggap dan berdaya juang tinggi, tahan banting di cuaca terik pertanian & pesisir.',
    humor_khas: 'Ceplas-ceplos penuh energi, solidaritas kental, sekali disenggol langsung turun tangan membantu rekan kerja.'
  },
  'mataram_banyumas': {
    wilayah: 'Jawa Tengah & DIY (Banyumas, Kebumen, Magetan, Yogyakarta, Sleman, Gunung Kidul)',
    sub_label: 'Kejawen / Mataraman & Banyumasan (Tekun & Ulet)',
    ikon: '🌾',
    karakter_khas: 'Tekun, sabar, teliti, bersahaja (nrimo ing pandum tapi pekerja keras), sopan dan taat azas.',
    gaya_kerja: 'Sangat rapi dalam administrasi, perencana strategi yang matang, teliti memeriksa data hingga detail terkecil.',
    humor_khas: 'Humor halus penuh makna (guyonan filosofis), diam-diam pekerjaan selesai sebelum tenggat waktu.'
  },
  'betawi': {
    wilayah: 'DKI Jakarta / Betawi',
    sub_label: 'Metropolitan & Betawi Dinamis',
    ikon: '🏙️',
    karakter_khas: 'Spontan, komunikatif, cepat beradaptasi dengan teknologi, berpikiran taktis dan praktis.',
    gaya_kerja: 'Gesit dalam multitasking, menyukai koordinasi cepat via chat, solutif mengatasi bottleneck birokrasi.',
    humor_khas: 'Jago pantun dan celetukan spontan yang bikin suasana kantor selalu hidup dan penuh canda.'
  },
  'sumatera': {
    wilayah: 'Sumatera (Lampung, Bandar Lampung, Teluk Betung, OKU Sumsel, Sumatera Utara)',
    sub_label: 'Sumatera Berani & Visioner',
    ikon: '🦅',
    karakter_khas: 'Berpendirian kokoh, percaya diri tinggi, berjiwa kepemimpinan, lugas dan pantang menyerah.',
    gaya_kerja: 'Fokus pada hasil akhir (result-oriented), berani mengambil keputusan sulit saat situasi mendesak.',
    humor_khas: 'Tegas tapi hangat, gaya bicara berbobot dengan argumen kuat yang meyakinkan semua pihak.'
  },
  'arekan': {
    wilayah: 'Jawa Timur (Surabaya, Magetan, Pantura)',
    sub_label: 'Arekan Gesit & Solutif',
    ikon: '⚡',
    karakter_khas: 'Terbuka, egaliter, pekerja ulet tanpa banyak teori, berani bicara lugas demi kemajuan bersama.',
    gaya_kerja: 'Gerak cepat tanpa banyak birokrasi, mengutamakan eksekusi nyata di lapangan.',
    humor_khas: 'Candaan spontan dan blak-blakan tapi penuh keakraban dan tidak pernah menyimpan dendam.'
  },
  'umum': {
    wilayah: 'Nusantara / Seluruh Indonesia',
    sub_label: 'Pilar Kebhinekaan DKPP',
    ikon: '🇮🇩',
    karakter_khas: 'Adaptif, menjunjung tinggi nilai persatuan dan toleransi, terbuka dengan berbagai latar belakang.',
    gaya_kerja: 'Penyeimbang yang mampu menyatukan berbagai karakter rekan kerja menjadi satu tim solid.',
    humor_khas: 'Fleksibel dan mudah membaur dengan seluruh kelompok di kantor.'
  }
};

export function identifikasiDaerah(tempatLahir?: string | null): KarakterDaerah {
  if (!tempatLahir) return KARAKTER_DAERAH_MAP.umum;
  const t = tempatLahir.toLowerCase();

  if (t.includes('garut') || t.includes('cianjur') || t.includes('sukabumi') || t.includes('bandung') ||
      t.includes('ciamis') || t.includes('bogor') || t.includes('subang') || t.includes('jawa barat') || t.includes('tasik')) {
    return KARAKTER_DAERAH_MAP.pasundan;
  }
  if (t.includes('serang') || t.includes('cilegon') || t.includes('pandeglang') || t.includes('rangkas') ||
      t.includes('lebak') || t.includes('bojonegara') || t.includes('pulomerak') || t.includes('banten') || t.includes('tangerang')) {
    return KARAKTER_DAERAH_MAP.banten;
  }
  if (t.includes('banyumas') || t.includes('kebumen') || t.includes('yogya') || t.includes('jogja') ||
      t.includes('sleman') || t.includes('gunung kidul') || t.includes('solo') || t.includes('semarang') ||
      t.includes('jawa tengah') || t.includes('klaten') || t.includes('purworejo')) {
    return KARAKTER_DAERAH_MAP.mataram_banyumas;
  }
  if (t.includes('jakarta') || t.includes('betawi')) {
    return KARAKTER_DAERAH_MAP.betawi;
  }
  if (t.includes('lampung') || t.includes('palembang') || t.includes('oku') || t.includes('ogan') ||
      t.includes('sumatera') || t.includes('medan') || t.includes('padang') || t.includes('aceh') || t.includes('riau')) {
    return KARAKTER_DAERAH_MAP.sumatera;
  }
  if (t.includes('surabaya') || t.includes('magetan') || t.includes('malang') || t.includes('jawa timur') || t.includes('kediri')) {
    return KARAKTER_DAERAH_MAP.arekan;
  }
  return KARAKTER_DAERAH_MAP.umum;
}

export function analisaKecocokanDaerah(daerahA: KarakterDaerah, daerahB: KarakterDaerah): string {
  const dA = daerahA.sub_label;
  const dB = daerahB.sub_label;

  if (dA === dB) {
    return `🔥 **Duo Kompak Sendaerah (${daerahA.ikon})**: Memiliki ikatan emosional dan frekuensi humor yang sama sejak hari pertama. Koordinasi kerja berlangsung cair, saling paham kode dan candaan khas daerah tanpa perlu banyak penjelasan!`;
  }

  if ((dA.includes('Sunda') && dB.includes('Banten')) || (dA.includes('Banten') && dB.includes('Sunda'))) {
    return `🤝 **Duo Harmoni Pasundan-Banten (🍵 & ⚔️)**: Perpaduan sempurna antara diplomasi santun dan ketegasan aksi lapangan. Staf Sunda memperhalus komunikasi dan negosiasi, sementara staf Banten menjadi penggerak eksekusi yang tak kenal gentar!`;
  }

  if ((dA.includes('Banten') && dB.includes('Mataraman')) || (dA.includes('Mataraman') && dB.includes('Banten'))) {
    return `⚡ **Duo Aksi & Regulasi (⚔️ & 🌾)**: Kombinasi sangat efektif! Rekan Banten bergerak cepat memecahkan kebuntuan di lapangan, sedangkan rekan Jateng/DIY merapikan struktur data, regulasi, dan detail administrasi.`;
  }

  if ((dA.includes('Sunda') && dB.includes('Mataraman')) || (dA.includes('Mataraman') && dB.includes('Sunda'))) {
    return `🕊️ **Duo Rukun & Teliti (🍵 & 🌾)**: Suasana kerja dijamin paling adem dan minim konflik. Sangat tekun menyelesaikan tugas bersama, saling menghormati, dan selalu mengutamakan musyawarah mufakat.`;
  }

  if (dA.includes('Sumatera') || dB.includes('Sumatera')) {
    return `🦅 **Duo Strategis & Berani (🦅)**: Membawa visi berani dan dorongan target tinggi ke dalam tim. Sangat handal saat ditugaskan mengejar deadline mepet atau evaluasi program kerja skala besar.`;
  }

  return `🌟 **Duo Kolaborasi Nusantara (🇮🇩)**: Keberagaman latar belakang daerah menciptakan sinergi kerja yang kaya sudut pandang dan saling melengkapi dalam mencapai target dinas.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TABEL KARAKTER NUMEROLOGI & ASTROLOGI
// ─────────────────────────────────────────────────────────────────────────────

const KARAKTER_ANGKA: Record<number, { label: string; deskripsi: string; gaya_kerja: string }> = {
  1: { label: 'Pemimpin', deskripsi: 'Inisiatif tinggi, suka memulai, percaya diri', gaya_kerja: 'Inisiator proyek, tak sabar dengan kelambatan' },
  2: { label: 'Diplomat', deskripsi: 'Sensitif, suka kerja sama, menjembatani perbedaan', gaya_kerja: 'Penengah konflik, nyaman dengan kerja tim' },
  3: { label: 'Komunikator', deskripsi: 'Ceria, ekspresif, kreatif, mudah bergaul', gaya_kerja: 'Presentasi & sosialisasi program' },
  4: { label: 'Penata Sistem', deskripsi: 'Teratur, disiplin, realistis, suka prosedur', gaya_kerja: 'Penyusun laporan, pengelola administrasi' },
  5: { label: 'Pembawa Perubahan', deskripsi: 'Fleksibel, spontan, suka tantangan baru', gaya_kerja: 'Adaptif di lapangan, cocok tugas dinamis' },
  6: { label: 'Pengayom', deskripsi: 'Peduli, bertanggung jawab, suka membantu', gaya_kerja: 'Pelayanan publik, koordinasi lintas bidang' },
  7: { label: 'Pemikir', deskripsi: 'Analitis, tenang, suka riset dan data', gaya_kerja: 'Analisis kebijakan, kajian teknis mendalam' },
  8: { label: 'Penggerak Target', deskripsi: 'Ambisius, tegas, berorientasi hasil', gaya_kerja: 'Target KPI, realisasi anggaran, evaluasi kinerja' },
  9: { label: 'Pemersatu', deskripsi: 'Humanis, idealis, suka membantu banyak orang', gaya_kerja: 'Program sosial, pemberdayaan masyarakat' },
};

const KARAKTER_BULAN: Record<number, { label: string; deskripsi: string }> = {
  1:  { label: 'Tegas & Bertarget', deskripsi: 'Punya target jelas sejak awal, tidak suka bertele-tele' },
  2:  { label: 'Empatik & Humanis', deskripsi: 'Mudah berempati, peka terhadap perasaan rekan kerja' },
  3:  { label: 'Kreatif & Ekspresif', deskripsi: 'Penuh ide segar, suka variasi dalam pekerjaan' },
  4:  { label: 'Berani & Kompetitif', deskripsi: 'Tidak takut berdebat, semangat tinggi dalam kompetisi' },
  5:  { label: 'Stabil & Nyaman', deskripsi: 'Konsisten, tidak suka perubahan mendadak' },
  6:  { label: 'Komunikatif & Gaul', deskripsi: 'Mudah bergaul, jago networking antar instansi' },
  7:  { label: 'Intuitif & Perhatian', deskripsi: 'Sering merasakan situasi sebelum dijelaskan, penuh perhatian' },
  8:  { label: 'Percaya Diri & Memimpin', deskripsi: 'Natural leader, tidak ragu mengambil keputusan' },
  9:  { label: 'Detail & Analitis', deskripsi: 'Teliti sampai koma dan titik, suka data yang akurat' },
  10: { label: 'Diplomatis & Seimbang', deskripsi: 'Selalu mencari jalan tengah, cocok sebagai mediator' },
  11: { label: 'Intens & Penasaran', deskripsi: 'Tidak mudah puas, suka menggali lebih dalam' },
  12: { label: 'Optimistis & Eksploratif', deskripsi: 'Selalu melihat peluang, semangat di proyek baru' },
};

const KARAKTER_ZODIAK: Record<string, { nama: string; rentang: string; deskripsi: string }> = {
  aries:       { nama: 'Aries ♈', rentang: '21 Mar–19 Apr', deskripsi: 'Spontan, berani, kompetitif — selalu ingin jadi yang pertama selesai' },
  taurus:      { nama: 'Taurus ♉', rentang: '20 Apr–20 Mei', deskripsi: 'Stabil, konsisten, suka kenyamanan — deadline dihadapi dengan tenang' },
  gemini:      { nama: 'Gemini ♊', rentang: '21 Mei–20 Jun', deskripsi: 'Komunikatif, cepat beradaptasi — ahli multitasking dan koordinasi' },
  cancer:      { nama: 'Cancer ♋', rentang: '21 Jun–22 Jul', deskripsi: 'Peduli, emosional, protektif — menjaga suasana kantor tetap harmonis' },
  leo:         { nama: 'Leo ♌', rentang: '23 Jul–22 Ags', deskripsi: 'Percaya diri, ekspresif — tampil memukau di forum rapat' },
  virgo:       { nama: 'Virgo ♍', rentang: '23 Ags–22 Sep', deskripsi: 'Detail, teliti, perfeksionis — laporan selalu rapi dan presisi' },
  libra:       { nama: 'Libra ♎', rentang: '23 Sep–22 Okt', deskripsi: 'Diplomatis, mencari keseimbangan — jago bikin semua pihak sepakat' },
  scorpio:     { nama: 'Scorpio ♏', rentang: '23 Okt–21 Nov', deskripsi: 'Intens, fokus, jeli — memahami dinamika kerja hingga hal mendalam' },
  sagitarius:  { nama: 'Sagitarius ♐', rentang: '22 Nov–21 Des', deskripsi: 'Optimistis, suka inovasi — kaya ide segar untuk program dinas' },
  capricorn:   { nama: 'Capricorn ♑', rentang: '22 Des–19 Jan', deskripsi: 'Disiplin, berdedikasi tinggi — profesional dalam setiap penugasan' },
  aquarius:    { nama: 'Aquarius ♒', rentang: '20 Jan–18 Feb', deskripsi: 'Inovatif, visioner — suka metode kerja cerdas yang efisien' },
  pisces:      { nama: 'Pisces ♓', rentang: '19 Feb–20 Mar', deskripsi: 'Imajinatif, empatik — peka menciptakan suasana kerja nyaman' },
};

const SHIO_DATA: Array<{ shio: string; karakter: string; emoji: string }> = [
  { shio: 'Tikus', karakter: 'Cerdas dan adaptif — cepat menemukan solusi di situasi rumit', emoji: '🐭' },
  { shio: 'Kerbau', karakter: 'Tekun dan tahan banting — tidak mudah menyerah walau deadline mepet', emoji: '🐂' },
  { shio: 'Macan', karakter: 'Berani dan tegas — lugas mengungkapkan gagasan di rapat', emoji: '🐯' },
  { shio: 'Kelinci', karakter: 'Diplomatis dan santun — membawa kedamaian dan ketenangan tim', emoji: '🐰' },
  { shio: 'Naga', karakter: 'Karismatik dan ambisius — aura penggerak tim sangat menonjol', emoji: '🐲' },
  { shio: 'Ular', karakter: 'Strategis dan matang — penuh perhitungan cermat dalam bertindak', emoji: '🐍' },
  { shio: 'Kuda', karakter: 'Energik dan mandiri — gigih menuntaskan tugas secara tuntas', emoji: '🐴' },
  { shio: 'Kambing', karakter: 'Kreatif dan penuh empati — usulan program selalu menarik', emoji: '🐑' },
  { shio: 'Monyet', karakter: 'Cerdik dan humoris — pandai mencairkan ketegangan ruang kerja', emoji: '🐵' },
  { shio: 'Ayam', karakter: 'Detail dan percaya diri — tidak ragu mengoreksi ketidakteraturan', emoji: '🐔' },
  { shio: 'Anjing', karakter: 'Loyal dan berintegritas — rekan kerja paling amanah dan terpercaya', emoji: '🐕' },
  { shio: 'Babi', karakter: 'Ramah dan berhati hangat — selalu siap membantu rekan yang membutuhkan', emoji: '🐷' },
];

const LABEL_KECOCOKAN: Array<{ min: number; max: number; label: string; deskripsi: string }> = [
  { min: 90, max: 100, label: '🌟 Duo Sinergi Emas', deskripsi: 'Harmonis luar biasa! Satu frekuensi dalam berpikir dan bertindak. Koordinasi sangat kilat.' },
  { min: 75, max: 89,  label: '✅ Partner Kerja Kompak', deskripsi: 'Kerja sama solid dan saling melengkapi dengan sangat natural di kantor maupun lapangan.' },
  { min: 60, max: 74,  label: '🤝 Kolaborasi Produktif', deskripsi: 'Berbeda gaya pendekatan namun saling melengkapi jika komunikasi tetap terbuka.' },
  { min: 40, max: 59,  label: '🎭 Kombinasi Unik Lintas Gaya', deskripsi: 'Membutuhkan sinkronisasi awal, tetapi justru melahirkan terobosan kerja yang kreatif.' },
  { min: 0,  max: 39,  label: '⚡ Duet Dinamis Penuh Kejutan', deskripsi: 'Gaya berpikir berbeda jauh, namun sangat dahsyat jika disatukan pada proyek yang butuh check-and-balance.' },
];

const NAMA_BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function reduceDigits(n: number): number {
  while (n > 9) {
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d), 0);
  }
  return n || 9;
}

function hitungAngkaHari(tgl: string): number {
  return reduceDigits(parseInt(tgl.split('-')[2] || '1'));
}

function hitungAngkaTahun(tgl: string): number {
  return reduceDigits(parseInt(tgl.split('-')[0] || '1990'));
}

function hitungShio(tgl: string): typeof SHIO_DATA[0] {
  const year = parseInt(tgl.split('-')[0] || '1990');
  const idx = ((year - 1900) % 12 + 12) % 12;
  return SHIO_DATA[idx];
}

function hitungZodiak(tgl: string): typeof KARAKTER_ZODIAK[string] {
  const month = parseInt(tgl.split('-')[1] || '1');
  const day = parseInt(tgl.split('-')[2] || '1');
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return KARAKTER_ZODIAK.aries;
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return KARAKTER_ZODIAK.taurus;
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return KARAKTER_ZODIAK.gemini;
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return KARAKTER_ZODIAK.cancer;
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return KARAKTER_ZODIAK.leo;
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return KARAKTER_ZODIAK.virgo;
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return KARAKTER_ZODIAK.libra;
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return KARAKTER_ZODIAK.scorpio;
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return KARAKTER_ZODIAK.sagitarius;
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return KARAKTER_ZODIAK.capricorn;
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return KARAKTER_ZODIAK.aquarius;
  return KARAKTER_ZODIAK.pisces;
}

function hitungAngkaNama(nama: string): number {
  const TABEL: Record<string, number> = {
    A:1,J:1,S:1, B:2,K:2,T:2, C:3,L:3,U:3, D:4,M:4,V:4, E:5,N:5,W:5,
    F:6,O:6,X:6, G:7,P:7,Y:7, H:8,Q:8,Z:8, I:9,R:9,
  };
  const namaDepan = nama.split(',')[0].trim().toUpperCase().replace(/[^A-Z]/g, '');
  const total = namaDepan.split('').reduce((sum, ch) => sum + (TABEL[ch] || 0), 0);
  return reduceDigits(total || 1);
}

function hitungSkorKepribadian(angkaHari: number, angkaBulan: number, angkaTahun: number, angkaNama: number): number {
  const raw = (angkaHari * 0.35) + (angkaBulan * 0.20) + (angkaTahun * 0.15) + (angkaNama * 0.30);
  return Math.max(1, Math.min(9, Math.round(raw)));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TIPE ANALISIS
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalisisPegawai {
  nama: string;
  tempat_lahir: string;
  karakter_daerah: KarakterDaerah;
  tanggal_lahir: string;
  tanggal_display: string;
  angka_hari: number;
  angka_bulan: number;
  angka_tahun: number;
  angka_nama: number;
  skor_kepribadian: number;
  karakter_utama: { label: string; deskripsi: string; gaya_kerja: string };
  karakter_bulan: { label: string; deskripsi: string };
  zodiak: { nama: string; rentang: string; deskripsi: string };
  shio: { shio: string; karakter: string; emoji: string };
  masa_kerja_tahun: number | null;
}

export interface AnalisisKecocokan {
  pegawai_a: AnalisisPegawai;
  pegawai_b: AnalisisPegawai;
  skor_kecocokan: number;
  label: string;
  deskripsi_kecocokan: string;
  kecocokan_daerah: string;
}

export function analisaPegawai(pegawai: PegawaiHumorItem): AnalisisPegawai | null {
  if (!pegawai.tanggal_lahir) return null;
  const tgl = pegawai.tanggal_lahir;
  const [y, m, d] = tgl.split('-').map(Number);

  const angka_hari = hitungAngkaHari(tgl);
  const angka_bulan = m;
  const angka_tahun = hitungAngkaTahun(tgl);
  const angka_nama = hitungAngkaNama(pegawai.nama);
  const skor = hitungSkorKepribadian(angka_hari, angka_bulan, angka_tahun, angka_nama);

  let masa_kerja_tahun: number | null = null;
  if (pegawai.tanggal_mulai_kerja_cpns) {
    const tahunCpns = parseInt(pegawai.tanggal_mulai_kerja_cpns.split('-')[0]);
    if (tahunCpns >= 1990 && tahunCpns <= 2030) {
      masa_kerja_tahun = new Date().getFullYear() - tahunCpns;
    }
  }

  const tempat = pegawai.tempat_lahir || 'Banten';
  const kDaerah = identifikasiDaerah(tempat);

  return {
    nama: pegawai.nama,
    tempat_lahir: tempat,
    karakter_daerah: kDaerah,
    tanggal_lahir: tgl,
    tanggal_display: `${d} ${NAMA_BULAN[m]} ${y}`,
    angka_hari,
    angka_bulan,
    angka_tahun,
    angka_nama,
    skor_kepribadian: skor,
    karakter_utama: KARAKTER_ANGKA[skor],
    karakter_bulan: KARAKTER_BULAN[m],
    zodiak: hitungZodiak(tgl),
    shio: hitungShio(tgl),
    masa_kerja_tahun,
  };
}

export function analisaKecocokan(a: PegawaiHumorItem, b: PegawaiHumorItem): AnalisisKecocokan | null {
  const ha = analisaPegawai(a);
  const hb = analisaPegawai(b);
  if (!ha || !hb) return null;

  const skor = Math.max(0, Math.min(100, 100 - Math.abs(ha.skor_kepribadian - hb.skor_kepribadian) * 12));
  const labelObj = LABEL_KECOCOKAN.find(l => skor >= l.min && skor <= l.max) || LABEL_KECOCOKAN[LABEL_KECOCOKAN.length - 1];
  const narasiDaerah = analisaKecocokanDaerah(ha.karakter_daerah, hb.karakter_daerah);

  return {
    pegawai_a: ha,
    pegawai_b: hb,
    skor_kecocokan: skor,
    label: labelObj.label,
    deskripsi_kecocokan: labelObj.deskripsi,
    kecocokan_daerah: narasiDaerah,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DETEKSI QUERY & BUILD CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

export function isPersonalityQuery(userMessage: string): boolean {
  const q = userMessage.toLowerCase();
  const keywords = [
    'kepribadian', 'karakter', 'sifat', 'zodiak', 'shio', 'numerologi',
    'cocok', 'kecocokan', 'pasangan kerja', 'tipe kepribadian',
    'analisis', 'analisa', 'tanggal lahir', 'hari lahir', 'lahirnya',
    'tempat lahir', 'kota lahir', 'asal daerah', 'kota asal', 'sunda', 'jawa barat',
    'banten', 'orang serang', 'orang cilegon', 'orang jawa', 'banyumas', 'garut',
    'cianjur', 'sukabumi', 'lampung', 'jakarta', 'gaya kerja', 'cocok kerja sama'
  ];
  const contextKeywords = ['pegawai', 'dkpp', 'staf', 'asn', ' si ', 'pak ', 'bu ', 'ibu ', 'bapak '];
  const hasKeyword = keywords.some(k => q.includes(k));
  const hasContext = contextKeywords.some(c => q.includes(c));
  return hasKeyword && (hasContext || keywords.filter(k => q.includes(k) && k.length > 7).length > 0);
}

export function buildPersonalityContext(
  userMessage: string,
  dataset: PegawaiHumorItem[]
): string | null {
  if (!isPersonalityQuery(userMessage)) return null;

  const q = userMessage.toLowerCase();

  let ctx = `=== KALKULATOR ANALISIS KEPRIBADIAN & TEMPAT LAHIR PEGAWAI DKPP (MODE HUMOR KEAKRABAN) ===\n`;
  ctx += `DISCLAIMER: Analisis berbasis karakter daerah kelahiran, numerologi, dan zodiak untuk HIBURAN & REFRESHING semata. Bukan penilaian psikologis atau kepegawaian resmi.\n`;
  ctx += `ATURAN AI: Tulis hasil dengan gaya hangat, cerdas, jenaka, dan santun. Angkat keunikan karakter daerah lahir (misal: urang Sunda/Jawa Barat yang santun & guyub, Banten yang lugas & pemberani, Banyumas/Jateng yang tekun & teliti, Sumatera yang tegas, dll.). WAJIB sertakan disclaimer di akhir.\n\n`;

  const withData = dataset.filter(p => p.tanggal_lahir);
  const qWords = q.split(/\s+/).filter(w => w.length >= 3);

  const disebut: Array<{ p: PegawaiHumorItem; a: AnalisisPegawai }> = [];

  for (const p of withData) {
    const namaLower = p.nama.toLowerCase();
    const namaTokens = namaLower.split(/[\s,./]+/).filter(t => t.length >= 3);
    const matched = qWords.some(word =>
      namaTokens.some(tok => tok.includes(word) || word.includes(tok))
    );
    if (matched) {
      const a = analisaPegawai(p);
      if (a) disebut.push({ p, a });
    }
  }

  const formatSatu = (a: AnalisisPegawai): string => {
    let s = `📋 **${a.nama.toUpperCase()}** | Tempat Lahir: **${a.tempat_lahir}** | Lahir: ${a.tanggal_display}\n`;
    s += `  ${a.karakter_daerah.ikon} **Asal Daerah / Kultur**: ${a.karakter_daerah.sub_label}\n`;
    s += `  🎭 **Karakter Khas Daerah**: ${a.karakter_daerah.karakter_khas}\n`;
    s += `  💼 **Etos & Gaya Kerja Tim**: ${a.karakter_daerah.gaya_kerja}\n`;
    s += `  ☕ **Sentuhan Humor**: ${a.karakter_daerah.humor_khas}\n`;
    s += `  🔭 **Zodiak & Shio**: ${a.zodiak.nama} (${a.zodiak.deskripsi}) | ${a.shio.emoji} Shio ${a.shio.shio}\n`;
    s += `  ⭐ **Skor Karakter Numerologi**: Tipe ${a.skor_kepribadian} (${a.karakter_utama.label} — ${a.karakter_utama.gaya_kerja})\n`;
    if (a.masa_kerja_tahun) s += `  📆 **Masa Pengabdian**: ±${a.masa_kerja_tahun} tahun\n`;
    return s;
  };

  if (disebut.length >= 2) {
    const kecocokan = analisaKecocokan(disebut[0].p, disebut[1].p);
    if (kecocokan) {
      ctx += `=== ANALISIS DUET & KECOCOKAN KOTA LAHIR PEGAWAI ===\n`;
      ctx += formatSatu(kecocokan.pegawai_a) + '\n';
      ctx += formatSatu(kecocokan.pegawai_b) + '\n';
      ctx += `💞 **SKOR KECOCOKAN KERJA SAMA**: ${kecocokan.skor_kecocokan}%\n`;
      ctx += `🏷️ **PREDIKAT DUO**: ${kecocokan.label}\n`;
      ctx += `💬 **DINAMIKA KOLABORASI**: ${kecocokan.deskripsi_kecocokan}\n`;
      ctx += `🌍 **ANALISIS DINAMIKA ASAL DAERAH**: ${kecocokan.kecocokan_daerah}\n`;
    }
  } else if (disebut.length === 1) {
    ctx += `=== PROFIL KEPRIBADIAN & TEMPAT LAHIR INDIVIDUAL ===\n`;
    ctx += formatSatu(disebut[0].a);
  } else {
    // Ringkasan daerah kelahiran di DKPP
    ctx += `=== SEBARAN ASAL KOTA/DAERAH LAHIR PEGAWAI DKPP (KEBHINEKAAN INTERNAL) ===\n`;
    ctx += `DKPP Kota Cilegon memiliki pegawai dari berbagai latar belakang daerah:\n`;
    ctx += `• ⚔️ **Banten (Serang, Cilegon, Pandeglang)**: Pilar utama penggerak lapangan dengan keteguhan dan daya juang tinggi.\n`;
    ctx += `• 🍵 **Jawa Barat / Pasundan (Garut, Sukabumi, Cianjur, Bandung, Ciamis)**: Membawa keteduhan, diplomasi santun, dan humor yang mencairkan suasana.\n`;
    ctx += `• 🌾 **Jawa Tengah & DIY (Banyumas, Kebumen, Jogja)**: Pilar ketelitian regulasi, ketekunan riset, dan kerapihan administrasi.\n`;
    ctx += `• 🏙️ **Betawi / Jakarta & 🦅 Sumatera**: Pilar dinamisme, ketegasan visi, dan kecepatan eksekusi.\n\n`;
    ctx += `Sebutkan nama pegawai (misal: *"Bagaimana kecocokan kerja sama Pak Sutisna dan Pak Paulus berdasarkan kota lahirnya?"*) untuk analisis humor mendalam!\n`;
  }

  ctx += `\n⚠️ DISCLAIMER: Analisis ini dibuat khusus untuk hiburan, keakraban, dan apresiasi keberagaman budaya di lingkungan DKPP Kota Cilegon. Tidak mewakili evaluasi kinerja resmi instansi.\n`;
  return ctx;
}
