import openpyxl
import re
import os

f1 = r'public\daftar nip pegawai internal DKPP\nama dan nip pegawai internal dkpp (asn) 2023.xlsx'
f2 = r'public\daftar nip pegawai internal DKPP\nama dan npwp pegawai internal dkpp (asn) 2023.xlsx'
f3 = r'public\daftar nip pegawai internal DKPP\nama THL internal dkpp (asn) 2023.xlsx'

wb1 = openpyxl.load_workbook(f1, data_only=True)
ws1 = wb1['Lampiran I']

wb2 = openpyxl.load_workbook(f2, data_only=True)
ws2 = wb2['TPP April']

wb3 = openpyxl.load_workbook(f3, data_only=True)
ws3 = wb3['Lampiran II']

def normalize_name(name):
    n = name.lower()
    n = re.sub(r'[\.,]', ' ', n)
    words = n.split()
    titles = {'dr', 'ir', 'dra', 'drs', 'drh', 'h', 'hj', 'st', 'mt', 'mm', 'spd', 'spt', 'msi', 'sp', 'skm', 'mp', 'se', 'sh', 'ssi', 'amd', 'ap', 'sos', 'mkn', 's', 'sip', 'skh'}
    filtered = [w for w in words if w not in titles]
    return ' '.join(filtered)

npwp_data = {}
for r in range(5, ws2.max_row + 1):
    n = ws2.cell(r, 2).value
    p = ws2.cell(r, 3).value
    g = ws2.cell(r, 4).value
    if n and str(n).strip() != '2':
        nama_str = str(n).strip()
        norm = normalize_name(nama_str)
        npwp_data[norm] = {
            'npwp': str(p or '').strip(),
            'golongan': str(g or '').strip()
        }

def determine_bidang(jabatan):
    j = jabatan.lower()
    if 'kepala dinas' in j or 'plt. kepala dinas' in j:
        return 'Pimpinan'
    if 'sekretaris' in j or 'sekretariat' in j or 'keuangan' in j or 'perencanaan' in j or 'kepegawaian' in j or 'umum' in j:
        return 'Sekretariat'
    if 'ketahanan pangan' in j or 'konsumsi' in j or 'keamanan pangan' in j or 'ketersediaan' in j or 'distribusi' in j:
        return 'Ketahanan Pangan'
    if 'pertanian' in j or 'tanaman pangan' in j or 'hortikultura' in j or 'perkebunan' in j or 'penyuluh' in j:
        return 'Pertanian'
    if 'perikanan' in j or 'nelayan' in j or 'budidaya' in j:
        return 'Perikanan'
    if 'peternakan' in j or 'veteriner' in j or 'kesehatan hewan' in j:
        return 'Peternakan & Keswan'
    return 'DKPP Kota Cilegon'

asn_rows = []
for r in range(6, ws1.max_row + 1):
    nama = ws1.cell(r, 2).value
    nip = ws1.cell(r, 3).value
    jabatan = ws1.cell(r, 4).value
    jenis_jabatan = ws1.cell(r, 5).value
    kelas_jabatan = ws1.cell(r, 6).value
    
    if not (nama and nip):
        continue
        
    nama_str = str(nama).strip()
    norm = normalize_name(nama_str)
    
    matched = npwp_data.get(norm)
    if not matched:
        for k, v in npwp_data.items():
            if norm and k and (norm in k or k in norm):
                matched = v
                break
                
    clean_nip = re.sub(r'\s+', '', str(nip).strip())
    jabatan_str = str(jabatan or '').strip()
    status_str = str(jenis_jabatan or '').strip()
    if 'fungsional' in status_str.lower():
        status_clean = 'Fungsional'
    elif 'struktural' in status_str.lower():
        status_clean = 'Struktural'
    elif 'pelaksana' in status_str.lower():
        status_clean = 'Pelaksana'
    else:
        status_clean = status_str
        
    asn_rows.append({
        'nama': nama_str,
        'nip': clean_nip,
        'npwp': matched['npwp'] if matched and matched['npwp'] else None,
        'kelas_jabatan': str(kelas_jabatan or '').strip(),
        'jabatan': jabatan_str,
        'status_pegawai': status_clean,
        'bidang': determine_bidang(jabatan_str),
        'golongan': matched['golongan'] if matched and matched['golongan'] else None
    })

thl_rows = []
for r in range(10, ws3.max_row + 1):
    n = ws3.cell(r, 2).value
    s = ws3.cell(r, 3).value
    if n and str(n).strip():
        thl_rows.append({
            'nama': str(n).strip(),
            'status': str(s or 'TKK').strip()
        })

sql_parts = []
sql_parts.append("""-- ====================================================================
-- MIGRATION 016: MASTER DATA PEGAWAI INTERNAL DKPP KOTA CILEGON
-- (NAMA, NIP, NPWP, KELAS JABATAN, NAMA JABATAN, STATUS STRUKTURAL/FUNGSIONAL)
-- DITANDAI SEBAGAI DATA SENSITIF & SEBAGAI DATA CEK KLAIM NIP USER
-- ====================================================================

-- 1. Struktur Tabel dkpp_pegawai_nip Lengkap
CREATE TABLE IF NOT EXISTS public.dkpp_pegawai_nip (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR(30) UNIQUE NOT NULL,
    nama VARCHAR(150) NOT NULL,
    npwp VARCHAR(40),
    kelas_jabatan VARCHAR(10),
    jabatan VARCHAR(200),
    status_pegawai VARCHAR(50) DEFAULT 'Fungsional', -- Struktural / Fungsional / Pelaksana
    bidang VARCHAR(100),
    golongan VARCHAR(20),
    is_sensitive BOOLEAN DEFAULT true, -- DITANDAI SEBAGAI DATA SENSITIF
    is_active BOOLEAN DEFAULT true,    -- STATUS VALIDASI CEK KLAIM NIP
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pastikan kolom baru tersedia jika tabel sudah ada sebelumnya
ALTER TABLE public.dkpp_pegawai_nip 
ADD COLUMN IF NOT EXISTS npwp VARCHAR(40),
ADD COLUMN IF NOT EXISTS kelas_jabatan VARCHAR(10),
ADD COLUMN IF NOT EXISTS status_pegawai VARCHAR(50) DEFAULT 'Fungsional',
ADD COLUMN IF NOT EXISTS golongan VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT true;

-- 2. Index Pencarian Cepat
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_nip_nip ON public.dkpp_pegawai_nip (nip);
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_nip_active ON public.dkpp_pegawai_nip (is_active);
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_nip_sensitive ON public.dkpp_pegawai_nip (is_sensitive);

-- 3. Row Level Security (RLS) & Kebijakan Akses Sensitif
ALTER TABLE public.dkpp_pegawai_nip ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Siapapun (Tamu / Publik) dapat memverifikasi NIP saat registrasi/klaim
DROP POLICY IF EXISTS "Public can verify NIP" ON public.dkpp_pegawai_nip;
CREATE POLICY "Public can verify NIP"
ON public.dkpp_pegawai_nip
FOR SELECT
USING (is_active = true);

-- Kebijakan: Hanya Super Admin atau service_role yang dapat mengubah / mengelola data pegawai
DROP POLICY IF EXISTS "Admin manage NIP" ON public.dkpp_pegawai_nip;
CREATE POLICY "Admin manage NIP"
ON public.dkpp_pegawai_nip
FOR ALL
USING (
    (auth.jwt() ->> 'email') = 'ridwansugiarto.mail@gmail.com'
    OR (auth.jwt() ->> 'role') = 'service_role'
);

-- 4. Stored Procedure RPC untuk Validasi NIP (Mendukung Input dengan Spasi maupun 18 Digit Polos)
CREATE OR REPLACE FUNCTION public.verify_dkpp_nip(input_nip TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    nama VARCHAR,
    jabatan VARCHAR,
    bidang VARCHAR,
    status_pegawai VARCHAR,
    kelas_jabatan VARCHAR,
    is_sensitive BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true, 
        p.nama, 
        p.jabatan, 
        p.bidang,
        p.status_pegawai,
        p.kelas_jabatan,
        p.is_sensitive
    FROM public.dkpp_pegawai_nip p
    WHERE (REPLACE(p.nip, ' ', '') = REPLACE(TRIM(input_nip), ' ', '') OR p.nip = TRIM(input_nip))
      AND p.is_active = true
    LIMIT 1;
END;
$$;

-- 5. SEED DATA 53 PEGAWAI INTERNAL ASN DKPP KOTA CILEGON (RESMI)
INSERT INTO public.dkpp_pegawai_nip (
    nip, 
    nama, 
    npwp, 
    kelas_jabatan, 
    jabatan, 
    status_pegawai, 
    bidang, 
    golongan, 
    is_sensitive, 
    is_active
) VALUES
""")

vals = []
for p in asn_rows:
    nama_esc = p['nama'].replace("'", "''")
    nip_esc = p['nip'].replace("'", "''")
    npwp_val = f"'{p['npwp']}'" if p['npwp'] else "NULL"
    kelas_val = f"'{p['kelas_jabatan']}'" if p['kelas_jabatan'] else "NULL"
    jab_esc = p['jabatan'].replace("'", "''")
    stat_esc = p['status_pegawai'].replace("'", "''")
    bid_esc = p['bidang'].replace("'", "''")
    gol_val = f"'{p['golongan']}'" if p['golongan'] else "NULL"
    
    vals.append(f"('{nip_esc}', '{nama_esc}', {npwp_val}, {kelas_val}, '{jab_esc}', '{stat_esc}', '{bid_esc}', {gol_val}, true, true)")

sql_parts.append(',\n'.join(vals))

sql_parts.append("""
ON CONFLICT (nip) DO UPDATE SET
    nama = EXCLUDED.nama,
    npwp = COALESCE(EXCLUDED.npwp, dkpp_pegawai_nip.npwp),
    kelas_jabatan = EXCLUDED.kelas_jabatan,
    jabatan = EXCLUDED.jabatan,
    status_pegawai = EXCLUDED.status_pegawai,
    bidang = EXCLUDED.bidang,
    golongan = COALESCE(EXCLUDED.golongan, dkpp_pegawai_nip.golongan),
    is_sensitive = EXCLUDED.is_sensitive,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- 6. Tabel Data Tambahan: Tenaga Harian Lepas (THL / TKK) Internal DKPP (Data Sensitif Internal)
CREATE TABLE IF NOT EXISTS public.dkpp_pegawai_thl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'TKK',
    instansi VARCHAR(100) DEFAULT 'Dinas Ketahanan Pangan dan Pertanian Kota Cilegon',
    is_sensitive BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dkpp_pegawai_thl ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin manage THL" ON public.dkpp_pegawai_thl;
CREATE POLICY "Admin manage THL" ON public.dkpp_pegawai_thl FOR ALL USING (
    (auth.jwt() ->> 'email') = 'ridwansugiarto.mail@gmail.com'
    OR (auth.jwt() ->> 'role') = 'service_role'
);

INSERT INTO public.dkpp_pegawai_thl (nama, status) VALUES
""")

thl_vals = []
for t in thl_rows:
    t_name = t['nama'].replace("'", "''")
    t_status = t['status'].replace("'", "''")
    thl_vals.append(f"('{t_name}', '{t_status}')")

sql_parts.append(',\n'.join(thl_vals))
sql_parts.append(";\n")

final_sql = ''.join(sql_parts)

os.makedirs('supabase/migrations', exist_ok=True)
with open(r'supabase\migrations\016_dkpp_pegawai_internal_full.sql', 'w', encoding='utf-8') as f:
    f.write(final_sql)

print(f"SUCCESS: Generated SQL with {len(asn_rows)} ASN and {len(thl_rows)} THL!")
