import json

with open('public/tabel kwt/kwt_geocoded.json', 'r', encoding='utf-8') as f:
    kwt_list = json.load(f)

ts_content = f"""/**
 * Basis Data Resmi 84 KWT (Kelompok Wanita Tani) DKPP Kota Cilegon Tahun 2026
 * Dilengkapi koordinat geocoded, alamat sekretariat, jenis usaha, dan bantuan.
 */

export interface KwtItem {{
  no_urut: number;
  kecamatan: string;
  kelurahan: string;
  nama_kwt: string;
  nama_ketua: string | null;
  no_wa_ketua: string | null;
  no_hp_ketua: string | null;
  alamat_sekretariat: string | null;
  luas_lahan: string | null;
  keterangan: string | null;
  bantuan: string | null;
  jenis_usaha: string | null;
  latitude: number | null;
  longitude: number | null;
  maps_link: string | null;
  geocode_display: string | null;
}}

export const OFFICIAL_KWT_LIST: KwtItem[] = {json.dumps(kwt_list, ensure_ascii=False, indent=2)};

export function findKwtByName(query: string): KwtItem | undefined {{
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return OFFICIAL_KWT_LIST.find((k) => {{
    const name = k.nama_kwt.toLowerCase();
    const shortName = name.replace(/^kwt\\s+/, '').trim();
    return name === q || name.includes(q) || (shortName.length >= 3 && q.includes(shortName));
  }});
}}

export function findKwtsByKecamatan(kecamatan: string): KwtItem[] {{
  if (!kecamatan) return [];
  const kec = kecamatan.toLowerCase().trim();
  return OFFICIAL_KWT_LIST.filter((k) => k.kecamatan.toLowerCase().includes(kec));
}}

export function getAllKwtPins() {{
  return OFFICIAL_KWT_LIST.filter((k) => k.latitude && k.longitude).map((k) => ({{
    lat: k.latitude!,
    lng: k.longitude!,
    name: k.nama_kwt,
    category: 'kwt',
    kelurahan: k.kelurahan,
    kecamatan: k.kecamatan,
    alamat: k.alamat_sekretariat,
    usaha: k.jenis_usaha,
    maps_link: k.maps_link,
  }}));
}}

export function buildKwtPromptContext(query: string): string | null {{
  const q = query.toLowerCase();
  const isKwtQuery = q.includes('kwt') || q.includes('wanita tani') || q.includes('kelompok tani wanita');
  if (!isKwtQuery) return null;

  const matched = findKwtByName(query);
  if (matched) {{
    return `
### [BASIS DATA RESMI KWT DKPP CILEGON 2026]
Kelompok Wanita Tani Terpilih:
- Nama KWT: ${{matched.nama_kwt}}
- Lokasi: Kelurahan ${{matched.kelurahan}}, Kecamatan ${{matched.kecamatan}}, Kota Cilegon
- Alamat Sekretariat: ${{matched.alamat_sekretariat || 'Tersedia di tingkat kelurahan'}}
- Nama Ketua: ${{matched.nama_ketua || '(Placeholder: Dalam pemutakhiran data pengurus oleh Admin DKPP)'}}
- No WhatsApp / HP: ${{matched.no_wa_ketua || matched.no_hp_ketua || '(Placeholder: Dalam pemutakhiran oleh Admin DKPP)'}}
- Jenis Usaha: ${{matched.jenis_usaha || 'Olahan Pertanian dan Pangan Lokal'}}
- Riwayat Bantuan: ${{matched.bantuan || 'Bantuan bibit, pupuk, dan sarana urban farming DKPP'}}
- Status: ${{matched.keterangan || 'Aktif'}}
- Koordinat GIS: Latitude ${{matched.latitude}}, Longitude ${{matched.longitude}}
- Link Peta Google: ${{matched.maps_link || '-'}}
Instruksi Penting: Berikan profil lengkap di atas dengan ramah, dan tawarkan akses ke Peta Spasial GIS Cilegon (atau klik link Google Maps) untuk melihat pin lokasi persisnya.
`;
  }}

  // Check if kecamatan is specified
  const KECS = ['CITANGKIL', 'CIWANDAN', 'PULOMERAK', 'GROGOL', 'JOMBANG', 'PURWAKARTA', 'CIBEBER', 'CILEGON'];
  const matchedKec = KECS.find((k) => q.includes(k.toLowerCase()));
  if (matchedKec) {{
    const list = findKwtsByKecamatan(matchedKec);
    const summary = list.map((k, i) => `${{i + 1}}. **${{k.nama_kwt}}** (Kel. ${{k.kelurahan}}) - Usaha: ${{k.jenis_usaha || 'Pertanian & Olahan'}}`).join('\\n');
    return `
### [BASIS DATA KWT KECAMATAN ${{matchedKec}} - TOTAL ${{list.length}} KWT]
Berikut daftar KWT resmi di Kecamatan ${{matchedKec}}:
${{summary}}
Instruksi: Tampilkan daftar KWT di atas dengan rapi dan sebutkan bahwa lokasinya dapat dilihat secara interaktif di Peta Spasial GIS.
`;
  }}

  // General KWT summary
  return `
### [RINGKASAN DATA KWT DKPP KOTA CILEGON 2026]
Total terdapat 84 Kelompok Wanita Tani (KWT) aktif binaan DKPP di 8 kecamatan Kota Cilegon:
1. Citangkil: 15 KWT
2. Ciwandan: 19 KWT
3. Pulomerak: 10 KWT
4. Grogol: 9 KWT
5. Jombang: 5 KWT
6. Purwakarta: 8 KWT
7. Cibeber: 14 KWT
8. Cilegon: 4 KWT
Pengguna dapat menanyakan nama KWT tertentu (misal: "KWT Mangga", "KWT Anggrek") untuk melihat profil lengkap dan pin lokasi pada peta GIS.
`;
}}
"""

with open('src/lib/kwt/data.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Successfully generated src/lib/kwt/data.ts with all 84 records")
