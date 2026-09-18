import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ThemeCatalog } from '@/components/polling/ThemeCatalog';
import { PollTheme } from '@/lib/polling/types';
import { FiChevronLeft } from 'react-icons/fi';

export const revalidate = 0; // Dynamic

export default async function PollingCatalogPage() {
  const { data: polls } = await supabase
    .from('polls')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  const themes: PollTheme[] = polls || [];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
            <span>Kembali ke ChatDKPP</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Polling Interaktif
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        <ThemeCatalog themes={themes} />
      </main>
    </div>
  );
}
