'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Sparkles, User, Shield, Loader2, RefreshCw } from 'lucide-react';
import { UserProfile } from '@/types/dkpp';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onContinueAsGuest?: () => void;
  /** When true: guest hit the free message limit. Hide 'continue as guest' option. */
  guestLimitReached?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onContinueAsGuest,
  guestLimitReached = false,
}) => {
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
      await new Promise((resolve) => setTimeout(resolve, 2500));
      stopCloudWaitTimer();
      setErrorMessage(
        e.message || 'Koneksi ke Google OAuth terhambat. Silakan coba kembali.'
      );
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
      {/* Modal Card */}
      <div
        className="relative z-[100000] w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200 text-gray-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 mb-6">
          <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center select-none">
            <img
              src="/ikon-chatDKPP.png"
              alt="Chat DKPP"
              className="w-full h-full object-contain"
            />
          </div>

          {guestLimitReached ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
                <span>💬</span>
                <span>Batas chat tamu tercapai (2/2)</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Masuk via Gmail untuk Lanjut
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xs mx-auto">
                Masuk dengan akun Google untuk melanjutkan percakapan tanpa batas dan menyimpan riwayat analisis.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Masuk ke ChatDKPP
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xs mx-auto">
                Gunakan akun Google (Gmail) resmi Anda untuk mengakses asisten cerdas dan layanan dinas.
              </p>
            </>
          )}
        </div>

        {/* Single Primary Action: Continue with Google (Gmail) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-gray-300 bg-white hover:bg-gray-50 active:scale-[0.99] text-gray-800 text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            {/* Multi-color Google SVG Logo */}
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span>{isLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google (Gmail)'}</span>
          </button>
        </div>

        {/* Status Menghubungkan ke Cloud Server */}
        {isCloudConnecting && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900 animate-in fade-in duration-200">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Membuka portal autentikasi Google...</span>
            </div>
          </div>
        )}

        {/* Form Error Alert */}
        {errorMessage && !isCloudConnecting && (
          <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Coba Hubungkan Ulang</span>
            </button>
          </div>
        )}

        {/* Role & Verification Explanation Box */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Struktur Akses Akun:</span>
          </div>
          <p>
            • <strong>User Umum (Non-Pegawai):</strong> Akun Gmail yang telah masuk namun belum/tidak memiliki NIP pegawai DKPP.
          </p>
          <p>
            • <strong>Pegawai DKPP:</strong> Akun Gmail yang telah memverifikasi NIP pada master pegawai aktif dinas.
          </p>
          <p>
            • <strong>Tamu (Guest):</strong> Pengunjung yang belum masuk via akun Gmail.
          </p>
        </div>

        {/* Guest Option (Hanya jika belum limit) */}
        {!guestLimitReached && onContinueAsGuest && (
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={handleGuestSelect}
              className="w-full py-2.5 px-4 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
            >
              Lanjutkan sebagai Tamu (Belum Masuk Akun)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
