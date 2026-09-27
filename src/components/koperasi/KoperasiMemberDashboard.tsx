'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Send,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import {
  formatRupiah,
  calculateFlatLoan,
  simulateLoanEligibility,
} from '@/lib/koperasi/calculations';
import confetti from 'canvas-confetti';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MemberDashboardProps {
  memberData: any;
  dashboardData: any;
  installments: any[];
  savingsHistory: any[];
  applications: any[];
  settings: any[];
  currentUser: any;
  onRefresh: () => void;
}

export function KoperasiMemberDashboard({
  memberData,
  dashboardData,
  installments = [],
  savingsHistory = [],
  applications = [],
  settings = [],
  currentUser,
  onRefresh,
}: MemberDashboardProps) {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'simpanan' | 'pinjaman' | 'cicilan' | 'simulasi' | 'pengajuan'>(
    'ringkasan'
  );

  // Settings parsed
  const maxRatio = useMemo(() => {
    const s = settings.find((item: any) => item.key === 'max_installment_ratio');
    return s ? parseFloat(s.value) : 0.30;
  }, [settings]);

  const defaultServiceRate = useMemo(() => {
    const s = settings.find((item: any) => item.key === 'default_service_rate');
    return s ? parseFloat(s.value) : 0.02;
  }, [settings]);

  const maxTenorMonths = useMemo(() => {
    const s = settings.find((item: any) => item.key === 'max_tenor_months');
    return s ? parseInt(s.value, 10) : 24;
  }, [settings]);

  // Max loan plafond: (Gaji + TPP) * 30% * 24 bulan
  const maxLoanPlafond = useMemo(() => {
    const gaji = Number(memberData?.gaji) || 0;
    const tpp = Number(memberData?.tpp) || 0;
    const total = Number(memberData?.total_pendapatan) || (gaji + tpp);
    if (total > 0) {
      return Math.round(total * 0.30 * 24);
    }
    return 50000000;
  }, [memberData]);

  // Simulation state
  const [simAmount, setSimAmount] = useState<number>(5000000);
  const [simTenor, setSimTenor] = useState<number>(12);
  const [amountInputText, setAmountInputText] = useState<string>('');
  const [isAmountFocused, setIsAmountFocused] = useState<boolean>(false);
  const [tenorInputText, setTenorInputText] = useState<string>('');
  const [isTenorFocused, setIsTenorFocused] = useState<boolean>(false);
  const [simSource, setSimSource] = useState<'gaji' | 'tpp' | 'gaji_tpp'>('gaji');
  const [simNotes, setSimNotes] = useState<string>('');
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handler input manual jumlah pinjaman
  const handleAmountFocus = () => {
    setIsAmountFocused(true);
    setAmountInputText(''); // Teks dalam kotak otomatis hilang saat diklik
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountInputText('');
      return;
    }
    let num = Number(raw);
    if (num > maxLoanPlafond) {
      num = maxLoanPlafond; // dibatasi maksimal (gaji+tpp) * 30% * 24
    }
    setAmountInputText(String(num));
    setSimAmount(num);
  };

  const handleAmountBlur = () => {
    setIsAmountFocused(false);
    if (!amountInputText || Number(amountInputText) < 500000) {
      setAmountInputText('');
    } else {
      const num = Math.min(Number(amountInputText), maxLoanPlafond);
      setSimAmount(num);
      setAmountInputText(formatRupiah(num));
    }
  };

  // Handler input manual tenor bulan (maksimal 24)
  const handleTenorFocus = () => {
    setIsTenorFocused(true);
    setTenorInputText(''); // Teks dalam kotak otomatis hilang saat diklik
  };

  const handleTenorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setTenorInputText('');
      return;
    }
    let num = Number(raw);
    // Untuk tenor maksimal angka yaitu 24, lebih dari 24 tidak bisa / capped at 24
    if (num > 24) {
      num = 24;
    }
    setTenorInputText(String(num));
    if (num >= 1) {
      setSimTenor(num);
    }
  };

  const handleTenorBlur = () => {
    setIsTenorFocused(false);
    if (!tenorInputText || Number(tenorInputText) < 1) {
      setTenorInputText('');
    } else {
      const num = Math.min(24, Math.max(1, Number(tenorInputText)));
      setSimTenor(num);
      setTenorInputText(`${num} Bulan`);
    }
  };

  // Calculate live simulation
  const simCalc = useMemo(() => {
    return calculateFlatLoan(simAmount, simTenor, defaultServiceRate);
  }, [simAmount, simTenor, defaultServiceRate]);

  // Member current active loans monthly payment
  const currentActiveInstallments = useMemo(() => {
    if (!dashboardData?.pinjaman_aktif) return 0;
    return (dashboardData.pinjaman_aktif || []).reduce(
      (acc: number, cur: any) => acc + (Number(cur.angsuran_per_bulan) || 0),
      0
    );
  }, [dashboardData]);

  // Base income for selected source
  const pendapatanDasar = useMemo(() => {
    if (!memberData) return 0;
    if (simSource === 'gaji') return Number(memberData.gaji) || 0;
    if (simSource === 'tpp') return Number(memberData.tpp) || 0;
    return Number(memberData.total_pendapatan) || 0;
  }, [memberData, simSource]);

  // Live eligibility check
  const eligibility = useMemo(() => {
    if (!memberData) return null;
    return simulateLoanEligibility({
      pokok: simAmount,
      tenorBulan: simTenor,
      jasaRate: defaultServiceRate,
      gaji: Number(memberData.gaji) || 0,
      tpp: Number(memberData.tpp) || 0,
      sumberPembayaran: simSource,
      jenisPinjaman: 'reguler',
      cicilanAktif: currentActiveInstallments,
      maxInstallmentRatio: maxRatio,
    });
  }, [memberData, simAmount, simTenor, defaultServiceRate, simSource, currentActiveInstallments, maxRatio]);

  // Submit loan application handler
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility?.eligible) {
      setSubmitMessage({
        type: 'error',
        text: eligibility?.reason || 'Pengajuan pinjaman melebihi batas kemampuan pembayaran.',
      });
      return;
    }

    setIsSubmittingApp(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/koperasi/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          jumlah_diajukan: simAmount,
          tenor_bulan: simTenor,
          jenis_pinjaman: 'reguler',
          sumber_pembayaran: simSource,
          catatan_pengajuan: simNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengirim pengajuan.');
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSubmitMessage({
        type: 'success',
        text: 'Pengajuan pinjaman berhasil dikirimkan! Pengurus akan segera memverifikasi.',
      });
      setSimNotes('');
      onRefresh();
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: err.message || 'Terjadi kesalahan.' });
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // Savings chart data
  const savingsChartData = useMemo(() => {
    const list = [...savingsHistory].reverse().slice(-6);
    return list.map((s) => ({
      name: s.tanggal ? `${new Date(s.tanggal).toLocaleString('id-ID', { month: 'short' })}` : '-',
      nominal: Number(s.nominal) || 0,
      jenis: s.jenis_simpanan,
    }));
  }, [savingsHistory]);

  const totalSimpanan = dashboardData?.simpanan?.total || 0;
  const simpananWajib = dashboardData?.simpanan?.wajib || 0;
  const simpananSukarela = dashboardData?.simpanan?.sukarela || 0;
  const activeLoans = dashboardData?.pinjaman_aktif || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1E41] via-[#1E3A8A] to-[#1E40AF] p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Anggota Aktif Koperasi Pegawai DKPP
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Halo, {memberData?.nama || currentUser?.full_name || 'Bapak/Ibu'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/90 mt-1">
              NIP: {memberData?.nip} &bull; {memberData?.jabatan || 'Pegawai DKPP'} &bull; {memberData?.bidang || 'DKPP Cilegon'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('simulasi')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Simulasi Pinjaman
            </button>
            <button
              onClick={() => setActiveTab('cicilan')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-xs border border-white/20 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Jadwal Angsuran
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-10 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ringkasan', label: 'Ringkasan', icon: TrendingUp },
          { id: 'simpanan', label: 'Simpanan Saya', icon: Wallet },
          { id: 'pinjaman', label: 'Pinjaman Aktif', icon: CreditCard },
          { id: 'cicilan', label: 'Jadwal Cicilan', icon: Calendar },
          { id: 'simulasi', label: 'Simulasi & Pengajuan', icon: Sparkles },
          { id: 'pengajuan', label: 'Riwayat Pengajuan', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#0B1E41] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RINGKASAN */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Simpanan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Total Simpanan</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xl font-black text-slate-900">{formatRupiah(totalSimpanan)}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Wajib: {formatRupiah(simpananWajib)}</span>
                <span>Sukarela: {formatRupiah(simpananSukarela)}</span>
              </div>
            </div>

            {/* Pinjaman Berjalan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Pinjaman Aktif</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xl font-black text-slate-900">{activeLoans.length} Pinjaman</p>
              <p className="mt-2 text-[11px] text-slate-500">
                Total angsuran: {formatRupiah(currentActiveInstallments)} /bln
              </p>
            </div>

            {/* Pendapatan Terdaftar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Gaji & TPP</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xl font-black text-slate-900">
                {formatRupiah(Number(memberData?.total_pendapatan) || 0)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Gaji: {formatRupiah(Number(memberData?.gaji) || 0)}</span>
                <span>TPP: {formatRupiah(Number(memberData?.tpp) || 0)}</span>
              </div>
            </div>

            {/* Batas Kemampuan Pembayaran */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Batas Cicilan Koperasi</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xl font-black text-slate-900">
                {formatRupiah((Number(memberData?.gaji) || 0) * maxRatio)}
              </p>
              <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                Maksimal {(maxRatio * 100).toFixed(0)}% sesuai kebijakan koperasi
              </p>
            </div>
          </div>

          {/* Quick Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Pinjaman Berjalan Detail */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Pinjaman Sedang Berjalan
                </h3>
                <button
                  onClick={() => setActiveTab('pinjaman')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeLoans.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Tidak ada pinjaman aktif saat ini.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Anda dapat mengajukan pinjaman dengan mudah melalui fitur simulasi pinjaman.
                  </p>
                  <button
                    onClick={() => setActiveTab('simulasi')}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Mulai Simulasi Pinjaman
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeLoans.map((loan: any) => {
                    const paidCount = Number(loan.cicilan_dibayar) || 0;
                    const totalCount = Number(loan.cicilan_total) || 1;
                    const percent = Math.min(100, Math.round((paidCount / totalCount) * 100));

                    return (
                      <div
                        key={loan.id}
                        className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{loan.nomor}</span>
                            <p className="text-[11px] text-slate-500">
                              Tenor: {loan.tenor} bulan &bull; Potong: {loan.sumber_pembayaran?.toUpperCase()}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                            {loan.status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400">Plafon:</span>
                            <p className="font-bold text-slate-800">{formatRupiah(loan.jumlah)}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Angsuran / bln:</span>
                            <p className="font-bold text-slate-800">{formatRupiah(loan.angsuran_per_bulan)}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Total Kewajiban:</span>
                            <p className="font-bold text-slate-800">{formatRupiah(loan.total_kewajiban)}</p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-500">Progres Angsuran:</span>
                            <span className="font-semibold text-slate-700">
                              {paidCount} dari {totalCount} bulan ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col: Info Kebijakan & Simpanan */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Ketentuan Koperasi
                </h3>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p>
                      <strong>Suku Jasa:</strong> Flat {(defaultServiceRate * 100).toFixed(1)}% per tahun.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p>
                      <strong>Batas Angsuran:</strong> Maks. {(maxRatio * 100).toFixed(0)}% dari pendapatan dasar
                      sesuai kebijakan koperasi.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p>
                      <strong>Maksimal Tenor:</strong> {maxTenorMonths} bulan.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p>
                      <strong>Metode Pembayaran:</strong> Otomatis potong gaji bulanan atau TPP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Next due installment teaser */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/60 p-5">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Pengingat Cicilan
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1">
                  Potongan Cicilan Bulan Berjalan
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Cicilan akan didebet otomatis sesuai slip gaji/TPP Anda pada awal bulan berikutnya.
                </p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Estimasi Debet:</span>
                  <span className="font-extrabold text-blue-900">
                    {formatRupiah(currentActiveInstallments)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIMPANAN */}
      {activeTab === 'simpanan' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Cards Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Simpanan Wajib</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(simpananWajib)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Disetor rutin setiap bulan</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Simpanan Sukarela</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(simpananSukarela)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Dapat diambil sewaktu-waktu</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Akumulasi Simpanan</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{formatRupiah(totalSimpanan)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Aset simpanan di koperasi</p>
            </div>
          </div>

          {/* Chart visualisasi simpanan */}
          {savingsChartData.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Tren Setoran Simpanan Terbaru</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(Number(val)), 'Nominal']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="nominal" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Riwayat Setoran Simpanan</h3>
              <span className="text-xs text-slate-500">{savingsHistory.length} transaksi</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {savingsHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada data simpanan tercatat.
                      </td>
                    </tr>
                  ) : (
                    savingsHistory.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          {new Date(s.tanggal).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.jenis_simpanan === 'wajib'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {s.jenis_simpanan.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {s.periode_bulan}/{s.periode_tahun}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatRupiah(s.nominal)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{s.keterangan || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PINJAMAN AKTIF */}
      {activeTab === 'pinjaman' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Daftar Pinjaman Koperasi</h2>
            <button
              onClick={() => setActiveTab('simulasi')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs"
            >
              + Pengajuan Pinjaman Baru
            </button>
          </div>

          {activeLoans.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">Tidak ada pinjaman aktif</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Anda tidak memiliki tanggungan pinjaman aktif di Koperasi Pegawai DKPP saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLoans.map((loan: any) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <span className="text-xs font-extrabold text-blue-900">{loan.nomor}</span>
                      <p className="text-[11px] text-slate-400">
                        Mulai: {loan.tanggal_mulai ? new Date(loan.tanggal_mulai).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {loan.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400">Jumlah Pinjaman</span>
                      <p className="font-bold text-slate-900 text-sm">{formatRupiah(loan.jumlah)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Total Kewajiban</span>
                      <p className="font-bold text-slate-900 text-sm">{formatRupiah(loan.total_kewajiban)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Angsuran per Bulan</span>
                      <p className="font-bold text-blue-700">{formatRupiah(loan.angsuran_per_bulan)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Sumber Pemotongan</span>
                      <p className="font-bold text-slate-800 uppercase">{loan.sumber_pembayaran}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-600 font-medium">Realisasi Pembayaran</span>
                      <span className="font-bold text-slate-900">
                        {loan.cicilan_dibayar || 0} / {loan.cicilan_total || loan.tenor} Bulan
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((loan.cicilan_dibayar || 0) / (loan.cicilan_total || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: JADWAL CICILAN */}
      {activeTab === 'cicilan' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Jadwal Angsuran Pinjaman</h3>
                <p className="text-xs text-slate-500">Rincian seluruh cicilan pinjaman Anda</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{installments.length} Angsuran</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">No.</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Pokok</th>
                    <th className="py-3 px-4">Jasa (Bunga)</th>
                    <th className="py-3 px-4">Total Angsuran</th>
                    <th className="py-3 px-4">Tgl Bayar</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {installments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada jadwal angsuran aktif.
                      </td>
                    </tr>
                  ) : (
                    installments.map((inst) => {
                      const isPaid = inst.status === 'dibayar';
                      const isOverdue = inst.status === 'terlambat' || inst.status === 'macet';

                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">Ke-{inst.installment_number}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {new Date(inst.due_date).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3 px-4">{formatRupiah(inst.principal_amount)}</td>
                          <td className="py-3 px-4 text-slate-500">{formatRupiah(inst.service_fee_amount)}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {formatRupiah(inst.total_amount || Number(inst.principal_amount) + Number(inst.service_fee_amount))}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {inst.paid_date ? new Date(inst.paid_date).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isOverdue
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {inst.status === 'dibayar'
                                ? 'LUNAS'
                                : inst.status === 'jatuh_tempo'
                                ? 'JATUH TEMPO'
                                : inst.status === 'belum_jatuh_tempo'
                                ? 'BELUM TEMPO'
                                : inst.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SIMULASI & PENGAJUAN */}
      {activeTab === 'simulasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Form Inputs (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Simulasi & Pengajuan Pinjaman</h3>
                <p className="text-xs text-slate-500">Hitung kalkulasi flat-rate dan ajukan pinjaman secara instan</p>
              </div>
            </div>

            <form onSubmit={handleApplyLoan} className="space-y-6">
              {/* Jumlah Pinjaman */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Jumlah Pinjaman (Plafon)</label>
                    <p className="text-[10.5px] text-slate-400">
                      Maksimal: <span className="font-semibold text-emerald-700">{formatRupiah(maxLoanPlafond)}</span> (30% x Pendapatan x 24 bln)
                    </p>
                  </div>
                  <span className="text-sm font-black text-blue-600">{formatRupiah(simAmount)}</span>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={maxLoanPlafond}
                  step={500000}
                  value={simAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSimAmount(val);
                    setAmountInputText('');
                    setIsAmountFocused(false);
                  }}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                {/* Quick chip amounts + Kotak Input Manual */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {[2000000, 5000000, 10000000, 20000000, 30000000, 50000000]
                    .filter((amt) => amt <= maxLoanPlafond)
                    .map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          setSimAmount(amt);
                          setAmountInputText('');
                          setIsAmountFocused(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          simAmount === amt && !isAmountFocused && amountInputText === ''
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}

                  {/* KOTAK INPUT MANUAL PLAFON */}
                  <div className="relative inline-flex items-center">
                    <input
                      type={isAmountFocused ? 'number' : 'text'}
                      inputMode="numeric"
                      min={500000}
                      max={maxLoanPlafond}
                      step={500000}
                      placeholder="Input manual"
                      value={isAmountFocused ? amountInputText : (amountInputText || (amountInputText === '' && ![2000000, 5000000, 10000000, 20000000, 30000000, 50000000].includes(simAmount) ? formatRupiah(simAmount) : ''))}
                      onFocus={handleAmountFocus}
                      onChange={handleAmountChange}
                      onBlur={handleAmountBlur}
                      className={`h-7 px-3 text-[11px] font-bold rounded-lg border transition-all focus:outline-none ${
                        isAmountFocused || (amountInputText !== '' && ![2000000, 5000000, 10000000, 20000000, 30000000, 50000000].includes(simAmount))
                          ? 'border-emerald-500 bg-white text-emerald-900 ring-2 ring-emerald-500/20 w-36 shadow-xs'
                          : 'border-emerald-400 bg-emerald-50/80 text-emerald-800 placeholder:text-emerald-700/80 hover:border-emerald-500 w-28'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Tenor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Jangka Waktu (Tenor)</label>
                    <p className="text-[10.5px] text-slate-400">Maksimal: <span className="font-semibold text-slate-700">24 Bulan</span></p>
                  </div>
                  <span className="text-sm font-black text-slate-900">{simTenor} Bulan</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[6, 12, 18, 24].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        setSimTenor(t);
                        setTenorInputText('');
                        setIsTenorFocused(false);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        simTenor === t && !isTenorFocused && tenorInputText === ''
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-sm">{t}</span>
                      <span className="text-[10px] text-slate-400">Bulan</span>
                    </button>
                  ))}

                  {/* KOTAK INPUT MANUAL TENOR (MAKSIMAL 24) */}
                  <div
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col justify-center items-center cursor-pointer ${
                      isTenorFocused || (tenorInputText !== '' && ![6, 12, 18, 24].includes(simTenor))
                        ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-emerald-400 bg-emerald-50/80 hover:border-emerald-500'
                    }`}
                  >
                    <input
                      type={isTenorFocused ? 'number' : 'text'}
                      inputMode="numeric"
                      min={1}
                      max={24}
                      placeholder="Input manual"
                      value={isTenorFocused ? tenorInputText : (tenorInputText || (tenorInputText === '' && ![6, 12, 18, 24].includes(simTenor) ? `${simTenor} Bulan` : ''))}
                      onFocus={handleTenorFocus}
                      onChange={handleTenorChange}
                      onBlur={handleTenorBlur}
                      className="w-full text-center text-sm font-bold bg-transparent text-emerald-950 placeholder:text-emerald-700/80 placeholder:text-xs placeholder:font-semibold focus:outline-none"
                    />
                    <span className="text-[10px] text-emerald-700 font-medium">Bulan (Maks. 24)</span>
                  </div>
                </div>
              </div>

              {/* Sumber Pembayaran */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Sumber Pemotongan Angsuran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gaji', label: 'Gaji Pokok', sub: formatRupiah(Number(memberData?.gaji) || 0) },
                    { id: 'tpp', label: 'TPP', sub: formatRupiah(Number(memberData?.tpp) || 0) },
                    { id: 'gaji_tpp', label: 'Gaji + TPP', sub: formatRupiah(Number(memberData?.total_pendapatan) || 0) },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSimSource(s.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        simSource === s.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs">{s.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{s.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan Keperluan */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan / Keperluan Pinjaman (Opsional)
                </label>
                <textarea
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  placeholder="Contoh: Keperluan pendidikan anak / renovasi rumah..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Alert message if any */}
              {submitMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    submitMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{submitMessage.text}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmittingApp || !eligibility?.eligible}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] ${
                  eligibility?.eligible
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                {isSubmittingApp ? 'Mengirim Pengajuan...' : 'Ajukan Pinjaman Sekarang'}
              </button>
            </form>
          </div>

          {/* Real-time Calculation & Eligibility Card (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
                Rincian Kalkulasi
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Pokok Pinjaman:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(simCalc.pokokPinjaman)}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Angsuran Pokok / Bln:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(simCalc.angsuranPokok)}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">
                    Jasa Koperasi ({(defaultServiceRate * 100).toFixed(1)}%/th):
                  </span>
                  <span className="font-bold text-slate-800">{formatRupiah(simCalc.angsuranJasa)} /bln</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Total Bunga / Jasa:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(simCalc.totalJasa)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="font-extrabold text-slate-900">Total Angsuran/Bulan:</span>
                  <span className="font-black text-blue-600 text-base">
                    {formatRupiah(simCalc.angsuranPerBulan)}
                  </span>
                </div>
              </div>
            </div>

            {/* Eligibility Assessment Card */}
            <div
              className={`rounded-2xl border p-5 transition-all ${
                eligibility?.eligible
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-red-50/70 border-red-200 text-red-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {eligibility?.eligible ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <h4 className="text-xs font-black tracking-tight">
                  {eligibility?.eligible
                    ? 'MEMENUHI SYARAT KEMAMPUAN'
                    : 'MELEBIHI BATAS KEMAMPUAN'}
                </h4>
              </div>

              <p className="text-[11px] leading-relaxed mb-3">
                {eligibility?.reason}
              </p>

              <div className="space-y-2 text-[11px] bg-white/70 p-3 rounded-xl border border-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Pendapatan Dasar:</span>
                  <span className="font-bold">{formatRupiah(pendapatanDasar)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Batas Cicilan ({(maxRatio * 100).toFixed(0)}%):</span>
                  <span className="font-bold">
                    {formatRupiah(pendapatanDasar * maxRatio)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cicilan Aktif Lainnya:</span>
                  <span className="font-bold">{formatRupiah(currentActiveInstallments)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-600">Sisa Ruang Cicilan:</span>
                  <span
                    className={
                      (eligibility?.ruang_cicilan || 0) >= simCalc.angsuranPerBulan
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }
                  >
                    {formatRupiah(eligibility?.ruang_cicilan || 0)}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 mt-2 italic">
                *Batas kemampuan pembayaran dihitung sesuai kebijakan koperasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RIWAYAT PENGAJUAN */}
      {activeTab === 'pengajuan' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Riwayat Pengajuan Pinjaman</h3>
                <p className="text-xs text-slate-500">Status verifikasi dan persetujuan oleh pengurus koperasi</p>
              </div>
              <span className="text-xs text-slate-500">{applications.length} Pengajuan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Tgl Pengajuan</th>
                    <th className="py-3 px-4">Plafon</th>
                    <th className="py-3 px-4">Tenor</th>
                    <th className="py-3 px-4">Est. Angsuran</th>
                    <th className="py-3 px-4">Potongan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada riwayat pengajuan pinjaman.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          {new Date(app.submitted_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatRupiah(app.jumlah_diajukan)}
                        </td>
                        <td className="py-3 px-4">{app.tenor_bulan} Bulan</td>
                        <td className="py-3 px-4 font-semibold text-blue-700">
                          {formatRupiah(app.estimasi_cicilan || 0)}
                        </td>
                        <td className="py-3 px-4 uppercase">{app.sumber_pembayaran}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              app.status === 'disetujui' || app.status === 'dicairkan'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : app.status === 'ditolak'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {app.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {app.alasan_penolakan ? (
                            <span className="text-red-600 font-medium">Ditolak: {app.alasan_penolakan}</span>
                          ) : (
                            app.catatan_pengurus || app.catatan_pengajuan || '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
