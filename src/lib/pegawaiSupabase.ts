import { supabaseAdmin } from './supabaseServer';
import { supabase } from './supabase';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';

export interface PegawaiNipRow {
  id?: string;
  nip: string;
  nama: string;
  jabatan: string;
  bidang: string;
  status_pegawai?: string;
  golongan?: string | null;
  pangkat?: string | null;
  esselon?: string | null;
  kelas_jabatan?: string | null;
  is_active: boolean;
  is_sensitive?: boolean;
}

let cachedPegawaiData: { data: PegawaiNipRow[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

/**
 * Mengambil data pegawai live dari Supabase tabel `dkpp_pegawai_nip`.
 * Mengambil kolom bidang per pegawai dengan caching memori 5 menit.
 * Dilengkapi fallback ke public supabase dan offline dataset.
 */
export async function getLivePegawaiFromSupabase(): Promise<PegawaiNipRow[]> {
  const now = Date.now();
  if (cachedPegawaiData && now - cachedPegawaiData.timestamp < CACHE_TTL_MS) {
    return cachedPegawaiData.data;
  }

  try {
    // 1. Coba ambil melalui supabaseAdmin (service role)
    const { data: adminRows, error: adminErr } = await supabaseAdmin
      .from('dkpp_pegawai_nip')
      .select('*')
      .order('bidang', { ascending: true })
      .order('nama', { ascending: true });

    if (!adminErr && adminRows && adminRows.length > 0) {
      const normalized = adminRows.map((r: any) => ({
        ...r,
        bidang: (r.bidang || 'Lainnya').trim(),
      }));
      cachedPegawaiData = { data: normalized, timestamp: now };
      return normalized;
    }

    if (adminErr) {
      console.warn('[PegawaiSupabase] supabaseAdmin query failed, trying public supabase:', adminErr.message);
    }

    // 2. Coba ambil melalui public supabase client
    const { data: pubRows, error: pubErr } = await supabase
      .from('dkpp_pegawai_nip')
      .select('*')
      .order('bidang', { ascending: true })
      .order('nama', { ascending: true });

    if (!pubErr && pubRows && pubRows.length > 0) {
      const normalized = pubRows.map((r: any) => ({
        ...r,
        bidang: (r.bidang || 'Lainnya').trim(),
      }));
      cachedPegawaiData = { data: normalized, timestamp: now };
      return normalized;
    }

    if (pubErr) {
      console.warn('[PegawaiSupabase] public supabase query failed, falling back to local dataset:', pubErr.message);
    }
  } catch (err) {
    console.error('[PegawaiSupabase] Error fetching dkpp_pegawai_nip:', err);
  }

  // 3. Fallback aman ke OFFICIAL_DKPP_PEGAWAI
  const fallback = OFFICIAL_DKPP_PEGAWAI.map((p) => ({
    id: p.id,
    nip: p.nip,
    nama: p.nama,
    jabatan: p.jabatan,
    bidang: (p.bidang || 'Lainnya').trim(),
    status_pegawai: p.status_pegawai,
    golongan: p.golongan,
    pangkat: p.pangkat,
    esselon: p.esselon,
    kelas_jabatan: p.kelas_jabatan,
    is_active: p.is_active,
    is_sensitive: p.is_sensitive,
  }));
  return fallback;
}

/**
 * Deteksi apakah pengguna menanyakan terkait:
 * 1. Bidang (bidang tertentu / daftar bidang / siapa saja di bidang X)
 * 2. Struktur Pegawai (struktur organisasi, susunan pimpinan/pejabat)
 * 3. Komposisi Pegawai (jumlah pegawai, komposisi PNS/PPPK, statistik pegawai)
 */
export function isBidangStrukturKomposisiQuery(query: string): boolean {
  const q = query.toLowerCase();

  // 1. Kata Kunci Struktur Organisasi / Pegawai
  const strukturKeywords = [
    'struktur pegawai', 'struktur organisasi', 'bagan organisasi', 'susunan pegawai',
    'susunan organisasi', 'hirarki pegawai', 'tata kelola pegawai', 'bagan struktur',
    'pimpinan dinas', 'pejabat struktural', 'pejabat dkpp', 'siapa kadis', 'kepala dinas',
    'sekretaris dinas', 'kepala bidang', 'kabid'
  ];
  if (strukturKeywords.some((k) => q.includes(k))) return true;

  // 2. Kata Kunci Komposisi Pegawai
  const komposisiKeywords = [
    'komposisi pegawai', 'komposisi staf', 'komposisi asn', 'komposisi pns',
    'jumlah pegawai', 'statistik pegawai', 'sebaran pegawai', 'distribusi pegawai',
    'rekap pegawai', 'rekapitulasi pegawai', 'berapa jumlah pegawai', 'berapa pegawai',
    'jumlah pns dan pppk', 'total pegawai', 'populasi pegawai'
  ];
  if (komposisiKeywords.some((k) => q.includes(k))) return true;

  // 3. Kata Kunci Bidang & Subsektor
  const bidangGenericKeywords = [
    'bidang', 'divisi', 'bagian', 'seksi', 'sub bagian', 'subbag', 'upt', 'uptd'
  ];
  const hasGenericBidang = bidangGenericKeywords.some((k) => q.includes(k));

  const specificBidangNames = [
    'pertanian', 'perikanan', 'peternakan', 'keswan', 'kesehatan hewan',
    'ketahanan pangan', 'sekretariat', 'pimpinan', 'upt kpt', 'upt rph',
    'puskeswan', 'ppl', 'penyuluh'
  ];
  const hasSpecificBidang = specificBidangNames.some((k) => q.includes(k));

  const employeeKeywords = [
    'pegawai', 'staf', 'pejabat', 'personil', 'anggota', 'siapa', 'siapa saja',
    'sebutkan', 'daftar', 'ada siapa', 'orang', 'nama', 'tim'
  ];
  const hasEmployeeKeyword = employeeKeywords.some((k) => q.includes(k));

  // Jika menyebut bidang generic + kata terkait pegawai (misal: "sebutkan pegawai bidang...")
  if (hasGenericBidang && hasEmployeeKeyword) return true;

  // Jika menyebut nama bidang spesifik + kata terkait pegawai (misal: "sebutkan semua pegawai di bidang pertanian")
  if (hasSpecificBidang && hasEmployeeKeyword) return true;

  // Jika menanyakan "ada bidang apa saja" atau "daftar bidang"
  if (hasGenericBidang && (q.includes('apa saja') || q.includes('daftar') || q.includes('sebutkan') || q.includes('tampilkan'))) {
    return true;
  }

  return false;
}

/**
 * Membangun konteks prompt berbasis data real-time tabel `dkpp_pegawai_nip`
 * dengan fokus pada kolom `bidang` per pegawai.
 */
export function buildBidangStrukturKomposisiPrompt(
  userQuery: string,
  pegawaiList: PegawaiNipRow[],
  isAuthorized: boolean
): string {
  const q = userQuery.toLowerCase();
  const activePegawai = pegawaiList.filter((p) => p.is_active);

  // Grouping data pegawai berdasarkan kolom `bidang`
  const bidangMap = new Map<string, PegawaiNipRow[]>();
  activePegawai.forEach((p) => {
    const b = (p.bidang || 'Lainnya').trim();
    if (!bidangMap.has(b)) bidangMap.set(b, []);
    bidangMap.get(b)!.push(p);
  });

  let ctx = `=== DATA KEPEGAWAIAN REAL-TIME SUPABASE (TABEL dkpp_pegawai_nip) ===\n`;
  ctx += `SUMBER DATA: Tabel resmi \`public.dkpp_pegawai_nip\` live database DKPP Kota Cilegon.\n`;
  ctx += `TOTAL PEGAWAI AKTIF TERVERIFIKASI: ${activePegawai.length} Orang\n\n`;

  // ─────────────────────────────────────────────────────────────────────────
  // KASUS 1: Pengguna menanyakan BIDANG PERTANIAN secara spesifik
  // ─────────────────────────────────────────────────────────────────────────
  const isPertanianQuery = q.includes('pertanian') && (q.includes('pegawai') || q.includes('sebutkan') || q.includes('siapa') || q.includes('daftar') || q.includes('bidang'));
  if (isPertanianQuery) {
    const stafPertanian = bidangMap.get('Pertanian') || [];
    const pplPertanian = bidangMap.get('PPL Pertanian') || [];
    const uptKpt = bidangMap.get('UPT KPT') || [];
    const totalLingkupPertanian = stafPertanian.length + pplPertanian.length + uptKpt.length;

    ctx += `🚨 INSTRUKSI UTAMA UNTUK AI:\n`;
    ctx += `- Pengguna menanyakan daftar pegawai di bidang Pertanian!\n`;
    ctx += `- Di DKPP Kota Cilegon, lingkup Pertanian terdiri dari 3 sub-unit utama dengan total ${totalLingkupPertanian} orang:\n`;
    ctx += `  1. Bidang Pertanian: ${stafPertanian.length} pegawai\n`;
    ctx += `  2. Penyuluh Pertanian Lapangan (PPL Pertanian): ${pplPertanian.length} penyuluh\n`;
    ctx += `  3. UPTD Kawasan Pertanian Terpadu (UPT KPT): ${uptKpt.length} pejabat/staf teknis\n`;
    ctx += `- WAJIB SEBUTKAN SEMUA NAMA PEGAWAI BERIKUT DENGAN LENGKAP TANPA DILEWATI SATU PUN!\n\n`;

    ctx += `### 1. BIDANG PERTANIAN (${stafPertanian.length} Pegawai Aktif):\n`;
    stafPertanian.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });

    ctx += `\n### 2. PENYULUH PERTANIAN LAPANGAN (PPL PERTANIAN - ${pplPertanian.length} Penyuluh):\n`;
    pplPertanian.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'Fungsional'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });

    ctx += `\n### 3. UPTD KAWASAN PERTANIAN TERPADU (UPT KPT - ${uptKpt.length} Pegawai):\n`;
    uptKpt.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });

    return ctx;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KASUS 2: Pengguna menanyakan BIDANG PETERNAKAN / KESWAN
  // ─────────────────────────────────────────────────────────────────────────
  const isPeternakanQuery = (q.includes('peternakan') || q.includes('keswan') || q.includes('hewan')) && (q.includes('pegawai') || q.includes('sebutkan') || q.includes('siapa') || q.includes('daftar') || q.includes('bidang'));
  if (isPeternakanQuery) {
    const stafTernak = bidangMap.get('Peternakan') || [];
    const uptRph = bidangMap.get('UPT RPH') || [];
    const uptPuskeswan = bidangMap.get('UPT PUSKESWAN') || [];
    const totalTernak = stafTernak.length + uptRph.length + uptPuskeswan.length;

    ctx += `🚨 INSTRUKSI UTAMA UNTUK AI:\n`;
    ctx += `- Pengguna menanyakan pegawai bidang Peternakan / Kesehatan Hewan (Total ${totalTernak} orang).\n`;
    ctx += `- Sebutkan seluruh pegawai di Bidang Peternakan, UPTD RPH, dan UPTD Puskeswan secara lengkap!\n\n`;

    ctx += `### 1. BIDANG PETERNAKAN & KESWAN (${stafTernak.length} Pegawai):\n`;
    stafTernak.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });

    ctx += `\n### 2. UPTD RUMAH POTONG HEWAN & PASAR HEWAN (UPT RPH - ${uptRph.length} Pegawai):\n`;
    uptRph.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });

    ctx += `\n### 3. UPTD PUSAT KESEHATAN HEWAN (UPT PUSKESWAN - ${uptPuskeswan.length} Pegawai):\n`;
    uptPuskeswan.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });

    return ctx;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KASUS 3: Pengguna menanyakan BIDANG KETAHANAN PANGAN
  // ─────────────────────────────────────────────────────────────────────────
  const isKetapangQuery = q.includes('ketahanan pangan') && (q.includes('pegawai') || q.includes('sebutkan') || q.includes('siapa') || q.includes('daftar') || q.includes('bidang'));
  if (isKetapangQuery) {
    const stafKetapang = bidangMap.get('Ketahanan Pangan') || [];
    ctx += `🚨 INSTRUKSI UTAMA UNTUK AI:\n`;
    ctx += `- Pengguna menanyakan pegawai Bidang Ketahanan Pangan (Total ${stafKetapang.length} orang).\n`;
    ctx += `- Sebutkan seluruh daftar pegawai berikut secara bernomor dan lengkap!\n\n`;
    ctx += `### BIDANG KETAHANAN PANGAN (${stafKetapang.length} Pegawai):\n`;
    stafKetapang.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });
    return ctx;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KASUS 4: Pengguna menanyakan BIDANG PERIKANAN
  // ─────────────────────────────────────────────────────────────────────────
  const isPerikananQuery = q.includes('perikanan') && (q.includes('pegawai') || q.includes('sebutkan') || q.includes('siapa') || q.includes('daftar') || q.includes('bidang'));
  if (isPerikananQuery) {
    const stafPerikanan = bidangMap.get('Perikanan') || [];
    ctx += `🚨 INSTRUKSI UTAMA UNTUK AI:\n`;
    ctx += `- Pengguna menanyakan pegawai Bidang Perikanan (Total ${stafPerikanan.length} orang).\n`;
    ctx += `- Sebutkan seluruh daftar pegawai berikut secara bernomor dan lengkap!\n\n`;
    ctx += `### BIDANG PERIKANAN (${stafPerikanan.length} Pegawai):\n`;
    stafPerikanan.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });
    return ctx;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KASUS 5: Pengguna menanyakan SEKRETARIAT
  // ─────────────────────────────────────────────────────────────────────────
  const isSekretariatQuery = (q.includes('sekretariat') || q.includes('umum') || q.includes('kepegawaian') || q.includes('keuangan')) && (q.includes('pegawai') || q.includes('sebutkan') || q.includes('siapa') || q.includes('daftar') || q.includes('bidang'));
  if (isSekretariatQuery) {
    const stafSekretariat = bidangMap.get('Sekretariat') || [];
    ctx += `🚨 INSTRUKSI UTAMA UNTUK AI:\n`;
    ctx += `- Pengguna menanyakan pegawai Sekretariat DKPP (Total ${stafSekretariat.length} orang).\n`;
    ctx += `- Sebutkan pegawai Sekretariat secara lengkap mulai dari pimpinan sekretariat (Sekretaris, Kasubag) hingga pelaksana!\n\n`;
    ctx += `### SEKRETARIAT (${stafSekretariat.length} Pegawai):\n`;
    stafSekretariat.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });
    return ctx;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KASUS 6: Pengguna menanyakan KOMPOSISI PEGAWAI
  // ─────────────────────────────────────────────────────────────────────────
  const isKomposisi = q.includes('komposisi') || q.includes('statistik') || q.includes('rekap') || q.includes('sebaran') || q.includes('jumlah pegawai');
  if (isKomposisi) {
    const pnsCount = activePegawai.filter((p) => p.status_pegawai === 'PNS' || p.status_pegawai === 'Struktural').length;
    const pppkCount = activePegawai.filter((p) => p.status_pegawai === 'PPPK').length;
    const fungsionalCount = activePegawai.filter((p) => p.status_pegawai === 'Fungsional').length;

    ctx += `### 📊 KOMPOSISI DAN STATISTIK PEGAWAI DKPP KOTA CILEGON (TOTAL: ${activePegawai.length} PEGAWAI AKTIF):\n\n`;
    ctx += `#### A. Berdasarkan Status Kepegawaian:\n`;
    ctx += `* 🏛️ **PNS (Pegawai Negeri Sipil):** ${pnsCount} orang (${((pnsCount / activePegawai.length) * 100).toFixed(1)}%)\n`;
    ctx += `* 📑 **PPPK (Pegawai Pemerintah dengan Perjanjian Kerja):** ${pppkCount} orang (${((pppkCount / activePegawai.length) * 100).toFixed(1)}%)\n`;
    ctx += `* 🌾 **Jabatan Fungsional Khusus (Penyuluh):** ${fungsionalCount} orang (${((fungsionalCount / activePegawai.length) * 100).toFixed(1)}%)\n\n`;

    ctx += `#### B. Berdasarkan Bidang / Unit Kerja (Data Kolom \`bidang\` Supabase):\n`;
    const sortedBidang = Array.from(bidangMap.entries()).sort((a, b) => b[1].length - a[1].length);
    sortedBidang.forEach(([namaBidang, list], idx) => {
      const pct = ((list.length / activePegawai.length) * 100).toFixed(1);
      ctx += `${idx + 1}. **${namaBidang}:** ${list.length} pegawai (${pct}%)\n`;
    });

    ctx += `\n💡 Sampaikan komposisi ini secara jelas dan terstruktur dengan bullet point atau tabel.\n`;
    return ctx;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KASUS 7: STRUKTUR PEGAWAI & SELURUH DAFTAR BIDANG (DEFAULT)
  // ─────────────────────────────────────────────────────────────────────────
  ctx += `### 🏛️ STRUKTUR PEGAWAI & DISTRIBUSI BIDANG DKPP KOTA CILEGON (TOTAL: ${activePegawai.length} ORANG):\n\n`;
  
  // 1. Pimpinan
  const pimpinan = bidangMap.get('Pimpinan') || [];
  if (pimpinan.length > 0) {
    ctx += `#### 👑 PIMPINAN DINAS:\n`;
    pimpinan.forEach((p) => {
      ctx += `• **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });
    ctx += `\n`;
  }

  // 2. Seluruh Bidang Lainnya
  const urutanBidang = [
    'Sekretariat',
    'Ketahanan Pangan',
    'Pertanian',
    'PPL Pertanian',
    'Peternakan',
    'Perikanan',
    'UPT KPT',
    'UPT RPH',
    'UPT PUSKESWAN',
  ];

  urutanBidang.forEach((namaB) => {
    const list = bidangMap.get(namaB);
    if (!list || list.length === 0) return;
    ctx += `#### 📁 ${namaB.toUpperCase()} (${list.length} Pegawai):\n`;
    list.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });
    ctx += `\n`;
  });

  // Jika ada bidang lain di luar urutan
  bidangMap.forEach((list, namaB) => {
    if (namaB === 'Pimpinan' || urutanBidang.includes(namaB)) return;
    ctx += `#### 📁 ${namaB.toUpperCase()} (${list.length} Pegawai):\n`;
    list.forEach((p, idx) => {
      ctx += `${idx + 1}. **${p.nama}** — ${p.jabatan} [Status: ${p.status_pegawai || 'PNS'}]${isAuthorized ? ` (NIP: ${p.nip})` : ''}\n`;
    });
    ctx += `\n`;
  });

  ctx += `⚠️ INSTRUKSI AI:\n`;
  ctx += `- Gunakan data di atas untuk menjawab struktur dan komposisi pegawai secara akurat.\n`;
  ctx += `- Ketika pengguna meminta daftar pegawai di bidang tertentu, cantumkan semua nama yang tertera tanpa meringkas.\n`;

  return ctx;
}
