-- ====================================================================
-- TABEL & STRUKTUR SQL POLLING PEGAWAI DKPP KOTA CILEGON (2026)
-- Jalankan skrip ini di Supabase SQL Editor untuk membuat tabel
-- polls, employees, votes, poll_participations, poll_results & audit_logs
-- ====================================================================

-- 1. Ekstensi Pendukung Pencarian Fuzzy Trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Master Tabel Pegawai (employees)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR(30) UNIQUE,
    full_name TEXT NOT NULL,
    position TEXT,
    unit TEXT,
    photo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    access_level VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pastikan kolom baru tetap ada jika tabel employees sudah pernah dibuat sebelumnya
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS nip VARCHAR(30);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'USER';

CREATE INDEX IF NOT EXISTS idx_employees_name_trgm ON public.employees USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees (is_active);
CREATE INDEX IF NOT EXISTS idx_employees_nip ON public.employees (nip);

-- 3. Tabel Tema Polling (polls)
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    short_label TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    max_choices INT NOT NULL DEFAULT 3,
    allow_self_vote BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_polls_code ON public.polls (code);
CREATE INDEX IF NOT EXISTS idx_polls_active ON public.polls (is_active);

-- 4. Tabel Suara Mentah (votes)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (poll_id, user_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON public.votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON public.votes (poll_id, user_id);

-- 5. Tabel Penanda Partisipasi (poll_participations)
CREATE TABLE IF NOT EXISTS public.poll_participations (
    poll_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    choices_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, user_id)
);

-- 6. Tabel Agregat Hasil Polling (poll_results)
CREATE TABLE IF NOT EXISTS public.poll_results (
    poll_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    total_votes INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_results_poll_id ON public.poll_results (poll_id);

-- 7. Tabel Audit Log Polling (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id TEXT,
    action TEXT NOT NULL,
    poll_id TEXT,
    payload JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. View Hasil Publik (poll_results_public)
CREATE OR REPLACE VIEW public.poll_results_public AS
SELECT 
    pr.poll_id,
    pr.employee_id,
    COALESCE(e.full_name, dp.nama, pr.employee_id) AS full_name,
    COALESCE(e.position, dp.jabatan, 'Pegawai DKPP Kota Cilegon') AS position,
    COALESCE(e.unit, dp.bidang, 'DKPP Kota Cilegon') AS unit,
    e.photo_url,
    pr.total_votes,
    ROUND(
        (pr.total_votes::NUMERIC / NULLIF((SELECT SUM(pr2.total_votes) FROM public.poll_results pr2 WHERE pr2.poll_id = pr.poll_id), 0)) * 100, 
        1
    ) AS percentage,
    RANK() OVER (PARTITION BY pr.poll_id ORDER BY pr.total_votes DESC) AS rank
FROM public.poll_results pr
LEFT JOIN public.employees e ON e.id::TEXT = pr.employee_id OR e.nip = pr.employee_id
LEFT JOIN public.dkpp_pegawai_nip dp ON dp.nip = pr.employee_id OR dp.id::TEXT = pr.employee_id
WHERE pr.total_votes > 0
ORDER BY pr.poll_id, pr.total_votes DESC;

-- 9. Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
DROP POLICY IF EXISTS "Public can view active polls" ON public.polls;
CREATE POLICY "Public can view active polls" ON public.polls FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view employees" ON public.employees;
CREATE POLICY "Public can view employees" ON public.employees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view poll results" ON public.poll_results;
CREATE POLICY "Public can view poll results" ON public.poll_results FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert votes" ON public.votes;
CREATE POLICY "Users can insert votes" ON public.votes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert participations" ON public.poll_participations;
CREATE POLICY "Users can insert participations" ON public.poll_participations FOR ALL USING (true) WITH CHECK (true);

-- 11. Seed 15 Tema Polling Resmi DKPP
INSERT INTO public.polls (code, title, short_label, icon, description, max_choices, allow_self_vote, is_active) VALUES
('cantik', 'Pegawai Paling Cantik', 'Paling Cantik', '💃', 'Siapa pegawai wanita paling anggun, memukau, dan berpenampilan menawan?', 3, false, true),
('ganteng', 'Pegawai Paling Ganteng', 'Paling Ganteng', '💇', 'Siapa pegawai pria dengan pesona dan penampilan paling ganteng & rapi di kantor?', 3, false, true),
('cerdas', 'Pegawai Paling Cerdas', 'Paling Cerdas', '🧠', 'Siapa pegawai paling solutif, analitis, dan cepat memecahkan masalah rumit?', 3, false, true),
('rajin', 'Pegawai Paling Rajin', 'Paling Rajin', '📚', 'Siapa pegawai paling disiplin, selalu tepat waktu, dan gigih menuntaskan tugas?', 3, false, true),
('soleh', 'Pegawai Paling Soleh & Santun', 'Paling Soleh', '🕌', 'Siapa pegawai paling bersahaja, berakhlak mulia, dan rajin ibadah?', 3, false, true),
('dermawan', 'Pegawai Paling Dermawan', 'Paling Dermawan', '🪙', 'Siapa pegawai yang paling ringan tangan suka berbagi rezeki dan membantu sesama?', 3, false, true),
('royal', 'Pegawai Paling Royal', 'Paling Royal (Suka Traktir)', '🎁', 'Siapa rekan kerja yang paling hobi traktir kopi, jajan, dan makan siang bareng?', 3, false, true),
('baik', 'Pegawai Paling Baik Hati', 'Paling Baik', '❤️', 'Siapa pegawai yang paling ramah, hangat, tulus, dan tidak pernah mengeluh?', 3, false, true),
('tahu_segala', 'Pegawai Paling Tahu Segala (Kamus Berjalan)', 'Paling Tahu Segala', '💡', 'Tanya apa saja pasti tahu! Siapa yang punya wawasan paling luas di kantor?', 3, false, true),
('update', 'Pegawai Paling Update', 'Paling Update', '📶', 'Siapa pegawai yang paling cepat tahu info terkini, berita viral, dan tren baru?', 3, false, true),
('gaptek', 'Pegawai Paling Gaptek (Lucu & Innocent)', 'Paling Gaptek', '💻', 'Siapa yang paling sering minta bantuan klik mouse atau bingung format file tapi tetap bikin gemas?', 3, false, true),
('murah_senyum', 'Pegawai Paling Murah Senyum', 'Paling Murah Senyum', '😊', 'Siapa yang senyumnya selalu merekah dari pagi hingga sore mencairkan suasana kantor?', 3, false, true),
('cool', 'Pegawai Paling Cool & Tenang', 'Paling Cool', '😎', 'Siapa yang selalu santai, tenang menghadapi deadline badai, dan tetap berkharisma?', 3, false, true),
('trendy', 'Pegawai Paling Sibuk', 'Paling Sibuk', '🤓', 'Siapa pegawai yang kelihatannya sibuk mulai pagi sampai sore setiap harinya?', 3, false, true),
('lucu', 'Pegawai Paling Lucu (Komika DKPP)', 'Paling Lucu', '😂', 'Siapa yang celetukannya selalu bikin seisi ruangan tertawa terpingkal-pingkal?', 3, false, true)
ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    short_label = EXCLUDED.short_label,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description;
