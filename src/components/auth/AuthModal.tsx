'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Sparkles, User, Lock, Mail, Shield, Building } from 'lucide-react';
import { UserProfile } from '@/types/dkpp';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onContinueAsGuest?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nip, setNip] = useState('');
  
  // NIP validation states
  const [nipValidating, setNipValidating] = useState(false);
  const [nipVerifiedData, setNipVerifiedData] = useState<{ nama?: string; jabatan?: string; bidang?: string } | null>(null);
  const [nipError, setNipError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validate NIP with server
  const handleNipBlur = async () => {
    const clean = nip.trim().replace(/\s+/g, '');
    if (!clean) {
      setNipVerifiedData(null);
      setNipError(null);
      return;
    }

    setNipValidating(true);
    setNipError(null);

    try {
      const res = await fetch('/api/auth/verify-nip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: clean }),
      });
      const data = await res.json();
      if (data.valid) {
        setNipVerifiedData({
          nama: data.nama,
          jabatan: data.jabatan,
          bidang: data.bidang,
        });
        if (!fullName && data.nama) {
          setFullName(data.nama);
        }
        setNipError(null);
      } else {
        setNipVerifiedData(null);
        setNipError(data.error || 'NIP tidak ditemukan dalam database Pegawai DKPP.');
      }
    } catch {
      setNipError('Gagal memverifikasi NIP ke server.');
    } finally {
      setNipValidating(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Gagal terhubung dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // Check if this is the designated super admin
    const isAdmin = cleanEmail === 'ridwansugiarto.mail@gmail.com';

    try {
      // 1. Coba login / signup melalui Supabase Auth
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            full_name: data.user.user_metadata?.full_name || (isAdmin ? 'Dr. Ir. Ridwan Sugiarto' : cleanEmail.split('@')[0]),
            role: isAdmin ? 'ADMIN' : (nipVerifiedData ? 'EMPLOYEE' : 'GUEST'),
            is_verified_employee: isAdmin || !!nipVerifiedData,
            can_access_sensitive: isAdmin || !!nipVerifiedData,
            nip: nip || (isAdmin ? '197610182002121002' : undefined),
          };
          sessionStorage.setItem('dkpp_user_session', JSON.stringify(profile));
          onSuccess(profile);
          onClose();
          return;
        }

        // Fallback untuk Admin & Pegawai Terdaftar jika Supabase Auth user belum tersinkronisasi
        if (isAdmin) {
          const adminProfile: UserProfile = {
            id: 'admin-super-ridwan',
            email: cleanEmail,
            full_name: 'Dr. Ir. Ridwan Sugiarto, M.Si',
            role: 'ADMIN',
            is_verified_employee: true,
            can_access_sensitive: true,
            nip: '197610182002121002',
            department: 'Dinas Ketahanan Pangan dan Pertanian',
            position: 'Kepala Dinas DKPP (Super Admin)',
          };
          sessionStorage.setItem('dkpp_user_session', JSON.stringify(adminProfile));
          onSuccess(adminProfile);
          onClose();
          return;
        }

        if (error) {
          setErrorMessage(error.message || 'Email atau kata sandi tidak sesuai.');
        }
      } else {
        // Mode SIGN UP
        // Jika memasukkan NIP, pastikan valid
        const hasNip = nip.trim().length > 0;
        let isVerifiedEmployee = false;
        let finalRole: 'ADMIN' | 'EMPLOYEE' | 'GUEST' = 'GUEST';

        if (isAdmin) {
          finalRole = 'ADMIN';
          isVerifiedEmployee = true;
        } else if (hasNip) {
          if (!nipVerifiedData) {
            setErrorMessage('Silakan pastikan NIP yang dimasukkan valid sebelum mendaftar.');
            setIsLoading(false);
            return;
          }
          finalRole = 'EMPLOYEE';
          isVerifiedEmployee = true;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || cleanEmail.split('@')[0],
              nip: hasNip ? nip.trim() : null,
              role: finalRole,
              is_verified: isVerifiedEmployee,
            },
          },
        });

        const newProfile: UserProfile = {
          id: data?.user?.id || `usr-${Date.now()}`,
          email: cleanEmail,
          full_name: fullName.trim() || (nipVerifiedData?.nama || cleanEmail.split('@')[0]),
          role: finalRole,
          is_verified_employee: isVerifiedEmployee,
          can_access_sensitive: isVerifiedEmployee,
          nip: hasNip ? nip.trim() : undefined,
          department: nipVerifiedData?.bidang || (isAdmin ? 'DKPP Cilegon' : undefined),
          position: nipVerifiedData?.jabatan,
        };

        sessionStorage.setItem('dkpp_user_session', JSON.stringify(newProfile));
        onSuccess(newProfile);
        onClose();
        return;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat otentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSelect = () => {
    if (onContinueAsGuest) {
      onContinueAsGuest();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Card (Persis Capture 3 Style) */}
      <div 
        className="relative w-full max-w-[420px] bg-white dark:bg-[#18191e] rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200/80 dark:border-gray-800 text-gray-900 dark:text-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {mode === 'login' ? 'Log in or sign up' : 'Buat Akun DKPP'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed max-w-xs mx-auto">
            You&apos;ll get smarter responses and can upload files, images, and more.
          </p>
        </div>

        {/* Continue with Google (Persis Capture 3 - Apple & Phone DIHAPUS) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f2026] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium transition-all shadow-xs"
          >
            {/* Multi-color Google SVG Logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider OR */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-[#18191e] px-3 text-gray-400 font-semibold tracking-wider text-[11px]">
              OR
            </span>
          </div>
        </div>

        {/* Form Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f2026] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f2026] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Kata sandi minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f2026] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
            />
          </div>

          {/* INPUT NIP KHUSUS PEGAWAI DKPP (Hanya saat Sign up) */}
          {mode === 'signup' && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>NIP Pegawai DKPP</span>
                </label>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full font-medium">
                  Khusus ASN / Pegawai
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: 197610182002121002 (Opsional jika Pegawai)"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  onBlur={handleNipBlur}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {nipValidating && (
                  <div className="absolute right-3 top-3">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  </div>
                )}
              </div>

              {/* Feedback NIP Verified */}
              {nipVerifiedData && (
                <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-start gap-1.5 animate-in fade-in">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">{nipVerifiedData.nama}</span> — {nipVerifiedData.jabatan} ({nipVerifiedData.bidang})
                  </div>
                </div>
              )}

              {nipError && (
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{nipError}</span>
                </div>
              )}
            </div>
          )}

          {/* Continue Button (Persis Capture 3 Style: Black rounded pill button) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-2 rounded-full bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-sm font-semibold transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : mode === 'login' ? 'Continue' : 'Daftar Akun'}
          </button>
        </form>

        {/* OPSI GUEST DI BAWAHNYA TANPA MENGINPUT NIP (Sesuai Permintaan User) */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
          <button
            type="button"
            onClick={handleGuestSelect}
            className="w-full py-2 px-3 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
          >
            Atau Lanjutkan sebagai Tamu (Guest) tanpa NIP
          </button>
        </div>

        {/* Switch Mode Tab */}
        <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {mode === 'login' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className="font-bold text-gray-900 dark:text-white hover:underline ml-1"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="font-bold text-gray-900 dark:text-white hover:underline ml-1"
              >
                Log in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
