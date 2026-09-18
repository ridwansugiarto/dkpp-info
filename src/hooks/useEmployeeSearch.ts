'use client';

import { useState, useEffect, useRef } from 'react';
import { Employee } from '@/lib/polling/types';

export function useEmployeeSearch(query: string, pollId?: string, pollCode?: string) {
  const [results, setResults] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams({ q: trimmed });
        if (pollId) queryParams.set('pollId', pollId);
        if (pollCode) queryParams.set('pollCode', pollCode);

        const url = `/api/polling/search-employees?${queryParams.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        if (res.ok && data.employees) {
          setResults(data.employees);
        } else {
          setResults([]);
          if (data.error) setError(data.error);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
          setError('Gagal memuat daftar pegawai.');
        }
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, pollId, pollCode]);

  return { results, loading, error };
}
