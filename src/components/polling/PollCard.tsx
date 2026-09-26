'use client';

import React, { useState } from 'react';
import { PollTheme, Employee } from '@/lib/polling/types';
import { EmployeeAutocomplete } from './EmployeeAutocomplete';
import { SelectedEmployeeList } from './SelectedEmployeeList';
import { VoteSuccess } from './VoteSuccess';
import { LiveResults } from './LiveResults';
import { usePollResults } from '@/hooks/usePollResults';
import { FiChevronRight, FiAlertCircle } from 'react-icons/fi';

interface PollCardProps {
  poll: PollTheme;
  onExploreOther?: () => void;
  className?: string;
  defaultShowResults?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  onExploreOther,
  className = '',
  defaultShowResults = false,
}) => {
  const [selected, setSelected] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [showLiveResults, setShowLiveResults] = useState(defaultShowResults);

  React.useEffect(() => {
    if (defaultShowResults) {
      setShowLiveResults(true);
    }
  }, [defaultShowResults]);

  // Realtime results hook
  const { results, totalVotes, hasVoted, choicesCount, isGovernanceExempt, isRestricted, restrictedMessage, refresh } = usePollResults(poll.id, poll.code);

  const [userProfile, setUserProfile] = useState<{ email?: string; nip?: string } | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('dkpp_user_session') || sessionStorage.getItem('dkpp_user_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserProfile({ email: parsed.email, nip: parsed.nip });
      }
    } catch {}
  }, []);

  const isSuperAdmin = isGovernanceExempt || (
    userProfile?.email?.toLowerCase() === 'ridwansugiarto.mail@gmail.com' &&
    userProfile?.nip === '197610182002121002'
  );

  const maxChoices = poll.max_choices || 3;
  const isSelectedFull = selected.length >= maxChoices;
  const isVotedState = hasVoted || voteSubmitted;

  const handleSelect = (emp: Employee) => {
    if (selected.some((s) => s.id === emp.id)) return;
    if (selected.length < maxChoices) {
      setSelected([...selected, emp]);
      setErrorMessage(null);
    }
  };

  const handleRemove = (empId: string) => {
    setSelected(selected.filter((s) => s.id !== empId));
    setErrorMessage(null);
  };

  const handleSubmitVote = async () => {
    if (selected.length === 0) {
      setErrorMessage('Silakan pilih minimal 1 nama pegawai.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Get current user session from storage
      let userEmail = '';
      let userId = '';
      let userNip = '';
      try {
        const stored = localStorage.getItem('dkpp_user_session') || sessionStorage.getItem('dkpp_user_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          userEmail = parsed.email || '';
          userId = parsed.id || '';
          userNip = parsed.nip || '';
        }
      } catch {}

      const res = await fetch('/api/polling/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poll_id: poll.id,
          employee_ids: selected.map((s) => s.id),
          userEmail,
          userId,
          userNip,
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVoteSubmitted(true);
        // HANYA simpan ke cache lokal jika BUKAN superadmin
        if (!isSuperAdmin) {
          try {
            localStorage.setItem(`dkpp_voted_${poll.code}`, JSON.stringify({ count: selected.length, votedAt: Date.now() }));
            localStorage.setItem(`dkpp_voted_${poll.id}`, JSON.stringify({ count: selected.length, votedAt: Date.now() }));
          } catch {}
        }
        refresh();
      } else {
        if (data.error?.includes('ALREADY_VOTED')) {
          setErrorMessage('Anda sudah pernah memberikan suara untuk tema polling ini.');
          setVoteSubmitted(true);
          setShowLiveResults(true);
        } else if (data.error === 'RESTRICTED_ACCESS' || data.error?.includes('RESTRICTED_ACCESS')) {
          setErrorMessage(data.message || 'Partisipasi voting dibatasi hanya untuk Pegawai Resmi DKPP Kota Cilegon yang telah terverifikasi melalui NIP.');
        } else if (data.error?.includes('UNAUTHORIZED')) {
          setErrorMessage('Silakan login terlebih dahulu untuk mengikuti polling.');
        } else {
          setErrorMessage(data.error || 'Gagal mengirim suara.');
        }
      }
    } catch (err: any) {
      console.error('Vote submit error:', err);
      setErrorMessage('Koneksi terganggu. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 0. Tampilkan Pembatasan Akses jika user bukan Pegawai Terverifikasi NIP / Superadmin
  if (isRestricted) {
    return (
      <div className={`w-full max-w-full sm:max-w-md p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/70 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/90 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 space-y-2.5 shadow-xs select-text ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 text-base font-bold">
            🔒
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-snug">
              Akses Hasil & Polling Dibatasi
            </h4>
            <p className="text-[11px] sm:text-xs text-amber-900/90 dark:text-amber-200/90 mt-1 leading-relaxed">
              {restrictedMessage || 'Hasil live polling dan hak suara apresiasi kepegawaian hanya dapat diakses oleh Pegawai Resmi DKPP Kota Cilegon yang telah terverifikasi melalui Nomor Induk Pegawai (NIP).'}
            </p>
          </div>
        </div>
        <div className="pt-1.5 border-t border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between text-[11px]">
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium">Internal Kepegawaian DKPP</span>
          {onExploreOther && (
            <button
              type="button"
              onClick={onExploreOther}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Lihat Menu Lain →
            </button>
          )}
        </div>
      </div>
    );
  }

  // 1. Tampilkan Live Results untuk Superadmin (Dapat kembali kapan saja ke form via tombol Vote - mode admin)
  if (isSuperAdmin && showLiveResults) {
    return (
      <div className={`w-full max-w-full sm:max-w-md space-y-3 select-text ${className}`}>
        <LiveResults
          poll={poll}
          results={results}
          totalVotes={totalVotes}
          onExploreOther={onExploreOther}
          isGovernanceExempt={true}
          onVoteAgain={() => {
            setShowLiveResults(false);
            setVoteSubmitted(false);
            setSelected([]);
          }}
        />
      </div>
    );
  }

  // 2. Tampilkan Live Results jika user biasa sudah vote ATAU jika showLiveResults aktif
  if (!isSuperAdmin && (showLiveResults || hasVoted)) {
    return (
      <div className={`w-full max-w-full sm:max-w-md space-y-3 select-text ${className}`}>
        {/* Notifikasi Resmi HANYA jika User Sudah Memilih di Tema Ini */}
        {hasVoted && (
          <div className="bg-emerald-50/95 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 text-base">
                🗳️
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 leading-snug">
                  Anda Sudah Memberikan Suara Sebanyak {choicesCount || maxChoices}x
                </h4>
                <p className="text-[11px] sm:text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-1 leading-relaxed">
                  Hak suara Anda untuk tema <strong>{poll.title}</strong> telah digunakan sepenuhnya ({choicesCount || maxChoices} dari {maxChoices} pilihan). Pilihan Anda tersimpan secara <strong>100% anonim</strong> dan <strong>terjamin kerahasiaannya</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        <LiveResults
          poll={poll}
          results={results}
          totalVotes={totalVotes}
          onExploreOther={onExploreOther}
          onVoteAgain={!hasVoted ? () => setShowLiveResults(false) : undefined}
        />
      </div>
    );
  }

  // 3. Tampilkan Konfirmasi Sukses sesaat setelah vote (Screen 5)
  if (voteSubmitted) {
    return (
      <div className={`w-full max-w-full sm:max-w-md ${className}`}>
        <VoteSuccess
          pollTitle={poll.title}
          choicesCount={selected.length}
          onViewResults={() => setShowLiveResults(true)}
          isGovernanceExempt={isSuperAdmin}
          onVoteAgain={() => {
            setVoteSubmitted(false);
            setShowLiveResults(false);
            setSelected([]);
          }}
        />
      </div>
    );
  }

  // 4. Form Polling Sesuai Mockup Screen 1, 2, 3
  return (
    <div className={`w-full max-w-full sm:max-w-md bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5 ${className}`}>
      {/* Header Form (Trophy + Polling: Judul + Subtitle) */}
      <div className="flex items-start justify-between gap-3 cursor-pointer select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-2xl shrink-0">
            {poll.icon || '🏆'}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[#1e293b] dark:text-white text-sm sm:text-base leading-snug truncate">
              Polling: {poll.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              Pilih {maxChoices} nama favorit kamu!
            </p>
          </div>
        </div>

        <FiChevronRight className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
      </div>

      {/* Keterangan: Polling bersifat Anonim & Terjamin Kerahasiaannya */}
      <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 shadow-2xs">
        <span className="text-base shrink-0">🔒</span>
        <div className="min-w-0 text-[11px] sm:text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
          <strong className="font-bold text-emerald-950 dark:text-emerald-100">100% Anonim &amp; Terjamin Kerahasiaannya:</strong> Polling apresiasi internal ini bersifat tertutup. Pilihan nama rekan kerja Anda terenkripsi dan tidak akan pernah dipublikasikan kepada siapapun demi kenyamanan bersama.
        </div>
      </div>

      {/* Autocomplete Search Input */}
      <div>
        <EmployeeAutocomplete
          onSelect={handleSelect}
          selectedIds={selected.map((s) => s.id)}
          disabled={isSelectedFull}
          pollId={poll.id}
          pollCode={poll.code}
          placeholder="Ketik nama pegawai..."
        />
      </div>

      {/* Selected Items List (Screen 3) */}
      <SelectedEmployeeList
        selected={selected}
        onRemove={handleRemove}
        maxChoices={maxChoices}
      />

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
          <FiAlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Submit Button (Screen 1 & 3: 'Pilih 0 dari 3' vs 'Kirim Pilihan ✓') */}
      <div className="pt-1 space-y-2">
        <button
          type="button"
          onClick={handleSubmitVote}
          disabled={selected.length === 0 || isSubmitting}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            selected.length > 0 && !isSubmitting
              ? 'bg-[#007A55] hover:bg-[#006848] active:scale-[0.99] text-white shadow-sm'
              : 'bg-[#F1F5F9] dark:bg-gray-800 text-[#94A3B8] border border-[#E2E8F0] dark:border-gray-700 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Menyimpan Suara...</span>
            </>
          ) : selected.length > 0 ? (
            <span>Kirim Pilihan ✓</span>
          ) : (
            <span>Pilih 0 dari {maxChoices}</span>
          )}
        </button>

        {/* Superadmin toggle to view Live Results */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowLiveResults(true)}
            className="w-full py-2 px-3 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-medium"
          >
            <span>📊 Lihat Hasil Polling Sementara</span>
          </button>
        )}
      </div>
    </div>
  );
};
