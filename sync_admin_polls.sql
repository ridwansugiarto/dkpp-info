-- ============================================================
-- SINKRONISASI PERUBAHAN ADMIN → TABEL MASTER POLLS
-- Berdasarkan capture panel SuperAdmin Polling Engine DKPP
-- Tanggal: 2026-09-24
--
-- Jalankan di Supabase SQL Editor (Settings → SQL Editor)
-- Aman dijalankan berulang kali (UPDATE ... WHERE code = '...')
-- ============================================================

-- -----------------------------------------------
-- 0. Tambah kolom updated_at jika belum ada
--    (aman dijalankan meski kolom sudah ada)
-- -----------------------------------------------
ALTER TABLE public.polls
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Trigger otomatis isi updated_at saat UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_polls_updated_at ON public.polls;
CREATE TRIGGER trg_polls_updated_at
    BEFORE UPDATE ON public.polls
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------
-- 1. soleh → "Pegawai Paling Soleh & Religius"
-- (Sebelum: "Pegawai Paling Soleh & Santun")
-- -----------------------------------------------
UPDATE public.polls
SET
    title       = 'Pegawai Paling Soleh & Religius',
    short_label = 'Paling Soleh',
    icon        = '🕌',
    description = 'Siapa pegawai paling on time di mushola, dan paling baik akhlaknya di kantor?',
    updated_at  = now()
WHERE code = 'soleh';

-- -----------------------------------------------
-- 2. dermawan → "Pegawai Paling Bersih"
-- (Sebelum: "Pegawai Paling Dermawan")
-- -----------------------------------------------
UPDATE public.polls
SET
    title       = 'Pegawai Paling Bersih',
    short_label = 'Paling Bersih',
    icon        = '🧹',
    description = 'Siapa pegawai yang paling suka beberes dan menjaga kebersihan ruangan kantor?',
    updated_at  = now()
WHERE code = 'dermawan';

-- -----------------------------------------------
-- 3. tahu_segala → "Pegawai Paling Ramah"
-- (Sebelum: "Pegawai Paling Tahu Segala (Kamus Berjalan)")
-- -----------------------------------------------
UPDATE public.polls
SET
    title       = 'Pegawai Paling Ramah',
    short_label = 'Paling Ramah',
    icon        = '😀',
    description = 'Siapa pegawai yang selalu menyapa duluan dan paling ramah kepada siapa saja?',
    updated_at  = now()
WHERE code = 'tahu_segala';

-- -----------------------------------------------
-- 4. update → "Pegawai Paling Pendiam"
-- (Sebelum: "Pegawai Paling Update")
-- -----------------------------------------------
UPDATE public.polls
SET
    title       = 'Pegawai Paling Pendiam',
    short_label = 'Paling Pendiam',
    icon        = '🤫',
    description = 'Siapa pegawai yang paling pendiam, diam-diam menghanyutkan di kantor?',
    updated_at  = now()
WHERE code = 'update';

-- -----------------------------------------------
-- 5. gaptek → "Pegawai Paling Suka Jajan"
-- (Sebelum: "Pegawai Paling Gaptek (Lucu & Innocent)")
-- -----------------------------------------------
UPDATE public.polls
SET
    title       = 'Pegawai Paling Suka Jajan',
    short_label = 'Paling Banyak Jajan',
    icon        = '🍔',
    description = 'Siapa yang paling sering ke warung beli jajanan atau ngemil di kantor?',
    updated_at  = now()
WHERE code = 'gaptek';

-- -----------------------------------------------
-- 6. cool → "Pegawai Paling Cool & Nyantai"
-- (Sebelum: "Pegawai Paling Cool & Tenang")
-- -----------------------------------------------
UPDATE public.polls
SET
    title       = 'Pegawai Paling Cool & Nyantai',
    short_label = 'Paling Cool',
    icon        = '😎',
    description = 'Siapa yang selalu santai, tenang menghadapi deadline badai, dan tetap berkharisma?',
    updated_at  = now()
WHERE code = 'cool';

-- -----------------------------------------------
-- 7. trendy → "Pegawai Paling Sibuk"
-- (Sebelum: "Pegawai Paling Trendy & Modis")
-- -----------------------------------------------
UPDATE public.polls
SET
    title       = 'Pegawai Paling Sibuk',
    short_label = 'Paling Sibuk',
    icon        = '🤓',
    description = 'Siapa pegawai yang kelihatannya sibuk mulai pagi sampai sore setiap harinya?',
    updated_at  = now()
WHERE code = 'trendy';

-- -----------------------------------------------
-- VERIFIKASI: tampilkan hasil setelah update
-- -----------------------------------------------
SELECT
    code,
    title,
    short_label,
    icon,
    is_active,
    updated_at
FROM public.polls
WHERE code IN ('soleh', 'dermawan', 'tahu_segala', 'update', 'gaptek', 'cool', 'trendy')
ORDER BY
    CASE code
        WHEN 'soleh'       THEN 1
        WHEN 'dermawan'    THEN 2
        WHEN 'tahu_segala' THEN 3
        WHEN 'update'      THEN 4
        WHEN 'gaptek'      THEN 5
        WHEN 'cool'        THEN 6
        WHEN 'trendy'      THEN 7
    END;
