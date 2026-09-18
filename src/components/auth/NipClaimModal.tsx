'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Shield, UserCheck, Sparkles, Building, Briefcase } from 'lucide-react';
import { UserProfile } from '@/types/dkpp';
import { supabase } from '@/lib/supabase';

interface NipClaimModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

export const NipClaimModal: React.FC<NipClaimModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  const [nip, setNip] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [verifiedData, setVerifiedData] = useState<{
    nama?: string;
    jabatan?: string;
    bidang?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleVerifyNip = async () => {
    const cleanNip = nip.trim().replace(/\s+/g, '');
    if (!cleanNip) {
      setErrorMsg('Silakan ketik 18 digit NIP resmi Anda.');
      setVerifiedData(null);
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/verify-nip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: cleanNip }),
      });
      const data = await res.json();
      if (data.valid) {
        setVerifiedData({
          nama: data.nama,
          jabatan: data.jabatan,
          bidang: data.bidang,
        });
        setErrorMsg(null);
      } else {
        setVerifiedData(null);
        setErrorMsg(data.error || 'NIP tidak terdaftar dalam database resmi Pegawai DKPP Kota Cilegon.');
      }
    } catch {
      setErrorMsg('Gagal memverifikasi NIP. Pastikan jaringan internet aktif.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyClaim = async () => {
    if (!verifiedData) return;
    setIsSaving(true);
    setErrorMsg(null);

    const cleanNip = nip.trim().replace(/\s+/g, '');
    const updatedProfile: UserProfile = {
      ...user,
      role: 'EMPLOYEE',
      is_verified_employee: true,
      can_access_sensitive: true,
      nip: cleanNip,
      full_name: verifiedData.nama || user.full_name,
      department: verifiedData.bidang || 'DKPP Kota Cilegon',
      position: verifiedData.jabatan,
    };

    try {
      // Simpan ke metadata Supabase auth jika user login via Supabase
      try {
        await supabase.auth.updateUser({
          data: {
            nip: cleanNip,
            full_name: updatedProfile.full_name,
            role: 'EMPLOYEE',
            is_verified: true,
            department: updatedProfile.department,
            position: updatedProfile.position,
          },
        });
      } catch {}

      try {
        localStorage.setItem('dkpp_user_session', JSON.stringify(updatedProfile));
        sessionStorage.setItem('dkpp_user_session', JSON.stringify(updatedProfile));
      } catch {}
      onSuccess(updatedProfile);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menyimpan klaim NIP.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative z-[100000] w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200 text-gray-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center pt-1 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#A8DCAB] flex items-center justify-center text-emerald-950 shadow-sm mb-3">
            <Shield className="w-6 h-6 text-emerald-800" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Klaim NIP Pegawai DKPP
          </h2>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-sm">
            Akun Google <span className="font-semibold text-gray-700">{user.email || 'Anda'}</span> saat ini berstatus <strong>User Umum (Non-Pegawai)</strong>. Masukkan NIP resmi Anda untuk membuka akses <strong>data internal, polling, & dokumen DKPP</strong>.
          </p>
        </div>

        {/* Input NIP Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nomor Induk Pegawai (18 Digit)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="18 digit"
                value={nip}
                maxLength={24}
                onChange={(e) => {
                  setNip(e.target.value);
                  setVerifiedData(null);
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVerifyNip();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyNip}
                disabled={isValidating || !nip.trim()}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              >
                {isValidating ? 'Mengecek...' : 'Cek NIP'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Verified Data Preview Card */}
          {verifiedData && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 text-xs text-emerald-950 space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NIP Terdaftar & Terverifikasi</span>
              </div>
              <div className="pt-1 text-gray-800 space-y-1 pl-5">
                <div><strong>Nama:</strong> {verifiedData.nama}</div>
                <div><strong>Jabatan:</strong> {verifiedData.jabatan}</div>
                <div><strong>Bidang:</strong> {verifiedData.bidang}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleApplyClaim}
              disabled={!verifiedData || isSaving}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Klaim & Aktifkan Akses Sensitif'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer text-center"
            >
              Nanti Saja (Tetap Akses Umum)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
