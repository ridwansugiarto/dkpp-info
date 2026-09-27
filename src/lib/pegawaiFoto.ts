import { supabaseAdmin } from './supabaseServer';
import { getLivePegawaiFromSupabase, PegawaiNipRow } from './pegawaiSupabase';
import { OFFICIAL_DKPP_PEGAWAI } from '@/data/pegawai_dkpp';

const BUCKET_NAME = 'foto_pegawai';

// Cache in-memory untuk foto pegawai (TTL 3 menit)
let cachedStoragePhotos: {
  map: Record<string, { filename: string; publicUrl: string }>;
  timestamp: number;
} | null = null;
const PHOTO_CACHE_TTL_MS = 3 * 60 * 1000;

/**
 * Mengambil daftar seluruh file foto yang tersedia di bucket `foto_pegawai`
 */
export async function getAvailablePegawaiPhotos(): Promise<Record<string, { filename: string; publicUrl: string }>> {
  const now = Date.now();
  if (cachedStoragePhotos && now - cachedStoragePhotos.timestamp < PHOTO_CACHE_TTL_MS) {
    return cachedStoragePhotos.map;
  }

  const photoMap: Record<string, { filename: string; publicUrl: string }> = {};

  try {
    const { data: files, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 });

    if (!error && files) {
      files.forEach((file) => {
        if (!file.name || file.name.startsWith('.')) return;
        const nipKey = file.name.replace(/\.[^/.]+$/, '').trim();
        const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(file.name);
        if (data?.publicUrl) {
          photoMap[nipKey] = {
            filename: file.name,
            publicUrl: data.publicUrl,
          };
        }
      });
    }
  } catch (err) {
    console.error('[PegawaiFoto] Error listing photos from storage:', err);
  }

  cachedStoragePhotos = { map: photoMap, timestamp: now };
  return photoMap;
}

/**
 * Deteksi apakah sebuah pesan menanyakan FOTO pegawai
 */
export function isPegawaiPhotoQuery(message: string): boolean {
  const q = (message || '').toLowerCase().trim();

  // Kata kunci indikasi foto/gambar/potret
  const photoKeywords = [
    'foto', 'poto', 'photo', 'gambar', 'potret', 'avatar', 'pasfoto', 'pas foto',
    'picture', 'image', 'wajah', 'tampang'
  ];

  const hasPhotoWord = photoKeywords.some((pk) => {
    // Word boundary or substring
    const regex = new RegExp(`(^|\\s|[^a-z])${pk}($|\\s|[^a-z])`, 'i');
    return regex.test(q);
  });

  if (!hasPhotoWord) return false;

  // Jika ada kata kunci foto, cek apakah terkait kepegawaian, pimpinan, atau nama orang
  const contextKeywords = [
    'pegawai', 'asn', 'pns', 'pppk', 'pejabat', 'staf', 'kadis', 'sekdis', 'kabid',
    'kepala dinas', 'sekretaris dinas', 'penyuluh', 'nip', 'profil'
  ];

  if (contextKeywords.some((ck) => q.includes(ck))) return true;

  // Cek apakah ada panggilan kehormatan: pak, bu, ibu, bapak
  if (/\b(pak|bapak|bu|ibu|mas|mbak)\b/i.test(q)) return true;

  // Cek apakah menyebutkan nama dari database pegawai resmi
  const qTokens = q.split(/[\s,./?!=]+/).filter((t) => t.length >= 3 && !photoKeywords.includes(t));
  const hasMatchedName = OFFICIAL_DKPP_PEGAWAI.some((p) => {
    const pTokens = p.nama.toLowerCase().split(/[\s,./]+/).filter((t) => t.length >= 3);
    return qTokens.some((qt) => pTokens.some((pt) => pt === qt || (pt.length >= 5 && pt.includes(qt))));
  });

  return hasMatchedName;
}

export interface MatchPegawaiPhotoResult {
  isPhotoQuery: boolean;
  isGeneralPhotoList: boolean;
  matchedPegawai: PegawaiNipRow | null;
  photoUrl: string | null;
  storageFilename: string | null;
  hasPhoto: boolean;
  photoCount: number;
}

/**
 * Cari pegawai dan periksa ketersediaan fotonya di Supabase Storage `foto_pegawai`
 */
export async function resolvePegawaiPhoto(message: string): Promise<MatchPegawaiPhotoResult> {
  const isQuery = isPegawaiPhotoQuery(message);
  if (!isQuery) {
    return {
      isPhotoQuery: false,
      isGeneralPhotoList: false,
      matchedPegawai: null,
      photoUrl: null,
      storageFilename: null,
      hasPhoto: false,
      photoCount: 0,
    };
  }

  const q = message.toLowerCase().trim();
  const photoMap = await getAvailablePegawaiPhotos();
  const allPegawai = await getLivePegawaiFromSupabase();

  // 1. Cek apakah pengguna meminta daftar semua foto / foto siapa saja yang ada
  const isGeneralList =
    q.includes('siapa saja') ||
    q.includes('daftar foto') ||
    q.includes('semua foto') ||
    q.includes('foto siapa') ||
    q.includes('foto-foto') ||
    q === 'foto pegawai' ||
    q === 'foto' ||
    q === 'lihat foto pegawai';

  // 2. Cek apakah ada NIP eksplisit dalam teks (deretan 8-18 digit angka)
  const nipMatch = q.match(/\b\d{8,18}\b/);
  if (nipMatch) {
    const targetNip = nipMatch[0];
    const foundByNip = allPegawai.find((p) => p.nip.replace(/\s+/g, '') === targetNip);
    const photo = photoMap[targetNip];

    return {
      isPhotoQuery: true,
      isGeneralPhotoList: false,
      matchedPegawai: foundByNip || {
        nip: targetNip,
        nama: `Pegawai NIP ${targetNip}`,
        jabatan: 'Pegawai DKPP',
        bidang: 'DKPP Kota Cilegon',
        is_active: true,
      },
      photoUrl: photo?.publicUrl || null,
      storageFilename: photo?.filename || null,
      hasPhoto: !!photo,
      photoCount: Object.keys(photoMap).length,
    };
  }

  // 3. Cek jabatan spesifik (Kadis, Sekdis, dll)
  if (q.includes('kadis') || q.includes('kepala dinas')) {
    const kadis = allPegawai.find(
      (p) => p.jabatan.toLowerCase().includes('kepala dinas') || p.nama.toLowerCase().includes('efa sarifah')
    );
    if (kadis) {
      const cleanNip = kadis.nip.replace(/\s+/g, '');
      const photo = photoMap[cleanNip];
      return {
        isPhotoQuery: true,
        isGeneralPhotoList: false,
        matchedPegawai: kadis,
        photoUrl: photo?.publicUrl || null,
        storageFilename: photo?.filename || null,
        hasPhoto: !!photo,
        photoCount: Object.keys(photoMap).length,
      };
    }
  }

  if (q.includes('sekdis') || q.includes('sekretaris dinas')) {
    const sekdis = allPegawai.find((p) => p.jabatan.toLowerCase().includes('sekretaris'));
    if (sekdis) {
      const cleanNip = sekdis.nip.replace(/\s+/g, '');
      const photo = photoMap[cleanNip];
      return {
        isPhotoQuery: true,
        isGeneralPhotoList: false,
        matchedPegawai: sekdis,
        photoUrl: photo?.publicUrl || null,
        storageFilename: photo?.filename || null,
        hasPhoto: !!photo,
        photoCount: Object.keys(photoMap).length,
      };
    }
  }

  // 4. Token match nama pegawai
  // Abaikan kata-kata umum seperti foto, gambar, pak, bu, dong, tolong, dll
  const stopWords = new Set([
    'foto', 'poto', 'photo', 'gambar', 'potret', 'avatar', 'pasfoto', 'wajah',
    'pak', 'bapak', 'bu', 'ibu', 'mas', 'mbak', 'pegawai', 'asn', 'pns', 'pppk',
    'tolong', 'minta', 'lihat', 'tampilkan', 'bisa', 'dong', 'mana', 'apakah', 'ada',
    'yang', 'bernama', 'nama', 'di', 'dkpp', 'kota', 'cilegon', 'profil', 'tentang'
  ]);

  const searchWords = q
    .split(/[\s,./?!=]+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  let bestMatch: PegawaiNipRow | null = null;
  let highestScore = 0;

  for (const p of allPegawai) {
    const pNama = p.nama.toLowerCase();
    const pTokens = pNama.split(/[\s,./]+/).filter((t) => t.length >= 3);
    let score = 0;

    for (const sw of searchWords) {
      if (pNama.includes(sw)) score += 2;
      for (const pt of pTokens) {
        if (pt === sw) score += 3;
        else if (pt.includes(sw) || sw.includes(pt)) score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = p;
    }
  }

  if (bestMatch && highestScore >= 2) {
    const cleanNip = bestMatch.nip.replace(/\s+/g, '');
    const photo = photoMap[cleanNip];

    return {
      isPhotoQuery: true,
      isGeneralPhotoList: false,
      matchedPegawai: bestMatch,
      photoUrl: photo?.publicUrl || null,
      storageFilename: photo?.filename || null,
      hasPhoto: !!photo,
      photoCount: Object.keys(photoMap).length,
    };
  }

  // Jika tidak ditemukan nama spesifik, tapi query foto umum
  return {
    isPhotoQuery: true,
    isGeneralPhotoList: isGeneralList || searchWords.length === 0,
    matchedPegawai: null,
    photoUrl: null,
    storageFilename: null,
    hasPhoto: false,
    photoCount: Object.keys(photoMap).length,
  };
}
