'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  User,
  Wallet,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  Waves,
  Ship,
  Sparkles,
} from 'lucide-react';
import type { CooperativePanelData } from '@/types/cooperative';

interface KoperasiChatPanelProps {
  data: CooperativePanelData;
  onSendMessage?: (msg: string) => void;
}

export function KoperasiChatPanel({ data, onSendMessage }: KoperasiChatPanelProps) {
  const { is_officer, is_verified_member, officer_role, is_disambiguation } = data;
  const isBendahara = officer_role === 'bendahara' || officer_role === 'admin';

  // 1. Tampilan Mode Disambiguasi (Jika user bertanya "koperasi", "lihat koperasi", dsb secara umum)
  if (is_disambiguation) {
    return (
      <div className="mt-3 w-full max-w-full animate-in fade-in duration-200">
        <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-white">
          {/* Top gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600" />

          <div className="p-4 sm:p-5">
            {/* Header Disambiguasi */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center shadow-xs text-white shrink-0">
                <HelpCircle className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Pilih Lingkup Koperasi DKPP Kota Cilegon
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Terdapat 2 jenis entitas koperasi, silakan pilih yang Anda tuju:
                </p>
              </div>
            </div>

            {/* Dua Pilihan Kartu Interaktif */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Pilihan 1: Koperasi Nelayan & Kelembagaan Pelaku Utama */}
              <div
                onClick={() => {
                  if (onSendMessage) {
                    onSendMessage('jelaskan data resmi koperasi nelayan dan kelembagaan binaan dkpp kota cilegon');
                  }
                }}
                className="group p-4 rounded-xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                      <Waves className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">
                      Publik & Nelayan
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                    1. Koperasi Nelayan &amp; Pelaku Utama
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Data 3 Koperasi Nelayan resmi, 58 KUB Nelayan Tangkap, 28 Pokdakan, dan 17 Poklashar di 9 pangkalan nelayan Kota Cilegon.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-teal-200/60 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-900">
                  <span>Lihat Data Nelayan</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Pilihan 2: Koperasi Pegawai DKPP (Internal) */}
              <Link
                href="/koperasi/anggota"
                className="group p-4 rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                      Internal Pegawai
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                    2. Koperasi Pegawai DKPP (KSP)
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Layanan simpan pinjam internal pegawai resmi DKPP, cek simpanan, pengajuan pinjaman, dan jadwal cicilan gaji/TPP.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-blue-200/60 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-900">
                  <span>Buka Dashboard Pegawai</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Klik salah satu pilihan di atas untuk menampilkan informasi yang sesuai.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Tampilan Mode Koperasi Pegawai DKPP Eksplisit
  return (
    <div className="mt-3 w-full max-w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-white">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0B1E41] via-blue-600 to-emerald-500" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1E41] to-blue-700 flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Koperasi Pegawai DKPP Kota Cilegon
              </h3>
              <p className="text-[11px] text-slate-500">Layanan keuangan internal pegawai:</p>
            </div>
          </div>

          {/* Tidak terdaftar sebagai anggota */}
          {!is_verified_member && !is_officer && (
            <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/80">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                NIP Anda belum terdaftar sebagai anggota koperasi. Hubungi pengurus untuk pendaftaran.
              </p>
            </div>
          )}

          {/* Terdaftar sebagai anggota */}
          {is_verified_member && (
            <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[10.5px] font-medium text-emerald-800">
                Terverifikasi sebagai Anggota Koperasi Pegawai
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* Dashboard Anggota */}
            <Link
              href="/koperasi/anggota"
              className="flex items-center justify-between w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/40 transition-all group active:scale-[0.99] shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <User className="w-4 h-4 text-blue-700" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                    👤 Dashboard Anggota
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Simpanan, pinjaman, cicilan &amp; pengajuan
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </Link>

            {/* Dashboard Pengurus — hanya tampil jika officer */}
            {is_officer && (
              <Link
                href="/koperasi/pengurus"
                className="flex items-center justify-between w-full p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 transition-all group active:scale-[0.99] shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                      🏦 Dashboard Pengurus
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Monitoring keuangan &amp; manajemen anggota
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              </Link>
            )}

            {/* Panel Bendahara — hanya untuk bendahara/admin */}
            {isBendahara && (
              <Link
                href="/koperasi/bendahara"
                className="flex items-center justify-between w-full p-3.5 rounded-xl border border-amber-200/80 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50 transition-all group active:scale-[0.99] shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Wallet className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                      💰 Panel Bendahara
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Input data, arus kas, &amp; pengaturan koperasi
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors shrink-0" />
              </Link>
            )}
          </div>

          {/* Quick link to Koperasi Nelayan */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Mencari data Koperasi Nelayan?</span>
            <button
              type="button"
              onClick={() => {
                if (onSendMessage) {
                  onSendMessage('jelaskan data resmi koperasi nelayan dan kelembagaan binaan dkpp kota cilegon');
                }
              }}
              className="text-teal-700 hover:text-teal-900 font-semibold hover:underline cursor-pointer"
            >
              Lihat Koperasi Nelayan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
