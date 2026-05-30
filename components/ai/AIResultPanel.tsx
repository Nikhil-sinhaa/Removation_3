'use client';

import { BeforeAfterSlider } from '@/components/ui/before-after-slider';
import { Button } from '@/components/ui/button';
import { Download, BookmarkCheck, Sparkles, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AIResultPanelProps {
  originalImageUrl: string;
  resultImageUrl: string;
  isLoading?: boolean;
  onDownload?: () => void;
  onSave?: () => void;
  onEnhance?: () => void;
  isEnhancing?: boolean;
  enhancedImageUrl?: string | null;
  toolName?: string;
  beforeLabel?: string;
  afterLabel?: string;
  children?: React.ReactNode;
}

export function AIResultPanel({
  originalImageUrl,
  resultImageUrl,
  isLoading,
  onDownload,
  onSave,
  onEnhance,
  isEnhancing,
  enhancedImageUrl,
  toolName,
  beforeLabel = 'Before',
  afterLabel = 'After',
  children,
}: AIResultPanelProps) {
  const displayImage = enhancedImageUrl || resultImageUrl;
  const displayLabel = enhancedImageUrl ? `${afterLabel} (HD)` : afterLabel;

  const handleDownload = onDownload ?? (() => {
    const a = document.createElement('a');
    a.href = displayImage;
    a.download = `${(toolName || 'result').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="w-full h-80 bg-gray-200 rounded-xl" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-9 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BeforeAfterSlider
        beforeImage={originalImageUrl}
        afterImage={displayImage}
        beforeLabel={beforeLabel}
        afterLabel={displayLabel}
      />

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={handleDownload} className="flex-1">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Download
        </Button>

        {onSave && (
          <Button size="sm" variant="outline" onClick={onSave} className="flex-1">
            <BookmarkCheck className="w-3.5 h-3.5 mr-1.5" />
            Save to Project
          </Button>
        )}

        {onEnhance && (
          <Button
            size="sm"
            variant="outline"
            onClick={enhancedImageUrl ? undefined : onEnhance}
            disabled={isEnhancing}
            className={cn(
              'flex-1',
              enhancedImageUrl && 'bg-violet-600 text-white border-violet-600 pointer-events-none',
            )}
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Enhancing...
              </>
            ) : enhancedImageUrl ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                HD ✓
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Enhance to HD
              </>
            )}
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}
