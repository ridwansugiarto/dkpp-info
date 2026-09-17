-- ==============================================================================
-- BAGIAN 1: STRUKTUR TABEL, INDEX, DAN PERMISSIONS (RENSTRA DKPP KOTA CILEGON)
-- ==============================================================================

-- 1. renstra_tujuan_sasaran (Tabel 3.3)
CREATE TABLE IF NOT EXISTS public.renstra_tujuan_sasaran (
    id BIGSERIAL PRIMARY KEY,
    no INT,
    nspk_sasaran_rpjmd TEXT,
    tujuan TEXT,
    sasaran_pd TEXT,
    indikator_sasaran TEXT,
    satuan TEXT,
    baseline_2024 NUMERIC,
    target_2025 NUMERIC,
    target_2026 NUMERIC,
    target_2027 NUMERIC,
    target_2028 NUMERIC,
    target_2029 NUMERIC,
    target_2030 NUMERIC,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. renstra_cascading_program (Tabel 4.1)
CREATE TABLE IF NOT EXISTS public.renstra_cascading_program (
    id BIGSERIAL PRIMARY KEY,
    tujuan TEXT,
    sasaran TEXT,
    indikator_sasaran TEXT,
    program TEXT,
    indikator_program TEXT,
    satuan TEXT,
    target_baseline_2024 NUMERIC,
    target_2025 NUMERIC,
    pagu_2025 NUMERIC,
    target_2026 NUMERIC,
    pagu_2026 NUMERIC,
    target_2027 NUMERIC,
    pagu_2027 NUMERIC,
    target_2028 NUMERIC,
    pagu_2028 NUMERIC,
    target_2029 NUMERIC,
    pagu_2029 NUMERIC,
    target_2030 NUMERIC,
    unit_penanggung_jawab TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. renstra_teknik_rumusan_pelayanan (Tabel 4.2)
CREATE TABLE IF NOT EXISTS public.renstra_teknik_rumusan_pelayanan (
    id BIGSERIAL PRIMARY KEY,
    page_num INT,
    nspk_sasaran_rpjmd TEXT,
    tujuan TEXT,
    sasaran TEXT,
    outcome TEXT,
    output TEXT,
    indikator TEXT,
    program_kegiatan_subkegiatan TEXT,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. renstra_ikd (Tabel 4.3 IKD)
CREATE TABLE IF NOT EXISTS public.renstra_ikd (
    id BIGSERIAL PRIMARY KEY,
    no INT,
    urusan_pd TEXT,
    indikator TEXT,
    satuan TEXT,
    baseline_2024 NUMERIC,
    target_2025 NUMERIC,
    target_2026 NUMERIC,
    target_2027 NUMERIC,
    target_2028 NUMERIC,
    target_2029 NUMERIC,
    target_2030 NUMERIC,
    perangkat_daerah TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. renstra_program_kegiatan_pagu (Tabel 4.3 V2)
CREATE TABLE IF NOT EXISTS public.renstra_program_kegiatan_pagu (
    id BIGSERIAL PRIMARY KEY,
    page_num INT,
    kode_uraian TEXT,
    indikator TEXT,
    baseline_2024 TEXT,
    target_2026 TEXT,
    pagu_2026 NUMERIC,
    target_2027 TEXT,
    pagu_2027 NUMERIC,
    target_2028 TEXT,
    pagu_2028 NUMERIC,
    target_2029 TEXT,
    pagu_2029 NUMERIC,
    target_2030 TEXT,
    pagu_2030 NUMERIC,
    perangkat_daerah TEXT,
    lokasi_keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. renstra_subkegiatan_prioritas (Tabel 4.4)
CREATE TABLE IF NOT EXISTS public.renstra_subkegiatan_prioritas (
    id BIGSERIAL PRIMARY KEY,
    no INT,
    kode_skpd TEXT,
    nama_skpd TEXT,
    kode_program TEXT,
    nama_program TEXT,
    outcome TEXT,
    kode_kegiatan TEXT,
    nama_kegiatan TEXT,
    kode_subkegiatan TEXT,
    nama_subkegiatan TEXT,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. renstra_iku (Tabel 4.5)
CREATE TABLE IF NOT EXISTS public.renstra_iku (
    id BIGSERIAL PRIMARY KEY,
    no INT,
    kode_skpd TEXT,
    nama_skpd TEXT,
    indikator TEXT,
    satuan TEXT,
    baseline_2024 NUMERIC,
    target_2025 NUMERIC,
    target_2026 NUMERIC,
    target_2027 NUMERIC,
    target_2028 NUMERIC,
    target_2029 NUMERIC,
    target_2030 NUMERIC,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. renstra_ikk (Tabel 4.6)
CREATE TABLE IF NOT EXISTS public.renstra_ikk (
    id BIGSERIAL PRIMARY KEY,
    kode_urusan_pd TEXT,
    nama_urusan_pd TEXT,
    no_urut INT,
    indikator TEXT,
    status TEXT,
    satuan TEXT,
    baseline_2024 NUMERIC,
    target_2025 NUMERIC,
    target_2026 NUMERIC,
    target_2027 NUMERIC,
    target_2028 NUMERIC,
    target_2029 NUMERIC,
    target_2030 NUMERIC,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES UNTUK SPEED QUERY CHATBOT
CREATE INDEX IF NOT EXISTS idx_renstra_tujuan ON public.renstra_tujuan_sasaran USING btree(tujuan);
CREATE INDEX IF NOT EXISTS idx_renstra_sasaran ON public.renstra_tujuan_sasaran USING btree(indikator_sasaran);
CREATE INDEX IF NOT EXISTS idx_renstra_cascading_prog ON public.renstra_cascading_program USING btree(program);
CREATE INDEX IF NOT EXISTS idx_renstra_cascading_ind ON public.renstra_cascading_program USING btree(indikator_program);
CREATE INDEX IF NOT EXISTS idx_renstra_pagu_uraian ON public.renstra_program_kegiatan_pagu USING btree(kode_uraian);
CREATE INDEX IF NOT EXISTS idx_renstra_pagu_ind ON public.renstra_program_kegiatan_pagu USING btree(indikator);
CREATE INDEX IF NOT EXISTS idx_renstra_iku_ind ON public.renstra_iku USING btree(indikator);
CREATE INDEX IF NOT EXISTS idx_renstra_ikk_ind ON public.renstra_ikk USING btree(indikator);
CREATE INDEX IF NOT EXISTS idx_renstra_ikd_ind ON public.renstra_ikd USING btree(indikator);

-- RLS & GRANTS
ALTER TABLE public.renstra_tujuan_sasaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_cascading_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_teknik_rumusan_pelayanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_ikd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_program_kegiatan_pagu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_subkegiatan_prioritas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_iku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renstra_ikk ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow select for all" ON public.renstra_tujuan_sasaran;
    CREATE POLICY "Allow select for all" ON public.renstra_tujuan_sasaran FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow select for all" ON public.renstra_cascading_program;
    CREATE POLICY "Allow select for all" ON public.renstra_cascading_program FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow select for all" ON public.renstra_teknik_rumusan_pelayanan;
    CREATE POLICY "Allow select for all" ON public.renstra_teknik_rumusan_pelayanan FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow select for all" ON public.renstra_ikd;
    CREATE POLICY "Allow select for all" ON public.renstra_ikd FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow select for all" ON public.renstra_program_kegiatan_pagu;
    CREATE POLICY "Allow select for all" ON public.renstra_program_kegiatan_pagu FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow select for all" ON public.renstra_subkegiatan_prioritas;
    CREATE POLICY "Allow select for all" ON public.renstra_subkegiatan_prioritas FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow select for all" ON public.renstra_iku;
    CREATE POLICY "Allow select for all" ON public.renstra_iku FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow select for all" ON public.renstra_ikk;
    CREATE POLICY "Allow select for all" ON public.renstra_ikk FOR SELECT USING (true);
END $$;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
