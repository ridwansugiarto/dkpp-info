-- ============================================================
-- MIGRASI TABEL MASTER TEMA POLLING PEGAWAI DKPP KOTA CILEGON
-- Versi: 2026-09-24
-- Jalankan di Supabase SQL Editor (Settings → SQL Editor)
-- Aman dijalankan berulang kali - menggunakan CREATE TABLE IF NOT EXISTS
-- dan INSERT ... ON CONFLICT (code) DO UPDATE (UPSERT)
-- ============================================================

-- -----------------------------------------------
-- 0. Ekstensi Pendukung (jika belum ada)
-- -----------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------
-- 1. Tabel Master Tema Polling: polls
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.polls (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT          UNIQUE NOT NULL,          -- slug unik, mis: 'cantik', 'trendy', 'sibuk'
    title       TEXT          NOT NULL,                 -- Judul lengkap, mis: 'Pegawai Paling Sibuk'
    short_label TEXT          NOT NULL DEFAULT '',      -- Label pendek untuk kartu UI, mis: 'Paling Sibuk'
    icon        TEXT          DEFAULT '🏆',             -- Emoji representasi tema
    description TEXT,                                  -- Deskripsi/pertanyaan polling
    max_choices INT           NOT NULL DEFAULT 3,       -- Maks pilihan per voter
    allow_self_vote BOOLEAN   NOT NULL DEFAULT false,   -- Boleh pilih diri sendiri?
    is_active   BOOLEAN       NOT NULL DEFAULT true,    -- Status aktif/non-aktif
    starts_at   TIMESTAMPTZ   DEFAULT now(),            -- Waktu mulai polling (opsional)
    ends_at     TIMESTAMPTZ,                            -- Waktu selesai polling (NULL = tidak terbatas)
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Tambahkan kolom jika tabel sudah ada sebelumnya
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS starts_at     TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS ends_at       TIMESTAMPTZ;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS icon          TEXT DEFAULT '🏆';
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS description   TEXT;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS short_label   TEXT;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS max_choices   INT NOT NULL DEFAULT 3;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS allow_self_vote BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT true;

-- Backfill short_label jika ada row yang NULL
UPDATE public.polls SET short_label = title WHERE short_label IS NULL OR short_label = '';

-- Index performa
CREATE INDEX IF NOT EXISTS idx_polls_code     ON public.polls (code);
CREATE INDEX IF NOT EXISTS idx_polls_active   ON public.polls (is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created  ON public.polls (created_at);

-- -----------------------------------------------
-- 2. Trigger: otomatis update kolom updated_at
-- -----------------------------------------------
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
-- 3. Tabel Votes (suara mentah)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.votes (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id     TEXT          NOT NULL,
    user_id     TEXT          NOT NULL,
    employee_id TEXT          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE (poll_id, user_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_poll_id   ON public.votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON public.votes (poll_id, user_id);

-- -----------------------------------------------
-- 4. Tabel Partisipasi Polling
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.poll_participations (
    poll_id      TEXT         NOT NULL,
    user_id      TEXT         NOT NULL,
    choices_count INT         NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, user_id)
);

-- -----------------------------------------------
-- 5. Tabel Hasil Agregat Polling
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.poll_results (
    poll_id     TEXT         NOT NULL,
    employee_id TEXT         NOT NULL,
    total_votes INT          NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_results_poll_id ON public.poll_results (poll_id);

-- -----------------------------------------------
-- 6. Tabel Audit Log Polling
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id            BIGSERIAL    PRIMARY KEY,
    actor_user_id TEXT,
    actor_email   TEXT,
    action        TEXT         NOT NULL,
    poll_id       TEXT,
    payload       JSONB,
    ip_address    TEXT,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_poll_id    ON public.audit_logs (poll_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at);

-- -----------------------------------------------
-- 7. Row Level Security (RLS)
-- -----------------------------------------------
ALTER TABLE public.polls               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;

-- Polls: baca publik, tulis hanya service_role
DROP POLICY IF EXISTS "polls_read_all"      ON public.polls;
CREATE POLICY "polls_read_all"
    ON public.polls FOR SELECT USING (true);

DROP POLICY IF EXISTS "polls_write_service" ON public.polls;
CREATE POLICY "polls_write_service"
    ON public.polls FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Votes: user insert suaranya sendiri
DROP POLICY IF EXISTS "votes_insert_own"    ON public.votes;
CREATE POLICY "votes_insert_own"
    ON public.votes FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "votes_select_service" ON public.votes;
CREATE POLICY "votes_select_service"
    ON public.votes FOR SELECT
    USING (auth.role() = 'service_role' OR user_id = auth.uid()::text);

-- Poll results: baca publik
DROP POLICY IF EXISTS "poll_results_read_all" ON public.poll_results;
CREATE POLICY "poll_results_read_all"
    ON public.poll_results FOR SELECT USING (true);

-- Audit logs: hanya service_role
DROP POLICY IF EXISTS "audit_logs_service" ON public.audit_logs;
CREATE POLICY "audit_logs_service"
    ON public.audit_logs FOR ALL
    USING (auth.role() = 'service_role');

-- -----------------------------------------------
-- 8. DATA SEED: 15 Tema Polling Default (UPSERT)
-- Aman dijalankan berulang kali.
-- Jika admin sudah mengedit judul/label, TIDAK akan ditimpa.
-- -----------------------------------------------
INSERT INTO public.polls (code, title, short_label, icon, description, max_choices, allow_self_vote, is_active)
VALUES
    ('cantik',       'Pegawai Paling Cantik',                       'Paling Cantik',         '💃', 'Siapa pegawai wanita paling anggun, memukau, dan berpenampilan menawan?',                                    3, false, true),
    ('ganteng',      'Pegawai Paling Ganteng',                      'Paling Ganteng',        '💇', 'Siapa pegawai pria dengan pesona dan penampilan paling ganteng & rapi di kantor?',                            3, false, true),
    ('cerdas',       'Pegawai Paling Cerdas',                       'Paling Cerdas',         '🧠', 'Siapa pegawai paling solutif, analitis, dan cepat memecahkan masalah rumit?',                                 3, false, true),
    ('rajin',        'Pegawai Paling Rajin',                        'Paling Rajin',          '📚', 'Siapa pegawai paling disiplin, selalu tepat waktu, dan gigih menuntaskan tugas?',                             3, false, true),
    ('soleh',        'Pegawai Paling Soleh & Santun',               'Paling Soleh',          '🕌', 'Siapa pegawai paling bersahaja, berakhlak mulia, dan rajin ibadah?',                                          3, false, true),
    ('dermawan',     'Pegawai Paling Dermawan',                     'Paling Dermawan',       '🪙', 'Siapa pegawai yang paling ringan tangan suka berbagi rezeki dan membantu sesama?',                            3, false, true),
    ('royal',        'Pegawai Paling Royal (Suka Traktir)',          'Paling Royal',          '🎁', 'Siapa rekan kerja yang paling hobi traktir kopi, jajan, dan makan siang bareng?',                             3, false, true),
    ('baik',         'Pegawai Paling Baik Hati',                    'Paling Baik',           '❤️', 'Siapa pegawai yang paling ramah, hangat, tulus, dan tidak pernah mengeluh?',                                  3, false, true),
    ('tahu_segala',  'Pegawai Paling Tahu Segala (Kamus Berjalan)', 'Paling Tahu Segala',    '💡', 'Tanya apa saja pasti tahu! Siapa yang punya wawasan paling luas di kantor?',                                  3, false, true),
    ('update',       'Pegawai Paling Update',                       'Paling Update',         '📶', 'Siapa pegawai yang paling cepat tahu info terkini, berita viral, dan tren baru?',                             3, false, true),
    ('gaptek',       'Pegawai Paling Gaptek (Lucu & Innocent)',     'Paling Gaptek',         '💻', 'Siapa yang paling sering minta bantuan klik mouse atau bingung format file tapi tetap bikin gemas?',          3, false, true),
    ('murah_senyum', 'Pegawai Paling Murah Senyum',                 'Paling Murah Senyum',   '😊', 'Siapa yang senyumnya selalu merekah dari pagi hingga sore mencairkan suasana kantor?',                        3, false, true),
    ('cool',         'Pegawai Paling Cool & Tenang',                'Paling Cool',           '😎', 'Siapa yang selalu santai, tenang menghadapi deadline badai, dan tetap berkharisma?',                          3, false, true),
    ('trendy',       'Pegawai Paling Trendy & Modis',               'Paling Trendy',         '👔', 'Siapa yang gaya pakaian, sepatu, dan aksesorisnya selalu paling stylish dan rapi?',                           3, false, true),
    ('lucu',         'Pegawai Paling Lucu (Komika DKPP)',           'Paling Lucu',           '😂', 'Siapa yang celetukannya selalu bikin seisi ruangan tertawa terpingkal-pingkal?',                              3, false, true)
ON CONFLICT (code) DO UPDATE
    SET
        -- Judul dan label TIDAK otomatis ditimpa (dijaga hasil edit admin)
        -- Hanya update icon & description jika masih kosong
        icon            = CASE
                            WHEN public.polls.icon IS NULL OR public.polls.icon = ''
                            THEN EXCLUDED.icon
                            ELSE public.polls.icon
                          END,
        description     = CASE
                            WHEN public.polls.description IS NULL OR public.polls.description = ''
                            THEN EXCLUDED.description
                            ELSE public.polls.description
                          END,
        max_choices     = EXCLUDED.max_choices,
        allow_self_vote = EXCLUDED.allow_self_vote,
        updated_at      = now();

-- -----------------------------------------------
-- 9. CARA MENGUBAH JUDUL TEMA (Manual oleh Admin via SQL)
-- -----------------------------------------------
-- Contoh: Ubah tema 'trendy' menjadi 'Pegawai Paling Sibuk'
-- UPDATE public.polls
-- SET title = 'Pegawai Paling Sibuk',
--     short_label = 'Paling Sibuk',
--     icon = '🏃',
--     updated_at = now()
-- WHERE code = 'trendy';
--
-- Nonaktifkan tema tertentu:
-- UPDATE public.polls SET is_active = false WHERE code = 'cantik';
-- -----------------------------------------------

-- Tampilkan hasil akhir
SELECT id, code, title, short_label, icon, is_active, updated_at
FROM public.polls
ORDER BY created_at ASC;
