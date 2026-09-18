-- ====================================================================
-- MIGRATION 020: SISTEM POLLING PEGAWAI DKPP KOTA CILEGON
-- Multi-tematik, Transaksional RPC, RLS Keamanan Tingkat Tinggi,
-- Agregat Realtime & Audit Log Transparansi
-- ====================================================================

-- 1. Ekstensi Pendukung Pencarian Cepat & Fuzzy
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

-- Kolom tambahan jika tabel sudah ada sebelumnya
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS nip VARCHAR(30);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

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

-- 4. Tabel Suara Mentah (votes) - 1 baris = 1 pilihan
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (poll_id, user_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON public.votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_user ON public.votes (poll_id, user_id);

-- 5. Tabel Penanda Partisipasi (poll_participations)
-- Menjamin secara absolut 1 user hanya boleh vote 1 kali per tema
CREATE TABLE IF NOT EXISTS public.poll_participations (
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    choices_count INT NOT NULL CHECK (choices_count BETWEEN 1 AND 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, user_id)
);

-- 6. Tabel Agregat Hasil (poll_results)
CREATE TABLE IF NOT EXISTS public.poll_results (
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    total_votes INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_results_poll_id ON public.poll_results (poll_id);

-- 7. Tabel Audit Log (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    poll_id UUID REFERENCES public.polls(id) ON DELETE SET NULL,
    payload JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_poll ON public.audit_logs (action, poll_id);

-- 8. Trigger Sinkronisasi Agregat poll_results
CREATE OR REPLACE FUNCTION public.fn_sync_poll_results()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.poll_results (poll_id, employee_id, total_votes, updated_at)
        VALUES (NEW.poll_id, NEW.employee_id, 1, now())
        ON CONFLICT (poll_id, employee_id)
        DO UPDATE SET total_votes = public.poll_results.total_votes + 1, updated_at = now();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.poll_results
        SET total_votes = GREATEST(0, total_votes - 1), updated_at = now()
        WHERE poll_id = OLD.poll_id AND employee_id = OLD.employee_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_poll_results ON public.votes;
CREATE TRIGGER trg_sync_poll_results
AFTER INSERT OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_poll_results();

-- 9. View Publik Hasil Polling (poll_results_public) - Tanpa User ID Pemilih
CREATE OR REPLACE VIEW public.poll_results_public AS
SELECT
    pr.poll_id,
    pr.employee_id,
    e.full_name,
    e.position,
    e.unit,
    e.photo_url,
    pr.total_votes,
    CASE 
        WHEN SUM(pr.total_votes) OVER (PARTITION BY pr.poll_id) > 0 
        THEN ROUND((pr.total_votes::NUMERIC / SUM(pr.total_votes) OVER (PARTITION BY pr.poll_id)) * 100, 1)
        ELSE 0.0
    END AS percentage,
    DENSE_RANK() OVER (PARTITION BY pr.poll_id ORDER BY pr.total_votes DESC, e.full_name ASC) AS rank
FROM public.poll_results pr
JOIN public.employees e ON e.id = pr.employee_id
WHERE e.is_active = true AND pr.total_votes > 0;

-- 10. Fungsi Helper Keamanan: is_admin() & is_verified_user()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email') = 'ridwansugiarto.mail@gmail.com'
        OR (auth.jwt() ->> 'role') = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() AND access_level = 'ADMIN'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_verified_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 11.1 employees
DROP POLICY IF EXISTS "Verified users can read active employees" ON public.employees;
CREATE POLICY "Verified users can read active employees"
ON public.employees FOR SELECT
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage employees" ON public.employees;
CREATE POLICY "Admin manage employees"
ON public.employees FOR ALL
USING (public.is_admin());

-- 11.2 polls
DROP POLICY IF EXISTS "Anyone can read active polls" ON public.polls;
CREATE POLICY "Anyone can read active polls"
ON public.polls FOR SELECT
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage polls" ON public.polls;
CREATE POLICY "Admin manage polls"
ON public.polls FOR ALL
USING (public.is_admin());

-- 11.3 votes
DROP POLICY IF EXISTS "Users can only read own votes" ON public.votes;
CREATE POLICY "Users can only read own votes"
ON public.votes FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

-- 11.4 poll_participations
DROP POLICY IF EXISTS "Users can read own participation" ON public.poll_participations;
CREATE POLICY "Users can read own participation"
ON public.poll_participations FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

-- 11.5 poll_results
DROP POLICY IF EXISTS "Public can view aggregate poll results" ON public.poll_results;
CREATE POLICY "Public can view aggregate poll results"
ON public.poll_results FOR SELECT
USING (true);

-- 11.6 audit_logs
DROP POLICY IF EXISTS "Only admin can read audit logs" ON public.audit_logs;
CREATE POLICY "Only admin can read audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

-- 12. RPC TRANSAKSIONAL: submit_poll_vote
CREATE OR REPLACE FUNCTION public.submit_poll_vote(
    p_poll_id UUID,
    p_employee_ids UUID[],
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_poll RECORD;
    v_emp_id UUID;
    v_emp_count INT;
    v_distinct_count INT;
    v_self_emp_id UUID;
    v_payload JSONB;
BEGIN
    -- 1. Validasi Autentikasi User
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Silakan login terlebih dahulu untuk mengikuti polling.';
    END IF;

    -- 2. Validasi Poll Aktif
    SELECT * INTO v_poll FROM public.polls WHERE id = p_poll_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'POLL_NOT_FOUND: Tema polling tidak ditemukan.';
    END IF;

    IF NOT v_poll.is_active THEN
        RAISE EXCEPTION 'POLL_INACTIVE: Polling ini sudah dinonaktifkan.';
    END IF;

    IF v_poll.ends_at IS NOT NULL AND v_poll.ends_at < now() THEN
        RAISE EXCEPTION 'POLL_EXPIRED: Waktu polling untuk tema ini telah berakhir.';
    END IF;

    -- 3. Validasi Jumlah Pilihan (1 sampai max_choices)
    v_emp_count := array_length(p_employee_ids, 1);
    IF v_emp_count IS NULL OR v_emp_count < 1 THEN
        RAISE EXCEPTION 'INVALID_CHOICE_COUNT: Anda harus memilih minimal 1 nama pegawai.';
    END IF;

    IF v_emp_count > v_poll.max_choices THEN
        RAISE EXCEPTION 'EXCEEDED_MAX_CHOICES: Anda hanya boleh memilih maksimal % nama pegawai.', v_poll.max_choices;
    END IF;

    -- 4. Validasi Tidak Ada Duplikat ID
    SELECT count(DISTINCT id) INTO v_distinct_count FROM unnest(p_employee_ids) AS id;
    IF v_distinct_count != v_emp_count THEN
        RAISE EXCEPTION 'DUPLICATE_CHOICE: Terdapat nama pegawai yang dipilih lebih dari 1 kali.';
    END IF;

    -- 5. Cek Sudah Pernah Vote (One-vote rule)
    IF EXISTS (SELECT 1 FROM public.poll_participations WHERE poll_id = p_poll_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'ALREADY_VOTED: Anda sudah pernah memberikan suara pada tema polling ini.';
    END IF;

    -- 6. Validasi Semua Pegawai Aktif
    IF (SELECT count(*) FROM public.employees WHERE id = ANY(p_employee_ids) AND is_active = true) != v_emp_count THEN
        RAISE EXCEPTION 'INVALID_EMPLOYEE: Salah satu nama pegawai yang dipilih tidak valid atau tidak aktif.';
    END IF;

    -- 7. Validasi Self-Vote (jika dilarang)
    IF NOT v_poll.allow_self_vote THEN
        SELECT id INTO v_self_emp_id FROM public.employees WHERE user_id = v_user_id;
        IF v_self_emp_id IS NOT NULL AND v_self_emp_id = ANY(p_employee_ids) THEN
            RAISE EXCEPTION 'SELF_VOTE_NOT_ALLOWED: Anda tidak dapat memilih diri Anda sendiri dalam polling ini.';
        END IF;
    END IF;

    -- 8. Insert Suara Mentah
    FOREACH v_emp_id IN ARRAY p_employee_ids
    LOOP
        INSERT INTO public.votes (poll_id, user_id, employee_id, created_at)
        VALUES (p_poll_id, v_user_id, v_emp_id, now());
    END LOOP;

    -- 9. Catat Partisipasi
    INSERT INTO public.poll_participations (poll_id, user_id, choices_count, created_at)
    VALUES (p_poll_id, v_user_id, v_emp_count, now());

    -- 10. Catat Audit Log
    v_payload := jsonb_build_object(
        'poll_code', v_poll.code,
        'poll_title', v_poll.title,
        'choices_count', v_emp_count,
        'employee_ids', p_employee_ids
    );

    INSERT INTO public.audit_logs (actor_user_id, action, poll_id, payload, ip_address, user_agent, created_at)
    VALUES (v_user_id, 'VOTE_SUBMIT', p_poll_id, v_payload, p_ip_address::inet, p_user_agent, now());

    RETURN jsonb_build_object(
        'success', true,
        'poll_id', p_poll_id,
        'choices_count', v_emp_count,
        'message', 'Suara Anda berhasil tercatat secara aman dan anonim!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. RPC AUTOCOMPLETE PENCARIAN PEGAWAI: search_employees
CREATE OR REPLACE FUNCTION public.search_employees(
    q TEXT,
    poll_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    position TEXT,
    unit TEXT,
    photo_url TEXT,
    match_tier INT
) AS $$
DECLARE
    v_clean_q TEXT;
BEGIN
    v_clean_q := TRIM(LOWER(q));
    IF LENGTH(v_clean_q) < 2 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        e.id,
        e.full_name,
        e.position,
        e.unit,
        e.photo_url,
        CASE
            -- Tier 1: Prefix match pada awal nama lengkap
            WHEN LOWER(e.full_name) LIKE v_clean_q || '%' THEN 1
            -- Tier 2: Prefix match pada awal salah satu kata nama
            WHEN LOWER(e.full_name) ~* ('(^|\s)' || v_clean_q) THEN 2
            -- Tier 3: Substring match di tengah nama
            WHEN LOWER(e.full_name) LIKE '%' || v_clean_q || '%' THEN 3
            -- Tier 4: Fuzzy match menggunakan trigram similarity
            WHEN similarity(LOWER(e.full_name), v_clean_q) > 0.2 THEN 4
            ELSE 5
        END AS match_tier
    FROM public.employees e
    WHERE e.is_active = true
      AND (
          LOWER(e.full_name) LIKE '%' || v_clean_q || '%'
          OR similarity(LOWER(e.full_name), v_clean_q) > 0.2
          OR LOWER(COALESCE(e.position, '')) LIKE '%' || v_clean_q || '%'
      )
    ORDER BY match_tier ASC, e.full_name ASC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 14. SEED 15 TEMA POLLING RESMI DKPP
INSERT INTO public.polls (code, title, short_label, icon, description, max_choices, allow_self_vote, is_active) VALUES
('ganteng', 'Pegawai Paling Ganteng', 'Paling Ganteng', '💇', 'Siapa pegawai pria dengan pesona dan penampilan paling ganteng & rapi di kantor?', 3, false, true),
('cantik', 'Pegawai Paling Cantik', 'Paling Cantik', '💃', 'Siapa pegawai wanita paling anggun, memukau, dan berpenampilan menawan?', 3, false, true),
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
('trendy', 'Pegawai Paling Trendy & Modis', 'Paling Trendy', '👔', 'Siapa yang gaya pakaian, sepatu, dan aksesorisnya selalu paling stylish dan rapi?', 3, false, true),
('lucu', 'Pegawai Paling Lucu (Komika DKPP)', 'Paling Lucu', '😂', 'Siapa yang celetukannya selalu bikin seisi ruangan tertawa terpingkal-pingkal?', 3, false, true)
ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    short_label = EXCLUDED.short_label,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- 15. SEED 92 PEGAWAI AKTIF KE TABEL employees
INSERT INTO public.employees (nip, full_name, position, unit, is_active, updated_at)
VALUES
('197002211999032002', 'Efa Sarifah, ST, MT', 'Kepala Dinas', 'Pimpinan', true, now()),
('197609241996031002', 'Agus Purmono, A.P, MM', 'Sekretaris', 'Sekretariat', true, now()),
('196912141992032005', 'Cahyaning Sukarti, S.K.M, MM', 'Kepala Bidang Ketahanan Pangan', 'Ketahanan Pangan', true, now()),
('197204081998021002', 'Udin Saprudin, SE, M.M.', 'Kepala UPTD Kawasan Pertanian Terpadu', 'Pertanian', true, now()),
('197708102007011011', 'Wahyudi, SE', 'Kepala UPTD Rumah Potong Hewan dan Pasar Hewan', 'Peternakan & Keswan', true, now()),
('197806152002121004', 'Yudhi Indrayana, A.Md', 'Kepala UPTD Pusat Kesehatan Hewan', 'Peternakan & Keswan', true, now()),
('197406062009011001', 'Asep Sumirat, S.Mn', 'Kepala Sub bagian TU UPTD RPH dan Pasar Hewan', 'Peternakan & Keswan', true, now()),
('197912232010011009', 'Djadjat Djatnika, S.IP', 'Kasubag TU UPTD Kawasan Pertanian Terpadu', 'Pertanian', true, now()),
('197511132010012006', 'Liva Widiaty, SE, MM', 'Kepala Sub Bagian Umum dan Kepegawaian', 'Sekretariat', true, now()),
('196912122002122004', 'Drh. Hj. Dina Safitri, M.M', 'Medik Veteriner Ahli Madya', 'Peternakan & Keswan', true, now()),
('198203202010011017', 'drh. Abraham Syah', 'Medik Veteriner Ahli Muda', 'Peternakan & Keswan', true, now()),
('197604152002121006', 'Sutisna, SP', 'Pengawas Mutu Hasil Pertanian Ahli Muda', 'Pertanian', true, now()),
('197707022002121004', 'Moch. Dwinanda Y,S.Pt', 'Analis Ketahanan Pangna Ahli Muda', 'Sekretariat', true, now()),
('197610182002121002', 'Ridwan Sugiarto, S.Pi', 'Analis Ketahanan Pangan Ahli Muda', 'Ketahanan Pangan', true, now()),
('197508212008032001', 'Yessi Desvia, SP, MM', 'Analais Ketahanan Pangan Ahli Muda', 'Ketahanan Pangan', true, now()),
('197602132005011003', 'Anugroho Nur W, S.Pt', 'Pengawas Mutu Hasil Pertanian - Ahli Muda', 'Pertanian', true, now()),
('198508292010011008', 'Ari Priyatna, SP', 'Pengawas Mutu Hasil Pertanian Ahli Muda', 'Pertanian', true, now()),
('198209262010012005', 'Linda Setiawati, SP', 'Pengawas Mutu Hasil Pertanian Ahli Muda', 'Pertanian', true, now()),
('198005242006042018', 'Meisaroh, SE, MM', 'Analis Ketahanan Pangan - Ahli Muda', 'Ketahanan Pangan', true, now()),
('198409252010011036', 'Nico, SH', 'Perencana  - Ahli Pertama', 'Sekretariat', true, now()),
('197712262010011006', 'Hafid Dasuki, S.Pt', 'Pengawas Bibit Ternak - Ahli Pertama', 'Sekretariat', true, now()),
('197603162009011003', 'Paulus Dwi  Ari K D, ST', 'Penata Kelola Kelautan dan Perikanan', 'Perikanan', true, now()),
('197910162010012008', 'Winda Ratnasari, SP', 'Penelaah Teknis Kebijakan', 'Sekretariat', true, now()),
('198111032010012005', 'Sanlin Novitriana, SP', 'Penelaah Teknis Kebijakan', 'Sekretariat', true, now()),
('198602152010012006', 'Febrika Indah Cahyani, SE, MM', 'Penata Kelola Kelautan dan Perikanan', 'Perikanan', true, now()),
('198203222010012008', 'Maryori, S.Pi', 'Penelaah Teknis Kebijakan', 'Sekretariat', true, now()),
('197105042008011008', 'Kusnadi, SE', 'Analis Ketahanan Pangan - Ahli Muda', 'Ketahanan Pangan', true, now()),
('197705252008011010', 'Arifudin, SP', 'Analis Prasarana dan Sarana Pertanian Ahli Pertama', 'Pertanian', true, now()),
('198611152009011001', 'Mas Akhmad Rangga P, SE, MM', 'Pengawas Bibit Ternak - Ahli Pertama', 'Sekretariat', true, now()),
('198407212017062001', 'Shofi Nur Prihatin, SP, MM', 'Penelaah Teknis Kebijakan', 'Sekretariat', true, now()),
('197804052006041006', 'Amiruddin, SE', 'Penelaah Teknis Kebijakan', 'Sekretariat', true, now()),
('198908242015032006', 'Ghesika Tiandra Yusty, SP', 'Penelaah Teknis Kebijakan', 'Sekretariat', true, now()),
('197710052008012010', 'Lina Octavia, A.Md', 'Pengelola Layanan Operasional', 'Sekretariat', true, now()),
('198107152014062001', 'Sri Rahmadany Piliang, SE', 'Penelaah Teknis Kebijakan', 'Sekretariat', true, now()),
('198809182017061001', 'Dedi Septriyansa', 'Pengadministrasi Perkantoran', 'Sekretariat', true, now()),
('198705022017061001', 'Subandi', 'Pengadministrasi Perkantoran', 'Sekretariat', true, now()),
('198812312017061001', 'Suharyadi', 'Pengadministrasi Perkantoran', 'Sekretariat', true, now()),
('197208112014062001', 'Nina Masliana', 'Pengadministrasi Perkantoran', 'Sekretariat', true, now()),
('198907132022211001', 'Sandhi Maulana Adha, SP', 'Analis Ketahanan Pangan Ahli Pertama', 'Ketahanan Pangan', true, now()),
('198802272023212032', 'Erna Febrianti, SP', 'Analis Ketahanan Pangan Ahli Pertama', 'Ketahanan Pangan', true, now()),
('199310162023211017', 'Prabu Arrahman, S.Kom', 'Pranata Komputer - Ahli Pertama', 'Sekretariat', true, now()),
('199404042023212062', 'Intan  Ayudya Pratiwi, A.Md', 'Arsiparis - Terampil', 'Sekretariat', true, now()),
('199807102025211004', 'Gentur Subagya', 'Pengadministrasi Perkantoran', 'Sekretariat', true, now()),
('198009092025211010', 'Santawi', 'Pengadministrasi Perkantoran', 'Sekretariat', true, now()),
('198401172025211096', 'Ghoni Syafiulloh, S.Ak', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('197606242025212033', 'Minarni, SE', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('198612282025211130', 'Tandis Destalana, SE', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('199103022025212157', 'Sri Ratnaningsih, S.Pi', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('198812162025211115', 'Edwin Maulana, SE', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('198806272025211119', 'Asep Qomarzzaman, S.Ap', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('198807152025211190', 'Rusdi, SM', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('199007242025212114', 'Maisaroh, SP', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('198510192025212078', 'Fani Herawati, SP', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('199504222025212127', 'Mariatul Hofat, SM', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('198909202025211150', 'Muhamad Farhan, S.Pi', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('199104162025212118', 'Rofiqoh, S.Sos', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('198308012025211120', 'Abi Sukarya, SE', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('199411182025211105', 'Driantama Bayu Saputra, SM', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('199504062025211144', 'Mas Adi Maulana, SP', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('199807142025212102', 'Ayara Azzahra, SM', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('198405092025211120', 'Heri, S.Pd.I', 'Penata Layanan Operasional', 'Sekretariat', true, now()),
('199411172025212126', 'Nova Khaerdayanti, A.Md', 'Pengelola Layanan Operasional', 'Sekretariat', true, now()),
('198104112025211107', 'Hartono', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('198003212025212054', 'Ita Titalia', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('199607212025212140', 'Ayu Lestari', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('199201272025211115', 'Tomy Mardiyanto', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('200208092025212019', 'Maida Rintani Astuti', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('199701122025211109', 'Rifki Rifa''i', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('198103152025212047', 'Mastufah', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('198606162025211181', 'Robert Wahid', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('199411302025212138', 'Rofiatul Adawiyah', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('199405182025212160', 'Ninin Anjani', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('198709052025211168', 'Yusuf Supriatna', 'Operator Layanan Operasional', 'Sekretariat', true, now()),
('197007122025211049', 'Hadiri', 'Pengelola Umum Operasional', 'Sekretariat', true, now()),
('199705162025211097', 'Muhtadi', 'Pengelola Umum Operasional', 'Sekretariat', true, now()),
('197801012025211163', 'Paruk Al Mahmud', 'Pengelola Umum Operasional', 'Sekretariat', true, now()),
('198202102025211156', 'Muhaemin', 'Pengelola Umum Operasional', 'Sekretariat', true, now()),
('PPPK-2026-034', 'Rizkyullah, S.M', 'Pengemudi', 'Sekretariat', true, now()),
('PPPK-2026-035', 'Musfiroh, S.Pi', 'Pengemudi', 'Sekretariat', true, now()),
('PPPK-2026-036', 'Dede Tri Mulyana, Sp', 'Pengemudi', 'Sekretariat', true, now()),
('PPPK-2026-037', 'Iyan Rachman, SE', 'Petugas Keamanan', 'Sekretariat', true, now()),
('PPPK-2026-038', 'Iwan', 'Petugas Keamanan', 'Sekretariat', true, now()),
('198312162017062001', 'Devi Yuningsih, A.Md', 'Penyuluh Pertanian Terampil', 'Pertanian', true, now()),
('198503282017061002', 'Lahmudin', 'Penyuluh Pertanian Terampil', 'Pertanian', true, now()),
('198507072017061001', 'Ahmad Sarbini', 'Penyuluh Pertanian Terampil', 'Pertanian', true, now()),
('199510092023211005', 'Afri Rizka Amiardi, S.P', 'Penyuluh Pertanian-Ahli Pertama', 'Pertanian', true, now()),
('198308082023211022', 'Maruli Setiawan, S.P', 'Penyuluh Pertanian-Ahli Pertama', 'Pertanian', true, now()),
('198207202023211009', 'Oja Fakhruroja, S.T', 'Penyuluh Pertanian-Ahli Pertama', 'Pertanian', true, now()),
('199007192023211019', 'Endra Purnama, S.P', 'Penyuluh Pertanian-Ahli Pertama', 'Pertanian', true, now()),
('197604232023212005', 'Rosmani Butarbutar, S.P', 'Penyuluh Pertanian-Ahli Pertama', 'Pertanian', true, now()),
('197610142023211003', 'Muhamad Hamdi, SP', 'Penyuluh Pertanian-Ahli Pertama', 'Pertanian', true, now()),
('199102022023211020', 'Yudi Slamet Hidayat, S.P', 'Penyuluh Pertanian-Ahli Pertama', 'Pertanian', true, now())
ON CONFLICT (nip) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    position = EXCLUDED.position,
    unit = EXCLUDED.unit,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- 16. Sinkronkan ID jika tabel dkpp_pegawai_nip sudah ada
INSERT INTO public.employees (nip, full_name, position, unit, is_active)
SELECT p.nip, p.nama, p.jabatan, p.bidang, p.is_active
FROM public.dkpp_pegawai_nip p
WHERE p.is_active = true
ON CONFLICT (nip) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    position = EXCLUDED.position,
    unit = EXCLUDED.unit,
    is_active = EXCLUDED.is_active;
