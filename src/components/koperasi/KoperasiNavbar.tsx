'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  Bell,
  User,
  Shield,
  Wallet,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { UserProfile } from '@/types/dkpp';

interface KoperasiNavbarProps {
  currentUser: UserProfile | null;
  officerRole?: string;
  isBendahara?: boolean;
  unreadCount?: number;
  onRefresh?: () => void;
}

export function KoperasiNavbar({
  currentUser,
  officerRole,
  isBendahara = false,
  unreadCount = 0,
  onRefresh,
}: KoperasiNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);

  const fetchNotifs = async () => {
    if (!currentUser || currentUser.role === 'GUEST') return;
    setLoadingNotif(true);
    try {
      const res = await fetch(
        `/api/koperasi/notifications?userEmail=${encodeURIComponent(currentUser.email || '')}&userId=${encodeURIComponent(currentUser.id || '')}&userNip=${encodeURIComponent(currentUser.nip || '')}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotif(false);
    }
  };

  const markAllRead = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/koperasi/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userId: currentUser.id,
          userNip: currentUser.nip,
          mark_all: true,
        }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Kembali ke Asisten DKPP"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Chat DKPP</span>
            </Link>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B1E41] via-[#1E3A8A] to-[#10B981] flex items-center justify-center text-white shadow-sm ring-1 ring-black/5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 tracking-tight">
                    Koperasi Pegawai DKPP
                  </span>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    Kota Cilegon
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Sistem Informasi & Manajemen Keuangan Koperasi
                </p>
              </div>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <Link
              href="/koperasi/anggota"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                pathname.startsWith('/koperasi/anggota')
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard Anggota
            </Link>

            {(officerRole || isBendahara) && (
              <Link
                href="/koperasi/pengurus"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  pathname.startsWith('/koperasi/pengurus')
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Panel Pengurus
              </Link>
            )}

            {isBendahara && (
              <Link
                href="/koperasi/bendahara"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  pathname.startsWith('/koperasi/bendahara')
                    ? 'bg-white text-amber-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Panel Bendahara
              </Link>
            )}
          </nav>

          {/* Right: Actions & User Info */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Muat ulang data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifModal(!showNotifModal);
                  if (!showNotifModal) fetchNotifs();
                }}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Pemberitahuan"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifModal && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      Pemberitahuan Koperasi
                    </h4>
                    {notifications.length > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {loadingNotif ? (
                      <p className="text-xs text-slate-400 text-center py-4">Memuat...</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Tidak ada pemberitahuan baru.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            n.is_read
                              ? 'bg-slate-50/50 border-slate-100 text-slate-500'
                              : 'bg-blue-50/40 border-blue-100 text-slate-800 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Capsule */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                  {currentUser?.full_name || 'Pengguna'}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500">
                    {currentUser?.nip ? `NIP: ${currentUser.nip}` : currentUser?.role || 'Guest'}
                  </span>
                  {isBendahara ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                      Bendahara
                    </span>
                  ) : officerRole ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium">
                      {officerRole}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Subnav */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-100">
          <Link
            href="/koperasi/anggota"
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              pathname.startsWith('/koperasi/anggota')
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600'
            }`}
          >
            Anggota
          </Link>
          {(officerRole || isBendahara) && (
            <Link
              href="/koperasi/pengurus"
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                pathname.startsWith('/koperasi/pengurus')
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-slate-600'
              }`}
            >
              Pengurus
            </Link>
          )}
          {isBendahara && (
            <Link
              href="/koperasi/bendahara"
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                pathname.startsWith('/koperasi/bendahara')
                  ? 'bg-amber-50 text-amber-700 font-bold'
                  : 'text-slate-600'
              }`}
            >
              Bendahara
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
