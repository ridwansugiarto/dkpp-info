'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KoperasiNavbar } from '@/components/koperasi/KoperasiNavbar';
import { KoperasiOfficerDashboard } from '@/components/koperasi/KoperasiOfficerDashboard';
import { UserProfile } from '@/types/dkpp';
import { AlertCircle, Lock, ArrowLeft, RefreshCw, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function KoperasiPengurusPage() {
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
        throw new Error(json.error || 'Gagal memuat data pengurus koperasi');
      }

      // Verify officer role
      if (json.role !== 'pengurus' && json.role !== 'bendahara') {
        throw new Error('Akses khusus Pengurus atau Pengawas Koperasi.');
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
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memuat Panel Pengurus Koperasi...</p>
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
          <h3 className="text-sm font-bold text-slate-900">Login Diperlukan</h3>
          <p className="text-xs text-slate-500">
            Silakan login untuk mengakses Panel Pengurus Koperasi Pegawai DKPP.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Masuk ke Chat DKPP
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <KoperasiNavbar currentUser={currentUser} />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-16 flex items-center justify-center">
          <div className="w-full p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Akses Ditolak</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{error}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/koperasi/anggota"
                className="py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs"
              >
                Ke Dashboard Anggota
              </Link>
              <Link
                href="/"
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Chat DKPP
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isBendahara = dashboardData?.role === 'bendahara';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <KoperasiNavbar
        currentUser={currentUser}
        officerRole={dashboardData?.role}
        isBendahara={isBendahara}
        onRefresh={() => currentUser && loadData(currentUser)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <KoperasiOfficerDashboard
          officerData={dashboardData?.officer}
          dashboardKPI={dashboardData?.dashboard}
          pendingApplications={dashboardData?.pending_applications || []}
          loansMacet={dashboardData?.loans_macet || []}
          currentUser={currentUser}
          onRefresh={() => currentUser && loadData(currentUser)}
        />
      </main>
    </div>
  );
}
