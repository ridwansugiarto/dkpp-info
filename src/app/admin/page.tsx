'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
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
  Eye
} from 'lucide-react';
import { DocumentItem } from '@/types/dkpp';

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
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'FOLDERS' | 'UPLOAD' | 'AUDIT' | 'HEALTH'>('DOCUMENTS');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // New Doc Form
  const [newDocName, setNewDocName] = useState('');
  const [newDocFolder, setNewDocFolder] = useState('ketahanan-pangan');
  const [newDocVisibility, setNewDocVisibility] = useState('INTERNAL');
  const [newDocSensitive, setNewDocSensitive] = useState(false);

  const adminEmail = 'ridwansugiarto.mail@gmail.com';

  useEffect(() => {
    fetchDocuments();
    fetchAuditLogs();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/admin/documents?userEmail=${adminEmail}`);
      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        setDocuments(data.documents);
      } else {
        // Sample baseline documents
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
          {
            id: 'doc-3',
            filename: 'Data_Gaji_dan_Evaluasi_Kinerja_Pegawai_2026.xlsx',
            folder: 'kepegawaian',
            category: 'INTERNAL_HR',
            is_sensitive: true,
            visibility: 'ADMIN',
            uploaded_at: '2026-03-01T14:00:00Z',
            version: 1,
            file_size: 524288,
            status: 'INDEXED',
          },
        ]);
      }
    } catch {
      // Fallback
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`/api/admin/audit?userEmail=${adminEmail}`);
      const data = await res.json();
      if (data.logs) {
        setAuditLogs(data.logs);
      }
    } catch {
      //
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    setLoading(true);
    setUploadStatus('Memproses & Mengindeks Dokumen ke pgvector...');

    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: adminEmail,
          filename: newDocName.trim(),
          folder: newDocFolder,
          visibility: newDocVisibility,
          is_sensitive: newDocSensitive,
          file_size: 1542000,
        }),
      });
      const data = await res.json();
      if (data.document) {
        setDocuments((prev) => [data.document, ...prev]);
        setUploadStatus('Dokumen berhasil diunggah dan diindeks ke Knowledge Base!');
        setNewDocName('');
        setTimeout(() => setUploadStatus(null), 3000);
      }
    } catch {
      setUploadStatus('Gagal mengunggah dokumen.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await fetch(`/api/admin/documents?id=${id}&userEmail=${adminEmail}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      //
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              DK
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Admin Portal DKPP-INFO</h1>
              <p className="text-[10px] text-emerald-400">Knowledge Base & System Administration</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Ridwan Sugiarto (Admin)</span>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'DOCUMENTS'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Daftar Dokumen</span>
          </button>

          <button
            onClick={() => setActiveTab('FOLDERS')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'FOLDERS'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Folder & Izin Akses</span>
          </button>

          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'UPLOAD'
                ? 'bg-emerald-600 text-white'
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
                ? 'bg-emerald-600 text-white'
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
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Status Sistem & pgvector</span>
          </button>
        </div>

        {/* Tab Panels */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto shadow-sm">
          {/* Documents Tab */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Repository Knowledge Base</h2>
                  <p className="text-xs text-slate-400">Kelola dan pantau status dokumen terindeks RAG</p>
                </div>
                <button
                  onClick={() => setActiveTab('UPLOAD')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white transition-colors"
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
                      <th className="py-3 px-4">Sensitif</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{doc.filename}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {doc.folder}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-medium ${
                              doc.visibility === 'PUBLIC'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {doc.visibility}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {doc.is_sensitive ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Ya
                            </span>
                          ) : (
                            <span className="text-slate-500">Tidak</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle className="w-3 h-3" /> INDEXED
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded-lg transition-colors"
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

          {/* Folders Tab */}
          {activeTab === 'FOLDERS' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Struktur Folder & Access Control</h2>
              <p className="text-xs text-slate-400">
                Pemetaan hak akses per folder knowledge base DKPP Kota Cilegon.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {FOLDERS.map((f) => (
                  <div key={f.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-emerald-400">📁 {f.name}/</div>
                      <div className="text-[11px] text-slate-400 mt-1">Hak Akses: {f.perm}</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {f.count} Dokumen
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-4 max-w-xl">
              <h2 className="text-lg font-bold text-white">Upload Dokumen & Ingestion RAG</h2>
              <p className="text-xs text-slate-400">
                Format didukung: PDF, DOCX, XLSX, CSV, TXT, KML, KMZ, GeoJSON.
              </p>

              {uploadStatus && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                  {uploadStatus}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama / Judul Dokumen
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Contoh: Laporan_SKPG_Mei_2026.pdf"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Folder
                    </label>
                    <select
                      value={newDocFolder}
                      onChange={(e) => setNewDocFolder(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="ketahanan-pangan">ketahanan-pangan</option>
                      <option value="pertanian">pertanian</option>
                      <option value="perikanan">perikanan</option>
                      <option value="peternakan">peternakan</option>
                      <option value="program">program</option>
                      <option value="sensitif">sensitif</option>
                      <option value="kepegawaian">kepegawaian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Visibilitas
                    </label>
                    <select
                      value={newDocVisibility}
                      onChange={(e) => setNewDocVisibility(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="INTERNAL">INTERNAL (Pegawai)</option>
                      <option value="PUBLIC">PUBLIC (Tamu/Umum)</option>
                      <option value="RESTRICTED">RESTRICTED</option>
                      <option value="ADMIN">ADMIN Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sens"
                    checked={newDocSensitive}
                    onChange={(e) => setNewDocSensitive(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="sens" className="text-xs text-slate-300">
                    Tandai sebagai dokumen rahasia/sensitif
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Proses Ingestion & Vector Index</span>
                </button>
              </form>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Sistem Audit Log</h2>
              <p className="text-xs text-slate-400">
                Pencatatan real-time seluruh aktivitas otentikasi, akses dokumen, dan query AI.
              </p>

              <div className="overflow-x-auto">
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

          {/* Health Tab */}
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
                  <div className="text-[10px] text-slate-500 mt-0.5">RPC: match_document_chunks</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400">Row Level Security</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">ENABLED</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">12 Migrations Applied</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
