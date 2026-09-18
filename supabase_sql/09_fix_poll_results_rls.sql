-- ================================================================
-- 09_fix_poll_results_rls.sql
-- Memperbaiki RLS (Row Level Security) untuk Tabel Polling & Votes
-- Mengizinkan penghapusan suara per kandidat / user / reset tema untuk semua 15 tema
-- ================================================================

-- 1. Enable RLS pada seluruh tabel polling
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan RLS untuk tabel poll_results (Izinkan ALL / DELETE / UPDATE / INSERT)
DROP POLICY IF EXISTS "Public can view poll results" ON public.poll_results;
DROP POLICY IF EXISTS "Allow all manage poll_results" ON public.poll_results;
DROP POLICY IF EXISTS "poll_results_all_access" ON public.poll_results;

CREATE POLICY "poll_results_all_access" ON public.poll_results
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Kebijakan RLS untuk tabel votes (Izinkan ALL / DELETE / INSERT)
DROP POLICY IF EXISTS "Users can insert votes" ON public.votes;
DROP POLICY IF EXISTS "votes_all_access" ON public.votes;

CREATE POLICY "votes_all_access" ON public.votes
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Kebijakan RLS untuk tabel poll_participations (Izinkan ALL / DELETE)
DROP POLICY IF EXISTS "Users can insert participations" ON public.poll_participations;
DROP POLICY IF EXISTS "participations_all_access" ON public.poll_participations;

CREATE POLICY "participations_all_access" ON public.poll_participations
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Kebijakan RLS untuk tabel polls (Izinkan ALL)
DROP POLICY IF EXISTS "Public can view active polls" ON public.polls;
DROP POLICY IF EXISTS "polls_all_access" ON public.polls;

CREATE POLICY "polls_all_access" ON public.polls
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Grant Permissions
GRANT ALL ON TABLE public.polls TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.votes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.poll_participations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.poll_results TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.employees TO anon, authenticated, service_role;

-- Selesai! Semua tema polling dan semua pegawai dapat dihapus dan direset dengan aman.
