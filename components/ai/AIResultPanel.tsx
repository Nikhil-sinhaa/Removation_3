'use client';

import React, { useState, useEffect } from 'react';
import { BeforeAfterSlider } from '@/components/ui/before-after-slider';
import { Button } from '@/components/ui/button';
import { Download, BookmarkCheck, Sparkles, Check, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { MakeItReal } from '@/components/ai/MakeItReal';
import { RenderFeedback } from '@/components/shared/RenderFeedback';

export interface AIResultPanelProps {
  originalImageUrl: string | null;    // "before" image
  resultImageUrl: string | null;      // "after" image
  isLoading?: boolean;
  toolName: string;                   // e.g. "Ceiling Changer"
  projectId?: string;
  renderId?: string;                  // Render model ID for feedback
  featureLabel?: string;              // display name for feedback modal
  onDownload?: () => void;
  onSaveToProject?: () => void;
  onTryAgain?: () => void;
  showMakeItReal?: boolean;           // default true
  city?: string;                      // for MakeItReal designer matching
  roomType?: string;
  style?: string;
  children?: React.ReactNode;         // extra tool-specific buttons
}

export function AIResultPanel({
  originalImageUrl,
  resultImageUrl,
  isLoading = false,
  toolName,
  projectId,
  renderId,
  featureLabel,
  onDownload,
  onSaveToProject,
  onTryAgain,
  showMakeItReal = true,
  roomType = 'living-room',
  style,
  children,
}: AIResultPanelProps) {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

  // Reset enhanced state when input result image changes
  useEffect(() => {
    setEnhancedUrl(null);
    setIsEnhancing(false);
  }, [resultImageUrl]);

  const displayImage = enhancedUrl || resultImageUrl;
  const hasOriginal = !!originalImageUrl;

  const handleDownload = onDownload ?? (() => {
    if (!displayImage) return;
    const a = document.createElement('a');
    a.href = displayImage;
    a.download = `${toolName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  const handleEnhance = async () => {
    if (!resultImageUrl) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: resultImageUrl,
          enhanceType: 'upscale',
          settings: { scale: '2x' },
          projectId,
        }),
      });

      if (res.status === 402) {
        toast({
          title: 'Insufficient credits',
          description: 'Please purchase more credits to upscale to HD.',
          variant: 'destructive',
        });
        return;
      }

      const data = await res.json();
      if (data.outputImage) {
        setEnhancedUrl(data.outputImage);
        toast({
          title: '✨ HD Enhancement complete!',
          description: 'Upscaled 2x successfully.',
        });
      } else {
        throw new Error(data.error || 'Enhancement failed');
      }
    } catch (err: any) {
      toast({
        title: 'Enhancement failed',
        description: err.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="animate-pulse bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-xl space-y-6">
        <div className="w-full aspect-[4/3] bg-zinc-850 rounded-xl" />
        <div className="flex gap-3 flex-wrap">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 min-w-[120px] h-10 bg-zinc-850 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!resultImageUrl) return null;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-xl space-y-6 text-zinc-100">
      <div className="space-y-4">
        {/* Main Display Area */}
        {hasOriginal ? (
          <BeforeAfterSlider
            beforeImage={originalImageUrl}
            afterImage={displayImage || ''}
            beforeLabel="Original"
            afterLabel={enhancedUrl ? 'After (HD)' : 'After'}
          />
        ) : (
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
            <img
              src={displayImage || ''}
              alt={`${toolName} Result`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Buttons / Actions */}
        <div className="flex gap-3 flex-wrap items-center">
          {hasOriginal ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="flex-1 min-w-[120px] bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              {onSaveToProject && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSaveToProject}
                  className="flex-1 min-w-[120px] bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                >
                  <BookmarkCheck className="w-4 h-4 mr-2" />
                  Save to Project
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={enhancedUrl ? undefined : handleEnhance}
                disabled={isEnhancing}
                className={cn(
                  'flex-1 min-w-[120px]',
                  enhancedUrl
                    ? 'bg-violet-600 text-white border-violet-600 pointer-events-none'
                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                )}
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : enhancedUrl ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    HD Enabled
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Enhance HD
                  </>
                )}
              </Button>

              {onTryAgain && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onTryAgain}
                  className="flex-1 min-w-[120px] bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </>
          ) : (
            // No original image -> plain download only
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Result
            </Button>
          )}
        </div>

        {/* Rating feedback */}
        {renderId && (
          <RenderFeedback
            renderId={renderId}
            featureLabel={featureLabel ?? toolName}
            variant="inline"
          />
        )}

        {/* Optional Extra Actions Passed from Parent */}
        {children && <div className="pt-2 border-t border-zinc-800/80">{children}</div>}
      </div>

      {/* "Make It Real" Section */}
      {showMakeItReal && (
        <div className="pt-4 border-t border-zinc-800/80">
          <MakeItReal
            roomType={roomType}
            style={style}
            afterImage={displayImage || ''}
          />
        </div>
      )}
    </div>
  );
}
