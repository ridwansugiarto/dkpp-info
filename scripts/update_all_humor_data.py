import openpyxl
import os
import re
import json

excel_humor_path = os.path.join('private_docs', 'daftar nip pegawai internal DKPP', 'nama dan data pendukung (mode bercanda) pegawai internal dkpp.xlsx')
excel_nip_path = os.path.join('private_docs', 'daftar nip pegawai internal DKPP', 'nama dan nip pegawai internal dkpp (asn) 2023.xlsx')

wb_humor = openpyxl.load_workbook(excel_humor_path, data_only=True)
sheet_humor = wb_humor.active

wb_nip = openpyxl.load_workbook(excel_nip_path, data_only=True)
sheet_nip = wb_nip['Lampiran I']

def normalize_name(name):
    n = name.lower()
    n = re.sub(r'[\.,]', ' ', n)
    words = n.split()
    titles = {'dr', 'ir', 'dra', 'drs', 'drh', 'h', 'hj', 'st', 'mt', 'mm', 'spd', 'spt', 'msi', 'sp', 'skm', 'mp', 'se', 'sh', 'ssi', 'amd', 'ap', 'sos', 'mkn', 's', 'sip', 'skh', 'kom', 'vet'}
    filtered = [w for w in words if w not in titles]
    return ' '.join(filtered)

asn_by_no = {}
asn_by_name = {}

for r in range(6, sheet_nip.max_row + 1):
    no = sheet_nip.cell(r, 1).value
    nama = sheet_nip.cell(r, 2).value
    nip = sheet_nip.cell(r, 3).value
    if nama and nip:
        clean_nip = re.sub(r'\s+', '', str(nip).strip())
        nama_str = str(nama).strip()
        data = {
            'no': int(no) if no is not None and str(no).strip().isdigit() else None,
            'nama': nama_str,
            'nip': clean_nip
        }
        if data['no']:
            asn_by_no[data['no']] = data
        asn_by_name[normalize_name(nama_str)] = data

def parse_nip(clean_nip):
    if not clean_nip or len(clean_nip) < 18:
        return None, None, None
    tgl_lahir = f"{clean_nip[0:4]}-{clean_nip[4:6]}-{clean_nip[6:8]}"
    tgl_cpns = f"{clean_nip[8:12]}-{clean_nip[12:14]}"
    jk_code = clean_nip[14]
    jk = 'L' if jk_code == '1' else ('P' if jk_code == '2' else None)
    return tgl_lahir, tgl_cpns, jk

eligible_rows = []
excluded_rows = []

for r in range(3, sheet_humor.max_row + 1):
    no = sheet_humor.cell(row=r, column=1).value
    nama = sheet_humor.cell(row=r, column=2).value
    jk = sheet_humor.cell(row=r, column=3).value
    tampan = sheet_humor.cell(row=r, column=4).value
    aura = sheet_humor.cell(row=r, column=5).value
    terpesona = sheet_humor.cell(row=r, column=6).value
    rajin = sheet_humor.cell(row=r, column=7).value
    cerdas = sheet_humor.cell(row=r, column=8).value
    
    if nama and str(nama).strip():
        nama_str = str(nama).strip()
        ratings = [tampan, aura, terpesona, rajin, cerdas]
        has_empty_cell = any(v is None or str(v).strip() == '' for v in ratings)

        no_int = int(no) if no is not None and str(no).strip().isdigit() else None
        asn_match = None
        if no_int and no_int in asn_by_no:
            asn_match = asn_by_no[no_int]
        if not asn_match:
            norm = normalize_name(nama_str)
            if norm in asn_by_name:
                asn_match = asn_by_name[norm]
            else:
                for k, v in asn_by_name.items():
                    if norm and k and (norm in k or k in norm):
                        asn_match = v
                        break

        nip_val = None
        tgl_lahir = None
        tgl_cpns = None
        final_jk = str(jk).strip().upper() if jk else None

        if asn_match:
            nip_val = asn_match['nip']
            tgl_lahir, tgl_cpns, nip_jk = parse_nip(nip_val)
            if nip_jk:
                final_jk = nip_jk

        record = {
            'nomor': no_int,
            'nip': nip_val,
            'nama': nama_str,
            'tanggal_lahir': tgl_lahir,
            'tanggal_mulai_kerja_cpns': tgl_cpns,
            'jenis_kelamin': final_jk,
            'skor_ketampanan_kecantikan': int(tampan) if tampan is not None and str(tampan).strip().isdigit() else None,
            'skor_daya_tarik_aura': int(aura) if aura is not None and str(aura).strip().isdigit() else None,
            'jumlah_terpesona': int(terpesona) if terpesona is not None and str(terpesona).strip().isdigit() else None,
            'skor_rajin_kehadiran': int(rajin) if rajin is not None and str(rajin).strip().isdigit() else None,
            'skor_kecerdasan': int(cerdas) if cerdas is not None and str(cerdas).strip().isdigit() else None,
            'is_sensitive': True,
            'kategori': 'MODE_BERCANDA_INTERNAL'
        }

        if has_empty_cell:
            excluded_rows.append(record)
        else:
            eligible_rows.append(record)

# 1. Update 017_dkpp_pegawai_humor.sql
sql_017_lines = [
    "-- ====================================================================",
    "-- MIGRATION 017: DATA PENDUKUNG INTERNAL DKPP (MODE BERCANDA / HUMOR)",
    "-- HANYA BERISI PEGAWAI DENGAN SELURUH CELL RATING LENGKAP",
    "-- PEGAWAI DENGAN CELL KOSONG / EMPTY DIKECUALIKAN KARENA SERIUS",
    "-- DITANDAI SEBAGAI DATA SENSITIF & TERISOLASI KHUSUS JAWABAN SANTAI",
    "-- ====================================================================",
    "",
    "CREATE TABLE IF NOT EXISTS public.dkpp_pegawai_humor (",
    "    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
    "    nomor INT,",
    "    nip VARCHAR(30),",
    "    nama VARCHAR(150) NOT NULL,",
    "    tanggal_lahir DATE,",
    "    tanggal_mulai_kerja_cpns VARCHAR(20),",
    "    jenis_kelamin CHAR(1), -- L / P",
    "    skor_ketampanan_kecantikan INT NOT NULL, -- Skor 1-10",
    "    skor_daya_tarik_aura INT NOT NULL, -- Skor 1-10",
    "    jumlah_terpesona INT NOT NULL, -- Jumlah yang tertarik/terpesona",
    "    skor_rajin_kehadiran INT NOT NULL, -- Skor 1-10",
    "    skor_kecerdasan INT NOT NULL, -- Skor 1-10",
    "    is_sensitive BOOLEAN DEFAULT true, -- DITANDAI SEBAGAI DATA SENSITIF",
    "    kategori VARCHAR(50) DEFAULT 'MODE_BERCANDA_INTERNAL',",
    "    created_at TIMESTAMPTZ DEFAULT now()",
    ");",
    "",
    "ALTER TABLE public.dkpp_pegawai_humor",
    "ADD COLUMN IF NOT EXISTS nip VARCHAR(30),",
    "ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,",
    "ADD COLUMN IF NOT EXISTS tanggal_mulai_kerja_cpns VARCHAR(20),",
    "ADD COLUMN IF NOT EXISTS jenis_kelamin CHAR(1);",
    "",
    "CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_nama ON public.dkpp_pegawai_humor (nama);",
    "CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_nip ON public.dkpp_pegawai_humor (nip);",
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
    "    nomor, nip, nama, tanggal_lahir, tanggal_mulai_kerja_cpns, jenis_kelamin, skor_ketampanan_kecantikan, skor_daya_tarik_aura, jumlah_terpesona, skor_rajin_kehadiran, skor_kecerdasan, is_sensitive, kategori",
    ") VALUES"
]

val_rows = []
for item in eligible_rows:
    no_val = str(item['nomor']) if item['nomor'] is not None else 'NULL'
    nip_val = f"'{item['nip']}'" if item['nip'] else 'NULL'
    nama_esc = item['nama'].replace("'", "''")
    tgl_l_val = f"'{item['tanggal_lahir']}'" if item['tanggal_lahir'] else 'NULL'
    cpns_val = f"'{item['tanggal_mulai_kerja_cpns']}'" if item['tanggal_mulai_kerja_cpns'] else 'NULL'
    jk_val = f"'{item['jenis_kelamin']}'" if item['jenis_kelamin'] else 'NULL'
    tampan_val = str(item['skor_ketampanan_kecantikan'])
    aura_val = str(item['skor_daya_tarik_aura'])
    terpesona_val = str(item['jumlah_terpesona'])
    rajin_val = str(item['skor_rajin_kehadiran'])
    cerdas_val = str(item['skor_kecerdasan'])
    val_rows.append(f"({no_val}, {nip_val}, '{nama_esc}', {tgl_l_val}, {cpns_val}, {jk_val}, {tampan_val}, {aura_val}, {terpesona_val}, {rajin_val}, {cerdas_val}, true, 'MODE_BERCANDA_INTERNAL')")

sql_017_lines.append(',\n'.join(val_rows) + ';')

with open('supabase/migrations/017_dkpp_pegawai_humor.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_017_lines))
print("Updated supabase/migrations/017_dkpp_pegawai_humor.sql")

# 2. Update src/data/pegawai_humor.ts while preserving functions
with open('src/data/pegawai_humor.ts', 'r', encoding='utf-8') as f:
    current_ts = f.read()

# Locate from "// Rumus Komposit Berstandar Indeks" to the end
idx_rumus = current_ts.find('// Rumus Komposit Berstandar Indeks')
if idx_rumus == -1:
    idx_rumus = current_ts.find('export function getIndeksKecantikanNum')

functions_tail = current_ts[idx_rumus:] if idx_rumus != -1 else ""

ts_head = f"""// Master Data Pendukung Internal DKPP (Mode Bercanda / Humor)
// ATURAN KETAT: HANYA PEGAWAI DENGAN SELURUH CELL RATING LENGKAP YANG DIPROSES!
// PEGAWAI DENGAN CELL KOSONG/EMPTY DIKECUALIKAN KARENA SERIUS DAN TIDAK BISA MENERIMA CANDAAN.

export interface PegawaiHumorItem {{
  nomor: number | null;
  nip?: string | null;
  nama: string;
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
}}

// Daftar nama pegawai yang SERIUS (memiliki cell kosong di file Excel)
// DILARANG KERAS memproses nama-nama ini dalam candaan/humor:
export const EXCLUDED_SERIOUS_PEGAWAI: string[] = {json.dumps([ex['nama'] for ex in excluded_rows], indent=2, ensure_ascii=False)};

// Hanya pegawai dengan data lengkap yang bersedia masuk mode humor:
export const OFFICIAL_DKPP_HUMOR_DATA: PegawaiHumorItem[] = {json.dumps(eligible_rows, indent=2, ensure_ascii=False)};

"""

new_ts_content = ts_head + functions_tail

with open('src/data/pegawai_humor.ts', 'w', encoding='utf-8') as f:
    f.write(new_ts_content)
print("Updated src/data/pegawai_humor.ts successfully!")
