import json, re

with open('scratch/all_active_pegawai.json', 'r', encoding='utf-8') as f:
    active_employees = json.load(f)

# 15 Seed themes defined in the prompt
themes = [
    {"code": "ganteng", "label": "Paling Ganteng", "title": "Pegawai Paling Ganteng", "icon": "💇", "description": "Siapa pegawai pria dengan pesona dan penampilan paling ganteng & rapi di kantor?"},
    {"code": "cantik", "label": "Paling Cantik", "title": "Pegawai Paling Cantik", "icon": "💃", "description": "Siapa pegawai wanita paling anggun, memukau, dan berpenampilan menawan?"},
    {"code": "cerdas", "label": "Paling Cerdas", "title": "Pegawai Paling Cerdas", "icon": "🧠", "description": "Siapa pegawai paling solutif, analitis, dan cepat memecahkan masalah rumit?"},
    {"code": "rajin", "label": "Paling Rajin", "title": "Pegawai Paling Rajin", "icon": "📚", "description": "Siapa pegawai paling disiplin, selalu tepat waktu, dan gigih menuntaskan tugas?"},
    {"code": "soleh", "label": "Paling Soleh", "title": "Pegawai Paling Soleh & Santun", "icon": "🕌", "description": "Siapa pegawai paling bersahaja, berakhlak mulia, dan rajin ibadah?"},
    {"code": "dermawan", "label": "Paling Dermawan", "title": "Pegawai Paling Dermawan", "icon": "🪙", "description": "Siapa pegawai yang paling ringan tangan suka berbagi rezeki dan membantu sesama?"},
    {"code": "royal", "label": "Paling Royal (Suka Traktir)", "title": "Pegawai Paling Royal", "icon": "🎁", "description": "Siapa rekan kerja yang paling hobi traktir kopi, jajan, dan makan siang bareng?"},
    {"code": "baik", "label": "Paling Baik", "title": "Pegawai Paling Baik Hati", "icon": "❤️", "description": "Siapa pegawai yang paling ramah, hangat, tulus, dan tidak pernah mengeluh?"},
    {"code": "tahu_segala", "label": "Paling Tahu Segala", "title": "Pegawai Paling Tahu Segala (Kamus Berjalan)", "icon": "💡", "description": "Tanya apa saja pasti tahu! Siapa yang punya wawasan paling luas di kantor?"},
    {"code": "update", "label": "Paling Update", "title": "Pegawai Paling Update", "icon": "📶", "description": "Siapa pegawai yang paling cepat tahu info terkini, berita viral, dan tren baru?"},
    {"code": "gaptek", "label": "Paling Gaptek", "title": "Pegawai Paling Gaptek (Lucu & Innocent)", "icon": "💻", "description": "Siapa yang paling sering minta bantuan klik mouse atau bingung format file tapi tetap bikin gemas?"},
    {"code": "murah_senyum", "label": "Paling Murah Senyum", "title": "Pegawai Paling Murah Senyum", "icon": "😊", "description": "Siapa yang senyumnya selalu merekah dari pagi hingga sore mencairkan suasana kantor?"},
    {"code": "cool", "label": "Paling Cool", "title": "Pegawai Paling Cool & Tenang", "icon": "😎", "description": "Siapa yang selalu santai, tenang menghadapi deadline badai, dan tetap berkharisma?"},
    {"code": "trendy", "label": "Paling Sibuk", "title": "Pegawai Paling Sibuk", "icon": "🤓", "description": "Siapa pegawai yang kelihatannya sibuk mulai pagi sampai sore setiap harinya?"},
    {"code": "lucu", "label": "Paling Lucu", "title": "Pegawai Paling Lucu (Komika DKPP)", "icon": "😂", "description": "Siapa yang celetukannya selalu bikin seisi ruangan tertawa terpingkal-pingkal?"}
]

sql = []
sql.append('''-- ====================================================================
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
''')

# 14. SEED POLL THEMES
sql.append('\n-- 14. SEED 15 TEMA POLLING RESMI DKPP')
sql.append('INSERT INTO public.polls (code, title, short_label, icon, description, max_choices, allow_self_vote, is_active) VALUES')
theme_vals = []
for t in themes:
    title_esc = t['title'].replace("'", "''")
    label_esc = t['label'].replace("'", "''")
    desc_esc = t['description'].replace("'", "''")
    theme_vals.append(f"('{t['code']}', '{title_esc}', '{label_esc}', '{t['icon']}', '{desc_esc}', 3, false, true)")
sql.append(',\n'.join(theme_vals))
sql.append('ON CONFLICT (code) DO UPDATE SET')
sql.append('    title = EXCLUDED.title,')
sql.append('    short_label = EXCLUDED.short_label,')
sql.append('    icon = EXCLUDED.icon,')
sql.append('    description = EXCLUDED.description,')
sql.append('    is_active = EXCLUDED.is_active;')

# 15. SEED EMPLOYEES FROM dkpp_pegawai_nip
sql.append('\n-- 15. SEED 92 PEGAWAI AKTIF KE TABEL employees')
sql.append('INSERT INTO public.employees (nip, full_name, position, unit, is_active, updated_at)')
sql.append('VALUES')
emp_vals = []
for p in active_employees:
    nip = p.get('nip') or ''
    name = p.get('nama', '').replace("'", "''")
    pos = (p.get('jabatan') or 'Pegawai DKPP').replace("'", "''")
    unit = (p.get('bidang') or 'DKPP Kota Cilegon').replace("'", "''")
    emp_vals.append(f"('{nip}', '{name}', '{pos}', '{unit}', true, now())")
sql.append(',\n'.join(emp_vals))
sql.append('ON CONFLICT (nip) DO UPDATE SET')
sql.append('    full_name = EXCLUDED.full_name,')
sql.append('    position = EXCLUDED.position,')
sql.append('    unit = EXCLUDED.unit,')
sql.append('    is_active = EXCLUDED.is_active,')
sql.append('    updated_at = now();')

# 16. SINKRONKAN DENGAN dkpp_pegawai_nip JIKA ADA PENYESUAIAN
sql.append('''
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
''')

migration_sql = '\n'.join(sql)

with open('supabase/migrations/020_polling_system.sql', 'w', encoding='utf-8') as f:
    f.write(migration_sql)

with open('supabase_sql/06_polling_system.sql', 'w', encoding='utf-8') as f:
    f.write(migration_sql)

print('Successfully generated supabase/migrations/020_polling_system.sql & supabase_sql/06_polling_system.sql!')
