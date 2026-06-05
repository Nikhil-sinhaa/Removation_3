'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SearchResponse } from '@/lib/search/search';

const DEBOUNCE_MS       = 300;
const MIN_QUERY_LENGTH  = 2;

export function useSearch() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [isOpen,  setIsOpen]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef    = useRef<AbortController>();

  const search = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=5`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error('Search failed');
      const data: SearchResponse = await res.json();
      setResults(data);
      setIsOpen(data.total > 0);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(query), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  const clear = useCallback(() => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    setError(null);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return { query, setQuery, results, loading, error, isOpen, close, clear };
}
