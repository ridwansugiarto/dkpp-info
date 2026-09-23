import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPollThemeByCodeOrId } from '@/lib/polling/store';
import { PollCard } from '@/components/polling/PollCard';
import { PollTheme } from '@/lib/polling/types';
import { FiChevronLeft, FiGrid } from 'react-icons/fi';

interface PageProps {
  params: Promise<{ code: string }>;
}

export const revalidate = 0; // Dynamic

export default async function PollDetailPage({ params }: PageProps) {
  const { code } = await params;

  const pollTheme = await getPollThemeByCodeOrId(code);
  if (!pollTheme) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/polling"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
            <span>Katalog Polling</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-emerald-700 transition-colors"
          >
            <FiGrid className="w-4 h-4" />
            <span>Beranda Chat</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 pt-6 flex flex-col items-center">
        <PollCard poll={pollTheme} />
      </main>
    </div>
  );
}
