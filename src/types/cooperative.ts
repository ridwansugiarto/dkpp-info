// ============================================================
// Koperasi Pegawai DKPP Kota Cilegon — TypeScript Types
// ============================================================

export type StatusPegawai = 'PNS' | 'PPPK' | 'Honorer';
export type StatusKeanggotaan = 'aktif' | 'tidak_aktif' | 'keluar' | 'pensiun';
export type JenisSimpanan = 'wajib' | 'sukarela' | 'pokok';
export type JenisPinjaman = 'reguler' | 'tempo';
export type SumberPembayaran = 'gaji' | 'tpp' | 'gaji_tpp';
export type OfficerRole = 'ketua' | 'sekretaris' | 'bendahara' | 'pengawas' | 'admin';
export type LoanStatus = 'diajukan' | 'diproses' | 'disetujui' | 'ditolak' | 'aktif' | 'lunas' | 'macet';
export type InstallmentStatus = 'belum_jatuh_tempo' | 'jatuh_tempo' | 'dibayar' | 'terlambat' | 'macet';
export type ApplicationStatus = 'diajukan' | 'diverifikasi' | 'disetujui' | 'ditolak' | 'dicairkan';
export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface CooperativeSettings {
  id: string; key: string; value: string; description?: string;
  data_type: 'string' | 'number' | 'boolean'; updated_by?: string; updated_at: string;
}

export interface CooperativeSettingsParsed {
  max_installment_ratio: number; default_service_rate: number;
  max_tenor_months: number; min_loan_amount: number; max_loan_amount: number;
  allow_payment_from_gaji: boolean; allow_payment_from_tpp: boolean;
  allow_payment_from_gaji_tpp: boolean; koperasi_name: string;
  koperasi_berdiri: string; simpanan_wajib_default: number;
}

export interface CooperativeMember {
  id: string; user_id?: string; nip: string; nama: string; jabatan?: string;
  bidang?: string; golongan?: string; status_pegawai: StatusPegawai;
  gaji: number; tpp: number; total_pendapatan: number;
  status_keanggotaan: StatusKeanggotaan; tanggal_bergabung?: string;
  foto_url?: string; catatan?: string; created_at: string; updated_at: string;
}

export interface CooperativeOfficer {
  id: string; user_id?: string; member_id?: string; nama: string; nip: string;
  jabatan_pengurus: string; role: OfficerRole; masa_aktif_mulai?: string;
  masa_aktif_akhir?: string; is_active: boolean; created_at: string; updated_at: string;
}

export interface CooperativeSaving {
  id: string; member_id: string; jenis_simpanan: JenisSimpanan;
  tanggal: string; nominal: number; keterangan?: string;
  periode_bulan?: number; periode_tahun?: number;
  created_by?: string; created_at: string;
}

export interface CooperativeLoan {
  id: string; member_id: string; nomor_pinjaman?: string;
  tanggal_pengajuan: string; tanggal_persetujuan?: string;
  tanggal_pencairan?: string; tanggal_mulai_cicilan?: string;
  jumlah_pinjaman: number; jasa_rate: number; jenis_pinjaman: JenisPinjaman;
  tenor_bulan: number; sumber_pembayaran: SumberPembayaran;
  total_jasa: number; total_kewajiban: number; angsuran_per_bulan: number;
  status: LoanStatus; alasan_penolakan?: string; catatan_pengurus?: string;
  application_id?: string; disetujui_oleh?: string;
  created_at: string; updated_at: string;
}

export interface CooperativeInstallment {
  id: string; loan_id: string; member_id: string;
  installment_number: number; due_date: string;
  principal_amount: number; service_fee_amount: number; total_amount: number;
  paid_amount: number; paid_date?: string; status: InstallmentStatus;
  payment_source?: SumberPembayaran; keterangan?: string;
  dicatat_oleh?: string; created_at: string; updated_at: string;
}

export interface CooperativeLoanApplication {
  id: string; member_id: string; jumlah_diajukan: number;
  tenor_bulan: number; jenis_pinjaman: JenisPinjaman;
  sumber_pembayaran: SumberPembayaran; estimasi_cicilan?: number;
  pendapatan_dasar?: number; batas_cicilan?: number;
  cicilan_aktif?: number; ruang_cicilan?: number; jasa_rate: number;
  status: ApplicationStatus; catatan_pengajuan?: string;
  catatan_pengurus?: string; alasan_penolakan?: string;
  submitted_at: string; reviewed_at?: string; reviewed_by?: string;
  disbursed_at?: string; disbursed_by?: string; loan_id?: string;
  created_at: string; updated_at: string; member?: CooperativeMember;
}

export interface CooperativeTransaction {
  id: string; tanggal: string; jenis: TransactionType; kategori: string;
  nominal: number; sumber?: string; keterangan?: string;
  reference_type?: string; reference_id?: string;
  periode_bulan?: number; periode_tahun?: number;
  created_by?: string; created_at: string;
}

export interface CooperativeNotification {
  id: string; recipient_id?: string; recipient_nip?: string;
  recipient_role?: string; type: string; title: string; body: string;
  reference_type?: string; reference_id?: string;
  is_read: boolean; read_at?: string; created_at: string;
}

export interface MemberDashboardData {
  member: CooperativeMember;
  simpanan: { total: number; wajib: number; sukarela: number; pokok: number; };
  pinjaman_aktif: Array<CooperativeLoan & {
    cicilan_dibayar: number; cicilan_total: number; outstanding: number;
    installments?: CooperativeInstallment[];
  }>;
  pengajuan_pending?: CooperativeLoanApplication[];
  notifikasi_unread?: number;
  savings_history?: CooperativeSaving[];
}

export interface OfficerDashboardData {
  total_pemasukan: number; total_pengeluaran: number; floating_fund: number;
  total_simpanan: number; total_pinjaman_aktif: number;
  kredit_macet: number; pengajuan_pending: number; anggota_aktif: number;
  transactions_recent?: CooperativeTransaction[];
  applications_pending?: CooperativeLoanApplication[];
  loans_macet?: Array<CooperativeLoan & { member: CooperativeMember }>;
}

export interface InstallmentPreview {
  number: number; due_date: string; principal: number;
  service_fee: number; total: number;
}

export interface LoanEligibilityResult {
  eligible: boolean; reason: string; pendapatan_dasar: number;
  total_jasa: number; total_kewajiban: number; angsuran_bulanan: number;
  batas_cicilan: number; max_installment_ratio: number;
  cicilan_aktif: number; ruang_cicilan: number; sisa_pendapatan: number;
  schedule?: InstallmentPreview[];
}

export interface LoanSimulationInput {
  member_id: string; jumlah_pinjaman: number; tenor_bulan: number;
  jenis_pinjaman: JenisPinjaman; sumber_pembayaran: SumberPembayaran;
  jasa_rate?: number;
}

export interface CooperativePanelData {
  role: 'anggota' | 'pengurus' | 'bendahara' | 'entry';
  user_nip?: string; is_verified_member: boolean;
  is_officer: boolean; officer_role?: OfficerRole; member_id?: string;
}

export interface ExcelMemberRow {
  nomor?: number; nama_pegawai: string; nip_pegawai: string;
  jabatan?: string; bidang?: string; golongan_ruang?: string;
  status_pegawai?: string; gaji?: number | string; tpp?: number | string;
  total_pendapatan?: number | string; simpanan_wajib?: number | string;
  simpanan_sukarela?: number | string; pinjaman?: number | string;
  tenor?: number | string; jenis_pinjaman?: string; jasa?: number | string;
  tanggal_mulai_pinjam?: string; sisa_cicilan?: number | string;
  total_sudah_dibayar?: number | string; status_cicilan?: string;
}

export interface ImportValidationResult {
  valid: boolean; errors: string[]; warnings: string[];
  preview: ExcelMemberRow[];
  stats: { total: number; valid: number; invalid: number; will_insert: number; will_update: number; };
}

export interface CoopApiResponse<T = unknown> {
  data?: T; error?: string; message?: string;
}
