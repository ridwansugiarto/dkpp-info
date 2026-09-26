-- ==============================================================================
-- MIGRATION 10: TATA KELOLA POLLING (GOVERNANCE OVERRIDE UNTUK SUPERADMIN)
-- ==============================================================================
-- Akun Dikecualikan:
-- Email : ridwansugiarto.mail@gmail.com
-- NIP   : 197610182002121002
--
-- Tujuan Tata Kelola (Governance Purpose):
-- Memberikan hak akses penyeimbang psikologis perkantoran (unlimited vote)
-- bagi Superadmin untuk menstabilkan sentimen kantor jika terdapat pegawai
-- atau user umum yang memberikan suara secara tendensius pada tema polling tertentu.
-- ==============================================================================

-- 1. Modifikasi RPC submit_poll_vote agar Superadmin dikecualikan dari batas 1x vote
CREATE OR REPLACE FUNCTION public.submit_poll_vote(
    p_poll_id UUID,
    p_employee_ids UUID[],
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_is_superadmin BOOLEAN;
    v_poll RECORD;
    v_emp_count INT;
    v_distinct_count INT;
    v_emp_id UUID;
    v_self_emp_id UUID;
    v_payload JSONB;
BEGIN
    -- 1. Validasi Autentikasi User
    v_user_id := auth.uid();
    v_user_email := auth.jwt() ->> 'email';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Silakan login terlebih dahulu untuk mengikuti polling.';
    END IF;

    -- Cek Superadmin Governance Exemption
    v_is_superadmin := (lower(v_user_email) = 'ridwansugiarto.mail@gmail.com');

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

    -- 4. Validasi Tidak Ada Duplikat ID dalam satu kali submit
    SELECT count(DISTINCT id) INTO v_distinct_count FROM unnest(p_employee_ids) AS id;
    IF v_distinct_count != v_emp_count THEN
        RAISE EXCEPTION 'DUPLICATE_CHOICE: Terdapat nama pegawai yang dipilih lebih dari 1 kali.';
    END IF;

    -- 5. Cek Sudah Pernah Vote (One-vote rule)
    -- DIKECUALIKAN untuk Superadmin Governance (Email: ridwansugiarto.mail@gmail.com)
    IF NOT v_is_superadmin THEN
        IF EXISTS (SELECT 1 FROM public.poll_participations WHERE poll_id = p_poll_id AND user_id = v_user_id) THEN
            RAISE EXCEPTION 'ALREADY_VOTED: Anda sudah pernah memberikan suara pada tema polling ini.';
        END IF;
    END IF;

    -- 6. Validasi Semua Pegawai Aktif
    IF (SELECT count(*) FROM public.employees WHERE id = ANY(p_employee_ids) AND is_active = true) != v_emp_count THEN
        RAISE EXCEPTION 'INVALID_EMPLOYEE: Salah satu nama pegawai yang dipilih tidak valid atau tidak aktif.';
    END IF;

    -- 7. Validasi Self-Vote (jika dilarang dan bukan superadmin)
    IF NOT v_poll.allow_self_vote AND NOT v_is_superadmin THEN
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

    -- 9. Catat / Perbarui Partisipasi
    INSERT INTO public.poll_participations (poll_id, user_id, choices_count, created_at)
    VALUES (p_poll_id, v_user_id, v_emp_count, now())
    ON CONFLICT (poll_id, user_id) 
    DO UPDATE SET choices_count = EXCLUDED.choices_count, created_at = now();

    -- 10. Catat Audit Log
    v_payload := jsonb_build_object(
        'poll_code', v_poll.code,
        'poll_title', v_poll.title,
        'choices_count', v_emp_count,
        'employee_ids', p_employee_ids,
        'is_governance_override', v_is_superadmin,
        'governance_intent', CASE WHEN v_is_superadmin THEN 'PENYEIMBANG_PSIKOLOGIS_KANTOR' ELSE NULL END
    );

    INSERT INTO public.audit_logs (actor_user_id, action, poll_id, payload, ip_address, user_agent, created_at)
    VALUES (
        v_user_id,
        CASE WHEN v_is_superadmin THEN 'SUPERADMIN_GOVERNANCE_VOTE' ELSE 'VOTE_SUBMIT' END,
        p_poll_id,
        v_payload,
        CASE WHEN p_ip_address IS NOT NULL AND p_ip_address <> '' THEN p_ip_address::inet ELSE NULL END,
        p_user_agent,
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'poll_id', p_poll_id,
        'choices_count', v_emp_count,
        'is_governance_exempt', v_is_superadmin,
        'message', CASE 
            WHEN v_is_superadmin THEN 'Suara penyeimbang tata kelola (Superadmin Governance) berhasil tercatat!'
            ELSE 'Suara Anda berhasil tercatat secara aman dan anonim!'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
