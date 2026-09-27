'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  UserPlus,
  UploadCloud,
  Settings,
  ShieldCheck,
  CheckCircle,
  Clock,
  Search,
  DollarSign,
  FileSpreadsheet,
  AlertCircle,
  Save,
  Check,
  Download,
} from 'lucide-react';
import { formatRupiah } from '@/lib/koperasi/calculations';

interface BendaharaDashboardProps {
  currentUser: any;
  settings: any[];
  onRefresh: () => void;
}

export function KoperasiBendaharaDashboard({
  currentUser,
  settings: initialSettings = [],
  onRefresh,
}: BendaharaDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'pencairan' | 'angsuran' | 'simpanan' | 'kas' | 'anggota' | 'import' | 'pengaturan'
  >('pencairan');

  // Disbursement state
  const [disbursableApps, setDisbursableApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [disbursingId, setDisbursingId] = useState<string | null>(null);

  // Installment state
  const [pendingInstallments, setPendingInstallments] = useState<any[]>([]);
  const [loadingInst, setLoadingInst] = useState(false);
  const [instSearch, setInstSearch] = useState('');
  const [payingInstId, setPayingInstId] = useState<string | null>(null);

  // Savings form state
  const [membersList, setMembersList] = useState<any[]>([]);
  const [savingForm, setSavingForm] = useState({
    member_id: '',
    jenis_simpanan: 'wajib',
    nominal: 50000,
    keterangan: '',
  });
  const [savingSubmitting, setSavingSubmitting] = useState(false);

  // New member form state
  const [newMemberForm, setNewMemberForm] = useState({
    nip: '',
    nama: '',
    jabatan: '',
    bidang: '',
    golongan: 'III/a',
    status_pegawai: 'PNS',
    gaji: 4000000,
    tpp: 3500000,
  });
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  // Manual cash transaction state
  const [txForm, setTxForm] = useState({
    jenis: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    kategori: 'Pendapatan Lain-lain',
    nominal: 0,
    sumber: 'Kas Koperasi',
    keterangan: '',
  });
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Policy Settings state
  const [policySettings, setPolicySettings] = useState<Record<string, any>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Import state
  const [importType, setImportType] = useState<'members' | 'savings' | 'loans'>('loans');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);

  // Load initial settings into local state
  useEffect(() => {
    const sMap: Record<string, any> = {};
    initialSettings.forEach((s) => {
      sMap[s.key] = s.value;
    });
    setPolicySettings(sMap);
  }, [initialSettings]);

  // Fetch approved applications ready for disbursement
  const fetchDisbursable = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch(
        `/api/koperasi/applications?all=true&status=disetujui&userEmail=${encodeURIComponent(
          currentUser.email || ''
        )}&userId=${encodeURIComponent(currentUser.id || '')}&userNip=${encodeURIComponent(currentUser.nip || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        setDisbursableApps(data.applications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApps(false);
    }
  };

  // Fetch installments for recording
  const fetchInstallments = async () => {
    setLoadingInst(true);
    try {
      const res = await fetch(
        `/api/koperasi/installments?all=true&status=jatuh_tempo&userEmail=${encodeURIComponent(
          currentUser.email || ''
        )}&userId=${encodeURIComponent(currentUser.id || '')}&userNip=${encodeURIComponent(currentUser.nip || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        setPendingInstallments(data.installments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInst(false);
    }
  };

  // Fetch members for dropdown
  const fetchAllMembers = async () => {
    try {
      const res = await fetch(
        `/api/koperasi/members?all=true&userEmail=${encodeURIComponent(
          currentUser.email || ''
        )}&userId=${encodeURIComponent(currentUser.id || '')}&userNip=${encodeURIComponent(currentUser.nip || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        setMembersList(data.members || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDisbursable();
    fetchAllMembers();
  }, []);

  // Handle Disburse Loan
  const handleDisburseLoan = async (app: any) => {
    if (
      !confirm(
        `Konfirmasi pencairan pinjaman sebesar ${formatRupiah(
          app.jumlah_diajukan
        )} untuk ${app.member?.nama}? Transaksi pengeluaran kas akan otomatis dicatat.`
      )
    ) {
      return;
    }

    setDisbursingId(app.id);
    try {
      const res = await fetch('/api/koperasi/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          application_id: app.id,
          action: 'dicairkan',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal mencairkan pinjaman.');
        return;
      }

      alert('Pinjaman berhasil dicairkan! Kas koperasi telah didebet dan status pinjaman aktif.');
      fetchDisbursable();
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan.');
    } finally {
      setDisbursingId(null);
    }
  };

  // Handle Record Installment Payment
  const handleRecordInstallment = async (inst: any) => {
    const amount = Number(inst.total_amount) || Number(inst.principal_amount) + Number(inst.service_fee_amount);
    if (!confirm(`Catat pembayaran cicilan ke-${inst.installment_number} sebesar ${formatRupiah(amount)} untuk ${inst.member?.nama}?`)) {
      return;
    }

    setPayingInstId(inst.id);
    try {
      const res = await fetch('/api/koperasi/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          installment_id: inst.id,
          paid_amount: amount,
          payment_source: inst.payment_source || 'gaji',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mencatat pembayaran.');
        return;
      }

      alert(json.message || 'Pembayaran cicilan berhasil dicatat.');
      fetchInstallments();
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan.');
    } finally {
      setPayingInstId(null);
    }
  };

  // Handle Record Saving
  const handleRecordSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingForm.member_id || !savingForm.nominal) {
      alert('Pilih anggota dan masukkan nominal simpanan.');
      return;
    }

    setSavingSubmitting(true);
    try {
      const res = await fetch('/api/koperasi/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          ...savingForm,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mencatat simpanan.');
        return;
      }

      alert('Setoran simpanan berhasil dicatat ke sistem dan buku kas!');
      setSavingForm({ member_id: '', jenis_simpanan: 'wajib', nominal: 50000, keterangan: '' });
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan.');
    } finally {
      setSavingSubmitting(false);
    }
  };

  // Handle Register Member
  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.nip || !newMemberForm.nama) {
      alert('NIP dan Nama Pegawai wajib diisi.');
      return;
    }

    setMemberSubmitting(true);
    try {
      const res = await fetch('/api/koperasi/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          ...newMemberForm,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mendaftarkan anggota.');
        return;
      }

      alert(`Anggota baru ${newMemberForm.nama} (${newMemberForm.nip}) berhasil didaftarkan!`);
      setNewMemberForm({
        nip: '',
        nama: '',
        jabatan: '',
        bidang: '',
        golongan: 'III/a',
        status_pegawai: 'PNS',
        gaji: 4000000,
        tpp: 3500000,
      });
      fetchAllMembers();
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan.');
    } finally {
      setMemberSubmitting(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/koperasi/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          settings: policySettings,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        alert(json.error || 'Gagal memperbarui pengaturan.');
        return;
      }

      alert('Pengaturan parameter kebijakan koperasi berhasil disimpan!');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle File Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    // Read base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImporting(true);
      try {
        const res = await fetch('/api/koperasi/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: currentUser.email,
            userId: currentUser.id,
            userNip: currentUser.nip,
            type: importType,
            fileBase64: base64,
            mode: 'preview',
          }),
        });

        const json = await res.json();
        if (res.ok) {
          setImportPreview({ ...json, base64 });
        } else {
          alert(json.error || 'Gagal membaca berkas.');
        }
      } catch (err: any) {
        alert(err.message || 'Terjadi kesalahan preview.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExecuteImport = async () => {
    if (!importPreview?.base64) return;
    setImporting(true);
    try {
      const res = await fetch('/api/koperasi/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          type: importType,
          fileBase64: importPreview.base64,
          mode: 'commit',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengimpor data.');
        return;
      }

      alert(json.message || 'Data berhasil diimpor!');
      setImportPreview(null);
      setImportFile(null);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bendahara */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase">
              Otoritas Bendahara
            </span>
            <span className="text-xs text-amber-200">Koperasi Pegawai DKPP Kota Cilegon</span>
          </div>
          <h2 className="text-lg font-black mt-1">Panel Keuangan & Kas Bendahara</h2>
          <p className="text-xs text-amber-100/80">
            Pencairan pinjaman, pencatatan angsuran, mutasi simpanan, dan pengaturan kebijakan.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'pencairan', label: `Pencairan Pinjaman (${disbursableApps.length})`, icon: Coins },
          { id: 'angsuran', label: 'Catat Angsuran', icon: ArrowDownRight },
          { id: 'simpanan', label: 'Setor Simpanan', icon: Wallet },
          { id: 'kas', label: 'Buku Kas', icon: DollarSign },
          { id: 'anggota', label: 'Registrasi Anggota', icon: UserPlus },
          { id: 'import', label: 'Import Excel', icon: UploadCloud },
          { id: 'pengaturan', label: 'Pengaturan Koperasi', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'pencairan') fetchDisbursable();
                if (tab.id === 'angsuran') fetchInstallments();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PENCAIRAN PINJAMAN */}
      {activeTab === 'pencairan' && (
        <div className="space-y-4 animate-in fade-in">
          {disbursableApps.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">Tidak ada pinjaman menunggu pencairan</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Semua pinjaman yang disetujui telah dicairkan ke rekening anggota.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {disbursableApps.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{app.member?.nama}</span>
                      <span className="text-[10px] text-slate-500">NIP: {app.member?.nip}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {app.member?.jabatan} &bull; Tenor: {app.tenor_bulan} Bulan &bull; Sumber: {app.sumber_pembayaran?.toUpperCase()}
                    </p>
                    <div className="mt-2 text-xs">
                      <span className="text-slate-400">Plafon Pinjaman: </span>
                      <span className="font-extrabold text-blue-700 text-sm">
                        {formatRupiah(app.jumlah_diajukan)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDisburseLoan(app)}
                    disabled={disbursingId === app.id}
                    className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <Coins className="w-4 h-4" />
                    {disbursingId === app.id ? 'Memproses...' : 'Cairkan Pinjaman'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATAT ANGSURAN */}
      {activeTab === 'angsuran' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tagihan Cicilan Jatuh Tempo</h3>
                <p className="text-xs text-slate-500">
                  Pencatatan pembayaran angsuran melalui potong gaji atau setoran langsung
                </p>
              </div>
              <button
                onClick={fetchInstallments}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Segarkan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Peminjam</th>
                    <th className="py-3 px-4">Pinjaman</th>
                    <th className="py-3 px-4">Cicilan Ke-</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingInst ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Memuat data cicilan...
                      </td>
                    </tr>
                  ) : pendingInstallments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada tagihan cicilan jatuh tempo saat ini.
                      </td>
                    </tr>
                  ) : (
                    pendingInstallments.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{inst.member?.nama}</span>
                          <p className="text-[10px] text-slate-400">NIP: {inst.member?.nip}</p>
                        </td>
                        <td className="py-3 px-4 font-mono">{inst.loan?.nomor_pinjaman}</td>
                        <td className="py-3 px-4 font-semibold">Ke-{inst.installment_number}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {new Date(inst.due_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatRupiah(inst.total_amount)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleRecordInstallment(inst)}
                            disabled={payingInstId === inst.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            {payingInstId === inst.id ? 'Mencatat...' : 'Bayar / Lunas'}
                          </button>
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

      {/* TAB 3: SETOR SIMPANAN */}
      {activeTab === 'simpanan' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Catat Setoran Simpanan Anggota</h3>
          <p className="text-xs text-slate-500 mb-5">
            Pencatatan setoran simpanan wajib, sukarela, atau pokok langsung ke rekening anggota.
          </p>

          <form onSubmit={handleRecordSaving} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pilih Anggota Koperasi:</label>
              <select
                value={savingForm.member_id}
                onChange={(e) => setSavingForm({ ...savingForm, member_id: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              >
                <option value="">-- Pilih Anggota --</option>
                {membersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} - NIP: {m.nip} ({m.bidang || 'DKPP'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Simpanan:</label>
                <select
                  value={savingForm.jenis_simpanan}
                  onChange={(e) => setSavingForm({ ...savingForm, jenis_simpanan: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="wajib">Simpanan Wajib</option>
                  <option value="sukarela">Simpanan Sukarela</option>
                  <option value="pokok">Simpanan Pokok</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  value={savingForm.nominal}
                  onChange={(e) => setSavingForm({ ...savingForm, nominal: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Keterangan (Opsional):</label>
              <input
                type="text"
                value={savingForm.keterangan}
                onChange={(e) => setSavingForm({ ...savingForm, keterangan: e.target.value })}
                placeholder="Contoh: Potongan Gaji Bulan Berjalan"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingSubmitting}
              className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              {savingSubmitting ? 'Menyimpan...' : 'Catat Setoran Simpanan'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: BUKU KAS */}
      {activeTab === 'kas' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Input Transaksi Kas Operasional</h3>
          <p className="text-xs text-slate-500 mb-5">
            Pencatatan kas masuk / keluar di luar transaksi reguler pinjaman & simpanan.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setTxSubmitting(true);
              try {
                const res = await fetch('/api/koperasi/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userEmail: currentUser.email,
                    userId: currentUser.id,
                    userNip: currentUser.nip,
                    ...txForm,
                  }),
                });
                if (res.ok) {
                  alert('Transaksi kas berhasil dicatat!');
                  setTxForm({
                    jenis: 'pemasukan',
                    kategori: 'Pendapatan Lain-lain',
                    nominal: 0,
                    sumber: 'Kas Koperasi',
                    keterangan: '',
                  });
                  onRefresh();
                }
              } catch (err: any) {
                alert(err.message || 'Gagal menyimpan transaksi.');
              } finally {
                setTxSubmitting(false);
              }
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Transaksi:</label>
                <select
                  value={txForm.jenis}
                  onChange={(e) => setTxForm({ ...txForm, jenis: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="pemasukan">Pemasukan (+ Kas)</option>
                  <option value="pengeluaran">Pengeluaran (- Kas)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori:</label>
                <input
                  type="text"
                  value={txForm.kategori}
                  onChange={(e) => setTxForm({ ...txForm, kategori: e.target.value })}
                  placeholder="ATK, Jasa Giro, Konsumsi, dll."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  value={txForm.nominal}
                  onChange={(e) => setTxForm({ ...txForm, nominal: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Kas / Rekening:</label>
                <input
                  type="text"
                  value={txForm.sumber}
                  onChange={(e) => setTxForm({ ...txForm, sumber: e.target.value })}
                  placeholder="Kas Tunai, Rekening BJB, dll."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Keterangan:</label>
              <textarea
                value={txForm.keterangan}
                onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                placeholder="Rincian catatan transaksi..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={txSubmitting}
              className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              {txSubmitting ? 'Menyimpan...' : 'Catat Transaksi Buku Kas'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: REGISTRASI ANGGOTA */}
      {activeTab === 'anggota' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Pendaftaran Anggota Koperasi Baru</h3>
          <p className="text-xs text-slate-500 mb-5">
            Daftarkan pegawai DKPP menjadi anggota koperasi dengan batas penghasilan resmi.
          </p>

          <form onSubmit={handleRegisterMember} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP (18 Digit):</label>
                <input
                  type="text"
                  value={newMemberForm.nip}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, nip: e.target.value })}
                  placeholder="198001012005011001"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar:</label>
                <input
                  type="text"
                  value={newMemberForm.nama}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, nama: e.target.value })}
                  placeholder="Ahmad Fauzi, S.Pt"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan:</label>
                <input
                  type="text"
                  value={newMemberForm.jabatan}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, jabatan: e.target.value })}
                  placeholder="Penyuluh Pertanian"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bidang / Subbag:</label>
                <input
                  type="text"
                  value={newMemberForm.bidang}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, bidang: e.target.value })}
                  placeholder="Pertanian / Ketahanan Pangan"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Pegawai:</label>
                <select
                  value={newMemberForm.status_pegawai}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, status_pegawai: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="PNS">PNS</option>
                  <option value="PPPK">PPPK</option>
                  <option value="Honorer">Honorer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok (Rp):</label>
                <input
                  type="number"
                  value={newMemberForm.gaji}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, gaji: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">TPP (Rp):</label>
                <input
                  type="number"
                  value={newMemberForm.tpp}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, tpp: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={memberSubmitting}
              className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              {memberSubmitting ? 'Mendaftarkan...' : 'Daftarkan Anggota Baru'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: IMPORT EXCEL */}
      {activeTab === 'import' && (
        <div className="max-w-3xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-in fade-in space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">Import & Update Massal Berkas Excel (.xlsx)</h3>
              <p className="text-xs text-slate-500">
                Unggah file Excel untuk mendaftarkan anggota, mutasi simpanan, atau mengupdate data pinjaman anggota koperasi.
              </p>
            </div>
            <a
              href={`/api/koperasi/template?type=${importType}`}
              download
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs whitespace-nowrap self-start sm:self-auto hover:shadow-xs active:scale-[0.98]"
              title="Download Template Format Excel (.xlsx)"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span>Download Template XLSX ({importType === 'loans' ? 'Pinjaman' : importType === 'savings' ? 'Simpanan' : 'Anggota'})</span>
            </a>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setImportType('loans');
                setImportPreview(null);
                setImportFile(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                importType === 'loans'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📊 Data Pinjaman Anggota
            </button>
            <button
              onClick={() => {
                setImportType('members');
                setImportPreview(null);
                setImportFile(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                importType === 'members'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              👥 Data Anggota Koperasi
            </button>
            <button
              onClick={() => {
                setImportType('savings');
                setImportPreview(null);
                setImportFile(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                importType === 'savings'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              💰 Setoran Simpanan Wajib/Sukarela
            </button>
          </div>

          {/* Context tip for loans */}
          {importType === 'loans' && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Ketentuan Import Data Pinjaman:
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 ml-1">
                <li>Kolom yang tersedia: <strong>NIP, Nama, Jumlah Pinjaman, Tenor (Bulan), Suku Bunga (% per thn), Sisa Pokok Pinjaman, Tanggal Pencairan, Status</strong>.</li>
                <li>Jika anggota sudah memiliki pinjaman aktif, sistem akan meng-<strong>update</strong> sisa pokok dan tenor pinjamannya.</li>
                <li>Jika belum ada pinjaman aktif, pinjaman baru akan dibuat dan jadwal angsuran dihitung otomatis.</li>
              </ul>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-amber-500 transition-colors">
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Pilih berkas Excel (.xlsx) atau CSV</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Pastikan berkas sesuai dengan format yang telah disediakan pada tombol Download Template di atas.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
            />
          </div>

          {importPreview && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Hasil Pengecekan Berkas:</span>
                <span className="text-emerald-700 font-semibold">
                  Valid: {importPreview.valid_count} &bull; Error: {importPreview.error_count}
                </span>
              </div>

              {importPreview.error_rows?.length > 0 && (
                <div className="p-2 rounded bg-red-50 text-[11px] text-red-700">
                  <p className="font-bold">Baris tidak valid:</p>
                  {importPreview.error_rows.map((e: any, idx: number) => (
                    <p key={idx}>Baris {e.row}: {e.reason}</p>
                  ))}
                </div>
              )}

              <button
                onClick={handleExecuteImport}
                disabled={importing || importPreview.valid_count === 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                {importing ? 'Mengimpor Data...' : `Konfirmasi & Masukkan ${importPreview.valid_count} Baris ke Database`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: PENGATURAN KOPERASI */}
      {activeTab === 'pengaturan' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Parameter Kebijakan Koperasi</h3>
              <p className="text-xs text-slate-500">
                Atur suku jasa pinjaman, rasio kemampuan cicilan, dan batas plafon pinjaman.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rasio Maksimal Cicilan (Batas Kemampuan Pembayaran):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.10"
                max="0.50"
                value={policySettings.max_installment_ratio || '0.30'}
                onChange={(e) =>
                  setPolicySettings({ ...policySettings, max_installment_ratio: e.target.value })
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Contoh: 0.30 berarti maksimal 30% dari pendapatan dasar pegawai.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Suku Jasa Pinjaman Default (per tahun):
                </label>
                <input
                  type="number"
                  step="0.005"
                  value={policySettings.default_service_rate || '0.02'}
                  onChange={(e) =>
                    setPolicySettings({ ...policySettings, default_service_rate: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">0.02 = 2% per tahun (flat)</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maksimal Tenor (Bulan):</label>
                <input
                  type="number"
                  value={policySettings.max_tenor_months || '24'}
                  onChange={(e) =>
                    setPolicySettings({ ...policySettings, max_tenor_months: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plafon Minimal Pinjaman (Rp):</label>
                <input
                  type="number"
                  value={policySettings.min_loan_amount || '1000000'}
                  onChange={(e) =>
                    setPolicySettings({ ...policySettings, min_loan_amount: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plafon Maksimal Pinjaman (Rp):</label>
                <input
                  type="number"
                  value={policySettings.max_loan_amount || '50000000'}
                  onChange={(e) =>
                    setPolicySettings({ ...policySettings, max_loan_amount: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Simpanan Wajib Default (Rp):</label>
              <input
                type="number"
                value={policySettings.simpanan_wajib_default || '50000'}
                onChange={(e) =>
                  setPolicySettings({ ...policySettings, simpanan_wajib_default: e.target.value })
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? 'Menyimpan Pengaturan...' : 'Simpan Perubahan Pengaturan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
