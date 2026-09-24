'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PollTheme } from '@/lib/polling/types';
import { validateThemeGovernance } from '@/lib/polling/guards';
import { FiPlus, FiBarChart2, FiAlertTriangle, FiCheck, FiX, FiEdit2, FiSave } from 'react-icons/fi';

export default function AdminPollingDashboardPage() {
  const [polls, setPolls] = useState<PollTheme[]>([]);
  const [loading, setLoading] = useState(true);

  // --- State: Buat Tema Baru ---
  const [isCreating, setIsCreating] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formIcon, setFormIcon] = useState('🏆');
  const [formDesc, setFormDesc] = useState('');
  const [govWarning, setGovWarning] = useState<string | null>(null);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // --- State: Edit Tema ---
  const [editingPoll, setEditingPoll] = useState<PollTheme | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMaxChoices, setEditMaxChoices] = useState(3);
  const [editGovWarning, setEditGovWarning] = useState<string | null>(null);
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const editModalRef = useRef<HTMLDivElement>(null);

  const fetchPolls = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPolls(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Tutup modal edit dengan klik di luar
  useEffect(() => {
    if (!editingPoll) return;
    const handleOutside = (e: MouseEvent) => {
      if (editModalRef.current && !editModalRef.current.contains(e.target as Node)) {
        setEditingPoll(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [editingPoll]);

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    const gov = validateThemeGovernance(val, formDesc);
    if (!gov.valid) {
      setGovWarning(`Peringatan Governance: Judul mengandung kata sensitif "${gov.blockedWord}". Hindari kategori yang menyentuh fisik negatif, SARA, atau kondisi ekonomi.`);
    } else {
      setGovWarning(null);
    }
  };

  const handleEditTitleChange = (val: string) => {
    setEditTitle(val);
    const gov = validateThemeGovernance(val, editDesc);
    if (!gov.valid) {
      setEditGovWarning(`Peringatan Governance: Judul mengandung kata sensitif "${gov.blockedWord}".`);
    } else {
      setEditGovWarning(null);
    }
  };

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formTitle || !formLabel) return;

    const gov = validateThemeGovernance(formTitle, formDesc);
    if (!gov.valid) {
      alert(`Gagal membuat tema: Terdeteksi kata terlarang "${gov.blockedWord}". Silakan perbaiki judul.`);
      return;
    }

    try {
      const { data, error } = await supabase.from('polls').insert([{
        code: formCode.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        title: formTitle.trim(),
        short_label: formLabel.trim(),
        icon: formIcon.trim() || '🏆',
        description: formDesc.trim(),
        max_choices: 3,
        allow_self_vote: false,
        is_active: true
      }]).select().single();

      if (error) {
        setCreateMsg(`Error: ${error.message}`);
      } else {
        setCreateMsg('Tema polling berhasil dibuat!');
        setIsCreating(false);
        setFormCode('');
        setFormTitle('');
        setFormLabel('');
        setFormDesc('');
        fetchPolls();
      }
    } catch (err: any) {
      setCreateMsg(`Error: ${err.message}`);
    }
  };

  const handleOpenEdit = (poll: PollTheme) => {
    setEditingPoll(poll);
    setEditTitle(poll.title);
    setEditLabel(poll.short_label || '');
    setEditIcon(poll.icon || '🏆');
    setEditDesc(poll.description || '');
    setEditMaxChoices(poll.max_choices || 3);
    setEditGovWarning(null);
    setEditMsg(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoll || !editTitle.trim() || !editLabel.trim()) return;

    const gov = validateThemeGovernance(editTitle, editDesc);
    if (!gov.valid) {
      alert(`Gagal simpan: Terdeteksi kata terlarang "${gov.blockedWord}". Silakan perbaiki judul.`);
      return;
    }

    setEditSaving(true);
    setEditMsg(null);
    try {
      const { error } = await supabase
        .from('polls')
        .update({
          title: editTitle.trim(),
          short_label: editLabel.trim(),
          icon: editIcon.trim() || '🏆',
          description: editDesc.trim(),
          max_choices: editMaxChoices,
          // updated_at akan diisi oleh trigger di database
        })
        .eq('id', editingPoll.id);

      if (error) {
        setEditMsg(`Error: ${error.message}`);
      } else {
        setEditMsg('✅ Tema berhasil diperbarui!');
        await fetchPolls();
        // Tutup modal setelah 1 detik
        setTimeout(() => {
          setEditingPoll(null);
          setEditMsg(null);
        }, 1000);
      }
    } catch (err: any) {
      setEditMsg(`Error: ${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  const togglePollStatus = async (pollId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('polls')
      .update({ is_active: !currentStatus })
      .eq('id', pollId);

    if (!error) {
      fetchPolls();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-lg">
              📊
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Portal Tata Kelola Polling Pegawai</h1>
              <p className="text-xs text-slate-400">DKPP Kota Cilegon · Panel Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/polling"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              Lihat Tampilan Pegawai →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Daftar Tema Polling Internal</h2>
            <p className="text-xs text-gray-500">Kelola tema polling, pantau agregat suara, dan akses audit log keamanan.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isCreating ? <FiX className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
            <span>{isCreating ? 'Batal' : 'Buat Tema Baru'}</span>
          </button>
        </div>

        {createMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium">
            {createMsg}
          </div>
        )}

        {/* Form Create New Theme */}
        {isCreating && (
          <form onSubmit={handleCreateTheme} className="bg-white border-2 border-emerald-300 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <span>➕</span> Tambah Tema Polling Baru
              </h3>
              <p className="text-xs text-gray-500">Pastikan tema bernuansa apresiasi positif dan memenuhi pedoman tata kelola.</p>
            </div>

            {govWarning && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-start gap-2">
                <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{govWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kode Unik (Slug):</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="contoh: paling_santun"
                  className="w-full text-xs p-2.5 border rounded-xl border-gray-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Judul Lengkap:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="contoh: Pegawai Paling Santun & Ramah"
                  className="w-full text-xs p-2.5 border rounded-xl border-gray-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Label Pendek & Ikon:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="Emoji"
                    className="w-14 text-center text-base p-2 border rounded-xl border-gray-300"
                  />
                  <input
                    type="text"
                    required
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Paling Santun"
                    className="w-full text-xs p-2.5 border rounded-xl border-gray-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi / Pertanyaan Polling:</label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Siapa rekan kerja yang tuturnya paling santun dan ramah di kantor?"
                className="w-full text-xs p-2.5 border rounded-xl border-gray-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-300 text-xs font-semibold text-gray-600 rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Simpan Tema
              </button>
            </div>
          </form>
        )}

        {/* Table of Themes */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 divide-y divide-gray-200">
              <thead className="bg-gray-50/80 text-gray-900 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ikon</th>
                  <th className="py-3 px-4">Kode & Judul Polling</th>
                  <th className="py-3 px-4">Label Pendek</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Batas Pilihan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Memuat daftar tema polling...
                    </td>
                  </tr>
                ) : polls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Belum ada tema polling. Klik &ldquo;Buat Tema Baru&rdquo; untuk memulai.
                    </td>
                  </tr>
                ) : (
                  polls.map((poll) => (
                    <tr key={poll.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-xl">
                        {poll.icon || '🏆'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 text-sm">{poll.title}</p>
                        <p className="text-gray-400 text-[11px]">Kode: <code>{poll.code}</code></p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {poll.short_label || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => togglePollStatus(poll.id, poll.is_active)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] transition-colors cursor-pointer ${
                            poll.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {poll.is_active ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                          <span>{poll.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {poll.max_choices} Nama
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {/* Tombol Edit Tema */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(poll)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                          title="Edit judul, label, ikon, dan deskripsi tema ini"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <Link
                          href={`/admin/polling/${poll.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors"
                        >
                          <FiBarChart2 className="w-3.5 h-3.5" />
                          <span>Detail & Audit</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ============================================================
          MODAL EDIT TEMA POLLING
          Muncul sebagai overlay ketika tombol "Edit" diklik.
          ============================================================ */}
      {editingPoll && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            ref={editModalRef}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-gray-900 text-lg leading-tight flex items-center gap-2">
                  <span className="text-2xl">{editingPoll.icon || '🏆'}</span>
                  Edit Tema Polling
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kode: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-slate-700">{editingPoll.code}</code>
                  &nbsp;·&nbsp;Perubahan langsung tersinkron ke tampilan pegawai.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPoll(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Governance */}
            {editGovWarning && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-start gap-2">
                <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{editGovWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Judul Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Judul Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => handleEditTitleChange(e.target.value)}
                  placeholder="Pegawai Paling Sibuk"
                  className="w-full text-sm p-3 border rounded-xl border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <p className="text-[11px] text-gray-400 mt-1">Tampil di formulir polling dan kartu chat AI.</p>
              </div>

              {/* Label Pendek & Ikon */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Label Pendek & Ikon <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    placeholder="Emoji"
                    className="w-16 text-center text-xl p-2.5 border rounded-xl border-gray-300 focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="Paling Sibuk"
                    className="flex-1 text-sm p-3 border rounded-xl border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Label pendek tampil di kartu katalog dan pills suggestion chat (maks ~20 karakter).</p>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Deskripsi / Pertanyaan Polling
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Siapa pegawai paling sibuk dan produktif setiap harinya?"
                  className="w-full text-sm p-3 border rounded-xl border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                />
              </div>

              {/* Batas Pilihan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Batas Pilihan per Voter
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditMaxChoices(n)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm border transition-colors cursor-pointer ${
                        editMaxChoices === n
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="text-xs text-gray-500">nama per voter</span>
                </div>
              </div>

              {editMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  editMsg.startsWith('✅')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {editMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPoll(null)}
                  className="px-4 py-2.5 border border-gray-300 text-xs font-semibold text-gray-600 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <FiSave className="w-4 h-4" />
                  <span>{editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
