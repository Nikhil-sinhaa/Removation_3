'use client';

import { useState, useCallback } from 'react';

interface FeedbackData {
  rating: number;
  feedbackTags?: string[];
  feedbackComment?: string;
}

interface FeedbackState {
  rating: number | null;
  feedbackTags: string[];
  feedbackComment: string;
  feedbackSubmittedAt: Date | null;
}

export function useRenderFeedback({ renderId }: { renderId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useCallback(
    async (data: FeedbackData): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`/api/renders/${renderId}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to submit feedback');
        }
        setIsSubmitted(true);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to submit feedback');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [renderId]
  );

  const fetchFeedback = useCallback(async (): Promise<FeedbackState | null> => {
    try {
      const res = await fetch(`/api/renders/${renderId}/feedback`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        rating: data.rating ?? null,
        feedbackTags: data.feedbackTags ?? [],
        feedbackComment: data.feedbackComment ?? '',
        feedbackSubmittedAt: data.feedbackSubmittedAt ? new Date(data.feedbackSubmittedAt) : null,
      };
    } catch {
      return null;
    }
  }, [renderId]);

  return { submitFeedback, fetchFeedback, isSubmitting, isSubmitted, error };
}
