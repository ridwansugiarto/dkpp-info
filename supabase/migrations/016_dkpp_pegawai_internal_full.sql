-- ====================================================================
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
('197002211999032002', 'Efa Sarifah, ST, MT', '48.167.534.6-417.000', '14', 'Plt. Kepala Dinas', 'Struktural', 'Pimpinan', 'IV/c', true, true),
('197609241996031002', 'Agus Purmono, A.P, MM', NULL, '11', 'Sekretaris', 'Struktural', 'Sekretariat', NULL, true, true),
('196807311997032004', 'Ir. Lira Yuliantina, MM', '48.167.957.9-417.000', '11', 'Kepala Bidang Perikanan', 'Struktural', 'Perikanan', 'IV/a', true, true),
('196912141992032005', 'Cahyaning Sukarti S.K.M, MM', NULL, '11', 'Kepala Bidang Konsumsi dan Keamanan Pangan', 'Struktural', 'Ketahanan Pangan', NULL, true, true),
('196806292002121003', 'H. Mustofa, Sos,Msi', NULL, '11', 'Kepala BidangPertanian', 'Struktural', 'Pertanian', NULL, true, true),
('196912122002122004', 'Drh. Hj. Dina Safitri', '48.167.961.1-417.000', '9', 'Medik Veteriner Ahli Muda', 'Fungsional', 'Peternakan & Keswan', 'IV/a', true, true),
('196601082002121004', 'H.M.Muchtar,S.Sos,M.Si', '78.678.925.5-401.000', '10', 'Analis Ketahanan Pangan ahli Muda', 'Fungsional', 'Ketahanan Pangan', 'IV/a', true, true),
('197707022002121004', 'Moch. Dwinanda Y,S.Pt', '48.167.976.9-417.000', '10', 'Analis Ketahanan Pangna Ahli Muda Subkoor', 'Fungsional', 'DKPP Kota Cilegon', 'III/d', true, true),
('197604152002121006', 'Sutisna, SP', '48.167.977-417.000', '9', 'Pengawas Mutu Hasil Pertanian', 'Fungsional', 'Pertanian', 'III/d', true, true),
('197204081998021002', 'Udin Saprudin, SE, M.M.', '09.174.252.8-417.000', '9', 'Kepala UPTD Budidaya Air Tawar dan Air Payau', 'Struktural', 'Perikanan', 'IV/a', true, true),
('197912232010011009', 'Djadjat Djatnika, S.IP', '69.821.420.2.417.000', '8', 'Kasubag TU UPTD Kawasan Pertanian Terpadu', 'Struktural', 'Pertanian', 'III/d', true, true),
('197610182002121002', 'Ridwan Sugiarto, Spi', '48.167.978.5-417.000', '10', 'Analis Ketahanan Pangan Ahli Muda', 'Fungsional', 'Ketahanan Pangan', 'III/d', true, true),
('197602132005011003', 'Anugroho Nur W, S.Pt', '48.167.985.0-417.000', '9', 'Pengawas Mutu Hasil Pertanian - Ahli Muda', 'Fungsional', 'Pertanian', 'III/d', true, true),
('197703142006041012', 'Abdul Latif, S.KH.', '48.167.987.6-417.000', '9', 'Kepala UPTD Rumah Potong Hewan dan Pasar Hewan', 'Struktural', 'DKPP Kota Cilegon', 'III/d', true, true),
('197511132010012006', 'Liva Widiaty, SE, MM', '77.435.655.4-401.000', '9', 'Kepala Sub Bagian Umum dan Kepegawaian', 'Struktural', 'Sekretariat', 'III/d', true, true),
('198203202010011017', 'drh. Abraham Syah', '59.676.544.6-417.000', '9', 'Medik Veteriner Ahli Muda', 'Fungsional', 'Peternakan & Keswan', 'IV/a', true, true),
('197508212008032001', 'Yessy Desvia, SP', '89.926.400.6.417.000', '10', 'Analais Ketahanan Pangan Ahli Muda', 'Fungsional', 'Ketahanan Pangan', 'III/d', true, true),
('197708102007011011', 'Wahyudi, SE', '89.062.139.4-417.000', '8', 'Kasubag Tata Usaha UPTD Rumah Potong Hewan dan Pasar Hewan', 'Struktural', 'DKPP Kota Cilegon', 'III/d', true, true),
('198508292010011008', 'Ari Priyatna, SP', '89.062.145.1-417.000', '9', 'Pengawas Mutu Hasil Pertanian Ahli Muda Subkoor', 'Fungsional', 'Pertanian', 'III/d', true, true),
('198207232009012001', 'Adelina Andi Wiani Putri, SE', '77.453.047.1-417.000', '8', 'Kasubag TU UPTD Budidaya Air Tawar dan Air Payau', 'Struktural', 'Perikanan', 'III/c', true, true),
('197104092008011004', 'Uki Rofika, SE', '77.100.953.7-417.000', '7', 'Analis Pangan', 'Fungsional', 'DKPP Kota Cilegon', 'III/d', true, true),
('197603162009011003', 'Paulus Dwi  Ari K D, ST', '77.435.534.1-417.000', '7', 'Analis Kelautan dan Perikanan', 'Fungsional', 'Perikanan', 'III/d', true, true),
('197712262010011006', 'Hafid Dasuki, S.Pt', '89.060.242.8-417.000', '7', 'Pengawas Mutu Bibit Ternak', 'Fungsional', 'DKPP Kota Cilegon', 'III/d', true, true),
('197910162010012008', 'Winda Ratnasari, SP', '89.060.243.6-417.000', '7', 'Analis Pangan', 'Fungsional', 'DKPP Kota Cilegon', 'III/d', true, true),
('198111032010012005', 'Sanlin Novitriana, SP', '89.060.241.0-417.000', '7', 'Penyusun Teknis Usaha Budidaya', 'Fungsional', 'Perikanan', 'III/d', true, true),
('198209262010012005', 'Linda Setiawati, SP', '89.062.144.4-417.000', '9', 'Pengawas Mutu Hasil Pertanian', 'Fungsional', 'Pertanian', 'III/d', true, true),
('198602152010012006', 'Febrika Indah Cahyani, SE, MM', '68.125.319.1-417.000', '7', 'Pengawas Sanitasi Usaha Peternakan, dan Kesehatan Masyarakat Veteriner', 'Fungsional', 'Peternakan & Keswan', 'III/d', true, true),
('198203222010012008', 'Maryori, S.Pi', '89.062.140.2-417.000', '7', 'Penyusun kebutuhan barang inventaris', 'Fungsional', 'DKPP Kota Cilegon', 'III/c', true, true),
('198005242006042018', 'Meisaroh, SE', '77.100.950.3-417.000', '10', 'Analais Ketahanan Pangan Ahli Muda', 'Fungsional', 'Ketahanan Pangan', 'III/b', true, true),
('197105042008011008', 'Kusnadi, SE', '77.100.952.9-401.000', '7', 'Analis Pola Konsumsi Pangan Masyarakat', 'Fungsional', 'Ketahanan Pangan', 'III/c', true, true),
('197705252008011010', 'Arifudin, SP', '77.100.939.6.417.000', '7', 'Pengawas pupuk dan pestisida', 'Fungsional', 'DKPP Kota Cilegon', 'III/c', true, true),
('198611152009011001', 'Mas Akhmad Rangga P, SE, MM', '35.865.766.6.401.000', '7', 'Pengawas Mutu Bibit Ternak', 'Fungsional', 'DKPP Kota Cilegon', 'III/c', true, true),
('197804052006041006', 'Amiruddin, SE', '48.167.991.8.417.000', '7', 'Bendahara', 'Fungsional', 'DKPP Kota Cilegon', 'III/b', true, true),
('197710052008012010', 'Lina Octavia, A.Md', '77.100.951.1-417.000', '6', 'Pengelola ketahanan pangan', 'Fungsional', 'Ketahanan Pangan', 'III/b', true, true),
('198908242015032006', 'Ghesika Tiandra Yusty, SP', '73.209.358.8-324.000', '7', 'Analis proses akreditasi lembaga sertifikasi produk, personel, halal pangan organik', 'Fungsional', 'DKPP Kota Cilegon', 'III/b', true, true),
('198407212017062001', 'Shofi Nur Prihatin, SP', '72.108.439.0-419.000', '9', 'Penyuluh Pertanian Ahli Muda', 'Fungsional', 'Pertanian', 'III/a', true, true),
('198907132022211001', 'Sandhi Maulana Adha, SP', NULL, '8', 'Analis Ketahanan Pangan Pertama', 'Fungsional', 'Ketahanan Pangan', NULL, true, true),
('198312162017062001', 'Devi Yuningsih, A.Md', '72.158.616.2-401.000', '6', 'Penyuluh Pertanian Terampil', 'Fungsional', 'Pertanian', 'II/c', true, true),
('198107152014062001', 'Sri Rahmadani Piliang, SE', '70.512.021.0-417.000', '7', 'Bendahara', 'Fungsional', 'DKPP Kota Cilegon', 'III/a', true, true),
('198705022017061001', 'Subandi', '58.590.082.117.000', '6', 'Penyuluh Pertanian Terampil', 'Fungsional', 'Pertanian', 'II/a', true, true),
('198812312017061001', 'Suharyadi', '89.926.624.3-417.000', '6', 'Penyuluh Pertanian Terampil', 'Fungsional', 'Pertanian', 'II/a', true, true),
('198809182017061001', 'Dedi Septriyansa', '88.286.987.8-417.000', '6', 'Penyuluh Pertanian Terampil', 'Fungsional', 'Pertanian', 'II/a', true, true),
('198503282017061002', 'Lahmudin', '72.164.718.8-417.000', '6', 'Penyuluh Pertanian Terampil', 'Fungsional', 'Pertanian', 'II/a', true, true),
('198507072017061001', 'Ahmad Sarbini', '72.085.256.5-417.000', '6', 'Penyuluh Pertanian Terampil', 'Fungsional', 'Pertanian', 'II/a', true, true),
('197208112014062001', 'Nina Masliana', '70.505.797.4-417.000', '5', 'Pengelola sarana dan prasarana kantor', 'Fungsional', 'DKPP Kota Cilegon', 'II/a', true, true),
('199510092023211005', 'Afri Rizka Amiardi, S.P', NULL, '8', 'Penyuluh Pertanian-Ahli Pertama', 'Fungsional', 'Pertanian', NULL, true, true),
('198308082023211022', 'Maruli Setiawan, S.P', NULL, '8', 'Penyuluh Pertanian-Ahli Pertama', 'Fungsional', 'Pertanian', NULL, true, true),
('198207202023211009', 'Oja Fakhruroja, S.T', NULL, '8', 'Penyuluh Pertanian-Ahli Pertama', 'Fungsional', 'Pertanian', NULL, true, true),
('199007192023211019', 'Endra Purnama, S.P', NULL, '8', 'Penyuluh Pertanian-Ahli Pertama', 'Fungsional', 'Pertanian', NULL, true, true),
('197604232023212005', 'Rosmani Butarbutar, S.P', NULL, '8', 'Penyuluh Pertanian-Ahli Pertama', 'Fungsional', 'Pertanian', NULL, true, true),
('197610142023211003', 'Muhamad Hamdi, SP', NULL, '8', 'Penyuluh Pertanian-Ahli Pertama', 'Fungsional', 'Pertanian', NULL, true, true),
('199102022023211020', 'Yudi Slamet Hidayat, S.P', NULL, '8', 'Penyuluh Pertanian-Ahli Pertama', 'Fungsional', 'Pertanian', NULL, true, true),
('198802272023212032', 'Erna Febrianti, SP', NULL, '8', 'Analis Ketahanan Pangan-Ahli Pertama', 'Fungsional', 'Ketahanan Pangan', NULL, true, true)
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
('Minarni.SE', 'TKK'),
('Santawi', 'TKK'),
('Ghoni Syafiulloh, S.Ak', 'TKK'),
('Tandis Destalana, SE.MM', 'TKK'),
('Sri Ratnaningsih, S.Pi', 'TKK'),
('Yuki Suryarizki.S.kom', 'THL'),
('Edwin Maulana,SE', 'THL'),
('Ita Titalia', 'THL'),
('Abi Sukarya', 'THL'),
('Ayu Lestari', 'THL'),
('Haryanto', 'THL'),
('Nova Khaerdayanti, A.Md', 'THL'),
('Maisaroh, SP', 'THL'),
('Rusdi', 'THL'),
('Rofiqoh, S.Sos', 'THL'),
('Driantama Bayu Saputra', 'THL'),
('Tomi Mardiyanto', 'THL'),
('Musfiroh, S.Pi', 'THL'),
('Muhamad Farhan.S.Pi', 'THL'),
('Fani Herawati,SP', 'THL'),
('Rizkyullah, SM', 'THL'),
('Mariatul Hofat, SM', 'THL'),
('Hartono', 'THL'),
('F. Mahmud', 'THL'),
('Maskan', 'THL'),
('Mas Adi Maulana.SP', 'THL'),
('Hadiri', 'THL'),
('Asep Qomaruzzaman, S.AP', 'THL'),
('Ayaza Azzahra, S.M', 'THL'),
('Dede Tri Mulyana, SP', 'THL'),
('Ailsa Bhanuwati, A.Md. Vet', 'THL'),
('Maida Rintan Astuti', 'THL'),
('Reza Maulana Muhammad, SP', 'THL'),
('Iyan Rachman, SE', 'TENAGA KEAMANAN'),
('Heri. S.PdI', 'TENAGA KEAMANAN'),
('Iwan', 'TENAGA KEAMANAN'),
('Muhtadi', 'TENAGA KEAMANAN'),
('Ninin Anjani', 'CLEANING SERVICE'),
('Mastufah', 'CLEANING SERVICE'),
('Muhaemin', 'CLEANING SERVICE'),
('Robet Wahid', 'CLEANING SERVICE'),
('Rofiatul Adawiyah', 'CLEANING SERVICE'),
('Yusuf Supriatna', 'CLEANING SERVICE');
