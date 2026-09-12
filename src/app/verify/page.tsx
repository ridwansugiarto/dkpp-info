'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, UserCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyPage() {
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nip }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Verifikasi pegawai gagal.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Terjadi kendala koneksi saat verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Chat DKPP</span>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Verifikasi Pegawai DKPP</h1>
            <p className="text-xs text-slate-400">Dinas Ketahanan Pangan dan Pertanian Cilegon</p>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pegawai Terverifikasi</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <p><span className="text-slate-400">Nama:</span> {result.full_name}</p>
                <p><span className="text-slate-400">Jabatan:</span> {result.position || 'Staf Teknis'}</p>
                <p><span className="text-slate-400">Instansi:</span> {result.department}</p>
                <p><span className="text-slate-400">Hak Akses:</span> <span className="font-semibold text-emerald-400">{result.role}</span></p>
              </div>
            </div>

            <Link
              href="/"
              className="w-full block py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-center text-sm transition-colors"
            >
              Lanjutkan ke Workspace DKPP
            </Link>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Resmi / Terdaftar
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@cilegon.go.id atau gmail"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nomor Induk Pegawai (NIP)
              </label>
              <input
                type="text"
                required
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="19761018..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Database...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi Hak Akses</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
