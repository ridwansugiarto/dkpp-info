-- ====================================================================
-- MIGRATION 017: DATA PENDUKUNG INTERNAL DKPP (MODE BERCANDA / HUMOR)
-- HANYA BERISI PEGAWAI DENGAN SELURUH CELL RATING LENGKAP
-- PEGAWAI DENGAN CELL KOSONG / EMPTY DIKECUALIKAN KARENA SERIUS
-- DITANDAI SEBAGAI DATA SENSITIF & TERISOLASI KHUSUS JAWABAN SANTAI
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.dkpp_pegawai_humor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor INT,
    nip VARCHAR(30),
    nama VARCHAR(150) NOT NULL,
    tanggal_lahir DATE,
    tanggal_mulai_kerja_cpns VARCHAR(20),
    jenis_kelamin CHAR(1), -- L / P
    skor_ketampanan_kecantikan INT NOT NULL, -- Skor 1-10
    skor_daya_tarik_aura INT NOT NULL, -- Skor 1-10
    jumlah_terpesona INT NOT NULL, -- Jumlah yang tertarik/terpesona
    skor_rajin_kehadiran INT NOT NULL, -- Skor 1-10
    skor_kecerdasan INT NOT NULL, -- Skor 1-10
    is_sensitive BOOLEAN DEFAULT true, -- DITANDAI SEBAGAI DATA SENSITIF
    kategori VARCHAR(50) DEFAULT 'MODE_BERCANDA_INTERNAL',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dkpp_pegawai_humor
ADD COLUMN IF NOT EXISTS nip VARCHAR(30),
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
ADD COLUMN IF NOT EXISTS tanggal_mulai_kerja_cpns VARCHAR(20),
ADD COLUMN IF NOT EXISTS jenis_kelamin CHAR(1);

CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_nama ON public.dkpp_pegawai_humor (nama);
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_nip ON public.dkpp_pegawai_humor (nip);
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_sens ON public.dkpp_pegawai_humor (is_sensitive);

ALTER TABLE public.dkpp_pegawai_humor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage humor data" ON public.dkpp_pegawai_humor;
CREATE POLICY "Admin manage humor data" ON public.dkpp_pegawai_humor FOR ALL USING (
    (auth.jwt() ->> 'email') = 'ridwansugiarto.mail@gmail.com'
    OR (auth.jwt() ->> 'role') = 'service_role'
);

DROP POLICY IF EXISTS "Public read humor data" ON public.dkpp_pegawai_humor;
CREATE POLICY "Public read humor data" ON public.dkpp_pegawai_humor FOR SELECT USING (
    true
);

-- Bersihkan tabel sebelum memasukkan data lengkap
TRUNCATE TABLE public.dkpp_pegawai_humor;

INSERT INTO public.dkpp_pegawai_humor (
    nomor, nip, nama, tanggal_lahir, tanggal_mulai_kerja_cpns, jenis_kelamin, skor_ketampanan_kecantikan, skor_daya_tarik_aura, jumlah_terpesona, skor_rajin_kehadiran, skor_kecerdasan, is_sensitive, kategori
) VALUES
(9, '197604152002121006', 'Sutisna, SP', '1976-04-15', '2002-12', 'L', 7, 9, 5, 5, 8, true, 'MODE_BERCANDA_INTERNAL'),
(10, '197204081998021002', 'Udin Saprudin, SE, M.M.', '1972-04-08', '1998-02', 'L', 9, 9, 8, 4, 9, true, 'MODE_BERCANDA_INTERNAL'),
(12, '197610182002121002', 'Ridwan Sugiarto, Spi', '1976-10-18', '2002-12', 'L', 9, 9, 1, 10, 10, true, 'MODE_BERCANDA_INTERNAL'),
(14, '197703142006041012', 'Abdul Latif, S.KH.', '1977-03-14', '2006-04', 'L', 8, 6, 4, 7, 7, true, 'MODE_BERCANDA_INTERNAL'),
(18, '197708102007011011', 'Wahyudi, SE', '1977-08-10', '2007-01', 'L', 8, 8, 7, 6, 10, true, 'MODE_BERCANDA_INTERNAL'),
(22, '197603162009011003', 'Paulus Dwi  Ari K D, ST', '1976-03-16', '2009-01', 'L', 10, 10, 12, 10, 5, true, 'MODE_BERCANDA_INTERNAL'),
(24, '197910162010012008', 'Winda Ratnasari, SP', '1979-10-16', '2010-01', 'P', 9, 9, 10, 10, 9, true, 'MODE_BERCANDA_INTERNAL'),
(25, '198111032010012005', 'Sanlin Novitriana, SP', '1981-11-03', '2010-01', 'P', 6, 6, 1, 10, 8, true, 'MODE_BERCANDA_INTERNAL'),
(26, '198209262010012005', 'Linda Setiawati, SP', '1982-09-26', '2010-01', 'P', 7, 7, 4, 10, 8, true, 'MODE_BERCANDA_INTERNAL'),
(27, '198602152010012006', 'Febrika Indah Cahyani, SE, MM', '1986-02-15', '2010-01', 'P', 4, 4, 1, 10, 8, true, 'MODE_BERCANDA_INTERNAL'),
(28, '198203222010012008', 'Maryori, S.Pi', '1982-03-22', '2010-01', 'P', 8, 10, 9, 7, 6, true, 'MODE_BERCANDA_INTERNAL'),
(31, '197705252008011010', 'Arifudin, SP', '1977-05-25', '2008-01', 'L', 8, 7, 3, 10, 7, true, 'MODE_BERCANDA_INTERNAL'),
(32, '198611152009011001', 'Mas Akhmad Rangga P, SE, MM', '1986-11-15', '2009-01', 'L', 8, 8, 5, 10, 10, true, 'MODE_BERCANDA_INTERNAL'),
(35, '198908242015032006', 'Ghesika Tiandra Yusty, SP', '1989-08-24', '2015-03', 'P', 8, 7, 5, 10, 6, true, 'MODE_BERCANDA_INTERNAL'),
(37, '198907132022211001', 'Sandhi Maulana Adha, SP', '1989-07-13', '2022-21', 'L', 7, 8, 3, 8, 10, true, 'MODE_BERCANDA_INTERNAL'),
(39, '198107152014062001', 'Sri Rahmadani Piliang, SE', '1981-07-15', '2014-06', 'P', 10, 10, 10, 10, 9, true, 'MODE_BERCANDA_INTERNAL'),
(40, '198705022017061001', 'Subandi', '1987-05-02', '2017-06', 'L', 10, 10, 50, 9, 6, true, 'MODE_BERCANDA_INTERNAL'),
(54, NULL, 'Minarni.SE', NULL, NULL, 'P', 10, 9, 20, 10, 9, true, 'MODE_BERCANDA_INTERNAL'),
(57, NULL, 'Tandis Destalana, SE.MM', NULL, NULL, 'L', 9, 9, 9, 6, 7, true, 'MODE_BERCANDA_INTERNAL'),
(58, NULL, 'Sri Ratnaningsih, S.Pi', NULL, NULL, 'P', 10, 10, 30, 10, 7, true, 'MODE_BERCANDA_INTERNAL'),
(59, NULL, 'Yuki Suryarizki.S.kom', NULL, NULL, 'L', 10, 10, 45, 7, 7, true, 'MODE_BERCANDA_INTERNAL'),
(60, NULL, 'Edwin Maulana,SE', NULL, NULL, 'L', 7, 8, 12, 7, 9, true, 'MODE_BERCANDA_INTERNAL'),
(61, NULL, 'Ita Titalia', NULL, NULL, 'P', 7, 6, 5, 7, 6, true, 'MODE_BERCANDA_INTERNAL'),
(63, NULL, 'Ayu Lestari', NULL, NULL, 'P', 7, 7, 5, 9, 7, true, 'MODE_BERCANDA_INTERNAL'),
(65, NULL, 'Nova Khaerdayanti, A.Md', NULL, NULL, 'P', 8, 8, 12, 9, 9, true, 'MODE_BERCANDA_INTERNAL'),
(66, NULL, 'Maisaroh, SP', NULL, NULL, 'P', 9, 9, 20, 9, 9, true, 'MODE_BERCANDA_INTERNAL'),
(69, NULL, 'Driantama Bayu Saputra', NULL, NULL, 'L', 8, 9, 8, 6, 8, true, 'MODE_BERCANDA_INTERNAL'),
(70, NULL, 'Tomi Mardiyanto', NULL, NULL, 'P', 2, 2, 1, 5, 4, true, 'MODE_BERCANDA_INTERNAL'),
(75, NULL, 'Mariatul Hofat, SM', NULL, NULL, 'P', 8, 7, 5, 9, 9, true, 'MODE_BERCANDA_INTERNAL'),
(79, NULL, 'Mas Adi Maulana.SP', NULL, NULL, 'L', 8, 8, 5, 8, 9, true, 'MODE_BERCANDA_INTERNAL'),
(80, NULL, 'Hadiri', NULL, NULL, 'L', 5, 4, 2, 8, 6, true, 'MODE_BERCANDA_INTERNAL'),
(81, NULL, 'Asep Qomaruzzaman, S.AP', NULL, NULL, 'L', 10, 10, 48, 6, 10, true, 'MODE_BERCANDA_INTERNAL'),
(84, NULL, 'Ailsa Bhanuwati, A.Md. Vet', NULL, NULL, 'P', 8, 8, 15, 7, 8, true, 'MODE_BERCANDA_INTERNAL'),
(91, NULL, 'Ninin Anjani', NULL, NULL, 'P', 7, 7, 8, 6, 5, true, 'MODE_BERCANDA_INTERNAL'),
(92, NULL, 'Mastufah', NULL, NULL, 'P', 5, 4, 1, 6, 2, true, 'MODE_BERCANDA_INTERNAL');