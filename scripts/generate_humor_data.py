import openpyxl
import json
import os

excel_path = os.path.join('public', 'daftar nip pegawai internal DKPP', 'nama dan data pendukung (mode bercanda) pegawai internal dkpp.xlsx')

wb = openpyxl.load_workbook(excel_path)
sheet = wb.active

rows = []
for r in range(3, sheet.max_row + 1):
    no = sheet.cell(row=r, column=1).value
    nama = sheet.cell(row=r, column=2).value
    jk = sheet.cell(row=r, column=3).value
    tampan = sheet.cell(row=r, column=4).value
    aura = sheet.cell(row=r, column=5).value
    terpesona = sheet.cell(row=r, column=6).value
    rajin = sheet.cell(row=r, column=7).value
    cerdas = sheet.cell(row=r, column=8).value
    
    if nama and str(nama).strip():
        rows.append({
            'nomor': int(no) if no is not None and str(no).strip().isdigit() else None,
            'nama': str(nama).strip(),
            'jenis_kelamin': str(jk).strip().upper() if jk else None,
            'skor_ketampanan_kecantikan': int(tampan) if tampan is not None and str(tampan).strip().isdigit() else None,
            'skor_daya_tarik_aura': int(aura) if aura is not None and str(aura).strip().isdigit() else None,
            'jumlah_terpesona': int(terpesona) if terpesona is not None and str(terpesona).strip().isdigit() else None,
            'skor_rajin_kehadiran': int(rajin) if rajin is not None and str(rajin).strip().isdigit() else None,
            'skor_kecerdasan': int(cerdas) if cerdas is not None and str(cerdas).strip().isdigit() else None,
            'is_sensitive': True,
            'kategori': 'MODE_BERCANDA_INTERNAL'
        })

print(f"Parsed {len(rows)} rows from Excel.")

# 1. Generate SQL migration
sql_lines = [
    "-- ====================================================================",
    "-- MIGRATION 017: DATA PENDUKUNG INTERNAL DKPP (MODE BERCANDA / HUMOR)",
    "-- DITANDAI SEBAGAI DATA SENSITIF & TERISOLASI KHUSUS JAWABAN SANTAI",
    "-- ====================================================================",
    "",
    "CREATE TABLE IF NOT EXISTS public.dkpp_pegawai_humor (",
    "    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
    "    nomor INT,",
    "    nama VARCHAR(150) NOT NULL,",
    "    jenis_kelamin CHAR(1), -- L / P",
    "    skor_ketampanan_kecantikan INT, -- Skor 1-10",
    "    skor_daya_tarik_aura INT, -- Skor 1-10",
    "    jumlah_terpesona INT, -- Jumlah yang tertarik/terpesona",
    "    skor_rajin_kehadiran INT, -- Skor 1-10",
    "    skor_kecerdasan INT, -- Skor 1-10",
    "    is_sensitive BOOLEAN DEFAULT true, -- DITANDAI SEBAGAI DATA SENSITIF",
    "    kategori VARCHAR(50) DEFAULT 'MODE_BERCANDA_INTERNAL',",
    "    created_at TIMESTAMPTZ DEFAULT now()",
    ");",
    "",
    "CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_nama ON public.dkpp_pegawai_humor (nama);",
    "CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_sens ON public.dkpp_pegawai_humor (is_sensitive);",
    "",
    "ALTER TABLE public.dkpp_pegawai_humor ENABLE ROW LEVEL SECURITY;",
    "",
    'DROP POLICY IF EXISTS "Admin manage humor data" ON public.dkpp_pegawai_humor;',
    'CREATE POLICY "Admin manage humor data" ON public.dkpp_pegawai_humor FOR ALL USING (',
    "    (auth.jwt() ->> 'email') = 'ridwansugiarto.mail@gmail.com'",
    "    OR (auth.jwt() ->> 'role') = 'service_role'",
    ");",
    "",
    'DROP POLICY IF EXISTS "Public read humor data" ON public.dkpp_pegawai_humor;',
    'CREATE POLICY "Public read humor data" ON public.dkpp_pegawai_humor FOR SELECT USING (',
    "    true",
    ");",
    "",
    "-- Bersihkan tabel sebelum memasukkan data lengkap",
    "TRUNCATE TABLE public.dkpp_pegawai_humor;",
    "",
    "INSERT INTO public.dkpp_pegawai_humor (",
    "    nomor, nama, jenis_kelamin, skor_ketampanan_kecantikan, skor_daya_tarik_aura, jumlah_terpesona, skor_rajin_kehadiran, skor_kecerdasan, is_sensitive, kategori",
    ") VALUES"
]

values_list = []
for item in rows:
    no_val = str(item['nomor']) if item['nomor'] is not None else 'NULL'
    nama_esc = item['nama'].replace("'", "''")
    jk_val = f"'{item['jenis_kelamin']}'" if item['jenis_kelamin'] else 'NULL'
    tampan_val = str(item['skor_ketampanan_kecantikan']) if item['skor_ketampanan_kecantikan'] is not None else 'NULL'
    aura_val = str(item['skor_daya_tarik_aura']) if item['skor_daya_tarik_aura'] is not None else 'NULL'
    terpesona_val = str(item['jumlah_terpesona']) if item['jumlah_terpesona'] is not None else 'NULL'
    rajin_val = str(item['skor_rajin_kehadiran']) if item['skor_rajin_kehadiran'] is not None else 'NULL'
    cerdas_val = str(item['skor_kecerdasan']) if item['skor_kecerdasan'] is not None else 'NULL'
    values_list.append(f"({no_val}, '{nama_esc}', {jk_val}, {tampan_val}, {aura_val}, {terpesona_val}, {rajin_val}, {cerdas_val}, true, 'MODE_BERCANDA_INTERNAL')")

sql_lines.append(',\n'.join(values_list) + ';')

with open('supabase/migrations/017_dkpp_pegawai_humor.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print("Created supabase/migrations/017_dkpp_pegawai_humor.sql")

# 2. Generate TypeScript module
ts_code = f"""// Master Data Pendukung Internal DKPP (Mode Bercanda / Humor)
// Catatan: Data ini KHUSUS untuk mencairkan suasana jika user bertanya hal santai/bercanda
// DILARANG DICAMPURKAN DENGAN PERTANYAAN SERIUS / FORMAL KEDINASAN

export interface PegawaiHumorItem {{
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
}}

export const OFFICIAL_DKPP_HUMOR_DATA: PegawaiHumorItem[] = {json.dumps(rows, indent=2, ensure_ascii=False)};

// Helper functions untuk merespons pertanyaan santai
export function getTopGanteng(limit = 5): PegawaiHumorItem[] {{
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jenis_kelamin === 'L' && p.skor_ketampanan_kecantikan !== null)
    .sort((a, b) => (b.skor_ketampanan_kecantikan ?? 0) - (a.skor_ketampanan_kecantikan ?? 0))
    .slice(0, limit);
}}

export function getTopCantik(limit = 5): PegawaiHumorItem[] {{
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jenis_kelamin === 'P' && p.skor_ketampanan_kecantikan !== null)
    .sort((a, b) => (b.skor_ketampanan_kecantikan ?? 0) - (a.skor_ketampanan_kecantikan ?? 0))
    .slice(0, limit);
}}

export function getTopAura(limit = 5): PegawaiHumorItem[] {{
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.skor_daya_tarik_aura !== null)
    .sort((a, b) => (b.skor_daya_tarik_aura ?? 0) - (a.skor_daya_tarik_aura ?? 0))
    .slice(0, limit);
}}

export function getTopTerpesona(limit = 5): PegawaiHumorItem[] {{
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.jumlah_terpesona !== null)
    .sort((a, b) => (b.jumlah_terpesona ?? 0) - (a.jumlah_terpesona ?? 0))
    .slice(0, limit);
}}

export function getTopCerdas(limit = 5): PegawaiHumorItem[] {{
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.skor_kecerdasan !== null)
    .sort((a, b) => (b.skor_kecerdasan ?? 0) - (a.skor_kecerdasan ?? 0))
    .slice(0, limit);
}}

export function getTopRajin(limit = 5): PegawaiHumorItem[] {{
  return OFFICIAL_DKPP_HUMOR_DATA
    .filter(p => p.skor_rajin_kehadiran !== null)
    .sort((a, b) => (b.skor_rajin_kehadiran ?? 0) - (a.skor_rajin_kehadiran ?? 0))
    .slice(0, limit);
}}

export function findPegawaiHumorByName(namaQuery: string): PegawaiHumorItem | undefined {{
  const q = namaQuery.toLowerCase().trim();
  return OFFICIAL_DKPP_HUMOR_DATA.find(p => p.nama.toLowerCase().includes(q));
}}

/**
 * Deteksi apakah pertanyaan user adalah pertanyaan bercanda / santai seputar pegawai
 */
export function isPegawaiHumorQuery(userMessage: string): boolean {{
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
}}

/**
 * Bangun teks konteks humor yang relevan untuk AI
 */
export function buildPegawaiHumorContext(userMessage: string): string | null {{
  if (!isPegawaiHumorQuery(userMessage)) return null;

  const q = userMessage.toLowerCase();
  let result = `=== MODE BERCANDA / HUMOR INTERNAL PEGAWAI DKPP (SENSITIF - INTERNAL ONLY) ===\\n`;
  result += `CATATAN PENTING: Pertanyaan pengguna terdeteksi sebagai pertanyaan santai/bercanda seputar keakraban pegawai DKPP.\\n`;
  result += `Jawablah dengan nada yang ramah, hangat, jenaka, dan sopan. Berikan disclaimer di akhir bahwa ini adalah catatan internal humor/candaan DKPP untuk keakraban bersama, bukan penilaian kedinasan resmi.\\n\\n`;

  if (q.includes('ganteng') || q.includes('tampan') || q.includes('cowok')) {{
    const topGanteng = getTopGanteng(6);
    result += `DAFTAR PEGAWAI PALING GANTENG / TAMPAN (Skor 1-10):\\n`;
    topGanteng.forEach((p, idx) => {{
      result += `${{idx + 1}}. ${{p.nama}} (Skor Ketampanan: ${{p.skor_ketampanan_kecantikan}}/10, Aura: ${{p.skor_daya_tarik_aura}}/10)\\n`;
    }});
    result += `\\n`;
  }}

  if (q.includes('cantik') || q.includes('ayu') || q.includes('cewek') || q.includes('wanita')) {{
    const topCantik = getTopCantik(6);
    result += `DAFTAR PEGAWAI PALING CANTIK (Skor 1-10):\\n`;
    topCantik.forEach((p, idx) => {{
      result += `${{idx + 1}}. ${{p.nama}} (Skor Kecantikan: ${{p.skor_ketampanan_kecantikan}}/10, Aura: ${{p.skor_daya_tarik_aura}}/10)\\n`;
    }});
    result += `\\n`;
  }}

  if (q.includes('aura') || q.includes('daya tarik') || q.includes('kharisma') || q.includes('karisma')) {{
    const topAura = getTopAura(6);
    result += `DAFTAR PEGAWAI DENGAN AURA / DAYA TARIK TERTINGGI:\\n`;
    topAura.forEach((p, idx) => {{
      result += `${{idx + 1}}. ${{p.nama}} (Skor Aura: ${{p.skor_daya_tarik_aura}}/10)\\n`;
    }});
    result += `\\n`;
  }}

  if (q.includes('terpesona') || q.includes('terpikat') || q.includes('fans') || q.includes('perempuan') || q.includes('wanita')) {{
    const topTerpesona = getTopTerpesona(6);
    result += `DAFTAR PEGAWAI DENGAN JUMLAH ORANG / WANITA YANG TERPESONA TERBANYAK:\\n`;
    topTerpesona.forEach((p, idx) => {{
      result += `${{idx + 1}}. ${{p.nama}} (Mencapai ${{p.jumlah_terpesona}} orang yang terpikat/terpesona)\\n`;
    }});
    result += `\\n`;
  }}

  if (q.includes('cerdas') || q.includes('pintar') || q.includes('jenius')) {{
    const topCerdas = getTopCerdas(6);
    result += `DAFTAR PEGAWAI PALING CERDAS / JENIUS:\\n`;
    topCerdas.forEach((p, idx) => {{
      result += `${{idx + 1}}. ${{p.nama}} (Skor Kecerdasan: ${{p.skor_kecerdasan}}/10, Rajin: ${{p.skor_rajin_kehadiran}}/10)\\n`;
    }});
    result += `\\n`;
  }}

  if (q.includes('rajin') || q.includes('hadir') || q.includes('kehadiran')) {{
    const topRajin = getTopRajin(6);
    result += `DAFTAR PEGAWAI PALING RAJIN & DISIPLIN KEHADIRAN:\\n`;
    topRajin.forEach((p, idx) => {{
      result += `${{idx + 1}}. ${{p.nama}} (Skor Kehadiran: ${{p.skor_rajin_kehadiran}}/10)\\n`;
    }});
    result += `\\n`;
  }}

  // Jika umum (misal: "siapa saja yang ada di daftar candaan?")
  if (!q.includes('ganteng') && !q.includes('cantik') && !q.includes('aura') && !q.includes('terpesona') && !q.includes('cerdas') && !q.includes('rajin')) {{
    result += `RINGKASAN MODE BERCANDA:\\n`;
    result += `- Paling Ganteng: Paulus Dwi Ari K D, ST, Subandi, Yuki Suryarizki, S.Kom, Asep Qomaruzzaman, S.AP, Ridwan Sugiarto, S.Pi, Udin Saprudin, SE\\n`;
    result += `- Paling Cantik: Sri Rahmadani Piliang, SE, Minarni, SE, Sri Ratnaningsih, S.Pi, Winda Ratnasari, SP, Maisaroh, SP\\n`;
    result += `- Juara Pemikat Terpesona: Subandi (50 orang), Asep Qomaruzzaman (48 orang), Yuki Suryarizki (45 orang)\\n`;
    result += `- Paling Cerdas: Ridwan Sugiarto, S.Pi (10/10), Wahyudi, SE (10/10), Mas Akhmad Rangga P, SE (10/10), Sandhi Maulana Adha, SP (10/10), Ibu Plt. Kadis Efa Sarifah (10/10)\\n`;
  }}

  return result;
}}
"""

with open('src/data/pegawai_humor.ts', 'w', encoding='utf-8') as f:
    f.write(ts_code)

print("Created src/data/pegawai_humor.ts successfully.")
