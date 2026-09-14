// ============================================================================
// PERSONALITY CALCULATOR DKPP — Mode Humor Keakraban Internal
// Berdasarkan: Numerologi Pythagoras, Zodiak Barat, Shio, Hari/Bulan/Tahun Lahir
// DISCLAIMER: Dibuat untuk hiburan & refreshing, BUKAN penilaian psikologis resmi.
// ============================================================================

import type { PegawaiHumorItem } from './pegawai_humor';

// ─────────────────────────────────────────────────────────────────────────────
// TABEL KARAKTER NUMEROLOGI
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
  taurus:      { nama: 'Taurus ♉', rentang: '20 Apr–20 Mei', deskripsi: 'Stabil, konsisten, suka kenyamanan — deadline tidak terlalu dikhawatirkan' },
  gemini:      { nama: 'Gemini ♊', rentang: '21 Mei–20 Jun', deskripsi: 'Komunikatif, cepat beradaptasi — ahli multitasking tapi kadang susah fokus' },
  cancer:      { nama: 'Cancer ♋', rentang: '21 Jun–22 Jul', deskripsi: 'Peduli, emosional, protektif — menjaga suasana kantor tetap harmonis' },
  leo:         { nama: 'Leo ♌', rentang: '23 Jul–22 Ags', deskripsi: 'Percaya diri, ekspresif — suka spotlight di rapat besar' },
  virgo:       { nama: 'Virgo ♍', rentang: '23 Ags–22 Sep', deskripsi: 'Detail, teliti, perfeksionis — laporan selalu rapi sampai footnote' },
  libra:       { nama: 'Libra ♎', rentang: '23 Sep–22 Okt', deskripsi: 'Diplomatis, mencari keseimbangan — jago bikin semua pihak setuju' },
  scorpio:     { nama: 'Scorpio ♏', rentang: '23 Okt–21 Nov', deskripsi: 'Intens, fokus, misterius — tahu semua yang terjadi di kantor' },
  sagitarius:  { nama: 'Sagitarius ♐', rentang: '22 Nov–21 Des', deskripsi: 'Optimistis, suka kebebasan — ide banyak, eksekusi perlu dikawal' },
  capricorn:   { nama: 'Capricorn ♑', rentang: '22 Des–19 Jan', deskripsi: 'Disiplin, ambisius — naik pangkat adalah prioritas hidup' },
  aquarius:    { nama: 'Aquarius ♒', rentang: '20 Jan–18 Feb', deskripsi: 'Inovatif, independen — suka sistem baru yang lebih efisien' },
  pisces:      { nama: 'Pisces ♓', rentang: '19 Feb–20 Mar', deskripsi: 'Imajinatif, empatik — kadang melamun di tengah rapat koordinasi' },
};

const SHIO_DATA: Array<{ shio: string; karakter: string; emoji: string }> = [
  { shio: 'Tikus', karakter: 'Cerdas dan adaptif — cepat menemukan solusi di situasi rumit', emoji: '🐭' },
  { shio: 'Kerbau', karakter: 'Tekun dan tahan banting — tidak mudah menyerah walau deadline mepet', emoji: '🐂' },
  { shio: 'Macan', karakter: 'Berani dan tegas — tidak sungkan mengungkapkan pendapat di rapat', emoji: '🐯' },
  { shio: 'Kelinci', karakter: 'Diplomatis dan lembut — suasana kantor lebih damai kalau ada yang ini', emoji: '🐰' },
  { shio: 'Naga', karakter: 'Karismatik dan ambisius — natural leader, aura pimpinan terasa', emoji: '🐲' },
  { shio: 'Ular', karakter: 'Strategis dan misterius — diam-diam sudah punya rencana B dan C', emoji: '🐍' },
  { shio: 'Kuda', karakter: 'Energik dan mandiri — bisa kerja keras tanpa perlu diawasi', emoji: '🐴' },
  { shio: 'Kambing', karakter: 'Kreatif dan sensitif — usulan program selalu unik dan menarik', emoji: '🐑' },
  { shio: 'Monyet', karakter: 'Cerdik dan humoris — bisa mencairkan suasana rapat yang tegang', emoji: '🐵' },
  { shio: 'Ayam', karakter: 'Detail dan percaya diri — tidak ragu mengoreksi laporan yang salah', emoji: '🐔' },
  { shio: 'Anjing', karakter: 'Loyal dan bertanggung jawab — bisa diandalkan untuk tugas penting', emoji: '🐕' },
  { shio: 'Babi', karakter: 'Ramah dan dermawan — selalu siap membantu rekan yang kesulitan', emoji: '🐷' },
];

const LABEL_KECOCOKAN: Array<{ min: number; max: number; label: string; deskripsi: string }> = [
  { min: 90, max: 100, label: '🌟 Duo Seirama', deskripsi: 'Harmonis luar biasa! Satu pikiran, satu tujuan. Rapat jadi cepat selesai.' },
  { min: 75, max: 89,  label: '✅ Partner Kompak', deskripsi: 'Kerja sama solid. Saling melengkapi dengan natural.' },
  { min: 60, max: 74,  label: '🤝 Kolaborasi Menarik', deskripsi: 'Berbeda gaya tapi bisa saling melengkapi kalau ada komunikasi yang baik.' },
  { min: 40, max: 59,  label: '🎭 Beda Gaya, Satu Tujuan', deskripsi: 'Perlu lebih banyak koordinasi. Potensi adu pendapat tapi justru menghasilkan output yang lebih kaya.' },
  { min: 0,  max: 39,  label: '⚡ Potensi Adu Argumen', deskripsi: 'Jangan ditempatkan dalam satu grup WhatsApp tanpa admin. Tapi bisa jadi dinamika yang produktif.' },
];

const NAMA_BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// ─────────────────────────────────────────────────────────────────────────────
// FUNGSI KALKULASI
// ─────────────────────────────────────────────────────────────────────────────

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
// TIPE HASIL ANALISIS
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalisisPegawai {
  nama: string;
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
  narasi_khas: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NARASI KHAS PASANGAN
// ─────────────────────────────────────────────────────────────────────────────

const NARASI_PASANGAN: Array<{ kondisi: (a: number, b: number) => boolean; narasi: string }> = [
  { kondisi: (a,b) => (a===4&&b===7)||(a===7&&b===4), narasi: 'Duet Penata & Pemikir — cocok menyusun laporan, tabel, dan strategi jangka panjang.' },
  { kondisi: (a,b) => (a===5&&b===3)||(a===3&&b===5), narasi: 'Duet Kreatif — ide bisa bermunculan lebih cepat daripada notulen selesai.' },
  { kondisi: (a,b) => (a===8&&b===4)||(a===4&&b===8), narasi: 'Duet Target & Struktur — sangat produktif, tapi perlu kesepakatan siapa yang pegang kendali.' },
  { kondisi: (a,b) => (a===1&&b===9)||(a===9&&b===1), narasi: 'Duet Pemimpin & Pemersatu — satu mengarahkan, satu mengajak semua ikut. Kombinasi langka.' },
  { kondisi: (a,b) => (a===3&&b===6)||(a===6&&b===3), narasi: 'Duet Pelayanan — komunikatif dan peduli, cocok untuk program yang bersentuhan langsung dengan masyarakat.' },
  { kondisi: (a,b) => (a===2&&b===8)||(a===8&&b===2), narasi: 'Duet Diplomasi & Ambisi — satu menyejukkan suasana, satu mendorong target. Rapat bisa produktif.' },
  { kondisi: (a,b) => a===b, narasi: 'Satu frekuensi! Mudah sepakat dalam kerja, tapi variasi sudut pandang tetap penting.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUNGSI UTAMA
// ─────────────────────────────────────────────────────────────────────────────

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

  return {
    nama: pegawai.nama,
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
  const narasiObj = NARASI_PASANGAN.find(n => n.kondisi(ha.angka_hari, hb.angka_hari));

  return {
    pegawai_a: ha,
    pegawai_b: hb,
    skor_kecocokan: skor,
    label: labelObj.label,
    deskripsi_kecocokan: labelObj.deskripsi,
    narasi_khas: narasiObj?.narasi || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DETEKSI QUERY & BUILD CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

export function isPersonalityQuery(userMessage: string): boolean {
  const q = userMessage.toLowerCase();
  const keywords = [
    'kepribadian', 'karakter', 'sifat', 'zodiak', 'shio', 'numerologi',
    'cocok', 'kecocokan', 'pasangan kerja', 'tipe kepribadian',
    'analisis', 'analisa', 'tanggal lahir', 'hari lahir', 'lahirnya',
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra',
    'scorpio', 'sagitarius', 'capricorn', 'aquarius', 'pisces',
    'naga', 'macan', 'monyet', 'ayam', 'anjing', 'tikus', 'kerbau',
    'angka lahir', 'gaya kerja', 'cocok kerja sama',
  ];
  const contextKeywords = ['pegawai', 'dkpp', 'staf', 'asn', ' si ', 'pak ', 'bu ', 'ibu ', 'bapak '];
  const hasKeyword = keywords.some(k => q.includes(k));
  const hasContext = contextKeywords.some(c => q.includes(c));
  return hasKeyword && (hasContext || keywords.filter(k => q.includes(k) && k.length > 8).length > 0);
}

export function buildPersonalityContext(
  userMessage: string,
  dataset: PegawaiHumorItem[]
): string | null {
  if (!isPersonalityQuery(userMessage)) return null;

  const q = userMessage.toLowerCase();

  let ctx = `=== KALKULATOR ANALISIS KEPRIBADIAN PEGAWAI DKPP (MODE HUMOR KEAKRABAN) ===\n`;
  ctx += `DISCLAIMER: Analisis berbasis numerologi & astrologi untuk HIBURAN semata. Bukan penilaian psikologis atau kepegawaian resmi.\n`;
  ctx += `ATURAN AI: Tulis hasil dengan gaya hangat, jenaka, dan santun. WAJIB sertakan disclaimer di akhir. DILARANG menyebut kata negatif seperti "tidak layak" atau "tidak jujur".\n\n`;

  // Cari nama pegawai yang disebut dalam pesan (fuzzy partial match, toleran typo 1 karakter)
  const withData = dataset.filter(p => p.tanggal_lahir);
  const qWords = q.split(/\s+/).filter(w => w.length >= 3);

  const disebut: Array<{ p: PegawaiHumorItem; a: AnalisisPegawai }> = [];

  for (const p of withData) {
    const namaLower = p.nama.toLowerCase();
    const namaTokens = namaLower.split(/[\s,./]+/).filter(t => t.length >= 3);
    const matched = qWords.some(word =>
      namaTokens.some(tok => {
        if (tok.includes(word) || word.includes(tok)) return true;
        // Levenshtein sederhana: toleransi 1 karakter
        if (Math.abs(tok.length - word.length) <= 1 && Math.min(tok.length, word.length) >= 3) {
          let diff = 0;
          const [shorter, longer] = tok.length <= word.length ? [tok, word] : [word, tok];
          let si = 0, li = 0;
          while (si < shorter.length && li < longer.length) {
            if (shorter[si] === longer[li]) { si++; li++; }
            else { diff++; li++; if (diff > 1) break; }
          }
          diff += (longer.length - li);
          return diff <= 1;
        }
        return false;
      })
    );
    if (matched) {
      const a = analisaPegawai(p);
      if (a) disebut.push({ p, a });
    }
  }


  const formatSatu = (a: AnalisisPegawai): string => {
    let s = `📋 ${a.nama.toUpperCase()} | Lahir: ${a.tanggal_display}\n`;
    s += `  🔭 Zodiak: ${a.zodiak.nama} — ${a.zodiak.deskripsi}\n`;
    s += `  ${a.shio.emoji} Shio ${a.shio.shio} — ${a.shio.karakter}\n`;
    s += `  🔢 Angka Hari ${a.angka_hari} → Tipe: ${KARAKTER_ANGKA[a.angka_hari].label} (${KARAKTER_ANGKA[a.angka_hari].deskripsi})\n`;
    s += `  📅 Bulan ${a.angka_bulan} → ${a.karakter_bulan.label}: ${a.karakter_bulan.deskripsi}\n`;
    s += `  🔤 Angka Nama ${a.angka_nama} → Peran: ${KARAKTER_ANGKA[a.angka_nama].label}\n`;
    s += `  ⭐ Skor Kepribadian Gabungan: Tipe ${a.skor_kepribadian} — ${a.karakter_utama.label}\n`;
    s += `  💼 Gaya Kerja (simulatif): ${a.karakter_utama.gaya_kerja}\n`;
    if (a.masa_kerja_tahun) s += `  📆 Masa Kerja: ±${a.masa_kerja_tahun} tahun\n`;
    return s;
  };

  if (disebut.length >= 2) {
    const kecocokan = analisaKecocokan(disebut[0].p, disebut[1].p);
    if (kecocokan) {
      ctx += `=== ANALISIS DUO PEGAWAI ===\n`;
      ctx += formatSatu(kecocokan.pegawai_a) + '\n';
      ctx += formatSatu(kecocokan.pegawai_b) + '\n';
      ctx += `💞 SKOR KECOCOKAN KERJA: ${kecocokan.skor_kecocokan}%\n`;
      ctx += `🏷️ LABEL: ${kecocokan.label}\n`;
      ctx += `💬 DINAMIKA: ${kecocokan.deskripsi_kecocokan}\n`;
      if (kecocokan.narasi_khas) ctx += `✨ NARASI KHUSUS: ${kecocokan.narasi_khas}\n`;
    }
  } else if (disebut.length === 1) {
    ctx += `=== ANALISIS KEPRIBADIAN ===\n`;
    ctx += formatSatu(disebut[0].a);
  } else {
    // Rangkuman umum
    const zodiakCount: Record<string, number> = {};
    const shioCount: Record<string, number> = {};
    for (const p of withData) {
      if (p.tanggal_lahir) {
        const z = hitungZodiak(p.tanggal_lahir).nama;
        const s = hitungShio(p.tanggal_lahir).shio;
        zodiakCount[z] = (zodiakCount[z] || 0) + 1;
        shioCount[s] = (shioCount[s] || 0) + 1;
      }
    }
    const topZodiak = Object.entries(zodiakCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topShio = Object.entries(shioCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

    ctx += `=== PROFIL KEPRIBADIAN KOLEKTIF PEGAWAI DKPP ===\n`;
    ctx += `Total pegawai dengan data tanggal lahir: ${withData.length}\n\n`;
    ctx += `ZODIAK TERBANYAK:\n`;
    topZodiak.forEach(([z, n]) => { ctx += `  ${z}: ${n} pegawai\n`; });
    ctx += `\nSHIO TERBANYAK:\n`;
    topShio.forEach(([s, n]) => { ctx += `  ${s}: ${n} pegawai\n`; });
    ctx += `\nUntuk analisis individu: sebutkan nama spesifik, contoh: "kepribadian Sutisna"\n`;
    ctx += `Untuk kecocokan dua pegawai: "cocok kerja sama Ridwan dan Wahyudi?"\n`;
  }

  ctx += `\n⚠️ DISCLAIMER: Analisis ini dibuat untuk hiburan & refreshing keakraban DKPP. Tidak merepresentasikan penilaian psikologis, kinerja, atau kompetensi kepegawaian resmi.\n`;
  return ctx;
}
