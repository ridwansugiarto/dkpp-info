'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  MoreHorizontal, 
  Trash2, 
  Edit3, 
  Search, 
  PanelLeftClose,
  Shield,
  ShieldCheck, 
  UserCheck, 
  User,
  LogOut, 
  LogIn,
  Layers,
  Settings,
  Wheat,
  Pin,
  Archive,
  Share2,
  Check,
  AlertCircle
} from 'lucide-react';
import { ChatSession, UserProfile } from '@/types/dkpp';
import Link from 'next/link';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onPinSession?: (id: string) => void;
  onArchiveSession?: (id: string) => void;
  onShareSession?: (id: string) => void;
  user: UserProfile;
  isOpen: boolean;
  onToggleOpen: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onClaimNipClick?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onPinSession,
  onArchiveSession,
  onShareSession,
  user,
  isOpen,
  onToggleOpen,
  onLoginClick,
  onLogoutClick,
  onClaimNipClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      if (menuOpenId) setMenuOpenId(null);
    };
    if (menuOpenId) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [menuOpenId]);

  const filteredSessions = [...sessions]
    .filter((s) => !s.is_archived && s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onToggleOpen}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#f9fafb] dark:bg-[#17181c] border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200/70 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <img
                src="/ikon-chatDKPP.png"
                alt="Chat DKPP"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 text-base tracking-tight leading-tight">
                Chat DKPP
              </span>
              <span className="text-[10.5px] text-emerald-600 font-semibold tracking-wide">
                Cilegon AI Food Security
              </span>
              <span className="text-[8.5px] font-extrabold text-emerald-700/80 dark:text-emerald-400 uppercase tracking-widest leading-none mt-0.5">
                PROTOTYPE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {}}
              title="Cari riwayat"
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-800"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleOpen}
              title="Tutup sidebar"
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-800 md:hidden"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 border border-gray-200/80 dark:border-gray-700 shadow-sm transition-all duration-150"
          >
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>New chat</span>
          </button>
        </div>

        {/* Search in sessions if >= 4 */}
        {sessions.length > 4 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari sesi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2.5 py-1.5 pl-8 text-xs bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
            </div>
          </div>
        )}

        {/* Recent Sessions List (Max 10 per user) */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Recents ({sessions.length}/10)
          </div>

          {filteredSessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
              Belum ada percakapan. Mulai dengan tombol New Chat.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    menuOpenId === session.id ? 'z-30' : 'z-1'
                  } ${
                    isActive
                      ? 'bg-gray-200/90 dark:bg-gray-800 font-medium text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden w-full pr-14">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleSaveRename(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(session.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-full bg-white dark:bg-gray-900 px-1 py-0.5 text-xs rounded border border-emerald-500 focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  {/* Context Menu & Pin Action (Capture 2 Style) */}
                  {!isEditing && (
                    <div className="absolute right-2 flex items-center gap-1">
                      {session.is_pinned && (
                        <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600/20 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === session.id ? null : session.id);
                        }}
                        className={`p-1 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-300/60 dark:hover:bg-gray-700 transition-opacity cursor-pointer ${
                          isActive || menuOpenId === session.id
                            ? 'opacity-100'
                            : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                        }`}
                        title="Opsi percakapan"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu (Capture 2 Style) */}
                      {menuOpenId === session.id && (
                        <div
                          className="absolute right-0 top-7 z-[9999] w-40 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/90 dark:border-gray-700 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Share */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              if (onShareSession) {
                                onShareSession(session.id);
                              } else if (navigator.clipboard) {
                                navigator.clipboard.writeText(`${window.location.origin}?session=${session.id}`);
                                setToastMsg('Tautan disalin ke clipboard');
                                setTimeout(() => setToastMsg(null), 2500);
                              }
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5 text-gray-500" />
                            <span>Share</span>
                          </button>

                          {/* Rename */}
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(session, e)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                            <span>Rename</span>
                          </button>

                          <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

                          {/* Pin chat */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              if (onPinSession) onPinSession(session.id);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Pin className="w-3.5 h-3.5 text-gray-500" />
                            <span>{session.is_pinned ? 'Unpin chat' : 'Pin chat'}</span>
                          </button>

                          {/* Archive */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              if (onArchiveSession) onArchiveSession(session.id);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5 text-gray-500" />
                            <span>Archive</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              onDeleteSession(session.id);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User Status / Profile Footer: Guest vs Logged In */}
        {(!user.email || user.id === 'guest' || user.id.startsWith('guest_')) ? (
          /* Card saat Guest / Belum Login */
          <div className="p-3 border-t border-gray-200/70 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
              <h4 className="text-xs font-bold text-gray-900 mb-1 leading-snug">
                Personalisasi Jawaban Anda
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                Masuk untuk menyimpan riwayat chat, sinkronisasi antar perangkat, dan akses data ketahanan pangan resmi.
              </p>
              <button
                type="button"
                onClick={onLoginClick}
                className="w-full py-2 px-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors shadow-xs text-center block"
              >
                Log in
              </button>
            </div>

            {/* Kotak DISCLAIMER (PENAFIAN RESMI) */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-gray-50/90 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>DISCLAIMER</span>
              </div>
              <p className="text-[9.5px] leading-relaxed text-gray-500 dark:text-gray-400">
                Aplikasi ini <strong>bukan web app resmi Pemerintah Kota Cilegon</strong>, melainkan purwarupa <em>AI Chatbot</em> dengan tujuan mempermudah akses data dan informasi terkait ketahanan pangan serta pertanian di Kota Cilegon untuk pegawai internal, dan publik dengan pembatasan akses data tertentu.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-gray-200/70 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'DK'
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {user.full_name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {user.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-medium">
                        <ShieldCheck className="w-2.5 h-2.5" /> Super Admin
                      </span>
                    ) : user.is_verified_employee ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-medium">
                        <UserCheck className="w-2.5 h-2.5" /> Pegawai DKPP
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-medium">
                          <User className="w-2.5 h-2.5" /> User Umum
                        </span>
                        <button
                          type="button"
                          onClick={onClaimNipClick}
                          className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold hover:underline cursor-pointer border border-emerald-200 dark:border-emerald-800 transition-colors"
                          title="Verifikasi NIP Pegawai untuk membuka akses data internal & polling"
                        >
                          <Shield className="w-2.5 h-2.5" />
                          <span>Verif NIP</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    title="Portal Tata Kelola Admin"
                    className="p-1.5 text-gray-500 hover:text-emerald-600 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onLogoutClick}
                  title="Keluar / Ganti Akun"
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Kotak DISCLAIMER saat Logged In */}
            <div className="mt-2.5 p-2 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/70 dark:border-gray-700/60 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                <AlertCircle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>DISCLAIMER</span>
              </div>
              <p className="text-[9px] leading-tight text-gray-500 dark:text-gray-400">
                Aplikasi ini bukan web app resmi Pemkot Cilegon. AI Chatbot ini dikembangkan untuk mempermudah akses informasi pangan & pertanian bagi internal dan publik secara terukur.
              </p>
            </div>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMsg && (
          <div className="absolute bottom-16 left-3 right-3 z-50 py-2 px-3 bg-emerald-700 text-white rounded-xl text-center text-xs font-medium shadow-lg animate-in fade-in duration-150 flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-white" />
            <span>{toastMsg}</span>
          </div>
        )}
      </aside>
    </>
  );
};
