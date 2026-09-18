'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { PollResultItem, PollTheme } from '@/lib/polling/types';

export function usePollResults(pollId?: string, pollCode?: string) {
  const [results, setResults] = useState<PollResultItem[]>([]);
  const [poll, setPoll] = useState<PollTheme | null>(null);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
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
      const res = await fetch(`/api/polling/results/${identifier}`);
      const data = await res.json();

      if (res.ok) {
        setResults(data.results || []);
        setPoll(data.poll || null);
        setTotalVotes(data.total_votes || 0);
        setHasVoted(data.has_voted || false);
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
    loading,
    error,
    refresh: () => fetchResults(false)
  };
}
