-- ============================================================
-- MIGRATION: Koperasi Pegawai DKPP Kota Cilegon
-- Version: 1.0.0
-- Date: 2026-09-27
-- Referensi: Permenkop UKM No. 8 Tahun 2023
--            Permenkop UKM No. 2 Tahun 2024
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: cooperative_settings
-- Konfigurasi kebijakan koperasi — tidak boleh hard-code di frontend
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_settings (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  value       TEXT NOT NULL,
  description TEXT,
  data_type   TEXT DEFAULT 'string',
  updated_by  UUID,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cooperative_settings (key, value, description, data_type) VALUES
  ('max_installment_ratio', '0.30', 'Rasio maksimal cicilan terhadap pendapatan dasar (batas kemampuan pembayaran sesuai kebijakan koperasi)', 'number'),
  ('default_service_rate', '0.02', 'Suku jasa default per tahun (2% per tahun)', 'number'),
  ('max_tenor_months', '24', 'Tenor maksimal pinjaman dalam bulan', 'number'),
  ('min_loan_amount', '1000000', 'Jumlah minimum pinjaman (Rp)', 'number'),
  ('max_loan_amount', '50000000', 'Jumlah maksimum pinjaman (Rp)', 'number'),
  ('allow_payment_from_gaji', 'true', 'Izinkan cicilan dari gaji', 'boolean'),
  ('allow_payment_from_tpp', 'true', 'Izinkan cicilan dari TPP', 'boolean'),
  ('allow_payment_from_gaji_tpp', 'true', 'Izinkan cicilan dari Gaji + TPP', 'boolean'),
  ('koperasi_name', 'Koperasi Pegawai DKPP Kota Cilegon', 'Nama resmi koperasi', 'string'),
  ('koperasi_berdiri', '2010-01-01', 'Tanggal berdiri koperasi', 'string'),
  ('simpanan_wajib_default', '50000', 'Simpanan wajib default per bulan (Rp)', 'number')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- TABLE 2: cooperative_members
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_members (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nip               TEXT UNIQUE NOT NULL,
  nama              TEXT NOT NULL,
  jabatan           TEXT,
  bidang            TEXT,
  golongan          TEXT,
  status_pegawai    TEXT DEFAULT 'PNS' CHECK (status_pegawai IN ('PNS', 'PPPK', 'Honorer')),
  gaji              NUMERIC(15,2) DEFAULT 0,
  tpp               NUMERIC(15,2) DEFAULT 0,
  total_pendapatan  NUMERIC(15,2) GENERATED ALWAYS AS (gaji + tpp) STORED,
  status_keanggotaan TEXT DEFAULT 'aktif' CHECK (status_keanggotaan IN ('aktif', 'tidak_aktif', 'keluar', 'pensiun')),
  tanggal_bergabung DATE DEFAULT CURRENT_DATE,
  foto_url          TEXT,
  catatan           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooperative_members_nip ON cooperative_members(nip);
CREATE INDEX IF NOT EXISTS idx_cooperative_members_user_id ON cooperative_members(user_id);

-- ============================================================
-- TABLE 3: cooperative_officers
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_officers (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_id        UUID REFERENCES cooperative_members(id) ON DELETE SET NULL,
  nama             TEXT NOT NULL,
  nip              TEXT NOT NULL,
  jabatan_pengurus TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('ketua', 'sekretaris', 'bendahara', 'pengawas', 'admin')),
  masa_aktif_mulai DATE DEFAULT CURRENT_DATE,
  masa_aktif_akhir DATE,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooperative_officers_user_id ON cooperative_officers(user_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_officers_nip ON cooperative_officers(nip);

-- Insert superadmin sebagai bendahara sementara
INSERT INTO cooperative_officers (nama, nip, jabatan_pengurus, role, is_active)
VALUES ('Ridwan Sugiarto, S.Pi', '197610182002121002', 'Bendahara Koperasi (Sementara)', 'bendahara', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLE 4: cooperative_savings
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_savings (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id       UUID NOT NULL REFERENCES cooperative_members(id) ON DELETE RESTRICT,
  jenis_simpanan  TEXT NOT NULL CHECK (jenis_simpanan IN ('wajib', 'sukarela', 'pokok')),
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  nominal         NUMERIC(15,2) NOT NULL,
  keterangan      TEXT,
  periode_bulan   INTEGER,
  periode_tahun   INTEGER,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooperative_savings_member ON cooperative_savings(member_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_savings_tanggal ON cooperative_savings(tanggal);

-- ============================================================
-- TABLE 5: cooperative_loans
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_loans (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id             UUID NOT NULL REFERENCES cooperative_members(id) ON DELETE RESTRICT,
  nomor_pinjaman        TEXT UNIQUE,
  tanggal_pengajuan     DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_persetujuan   DATE,
  tanggal_pencairan     DATE,
  tanggal_mulai_cicilan DATE,
  jumlah_pinjaman       NUMERIC(15,2) NOT NULL,
  jasa_rate             NUMERIC(6,4) DEFAULT 0.02,
  jenis_pinjaman        TEXT NOT NULL DEFAULT 'reguler' CHECK (jenis_pinjaman IN ('reguler', 'tempo')),
  tenor_bulan           INTEGER NOT NULL,
  sumber_pembayaran     TEXT NOT NULL DEFAULT 'gaji' CHECK (sumber_pembayaran IN ('gaji', 'tpp', 'gaji_tpp')),
  total_jasa            NUMERIC(15,2) DEFAULT 0,
  total_kewajiban       NUMERIC(15,2) DEFAULT 0,
  angsuran_per_bulan    NUMERIC(15,2) DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'diajukan' CHECK (status IN (
    'diajukan', 'diproses', 'disetujui', 'ditolak', 'aktif', 'lunas', 'macet'
  )),
  alasan_penolakan      TEXT,
  catatan_pengurus      TEXT,
  application_id        UUID,
  disetujui_oleh        UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nomor_pinjaman IS NULL THEN
    NEW.nomor_pinjaman := 'KOP/' || TO_CHAR(NOW(), 'YYYY/MM') || '/' ||
      LPAD(CAST(FLOOR(RANDOM() * 9000 + 1000) AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_loan_number
  BEFORE INSERT ON cooperative_loans
  FOR EACH ROW EXECUTE FUNCTION generate_loan_number();

CREATE INDEX IF NOT EXISTS idx_cooperative_loans_member ON cooperative_loans(member_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_loans_status ON cooperative_loans(status);

-- ============================================================
-- TABLE 6: cooperative_installments
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_installments (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  loan_id               UUID NOT NULL REFERENCES cooperative_loans(id) ON DELETE CASCADE,
  member_id             UUID NOT NULL REFERENCES cooperative_members(id),
  installment_number    INTEGER NOT NULL,
  due_date              DATE NOT NULL,
  principal_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  service_fee_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(15,2) GENERATED ALWAYS AS (principal_amount + service_fee_amount) STORED,
  paid_amount           NUMERIC(15,2) DEFAULT 0,
  paid_date             DATE,
  status                TEXT NOT NULL DEFAULT 'belum_jatuh_tempo' CHECK (status IN (
    'belum_jatuh_tempo', 'jatuh_tempo', 'dibayar', 'terlambat', 'macet'
  )),
  payment_source        TEXT CHECK (payment_source IN ('gaji', 'tpp', 'gaji_tpp')),
  keterangan            TEXT,
  dicatat_oleh          UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (loan_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_cooperative_installments_loan ON cooperative_installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_installments_member ON cooperative_installments(member_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_installments_due ON cooperative_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_cooperative_installments_status ON cooperative_installments(status);

-- ============================================================
-- TABLE 7: cooperative_loan_applications
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_loan_applications (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id             UUID NOT NULL REFERENCES cooperative_members(id) ON DELETE RESTRICT,
  jumlah_diajukan       NUMERIC(15,2) NOT NULL,
  tenor_bulan           INTEGER NOT NULL,
  jenis_pinjaman        TEXT NOT NULL DEFAULT 'reguler' CHECK (jenis_pinjaman IN ('reguler', 'tempo')),
  sumber_pembayaran     TEXT NOT NULL DEFAULT 'gaji' CHECK (sumber_pembayaran IN ('gaji', 'tpp', 'gaji_tpp')),
  estimasi_cicilan      NUMERIC(15,2),
  pendapatan_dasar      NUMERIC(15,2),
  batas_cicilan         NUMERIC(15,2),
  cicilan_aktif         NUMERIC(15,2),
  ruang_cicilan         NUMERIC(15,2),
  jasa_rate             NUMERIC(6,4) DEFAULT 0.02,
  status                TEXT NOT NULL DEFAULT 'diajukan' CHECK (status IN (
    'diajukan', 'diverifikasi', 'disetujui', 'ditolak', 'dicairkan'
  )),
  catatan_pengajuan     TEXT,
  catatan_pengurus      TEXT,
  alasan_penolakan      TEXT,
  submitted_at          TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES auth.users(id),
  disbursed_at          TIMESTAMPTZ,
  disbursed_by          UUID REFERENCES auth.users(id),
  loan_id               UUID REFERENCES cooperative_loans(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooperative_applications_member ON cooperative_loan_applications(member_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_applications_status ON cooperative_loan_applications(status);

-- ============================================================
-- TABLE 8: cooperative_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_transactions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis           TEXT NOT NULL CHECK (jenis IN ('pemasukan', 'pengeluaran')),
  kategori        TEXT NOT NULL,
  nominal         NUMERIC(15,2) NOT NULL,
  sumber          TEXT,
  keterangan      TEXT,
  reference_type  TEXT,
  reference_id    UUID,
  periode_bulan   INTEGER,
  periode_tahun   INTEGER,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooperative_transactions_tanggal ON cooperative_transactions(tanggal);
CREATE INDEX IF NOT EXISTS idx_cooperative_transactions_jenis ON cooperative_transactions(jenis);

-- ============================================================
-- TABLE 9: cooperative_audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_audit_logs (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id),
  user_name       TEXT,
  user_role       TEXT,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  description     TEXT NOT NULL,
  data_before     JSONB,
  data_after      JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooperative_audit_user ON cooperative_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_audit_resource ON cooperative_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_audit_created ON cooperative_audit_logs(created_at);

-- ============================================================
-- TABLE 10: cooperative_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS cooperative_notifications (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_id    UUID REFERENCES auth.users(id),
  recipient_nip   TEXT,
  recipient_role  TEXT,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  reference_type  TEXT,
  reference_id    UUID,
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooperative_notif_recipient ON cooperative_notifications(recipient_id, is_read);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE cooperative_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_notifications ENABLE ROW LEVEL SECURITY;

-- cooperative_settings: public read
CREATE POLICY "coop_settings_read" ON cooperative_settings FOR SELECT USING (TRUE);

-- cooperative_members: hanya lihat data sendiri
CREATE POLICY "coop_members_self_read" ON cooperative_members
  FOR SELECT USING (user_id = auth.uid());

-- cooperative_officers: semua authenticated user bisa lihat (info internal)
CREATE POLICY "coop_officers_read" ON cooperative_officers
  FOR SELECT USING (is_active = TRUE AND auth.uid() IS NOT NULL);

-- cooperative_savings: hanya milik sendiri
CREATE POLICY "coop_savings_self_read" ON cooperative_savings
  FOR SELECT USING (
    member_id IN (SELECT id FROM cooperative_members WHERE user_id = auth.uid())
  );

-- cooperative_loans: hanya milik sendiri
CREATE POLICY "coop_loans_self_read" ON cooperative_loans
  FOR SELECT USING (
    member_id IN (SELECT id FROM cooperative_members WHERE user_id = auth.uid())
  );

-- cooperative_installments: hanya milik sendiri
CREATE POLICY "coop_installments_self_read" ON cooperative_installments
  FOR SELECT USING (
    member_id IN (SELECT id FROM cooperative_members WHERE user_id = auth.uid())
  );

-- cooperative_loan_applications: hanya milik sendiri
CREATE POLICY "coop_applications_self_read" ON cooperative_loan_applications
  FOR SELECT USING (
    member_id IN (SELECT id FROM cooperative_members WHERE user_id = auth.uid())
  );

-- cooperative_transactions: deny direct client access (only via API)
CREATE POLICY "coop_transactions_deny" ON cooperative_transactions FOR SELECT USING (FALSE);

-- cooperative_audit_logs: deny direct client access
CREATE POLICY "coop_audit_deny" ON cooperative_audit_logs FOR SELECT USING (FALSE);

-- cooperative_notifications: hanya milik sendiri
CREATE POLICY "coop_notif_self_read" ON cooperative_notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "coop_notif_self_update" ON cooperative_notifications
  FOR UPDATE USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- ============================================================
-- SUPABASE RPC FUNCTIONS
-- ============================================================

-- RPC: Cek eligibility pinjaman (server-side validation)
CREATE OR REPLACE FUNCTION rpc_check_loan_eligibility(
  p_member_id         UUID,
  p_jumlah_pinjaman   NUMERIC,
  p_tenor_bulan       INTEGER,
  p_jasa_rate         NUMERIC DEFAULT 0.02,
  p_sumber_pembayaran TEXT DEFAULT 'gaji'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member           cooperative_members%ROWTYPE;
  v_max_ratio        NUMERIC;
  v_pendapatan_dasar NUMERIC;
  v_total_jasa       NUMERIC;
  v_total_kewajiban  NUMERIC;
  v_angsuran         NUMERIC;
  v_batas_cicilan    NUMERIC;
  v_cicilan_aktif    NUMERIC;
  v_ruang_cicilan    NUMERIC;
  v_eligible         BOOLEAN;
  v_reason           TEXT;
BEGIN
  SELECT * INTO v_member FROM cooperative_members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', FALSE, 'reason', 'Anggota tidak ditemukan');
  END IF;

  SELECT CAST(value AS NUMERIC) INTO v_max_ratio
    FROM cooperative_settings WHERE key = 'max_installment_ratio';
  IF v_max_ratio IS NULL THEN v_max_ratio := 0.30; END IF;

  v_pendapatan_dasar := CASE p_sumber_pembayaran
    WHEN 'gaji'     THEN v_member.gaji
    WHEN 'tpp'      THEN v_member.tpp
    WHEN 'gaji_tpp' THEN v_member.total_pendapatan
    ELSE v_member.gaji
  END;

  -- Flat rate: jasa dihitung dari pokok * rate * (tenor/12)
  v_total_jasa      := p_jumlah_pinjaman * p_jasa_rate * (p_tenor_bulan::NUMERIC / 12.0);
  v_total_kewajiban := p_jumlah_pinjaman + v_total_jasa;
  v_angsuran        := v_total_kewajiban / p_tenor_bulan;
  v_batas_cicilan   := v_pendapatan_dasar * v_max_ratio;

  -- Total cicilan per bulan yang masih aktif
  SELECT COALESCE(SUM(lo.angsuran_per_bulan), 0)
  INTO v_cicilan_aktif
  FROM cooperative_loans lo
  WHERE lo.member_id = p_member_id
    AND lo.status IN ('aktif', 'disetujui');

  v_ruang_cicilan := v_batas_cicilan - v_cicilan_aktif;
  v_eligible      := v_angsuran <= v_ruang_cicilan;

  IF NOT v_eligible THEN
    v_reason := 'Estimasi cicilan melebihi batas kemampuan pembayaran yang ditetapkan koperasi.';
  ELSE
    v_reason := 'Memenuhi parameter kemampuan pembayaran sesuai kebijakan koperasi.';
  END IF;

  RETURN jsonb_build_object(
    'eligible',              v_eligible,
    'reason',                v_reason,
    'pendapatan_dasar',      v_pendapatan_dasar,
    'total_jasa',            ROUND(v_total_jasa, 2),
    'total_kewajiban',       ROUND(v_total_kewajiban, 2),
    'angsuran_bulanan',      ROUND(v_angsuran, 2),
    'batas_cicilan',         ROUND(v_batas_cicilan, 2),
    'max_installment_ratio', v_max_ratio,
    'cicilan_aktif',         ROUND(v_cicilan_aktif, 2),
    'ruang_cicilan',         ROUND(v_ruang_cicilan, 2),
    'sisa_pendapatan',       ROUND(v_pendapatan_dasar - v_cicilan_aktif - v_angsuran, 2)
  );
END;
$$;

-- RPC: Dashboard anggota
CREATE OR REPLACE FUNCTION rpc_get_member_dashboard(p_member_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member            cooperative_members%ROWTYPE;
  v_total_simpanan    NUMERIC;
  v_simpanan_wajib    NUMERIC;
  v_simpanan_sukarela NUMERIC;
  v_pinjaman_aktif    JSONB;
BEGIN
  SELECT * INTO v_member FROM cooperative_members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Member not found');
  END IF;

  SELECT
    COALESCE(SUM(nominal), 0),
    COALESCE(SUM(CASE WHEN jenis_simpanan = 'wajib' THEN nominal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN jenis_simpanan = 'sukarela' THEN nominal ELSE 0 END), 0)
  INTO v_total_simpanan, v_simpanan_wajib, v_simpanan_sukarela
  FROM cooperative_savings WHERE member_id = p_member_id;

  SELECT jsonb_agg(jsonb_build_object(
    'id', lo.id,
    'nomor', lo.nomor_pinjaman,
    'jumlah', lo.jumlah_pinjaman,
    'jenis', lo.jenis_pinjaman,
    'tenor', lo.tenor_bulan,
    'jasa_rate', lo.jasa_rate,
    'total_kewajiban', lo.total_kewajiban,
    'angsuran_per_bulan', lo.angsuran_per_bulan,
    'sumber_pembayaran', lo.sumber_pembayaran,
    'tanggal_mulai', lo.tanggal_mulai_cicilan,
    'status', lo.status,
    'cicilan_dibayar', (SELECT COUNT(*) FROM cooperative_installments ci
      WHERE ci.loan_id = lo.id AND ci.status = 'dibayar'),
    'cicilan_total', lo.tenor_bulan
  ))
  INTO v_pinjaman_aktif
  FROM cooperative_loans lo
  WHERE lo.member_id = p_member_id AND lo.status IN ('aktif', 'disetujui');

  RETURN jsonb_build_object(
    'member', jsonb_build_object(
      'id', v_member.id, 'nip', v_member.nip, 'nama', v_member.nama,
      'jabatan', v_member.jabatan, 'bidang', v_member.bidang,
      'golongan', v_member.golongan, 'gaji', v_member.gaji,
      'tpp', v_member.tpp, 'total_pendapatan', v_member.total_pendapatan
    ),
    'simpanan', jsonb_build_object(
      'total', v_total_simpanan, 'wajib', v_simpanan_wajib,
      'sukarela', v_simpanan_sukarela
    ),
    'pinjaman_aktif', COALESCE(v_pinjaman_aktif, '[]'::jsonb)
  );
END;
$$;

-- RPC: Dashboard pengurus/bendahara
CREATE OR REPLACE FUNCTION rpc_get_officer_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_pemasukan      NUMERIC;
  v_total_pengeluaran    NUMERIC;
  v_total_simpanan       NUMERIC;
  v_total_pinjaman_aktif NUMERIC;
  v_kredit_macet         NUMERIC;
  v_pengajuan_pending    INTEGER;
  v_anggota_aktif        INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN jenis = 'pemasukan' THEN nominal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN jenis = 'pengeluaran' THEN nominal ELSE 0 END), 0)
  INTO v_total_pemasukan, v_total_pengeluaran
  FROM cooperative_transactions
  WHERE EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM CURRENT_DATE);

  SELECT COALESCE(SUM(nominal), 0) INTO v_total_simpanan FROM cooperative_savings;
  SELECT COALESCE(SUM(total_kewajiban), 0) INTO v_total_pinjaman_aktif
    FROM cooperative_loans WHERE status IN ('aktif', 'disetujui');
  SELECT COALESCE(SUM(total_kewajiban), 0) INTO v_kredit_macet
    FROM cooperative_loans WHERE status = 'macet';
  SELECT COUNT(*) INTO v_pengajuan_pending
    FROM cooperative_loan_applications WHERE status = 'diajukan';
  SELECT COUNT(*) INTO v_anggota_aktif
    FROM cooperative_members WHERE status_keanggotaan = 'aktif';

  RETURN jsonb_build_object(
    'total_pemasukan',      v_total_pemasukan,
    'total_pengeluaran',    v_total_pengeluaran,
    'floating_fund',        v_total_pemasukan - v_total_pengeluaran,
    'total_simpanan',       v_total_simpanan,
    'total_pinjaman_aktif', v_total_pinjaman_aktif,
    'kredit_macet',         v_kredit_macet,
    'pengajuan_pending',    v_pengajuan_pending,
    'anggota_aktif',        v_anggota_aktif
  );
END;
$$;

-- RPC: Generate jadwal cicilan
CREATE OR REPLACE FUNCTION rpc_generate_installment_schedule(p_loan_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_loan          cooperative_loans%ROWTYPE;
  v_pokok         NUMERIC;
  v_jasa          NUMERIC;
  v_due_date      DATE;
  i               INTEGER;
BEGIN
  SELECT * INTO v_loan FROM cooperative_loans WHERE id = p_loan_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_pokok := v_loan.jumlah_pinjaman / v_loan.tenor_bulan;
  v_jasa  := (v_loan.jumlah_pinjaman * v_loan.jasa_rate) / 12;

  DELETE FROM cooperative_installments WHERE loan_id = p_loan_id;

  FOR i IN 1..v_loan.tenor_bulan LOOP
    v_due_date := COALESCE(v_loan.tanggal_mulai_cicilan, CURRENT_DATE) +
                  (INTERVAL '1 month' * i);
    INSERT INTO cooperative_installments (
      loan_id, member_id, installment_number, due_date,
      principal_amount, service_fee_amount, payment_source
    ) VALUES (
      p_loan_id, v_loan.member_id, i, v_due_date,
      ROUND(v_pokok, 2), ROUND(v_jasa, 2), v_loan.sumber_pembayaran
    );
  END LOOP;

  UPDATE cooperative_loans SET
    total_jasa         = ROUND(v_jasa * v_loan.tenor_bulan, 2),
    total_kewajiban    = v_loan.jumlah_pinjaman + ROUND(v_jasa * v_loan.tenor_bulan, 2),
    angsuran_per_bulan = ROUND(v_pokok + v_jasa, 2),
    updated_at         = NOW()
  WHERE id = p_loan_id;
END;
$$;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coop_members_upd BEFORE UPDATE ON cooperative_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_coop_officers_upd BEFORE UPDATE ON cooperative_officers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_coop_loans_upd BEFORE UPDATE ON cooperative_loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_coop_installments_upd BEFORE UPDATE ON cooperative_installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_coop_applications_upd BEFORE UPDATE ON cooperative_loan_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SINKRONISASI SISTEMIK DENGAN MASTER DATA KEPEGAWAIAN
-- Mengaitkan otomatis pegawai aktif DKPP (tabel dkpp_pegawai_nip)
-- ke dalam database keanggotaan Koperasi (cooperative_members)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dkpp_pegawai_nip') THEN
    INSERT INTO cooperative_members (nip, nama, jabatan, bidang, golongan, status_pegawai, status_keanggotaan)
    SELECT 
      TRIM(p.nip), 
      TRIM(p.nama), 
      p.jabatan, 
      p.bidang, 
      p.golongan, 
      CASE 
        WHEN p.status_pegawai ILIKE '%PPPK%' THEN 'PPPK'
        WHEN p.status_pegawai ILIKE '%Honorer%' OR p.status_pegawai ILIKE '%THL%' THEN 'Honorer'
        ELSE 'PNS'
      END,
      'aktif'
    FROM public.dkpp_pegawai_nip p
    WHERE p.is_active = TRUE
    ON CONFLICT (nip) DO UPDATE SET
      nama = EXCLUDED.nama,
      jabatan = EXCLUDED.jabatan,
      bidang = EXCLUDED.bidang,
      golongan = EXCLUDED.golongan,
      status_pegawai = EXCLUDED.status_pegawai,
      updated_at = NOW();
  END IF;
END $$;

