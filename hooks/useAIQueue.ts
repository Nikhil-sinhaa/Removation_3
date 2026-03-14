import { useState, useCallback } from 'react';

interface AIRequest {
  type: 'object_removal';
  imageUrl: string;
  point: { x: number; y: number };
  mask: string;
  onProgress?: (progress: number) => void;
}

interface AIResponse {
  success: boolean;
  resultImageUrl?: string;
  error?: string;
}

export function useAIQueue() {
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  const queueRequest = useCallback(async (request: AIRequest): Promise<AIResponse> => {
    setIsInQueue(true);
    
    try {
      const response = await fetch('/api/ai/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('AI Queue request failed:', error);
      throw error;
    } finally {
      setIsInQueue(false);
      setQueuePosition(null);
    }
  }, []);

  return { queueRequest, isInQueue, queuePosition };
}
