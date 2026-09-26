'use client';

import React, { useState, useMemo } from 'react';

interface EmployeeMediaAvatarProps {
  photoUrl?: string | null;
  nip?: string | null;
  employeeId?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rank?: number;
  className?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnhrdwfmwhglbrnzlxxv.supabase.co';
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/foto_pegawai/`;

// Ekstrak inisial nama bersih dari gelar (contoh: 'Rofiqoh, S.Sos' -> 'RS', 'Efa Sarifah, ST, MT' -> 'ES')
function getCleanInitials(fullName: string): string {
  if (!fullName) return 'DK';
  // Hapus gelar di belakang koma
  const rawName = fullName.split(',')[0].trim();
  const words = rawName.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const EmployeeMediaAvatar: React.FC<EmployeeMediaAvatarProps> = ({
  photoUrl,
  nip,
  employeeId,
  name,
  size = 'md',
  rank,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [attemptIndex, setAttemptIndex] = useState(0);

  const cleanNip = useMemo(() => (nip ? nip.replace(/\s+/g, '') : ''), [nip]);
  const cleanId = useMemo(() => (employeeId ? employeeId.trim() : ''), [employeeId]);

  // Daftar kandidat URL dari bucket foto_pegawai (mendukung jpg, png, gif, mp4)
  const candidateUrls = useMemo(() => {
    const list: string[] = [];

    if (photoUrl) {
      if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:')) {
        list.push(photoUrl);
      } else {
        list.push(`${STORAGE_BASE}${photoUrl.replace(/^foto_pegawai\//, '')}`);
      }
    }

    if (cleanNip) {
      list.push(`${STORAGE_BASE}${cleanNip}.jpg`);
      list.push(`${STORAGE_BASE}${cleanNip}.png`);
      list.push(`${STORAGE_BASE}${cleanNip}.gif`);
      list.push(`${STORAGE_BASE}${cleanNip}.mp4`);
    }

    if (cleanId) {
      list.push(`${STORAGE_BASE}${cleanId}.jpg`);
      list.push(`${STORAGE_BASE}${cleanId}.png`);
    }

    return list;
  }, [photoUrl, cleanNip, cleanId]);

  const currentMediaUrl = candidateUrls[attemptIndex] || null;
  const isVideo = currentMediaUrl?.toLowerCase().endsWith('.mp4');

  const initials = useMemo(() => getCleanInitials(name), [name]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 sm:w-8 sm:h-8 text-[11px]',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-xs',
    lg: 'w-10 h-10 sm:w-11 sm:h-11 text-sm',
  }[size];

  // Placeholder tema warna berdasarkan rank
  const rankPlaceholderStyle = useMemo(() => {
    if (rank === 1) {
      return 'bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-300 text-amber-950 border border-amber-300 shadow-2xs';
    }
    if (rank === 2) {
      return 'bg-gradient-to-br from-slate-100 via-slate-200 to-gray-300 text-slate-800 border border-slate-300 shadow-2xs';
    }
    if (rank === 3) {
      return 'bg-gradient-to-br from-orange-100 via-orange-200 to-amber-300 text-orange-950 border border-orange-300 shadow-2xs';
    }
    return 'bg-gradient-to-br from-emerald-50 via-teal-100 to-emerald-100 dark:from-slate-800 dark:to-slate-700 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-slate-700 shadow-2xs';
  }, [rank]);

  const handleMediaError = () => {
    if (attemptIndex < candidateUrls.length - 1) {
      setAttemptIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  // Jika tidak ada URL kandidat atau semua kandidat gagal dimuat, tampilkan placeholder avatar
  if (!currentMediaUrl || hasError) {
    return (
      <div
        title={`Foto ${name} (Folder: foto_pegawai)`}
        className={`relative ${sizeClasses} rounded-full flex items-center justify-center font-bold tracking-tight select-none shrink-0 overflow-hidden ${rankPlaceholderStyle} ${className}`}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <div
      title={`Foto ${name}`}
      className={`relative ${sizeClasses} rounded-full overflow-hidden shrink-0 border border-gray-200/80 dark:border-gray-700 bg-slate-100 dark:bg-slate-800 shadow-2xs ${className}`}
    >
      {isVideo ? (
        <video
          src={currentMediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onError={handleMediaError}
        />
      ) : (
        <img
          src={currentMediaUrl}
          alt={name}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={handleMediaError}
        />
      )}
    </div>
  );
};
