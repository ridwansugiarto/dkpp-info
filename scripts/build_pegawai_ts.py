import json

with open('scratch/all_active_pegawai.json', 'r', encoding='utf-8') as f:
    active = json.load(f)

with open('scratch/all_inactive_pegawai.json', 'r', encoding='utf-8') as f:
    inactive = json.load(f)

ts_lines = []
ts_lines.append(f'''/**
 * MASTER DATA KEPEGAWAIAN RESMI DKPP KOTA CILEGON TAHUN 2026
 * Diperbarui berdasarkan Dokumen Resmi Nominatif PNS, PPPK 2026, dan Penyuluh Pertanian/Perikanan Aktif
 * 
 * Total Pegawai Aktif: {len(active)} Orang
 * Pegawai Mutasi / Resign: {len(inactive)} Orang (Ditandai is_active: false & keterangan: "sudah pindah atau sudah resign")
 */

export interface PegawaiInternalItem {{
  id: string;
  no?: number;
  nip: string;
  nip_formatted?: string | null;
  nama: string;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null; // Format YYYY-MM-DD
  tanggal_lahir_str?: string | null; // e.g. "21 Februari 1970"
  pangkat?: string | null;
  golongan?: string | null;
  tmt_golongan?: string | null;
  jabatan: string;
  tmt_jabatan?: string | null;
  esselon?: string | null;
  pendidikan?: string | null;
  diklat?: string | null;
  npwp?: string | null;
  kelas_jabatan?: string | null;
  status_pegawai?: string; // 'PNS' | 'Struktural' | 'PPPK' | 'Alumni / Mutasi' | 'Fungsional'
  kategori_pegawai?: string; // 'PNS' | 'PPPK' | 'Alumni / Mutasi'
  bidang?: string;
  is_sensitive: boolean;
  is_active: boolean;
  keterangan?: string | null;
}}

export const OFFICIAL_DKPP_PEGAWAI: PegawaiInternalItem[] = ''')

# Combine active + inactive
combined = active + inactive
ts_lines.append(json.dumps(combined, indent=2, ensure_ascii=False) + ';')
ts_lines.append('')
ts_lines.append('''// Daftar THL legacy (sebagian besar telah diangkat sebagai PPPK 2026)
export const OFFICIAL_DKPP_THL: Array<{ id: string; nama: string; status: string; instansi: string; is_sensitive: boolean }> = [];

// ─────────────────────────────────────────────────────────────────────────────
// QUERY DETECTION & CONTEXT BUILDER — Data Faktual Kepegawaian 2026
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deteksi apakah query user menyebut nama pegawai atau menanyakan
 * profil/jabatan/bidang yang memerlukan data faktual dari OFFICIAL_DKPP_PEGAWAI.
 */
export function isPegawaiProfileQuery(userMessage: string): boolean {
  const q = userMessage.toLowerCase();
  const profileKeywords = [
    'jabatan', 'posisi', 'menjabat', 'golongan', 'bidang', 'bagian',
    'tugasnya', 'fungsinya', 'kerja di', 'bekerja di', 'bagian apa',
    'siapa', 'profil', 'biodata', 'struktural', 'fungsional', 'nip',
    'kepala', 'kasubag', 'kasi', 'analis', 'penyuluh', 'pengawas',
    'bendahara', 'medik', 'veteriner', 'uptd', 'sekretaris',
    'tenaga', 'honorer', 'thl', 'kontrak', 'pegawai', 'p3k', 'pppk', 'asn', 'pns',
    'tempat lahir', 'tanggal lahir', 'ttl', 'pangkat', 'pendidikan', 'diklat'
  ];
  const hasKeyword = profileKeywords.some(k => q.includes(k));

  // Cek apakah ada potongan nama pegawai dalam query (min 4 char)
  const allNames = OFFICIAL_DKPP_PEGAWAI.map(p => p.nama);
  const qWords = q.split(/\\s+/).filter(w => w.length >= 4);
  const hasName = allNames.some(nama => {
    const namaLower = nama.toLowerCase();
    return qWords.some(word => namaLower.includes(word) || word.includes(namaLower.split(/[\\s,./]+/)[0]));
  });

  return hasKeyword || hasName;
}

/**
 * Bangun konteks faktual kepegawaian untuk AI.
 * Membedakan pegawai AKTIF (PNS, PPPK, Penyuluh 2026) vs pegawai yang SUDAH PINDAH/RESIGN.
 * Pegawai yang tidak aktif TIDAK dimasukkan dalam struktur aktif dan AI diwajibkan
 * menginformasikan status bahwa mereka sudah pindah atau sudah resign.
 */
export function buildPegawaiDkppContext(userMessage: string): string {
  const q = userMessage.toLowerCase();
  const qWords = q.split(/\\s+/).filter(w => w.length >= 3);

  // Fuzzy match: cari pegawai yang namanya disebut dalam query
  const matched = OFFICIAL_DKPP_PEGAWAI.filter(p => {
    const namaLower = p.nama.toLowerCase();
    const tokens = namaLower.split(/[\\s,./]+/).filter(t => t.length >= 3);
    return qWords.some(word =>
      tokens.some(tok => tok.includes(word) || word.includes(tok))
    );
  });

  const matchedActive = matched.filter(p => p.is_active);
  const matchedInactive = matched.filter(p => !p.is_active);

  let ctx = `=== DATA KEPEGAWAIAN RESMI DKPP KOTA CILEGON (UPDATE TAHUN 2026) ===\\n`;
  ctx += `ATURAN UTAMA AI:\\n`;
  ctx += `1. Gunakan HANYA data berikut. DILARANG KERAS mengarang jabatan, profil, atau status kepegawaian.\\n`;
  ctx += `2. Pegawai yang bertanda 'SUDAH PINDAH ATAU SUDAH RESIGN' BUKAN lagi bagian dari pegawai aktif DKPP 2026. Jika ditanyakan, tegaskan bahwa ybs sudah pindah tugas / resign.\\n`;
  ctx += `3. Jangan masukkan pegawai yang sudah pindah/resign ke dalam daftar analisis staf aktif DKPP.\\n\\n`;

  if (matched.length > 0) {
    if (matchedActive.length > 0) {
      ctx += `PEGAWAI AKTIF DKPP YANG DITEMUKAN:\\n`;
      matchedActive.forEach(p => {
        ctx += `• Nama          : ${p.nama}\\n`;
        ctx += `  Status        : Aktif (${p.kategori_pegawai || p.status_pegawai})\\n`;
        ctx += `  NIP           : ${p.nip_formatted || p.nip}\\n`;
        if (p.tempat_lahir || p.tanggal_lahir_str) {
          ctx += `  TTL           : ${p.tempat_lahir || '-'}, ${p.tanggal_lahir_str || p.tanggal_lahir || '-'}\\n`;
        }
        ctx += `  Jabatan       : ${p.jabatan}\\n`;
        ctx += `  Bidang        : ${p.bidang}\\n`;
        if (p.pangkat) ctx += `  Pangkat       : ${p.pangkat}\\n`;
        if (p.golongan) ctx += `  Golongan      : ${p.golongan}\\n`;
        if (p.esselon) ctx += `  Esselon       : ${p.esselon}\\n`;
        if (p.pendidikan) ctx += `  Pendidikan    : ${p.pendidikan}\\n`;
        if (p.diklat) ctx += `  Diklat        : ${p.diklat}\\n`;
        if (p.tmt_jabatan) ctx += `  TMT Jabatan   : ${p.tmt_jabatan}\\n`;
        ctx += `\\n`;
      });
    }

    if (matchedInactive.length > 0) {
      ctx += `INFORMASI PEGAWAI TIDAK AKTIF / MUTASI / RESIGN:\\n`;
      matchedInactive.forEach(p => {
        ctx += `• Nama          : ${p.nama}\\n`;
        ctx += `  NIP           : ${p.nip}\\n`;
        ctx += `  Status        : SUDAH PINDAH ATAU SUDAH RESIGN (Tidak aktif di DKPP per 2026)\\n`;
        ctx += `  Keterangan    : ${p.keterangan || 'sudah pindah atau sudah resign'}\\n`;
        ctx += `  Riwayat Posisi: Sebelumnya ${p.jabatan} (${p.bidang})\\n`;
        ctx += `  Catatan AI    : Sampaikan kepada pengguna bahwa pegawai ini sudah tidak bertugas di DKPP Kota Cilegon karena sudah pindah dinas atau sudah resign.\\n\\n`;
      });
    }
  } else {
    // Ringkasan Pimpinan & Pejabat Struktural Aktif 2026
    ctx += `STRUKTUR UTAMA PEGAWAI AKTIF DKPP KOTA CILEGON (2026):\\n`;
    const pimpinanDanStruktural = OFFICIAL_DKPP_PEGAWAI.filter(p => p.is_active && (p.bidang === 'Pimpinan' || p.status_pegawai === 'Struktural' || p.esselon));
    pimpinanDanStruktural.slice(0, 15).forEach(p => {
      ctx += `• ${p.nama} — ${p.jabatan} (${p.bidang}) [${p.kategori_pegawai || p.status_pegawai}]\\n`;
    });
    ctx += `\\n(Terdapat total 92 pegawai aktif: PNS, PPPK, dan Penyuluh Pertanian/Perikanan. Sebutkan nama lengkap untuk melihat detail profil TTL, NIP, Pangkat, dan Jabatan)\\n`;
  }

  return ctx;
}
''')

with open('src/data/pegawai_dkpp.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(ts_lines))

print(f'Successfully generated src/data/pegawai_dkpp.ts with {len(active)} active and {len(inactive)} inactive employees!')
