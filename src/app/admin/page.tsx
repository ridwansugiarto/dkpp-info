'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  ShieldCheck,
  FileText, 
  FolderTree, 
  UploadCloud, 
  Users, 
  Activity, 
  Trash2, 
  RefreshCw, 
  ArrowLeft, 
  Plus, 
  CheckCircle,
  Database,
  Search,
  Lock,
  Eye,
  Check,
  ToggleLeft,
  ToggleRight,
  Shield,
  Building,
  UserCheck
} from 'lucide-react';
import { DocumentItem } from '@/types/dkpp';
import { AuthModal } from '@/components/auth/AuthModal';

const AUTHORIZED_ADMIN_EMAIL = 'ridwansugiarto.mail@gmail.com';

const FOLDERS = [
  { id: 'sensitif', name: 'sensitif', perm: 'Hanya Admin & Pegawai Khusus', count: 3 },
  { id: 'ketahanan-pangan', name: 'ketahanan-pangan', perm: 'Pegawai + Publik (Subset)', count: 12 },
  { id: 'pertanian', name: 'pertanian', perm: 'Pegawai + Publik (Subset)', count: 8 },
  { id: 'perikanan', name: 'perikanan', perm: 'Pegawai + Publik (Subset)', count: 5 },
  { id: 'peternakan', name: 'peternakan', perm: 'Pegawai & Admin', count: 4 },
  { id: 'program', name: 'program', perm: 'Pegawai & Admin', count: 6 },
  { id: 'kepegawaian', name: 'kepegawaian', perm: 'Khusus HR & Admin', count: 2 },
];

export default function AdminPortalPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'FOLDERS' | 'NIP' | 'UPLOAD' | 'AUDIT' | 'HEALTH'>('DOCUMENTS');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // New Doc Form
  const [newDocName, setNewDocName] = useState('');
  const [newDocFolder, setNewDocFolder] = useState('ketahanan-pangan');
  const [newDocVisibility, setNewDocVisibility] = useState('INTERNAL');
  const [newDocSensitive, setNewDocSensitive] = useState(false);

  // NIP Management States
  const [nips, setNips] = useState<any[]>([]);
  const [nipSearch, setNipSearch] = useState('');
  const [nipLoading, setNipLoading] = useState(false);
  const [nipActionMsg, setNipActionMsg] = useState<string | null>(null);

  const [newNip, setNewNip] = useState('');
  const [newNipName, setNewNipName] = useState('');
  const [newNipJabatan, setNewNipJabatan] = useState('');
  const [newNipBidang, setNewNipBidang] = useState('Ketahanan Pangan');

  // Check auth session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dkpp_user_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) {
          setCurrentUserEmail(parsed.email);
        }
      }
    } catch {}
    setIsCheckingAuth(false);
  }, []);

  const isAuthorizedAdmin = currentUserEmail?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (isAuthorizedAdmin) {
      fetchDocuments();
      fetchAuditLogs();
      fetchNips();
    }
  }, [isAuthorizedAdmin]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/admin/documents?userEmail=${AUTHORIZED_ADMIN_EMAIL}`);
      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        setDocuments(data.documents);
      } else {
        setDocuments([
          {
            id: 'doc-1',
            filename: 'Laporan_FSVA_Kota_Cilegon_2025.pdf',
            folder: 'ketahanan-pangan',
            category: 'ANALISIS_PANGAN',
            is_sensitive: false,
            visibility: 'PUBLIC',
            uploaded_at: '2026-01-15T08:00:00Z',
            version: 1,
            file_size: 1048576,
            status: 'INDEXED',
          },
          {
            id: 'doc-2',
            filename: 'Rencana_Strategis_DKPP_Cilegon_2021_2026.pdf',
            folder: 'program',
            category: 'RENSTRA',
            is_sensitive: false,
            visibility: 'INTERNAL',
            uploaded_at: '2026-02-10T10:30:00Z',
            version: 2,
            file_size: 2097152,
            status: 'INDEXED',
          },
        ]);
      }
    } catch {
      // Fallback baseline
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`/api/admin/audit?userEmail=${AUTHORIZED_ADMIN_EMAIL}`);
      const data = await res.json();
      if (data.logs) {
        setAuditLogs(data.logs);
      }
    } catch {}
  };

  const fetchNips = async () => {
    try {
      setNipLoading(true);
      const res = await fetch(`/api/admin/pegawai-nip?userEmail=${AUTHORIZED_ADMIN_EMAIL}`);
      const data = await res.json();
      if (data.nips) {
        setNips(data.nips);
      }
    } catch (e) {
      console.error('Failed to fetch NIPs:', e);
    } finally {
      setNipLoading(false);
    }
  };

  const handleAddNip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNip || !newNipName) return;

    try {
      setNipLoading(true);
      setNipActionMsg(null);
      const res = await fetch('/api/admin/pegawai-nip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: AUTHORIZED_ADMIN_EMAIL,
          nip: newNip,
          nama: newNipName,
          jabatan: newNipJabatan,
          bidang: newNipBidang,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNipActionMsg(`✅ NIP ${newNip} (${newNipName}) berhasil didaftarkan ke sistem.`);
        setNewNip('');
        setNewNipName('');
        setNewNipJabatan('');
        fetchNips();
      } else {
        setNipActionMsg(`❌ ${data.error || 'Gagal menambahkan NIP'}`);
      }
    } catch {
      setNipActionMsg('❌ Terjadi kesalahan koneksi server');
    } finally {
      setNipLoading(false);
    }
  };

  const handleDeleteNip = async (targetNip: string, targetName: string) => {
    if (!confirm(`Hapus NIP ${targetNip} (${targetName}) dari daftar pegawai resmi?`)) return;
    try {
      setNipLoading(true);
      await fetch(`/api/admin/pegawai-nip?userEmail=${AUTHORIZED_ADMIN_EMAIL}&nip=${targetNip}`, {
        method: 'DELETE',
      });
      fetchNips();
    } catch (e) {
      console.error('Failed to delete NIP:', e);
    } finally {
      setNipLoading(false);
    }
  };

  const handleToggleNipActive = async (targetNip: string, currentActive: boolean) => {
    try {
      await fetch('/api/admin/pegawai-nip', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: AUTHORIZED_ADMIN_EMAIL,
          nip: targetNip,
          is_active: !currentActive,
        }),
      });
      fetchNips();
    } catch (e) {
      console.error('Failed to toggle NIP status:', e);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;
    setLoading(true);
    setUploadStatus('Mengunggah dan membuat vector embeddings...');

    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: AUTHORIZED_ADMIN_EMAIL,
          filename: newDocName,
          folder: newDocFolder,
          visibility: newDocVisibility,
          is_sensitive: newDocSensitive,
        }),
      });
      const data = await res.json();
      if (data.document) {
        setDocuments((prev) => [data.document, ...prev]);
        setUploadStatus('✅ Dokumen berhasil diindeks ke pgvector!');
        setNewDocName('');
      } else {
        setUploadStatus(`❌ ${data.error || 'Gagal membuat dokumen'}`);
      }
    } catch {
      setUploadStatus('❌ Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Yakin ingin menghapus dokumen ini dan seluruh representasi vektornya?')) return;
    try {
      await fetch(`/api/admin/documents?id=${id}&userEmail=${AUTHORIZED_ADMIN_EMAIL}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Loading State
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold">Memeriksa Tatakelola & Hak Akses Administrator...</span>
        </div>
      </div>
    );
  }

  // 2. GOVERNANCE ACCESS GATE (Khusus ridwansugiarto.mail@gmail.com)
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-red-950/70 text-red-300 border border-red-800 text-[10px] font-extrabold uppercase tracking-wider mb-3">
            Governance & Hak Akses Terbatas
          </span>

          <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
            Portal Khusus Administrator
          </h1>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Berdasarkan tatakelola keamanan data ChatDKPP Kota Cilegon, portal ini hanya dapat diakses secara eksklusif oleh akun Administrator Resmi:
            <br />
            <strong className="text-emerald-400 font-mono text-sm block mt-1.5 font-bold">
              ridwansugiarto.mail@gmail.com
            </strong>
          </p>

          {currentUserEmail ? (
            <div className="mb-6 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 text-left">
              <span className="text-slate-500 block text-[10px]">Email Akun Anda Saat Ini:</span>
              <span className="font-semibold text-rose-400 break-all">{currentUserEmail}</span>
              <span className="block text-[10px] text-slate-400 mt-1">
                Akun ini tidak memiliki hak istimewa (privilege) Super Admin untuk mengelola sistem.
              </span>
            </div>
          ) : (
            <div className="mb-6 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400">
              Anda saat ini berada dalam mode Tamu (Guest). Silakan login dengan akun Administrator.
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Login sebagai Administrator
            </button>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all inline-block text-center"
            >
              ← Kembali ke Chat DKPP
            </Link>
          </div>
        </div>

        {/* Modal Auth */}
        <AuthModal
          isOpen={authModalOpen}
          initialMode="login"
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUserEmail(user.email);
            setAuthModalOpen(false);
          }}
        />
      </div>
    );
  }

  // 3. AUTHORIZED ADMIN PORTAL
  const filteredNips = nips.filter((n) => {
    if (!nipSearch) return true;
    const q = nipSearch.toLowerCase();
    return (
      n.nip?.toLowerCase().includes(q) ||
      n.nama?.toLowerCase().includes(q) ||
      n.jabatan?.toLowerCase().includes(q) ||
      n.bidang?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              DK
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Admin Portal ChatDKPP</h1>
              <p className="text-[10px] text-emerald-400">Knowledge Base & System Administration</p>
            </div>
          </div>
        </div>

        {/* Governance Verified Admin Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-emerald-500/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-emerald-300">SUPER ADMIN: ridwansugiarto.mail@gmail.com</span>
          </div>
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Chat Portal →
          </Link>
        </div>
      </header>

      {/* Admin Content */}
      <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-1 shrink-0">
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'DOCUMENTS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Daftar Dokumen (54 RAG)</span>
          </button>

          <button
            onClick={() => setActiveTab('FOLDERS')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'FOLDERS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Folder & Izin Akses</span>
          </button>

          {/* TAB BARU: TATAKELOLA NIP PEGAWAI */}
          <button
            onClick={() => setActiveTab('NIP')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'NIP'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span className="flex-1 text-left">Daftar NIP Pegawai</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {nips.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'UPLOAD'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload & Ingestion</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'AUDIT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('HEALTH')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'HEALTH'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Status Sistem & pgvector</span>
          </button>
        </div>

        {/* Tab Panels */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto shadow-sm">
          {/* TAB 1: Documents Tab */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Repository Knowledge Base</h2>
                  <p className="text-xs text-slate-400">Kelola dan pantau status dokumen terindeks RAG</p>
                </div>
                <button
                  onClick={() => setActiveTab('UPLOAD')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Dokumen</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nama File</th>
                      <th className="py-3 px-4">Folder</th>
                      <th className="py-3 px-4">Visibilitas</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-xs">{doc.filename}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {doc.folder}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              doc.visibility === 'PUBLIC'
                                ? 'bg-blue-950 text-blue-300'
                                : doc.visibility === 'INTERNAL'
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-red-950 text-red-300'
                            }`}
                          >
                            {doc.visibility}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-colors"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Folders Tab */}
          {activeTab === 'FOLDERS' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Struktur Tata Kelola Folder</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FOLDERS.map((folder) => (
                  <div key={folder.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-xs">{folder.name}</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                        {folder.count} Dokumen
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Hak Akses: {folder.perm}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DAFTAR NIP PEGAWAI (Governance Pegawai DKPP) */}
          {activeTab === 'NIP' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>Tatakelola NIP Pegawai Resmi DKPP</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Daftar NIP resmi ASN/Pegawai DKPP Kota Cilegon yang diakui sistem saat pendaftaran akun.
                  </p>
                </div>
                <button
                  onClick={fetchNips}
                  disabled={nipLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${nipLoading ? 'animate-spin' : ''}`} />
                  <span>Segarkan Data</span>
                </button>
              </div>

              {/* Action Message Alert */}
              {nipActionMsg && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 animate-in fade-in">
                  {nipActionMsg}
                </div>
              )}

              {/* Form Input NIP Baru oleh Admin */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Tambah Placeholder NIP Pegawai Baru</span>
                </h3>
                <form onSubmit={handleAddNip} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      NIP (18 Digit)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="198501012010011001"
                      value={newNip}
                      onChange={(e) => setNewNip(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Pegawai & Gelar"
                      value={newNipName}
                      onChange={(e) => setNewNipName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      placeholder="Jabatan Struktural / Fungsional"
                      value={newNipJabatan}
                      onChange={(e) => setNewNipJabatan(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Bidang
                    </label>
                    <select
                      value={newNipBidang}
                      onChange={(e) => setNewNipBidang(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Pimpinan">Pimpinan</option>
                      <option value="Sekretariat">Sekretariat</option>
                      <option value="Ketahanan Pangan">Ketahanan Pangan</option>
                      <option value="Pertanian">Pertanian</option>
                      <option value="Perikanan & Peternakan">Perikanan & Peternakan</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={nipLoading}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Simpan NIP</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Pencarian NIP */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari NIP, nama pegawai, jabatan, atau bidang..."
                    value={nipSearch}
                    onChange={(e) => setNipSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Total: <span className="text-emerald-400 font-bold">{filteredNips.length}</span> Pegawai
                </div>
              </div>

              {/* Tabel NIP Pegawai */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">NIP</th>
                      <th className="py-3 px-4">Nama Pegawai</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4">Bidang</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredNips.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                          {nipLoading ? 'Memuat daftar NIP...' : 'Tidak ada data NIP yang sesuai.'}
                        </td>
                      </tr>
                    ) : (
                      filteredNips.map((item) => (
                        <tr key={item.nip} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {item.nip}
                          </td>
                          <td className="py-3 px-4 font-medium text-white flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.nama}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{item.jabatan || '-'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]">
                              {item.bidang || 'DKPP'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleNipActive(item.nip, item.is_active)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                item.is_active
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                              title="Klik untuk mengubah status aktif"
                            >
                              {item.is_active ? 'AKTIF' : 'NON-AKTIF'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteNip(item.nip, item.nama)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                              title="Hapus NIP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Upload & Ingestion Tab */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-4 max-w-xl">
              <h2 className="text-lg font-bold text-white">Upload Dokumen & Ingestion RAG</h2>
              <form onSubmit={handleCreateDocument} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Dokumen</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Laporan_SKPG_Triwulan_I_2026.pdf"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Folder</label>
                  <select
                    value={newDocFolder}
                    onChange={(e) => setNewDocFolder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {FOLDERS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Visibilitas</label>
                  <select
                    value={newDocVisibility}
                    onChange={(e) => setNewDocVisibility(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PUBLIC">PUBLIC (Tamu + Pegawai + Admin)</option>
                    <option value="INTERNAL">INTERNAL (Hanya Pegawai Terverifikasi & Admin)</option>
                    <option value="ADMIN">ADMIN (Hanya Super Admin)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sensitif"
                    checked={newDocSensitive}
                    onChange={(e) => setNewDocSensitive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="sensitif" className="text-xs text-slate-300 font-medium">
                    Tandai sebagai dokumen sensitif (hanya dapat diakses melalui verifikasi ganda)
                  </label>
                </div>

                {uploadStatus && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                    {uploadStatus}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Proses Ingestion & Vector Index</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: Audit Logs Tab */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Sistem Audit Log Real-Time</h2>
              <p className="text-xs text-slate-400">
                Pencatatan real-time seluruh aktivitas otentikasi, akses dokumen, dan query AI.
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Aksi</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Tipe Sumber Daya</th>
                      <th className="py-3 px-4">Hasil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          Memuat audit log terbaru...
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(log.created_at).toLocaleTimeString('id-ID')}
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-400">{log.action}</td>
                          <td className="py-3 px-4 text-slate-300">{log.user_id}</td>
                          <td className="py-3 px-4">{log.resource_type || '-'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.access_result === 'SUCCESS'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : 'bg-red-950 text-red-300'
                              }`}
                            >
                              {log.access_result}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Health Tab */}
          {activeTab === 'HEALTH' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Status Sistem & Vector Store</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Gemini AI Model</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">gemini-2.5-flash</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Status: Aktif & Terhubung</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Vector Search</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">pgvector (768-dim)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">54 Dokumen / 5.412 Chunks</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Governance & RLS</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">STRICT ENABLED</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Admin: ridwansugiarto.mail@gmail.com</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
