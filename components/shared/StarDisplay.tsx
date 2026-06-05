'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarDisplayProps {
  rating: number | null | undefined;
  size?: 'sm' | 'md';
  showEmpty?: boolean;
  className?: string;
}

export function StarDisplay({ rating, size = 'sm', showEmpty = false, className }: StarDisplayProps) {
  if (rating == null && !showEmpty) return null;

  const px = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const filled = rating ?? 0;

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            px,
            n <= filled
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/40'
          )}
        />
      ))}
    </span>
  );
}

export default StarDisplay;
