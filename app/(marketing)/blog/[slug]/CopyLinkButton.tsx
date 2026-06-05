'use client';

import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      onClick={() => navigator.clipboard.writeText(url)}
    >
      <Link2 className="h-4 w-4" />
    </Button>
  );
}

export function ShareCopyButton({ url, className }: { url: string; className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 ${className ?? ''}`}
      onClick={() => navigator.clipboard.writeText(url)}
    >
      <Link2 className="h-4 w-4" />
      <span className="hidden sm:inline">Copy Link</span>
    </Button>
  );
}
