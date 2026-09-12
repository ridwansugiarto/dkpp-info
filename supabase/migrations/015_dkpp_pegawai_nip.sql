-- ====================================================================
-- MIGRATION 015: TATAKELOLA DAFTAR NIP PEGAWAI DINAS KETAHANAN PANGAN & PERTANIAN KOTA CILEGON
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.dkpp_pegawai_nip (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR(25) UNIQUE NOT NULL,
    nama VARCHAR(150) NOT NULL,
    jabatan VARCHAR(150),
    bidang VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index NIP untuk pencarian super cepat
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_nip_nip ON public.dkpp_pegawai_nip (nip);
CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_nip_active ON public.dkpp_pegawai_nip (is_active);

-- Enable RLS
ALTER TABLE public.dkpp_pegawai_nip ENABLE ROW LEVEL SECURITY;

-- 1. Siapapun (publik/tamu) dapat memverifikasi status NIP saat mendaftar akun
DROP POLICY IF EXISTS "Public can verify NIP" ON public.dkpp_pegawai_nip;
CREATE POLICY "Public can verify NIP"
ON public.dkpp_pegawai_nip
FOR SELECT
USING (is_active = true);

-- 2. Hanya Admin (ridwansugiarto.mail@gmail.com) atau service_role yang dapat menambah, mengubah, dan menghapus NIP
DROP POLICY IF EXISTS "Admin manage NIP" ON public.dkpp_pegawai_nip;
CREATE POLICY "Admin manage NIP"
ON public.dkpp_pegawai_nip
FOR ALL
USING (
    (auth.jwt() ->> 'email') = 'ridwansugiarto.mail@gmail.com'
    OR (auth.jwt() ->> 'role') = 'service_role'
);

-- Function RPC untuk validasi NIP saat registrasi
CREATE OR REPLACE FUNCTION public.verify_dkpp_nip(input_nip TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    nama VARCHAR,
    jabatan VARCHAR,
    bidang VARCHAR
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT true, p.nama, p.jabatan, p.bidang
    FROM public.dkpp_pegawai_nip p
    WHERE p.nip = TRIM(input_nip) AND p.is_active = true
    LIMIT 1;
END;
$$;

-- SEED DATA PLACEHOLDER NIP PEGAWAI RESMI DKPP KOTA CILEGON
INSERT INTO public.dkpp_pegawai_nip (nip, nama, jabatan, bidang, is_active) VALUES
('197610182002121002', 'Dr. Ir. Ridwan Sugiarto, M.Si', 'Kepala Dinas DKPP (Super Admin)', 'Pimpinan', true),
('198003152006041008', 'Ahmad Fauzi, SP, M.M', 'Sekretaris Dinas', 'Sekretariat', true),
('198207182008012014', 'Siti Rahmawati, S.Pt, M.Si', 'Kepala Bidang Ketahanan Pangan', 'Ketahanan Pangan', true),
('198509212009021005', 'Budi Santoso, S.P', 'Kepala Bidang Pertanian', 'Pertanian', true),
('198811042011011002', 'Dedi Kurniawan, S.Pi', 'Kepala Bidang Perikanan & Peternakan', 'Perikanan & Peternakan', true),
('199002142015032007', 'Nurul Hidayah, S.Tr.P', 'Analis Ketahanan Pangan Ahli Muda', 'Ketahanan Pangan', true),
('199306282019021004', 'Hendro Wicaksono, A.Md', 'Pengelola Sistem Informasi GIS', 'Sekretariat', true),
('199504122020122009', 'Dewi Lestari, S.Si', 'Petugas Pendata Panel Harga Sagon', 'Ketahanan Pangan', true),
('199608192022031003', 'Fajar Pratama, S.Tr.Kom', 'Operator Database & Telemetri Lengas Tanah', 'Sekretariat', true)
ON CONFLICT (nip) DO UPDATE SET
    nama = EXCLUDED.nama,
    jabatan = EXCLUDED.jabatan,
    bidang = EXCLUDED.bidang,
    is_active = EXCLUDED.is_active,
    updated_at = now();
