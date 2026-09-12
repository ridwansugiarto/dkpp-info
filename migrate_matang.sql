-- SQL DDL Migration: Mature FSVA & SKPG Datasets
-- Execute this script in your Supabase SQL Editor.

-- =========================================================================
-- 1. TABEL FSVA DATA MATANG (Pre-calculated composite index & priority)
-- =========================================================================
CREATE TABLE IF NOT EXISTS fsva_matang (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kelurahan varchar(100) NOT NULL,
  kode_kel_bps varchar(50) NOT NULL,
  ikp numeric NOT NULL,
  periode int NOT NULL,
  rank int,
  idx_ketersediaan numeric,
  idx_akses numeric,
  idx_pemanfaatan numeric,
  score_lahan numeric,
  score_sarana numeric,
  score_miskin numeric,
  score_jalan numeric,
  score_air numeric,
  score_tenkes numeric,
  rasio_miskin numeric,
  rasio_air numeric,
  raw_miskin numeric,
  raw_air numeric,
  ncpr numeric,
  energy numeric,
  animal_protein numeric,
  food_reserves numeric,
  poverty numeric,
  price_cv numeric,
  pou numeric,
  female_school numeric,
  no_water numeric,
  pph numeric,
  stunting numeric,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was previously created with minimal columns
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS rank INT;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS idx_ketersediaan NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS idx_akses NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS idx_pemanfaatan NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS score_lahan NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS score_sarana NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS score_miskin NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS score_jalan NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS score_air NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS score_tenkes NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS rasio_miskin NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS rasio_air NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS raw_miskin NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS raw_air NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS ncpr NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS energy NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS animal_protein NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS food_reserves NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS poverty NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS price_cv NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS pou NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS female_school NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS no_water NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS pph NUMERIC;
ALTER TABLE fsva_matang ADD COLUMN IF NOT EXISTS stunting NUMERIC;

-- =========================================================================
-- 2. TABEL SKPG DATA MATANG (Mature underweight & malnutrition metrics)
-- =========================================================================
CREATE TABLE IF NOT EXISTS skpg_matang (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kelurahan varchar(100) NOT NULL,
  gizi_kurang int NOT NULL,
  gizi_sangat_kurang int NOT NULL,
  gizi_berlebih int NOT NULL,
  gizi_normal int NOT NULL,
  periode int NOT NULL,
  bulan int NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


-- Indexing for high-speed queries on period and kelurahan
CREATE INDEX IF NOT EXISTS idx_fsva_matang_period_kel ON fsva_matang (periode, nama_kelurahan);
CREATE INDEX IF NOT EXISTS idx_skpg_matang_period_kel ON skpg_matang (periode, nama_kelurahan);

-- Disable Row Level Security (RLS) so seeder and app can read & write using the anon key
ALTER TABLE fsva_matang DISABLE ROW LEVEL SECURITY;
ALTER TABLE skpg_matang DISABLE ROW LEVEL SECURITY;
