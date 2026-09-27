// ============================================================
// Koperasi Calculation Engine
// Semua kalkulasi pinjaman, cicilan, dan eligibility
// ============================================================

import type { InstallmentPreview, LoanEligibilityResult, SumberPembayaran, JenisPinjaman } from '@/types/cooperative';

/**
 * Hitung total jasa pinjaman (flat rate method)
 * Jasa = pokok * jasa_rate_per_tahun * (tenor / 12)
 */
export function calculateLoanService(
  pokok: number,
  jasaRatePerTahun: number,
  tenorBulan: number
): number {
  return Math.round((pokok * jasaRatePerTahun * (tenorBulan / 12)) * 100) / 100;
}

/**
 * Hitung total kewajiban pinjaman
 */
export function calculateTotalObligation(pokok: number, totalJasa: number): number {
  return Math.round((pokok + totalJasa) * 100) / 100;
}

/**
 * Hitung angsuran per bulan
 */
export function calculateMonthlyInstallment(totalKewajiban: number, tenorBulan: number): number {
  return Math.round((totalKewajiban / tenorBulan) * 100) / 100;
}

/**
 * Hitung kalkulasi lengkap pinjaman flat rate
 */
export function calculateFlatLoan(
  pokok: number,
  tenorBulan: number,
  jasaRatePerTahun: number
): {
  pokokPinjaman: number;
  angsuranPokok: number;
  angsuranJasa: number;
  totalJasa: number;
  totalKewajiban: number;
  angsuranPerBulan: number;
} {
  const totalJasa = calculateLoanService(pokok, jasaRatePerTahun, tenorBulan);
  const totalKewajiban = calculateTotalObligation(pokok, totalJasa);
  const angsuranPerBulan = calculateMonthlyInstallment(totalKewajiban, tenorBulan);
  const angsuranPokok = Math.round((pokok / tenorBulan) * 100) / 100;
  const angsuranJasa = Math.round((totalJasa / tenorBulan) * 100) / 100;

  return {
    pokokPinjaman: pokok,
    angsuranPokok,
    angsuranJasa,
    totalJasa,
    totalKewajiban,
    angsuranPerBulan,
  };
}

/**
 * Hitung outstanding pinjaman
 */
export function calculateOutstanding(totalKewajiban: number, totalPaid: number): number {
  return Math.max(0, Math.round((totalKewajiban - totalPaid) * 100) / 100);
}

/**
 * Hitung sisa pendapatan setelah cicilan
 */
export function calculateRemainingIncome(
  pendapatanDasar: number,
  cicilanAktif: number,
  cicilanBaru: number = 0
): number {
  return Math.round((pendapatanDasar - cicilanAktif - cicilanBaru) * 100) / 100;
}

/**
 * Hitung batas cicilan sesuai kebijakan koperasi
 * BUKAN peraturan pemerintah — ini kebijakan internal koperasi
 */
export function calculateInstallmentCapacity(
  pendapatanDasar: number,
  maxInstallmentRatio: number
): number {
  return Math.round(pendapatanDasar * maxInstallmentRatio * 100) / 100;
}

/**
 * Tentukan pendapatan dasar berdasarkan sumber pembayaran
 */
export function getBasePendapatan(
  gaji: number,
  tpp: number,
  sumber: SumberPembayaran
): number {
  switch (sumber) {
    case 'gaji': return gaji;
    case 'tpp': return tpp;
    case 'gaji_tpp': return gaji + tpp;
    default: return gaji;
  }
}

/**
 * Generate preview jadwal cicilan (untuk simulasi di frontend)
 * Flat rate method: pokok sama tiap bulan, jasa dari pokok awal
 */
export function generateInstallmentSchedule(
  pokok: number,
  jasaRatePerTahun: number,
  tenorBulan: number,
  tanggalMulai: Date = new Date()
): InstallmentPreview[] {
  const jasaBulanan = (pokok * jasaRatePerTahun) / 12;
  const pokokBulanan = pokok / tenorBulan;
  const schedule: InstallmentPreview[] = [];

  for (let i = 1; i <= tenorBulan; i++) {
    const dueDate = new Date(tanggalMulai);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      number: i,
      due_date: dueDate.toISOString().split('T')[0],
      principal: Math.round(pokokBulanan * 100) / 100,
      service_fee: Math.round(jasaBulanan * 100) / 100,
      total: Math.round((pokokBulanan + jasaBulanan) * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Client-side simulasi kelayakan pinjaman (preview, bukan final validation)
 * Final validation WAJIB dilakukan server-side via RPC
 */
export function simulateLoanEligibility(params: {
  pokok: number;
  tenorBulan: number;
  jasaRate: number;
  gaji: number;
  tpp: number;
  sumberPembayaran: SumberPembayaran;
  jenisPinjaman: JenisPinjaman;
  cicilanAktif: number;
  maxInstallmentRatio: number;
}): LoanEligibilityResult {
  const {
    pokok, tenorBulan, jasaRate, gaji, tpp,
    sumberPembayaran, cicilanAktif, maxInstallmentRatio,
  } = params;

  const pendapatanDasar = getBasePendapatan(gaji, tpp, sumberPembayaran);
  const totalJasa = calculateLoanService(pokok, jasaRate, tenorBulan);
  const totalKewajiban = calculateTotalObligation(pokok, totalJasa);
  const angsuranBulanan = calculateMonthlyInstallment(totalKewajiban, tenorBulan);
  const batasCicilan = calculateInstallmentCapacity(pendapatanDasar, maxInstallmentRatio);
  const ruangCicilan = Math.max(0, batasCicilan - cicilanAktif);
  const eligible = angsuranBulanan <= ruangCicilan;
  const sisaPendapatan = calculateRemainingIncome(pendapatanDasar, cicilanAktif, angsuranBulanan);

  const schedule = generateInstallmentSchedule(pokok, jasaRate, tenorBulan);

  return {
    eligible,
    reason: eligible
      ? 'Memenuhi parameter kemampuan pembayaran sesuai kebijakan koperasi. Persetujuan tetap melalui proses verifikasi pengurus.'
      : 'Estimasi cicilan melebihi batas kemampuan pembayaran yang ditetapkan koperasi.',
    pendapatan_dasar: pendapatanDasar,
    total_jasa: totalJasa,
    total_kewajiban: totalKewajiban,
    angsuran_bulanan: angsuranBulanan,
    batas_cicilan: batasCicilan,
    max_installment_ratio: maxInstallmentRatio,
    cicilan_aktif: cicilanAktif,
    ruang_cicilan: ruangCicilan,
    sisa_pendapatan: sisaPendapatan,
    schedule,
  };
}

/**
 * Format angka sebagai Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal Indonesia
 */
export function formatTanggalIndonesia(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/**
 * Hitung hari terlambat dari jatuh tempo
 */
export function calculateDaysOverdue(dueDateStr: string): number {
  const today = new Date();
  const dueDate = new Date(dueDateStr);
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - dueDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Kategorisasi aging kredit macet
 */
export function getAgingCategory(daysOverdue: number): string {
  if (daysOverdue <= 0) return 'Belum Jatuh Tempo';
  if (daysOverdue <= 30) return '0–30 hari';
  if (daysOverdue <= 60) return '31–60 hari';
  if (daysOverdue <= 90) return '61–90 hari';
  return '>90 hari (Macet)';
}

/**
 * Parse settings dari format text ke typed object
 */
export function parseSettings(settings: Array<{ key: string; value: string; data_type: string }>): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const s of settings) {
    if (s.data_type === 'number') result[s.key] = parseFloat(s.value);
    else if (s.data_type === 'boolean') result[s.key] = s.value === 'true';
    else result[s.key] = s.value;
  }
  return result;
}
