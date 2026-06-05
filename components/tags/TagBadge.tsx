'use client';

import { X } from 'lucide-react';

interface TagBadgeProps {
  tag:       { label: string; color: string; _id?: string };
  onRemove?: () => void;
  onClick?:  () => void;
  size?:     'sm' | 'md';
}

export function TagBadge({ tag, onRemove, onClick, size = 'md' }: TagBadgeProps) {
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-opacity
        ${padding}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
      `}
      style={{
        backgroundColor: `${tag.color}20`,
        color:           tag.color,
        border:          `1px solid ${tag.color}40`,
      }}
    >
      {tag.label}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
