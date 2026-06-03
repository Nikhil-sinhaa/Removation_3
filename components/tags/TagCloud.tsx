'use client';

import { useState, useEffect } from 'react';
import type { ITag } from '@/lib/db/models/Tag';

interface TagCloudProps {
  onSelect?:      (tag: ITag) => void;
  selectedTagId?: string;
  category?:      string;
  showCount?:     boolean;
}

export function TagCloud({ onSelect, selectedTagId, category, showCount = false }: TagCloudProps) {
  const [tags, setTags] = useState<ITag[]>([]);

  useEffect(() => {
    const url = category ? `/api/tags?category=${category}` : '/api/tags';
    fetch(url)
      .then(r => r.json())
      .then(d => setTags(d.tags || []))
      .catch(() => {});
  }, [category]);

  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 30).map(tag => (
        <button
          key={String(tag._id)}
          onClick={() => onSelect?.(tag)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all hover:opacity-80 ${
            String(tag._id) === selectedTagId ? 'ring-2 ring-offset-1' : ''
          }`}
          style={{
            backgroundColor: `${tag.color}20`,
            color:           tag.color,
            border:          `1px solid ${tag.color}40`,
            outlineColor:    tag.color,
          }}
        >
          {tag.label}
          {showCount && tag.usageCount > 0 && (
            <span className="text-xs opacity-60">({tag.usageCount})</span>
          )}
        </button>
      ))}
    </div>
  );
}
