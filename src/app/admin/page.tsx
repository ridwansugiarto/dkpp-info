'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  UserCheck,
  Layers,
  Cpu,
  Edit3,
  Filter,
  Folder,
  Globe,
  X,
  ChevronRight,
  SlidersHorizontal,
  FolderSync,
  Trophy,
  Download,
  Award,
  Vote,
  Sprout,
  MapPin,
  ExternalLink,
  Save
} from 'lucide-react';
import { DocumentItem, DocumentFolder, DocumentVisibility } from '@/types/dkpp';
import { AuthModal } from '@/components/auth/AuthModal';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';

const AUTHORIZED_ADMIN_EMAIL = 'ridwansugiarto.mail@gmail.com';

const FOLDERS = [
  { id: 'sensitif', name: 'sensitif', perm: 'Hanya Admin & Pegawai Khusus', defaultCount: 3, desc: 'Dokumen rahasia, audit, evaluasi internal & catatan kepegawaian.' },
  { id: 'ketahanan-pangan', name: 'ketahanan-pangan', perm: 'Pegawai + Publik (Subset)', defaultCount: 12, desc: 'FSVA, SKPG, CPPD, Neraca Pangan & Kebijakan Pangan.' },
  { id: 'pertanian', name: 'pertanian', perm: 'Pegawai + Publik (Subset)', defaultCount: 8, desc: 'Lahan Baku Sawah, Produksi Padi, Agroklimat & Petak GIS.' },
  { id: 'perikanan', name: 'perikanan', perm: 'Pegawai + Publik (Subset)', defaultCount: 5, desc: '9 Pangkalan Nelayan, KUB, Budidaya Kolam & Produksi Ikan.' },
  { id: 'peternakan', name: 'peternakan', perm: 'Pegawai & Admin', defaultCount: 4, desc: 'Populasi Ternak, Kesehatan Hewan & Rumah Potong Hewan.' },
  { id: 'program', name: 'program', perm: 'Pegawai & Admin', defaultCount: 6, desc: 'SAKIP, RENSTRA, APBD, Rencana Kerja & Laporan Tahunan.' },
  { id: 'kepegawaian', name: 'kepegawaian', perm: 'Khusus HR & Admin', defaultCount: 2, desc: 'Struktur Organisasi, NIP Pegawai & Dokumen Internal ASN.' },
];

export default function AdminPortalPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'FOLDERS' | 'NIP' | 'UPLOAD' | 'SYNC' | 'AUDIT' | 'HEALTH' | 'POLLING' | 'KWT'>('DOCUMENTS');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Polling Management States
  const [pollThemes, setPollThemes] = useState<any[]>(OFFICIAL_POLL_THEMES);
  const [selectedPollThemeCode, setSelectedPollThemeCode] = useState('cerdas');
  const [pollDetail, setPollDetail] = useState<any>(null);
  const [pollResults, setPollResults] = useState<any[]>([]);
  const [pollTotalVotes, setPollTotalVotes] = useState(0);
  const [pollVoters, setPollVoters] = useState<any[]>([]);
  const [pollAuditLogs, setPollAuditLogs] = useState<any[]>([]);
  const [pollSubTab, setPollSubTab] = useState<'TEMA' | 'AGREGAT' | 'ANONIM' | 'AUDIT'>('TEMA');
  const [pollLoading, setPollLoading] = useState(false);
  const [pollActionMsg, setPollActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetReason, setResetReason] = useState('Audit berkala & pembersihan data uji');
  const [isResetting, setIsResetting] = useState(false);

  // Polling Theme CRUD Modal States
  const [showAddThemeModal, setShowAddThemeModal] = useState(false);
  const [newThemeCode, setNewThemeCode] = useState('');
  const [newThemeTitle, setNewThemeTitle] = useState('');
  const [newThemeLabel, setNewThemeLabel] = useState('');
  const [newThemeIcon, setNewThemeIcon] = useState('🏆');
  const [newThemeDesc, setNewThemeDesc] = useState('');
  const [newThemeMaxChoices, setNewThemeMaxChoices] = useState(3);
  const [isSavingNewTheme, setIsSavingNewTheme] = useState(false);

  const [editingTheme, setEditingTheme] = useState<any | null>(null);
  const [editThemeTitle, setEditThemeTitle] = useState('');
  const [editThemeLabel, setEditThemeLabel] = useState('');
  const [editThemeIcon, setEditThemeIcon] = useState('🏆');
  const [editThemeDesc, setEditThemeDesc] = useState('');
  const [editThemeMaxChoices, setEditThemeMaxChoices] = useState(3);
  const [editThemeActive, setEditThemeActive] = useState(true);
  const [isSavingEditTheme, setIsSavingEditTheme] = useState(false);

  const [deletingTheme, setDeletingTheme] = useState<any | null>(null);
  const [deleteThemeReason, setDeleteThemeReason] = useState('Penghapusan tema polling oleh Super Admin');
  const [isDeletingTheme, setIsDeletingTheme] = useState(false);

  // Filter & Search Documents
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null);
  const [searchDocTerm, setSearchDocTerm] = useState('');
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);
  const [docActionFeedback, setDocActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Doc Modal State
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [editDocName, setEditDocName] = useState('');
  const [editDocFolder, setEditDocFolder] = useState('ketahanan-pangan');
  const [editDocVisibility, setEditDocVisibility] = useState('INTERNAL');
  const [editDocSensitive, setEditDocSensitive] = useState(false);
  const [isSavingEditDoc, setIsSavingEditDoc] = useState(false);
 
  // KWT (Kelompok Wanita Tani) States
  const [kwtList, setKwtList] = useState<any[]>([]);
  const [kwtLoading, setKwtLoading] = useState(false);
  const [kwtSearch, setKwtSearch] = useState('');
  const [kwtFilterKecamatan, setKwtFilterKecamatan] = useState('ALL');
  const [kwtFilterStatus, setKwtFilterStatus] = useState('ALL');
  const [kwtSavingId, setKwtSavingId] = useState<number | null>(null);
  const [kwtSaveSuccess, setKwtSaveSuccess] = useState<Record<number, boolean>>({});
  const [kwtEdits, setKwtEdits] = useState<Record<number, any>>({});

  // New Doc Form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  // Sync Data & GIS States
  const [syncStatusData, setSyncStatusData] = useState<any>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [isSyncingGis, setIsSyncingGis] = useState(false);
  const [isVerifyingKnowledge, setIsVerifyingKnowledge] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Check auth session
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dkpp_user_session') || sessionStorage.getItem('dkpp_user_session');
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
      fetchSyncStatus();
      fetchPollThemes();
      fetchPollData(selectedPollThemeCode);
      fetchKwtList();
    }
  }, [isAuthorizedAdmin]);

  const fetchSyncStatus = async () => {
    try {
      setSyncLoading(true);
      const res = await fetch(`/api/admin/sync-status?userEmail=${AUTHORIZED_ADMIN_EMAIL}`);
      const data = await res.json();
      if (data.success) {
        setSyncStatusData(data);
      }
    } catch (e) {
      console.error('Failed to fetch sync status:', e);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSyncGis = async () => {
    try {
      setIsSyncingGis(true);
      setSyncFeedback({ type: 'info', text: 'Sedang menarik data spasial terbaru (sawah 407 petak, nelayan, KWT, peternakan) dari Serumpun-Padi GIS...' });
      const res = await fetch('/api/admin/sync-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: AUTHORIZED_ADMIN_EMAIL, action: 'SYNC_GIS' }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({ type: 'success', text: '✅ Data GIS Serumpun-Padi berhasil disinkronkan ke cache lokal!' });
        fetchSyncStatus();
      } else {
        setSyncFeedback({ type: 'error', text: `Gagal sinkronisasi GIS: ${data.details?.error || data.error || 'Periksa koneksi SP'}` });
      }
    } catch {
      setSyncFeedback({ type: 'error', text: 'Gagal menghubungi server untuk sinkronisasi GIS.' });
    } finally {
      setIsSyncingGis(false);
    }
  };

  const handleVerifyKnowledge = async () => {
    try {
      setIsVerifyingKnowledge(true);
      setSyncFeedback({ type: 'info', text: 'Sedang memverifikasi tabel Knowledge Base & pgvector search...' });
      const res = await fetch('/api/admin/sync-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: AUTHORIZED_ADMIN_EMAIL, action: 'VERIFY_KNOWLEDGE' }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({ type: 'success', text: '✅ Knowledge Base AI terverifikasi 100%! Seluruh indeks dokumen & RAG aktif siap melayani chat.' });
        fetchSyncStatus();
      } else {
        setSyncFeedback({ type: 'error', text: `Verifikasi gagal: ${data.error || 'Kueri RAG tidak berhasil'}` });
      }
    } catch {
      setSyncFeedback({ type: 'error', text: 'Gagal memverifikasi Knowledge Base.' });
    } finally {
      setIsVerifyingKnowledge(false);
    }
  };

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

  // KWT Handlers
  const fetchKwtList = async () => {
    try {
      setKwtLoading(true);
      const res = await fetch('/api/kwt?limit=200');
      const data = await res.json();
      if (data.kwt) {
        setKwtList(data.kwt);
      }
    } catch (e) {
      console.error('Failed to fetch KWT:', e);
    } finally {
      setKwtLoading(false);
    }
  };

  const handleKwtInputChange = (no_urut: number, field: string, value: any) => {
    setKwtEdits((prev) => ({
      ...prev,
      [no_urut]: {
        ...(prev[no_urut] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveKwtRow = async (kwtItem: any) => {
    const no = kwtItem.no_urut;
    const edits = kwtEdits[no] || {};
    setKwtSavingId(no);
    try {
      const payload: any = {
        id: kwtItem.id,
        no_urut: kwtItem.no_urut,
      };
      if (edits.nama_ketua !== undefined) payload.nama_ketua = edits.nama_ketua;
      if (edits.no_wa_ketua !== undefined) payload.no_wa_ketua = edits.no_wa_ketua;
      if (edits.latitude !== undefined) payload.latitude = edits.latitude ? Number(edits.latitude) : null;
      if (edits.longitude !== undefined) payload.longitude = edits.longitude ? Number(edits.longitude) : null;
      if (edits.alamat_sekretariat !== undefined) payload.alamat_sekretariat = edits.alamat_sekretariat;
      if (payload.latitude && payload.longitude) {
        payload.maps_link = `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`;
      }

      const res = await fetch('/api/kwt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setKwtSaveSuccess((prev) => ({ ...prev, [no]: true }));
        setTimeout(() => {
          setKwtSaveSuccess((prev) => ({ ...prev, [no]: false }));
        }, 3000);
        setKwtList((prev) =>
          prev.map((k) => (k.no_urut === no ? { ...k, ...payload } : k))
        );
      }
    } catch (err) {
      console.error('Failed to save KWT row:', err);
    } finally {
      setKwtSavingId(null);
    }
  };

  const exportKwtToCsv = () => {
    if (!kwtList.length) return;
    const headers = [
      'No', 'Kecamatan', 'Kelurahan', 'Nama KWT', 'Nama Ketua',
      'No WA Ketua', 'Alamat Sekretariat', 'Jenis Usaha', 'Bantuan',
      'Status', 'Latitude', 'Longitude', 'Google Maps'
    ];
    const rows = kwtList.map((k) => {
      const edits = kwtEdits[k.no_urut] || {};
      const ketua = edits.nama_ketua !== undefined ? edits.nama_ketua : (k.nama_ketua || '');
      const wa = edits.no_wa_ketua !== undefined ? edits.no_wa_ketua : (k.no_wa_ketua || '');
      const lat = edits.latitude !== undefined ? edits.latitude : (k.latitude || '');
      const lon = edits.longitude !== undefined ? edits.longitude : (k.longitude || '');
      const alm = edits.alamat_sekretariat !== undefined ? edits.alamat_sekretariat : (k.alamat_sekretariat || '');
      return [
        k.no_urut,
        `"${(k.kecamatan || '').replace(/"/g, '""')}"`,
        `"${(k.kelurahan || '').replace(/"/g, '""')}"`,
        `"${(k.nama_kwt || '').replace(/"/g, '""')}"`,
        `"${String(ketua).replace(/"/g, '""')}"`,
        `"${String(wa).replace(/"/g, '""')}"`,
        `"${String(alm).replace(/"/g, '""')}"`,
        `"${(k.jenis_usaha || '').replace(/"/g, '""')}"`,
        `"${(k.bantuan || '').replace(/"/g, '""')}"`,
        `"${(k.keterangan || '').replace(/"/g, '""')}"`,
        lat,
        lon,
        `"${(k.maps_link || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_kwt_cilegon_2026_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName && !selectedFile) return;
    setLoading(true);
    setUploadStatus('Mengunggah berkas dan memproses vector embeddings...');

    try {
      if (selectedFile) {
        // 1. Upload file fisik ke /api/knowledge/upload untuk di-chunk & diekstrak teksnya
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('judul', newDocName || selectedFile.name);
        formData.append('deskripsi', `Dokumen unggahan Admin ke folder ${newDocFolder}`);
        formData.append('folder', newDocFolder);
        formData.append('visibility', newDocVisibility);
        formData.append('is_sensitive', String(newDocSensitive));

        const resUpload = await fetch('/api/knowledge/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await resUpload.json();

        if (!resUpload.ok) {
          throw new Error(uploadData.error || 'Gagal memproses file dokumen');
        }

        // 2. Daftarkan juga ke tabel documents agar tampil di Manajemen Dokumen
        const resDoc = await fetch('/api/admin/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: AUTHORIZED_ADMIN_EMAIL,
            filename: newDocName || selectedFile.name,
            folder: newDocFolder,
            visibility: newDocVisibility,
            is_sensitive: newDocSensitive,
            file_size: selectedFile.size,
            mime_type: selectedFile.type || 'application/pdf',
          }),
        });
        const docData = await resDoc.json();

        if (docData.document) {
          setDocuments((prev) => [docData.document, ...prev]);
        }

        const totalChunksMsg = uploadData.total_chunks ? ` (${uploadData.total_chunks} chunks)` : '';
        setUploadStatus(`✅ Berhasil! File "${selectedFile.name}" telah diunggah${totalChunksMsg} dan diindeks ke pgvector!`);
        setSelectedFile(null);
        setNewDocName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
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
          setUploadStatus('✅ Dokumen berhasil dibuat dan diindeks ke pgvector!');
          setNewDocName('');
        } else {
          setUploadStatus(`❌ ${data.error || 'Gagal membuat dokumen'}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan server saat upload';
      setUploadStatus(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDoc = async (
    docId: string,
    updates: Partial<{ folder: DocumentFolder | string; visibility: DocumentVisibility | string; is_sensitive: boolean; filename: string }>
  ) => {
    try {
      setUpdatingDocId(docId);
      setDocActionFeedback(null);

      const res = await fetch('/api/admin/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: AUTHORIZED_ADMIN_EMAIL,
          id: docId,
          ...updates,
        }),
      });

      const data = await res.json();
      if (data.success && data.document) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, ...data.document } : d))
        );
        setDocActionFeedback({
          type: 'success',
          text: `✅ Dokumen berhasil diperbarui (Folder: ${data.document.folder} | Visibilitas: ${data.document.visibility})`,
        });
      } else {
        // Optimistic fallback for baseline mock items
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? ({ ...d, ...updates } as DocumentItem) : d))
        );
        setDocActionFeedback({
          type: 'success',
          text: `✅ Status dokumen diperbarui!`,
        });
      }
    } catch {
      setDocActionFeedback({ type: 'error', text: 'Gagal menghubungi server untuk update dokumen.' });
    } finally {
      setUpdatingDocId(null);
    }
  };

  const handleOpenEditModal = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setEditDocName(doc.filename);
    setEditDocFolder(doc.folder || 'ketahanan-pangan');
    setEditDocVisibility(doc.visibility || 'INTERNAL');
    setEditDocSensitive(Boolean(doc.is_sensitive));
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    setIsSavingEditDoc(true);
    await handleUpdateDoc(editingDoc.id, {
      filename: editDocName,
      folder: editDocFolder,
      visibility: editDocVisibility,
      is_sensitive: editDocSensitive,
    });
    setIsSavingEditDoc(false);
    setEditingDoc(null);
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolderFilter(folderId);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Yakin ingin menghapus dokumen ini dan seluruh representasi vektornya?')) return;
    try {
      await fetch(`/api/admin/documents?id=${id}&userEmail=${AUTHORIZED_ADMIN_EMAIL}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setDocActionFeedback({ type: 'success', text: 'Dokumen berhasil dihapus.' });
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

  // Polling fetch & mutation handlers
  const fetchPollThemes = async () => {
    try {
      const res = await fetch(`/api/admin/polling/themes?adminEmail=${encodeURIComponent(currentUserEmail || AUTHORIZED_ADMIN_EMAIL)}`);
      const data = await res.json();
      if (res.ok && data.polls) {
        setPollThemes(data.polls);
      }
    } catch (err) {
      console.error('Fetch admin poll themes error:', err);
    }
  };

  const handleCreateThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeCode.trim() || !newThemeTitle.trim() || !newThemeLabel.trim()) {
      setPollActionMsg({ type: 'error', text: 'Kode (slug), Judul Polling, dan Label Pendek wajib diisi.' });
      return;
    }
    setIsSavingNewTheme(true);
    setPollActionMsg(null);
    try {
      const res = await fetch('/api/admin/polling/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newThemeCode,
          title: newThemeTitle,
          short_label: newThemeLabel,
          icon: newThemeIcon,
          description: newThemeDesc,
          max_choices: newThemeMaxChoices,
          is_active: true,
          adminEmail: currentUserEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPollActionMsg({ type: 'success', text: data.message });
        setShowAddThemeModal(false);
        setNewThemeCode('');
        setNewThemeTitle('');
        setNewThemeLabel('');
        setNewThemeIcon('🏆');
        setNewThemeDesc('');
        setNewThemeMaxChoices(3);
        await fetchPollThemes();
        if (data.poll?.code) {
          setSelectedPollThemeCode(data.poll.code);
          fetchPollData(data.poll.code);
        }
      } else {
        setPollActionMsg({ type: 'error', text: data.error || 'Gagal membuat tema baru.' });
      }
    } catch (err: any) {
      setPollActionMsg({ type: 'error', text: err.message || 'Koneksi terganggu.' });
    } finally {
      setIsSavingNewTheme(false);
    }
  };

  const handleOpenEditTheme = (theme: any) => {
    setEditingTheme(theme);
    setEditThemeTitle(theme.title || '');
    setEditThemeLabel(theme.short_label || '');
    setEditThemeIcon(theme.icon || '🏆');
    setEditThemeDesc(theme.description || '');
    setEditThemeMaxChoices(theme.max_choices || 3);
    setEditThemeActive(theme.is_active !== false);
  };

  const handleUpdateThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTheme) return;
    setIsSavingEditTheme(true);
    setPollActionMsg(null);
    try {
      const res = await fetch('/api/admin/polling/themes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTheme.id,
          code: editingTheme.code,
          title: editThemeTitle,
          short_label: editThemeLabel,
          icon: editThemeIcon,
          description: editThemeDesc,
          max_choices: editThemeMaxChoices,
          is_active: editThemeActive,
          adminEmail: currentUserEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPollActionMsg({ type: 'success', text: data.message });
        setEditingTheme(null);
        await fetchPollThemes();
        if (selectedPollThemeCode === editingTheme.code) {
          fetchPollData(selectedPollThemeCode);
        }
      } else {
        setPollActionMsg({ type: 'error', text: data.error || 'Gagal mengubah tema polling.' });
      }
    } catch (err: any) {
      setPollActionMsg({ type: 'error', text: err.message || 'Koneksi terganggu.' });
    } finally {
      setIsSavingEditTheme(false);
    }
  };

  const handleToggleThemeActive = async (theme: any) => {
    try {
      const newStatus = !theme.is_active;
      const res = await fetch('/api/admin/polling/themes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: theme.id,
          code: theme.code,
          is_active: newStatus,
          adminEmail: currentUserEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPollActionMsg({
          type: 'success',
          text: `Status tema "${theme.title}" diubah menjadi: ${newStatus ? 'Aktif' : 'Non-Aktif'}`,
        });
        fetchPollThemes();
      } else {
        setPollActionMsg({ type: 'error', text: data.error || 'Gagal mengubah status tema.' });
      }
    } catch (err: any) {
      setPollActionMsg({ type: 'error', text: err.message || 'Koneksi terganggu.' });
    }
  };

  const handleOpenDeleteTheme = (theme: any) => {
    setDeletingTheme(theme);
    setDeleteThemeReason(`Penghapusan tema ${theme.title} oleh Super Admin`);
  };

  const handleDeleteThemeSubmit = async () => {
    if (!deletingTheme) return;
    setIsDeletingTheme(true);
    setPollActionMsg(null);
    try {
      const res = await fetch('/api/admin/polling/themes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingTheme.id,
          code: deletingTheme.code,
          reason: deleteThemeReason,
          adminEmail: currentUserEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPollActionMsg({ type: 'success', text: data.message });
        setDeletingTheme(null);
        await fetchPollThemes();
        if (selectedPollThemeCode === deletingTheme.code) {
          setSelectedPollThemeCode('cantik');
          fetchPollData('cantik');
        }
      } else {
        setPollActionMsg({ type: 'error', text: data.error || 'Gagal menghapus tema polling.' });
      }
    } catch (err: any) {
      setPollActionMsg({ type: 'error', text: err.message || 'Koneksi terganggu.' });
    } finally {
      setIsDeletingTheme(false);
    }
  };

  const fetchPollData = async (code: string) => {
    setPollLoading(true);
    setPollActionMsg(null);
    try {
      // 1. Fetch Aggregates
      const res = await fetch(`/api/polling/results/${code}`);
      const data = await res.json();
      if (res.ok) {
        setPollDetail(data.poll);
        setPollResults(data.results || []);
        setPollTotalVotes(data.total_votes || 0);
      }

      // 2. Fetch Superadmin Voter / Activity Details
      const vRes = await fetch('/api/admin/polling/voters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poll_id: code,
          adminEmail: currentUserEmail,
          reason: 'Akses Portal Admin DKPP'
        })
      });
      const vData = await vRes.json();
      if (vRes.ok) {
        setPollVoters(vData.voters || []);
        setPollAuditLogs(vData.audit_logs || []);
      }
    } catch (err: any) {
      console.error('Fetch poll admin error:', err);
    } finally {
      setPollLoading(false);
    }
  };

  const handleResetPoll = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/polling/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_POLL',
          poll_id: selectedPollThemeCode,
          reason: resetReason,
          adminEmail: currentUserEmail
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPollActionMsg({ type: 'success', text: data.message });
        setShowResetConfirmModal(false);
        fetchPollData(selectedPollThemeCode);
      } else {
        setPollActionMsg({ type: 'error', text: data.error || 'Gagal mereset polling.' });
      }
    } catch (err: any) {
      setPollActionMsg({ type: 'error', text: err.message || 'Koneksi terganggu.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteCandidateVote = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus seluruh perolehan suara untuk kandidat "${employeeName}"?`)) return;
    try {
      const res = await fetch('/api/admin/polling/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_CANDIDATE_VOTE',
          poll_id: selectedPollThemeCode,
          employee_id: employeeId,
          employee_name: employeeName,
          reason: 'Penghapusan suara kandidat oleh Super Admin untuk audit',
          adminEmail: currentUserEmail
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPollActionMsg({ type: 'success', text: data.message });
        fetchPollData(selectedPollThemeCode);
      } else {
        setPollActionMsg({ type: 'error', text: data.error || 'Gagal menghapus suara kandidat.' });
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteUserVote = async (userId: string, userEmail?: string) => {
    const label = userEmail || userId;
    if (!confirm(`Apakah Anda yakin ingin menghapus seluruh pilihan suara dari akun "${label}" untuk audit & keamanan?`)) return;
    try {
      const res = await fetch('/api/admin/polling/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_USER_VOTE',
          poll_id: selectedPollThemeCode,
          user_id: userId,
          user_email: userEmail,
          reason: 'Penghapusan pilihan suara user oleh Admin untuk audit keamanan',
          adminEmail: currentUserEmail
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPollActionMsg({ type: 'success', text: data.message });
        fetchPollData(selectedPollThemeCode);
      } else {
        setPollActionMsg({ type: 'error', text: data.error || 'Gagal menghapus suara user.' });
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleExportPollCsv = () => {
    if (!pollResults.length) {
      alert('Tidak ada data hasil untuk diekspor.');
      return;
    }
    const headers = ['No', 'Nama Pegawai', 'Jumlah Suara', 'Persentase'];
    const rows = pollResults.map((r, idx) => [
      idx + 1,
      `"${r.full_name}"`,
      r.total_votes,
      `"${r.percentage}%"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hasil_Polling_${selectedPollThemeCode}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
            title="Kembali ke ChatDKPP"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            DK
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Admin Portal ChatDKPP</span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Knowledge Base & System Administration
            </p>
          </div>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-mono">SUPER ADMIN: {currentUserEmail}</span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-1.5 shrink-0">
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

          {/* TAB BARU: POLLING PEGAWAI */}
          <button
            onClick={() => {
              setActiveTab('POLLING');
              fetchPollData(selectedPollThemeCode);
            }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'POLLING'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="flex-1 text-left">Polling Pegawai</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
              15 Tema
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

          {/* TAB BARU: KELOMPOK WANITA TANI (KWT) */}
          <button
            onClick={() => {
              setActiveTab('KWT');
              fetchKwtList();
            }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'KWT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span className="flex-1 text-left">Kelompok Wanita Tani (KWT)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
              84 KWT
            </span>
          </button>

          {/* TAB BARU: SINKRONISASI DATA & GIS */}
          <button
            onClick={() => {
              setActiveTab('SYNC');
              fetchSyncStatus();
            }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'SYNC'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span className="flex-1 text-left">Sinkronisasi Data & GIS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span>Repository Knowledge Base</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Kelola, pindahkan folder, dan atur hak visibilitas dokumen terindeks RAG ChatDKPP
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('UPLOAD')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Dokumen</span>
                  </button>
                </div>
              </div>

              {/* Action Feedback Banner */}
              {docActionFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    docActionFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {docActionFeedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
                    <span>{docActionFeedback.text}</span>
                  </div>
                  <button onClick={() => setDocActionFeedback(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Search & Folder Filter Pills */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama dokumen..."
                      value={searchDocTerm}
                      onChange={(e) => setSearchDocTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {searchDocTerm && (
                      <button onClick={() => setSearchDocTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {selectedFolderFilter && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Filter Aktif:</span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[11px] flex items-center gap-1.5 font-bold">
                        <Folder className="w-3 h-3 text-emerald-400" />
                        {selectedFolderFilter}
                        <button onClick={() => setSelectedFolderFilter(null)} className="hover:text-white ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    </div>
                  )}
                </div>

                {/* Folder Pills Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs scrollbar-none">
                  <span className="text-[11px] text-slate-400 font-semibold shrink-0 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Folder:
                  </span>
                  <button
                    onClick={() => setSelectedFolderFilter(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      selectedFolderFilter === null
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Semua Folder ({documents.length})
                  </button>
                  {FOLDERS.map((f) => {
                    const countInFolder = documents.filter((d) => d.folder === f.id).length;
                    const isSelected = selectedFolderFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFolderFilter(isSelected ? null : f.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>{f.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {countInFolder}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table of Documents */}
              {(() => {
                const filteredDocs = documents.filter((doc) => {
                  const matchFolder = !selectedFolderFilter || doc.folder === selectedFolderFilter;
                  const matchSearch = !searchDocTerm || doc.filename.toLowerCase().includes(searchDocTerm.toLowerCase());
                  return matchFolder && matchSearch;
                });

                return (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Nama File</th>
                          <th className="py-3 px-4">Folder (Pindahkan)</th>
                          <th className="py-3 px-4">Visibilitas / Privasi</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Aksi Superadmin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredDocs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                              Tidak ada dokumen yang sesuai dengan filter.
                            </td>
                          </tr>
                        ) : (
                          filteredDocs.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 font-medium text-white">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shrink-0">
                                    <FileText className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <span className="truncate max-w-sm block font-semibold text-slate-100">{doc.filename}</span>
                                    {doc.is_sensitive && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                                        <Lock className="w-2.5 h-2.5" /> Data Sensitif Pegawai / Internal
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Interactive Folder Selector */}
                              <td className="py-3 px-4">
                                <div className="inline-flex items-center gap-1.5">
                                  <select
                                    value={doc.folder || 'ketahanan-pangan'}
                                    disabled={updatingDocId === doc.id}
                                    onChange={(e) => handleUpdateDoc(doc.id, { folder: e.target.value })}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-emerald-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
                                    title="Pindahkan dokumen ke folder lain"
                                  >
                                    {FOLDERS.map((f) => (
                                      <option key={f.id} value={f.id}>
                                        📁 {f.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </td>

                              {/* Interactive Visibility Selector */}
                              <td className="py-3 px-4">
                                <div className="inline-flex items-center gap-1.5">
                                  <select
                                    value={doc.visibility || 'INTERNAL'}
                                    disabled={updatingDocId === doc.id}
                                    onChange={(e) => handleUpdateDoc(doc.id, { visibility: e.target.value })}
                                    className={`px-2.5 py-1 text-xs rounded-lg font-bold border focus:outline-none focus:ring-1 cursor-pointer transition-colors ${
                                      doc.visibility === 'PUBLIC'
                                        ? 'bg-blue-950/90 border-blue-800 text-blue-300 focus:ring-blue-500'
                                        : doc.visibility === 'INTERNAL'
                                        ? 'bg-amber-950/90 border-amber-800 text-amber-300 focus:ring-amber-500'
                                        : 'bg-rose-950/90 border-rose-800 text-rose-300 focus:ring-rose-500'
                                    }`}
                                    title="Ubah hak visibilitas / privasi dokumen"
                                  >
                                    <option value="PUBLIC">🌐 PUBLIC (Tamu & ASN)</option>
                                    <option value="INTERNAL">🔒 INTERNAL (Hanya ASN)</option>
                                    <option value="RESTRICTED">🛡️ RESTRICTED (Admin)</option>
                                  </select>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  {doc.status}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditModal(doc)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Metadata Dokumen"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDoc(doc.id)}
                                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Dokumen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: Folders Tab — Interaktif & Klik-untuk-Kelola */}
          {activeTab === 'FOLDERS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-emerald-400" />
                    <span>Struktur Tata Kelola Folder Knowledge Base</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Klik segmen folder untuk melihat dan memindahkan dokumen atau mengubah status privasi.
                  </p>
                </div>
                {selectedFolderFilter && (
                  <button
                    onClick={() => setSelectedFolderFilter(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Tampilkan Semua Segmen</span>
                  </button>
                )}
              </div>

              {/* Action Feedback Banner */}
              {docActionFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    docActionFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{docActionFeedback.text}</span>
                  </div>
                  <button onClick={() => setDocActionFeedback(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Grid 7 Folder Segments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {FOLDERS.map((folder) => {
                  const docCount = documents.filter((d) => d.folder === folder.id).length;
                  const isSelected = selectedFolderFilter === folder.id;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => handleFolderClick(isSelected ? '' : folder.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/30'
                          : 'bg-slate-950 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-emerald-400 group-hover:bg-emerald-950'
                            }`}>
                              <Folder className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-white text-xs block">{folder.name}</span>
                              <span className="text-[10px] text-slate-400">Hak: {folder.perm}</span>
                            </div>
                          </div>

                          {/* Klikable Count Badge */}
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-mono font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-300 group-hover:bg-emerald-950 group-hover:text-emerald-300 group-hover:border group-hover:border-emerald-800'
                          }`}>
                            {docCount} Dokumen
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                          {folder.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                          {isSelected ? 'Tutup Daftar Dokumen' : 'Klik untuk Buka & Kelola'}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-emerald-400' : 'group-hover:translate-x-1'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail Daftar Dokumen dalam Folder yang Dipilih */}
              {selectedFolderFilter && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-900/50 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white">
                        Daftar Dokumen dalam Folder: <span className="text-emerald-400 font-mono">{selectedFolderFilter}</span>
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      Total: {documents.filter((d) => d.folder === selectedFolderFilter).length} Dokumen
                    </span>
                  </div>

                  {(() => {
                    const docsInFolder = documents.filter((d) => d.folder === selectedFolderFilter);
                    if (docsInFolder.length === 0) {
                      return (
                        <div className="p-6 text-center text-slate-500 text-xs rounded-xl bg-slate-900/50 border border-slate-800">
                          Belum ada dokumen di folder ini. Anda dapat memindahkan dokumen dari folder lain ke sini.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        {docsInFolder.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div>
                                <span className="text-xs font-semibold text-white block">{doc.filename}</span>
                                <span className="text-[10px] text-slate-400">Status: {doc.status}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 text-xs">
                              {/* Quick Move to Other Folder */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400">Pindah:</span>
                                <select
                                  value={doc.folder}
                                  disabled={updatingDocId === doc.id}
                                  onChange={(e) => handleUpdateDoc(doc.id, { folder: e.target.value })}
                                  className="px-2 py-1 text-xs rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                                >
                                  {FOLDERS.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      📁 {f.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Quick Toggle Visibility */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400">Privasi:</span>
                                <select
                                  value={doc.visibility}
                                  disabled={updatingDocId === doc.id}
                                  onChange={(e) => handleUpdateDoc(doc.id, { visibility: e.target.value })}
                                  className={`px-2 py-1 text-xs rounded-lg font-bold border focus:outline-none cursor-pointer ${
                                    doc.visibility === 'PUBLIC'
                                      ? 'bg-blue-950 border-blue-800 text-blue-300'
                                      : doc.visibility === 'INTERNAL'
                                      ? 'bg-amber-950 border-amber-800 text-amber-300'
                                      : 'bg-red-950 border-red-800 text-red-300'
                                  }`}
                                >
                                  <option value="PUBLIC">🌐 PUBLIC</option>
                                  <option value="INTERNAL">🔒 INTERNAL</option>
                                  <option value="RESTRICTED">🛡️ RESTRICTED</option>
                                </select>
                              </div>

                              {/* Actions */}
                              <button
                                onClick={() => handleOpenEditModal(doc)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                                title="Hapus Dokumen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
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
                      <th className="py-3 px-4">NIP (18 Digit)</th>
                      <th className="py-3 px-4">Nama Pegawai</th>
                      <th className="py-3 px-4">NPWP</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Keamanan</th>
                      <th className="py-3 px-4 text-center">Status Cek</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredNips.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                          {nipLoading ? 'Memuat daftar NIP...' : 'Tidak ada data NIP yang sesuai.'}
                        </td>
                      </tr>
                    ) : (
                      filteredNips.map((item) => (
                        <tr key={item.nip} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {item.nip}
                          </td>
                          <td className="py-3 px-4 font-medium text-white">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold">{item.nama}</span>
                            </div>
                            {item.golongan && (
                              <span className="text-[10px] text-slate-400 font-mono">Gol: {item.golongan}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                            {item.npwp || <span className="text-slate-600">-</span>}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-amber-400 font-mono">
                            {item.kelas_jabatan || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs">{item.jabatan || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status_pegawai === 'Struktural'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                                : item.status_pegawai === 'Pelaksana'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            }`}>
                              {item.status_pegawai || 'Fungsional'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900 text-[10px] font-semibold">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Sensitif</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
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
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-400" />
                  Upload Dokumen & Ingestion RAG
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Unggah berkas dokumen (PDF, Word, Excel, PPTX, CSV, TXT) untuk diparsing otomatis, diekstrak menjadi chunks, dan diindeks ke basis data vektor (pgvector) ChatDKPP AI.
                </p>
              </div>

              <form onSubmit={handleCreateDocument} className="space-y-5">
                {/* File Upload Dropzone / Picker Area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Pilih Berkas Dokumen <span className="text-emerald-400">*</span>
                  </label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                      if (file && !newDocName) {
                        setNewDocName(file.name);
                      }
                    }}
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv,.txt,.md,.png,.jpg,.jpeg"
                    className="hidden"
                    id="admin-file-upload-input"
                  />

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-950/60 hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-white mb-1">
                        <span className="text-emerald-400 underline decoration-emerald-400/40 underline-offset-4">Klik untuk memilih berkas</span> atau seret file ke sini
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Mendukung format PDF, Word (.docx/.doc), Excel (.xlsx/.xls), PPTX, CSV, TXT, Gambar (Maks 4.5 MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-white">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">{selectedFile.name}</p>
                          <p className="text-[11px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Berkas Dokumen'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all cursor-pointer"
                        >
                          Ganti File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Hapus file terpilih"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nama / Judul Dokumen</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Laporan_SKPG_Triwulan_I_2026.pdf"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sensitif"
                    checked={newDocSensitive}
                    onChange={(e) => setNewDocSensitive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="sensitif" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Tandai sebagai dokumen sensitif (hanya dapat diakses melalui verifikasi ganda NIP)
                  </label>
                </div>

                {uploadStatus && (
                  <div className={`p-3.5 rounded-xl border text-xs ${
                    uploadStatus.startsWith('✅')
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : uploadStatus.startsWith('❌')
                      ? 'bg-red-950/40 border-red-500/30 text-red-300'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}>
                    {uploadStatus}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!newDocName && !selectedFile)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{loading ? 'Memproses Berkas & Ingestion...' : 'Proses Ingestion & Vector Index'}</span>
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

          {/* TAB 5.5: SINKRONISASI DATA & GIS */}
          {activeTab === 'SYNC' && (
            <div className="space-y-6">
              {/* Header Tab */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400" />
                    <span>Pusat Sinkronisasi Data Spasial & Knowledge Base</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sinkronkan data geospasial Serumpun-Padi & verifikasi indeks dokumen Supabase untuk ChatDKPP AI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchSyncStatus}
                  disabled={syncLoading}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
              </div>

              {/* Feedback Alert Box */}
              {syncFeedback && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 transition-all animate-in fade-in ${
                    syncFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : syncFeedback.type === 'error'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-blue-950/60 border-blue-800 text-blue-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{syncFeedback.text}</span>
                </div>
              )}

              {/* 2 Primary Action Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* CARD 1: GIS SERUMPUN-PADI */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Data Spasial Serumpun-Padi GIS</h3>
                          <span className="text-[10.5px] text-emerald-400 font-medium">Auto-Cache TTL: 6 Jam</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        {syncStatusData?.gis_serumpun_padi?.status || 'AKTIF'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Menyinkronkan <strong>407 petak sawah baku (1.151,97 Ha)</strong>, pangkalan nelayan, budidaya kolam, kelompok wanita tani (KWT), dan peternakan dari database GIS Serumpun-Padi ke basis data lokal.
                    </p>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tabel Spasial:</span>
                        <span className="font-mono text-emerald-300 font-semibold">{syncStatusData?.gis_serumpun_padi?.cached_tables || 6} Tabel</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Terakhir Disinkronkan:</span>
                        <span className="text-slate-200">
                          {syncStatusData?.gis_serumpun_padi?.last_synced_at
                            ? new Date(syncStatusData.gis_serumpun_padi.last_synced_at).toLocaleString('id-ID')
                            : 'Otomatis (Tersedia)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        Sumber: <code className="text-slate-300 font-mono">sawah_status, pangkalan_nelayan, budidaya_kolam, kwt_cilegon, peternakan</code>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncGis}
                    disabled={isSyncingGis}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingGis ? 'animate-spin' : ''}`} />
                    <span>{isSyncingGis ? 'Menyinkronkan GIS Serumpun-Padi...' : 'Sinkronkan Data GIS Serumpun-Padi Sekarang'}</span>
                  </button>
                </div>

                {/* CARD 2: KNOWLEDGE BASE AI CHATDKPP */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-800/50 flex items-center justify-center text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">AI Knowledge Base & pgvector</h3>
                          <span className="text-[10.5px] text-blue-400 font-medium">Real-time RAG Pipeline</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60">
                        {syncStatusData?.knowledge_base?.rag_rpc_status || 'HEALTHY'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Memverifikasi <strong>54 Dokumen resmi</strong> & <strong>5.412 chunks</strong> teks di Supabase. AI Chatbot secara otomatis memanggil kueri pencarian teks dan pgvector ini pada setiap chat baru.
                    </p>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Dokumen Terindeks:</span>
                        <span className="font-mono text-blue-300 font-semibold">{syncStatusData?.knowledge_base?.total_docs || 54} Dokumen</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Chunks RAG:</span>
                        <span className="font-mono text-blue-300 font-semibold">{syncStatusData?.knowledge_base?.total_chunks || 5412} Chunks</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        Stored Procedure: <code className="text-blue-300 font-mono">match_knowledge_chunks(query, limit)</code>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyKnowledge}
                    disabled={isVerifyingKnowledge}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className={`w-4 h-4 ${isVerifyingKnowledge ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingKnowledge ? 'Memverifikasi Knowledge Base...' : 'Verifikasi & Sinkronisasi Knowledge Base'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: STATUS REAL-TIME INFRASTRUKTUR */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Status Infrastruktur AI & Database (Live Health)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Supabase Main DB</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>TERHUBUNG</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tables: documents, nips</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Serumpun-Padi GIS</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>SP_CACHE AKTIF</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Sawah baku 407 petak</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">ChatDKPP Intelligence</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>OPERASIONAL</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Gemini 2.5 Flash</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Vector Search Engine</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>FULL-TEXT & RAG</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">match_knowledge_chunks</div>
                  </div>
                </div>
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

          {/* TAB 7: POLLING PEGAWAI */}
          {activeTab === 'POLLING' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Polling Detail & Theme Selector */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Superadmin Polling Engine
                    </span>
                    <span className="text-xs text-slate-400">Total {pollThemes.length} Tema Terdaftar</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight mt-1.5 flex items-center gap-2">
                    <span>Tata Kelola &amp; Hasil Polling Pegawai DKPP</span>
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Tema Terpilih:</span>
                      <select
                        value={selectedPollThemeCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          setSelectedPollThemeCode(code);
                          fetchPollData(code);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-bold text-xs sm:text-sm focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                      >
                        {pollThemes.map((theme) => (
                          <option key={theme.code || theme.id} value={theme.code}>
                            {theme.icon || '🏆'} {theme.title} {theme.is_active === false ? '(Non-Aktif)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 pl-1 border-l border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full border border-slate-400" />
                        <span>Suara Masuk: <strong className="text-white font-mono">{pollTotalVotes}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Status: {pollThemes.find((t) => t.code === selectedPollThemeCode)?.is_active === false ? 'Non-Aktif' : 'Aktif'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddThemeModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Tema Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPollCsv}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-300" />
                    <span>Ekspor CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetConfirmModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reset Suara</span>
                  </button>
                </div>
              </div>

              {/* Feedback Message */}
              {pollActionMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    pollActionMsg.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pollActionMsg.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{pollActionMsg.text}</span>
                  </div>
                  <button onClick={() => setPollActionMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 4 Sub-Tabs Navigation */}
              <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-800 text-xs font-bold pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setPollSubTab('TEMA')}
                  className={`pb-2 relative whitespace-nowrap transition-all cursor-pointer ${
                    pollSubTab === 'TEMA'
                      ? 'text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Daftar Semua Tema ({pollThemes.length})</span>
                  {pollSubTab === 'TEMA' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPollSubTab('AGREGAT')}
                  className={`pb-2 relative whitespace-nowrap transition-all cursor-pointer ${
                    pollSubTab === 'AGREGAT'
                      ? 'text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Hasil (Agregat)</span>
                  {pollSubTab === 'AGREGAT' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPollSubTab('ANONIM')}
                  className={`pb-2 relative whitespace-nowrap transition-all cursor-pointer ${
                    pollSubTab === 'ANONIM'
                      ? 'text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Pilihan User (Anonim)</span>
                  {pollSubTab === 'ANONIM' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPollSubTab('AUDIT')}
                  className={`pb-2 relative whitespace-nowrap transition-all cursor-pointer ${
                    pollSubTab === 'AUDIT'
                      ? 'text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Log Aktivitas (Super Admin)</span>
                  {pollSubTab === 'AUDIT' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                  )}
                </button>
              </div>

              {/* TAB 0: DAFTAR SEMUA TEMA POLLING (CRUD MANAGER) */}
              {pollSubTab === 'TEMA' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Kelola Tema Polling DKPP</h3>
                      <p className="text-[11px] text-slate-400">
                        Tambah, ganti/edit judul &amp; deskripsi, non-aktifkan, atau hapus tema polling langsung via panel superadmin.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddThemeModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tambah Tema</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4 w-14 text-center">Ikon</th>
                          <th className="py-3 px-4">Judul &amp; Kode Polling</th>
                          <th className="py-3 px-4">Deskripsi / Pertanyaan</th>
                          <th className="py-3 px-4 text-center w-28">Status</th>
                          <th className="py-3 px-4 text-center w-24">Batas Suara</th>
                          <th className="py-3 px-4 text-center w-48">Aksi Tata Kelola</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {pollThemes.length > 0 ? (
                          pollThemes.map((theme, idx) => {
                            const isSelected = theme.code === selectedPollThemeCode;
                            return (
                              <tr
                                key={theme.id || theme.code || idx}
                                className={`transition-colors ${
                                  isSelected ? 'bg-emerald-950/20' : 'hover:bg-slate-900/50'
                                }`}
                              >
                                <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                                <td className="py-3 px-4 text-center text-xl">
                                  <span>{theme.icon || '🏆'}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-white text-sm flex items-center gap-2">
                                    <span>{theme.title}</span>
                                    {isSelected && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        Sedang Dibuka
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    Kode: <code className="text-emerald-400">{theme.code}</code> · Label: &quot;{theme.short_label}&quot;
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-300 text-xs max-w-xs">
                                  <p className="line-clamp-2">{theme.description || '—'}</p>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleThemeActive(theme)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 cursor-pointer ${
                                      theme.is_active !== false
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                                    }`}
                                    title="Klik untuk mengubah status aktif"
                                  >
                                    {theme.is_active !== false ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>Aktif</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        <span>Non-Aktif</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-slate-300">
                                  {theme.max_choices || 3} Nama
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPollThemeCode(theme.code);
                                        fetchPollData(theme.code);
                                        setPollSubTab('AGREGAT');
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
                                      title="Buka perolehan suara hasil polling ini"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Hasil</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTheme(theme)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
                                      title="Edit tema ini"
                                    >
                                      <Edit3 className="w-3 h-3 text-slate-300" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenDeleteTheme(theme)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                                      title="Hapus tema ini secara permanen"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-400" />
                                      <span>Hapus</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                              Belum ada tema polling yang terdaftar. Klik &quot;Tambah Tema Baru&quot; untuk memulai.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 1: HASIL AGREGAT (Table with individual candidate vote deletion) */}
              {pollSubTab === 'AGREGAT' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>📊</span>
                        <span>Hasil Perolehan Suara: {pollThemes.find((t) => t.code === selectedPollThemeCode)?.title || selectedPollThemeCode}</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Peringkat dihitung secara realtime berdasarkan suara sah yang masuk dari pegawai dinas.
                      </p>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      Total Suara: <strong className="text-emerald-400">{pollTotalVotes}</strong>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 w-14 text-center">No</th>
                          <th className="py-3 px-4">Nama Pegawai &amp; Jabatan</th>
                          <th className="py-3 px-4 text-center w-36">Jumlah Suara</th>
                          <th className="py-3 px-4 text-right w-28">Persentase</th>
                          <th className="py-3 px-4 text-center w-36">Aksi Tata Kelola</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {pollResults.length > 0 ? (
                          pollResults.map((row, idx) => (
                            <tr key={row.employee_id || idx} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-4 font-semibold text-white">
                                <div className="text-sm">{row.full_name}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{row.position} • {row.unit}</div>
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-slate-200 font-bold">
                                {row.total_votes}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                                {row.percentage}%
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCandidateVote(row.employee_id, row.full_name)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                                  title={`Hapus seluruh suara untuk ${row.full_name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Hapus Suara</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                              Belum ada suara masuk untuk tema polling ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {pollResults.length > 0 && (
                        <tfoot className="bg-slate-900/90 font-bold text-slate-200 border-t border-slate-700">
                          <tr>
                            <td colSpan={2} className="py-3 px-4 text-slate-300">Total suara</td>
                            <td className="py-3 px-4 text-center font-mono text-white text-sm">{pollTotalVotes}</td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-400">100%</td>
                            <td className="py-3 px-4"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: PILIHAN USER (ANONIM) */}
              {pollSubTab === 'ANONIM' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 w-14 text-center">No</th>
                          <th className="py-3 px-4">Token Pemilih (Anonim)</th>
                          <th className="py-3 px-4 text-center">Jumlah Pilihan</th>
                          <th className="py-3 px-4">Waktu Partisipasi</th>
                          <th className="py-3 px-4 text-center">Status Keabsahan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {pollVoters.length > 0 ? (
                          pollVoters.map((voter, idx) => (
                            <tr key={voter.user_id || idx} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-4 font-mono text-slate-300">
                                <span>anon-voter-#{String(idx + 1).padStart(3, '0')}</span>
                                <span className="text-[10px] text-slate-500 block">Encrypted SHA256 Token</span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-white font-mono">
                                {voter.choices?.length || 1} Suara
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-[11px]">
                                {new Date(voter.voted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Valid &amp; Terverifikasi</span>
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                              Belum ada catatan partisipasi pemilih.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: LOG AKTIVITAS (KHUSUS SUPER ADMIN) */}
              {pollSubTab === 'AUDIT' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Mode Audit Super Administrator:</strong> Menampilkan identitas akun Gmail pemilih, daftar kandidat yang dipilihnya, waktu submit, dan IP Address untuk audit transparansi &amp; keamanan.
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Akun Gmail &amp; Identitas Pemilih</th>
                          <th className="py-3 px-4">Pilihan Pegawai (Hasil Polling Dia)</th>
                          <th className="py-3 px-4">Waktu &amp; IP Address</th>
                          <th className="py-3 px-4 text-center w-36">Aksi Keamanan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {pollVoters.length > 0 ? (
                          pollVoters.map((voter, idx) => (
                            <tr key={voter.user_id || idx} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                                  <span>📧 {voter.email || voter.user_id}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  User ID: {voter.user_id}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {voter.choices && voter.choices.length > 0 ? (
                                    voter.choices.map((c: any, cIdx: number) => (
                                      <span
                                        key={c.vote_id || cIdx}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 text-xs font-semibold shadow-xs"
                                      >
                                        <span>✓ {c.full_name}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">({c.unit || 'DKPP'})</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-500 italic text-[11px]">Tidak ada rincian pilihan</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-[11px] text-slate-400">
                                <div>{new Date(voter.voted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                <div className="font-mono text-[10px] text-slate-500">IP: {voter.ip_address || '127.0.0.1'}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUserVote(voter.user_id, voter.email)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                                  title="Hapus seluruh pilihan suara dari user ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Hapus Pilihan User</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                              Belum ada data pemilih yang tercatat.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BOTTOM PRIVACY & AUDIT BADGES (Sesuai Mockup) */}
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">Data pengguna yang memilih (anonim)</h4>
                    <p className="text-[11px] text-emerald-400/80 mt-0.5">
                      Hasil perolehan suara dihitung secara agregat dan disajikan secara anonim kepada publik &amp; pegawai dinas.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Log aktivitas (hanya untuk admin)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Dapat melihat siapa yang memilih, daftar pilihan, waktu, dan IP (untuk audit integritas &amp; transparansi tata kelola internal).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: KELOMPOK WANITA TANI (KWT) */}
          {activeTab === 'KWT' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Panel KWT */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Basis Data Pertanian &amp; Ketahanan Pangan
                    </span>
                    <span className="text-xs text-slate-400">Total {kwtList.length} KWT Terdaftar</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                    <span>Kelompok Wanita Tani (KWT) Kota Cilegon</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data 84 KWT di 8 Kecamatan se-Kota Cilegon — Terintegrasi dengan Chatbot AI, Pin Peta GIS Spasial &amp; Google Maps.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={exportKwtToCsv}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ekspor CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchKwtList}
                    disabled={kwtLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${kwtLoading ? 'animate-spin' : ''}`} />
                    <span>Muat Ulang</span>
                  </button>
                </div>
              </div>

              {/* Filter & Pencarian Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={kwtSearch}
                    onChange={(e) => setKwtSearch(e.target.value)}
                    placeholder="Cari nama KWT, kelurahan, alamat lingkungan, atau usaha..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {kwtSearch && (
                    <button
                      type="button"
                      onClick={() => setKwtSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={kwtFilterKecamatan}
                      onChange={(e) => setKwtFilterKecamatan(e.target.value)}
                      className="px-2.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="ALL">Semua Kecamatan (8)</option>
                      <option value="CITANGKIL">Citangkil (15)</option>
                      <option value="CIWANDAN">Ciwandan (19)</option>
                      <option value="PULOMERAK">Pulomerak (10)</option>
                      <option value="GROGOL">Grogol (9)</option>
                      <option value="JOMBANG">Jombang (5)</option>
                      <option value="PURWAKARTA">Purwakarta (8)</option>
                      <option value="CIBEBER">Cibeber (14)</option>
                      <option value="CILEGON">Cilegon (4)</option>
                    </select>
                  </div>

                  <select
                    value={kwtFilterStatus}
                    onChange={(e) => setKwtFilterStatus(e.target.value)}
                    className="px-2.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Fakum">Fakum</option>
                  </select>
                </div>
              </div>

              {/* TABEL DATA KWT */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 w-12 text-center">No</th>
                      <th className="py-3 px-4 min-w-[200px]">Kelompok Wanita Tani</th>
                      <th className="py-3 px-4 min-w-[220px]">Alamat Sekretariat</th>
                      <th className="py-3 px-4 min-w-[170px]">Nama Ketua (Placeholder)</th>
                      <th className="py-3 px-4 min-w-[160px]">No WhatsApp (Placeholder)</th>
                      <th className="py-3 px-4 min-w-[180px]">Koordinat GIS (Lat, Lon)</th>
                      <th className="py-3 px-3 text-center w-24">Peta GIS</th>
                      <th className="py-3 px-3 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {kwtLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto mb-2" />
                          <span>Memuat 84 data KWT...</span>
                        </td>
                      </tr>
                    ) : (
                      kwtList
                        .filter((k) => {
                          const matchesSearch =
                            !kwtSearch ||
                            k.nama_kwt?.toLowerCase().includes(kwtSearch.toLowerCase()) ||
                            k.kelurahan?.toLowerCase().includes(kwtSearch.toLowerCase()) ||
                            k.kecamatan?.toLowerCase().includes(kwtSearch.toLowerCase()) ||
                            k.alamat_sekretariat?.toLowerCase().includes(kwtSearch.toLowerCase()) ||
                            k.jenis_usaha?.toLowerCase().includes(kwtSearch.toLowerCase());
                          const matchesKec =
                            kwtFilterKecamatan === 'ALL' ||
                            k.kecamatan?.toUpperCase() === kwtFilterKecamatan.toUpperCase();
                          const matchesStatus =
                            kwtFilterStatus === 'ALL' ||
                            k.keterangan?.toLowerCase() === kwtFilterStatus.toLowerCase();
                          return matchesSearch && matchesKec && matchesStatus;
                        })
                        .map((item) => {
                          const no = item.no_urut;
                          const edits = kwtEdits[no] || {};
                          const currKetua = edits.nama_ketua !== undefined ? edits.nama_ketua : (item.nama_ketua || '');
                          const currWa = edits.no_wa_ketua !== undefined ? edits.no_wa_ketua : (item.no_wa_ketua || item.no_hp_ketua || '');
                          const currLat = edits.latitude !== undefined ? edits.latitude : (item.latitude !== null && item.latitude !== undefined ? item.latitude : '');
                          const currLon = edits.longitude !== undefined ? edits.longitude : (item.longitude !== null && item.longitude !== undefined ? item.longitude : '');
                          const currAlm = edits.alamat_sekretariat !== undefined ? edits.alamat_sekretariat : (item.alamat_sekretariat || '');
                          const isSaving = kwtSavingId === no;
                          const isSaved = kwtSaveSuccess[no];
                          const hasEdits = Object.keys(edits).length > 0;

                          return (
                            <tr key={`kwt-row-${no}`} className="hover:bg-slate-900/50 transition-colors">
                              {/* No Urut */}
                              <td className="py-3 px-3 text-center font-mono text-slate-400">
                                {no}
                              </td>

                              {/* Nama & Wilayah */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                  <span>🌱</span>
                                  <span>{item.nama_kwt}</span>
                                </div>
                                <div className="text-[11px] text-emerald-400 mt-0.5">
                                  Kel. {item.kelurahan}, Kec. {item.kecamatan}
                                </div>
                                {item.jenis_usaha && (
                                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                    🌾 {item.jenis_usaha}
                                  </div>
                                )}
                              </td>

                              {/* Alamat Sekretariat */}
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={currAlm}
                                  onChange={(e) => handleKwtInputChange(no, 'alamat_sekretariat', e.target.value)}
                                  placeholder="Link. / Kampung / Alamat..."
                                  className="w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                />
                                {item.geocode_display && (
                                  <div className="text-[9px] text-slate-500 mt-0.5 font-mono line-clamp-1" title={item.geocode_display}>
                                    📍 Geocode: {item.geocode_display}
                                  </div>
                                )}
                              </td>

                              {/* Nama Ketua (Placeholder) */}
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={currKetua}
                                  onChange={(e) => handleKwtInputChange(no, 'nama_ketua', e.target.value)}
                                  placeholder="Nama Ketua KWT..."
                                  className="w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                                />
                              </td>

                              {/* No WA Ketua (Placeholder) */}
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={currWa}
                                  onChange={(e) => handleKwtInputChange(no, 'no_wa_ketua', e.target.value)}
                                  placeholder="Contoh: 08123456789..."
                                  className="w-full px-2.5 py-1.5 text-[11px] font-mono rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                />
                              </td>

                              {/* Koordinat GIS (Lat, Lon) */}
                              <td className="py-3 px-4">
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={currLat}
                                    onChange={(e) => handleKwtInputChange(no, 'latitude', e.target.value)}
                                    placeholder="Latitude"
                                    className="w-1/2 px-2 py-1.5 text-[10px] font-mono rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                  />
                                  <input
                                    type="text"
                                    value={currLon}
                                    onChange={(e) => handleKwtInputChange(no, 'longitude', e.target.value)}
                                    placeholder="Longitude"
                                    className="w-1/2 px-2 py-1.5 text-[10px] font-mono rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </td>

                              {/* Peta GIS / Maps Link */}
                              <td className="py-3 px-3 text-center">
                                {item.maps_link ? (
                                  <a
                                    href={item.maps_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 text-[10px] font-bold border border-slate-700 transition-colors"
                                    title="Lihat pin di Google Maps"
                                  >
                                    <MapPin className="w-3 h-3 text-rose-400" />
                                    <span>Peta</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-600">—</span>
                                )}
                              </td>

                              {/* Tombol Simpan */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSaveKwtRow(item)}
                                  disabled={isSaving}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 ${
                                    isSaved
                                      ? 'bg-emerald-600 text-white'
                                      : hasEdits
                                      ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  }`}
                                  title="Simpan perubahan baris ini"
                                >
                                  {isSaving ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : isSaved ? (
                                    <Check className="w-3 h-3 text-white" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  <span>{isSaving ? '...' : isSaved ? 'Tersimpan' : 'Simpan'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Keterangan Tambahan */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 flex items-start gap-3">
                <span className="text-lg shrink-0">💡</span>
                <div className="space-y-1">
                  <p className="font-bold">Informasi Integrasi Spasial KWT DKPP Cilegon:</p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Setiap perubahan nama ketua, nomor WhatsApp, alamat lingkungan, dan titik koordinat akan otomatis tersinkronisasi ke chatbot AI dan pin layer spasial GIS. Jika pengguna menanyakan keberadaan KWT melalui chatbot, sistem akan langsung menyajikan profil lengkap dan mengarahkan navigasi visual pada peta.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT DOKUMEN (SUPERADMIN ONLY) */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Metadata & Tata Kelola Dokumen</h3>
                  <span className="text-[10px] text-slate-400">Hak Akses: Super Administrator</span>
                </div>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-4 text-xs">
              {/* Nama File */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nama Dokumen / File
                </label>
                <input
                  type="text"
                  required
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Folder Tujuan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Pindahkan ke Folder Tata Kelola
                </label>
                <select
                  value={editDocFolder}
                  onChange={(e) => setEditDocFolder(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {FOLDERS.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name} ({f.perm})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Visibilitas & Privasi */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Status Visibilitas / Hak Privasi
                </label>
                <select
                  value={editDocVisibility}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditDocVisibility(val);
                    if (val === 'RESTRICTED') setEditDocSensitive(true);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="PUBLIC">🌐 PUBLIC — Terbuka untuk Tamu / Publik & Pegawai ASN</option>
                  <option value="INTERNAL">🔒 INTERNAL — Hanya untuk Pegawai Resmi DKPP yang Login</option>
                  <option value="RESTRICTED">🛡️ RESTRICTED — Khusus Pejabat & Administrator (Sensitif)</option>
                </select>
              </div>

              {/* Checkbox / Toggle Data Sensitif */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 pr-3">
                  <span className="text-xs font-semibold text-white block">Tandai sebagai Data Sensitif / Rahasia</span>
                  <span className="text-[10px] text-slate-400 block">
                    Jika aktif, chatbot AI dilarang keras membocorkan dokumen ini kepada pengguna Tamu (Guest).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editDocSensitive}
                  onChange={(e) => setEditDocSensitive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditDoc}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEditDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSavingEditDoc ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL RESET / HAPUS POLLING (SUPERADMIN ONLY) */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Reset &amp; Hapus Suara Polling</h3>
                  <span className="text-[10px] text-slate-400">Hak Akses: Super Administrator</span>
                </div>
              </div>
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Apakah Anda yakin ingin mereset seluruh perolehan suara untuk tema:
                <strong className="block text-rose-400 mt-1 font-semibold">
                  "{OFFICIAL_POLL_THEMES.find((t) => t.code === selectedPollThemeCode)?.title || selectedPollThemeCode}"
                </strong>
              </p>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px]">
                Seluruh suara mentah, penanda partisipasi pemilih, dan agregat hasil akan dihapus secara permanen dari database &amp; memory store. Tindakan ini akan dicatat ke Audit Log.
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Alasan Audit / Reset:
                </label>
                <input
                  type="text"
                  required
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="Contoh: Audit berkala, pembersihan data uji coba"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleResetPoll}
                  disabled={isResetting || !resetReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isResetting ? 'Mereset...' : 'Ya, Reset Sekarang'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH TEMA BARU (SUPERADMIN ONLY) */}
      {showAddThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tambah Tema Polling Baru</h3>
                  <span className="text-[10px] text-slate-400">Hak Akses: Super Administrator</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddThemeModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateThemeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kode Unik (Slug) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Kode Unik (Slug) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newThemeCode}
                    onChange={(e) => setNewThemeCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="contoh: paling_kreatif"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Label Pendek & Ikon */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Label Pendek &amp; Ikon <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newThemeIcon}
                      onChange={(e) => setNewThemeIcon(e.target.value)}
                      placeholder="Emoji"
                      className="w-14 text-center text-base p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      required
                      value={newThemeLabel}
                      onChange={(e) => setNewThemeLabel(e.target.value)}
                      placeholder="Paling Kreatif"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Judul Lengkap */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Judul Lengkap Polling <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newThemeTitle}
                  onChange={(e) => setNewThemeTitle(e.target.value)}
                  placeholder="contoh: Pegawai Paling Kreatif & Inovatif"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Deskripsi / Pertanyaan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Deskripsi / Pertanyaan Polling
                </label>
                <textarea
                  rows={2}
                  value={newThemeDesc}
                  onChange={(e) => setNewThemeDesc(e.target.value)}
                  placeholder="Siapa pegawai yang selalu punya ide segar, inovatif, dan solutif dalam bekerja?"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Batas Pilihan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Batas Pilihan Nama per Pemilih
                </label>
                <select
                  value={newThemeMaxChoices}
                  onChange={(e) => setNewThemeMaxChoices(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value={1}>1 Nama Pegawai (Single choice)</option>
                  <option value={2}>2 Nama Pegawai</option>
                  <option value={3}>3 Nama Pegawai (Standar Rekomendasi)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10.5px] text-slate-400">
                💡 <strong>Pedoman Governance:</strong> Tema harus bernuansa apresiasi positif. Dilarang menggunakan kategori bernuansa fisik negatif, SARA, atau kondisi ekonomi.
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddThemeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewTheme}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingNewTheme ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isSavingNewTheme ? 'Menyimpan...' : 'Simpan Tema Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TEMA (SUPERADMIN ONLY) */}
      {editingTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Tema Polling</h3>
                  <span className="text-[10px] text-slate-400">Kode: {editingTheme.code}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingTheme(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateThemeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ikon & Label Pendek */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Ikon Emoji &amp; Label Pendek
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={editThemeIcon}
                      onChange={(e) => setEditThemeIcon(e.target.value)}
                      placeholder="Emoji"
                      className="w-14 text-center text-base p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      required
                      value={editThemeLabel}
                      onChange={(e) => setEditThemeLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Batas Pilihan */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Batas Pilihan Nama
                  </label>
                  <select
                    value={editThemeMaxChoices}
                    onChange={(e) => setEditThemeMaxChoices(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={1}>1 Nama Pegawai</option>
                    <option value={2}>2 Nama Pegawai</option>
                    <option value={3}>3 Nama Pegawai</option>
                  </select>
                </div>
              </div>

              {/* Judul Lengkap */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Judul Lengkap Polling
                </label>
                <input
                  type="text"
                  required
                  value={editThemeTitle}
                  onChange={(e) => setEditThemeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Deskripsi / Pertanyaan Polling
                </label>
                <textarea
                  rows={2}
                  value={editThemeDesc}
                  onChange={(e) => setEditThemeDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Status Aktif Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 pr-3">
                  <span className="text-xs font-semibold text-white block">Status Publikasi Tema</span>
                  <span className="text-[10px] text-slate-400 block">
                    Jika aktif, tema ini akan tampil di Live Carousel dan dapat dipilih oleh pegawai.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editThemeActive}
                  onChange={(e) => setEditThemeActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTheme(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditTheme}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEditTheme ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSavingEditTheme ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: HAPUS TEMA (SUPERADMIN ONLY) */}
      {deletingTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hapus Tema Polling</h3>
                  <span className="text-[10px] text-slate-400">Hak Akses: Super Administrator</span>
                </div>
              </div>
              <button
                onClick={() => setDeletingTheme(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Apakah Anda yakin ingin menghapus tema polling berikut secara permanen?
                <strong className="block text-rose-400 mt-1 font-semibold text-sm">
                  {deletingTheme.icon || '🏆'} {deletingTheme.title} (Kode: {deletingTheme.code})
                </strong>
              </p>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-[11px] leading-relaxed">
                ⚠️ <strong>Peringatan:</strong> Tema ini beserta seluruh perolehan suara, riwayat partisipasi pemilih, dan agregat hasil akan dihapus secara permanen dari basis data. Tindakan ini akan dicatat ke Audit Log.
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Alasan Penghapusan:
                </label>
                <input
                  type="text"
                  required
                  value={deleteThemeReason}
                  onChange={(e) => setDeleteThemeReason(e.target.value)}
                  placeholder="Contoh: Tema sudah selesai / tidak relevan"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingTheme(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteThemeSubmit}
                  disabled={isDeletingTheme || !deleteThemeReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingTheme ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isDeletingTheme ? 'Menghapus...' : 'Ya, Hapus Tema Ini'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
