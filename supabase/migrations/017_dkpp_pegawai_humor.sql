-- ====================================================================
-- MIGRATION 017: DATA PENDUKUNG INTERNAL DKPP (MODE BERCANDA / HUMOR)
-- DITANDAI SEBAGAI DATA SENSITIF & TERISOLASI KHUSUS JAWABAN SANTAI
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.dkpp_pegawai_humor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor INT,
    nama VARCHAR(150) NOT NULL,
    jenis_kelamin CHAR(1), -- L / P
    skor_ketampanan_kecantikan INT, -- Skor 1-10
    skor_daya_tarik_aura INT, -- Skor 1-10
    jumlah_terpesona INT, -- Jumlah yang tertarik/terpesona
    skor_rajin_kehadiran INT, -- Skor 1-10
    skor_kecerdasan INT, -- Skor 1-10
    is_sensitive BOOLEAN DEFAULT true, -- DITANDAI SEBAGAI DATA SENSITIF
    kategori VARCHAR(50) DEFAULT 'MODE_BERCANDA_INTERNAL',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_humor_nama ON public.dkpp_pegawai_humor (nama);
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
    nomor, nama, jenis_kelamin, skor_ketampanan_kecantikan, skor_daya_tarik_aura, jumlah_terpesona, skor_rajin_kehadiran, skor_kecerdasan, is_sensitive, kategori
) VALUES
(9, 'Sutisna, SP', 'L', 7, 9, 5, 5, 8, true, 'MODE_BERCANDA_INTERNAL'),
(10, 'Udin Saprudin, SE, M.M.', 'L', 9, 9, 8, 4, 9, true, 'MODE_BERCANDA_INTERNAL'),
(12, 'Ridwan Sugiarto, Spi', 'L', 9, 9, 1, 10, 10, true, 'MODE_BERCANDA_INTERNAL'),
(14, 'Abdul Latif, S.KH.', 'L', 8, 6, 4, 7, 7, true, 'MODE_BERCANDA_INTERNAL'),
(18, 'Wahyudi, SE', 'L', 8, 8, 7, 6, 10, true, 'MODE_BERCANDA_INTERNAL'),
(22, 'Paulus Dwi  Ari K D, ST', 'L', 10, 10, 12, 10, 5, true, 'MODE_BERCANDA_INTERNAL'),
(24, 'Winda Ratnasari, SP', 'P', 9, 9, 10, 10, 9, true, 'MODE_BERCANDA_INTERNAL'),
(25, 'Sanlin Novitriana, SP', 'P', 6, 6, 1, 10, 8, true, 'MODE_BERCANDA_INTERNAL'),
(26, 'Linda Setiawati, SP', 'P', 7, 7, 4, 10, 8, true, 'MODE_BERCANDA_INTERNAL'),
(27, 'Febrika Indah Cahyani, SE, MM', 'P', 4, 4, 1, 10, 8, true, 'MODE_BERCANDA_INTERNAL'),
(28, 'Maryori, S.Pi', 'P', 8, 10, 9, 7, 6, true, 'MODE_BERCANDA_INTERNAL'),
(31, 'Arifudin, SP', 'L', 8, 7, 3, 10, 7, true, 'MODE_BERCANDA_INTERNAL'),
(32, 'Mas Akhmad Rangga P, SE, MM', 'L', 8, 8, 5, 10, 10, true, 'MODE_BERCANDA_INTERNAL'),
(35, 'Ghesika Tiandra Yusty, SP', 'P', 8, 7, 5, 10, 6, true, 'MODE_BERCANDA_INTERNAL'),
(37, 'Sandhi Maulana Adha, SP', 'L', 7, 8, 3, 8, 10, true, 'MODE_BERCANDA_INTERNAL'),
(39, 'Sri Rahmadani Piliang, SE', 'P', 10, 10, 10, 10, 9, true, 'MODE_BERCANDA_INTERNAL'),
(40, 'Subandi', 'L', 10, 10, 50, 9, 6, true, 'MODE_BERCANDA_INTERNAL'),
(54, 'Minarni.SE', 'P', 10, 9, 20, 10, 9, true, 'MODE_BERCANDA_INTERNAL'),
(57, 'Tandis Destalana, SE.MM', 'L', 9, 9, 9, 6, 7, true, 'MODE_BERCANDA_INTERNAL'),
(58, 'Sri Ratnaningsih, S.Pi', 'P', 10, 10, 30, 10, 7, true, 'MODE_BERCANDA_INTERNAL'),
(59, 'Yuki Suryarizki.S.kom', 'L', 10, 10, 45, 7, 7, true, 'MODE_BERCANDA_INTERNAL'),
(60, 'Edwin Maulana,SE', 'L', 7, 8, 12, 7, 9, true, 'MODE_BERCANDA_INTERNAL'),
(61, 'Ita Titalia', 'P', 7, 6, 5, 7, 6, true, 'MODE_BERCANDA_INTERNAL'),
(63, 'Ayu Lestari', 'P', 7, 7, 5, 9, 7, true, 'MODE_BERCANDA_INTERNAL'),
(65, 'Nova Khaerdayanti, A.Md', 'P', 8, 8, 12, 9, 9, true, 'MODE_BERCANDA_INTERNAL'),
(66, 'Maisaroh, SP', 'P', 9, 9, 20, 9, 9, true, 'MODE_BERCANDA_INTERNAL'),
(69, 'Driantama Bayu Saputra', 'L', 8, 9, 8, 6, 8, true, 'MODE_BERCANDA_INTERNAL'),
(70, 'Tomi Mardiyanto', 'P', 2, 2, 1, 5, 4, true, 'MODE_BERCANDA_INTERNAL'),
(75, 'Mariatul Hofat, SM', 'P', 8, 7, 5, 9, 9, true, 'MODE_BERCANDA_INTERNAL'),
(79, 'Mas Adi Maulana.SP', 'L', 8, 8, 5, 8, 9, true, 'MODE_BERCANDA_INTERNAL'),
(80, 'Hadiri', 'L', 5, 4, 2, 8, 6, true, 'MODE_BERCANDA_INTERNAL'),
(81, 'Asep Qomaruzzaman, S.AP', 'L', 10, 10, 48, 6, 10, true, 'MODE_BERCANDA_INTERNAL'),
(84, 'Ailsa Bhanuwati, A.Md. Vet', 'P', 8, 8, 15, 7, 8, true, 'MODE_BERCANDA_INTERNAL'),
(91, 'Ninin Anjani', 'P', 7, 7, 8, 6, 5, true, 'MODE_BERCANDA_INTERNAL'),
(92, 'Mastufah', 'P', 5, 4, 1, 6, 2, true, 'MODE_BERCANDA_INTERNAL'),
(5, 'H. Mustofa, Sos,Msi', 'L', 6, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(7, 'H.M.Muchtar,S.Sos,M.Si', 'L', 6, NULL, NULL, NULL, 6, true, 'MODE_BERCANDA_INTERNAL'),
(11, 'Djadjat Djatnika, S.IP', 'L', 7, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(13, 'Anugroho Nur W, S.Pt', 'L', 6, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(16, 'drh. Abraham Syah', 'L', 5, NULL, NULL, NULL, 8, true, 'MODE_BERCANDA_INTERNAL'),
(19, 'Ari Priyatna, SP', 'P', 6, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(21, 'Uki Rofika, SE', 'L', 6, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(23, 'Hafid Dasuki, S.Pt', 'L', 6, NULL, NULL, NULL, 9, true, 'MODE_BERCANDA_INTERNAL'),
(33, 'Amiruddin, SE', 'L', 9, NULL, NULL, NULL, 8, true, 'MODE_BERCANDA_INTERNAL'),
(34, 'Lina Octavia, A.Md', 'P', 6, NULL, NULL, NULL, 6, true, 'MODE_BERCANDA_INTERNAL'),
(41, 'Suharyadi', 'L', 6, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(42, 'Dedi Septriyansa', 'L', 6, NULL, NULL, NULL, 9, true, 'MODE_BERCANDA_INTERNAL'),
(43, 'Lahmudin', 'L', 6, NULL, NULL, NULL, 5, true, 'MODE_BERCANDA_INTERNAL'),
(44, 'Ahmad Sarbini', 'L', 5, NULL, NULL, NULL, 8, true, 'MODE_BERCANDA_INTERNAL'),
(45, 'Nina Masliana', 'P', 7, NULL, NULL, NULL, 5, true, 'MODE_BERCANDA_INTERNAL'),
(52, 'Yudi Slamet Hidayat, S.P', 'L', 6, NULL, NULL, NULL, 5, true, 'MODE_BERCANDA_INTERNAL'),
(53, 'Erna Febrianti, SP', 'L', 5, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(55, 'Santawi', 'L', 5, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(56, 'Ghoni Syafiulloh, S.Ak', 'L', 6, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(67, 'Rusdi', 'L', 5, NULL, NULL, NULL, 6, true, 'MODE_BERCANDA_INTERNAL'),
(68, 'Rofiqoh, S.Sos', 'P', 4, NULL, NULL, NULL, 5, true, 'MODE_BERCANDA_INTERNAL'),
(71, 'Musfiroh, S.Pi', 'P', 7, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(73, 'Fani Herawati,SP', 'P', 5, NULL, NULL, NULL, 6, true, 'MODE_BERCANDA_INTERNAL'),
(74, 'Rizkyullah, SM', 'L', 7, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(78, 'Maskan', 'L', 6, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(82, 'Ayaza Azzahra, S.M', 'P', 8, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(83, 'Dede Tri Mulyana, SP', 'L', 6, NULL, NULL, NULL, 5, true, 'MODE_BERCANDA_INTERNAL'),
(85, 'Maida Rintan Astuti', 'P', 5, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(86, 'Reza Maulana Muhammad, SP', 'L', 7, NULL, NULL, NULL, 9, true, 'MODE_BERCANDA_INTERNAL'),
(87, 'Iyan Rachman, SE', 'L', 4, NULL, NULL, NULL, 3, true, 'MODE_BERCANDA_INTERNAL'),
(88, 'Heri. S.PdI', 'L', 5, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(90, 'Muhtadi', 'L', 5, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(94, 'Robet Wahid', 'L', 5, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(95, 'Rofiatul Adawiyah', 'P', 5, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(96, 'Yusuf Supriatna', 'L', 5, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(1, 'Efa Sarifah, ST, MT', 'P', NULL, NULL, NULL, NULL, 10, true, 'MODE_BERCANDA_INTERNAL'),
(2, 'Agus Purmono, A.P, MM', 'L', NULL, NULL, NULL, NULL, 10, true, 'MODE_BERCANDA_INTERNAL'),
(3, 'Ir. Lira Yuliantina, MM', 'P', NULL, NULL, NULL, NULL, 9, true, 'MODE_BERCANDA_INTERNAL'),
(4, 'Cahyaning Sukarti S.K.M, MM', 'P', NULL, NULL, NULL, NULL, 7, true, 'MODE_BERCANDA_INTERNAL'),
(6, 'Drh. Hj. Dina Safitri', 'P', NULL, NULL, NULL, NULL, 10, true, 'MODE_BERCANDA_INTERNAL'),
(8, 'Moch. Dwinanda Y,S.Pt', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(15, 'Liva Widiaty, SE, MM', 'P', NULL, NULL, NULL, NULL, 4, true, 'MODE_BERCANDA_INTERNAL'),
(17, 'Yessy Desvia, SP', 'P', NULL, NULL, NULL, NULL, 8, true, 'MODE_BERCANDA_INTERNAL'),
(20, 'Adelina Andi Wiani Putri, SE', 'P', NULL, NULL, NULL, NULL, 8, true, 'MODE_BERCANDA_INTERNAL'),
(29, 'Meisaroh, SE', 'P', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(30, 'Kusnadi, SE', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(36, 'Shofi Nur Prihatin, SP', 'P', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(38, 'Devi Yuningsih, A.Md', 'P', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(46, 'Afri Rizka Amiardi, S.P', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(47, 'Maruli Setiawan, S.P', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(48, 'Oja Fakhruroja, S.T', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(49, 'Endra Purnama, S.P', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(50, 'Rosmani Butarbutar, S.P', 'P', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(51, 'Muhamad Hamdi, SP', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(62, 'Abi Sukarya', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(64, 'Haryanto', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(72, 'Muhamad Farhan.S.Pi', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(76, 'Hartono', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(77, 'F. Mahmud', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(89, 'Iwan', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL'),
(93, 'Muhaemin', 'L', NULL, NULL, NULL, NULL, NULL, true, 'MODE_BERCANDA_INTERNAL');