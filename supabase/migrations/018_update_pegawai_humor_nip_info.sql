-- ====================================================================
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
UPDATE public.dkpp_pegawai_humor SET nip = '197604152002121006', tanggal_lahir = '1976-04-15', tanggal_mulai_kerja_cpns = '2002-12', jenis_kelamin = 'L' WHERE nomor = 9 OR nama = 'Sutisna, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '197204081998021002', tanggal_lahir = '1972-04-08', tanggal_mulai_kerja_cpns = '1998-02', jenis_kelamin = 'L' WHERE nomor = 10 OR nama = 'Udin Saprudin, SE, M.M.';
UPDATE public.dkpp_pegawai_humor SET nip = '197610182002121002', tanggal_lahir = '1976-10-18', tanggal_mulai_kerja_cpns = '2002-12', jenis_kelamin = 'L' WHERE nomor = 12 OR nama = 'Ridwan Sugiarto, Spi';
UPDATE public.dkpp_pegawai_humor SET nip = '197703142006041012', tanggal_lahir = '1977-03-14', tanggal_mulai_kerja_cpns = '2006-04', jenis_kelamin = 'L' WHERE nomor = 14 OR nama = 'Abdul Latif, S.KH.';
UPDATE public.dkpp_pegawai_humor SET nip = '197708102007011011', tanggal_lahir = '1977-08-10', tanggal_mulai_kerja_cpns = '2007-01', jenis_kelamin = 'L' WHERE nomor = 18 OR nama = 'Wahyudi, SE';
UPDATE public.dkpp_pegawai_humor SET nip = '197603162009011003', tanggal_lahir = '1976-03-16', tanggal_mulai_kerja_cpns = '2009-01', jenis_kelamin = 'L' WHERE nomor = 22 OR nama = 'Paulus Dwi  Ari K D, ST';
UPDATE public.dkpp_pegawai_humor SET nip = '197910162010012008', tanggal_lahir = '1979-10-16', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'P' WHERE nomor = 24 OR nama = 'Winda Ratnasari, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '198111032010012005', tanggal_lahir = '1981-11-03', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'P' WHERE nomor = 25 OR nama = 'Sanlin Novitriana, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '198209262010012005', tanggal_lahir = '1982-09-26', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'P' WHERE nomor = 26 OR nama = 'Linda Setiawati, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '198602152010012006', tanggal_lahir = '1986-02-15', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'P' WHERE nomor = 27 OR nama = 'Febrika Indah Cahyani, SE, MM';
UPDATE public.dkpp_pegawai_humor SET nip = '198203222010012008', tanggal_lahir = '1982-03-22', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'P' WHERE nomor = 28 OR nama = 'Maryori, S.Pi';
UPDATE public.dkpp_pegawai_humor SET nip = '197705252008011010', tanggal_lahir = '1977-05-25', tanggal_mulai_kerja_cpns = '2008-01', jenis_kelamin = 'L' WHERE nomor = 31 OR nama = 'Arifudin, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '198611152009011001', tanggal_lahir = '1986-11-15', tanggal_mulai_kerja_cpns = '2009-01', jenis_kelamin = 'L' WHERE nomor = 32 OR nama = 'Mas Akhmad Rangga P, SE, MM';
UPDATE public.dkpp_pegawai_humor SET nip = '198908242015032006', tanggal_lahir = '1989-08-24', tanggal_mulai_kerja_cpns = '2015-03', jenis_kelamin = 'P' WHERE nomor = 35 OR nama = 'Ghesika Tiandra Yusty, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '198907132022211001', tanggal_lahir = '1989-07-13', tanggal_mulai_kerja_cpns = '2022-21', jenis_kelamin = 'L' WHERE nomor = 37 OR nama = 'Sandhi Maulana Adha, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '198107152014062001', tanggal_lahir = '1981-07-15', tanggal_mulai_kerja_cpns = '2014-06', jenis_kelamin = 'P' WHERE nomor = 39 OR nama = 'Sri Rahmadani Piliang, SE';
UPDATE public.dkpp_pegawai_humor SET nip = '198705022017061001', tanggal_lahir = '1987-05-02', tanggal_mulai_kerja_cpns = '2017-06', jenis_kelamin = 'L' WHERE nomor = 40 OR nama = 'Subandi';
UPDATE public.dkpp_pegawai_humor SET nip = '196806292002121003', tanggal_lahir = '1968-06-29', tanggal_mulai_kerja_cpns = '2002-12', jenis_kelamin = 'L' WHERE nomor = 5 OR nama = 'H. Mustofa, Sos,Msi';
UPDATE public.dkpp_pegawai_humor SET nip = '196601082002121004', tanggal_lahir = '1966-01-08', tanggal_mulai_kerja_cpns = '2002-12', jenis_kelamin = 'L' WHERE nomor = 7 OR nama = 'H.M.Muchtar,S.Sos,M.Si';
UPDATE public.dkpp_pegawai_humor SET nip = '197912232010011009', tanggal_lahir = '1979-12-23', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'L' WHERE nomor = 11 OR nama = 'Djadjat Djatnika, S.IP';
UPDATE public.dkpp_pegawai_humor SET nip = '197602132005011003', tanggal_lahir = '1976-02-13', tanggal_mulai_kerja_cpns = '2005-01', jenis_kelamin = 'L' WHERE nomor = 13 OR nama = 'Anugroho Nur W, S.Pt';
UPDATE public.dkpp_pegawai_humor SET nip = '198203202010011017', tanggal_lahir = '1982-03-20', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'L' WHERE nomor = 16 OR nama = 'drh. Abraham Syah';
UPDATE public.dkpp_pegawai_humor SET nip = '198508292010011008', tanggal_lahir = '1985-08-29', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'L' WHERE nomor = 19 OR nama = 'Ari Priyatna, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '197104092008011004', tanggal_lahir = '1971-04-09', tanggal_mulai_kerja_cpns = '2008-01', jenis_kelamin = 'L' WHERE nomor = 21 OR nama = 'Uki Rofika, SE';
UPDATE public.dkpp_pegawai_humor SET nip = '197712262010011006', tanggal_lahir = '1977-12-26', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'L' WHERE nomor = 23 OR nama = 'Hafid Dasuki, S.Pt';
UPDATE public.dkpp_pegawai_humor SET nip = '197804052006041006', tanggal_lahir = '1978-04-05', tanggal_mulai_kerja_cpns = '2006-04', jenis_kelamin = 'L' WHERE nomor = 33 OR nama = 'Amiruddin, SE';
UPDATE public.dkpp_pegawai_humor SET nip = '197710052008012010', tanggal_lahir = '1977-10-05', tanggal_mulai_kerja_cpns = '2008-01', jenis_kelamin = 'P' WHERE nomor = 34 OR nama = 'Lina Octavia, A.Md';
UPDATE public.dkpp_pegawai_humor SET nip = '198812312017061001', tanggal_lahir = '1988-12-31', tanggal_mulai_kerja_cpns = '2017-06', jenis_kelamin = 'L' WHERE nomor = 41 OR nama = 'Suharyadi';
UPDATE public.dkpp_pegawai_humor SET nip = '198809182017061001', tanggal_lahir = '1988-09-18', tanggal_mulai_kerja_cpns = '2017-06', jenis_kelamin = 'L' WHERE nomor = 42 OR nama = 'Dedi Septriyansa';
UPDATE public.dkpp_pegawai_humor SET nip = '198503282017061002', tanggal_lahir = '1985-03-28', tanggal_mulai_kerja_cpns = '2017-06', jenis_kelamin = 'L' WHERE nomor = 43 OR nama = 'Lahmudin';
UPDATE public.dkpp_pegawai_humor SET nip = '198507072017061001', tanggal_lahir = '1985-07-07', tanggal_mulai_kerja_cpns = '2017-06', jenis_kelamin = 'L' WHERE nomor = 44 OR nama = 'Ahmad Sarbini';
UPDATE public.dkpp_pegawai_humor SET nip = '197208112014062001', tanggal_lahir = '1972-08-11', tanggal_mulai_kerja_cpns = '2014-06', jenis_kelamin = 'P' WHERE nomor = 45 OR nama = 'Nina Masliana';
UPDATE public.dkpp_pegawai_humor SET nip = '199102022023211020', tanggal_lahir = '1991-02-02', tanggal_mulai_kerja_cpns = '2023-21', jenis_kelamin = 'L' WHERE nomor = 52 OR nama = 'Yudi Slamet Hidayat, S.P';
UPDATE public.dkpp_pegawai_humor SET nip = '198802272023212032', tanggal_lahir = '1988-02-27', tanggal_mulai_kerja_cpns = '2023-21', jenis_kelamin = 'P' WHERE nomor = 53 OR nama = 'Erna Febrianti, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '197002211999032002', tanggal_lahir = '1970-02-21', tanggal_mulai_kerja_cpns = '1999-03', jenis_kelamin = 'P' WHERE nomor = 1 OR nama = 'Efa Sarifah, ST, MT';
UPDATE public.dkpp_pegawai_humor SET nip = '197609241996031002', tanggal_lahir = '1976-09-24', tanggal_mulai_kerja_cpns = '1996-03', jenis_kelamin = 'L' WHERE nomor = 2 OR nama = 'Agus Purmono, A.P, MM';
UPDATE public.dkpp_pegawai_humor SET nip = '196807311997032004', tanggal_lahir = '1968-07-31', tanggal_mulai_kerja_cpns = '1997-03', jenis_kelamin = 'P' WHERE nomor = 3 OR nama = 'Ir. Lira Yuliantina, MM';
UPDATE public.dkpp_pegawai_humor SET nip = '196912141992032005', tanggal_lahir = '1969-12-14', tanggal_mulai_kerja_cpns = '1992-03', jenis_kelamin = 'P' WHERE nomor = 4 OR nama = 'Cahyaning Sukarti S.K.M, MM';
UPDATE public.dkpp_pegawai_humor SET nip = '196912122002122004', tanggal_lahir = '1969-12-12', tanggal_mulai_kerja_cpns = '2002-12', jenis_kelamin = 'P' WHERE nomor = 6 OR nama = 'Drh. Hj. Dina Safitri';
UPDATE public.dkpp_pegawai_humor SET nip = '197707022002121004', tanggal_lahir = '1977-07-02', tanggal_mulai_kerja_cpns = '2002-12', jenis_kelamin = 'L' WHERE nomor = 8 OR nama = 'Moch. Dwinanda Y,S.Pt';
UPDATE public.dkpp_pegawai_humor SET nip = '197511132010012006', tanggal_lahir = '1975-11-13', tanggal_mulai_kerja_cpns = '2010-01', jenis_kelamin = 'P' WHERE nomor = 15 OR nama = 'Liva Widiaty, SE, MM';
UPDATE public.dkpp_pegawai_humor SET nip = '197508212008032001', tanggal_lahir = '1975-08-21', tanggal_mulai_kerja_cpns = '2008-03', jenis_kelamin = 'P' WHERE nomor = 17 OR nama = 'Yessy Desvia, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '198207232009012001', tanggal_lahir = '1982-07-23', tanggal_mulai_kerja_cpns = '2009-01', jenis_kelamin = 'P' WHERE nomor = 20 OR nama = 'Adelina Andi Wiani Putri, SE';
UPDATE public.dkpp_pegawai_humor SET nip = '198005242006042018', tanggal_lahir = '1980-05-24', tanggal_mulai_kerja_cpns = '2006-04', jenis_kelamin = 'P' WHERE nomor = 29 OR nama = 'Meisaroh, SE';
UPDATE public.dkpp_pegawai_humor SET nip = '197105042008011008', tanggal_lahir = '1971-05-04', tanggal_mulai_kerja_cpns = '2008-01', jenis_kelamin = 'L' WHERE nomor = 30 OR nama = 'Kusnadi, SE';
UPDATE public.dkpp_pegawai_humor SET nip = '198407212017062001', tanggal_lahir = '1984-07-21', tanggal_mulai_kerja_cpns = '2017-06', jenis_kelamin = 'P' WHERE nomor = 36 OR nama = 'Shofi Nur Prihatin, SP';
UPDATE public.dkpp_pegawai_humor SET nip = '198312162017062001', tanggal_lahir = '1983-12-16', tanggal_mulai_kerja_cpns = '2017-06', jenis_kelamin = 'P' WHERE nomor = 38 OR nama = 'Devi Yuningsih, A.Md';
UPDATE public.dkpp_pegawai_humor SET nip = '199510092023211005', tanggal_lahir = '1995-10-09', tanggal_mulai_kerja_cpns = '2023-21', jenis_kelamin = 'L' WHERE nomor = 46 OR nama = 'Afri Rizka Amiardi, S.P';
UPDATE public.dkpp_pegawai_humor SET nip = '198308082023211022', tanggal_lahir = '1983-08-08', tanggal_mulai_kerja_cpns = '2023-21', jenis_kelamin = 'L' WHERE nomor = 47 OR nama = 'Maruli Setiawan, S.P';
UPDATE public.dkpp_pegawai_humor SET nip = '198207202023211009', tanggal_lahir = '1982-07-20', tanggal_mulai_kerja_cpns = '2023-21', jenis_kelamin = 'L' WHERE nomor = 48 OR nama = 'Oja Fakhruroja, S.T';
UPDATE public.dkpp_pegawai_humor SET nip = '199007192023211019', tanggal_lahir = '1990-07-19', tanggal_mulai_kerja_cpns = '2023-21', jenis_kelamin = 'L' WHERE nomor = 49 OR nama = 'Endra Purnama, S.P';
UPDATE public.dkpp_pegawai_humor SET nip = '197604232023212005', tanggal_lahir = '1976-04-23', tanggal_mulai_kerja_cpns = '2023-21', jenis_kelamin = 'P' WHERE nomor = 50 OR nama = 'Rosmani Butarbutar, S.P';
UPDATE public.dkpp_pegawai_humor SET nip = '197610142023211003', tanggal_lahir = '1976-10-14', tanggal_mulai_kerja_cpns = '2023-21', jenis_kelamin = 'L' WHERE nomor = 51 OR nama = 'Muhamad Hamdi, SP';

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
