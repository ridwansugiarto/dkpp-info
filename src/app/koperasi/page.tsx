'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  User,
  Shield,
  Coins,
  ArrowRight,
  Sparkles,
  Lock,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { KoperasiNavbar } from '@/components/koperasi/KoperasiNavbar';
import { UserProfile } from '@/types/dkpp';

export default function KoperasiRootPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardRole, setDashboardRole] = useState<string>('anggota');
  const [isOfficer, setIsOfficer] = useState(false);
  const [isBendahara, setIsBendahara] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dkpp_user_session') || sessionStorage.getItem('dkpp_user_session');
      if (saved) {
        const user = JSON.parse(saved);
        setCurrentUser(user);

        // Fetch user cooperative role
        fetch(
          `/api/koperasi/dashboard?userEmail=${encodeURIComponent(user.email || '')}&userId=${encodeURIComponent(
            user.id || ''
          )}&userNip=${encodeURIComponent(user.nip || '')}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.role) {
              setDashboardRole(data.role);
              setIsOfficer(data.role === 'pengurus' || data.role === 'bendahara');
              setIsBendahara(data.role === 'bendahara');
            }
          })
          .catch((err) => console.error(err))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memuat Portal Koperasi DKPP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <KoperasiNavbar
        currentUser={currentUser}
        officerRole={isOfficer ? dashboardRole : undefined}
        isBendahara={isBendahara}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold mb-4">
            <Building2 className="w-4 h-4" />
            Koperasi Pegawai DKPP Kota Cilegon
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Sistem Informasi & Manajemen Keuangan Koperasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
            Layanan keuangan digital terpadu untuk pegawai Dinas Ketahanan Pangan dan Pertanian Kota Cilegon.
            Simpanan transparan, simulasi pinjaman flat rate, dan pemantauan cicilan real-time.
          </p>
        </div>

        {/* Guest Gate */}
        {(!currentUser || currentUser.role === 'GUEST') && (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Akses Terbatas Pegawai DKPP</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Silakan login menggunakan akun Google atau verifikasi NIP Anda di aplikasi utama DKPP untuk
                mengakses data simpanan dan pengajuan pinjaman koperasi.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Masuk via Chat DKPP
            </Link>
          </div>
        )}

        {/* Authenticated Dashboard Choice Cards */}
        {currentUser && currentUser.role !== 'GUEST' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dashboard Anggota */}
            <Link
              href="/koperasi/anggota"
              className="group relative p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Semua Anggota
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Dashboard Anggota</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Cek saldo simpanan (pokok, wajib, sukarela), simulasi cicilan pinjaman, dan status potongan gaji.
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                Buka Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            {/* Dashboard Pengurus */}
            <Link
              href={isOfficer ? '/koperasi/pengurus' : '#'}
              onClick={(e) => {
                if (!isOfficer) {
                  e.preventDefault();
                  alert('Akses ini dikhususkan bagi Pengurus Koperasi.');
                }
              }}
              className={`group relative p-6 rounded-2xl bg-white border shadow-xs transition-all duration-300 flex flex-col justify-between ${
                isOfficer
                  ? 'border-slate-200/80 hover:border-emerald-500/80 hover:shadow-xl'
                  : 'opacity-60 border-slate-200 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Pengurus & Pengawas
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Panel Pengurus</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Verifikasi pengajuan pinjaman anggota, analisis kesehatan kredit, dan rekapitulasi portofolio.
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                {isOfficer ? (
                  <>Buka Panel Pengurus <ArrowRight className="w-4 h-4 ml-1" /></>
                ) : (
                  <span className="text-slate-400 font-normal">Khusus Pengurus</span>
                )}
              </div>
            </Link>

            {/* Panel Bendahara */}
            <Link
              href={isBendahara ? '/koperasi/bendahara' : '#'}
              onClick={(e) => {
                if (!isBendahara) {
                  e.preventDefault();
                  alert('Akses khusus Bendahara Koperasi.');
                }
              }}
              className={`group relative p-6 rounded-2xl bg-white border shadow-xs transition-all duration-300 flex flex-col justify-between ${
                isBendahara
                  ? 'border-slate-200/80 hover:border-amber-500/80 hover:shadow-xl'
                  : 'opacity-60 border-slate-200 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Coins className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Bendahara / Admin
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Panel Bendahara</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Pencairan dana pinjaman, pencatatan pembayaran cicilan, buku kas operasional, dan import Excel.
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                {isBendahara ? (
                  <>Buka Panel Bendahara <ArrowRight className="w-4 h-4 ml-1" /></>
                ) : (
                  <span className="text-slate-400 font-normal">Khusus Bendahara</span>
                )}
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
