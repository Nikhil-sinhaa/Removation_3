'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Loader2, FolderOpen, Image,
  User, Palette, Layout, ArrowRight,
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import type { SearchResult, SearchResultType } from '@/lib/search/search';

const TYPE_CONFIG: Record<SearchResultType, {
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  color: string;
}> = {
  project:  { label: 'Projects',  icon: FolderOpen, color: '#60a5fa' },
  render:   { label: 'Renders',   icon: Image,      color: '#a78bfa' },
  designer: { label: 'Designers', icon: User,       color: '#34d399' },
  blog:     { label: 'Blog',      icon: Layout,     color: '#fb923c' },
  style:    { label: 'Styles',    icon: Palette,    color: '#f472b6' },
  page:     { label: 'Pages',     icon: Layout,     color: '#a1a1aa' },
};

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = '' }: SearchBarProps) {
  const router      = useRouter();
  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { query, setQuery, results, loading, isOpen, close, clear } = useSearch();

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) close();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [close]);

  // Cmd+K / Ctrl+K to focus
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        close();
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [close]);

  const handleSelect = useCallback((result: SearchResult) => {
    router.push(result.url);
    clear();
    inputRef.current?.blur();
  }, [router, clear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      clear();
    }
  };

  const typeOrder: SearchResultType[] = ['project', 'render', 'designer', 'style', 'page', 'blog'];
  const grouped = results?.grouped || {};
  const hasResults = !!results && results.total > 0;

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search style={{ width: 14, height: 14, color: '#a1a1aa', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, styles, designers..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#fff', fontSize: '13px', minWidth: 0 }}
            autoComplete="off"
          />
          {loading && (
            <Loader2 style={{ width: 12, height: 12, color: '#a1a1aa', flexShrink: 0 }} className="animate-spin" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={clear}
              style={{ color: '#a1a1aa', flexShrink: 0, lineHeight: 0 }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
          {!query && (
            <kbd
              className="hidden lg:block px-1.5 py-0.5 text-xs rounded"
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a1a1aa',
                fontSize: '11px',
                flexShrink: 0,
              }}
            >
              ⌘K
            </kbd>
          )}
        </div>
      </form>

      <AnimatePresence>
        {isOpen && hasResults && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 6,
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              zIndex: 9990,
              overflow: 'hidden',
              maxHeight: 480,
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {typeOrder.map(type => {
              const items = (grouped as Record<string, SearchResult[]>)[type];
              if (!items?.length) return null;
              const cfg  = TYPE_CONFIG[type];
              const Icon = cfg.icon;

              return (
                <div key={type}>
                  {/* Section header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px 6px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <Icon style={{ width: 11, height: 11, color: cfg.color }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 10, color: '#52525b', marginLeft: 'auto' }}>
                      {items.length}
                    </span>
                  </div>

                  {items.map(result => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Thumbnail */}
                      {result.imageUrl ? (
                        <img
                          src={result.imageUrl}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#2a2a3e' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                        </div>
                      )}

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#f0f0ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div style={{ fontSize: 11, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {result.subtitle}
                          </div>
                        )}
                      </div>

                      <ArrowRight style={{ width: 12, height: 12, color: '#3f3f46', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              );
            })}

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px' }}>
              <button
                onClick={() => { router.push(`/search?q=${encodeURIComponent(query)}`); clear(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: '#7c3aed',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background 120ms',
                  fontWeight: 500,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Search style={{ width: 11, height: 11 }} />
                See all results for "{query}"
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
