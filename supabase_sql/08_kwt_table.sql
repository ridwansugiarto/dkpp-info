-- ============================================================
-- TABEL KWT (KELOMPOK WANITA TANI)
-- DKPP Kota Cilegon - Data Tahun 2026
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------
-- Tabel utama KWT
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.kwt (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    no_urut             INT,                                          -- Nomor urut dari Excel
    kecamatan           TEXT        NOT NULL,                         -- Kecamatan (8 kecamatan Cilegon)
    kelurahan           TEXT        NOT NULL,                         -- Kelurahan
    nama_kwt            TEXT        NOT NULL,                         -- Nama Kelompok Wanita Tani
    nama_ketua          TEXT,                                         -- Nama ketua KWT (placeholder)
    no_wa_ketua         TEXT,                                         -- No WhatsApp ketua (placeholder)
    no_hp_ketua         TEXT,                                         -- No HP alternatif
    alamat_sekretariat  TEXT,                                         -- Alamat sekretariat kelompok
    luas_lahan          TEXT,                                         -- Luas lahan (jika ada)
    keterangan          TEXT,                                         -- Status: Aktif / Fakum
    bantuan             TEXT,                                         -- Riwayat bantuan dari DKPP
    jenis_usaha         TEXT,                                         -- Jenis usaha utama
    latitude            DOUBLE PRECISION,                             -- Koordinat latitude (geocoded)
    longitude           DOUBLE PRECISION,                             -- Koordinat longitude (geocoded)
    maps_link           TEXT,                                         -- Google Maps URL
    geocode_display     TEXT,                                         -- Hasil geocode mentah (untuk debug)
    is_active           BOOLEAN     NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kolom tambahan backward compat
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS no_urut            INT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS nama_ketua         TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS no_wa_ketua        TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS no_hp_ketua        TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS luas_lahan         TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS keterangan         TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS bantuan            TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS jenis_usaha        TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS latitude           DOUBLE PRECISION;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS longitude          DOUBLE PRECISION;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS maps_link          TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS geocode_display    TEXT;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS is_active          BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.kwt ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ NOT NULL DEFAULT now();

-- -----------------------------------------------
-- Index untuk performa query & pencarian
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_kwt_kecamatan  ON public.kwt (kecamatan);
CREATE INDEX IF NOT EXISTS idx_kwt_kelurahan  ON public.kwt (kelurahan);
CREATE INDEX IF NOT EXISTS idx_kwt_active     ON public.kwt (is_active);
CREATE INDEX IF NOT EXISTS idx_kwt_coords     ON public.kwt (latitude, longitude) WHERE latitude IS NOT NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_kwt_nama_trgm ON public.kwt USING GIN (nama_kwt gin_trgm_ops);

-- -----------------------------------------------
-- Trigger auto update updated_at
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.set_kwt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kwt_updated_at ON public.kwt;
CREATE TRIGGER trg_kwt_updated_at
    BEFORE UPDATE ON public.kwt
    FOR EACH ROW EXECUTE FUNCTION public.set_kwt_updated_at();

-- -----------------------------------------------
-- Row Level Security
-- -----------------------------------------------
ALTER TABLE public.kwt ENABLE ROW LEVEL SECURITY;

-- Siapa saja bisa baca (chatbot, user, publik)
DROP POLICY IF EXISTS "kwt_read_all"      ON public.kwt;
CREATE POLICY "kwt_read_all"
    ON public.kwt FOR SELECT USING (true);

-- Hanya service_role yang bisa write (admin backend)
DROP POLICY IF EXISTS "kwt_write_service" ON public.kwt;
CREATE POLICY "kwt_write_service"
    ON public.kwt FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Verifikasi
SELECT COUNT(*) as total, COUNT(latitude) as geocoded FROM public.kwt;
