'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PollTheme, PollResultItem, AuditLogItem, VoterChoiceDetail } from '@/lib/polling/types';
import { FiChevronLeft, FiDownload, FiEye, FiShield, FiAlertTriangle, FiCheckCircle, FiActivity, FiUsers, FiLock, FiX } from 'react-icons/fi';

export default function AdminPollDetailPage() {
  const params = useParams();
  const pollId = params.id as string;

  const [activeTab, setActiveTab] = useState<'results' | 'voters' | 'audit'>('results');
  const [poll, setPoll] = useState<PollTheme | null>(null);
  const [results, setResults] = useState<PollResultItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [voters, setVoters] = useState<VoterChoiceDetail[]>([]);
  const [isIdentitiesRevealed, setIsIdentitiesRevealed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [unmaskReason, setUnmaskReason] = useState('Audit berkala integritas data');
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchDetails = async () => {
    setLoading(true);
    // 1. Fetch Poll Theme
    const { data: pollData } = await supabase.from('polls').select('*').eq('id', pollId).single();
    if (pollData) setPoll(pollData);

    // 2. Fetch Results
    const res = await fetch(`/api/polling/results/${pollId}`);
    const data = await res.json();
    if (data.results) {
      setResults(data.results);
      setTotalVotes(data.total_votes || 0);
    }

    // 3. Fetch Audit Logs
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (logs) setAuditLogs(logs);
    setLoading(false);
  };

  useEffect(() => {
    if (pollId) {
      fetchDetails();
    }
  }, [pollId]);

  const handleRevealIdentities = async () => {
    try {
      const res = await fetch('/api/admin/polling/voters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, reason: unmaskReason })
      });
      const data = await res.json();
      if (res.ok && data.voters) {
        setVoters(data.voters);
        setIsIdentitiesRevealed(true);
        setShowConfirmModal(false);
        // Refresh audit logs
        fetchDetails();
      } else {
        alert(data.error || 'Gagal membuka identitas pemilih.');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  if (!poll && !loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Polling tidak ditemukan.</p>
        <Link href="/admin/polling" className="text-emerald-600 font-bold mt-2 inline-block">← Kembali</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/admin/polling"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <FiChevronLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Polling</span>
          </Link>

          <span className="text-xs text-emerald-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Akses Administrator Resmi
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header Polling Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl border border-emerald-200">
              {poll?.icon || '🏆'}
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Detail Tata Kelola Polling
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                {poll?.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span>Total Suara: <strong className="text-gray-800">{totalVotes}</strong></span>
                <span>•</span>
                <span className={`font-semibold ${poll?.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                  Status: {poll?.is_active ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`/api/admin/polling/export?pollId=${pollId}`}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiDownload className="w-4 h-4" />
              <span>Ekspor Data (CSV) →</span>
            </a>
          </div>
        </div>

        {/* 3 Tabs Navigation */}
        <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'results'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FiUsers className="w-4 h-4" />
            <span>Hasil (Agregat)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voters')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'voters'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FiShield className="w-4 h-4" />
            <span>Pilihan User (Audit Identitas)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FiActivity className="w-4 h-4" />
            <span>Log Aktivitas</span>
          </button>
        </div>

        {/* Tab 1: Hasil Agregat */}
        {activeTab === 'results' && (
          <div className="bg-white border border-gray-200 rounded-b-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-gray-700 divide-y divide-gray-200">
              <thead className="bg-gray-50/80 text-gray-900 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Pegawai</th>
                  <th className="py-3 px-4">Jabatan & Unit</th>
                  <th className="py-3 px-4 text-center">Jumlah Suara</th>
                  <th className="py-3 px-4 text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Belum ada suara pada tema ini.
                    </td>
                  </tr>
                ) : (
                  results.map((r, idx) => (
                    <tr key={r.employee_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{r.full_name}</td>
                      <td className="py-3 px-4 text-gray-500">{r.position || r.unit || 'DKPP'}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700 text-sm">{r.total_votes}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-gray-900">{r.percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-xs text-gray-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right">Total Seluruh Suara:</td>
                  <td className="py-3 px-4 text-center text-emerald-800">{totalVotes}</td>
                  <td className="py-3 px-4 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 2: Pilihan User (Audit Identitas Pemilih) */}
        {activeTab === 'voters' && (
          <div className="bg-white border border-gray-200 rounded-b-2xl p-5 shadow-xs space-y-4">
            {!isIdentitiesRevealed ? (
              <div className="p-8 text-center max-w-lg mx-auto space-y-3">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-xl">
                  <FiLock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Data Identitas Pemilih Tersamar (Privasi Terjaga)</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Secara default demi menjaga privasi dan kenyamanan pegawai, rincian siapa memilih siapa disamarkan. Pembukaan identitas hanya diperbolehkan untuk audit integritas dan akan dicatat di Audit Log secara permanen.
                </p>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <FiEye className="w-4 h-4" />
                  <span>Tampilkan Identitas Pemilih (Catat di Audit Log)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
                  <span className="font-medium">🔓 Identitas pemilih terbuka untuk audit. Akses ini telah dicatat di Audit Logs.</span>
                  <button
                    type="button"
                    onClick={() => setIsIdentitiesRevealed(false)}
                    className="text-xs text-emerald-700 underline font-semibold cursor-pointer"
                  >
                    Kunci Kembali
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-700 divide-y divide-gray-200">
                    <thead className="bg-gray-50/80 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">User ID Pemilih</th>
                        <th className="py-3 px-4">Daftar Pegawai yang Dipilih</th>
                        <th className="py-3 px-4">Waktu Vote</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {voters.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-[11px] text-gray-800">
                            <code>{v.user_id}</code>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {v.choices.map((c: any, ci: number) => (
                                <span key={ci} className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                                  {c.full_name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {new Date(v.voted_at).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Log Aktivitas Audit */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-gray-200 rounded-b-2xl shadow-xs overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 flex items-center justify-between">
              <span>Menampilkan rekaman aktivitas terkini pada tema polling ini. Retensi penyimpanan: 12 Bulan.</span>
            </div>
            <table className="w-full text-left text-xs text-gray-700 divide-y divide-gray-200">
              <thead className="bg-gray-50/80 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Actor User ID</th>
                  <th className="py-3 px-4">Detail Payload</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Belum ada audit log tercatat.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 whitespace-nowrap text-gray-500">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-gray-900">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          log.action === 'ADMIN_VIEW_VOTER_IDENTITY' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-gray-600">
                        {log.actor_user_id ? log.actor_user_id.slice(0, 8) + '...' : 'System'}
                      </td>
                      <td className="py-2.5 px-4 max-w-xs truncate text-gray-600 font-mono text-[11px]">
                        {JSON.stringify(log.payload)}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Konfirmasi Buka Identitas */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 text-amber-700">
                  <FiAlertTriangle className="w-6 h-6 shrink-0" />
                  <h3 className="font-bold text-base text-gray-900">Konfirmasi Akses Identitas Pemilih</h3>
                </div>
                <button type="button" onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Tindakan ini akan <strong>membuka identitas lengkap pemilih</strong> dan <strong>tercatat secara permanen di Audit Log</strong> demi transparansi dan akuntabilitas.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan Akses Audit:</label>
                <input
                  type="text"
                  value={unmaskReason}
                  onChange={(e) => setUnmaskReason(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  placeholder="contoh: Verifikasi integritas data"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleRevealIdentities}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Saya Mengerti, Buka Data
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
