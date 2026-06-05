'use client';

import { useEffect, useState, useRef } from 'react';
import { useAIQueue } from '@/hooks/useAIQueue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Zap, Sparkles, XCircle, RefreshCw } from 'lucide-react';

interface QueuePositionProps {
  jobId: string;
  featureLabel?: string;
  onComplete: () => void;
  onError: (message: string) => void;
  onCancel?: () => void;
}

function formatWait(seconds: number): string {
  if (seconds <= 0) return 'a few seconds';
  if (seconds < 60) return `~${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `~${m}m ${s}s` : `~${m} min`;
}

export function QueuePosition({
  jobId,
  featureLabel = 'Generation',
  onComplete,
  onError,
  onCancel,
}: QueuePositionProps) {
  const {
    status,
    queuePosition,
    estimatedWaitSeconds,
    queueDepth,
    isQueued,
    isProcessing,
    isCompleted,
    isFailed,
    isCancelled,
    cancelJob,
  } = useAIQueue(jobId, { onComplete, onError });

  // Countdown timer based on estimatedWaitSeconds
  const [countdown, setCountdown] = useState<number | null>(estimatedWaitSeconds);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (estimatedWaitSeconds !== null) {
      setCountdown(estimatedWaitSeconds);
    }
  }, [estimatedWaitSeconds]);

  useEffect(() => {
    if (!isQueued && !isProcessing) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isQueued, isProcessing]);

  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    await cancelJob();
    setCancelSuccess(true);
    setTimeout(() => {
      onCancel?.();
    }, 2500);
  };

  // Progress bar percentage
  const progressPct = (() => {
    if (!queuePosition || !queueDepth) return 10;
    const maxDepth = Math.max(queueDepth, queuePosition);
    return Math.min(10 + ((maxDepth - queuePosition) / maxDepth) * 70, 80);
  })();

  // ── Cancelled ───────────────────────────────────────────────────────────────
  if (isCancelled || cancelSuccess) {
    return (
      <Card className="border border-muted bg-muted/30">
        <CardContent className="py-8 text-center space-y-2">
          <XCircle className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="font-medium">Cancelled</p>
          <p className="text-sm text-muted-foreground">Your generation was cancelled.</p>
        </CardContent>
      </Card>
    );
  }

  // ── Failed ───────────────────────────────────────────────────────────────────
  if (isFailed) {
    return (
      <Card className="border border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center space-y-4">
          <XCircle className="w-8 h-8 text-destructive mx-auto" />
          <div>
            <p className="font-medium text-destructive">Generation failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              Something went wrong. Your credits have been preserved.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onError('failed')}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Completed — parent handles displaying the result ─────────────────────────
  if (isCompleted) return null;

  // ── Processing ───────────────────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="py-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Generating your design...</p>
              <p className="text-sm text-muted-foreground">{featureLabel} is running</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full animate-[progress-indeterminate_1.5s_ease-in-out_infinite]"
                style={{ width: '60%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              ComfyUI is working on your image
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Next in queue ────────────────────────────────────────────────────────────
  if (queuePosition === 1) {
    return (
      <Card className="border border-primary/30 bg-primary/5">
        <CardContent className="py-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">You&apos;re next!</p>
              <p className="text-sm text-muted-foreground">Starting in a few seconds...</p>
            </div>
          </div>

          <Progress value={82} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  // ── Queued (position > 1) ────────────────────────────────────────────────────
  return (
    <Card className="border border-muted bg-muted/30">
      <CardContent className="py-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Your generation is queued</p>
            {queuePosition !== null && (
              <p className="text-sm text-muted-foreground">
                Position #{queuePosition} in queue
              </p>
            )}
          </div>
        </div>

        {/* Progress bar — fills as position decreases */}
        <div className="space-y-1.5">
          <Progress value={progressPct} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Waiting...</span>
            {countdown !== null && (
              <span>Est. {formatWait(countdown)}</span>
            )}
          </div>
        </div>

        {onCancel && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
