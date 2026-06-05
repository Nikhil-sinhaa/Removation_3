'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type JobStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | null;

interface QueueState {
  jobId: string | null;
  status: JobStatus;
  queuePosition: number | null;
  estimatedWaitSeconds: number | null;
  queueDepth: number;
  isLoading: boolean;
  error: string | null;
  isQueued: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isCancelled: boolean;
}

interface UseAIQueueOptions {
  onComplete?: () => void;
  onError?: (message: string) => void;
}

const INITIAL_STATE: QueueState = {
  jobId: null,
  status: null,
  queuePosition: null,
  estimatedWaitSeconds: null,
  queueDepth: 0,
  isLoading: false,
  error: null,
  isQueued: false,
  isProcessing: false,
  isCompleted: false,
  isFailed: false,
  isCancelled: false,
};

export function useAIQueue(
  jobId: string | null,
  options: UseAIQueueOptions = {}
): QueueState & { cancelJob(): Promise<void> } {
  const { onComplete, onError } = options;
  const [state, setState] = useState<QueueState>({ ...INITIAL_STATE, jobId });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTerminalRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async (id: string) => {
    if (isTerminalRef.current) return;

    try {
      const res = await fetch(`/api/ai/queue?jobId=${encodeURIComponent(id)}`);

      if (res.status === 404) {
        // Job expired from Redis — treat as completed if render is done
        stopPolling();
        isTerminalRef.current = true;
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (!res.ok) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Failed to check job status' }));
        return;
      }

      const data = await res.json();
      const status: JobStatus = data.jobStatus ?? null;

      const isQueued     = status === 'queued';
      const isProcessing = status === 'processing';
      const isCompleted  = status === 'completed';
      const isFailed     = status === 'failed';
      const isCancelled  = status === 'cancelled';

      setState({
        jobId: id,
        status,
        queuePosition:       data.queuePosition ?? null,
        estimatedWaitSeconds: data.estimatedWaitSeconds ?? null,
        queueDepth:          data.queueDepth ?? 0,
        isLoading: false,
        error: null,
        isQueued,
        isProcessing,
        isCompleted,
        isFailed,
        isCancelled,
      });

      // Stop polling on terminal states
      if (isCompleted || isFailed || isCancelled) {
        stopPolling();
        isTerminalRef.current = true;

        if (isCompleted) onComplete?.();
        if (isFailed)    onError?.('Generation failed. Please try again.');
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, [stopPolling, onComplete, onError]);

  useEffect(() => {
    if (!jobId) {
      setState({ ...INITIAL_STATE, jobId: null });
      return;
    }

    isTerminalRef.current = false;
    setState(prev => ({ ...prev, jobId, isLoading: true }));

    // Initial poll immediately
    poll(jobId);

    // Then every 3 seconds
    intervalRef.current = setInterval(() => poll(jobId), 3000);

    return () => {
      stopPolling();
    };
  }, [jobId, poll, stopPolling]);

  const cancelJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/ai/queue?jobId=${encodeURIComponent(jobId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        stopPolling();
        isTerminalRef.current = true;
        setState(prev => ({
          ...prev,
          status: 'cancelled',
          isCancelled: true,
          isQueued: false,
          isProcessing: false,
        }));
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [jobId, stopPolling]);

  return { ...state, cancelJob };
}

/** Convenience hook for components that only need queue position. */
export function useQueuePosition(jobId: string | null) {
  const { queuePosition, estimatedWaitSeconds, queueDepth, status } = useAIQueue(jobId);
  return { position: queuePosition, estimatedWait: estimatedWaitSeconds, queueDepth, status };
}
