'use client';

import { useState, useCallback, useEffect } from 'react';

export type GPUMode = 'local' | 'cloud';

interface ModeHealth {
  online: boolean;
  vramFree?: number;
  vramTotal?: number;
  url?: string;
  error?: string;
}

interface GPUModeStatus {
  mode: GPUMode;
  activeUrl: string;
  local: ModeHealth;
  cloud: ModeHealth;
}

export function useGPUMode() {
  const [status, setStatus] = useState<GPUModeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/gpu-mode');
      if (res.ok) setStatus(await res.json());
    } catch {
      // silently ignore — UI degrades gracefully
    }
  }, []);

  // Poll every 30s for live VRAM updates
  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 30_000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const switchMode = useCallback(
    async (mode: GPUMode, cloudUrl?: string): Promise<{ success: boolean; message: string }> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/settings/gpu-mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, cloudUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Unknown error');
          return { success: false, message: data.error ?? 'Switch failed' };
        }
        // Refresh status after switch
        await fetchStatus();
        return { success: true, message: data.message ?? 'Switched' };
      } catch (err: any) {
        setError(err.message);
        return { success: false, message: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchStatus],
  );

  return { status, loading, error, switchMode, refresh: fetchStatus };
}
