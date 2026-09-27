'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KoperasiNavbar } from '@/components/koperasi/KoperasiNavbar';
import { KoperasiMemberDashboard } from '@/components/koperasi/KoperasiMemberDashboard';
import { UserProfile } from '@/types/dkpp';
import { AlertCircle, Lock, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function KoperasiAnggotaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (user: UserProfile) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/koperasi/dashboard?userEmail=${encodeURIComponent(user.email || '')}&userId=${encodeURIComponent(
          user.id || ''
        )}&userNip=${encodeURIComponent(user.nip || '')}`
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memuat data koperasi');
      }
      setDashboardData(json);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dkpp_user_session') || sessionStorage.getItem('dkpp_user_session');
      if (saved) {
        const user = JSON.parse(saved);
        if (user && user.role !== 'GUEST') {
          setCurrentUser(user);
          loadData(user);
          return;
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memuat Dashboard Anggota Koperasi...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role === 'GUEST') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Login Diperlukan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Anda harus masuk menggunakan akun Google atau verifikasi NIP terlebih dahulu untuk mengakses layanan
              Koperasi Pegawai DKPP Kota Cilegon.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Masuk ke Chat DKPP
          </Link>
        </div>
      </div>
    );
  }

  // Belum terdaftar sebagai anggota
  if (dashboardData && dashboardData.is_registered === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <KoperasiNavbar currentUser={currentUser} />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-16 flex items-center justify-center">
          <div className="w-full p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">NIP Belum Terdaftar di Koperasi</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                NIP Anda (<strong className="font-mono text-slate-700">{currentUser.nip || '-'}</strong>) belum tercatat
                sebagai anggota aktif Koperasi Pegawai DKPP Kota Cilegon.
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Silakan hubungi Bendahara atau Pengurus Koperasi untuk proses pendaftaran keanggotaan.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Chat DKPP
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOfficer = dashboardData?.role === 'pengurus' || dashboardData?.role === 'bendahara';
  const isBendahara = dashboardData?.role === 'bendahara';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <KoperasiNavbar
        currentUser={currentUser}
        officerRole={isOfficer ? dashboardData?.role : undefined}
        isBendahara={isBendahara}
        unreadCount={(dashboardData?.notifications || []).length}
        onRefresh={() => currentUser && loadData(currentUser)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => currentUser && loadData(currentUser)}
              className="font-bold underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        ) : (
          <KoperasiMemberDashboard
            memberData={dashboardData?.member}
            dashboardData={dashboardData?.dashboard}
            installments={dashboardData?.installments || []}
            savingsHistory={dashboardData?.savings_history || []}
            applications={dashboardData?.applications || []}
            settings={dashboardData?.settings || []}
            currentUser={currentUser}
            onRefresh={() => currentUser && loadData(currentUser)}
          />
        )}
      </main>
    </div>
  );
}
