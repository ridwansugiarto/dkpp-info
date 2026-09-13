'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Sparkles, User, Lock, Mail, Shield, Building, Loader2, RefreshCw } from 'lucide-react';
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
  const [isCloudConnecting, setIsCloudConnecting] = useState(false);
  const [cloudCountdown, setCloudCountdown] = useState(6);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startCloudWaitTimer = (durationSeconds = 6) => {
    setIsCloudConnecting(true);
    setCloudCountdown(durationSeconds);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    const startTime = Date.now();
    countdownTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      setCloudCountdown(remaining);
      if (remaining <= 0 && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }, 1000);
  };

  const stopCloudWaitTimer = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsCloudConnecting(false);
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

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
      setErrorMessage(null);
      startCloudWaitTimer(6);

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }
    } catch (e: any) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      stopCloudWaitTimer();
      setErrorMessage(
        e.message || 'Koneksi ke Google OAuth terhambat. Anda dapat masuk menggunakan Email dan Kata Sandi di bawah.'
      );
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLoginWithCloudWait();
  };

  const executeLoginWithCloudWait = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    startCloudWaitTimer(6);

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === 'ridwansugiarto.mail@gmail.com';
    const minGracePeriod = new Promise((resolve) => setTimeout(resolve, 5500));

    try {
      // 1. Mode LOGIN
      if (mode === 'login') {
        // Percobaan 1: Supabase signInWithPassword
        let authResult = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        // Jika cold start atau error network pada percobaan pertama, coba retry otomatis setelah jeda 1.5 detik
        if (
          authResult.error &&
          (authResult.error.message.toLowerCase().includes('fetch') ||
            authResult.error.status === 504 ||
            authResult.error.status === 502)
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          authResult = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
        }

        // Coba server-side fallback ke /api/auth/login jika klien browser terhalang jaringan
        if (authResult.error && isAdmin) {
          try {
            const apiRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail, password }),
            });
            const apiData = await apiRes.json();
            if (apiData.success && apiData.user) {
              stopCloudWaitTimer();
              try {
                localStorage.setItem('dkpp_user_session', JSON.stringify(apiData.user));
                sessionStorage.setItem('dkpp_user_session', JSON.stringify(apiData.user));
              } catch {}
              onSuccess(apiData.user);
              onClose();
              return;
            }
          } catch {}
        }

        if (!authResult.error && authResult.data?.user) {
          const u = authResult.data.user;
          const savedNip = u.user_metadata?.nip || nip || (isAdmin ? '197610182002121002' : undefined);
          let isVerified = isAdmin || !!savedNip;
          let finalFullName =
            u.user_metadata?.full_name ||
            (isAdmin ? 'Dr. Ir. Ridwan Sugiarto, M.Si' : cleanEmail.split('@')[0]);

          const profile: UserProfile = {
            id: u.id,
            email: cleanEmail,
            full_name: finalFullName,
            role: isAdmin ? 'ADMIN' : (isVerified ? 'EMPLOYEE' : 'GUEST'),
            is_verified_employee: isVerified,
            can_access_sensitive: isVerified,
            nip: savedNip,
            department: isAdmin ? 'Dinas Ketahanan Pangan dan Pertanian' : undefined,
            position: isAdmin ? 'Kepala Dinas DKPP (Super Admin)' : undefined,
          };

          stopCloudWaitTimer();
          try {
            localStorage.setItem('dkpp_user_session', JSON.stringify(profile));
            sessionStorage.setItem('dkpp_user_session', JSON.stringify(profile));
          } catch {}
          onSuccess(profile);
          onClose();
          return;
        }

        // Fallback langsung untuk Super Admin
        if (isAdmin && password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'cilegon2026')) {
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
          stopCloudWaitTimer();
          try {
            localStorage.setItem('dkpp_user_session', JSON.stringify(adminProfile));
            sessionStorage.setItem('dkpp_user_session', JSON.stringify(adminProfile));
          } catch {}
          onSuccess(adminProfile);
          onClose();
          return;
        }

        // Tunggu penuh 5-7 detik sebelum menampilkan pesan eror
        await minGracePeriod;
        stopCloudWaitTimer();
        if (authResult.error) {
          setErrorMessage(authResult.error.message || 'Email atau kata sandi tidak sesuai.');
        } else {
          setErrorMessage('Server cloud belum merespons setelah 5–7 detik. Silakan coba hubungkan ulang.');
        }
      } else {
        // Mode SIGN UP
        const hasNip = nip.trim().length > 0;
        let isVerifiedEmployee = false;
        let finalRole: 'ADMIN' | 'EMPLOYEE' | 'GUEST' = 'GUEST';

        if (isAdmin) {
          finalRole = 'ADMIN';
          isVerifiedEmployee = true;
        } else if (hasNip) {
          if (!nipVerifiedData) {
            await minGracePeriod;
            stopCloudWaitTimer();
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

        if (error) {
          await minGracePeriod;
          stopCloudWaitTimer();
          setErrorMessage(error.message || 'Gagal mendaftar ke server cloud.');
          setIsLoading(false);
          return;
        }

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

        stopCloudWaitTimer();
        try {
          localStorage.setItem('dkpp_user_session', JSON.stringify(newProfile));
          sessionStorage.setItem('dkpp_user_session', JSON.stringify(newProfile));
        } catch {}
        onSuccess(newProfile);
        onClose();
        return;
      }
    } catch (err: any) {
      await minGracePeriod;
      stopCloudWaitTimer();
      setErrorMessage(err.message || 'Terjadi kendala koneksi ke server cloud.');
    } finally {
      stopCloudWaitTimer();
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Card (Persis Capture 3 Style) */}
      <div 
        className="relative z-[100000] w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200 text-gray-900 animate-in zoom-in-95 duration-200"
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
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed max-w-xs mx-auto">
            Masuk untuk menyimpan riwayat analisis, sinkronisasi antar perangkat, dan respon yang lebih presisi.
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
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-300" />
            ) : (
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
            )}
            <span>{isLoading ? 'Menghubungkan...' : 'Continue with Google'}</span>
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

        {/* Status Menghubungkan ke Cloud Server (5-7 detik) */}
        {isCloudConnecting && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-200">
            <div className="relative shrink-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold flex items-center justify-between">
                <span>Menghubungkan ke Cloud Server...</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900/80 font-mono font-bold text-emerald-800 dark:text-emerald-200">
                  {cloudCountdown}d
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 leading-snug">
                Menunggu respon server cloud (5–7 detik untuk inisialisasi aman).
              </p>
            </div>
          </div>
        )}

        {/* Form Error Alert (Hanya muncul jika selesai menunggu atau gagal koneksi) */}
        {errorMessage && !isCloudConnecting && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-red-200/50 dark:border-red-900/40">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'login' && email) {
                    executeLoginWithCloudWait();
                  } else {
                    handleGoogleLogin();
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Coba Hubungkan Ulang</span>
              </button>
              {onContinueAsGuest && (
                <button
                  type="button"
                  onClick={handleGuestSelect}
                  className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-medium border border-gray-300 dark:border-gray-700 cursor-pointer transition-colors"
                >
                  Lanjut Mode Tamu
                </button>
              )}
            </div>
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
                  placeholder=""
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
                  khusus internal DKPP
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="18 digit"
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
            className="w-full py-2.5 px-4 text-xs font-semibold text-emerald-950 bg-[#A8DCAB] hover:bg-[#97cf9a] rounded-full transition-all shadow-xs cursor-pointer"
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
