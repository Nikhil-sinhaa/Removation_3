'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import Link from 'next/link';
import type { SearchResponse, SearchResultType } from '@/lib/search/search';
import { useLanguage } from '@/hooks/useLanguage';

const TYPE_LABELS: Record<SearchResultType, string> = {
  project:  'Projects',
  render:   'Renders',
  designer: 'Designers',
  blog:     'Blog Posts',
  style:    'Styles',
  page:     'Pages',
};

function SearchResults() {
  const searchParams  = useSearchParams();
  const query         = searchParams.get('q') || '';
  const [results,     setResults]     = useState<SearchResponse | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchResultType | 'all'>('all');

  useEffect(() => {
    if (!query || query.length < 2) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [query]);

  const filteredResults = results
    ? activeFilter === 'all'
      ? results.results
      : results.results.filter(r => r.type === activeFilter)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#f0f0ff' }}>
          {query ? `Results for "${query}"` : 'Search'}
        </h1>
        {results && (
          <p className="text-sm" style={{ color: '#71717a' }}>
            {results.total} result{results.total !== 1 ? 's' : ''} · {results.took}ms
          </p>
        )}
      </div>

      {/* Filter tabs */}
      {results && results.total > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeFilter === 'all' ? '#7c3aed' : 'rgba(255,255,255,0.06)',
              color: activeFilter === 'all' ? '#fff' : '#a1a1aa',
              transition: 'all 120ms',
            }}
          >
            All ({results.total})
          </button>
          {(Object.keys(results.grouped) as SearchResultType[]).map(type => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: activeFilter === type ? '#7c3aed' : 'rgba(255,255,255,0.06)',
                color: activeFilter === type ? '#fff' : '#a1a1aa',
                transition: 'all 120ms',
              }}
            >
              {TYPE_LABELS[type]} ({results.grouped[type].length})
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{ border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed' }}
          />
        </div>
      )}

      {/* No results */}
      {!loading && results && results.total === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 mb-4" style={{ color: '#3f3f46' }} />
          <h2 className="text-lg font-medium mb-2" style={{ color: '#f0f0ff' }}>No results found</h2>
          <p className="text-sm" style={{ color: '#71717a' }}>Try different keywords or check the spelling</p>
        </div>
      )}

      {/* Results */}
      {!loading && filteredResults.length > 0 && (
        <div className="space-y-3">
          {filteredResults.map(result => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.url}
              className="flex items-center gap-4 p-4 rounded-xl transition-all"
              style={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.08)',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  style={{ background: '#2a2a3e' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Search className="w-6 h-6" style={{ color: '#3f3f46' }} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'rgba(124,58,237,0.15)',
                    color: '#a78bfa',
                    textTransform: 'capitalize',
                  }}>
                    {TYPE_LABELS[result.type]}
                  </span>
                </div>
                <h3 className="font-medium truncate" style={{ color: '#f0f0ff', fontSize: 15 }}>
                  {result.title}
                </h3>
                {result.subtitle && (
                  <p className="text-sm truncate" style={{ color: '#71717a' }}>{result.subtitle}</p>
                )}
                {result.description && (
                  <p className="text-sm truncate mt-0.5" style={{ color: '#52525b' }}>{result.description}</p>
                )}
              </div>

              <div className="hidden sm:block text-xs truncate max-w-32" style={{ color: '#3f3f46' }}>
                {result.url}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty query */}
      {!query && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 mb-4" style={{ color: '#3f3f46' }} />
          <h2 className="text-lg font-medium mb-2" style={{ color: '#f0f0ff' }}>What are you looking for?</h2>
          <p className="text-sm" style={{ color: '#71717a' }}>
            Search across your projects, renders, designers, and more
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed' }}
        />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
