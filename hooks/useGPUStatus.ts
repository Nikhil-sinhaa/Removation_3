import { useState, useEffect, useCallback } from 'react';

interface GPUStatus {
  status: 'idle' | 'busy' | 'offline';
  vramUsed?: number;
  vramTotal?: number;
  temperature?: number;
}

export function useGPUStatus() {
  const [gpuStatus, setGPUStatus] = useState<GPUStatus>({
    status: 'offline'
  });

  const checkGPUStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/gpu-status');
      
      if (!response.ok) {
        if (response.status === 503) {
          setGPUStatus({ status: 'offline' });
        } else {
          throw new Error('Failed to check GPU status');
        }
        return;
      }

      const data = await response.json();
      setGPUStatus({
        status: data.is_busy ? 'busy' : 'idle',
        vramUsed: data.vram_used,
        vramTotal: 8, // RTX 4060 has 8GB
        temperature: data.temperature
      });
    } catch (error) {
      console.error('GPU status check failed:', error);
      setGPUStatus({ status: 'offline' });
    }
  }, []);

  useEffect(() => {
    checkGPUStatus();
  }, [checkGPUStatus]);

  return { gpuStatus, checkGPUStatus };
}
