'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, User, Wallet, AlertCircle, ShieldCheck } from 'lucide-react';
import type { CooperativePanelData } from '@/types/cooperative';

interface KoperasiChatPanelProps {
  data: CooperativePanelData;
}

export function KoperasiChatPanel({ data }: KoperasiChatPanelProps) {
  const { is_officer, is_verified_member, officer_role } = data;
  const isBendahara = officer_role === 'bendahara' || officer_role === 'admin';

  return (
    <div className="mt-3 w-full max-w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-white">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0B1E41] via-blue-600 to-emerald-500" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1E41] to-blue-700 flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Koperasi Pegawai DKPP
              </h3>
              <p className="text-[11px] text-slate-500">Kota Cilegon — Pilih layanan:</p>
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
                Terverifikasi sebagai Anggota Koperasi
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
                    Simpanan, pinjaman, cicilan & pengajuan
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
                      Monitoring keuangan & manajemen anggota
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
                      Input data, arus kas, & pengaturan koperasi
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors shrink-0" />
              </Link>
            )}
          </div>

          {/* Footer disclaimer */}
          <p className="mt-3 text-[10px] text-slate-400 leading-relaxed text-center">
            Data keuangan hanya ditampilkan di halaman dashboard terautentikasi
          </p>
        </div>
      </div>
    </div>
  );
}
