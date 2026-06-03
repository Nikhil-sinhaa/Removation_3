'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Tag as TagIcon, Loader2 } from 'lucide-react';
import type { ITag } from '@/lib/db/models/Tag';

interface TagInputProps {
  itemId:       string;
  itemType:     'project' | 'render';
  initialTags?: ITag[];
  onChange?:    (tags: ITag[]) => void;
  placeholder?: string;
  maxTags?:     number;
  compact?:     boolean;
}

export function TagInput({
  itemId,
  itemType,
  initialTags = [],
  onChange,
  placeholder = 'Add tag...',
  maxTags = 10,
  compact = false,
}: TagInputProps) {
  const [tags,        setTags]        = useState<ITag[]>(initialTags);
  const [input,       setInput]       = useState('');
  const [suggestions, setSuggestions] = useState<ITag[]>([]);
  const [showSugg,    setShowSugg]    = useState(false);
  const [isAdding,    setIsAdding]    = useState(false);
  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load existing tags on mount
  useEffect(() => {
    if (initialTags.length > 0) return;
    fetch(`/api/${itemType}s/${itemId}/tags`)
      .then(r => r.json())
      .then(d => { if (d.tags) setTags(d.tags); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, itemType]);

  // Fetch suggestions as user types
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (input.length < 1) {
      setSuggestions([]);
      setShowSugg(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tags?q=${encodeURIComponent(input)}`);
        const data = await res.json();
        const appliedIds = new Set(tags.map(t => String(t._id)));
        setSuggestions((data.tags || []).filter((t: ITag) => !appliedIds.has(String(t._id))));
        setShowSugg(true);
      } catch { /* ignore */ }
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [input, tags]);

  const applyTag = useCallback(async (tag: ITag) => {
    if (tags.length >= maxTags) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/${itemType}s/${itemId}/tags`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tagId: String(tag._id) }),
      });
      const data = await res.json();
      if (data.tags) { setTags(data.tags); onChange?.(data.tags); }
    } catch { /* ignore */ } finally {
      setIsAdding(false);
      setInput('');
      setShowSugg(false);
    }
  }, [tags.length, maxTags, itemId, itemType, onChange]);

  const createAndApplyTag = useCallback(async (label: string) => {
    if (!label.trim() || tags.length >= maxTags) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/${itemType}s/${itemId}/tags`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ label: label.trim() }),
      });
      const data = await res.json();
      if (data.tags) { setTags(data.tags); onChange?.(data.tags); }
    } catch { /* ignore */ } finally {
      setIsAdding(false);
      setInput('');
      setShowSugg(false);
    }
  }, [tags.length, maxTags, itemId, itemType, onChange]);

  const removeTagFromItem = useCallback(async (tag: ITag) => {
    try {
      const res = await fetch(`/api/${itemType}s/${itemId}/tags`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tagId: String(tag._id) }),
      });
      const data = await res.json();
      if (data.tags) { setTags(data.tags); onChange?.(data.tags); }
    } catch { /* ignore */ }
  }, [itemId, itemType, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (suggestions.length > 0) applyTag(suggestions[0]);
      else if (input.trim()) createAndApplyTag(input.trim());
    }
    if (e.key === 'Escape') { setShowSugg(false); setInput(''); }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTagFromItem(tags[tags.length - 1]);
    }
  };

  return (
    <div className="relative" data-tour="tag-input">
      <div
        className={`flex flex-wrap gap-1.5 items-center min-h-[36px] ${
          compact ? 'p-1' : 'p-2'
        } bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-text`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span
            key={String(tag._id)}
            className={`inline-flex items-center gap-1 rounded-full font-medium ${
              compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-sm'
            }`}
            style={{
              backgroundColor: `${tag.color}20`,
              color:           tag.color,
              border:          `1px solid ${tag.color}40`,
            }}
          >
            {tag.label}
            <button
              onClick={e => { e.stopPropagation(); removeTagFromItem(tag); }}
              className="hover:opacity-70 transition-opacity ml-0.5"
            >
              <X className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            </button>
          </span>
        ))}

        {tags.length < maxTags && (
          <div className="flex items-center gap-1 flex-1 min-w-[80px]">
            {isAdding
              ? <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
              : <TagIcon className="w-3 h-3 text-neutral-400 shrink-0" />
            }
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => input && setShowSugg(true)}
              placeholder={tags.length === 0 ? placeholder : ''}
              className={`flex-1 bg-transparent outline-none ${
                compact ? 'text-xs' : 'text-sm'
              } text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400`}
              disabled={isAdding}
            />
          </div>
        )}
      </div>

      {showSugg && (suggestions.length > 0 || input.trim()) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map(tag => (
            <button
              key={String(tag._id)}
              onClick={() => applyTag(tag)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tag.color }} />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{tag.label}</span>
              <span className="text-xs text-neutral-400 ml-auto capitalize">
                {tag.category.replace('_', ' ')}
              </span>
            </button>
          ))}

          {input.trim() && (
            <button
              onClick={() => createAndApplyTag(input.trim())}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left border-t border-neutral-100 dark:border-neutral-800"
            >
              <Plus className="w-3 h-3 text-purple-500" />
              <span className="text-sm text-purple-600">Create tag &quot;{input.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
