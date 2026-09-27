'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  Wallet,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Eye,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { formatRupiah } from '@/lib/koperasi/calculations';

interface OfficerDashboardProps {
  officerData: any;
  dashboardKPI: any;
  pendingApplications: any[];
  loansMacet: any[];
  currentUser: any;
  onRefresh: () => void;
}

export function KoperasiOfficerDashboard({
  officerData,
  dashboardKPI,
  pendingApplications = [],
  loansMacet = [],
  currentUser,
  onRefresh,
}: OfficerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pengajuan' | 'kredit' | 'anggota' | 'laporan'>('pengajuan');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalApp, setRejectModalApp] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [officerNote, setOfficerNote] = useState<string>('');

  // Anggota list state
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Loan monitoring state
  const [allLoans, setAllLoans] = useState<any[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loanStatusFilter, setLoanStatusFilter] = useState('');

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(
        `/api/koperasi/members?all=true&search=${encodeURIComponent(memberSearch)}&userEmail=${encodeURIComponent(
          currentUser.email || ''
        )}&userId=${encodeURIComponent(currentUser.id || '')}&userNip=${encodeURIComponent(currentUser.nip || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchLoans = async (status = '') => {
    setLoadingLoans(true);
    try {
      const res = await fetch(
        `/api/koperasi/loans?all=true&status=${status}&userEmail=${encodeURIComponent(
          currentUser.email || ''
        )}&userId=${encodeURIComponent(currentUser.id || '')}&userNip=${encodeURIComponent(currentUser.nip || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        setAllLoans(data.loans || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLoans(false);
    }
  };

  // Approval handler
  const handleApprove = async (appId: string) => {
    if (!confirm('Apakah Anda yakin menyetujui pengajuan pinjaman ini? Jadwal cicilan akan otomatis dibuat.')) {
      return;
    }

    setProcessingId(appId);
    try {
      const res = await fetch('/api/koperasi/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          application_id: appId,
          action: 'disetujui',
          catatan_pengurus: officerNote,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal menyetujui pengajuan.');
        return;
      }

      alert('Pengajuan pinjaman berhasil disetujui! Menunggu proses pencairan oleh Bendahara.');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan.');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject handler
  const handleReject = async () => {
    if (!rejectModalApp || !rejectReason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    setProcessingId(rejectModalApp.id);
    try {
      const res = await fetch('/api/koperasi/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          application_id: rejectModalApp.id,
          action: 'ditolak',
          alasan_penolakan: rejectReason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal menolak pengajuan.');
        return;
      }

      alert('Pengajuan pinjaman telah ditolak.');
      setRejectModalApp(null);
      setRejectReason('');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan.');
    } finally {
      setProcessingId(null);
    }
  };

  // Export helper
  const handleExport = (type: string) => {
    const url = `/api/koperasi/export?type=${type}&userEmail=${encodeURIComponent(
      currentUser.email || ''
    )}&userId=${encodeURIComponent(currentUser.id || '')}&userNip=${encodeURIComponent(currentUser.nip || '')}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Officer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              {officerData?.role || 'Pengurus'}
            </span>
            <span className="text-xs text-slate-500">Koperasi Pegawai DKPP Kota Cilegon</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 mt-1">Dashboard Pengurus Koperasi</h2>
          <p className="text-xs text-slate-500">
            Monitoring keuangan, verifikasi pinjaman, dan pengawasan operasional koperasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('laporan');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Floating Fund */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Floating Fund (Kas)</span>
          <p className="text-base font-black text-emerald-600 mt-1">
            {formatRupiah(dashboardKPI?.floating_fund || 0)}
          </p>
        </div>

        {/* Total Simpanan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Simpanan</span>
          <p className="text-base font-black text-blue-600 mt-1">
            {formatRupiah(dashboardKPI?.total_simpanan || 0)}
          </p>
        </div>

        {/* Pinjaman Aktif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Pinjaman Beredar</span>
          <p className="text-base font-black text-slate-900 mt-1">
            {formatRupiah(dashboardKPI?.total_pinjaman_aktif || 0)}
          </p>
        </div>

        {/* Kredit Macet */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Kredit Macet (NPL)</span>
          <p className="text-base font-black text-red-600 mt-1">
            {formatRupiah(dashboardKPI?.kredit_macet || 0)}
          </p>
        </div>

        {/* Pengajuan Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Menunggu Review</span>
          <p className="text-base font-black text-amber-600 mt-1">
            {dashboardKPI?.pengajuan_pending || pendingApplications.length} Berkas
          </p>
        </div>

        {/* Anggota Aktif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Anggota Aktif</span>
          <p className="text-base font-black text-slate-900 mt-1">
            {dashboardKPI?.anggota_aktif || 0} Orang
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        {[
          { id: 'pengajuan', label: `Persetujuan Pinjaman (${pendingApplications.length})`, icon: Clock },
          { id: 'kredit', label: 'Monitoring Kredit', icon: CreditCard },
          { id: 'anggota', label: 'Database Anggota', icon: Users },
          { id: 'laporan', label: 'Laporan & Ekspor Data', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'anggota') fetchMembers();
                if (tab.id === 'kredit') fetchLoans();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PERSETUJUAN PINJAMAN */}
      {activeTab === 'pengajuan' && (
        <div className="space-y-4 animate-in fade-in">
          {pendingApplications.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">Semua pengajuan telah diproses!</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Tidak ada pengajuan pinjaman baru yang menunggu persetujuan saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((app) => {
                const m = app.member;
                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{m?.nama || 'Anggota'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            NIP: {m?.nip}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {m?.jabatan || 'Pegawai'} &bull; {m?.bidang || 'DKPP'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Diajukan:</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {new Date(app.submitted_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Financial details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Plafon Diajukan:</span>
                        <span className="font-black text-blue-700 text-sm">{formatRupiah(app.jumlah_diajukan)}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Tenor & Bunga:</span>
                        <span className="font-bold text-slate-800">
                          {app.tenor_bulan} Bln ({(app.jasa_rate * 100).toFixed(1)}%/th)
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Est. Angsuran/Bln:</span>
                        <span className="font-bold text-slate-800">{formatRupiah(app.estimasi_cicilan || 0)}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Sumber Potongan:</span>
                        <span className="font-bold text-slate-800 uppercase">{app.sumber_pembayaran}</span>
                      </div>
                    </div>

                    {/* Verification & Capacity check */}
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs mb-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Pendapatan:</span>
                          <p className="font-semibold text-slate-800">{formatRupiah(app.pendapatan_dasar || 0)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Batas Cicilan:</span>
                          <p className="font-semibold text-slate-800">{formatRupiah(app.batas_cicilan || 0)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Cicilan Aktif:</span>
                          <p className="font-semibold text-slate-800">{formatRupiah(app.cicilan_aktif || 0)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Sisa Ruang:</span>
                          <p className="font-semibold text-emerald-700">{formatRupiah(app.ruang_cicilan || 0)}</p>
                        </div>
                      </div>
                      {app.catatan_pengajuan && (
                        <p className="mt-2 text-[11px] text-slate-600 italic">
                          Catatan anggota: "{app.catatan_pengajuan}"
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setRejectModalApp(app)}
                        disabled={processingId === app.id}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        Tolak Pengajuan
                      </button>
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={processingId === app.id}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {processingId === app.id ? 'Memproses...' : 'Setujui Pinjaman'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Penolakan */}
          {rejectModalApp && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95">
                <h4 className="text-sm font-bold text-slate-900 mb-1">Tolak Pengajuan Pinjaman</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Pemohon: {rejectModalApp.member?.nama} ({formatRupiah(rejectModalApp.jumlah_diajukan)})
                </p>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Alasan Penolakan (Wajib disampaikan ke anggota):
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Estimasi cicilan melebihi batas kemampuan pembayaran atau masa kerja belum mencukupi..."
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setRejectModalApp(null);
                      setRejectReason('');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processingId === rejectModalApp.id}
                    className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                  >
                    Konfirmasi Penolakan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MONITORING KREDIT */}
      {activeTab === 'kredit' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {['', 'aktif', 'disetujui', 'macet', 'lunas'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setLoanStatusFilter(st);
                    fetchLoans(st);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    loanStatusFilter === st
                      ? 'bg-[#0B1E41] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st === '' ? 'Semua' : st.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchLoans(loanStatusFilter)}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Segarkan Data
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">No. Pinjaman</th>
                    <th className="py-3 px-4">Peminjam</th>
                    <th className="py-3 px-4">Plafon</th>
                    <th className="py-3 px-4">Tenor</th>
                    <th className="py-3 px-4">Angsuran/Bln</th>
                    <th className="py-3 px-4">Sumber</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingLoans ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Memuat data pinjaman...
                      </td>
                    </tr>
                  ) : allLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada pinjaman dengan status terpilih.
                      </td>
                    </tr>
                  ) : (
                    allLoans.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{l.nomor_pinjaman}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{l.member?.nama}</span>
                          <p className="text-[10px] text-slate-400">NIP: {l.member?.nip}</p>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{formatRupiah(l.jumlah_pinjaman)}</td>
                        <td className="py-3 px-4">{l.tenor_bulan} Bln</td>
                        <td className="py-3 px-4 font-semibold text-blue-700">
                          {formatRupiah(l.angsuran_per_bulan)}
                        </td>
                        <td className="py-3 px-4 uppercase">{l.sumber_pembayaran}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.status === 'lunas'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : l.status === 'macet'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {l.status?.toUpperCase()}
                          </span>
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

      {/* TAB 3: ANGGOTA */}
      {activeTab === 'anggota' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
                placeholder="Cari nama, NIP, atau bidang pegawai..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              onClick={fetchMembers}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Cari
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">NIP</th>
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Jabatan & Bidang</th>
                    <th className="py-3 px-4">Gaji</th>
                    <th className="py-3 px-4">TPP</th>
                    <th className="py-3 px-4">Total Pendapatan</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingMembers ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Memuat data anggota...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data anggota.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono">{m.nip}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.nama}</td>
                        <td className="py-3 px-4">
                          <span>{m.jabatan || '-'}</span>
                          <p className="text-[10px] text-slate-400">{m.bidang || '-'}</p>
                        </td>
                        <td className="py-3 px-4">{formatRupiah(m.gaji)}</td>
                        <td className="py-3 px-4">{formatRupiah(m.tpp)}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{formatRupiah(m.total_pendapatan)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.status_keanggotaan?.toUpperCase()}
                          </span>
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

      {/* TAB 4: LAPORAN & EKSPOR */}
      {activeTab === 'laporan' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Rekapitulasi Simpanan</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Ekspor seluruh mutasi simpanan pokok, wajib, dan sukarela anggota.
                </p>
              </div>
              <button
                onClick={() => handleExport('savings')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Download .XLSX
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Rekapitulasi Pinjaman</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Ekspor daftar portofolio pinjaman, angsuran bulanan, dan status kredit.
                </p>
              </div>
              <button
                onClick={() => handleExport('loans')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Download .XLSX
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <FileSpreadsheet className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Buku Kas & Transaksi</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Jurnal penerimaan kas dan pengeluaran operasional koperasi tahun berjalan.
                </p>
              </div>
              <button
                onClick={() => handleExport('transactions')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Download .XLSX
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <FileSpreadsheet className="w-8 h-8 text-slate-700 mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Data Master Anggota</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Database seluruh anggota koperasi, NIP, golongan, dan pendapatan.
                </p>
              </div>
              <button
                onClick={() => handleExport('members')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Download .XLSX
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
