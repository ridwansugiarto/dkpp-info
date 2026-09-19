'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { PollResultItem, PollTheme } from '@/lib/polling/types';

export function usePollResults(pollId?: string, pollCode?: string) {
  const [results, setResults] = useState<PollResultItem[]>([]);
  const [poll, setPoll] = useState<PollTheme | null>(null);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [choicesCount, setChoicesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchResults = useCallback(async (isSilent = false) => {
    if (!pollId && !pollCode) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isSilent) setLoading(true);

    try {
      const identifier = pollId || pollCode;
      let userQuery = '';
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('dkpp_user_session') || sessionStorage.getItem('dkpp_user_session');
          if (stored) {
            const parsed = JSON.parse(stored);
            const uId = parsed.id || '';
            const uEmail = parsed.email || '';
            if (uId || uEmail) {
              userQuery = `?userId=${encodeURIComponent(uId)}&userEmail=${encodeURIComponent(uEmail)}`;
            }
          }
          // Cek local cache apakah user sudah vote di tema ini
          const localVoteKey = `dkpp_voted_${pollCode || pollId}`;
          const localVoted = localStorage.getItem(localVoteKey);
          if (localVoted) {
            const parsedVote = JSON.parse(localVoted);
            setHasVoted(true);
            setChoicesCount(parsedVote.count || 3);
          }
        } catch {}
      }

      const res = await fetch(`/api/polling/results/${identifier}${userQuery}`);
      const data = await res.json();

      if (res.ok) {
        setResults(data.results || []);
        setPoll(data.poll || null);
        setTotalVotes(data.total_votes || 0);
        if (data.has_voted) {
          setHasVoted(true);
          setChoicesCount(data.choices_count || 3);
        }
        setError(null);
      } else {
        setError(data.error || 'Gagal memuat hasil polling.');
      }
    } catch (err: any) {
      console.error('Fetch poll results error:', err);
      if (!isSilent) setError('Koneksi terganggu saat memuat data polling.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [pollId, pollCode]);

  useEffect(() => {
    fetchResults();

    // 1. Supabase Realtime Subscription (Crash-proof with unique channel topic)
    let channel: any = null;
    try {
      const channelName = `poll-realtime-${pollId || pollCode || 'global'}-${Math.random().toString(36).slice(2, 8)}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'poll_results',
            ...(pollId ? { filter: `poll_id=eq.${pollId}` } : {})
          },
          () => {
            // Re-fetch aggregate when poll_results changes
            fetchResults(true);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'votes'
          },
          () => {
            fetchResults(true);
          }
        )
        .subscribe();
    } catch (realtimeErr) {
      console.warn('Realtime subscription error, fallback to polling:', realtimeErr);
    }

    // 2. Fallback polling setiap 15 detik jika websocket terputus
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchResults(true);
      }
    }, 15000);

    // 3. Re-fetch saat tab aktif kembali
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchResults(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      try {
        if (channel) {
          supabase.removeChannel(channel);
        }
      } catch {}
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pollId, pollCode, fetchResults]);

  return {
    results,
    poll,
    totalVotes,
    hasVoted,
    choicesCount,
    loading,
    error,
    refresh: () => fetchResults(false)
  };
}
