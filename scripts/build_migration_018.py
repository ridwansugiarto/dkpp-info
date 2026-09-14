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
    jabatan = sheet_nip.cell(r, 4).value
    if nama and nip:
        clean_nip = re.sub(r'\s+', '', str(nip).strip())
        nama_str = str(nama).strip()
        data = {
            'no': int(no) if no is not None and str(no).strip().isdigit() else None,
            'nama': nama_str,
            'nip': clean_nip,
            'jabatan': str(jabatan or '').strip()
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

all_humor_records = []
eligible_records = []

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
            'kategori': 'MODE_BERCANDA_INTERNAL',
            'has_empty_cell': has_empty_cell
        }
        all_humor_records.append(record)
        if not has_empty_cell:
            eligible_records.append(record)

print(f"Total Humor Records (All): {len(all_humor_records)}")
print(f"Total Eligible Records: {len(eligible_records)}")

# ====================================================================
# BUILD MIGRATION 018: 018_update_pegawai_humor_nip_info.sql
# ====================================================================
sql_018 = """-- ====================================================================
-- MIGRATION 018: PENAMBAHAN KOLOM TANGGAL LAHIR, TANGGAL MULAI KERJA CPNS, 
-- DAN JENIS KELAMIN PADA TABEL dkpp_pegawai_humor BERDASARKAN ATURAN 18 DIGIT NIP
-- ====================================================================
-- Aturan 18 Angka dalam NIP (Peraturan BKN):
-- Format NIP: YYYYMMDD YYYYMM XX X
-- 1. Posisi 1–8  (8 angka): Tahun, bulan, dan tanggal lahir (YYYYMMDD -> DATE)
-- 2. Posisi 9–14 (6 angka): Tahun dan bulan pengangkatan CPNS/PNS (YYYYMM -> YYYY-MM)
-- 3. Posisi 15   (1 angka): Jenis kelamin (1 = Laki-laki 'L', 2 = Perempuan 'P')
-- 4. Posisi 16–18(3 angka): Nomor urut kepegawaian
-- ====================================================================

-- 1. Tambahkan kolom ke tabel dkpp_pegawai_humor jika belum tersedia
ALTER TABLE public.dkpp_pegawai_humor
ADD COLUMN IF NOT EXISTS nip VARCHAR(30),
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
ADD COLUMN IF NOT EXISTS tanggal_mulai_kerja_cpns VARCHAR(20),
ADD COLUMN IF NOT EXISTS jenis_kelamin CHAR(1);

-- 2. Buat Index untuk mempercepat query dan relasi
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_nip ON public.dkpp_pegawai_humor (nip);
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_jk ON public.dkpp_pegawai_humor (jenis_kelamin);
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_tgl_lahir ON public.dkpp_pegawai_humor (tanggal_lahir);

-- 3. UPDATE DINAMIS: Mengambil data NIP dari tabel dkpp_pegawai_nip dan mengekstrak ketiga atribut
UPDATE public.dkpp_pegawai_humor h
SET 
    nip = REPLACE(p.nip, ' ', ''),
    
    -- Aturan 1: Posisi 1-8 adalah tanggal lahir (YYYYMMDD)
    tanggal_lahir = CASE 
        -- Handle pengecualian jika ada format tidak standar
        WHEN SUBSTRING(REPLACE(p.nip, ' ', '') FROM 5 FOR 2)::INT BETWEEN 1 AND 12 
         AND SUBSTRING(REPLACE(p.nip, ' ', '') FROM 7 FOR 2)::INT BETWEEN 1 AND 31
        THEN TO_DATE(SUBSTRING(REPLACE(p.nip, ' ', '') FROM 1 FOR 8), 'YYYYMMDD')
        ELSE NULL
    END,
    
    -- Aturan 2: Posisi 9-14 adalah tahun dan bulan pengangkatan CPNS/PNS (YYYY-MM)
    -- (Catatan: Untuk PPPK digit bulan adalah 21, tetap aman disimpan sebagai teks YYYY-MM)
    tanggal_mulai_kerja_cpns = SUBSTRING(REPLACE(p.nip, ' ', '') FROM 9 FOR 4) || '-' || SUBSTRING(REPLACE(p.nip, ' ', '') FROM 13 FOR 2),
    
    -- Aturan 3: Posisi 15 adalah jenis kelamin (1 = Laki-laki, 2 = Perempuan)
    jenis_kelamin = CASE 
        WHEN SUBSTRING(REPLACE(p.nip, ' ', '') FROM 15 FOR 1) = '1' THEN 'L'
        WHEN SUBSTRING(REPLACE(p.nip, ' ', '') FROM 15 FOR 1) = '2' THEN 'P'
        ELSE h.jenis_kelamin
    END
FROM public.dkpp_pegawai_nip p
WHERE 
    (h.nip IS NOT NULL AND REPLACE(h.nip, ' ', '') = REPLACE(p.nip, ' ', ''))
    OR LOWER(TRIM(REGEXP_REPLACE(h.nama, '[,\.]', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(p.nama, '[,\.]', ' ', 'g')))
    OR (
        LOWER(TRIM(SPLIT_PART(h.nama, ',', 1))) = LOWER(TRIM(SPLIT_PART(p.nama, ',', 1)))
        AND LENGTH(TRIM(SPLIT_PART(h.nama, ',', 1))) > 3
    );

-- 4. UPDATE EKSPLISIT: Memastikan 100% data ASN di dkpp_pegawai_humor terisi presisi
"""

explicit_updates = []
for r in all_humor_records:
    if r['nip']:
        nama_esc = r['nama'].replace("'", "''")
        nip_val = r['nip']
        tgl_l = f"'{r['tanggal_lahir']}'" if r['tanggal_lahir'] else "NULL"
        cpns_val = f"'{r['tanggal_mulai_kerja_cpns']}'" if r['tanggal_mulai_kerja_cpns'] else "NULL"
        jk_val = f"'{r['jenis_kelamin']}'" if r['jenis_kelamin'] else "NULL"
        no_cond = f"nomor = {r['nomor']}" if r['nomor'] is not None else f"nama = '{nama_esc}'"
        
        explicit_updates.append(
            f"UPDATE public.dkpp_pegawai_humor SET nip = '{nip_val}', tanggal_lahir = {tgl_l}, tanggal_mulai_kerja_cpns = {cpns_val}, jenis_kelamin = {jk_val} WHERE {no_cond} OR nama = '{nama_esc}';"
        )

sql_018 += "\n".join(explicit_updates)

sql_018 += """

-- 5. FUNCTION & TRIGGER OTOMATIS: Menguraikan NIP secara otomatis setiap ada data baru / update
CREATE OR REPLACE FUNCTION public.sync_pegawai_humor_nip_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nip IS NOT NULL AND LENGTH(REPLACE(NEW.nip, ' ', '')) = 18 THEN
        -- Ekstrak Tanggal Lahir (Digit 1-8)
        BEGIN
            NEW.tanggal_lahir := TO_DATE(SUBSTRING(REPLACE(NEW.nip, ' ', '') FROM 1 FOR 8), 'YYYYMMDD');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        
        -- Ekstrak Tanggal Mulai CPNS (Digit 9-14)
        NEW.tanggal_mulai_kerja_cpns := SUBSTRING(REPLACE(NEW.nip, ' ', '') FROM 9 FOR 4) || '-' || SUBSTRING(REPLACE(NEW.nip, ' ', '') FROM 13 FOR 2);
        
        -- Ekstrak Jenis Kelamin (Digit 15: 1=L, 2=P)
        IF SUBSTRING(REPLACE(NEW.nip, ' ', '') FROM 15 FOR 1) = '1' THEN
            NEW.jenis_kelamin := 'L';
        ELSIF SUBSTRING(REPLACE(NEW.nip, ' ', '') FROM 15 FOR 1) = '2' THEN
            NEW.jenis_kelamin := 'P';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_pegawai_humor_nip_fields ON public.dkpp_pegawai_humor;
CREATE TRIGGER trg_sync_pegawai_humor_nip_fields
BEFORE INSERT OR UPDATE OF nip ON public.dkpp_pegawai_humor
FOR EACH ROW
EXECUTE FUNCTION public.sync_pegawai_humor_nip_fields();

-- 6. VIEW KOMPREHENSIF: Informasi Kepegawaian Lengkap dengan Umur & Masa Kerja
CREATE OR REPLACE VIEW public.v_dkpp_pegawai_humor_lengkap AS
SELECT 
    h.id,
    h.nomor,
    h.nama,
    h.nip,
    h.jenis_kelamin,
    CASE 
        WHEN h.jenis_kelamin = 'L' THEN 'Laki-laki'
        WHEN h.jenis_kelamin = 'P' THEN 'Perempuan'
        ELSE 'Belum Ditentukan'
    END AS jenis_kelamin_lengkap,
    h.tanggal_lahir,
    -- Hitung Umur Saat Ini
    DATE_PART('year', AGE(CURRENT_DATE, h.tanggal_lahir)) AS umur_tahun,
    h.tanggal_mulai_kerja_cpns,
    -- Estimasi Masa Kerja (jika tahun valid)
    CASE 
        WHEN h.tanggal_mulai_kerja_cpns IS NOT NULL AND LENGTH(h.tanggal_mulai_kerja_cpns) >= 4 THEN
            EXTRACT(YEAR FROM CURRENT_DATE) - SUBSTRING(h.tanggal_mulai_kerja_cpns FROM 1 FOR 4)::INT
        ELSE NULL
    END AS masa_kerja_tahun,
    p.jabatan,
    p.bidang,
    p.status_pegawai,
    p.golongan,
    h.skor_ketampanan_kecantikan,
    h.skor_daya_tarik_aura,
    h.jumlah_terpesona,
    h.skor_rajin_kehadiran,
    h.skor_kecerdasan,
    h.is_sensitive,
    h.kategori
FROM public.dkpp_pegawai_humor h
LEFT JOIN public.dkpp_pegawai_nip p ON REPLACE(h.nip, ' ', '') = REPLACE(p.nip, ' ', '');
"""

with open('supabase/migrations/018_update_pegawai_humor_nip_info.sql', 'w', encoding='utf-8') as f:
    f.write(sql_018)

print("Created supabase/migrations/018_update_pegawai_humor_nip_info.sql successfully!")
