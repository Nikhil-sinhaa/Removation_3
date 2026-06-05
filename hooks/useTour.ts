'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  disableBackdrop?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
  isDismissible: boolean;
}

interface UseTourReturn {
  isOpen: boolean;
  tour: Tour | null;
  currentStep: number;
  totalSteps: number;
  step: TourStep | null;
  next: () => void;
  prev: () => void;
  dismiss: () => void;
  complete: () => void;
  startTour: (tourId: string) => Promise<void>;
}

export function useTour(): UseTourReturn {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [tour, setTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const fetchedRef = useRef<string>('');

  // Fire-and-forget progress reporter
  const reportProgress = useCallback(
    (tourId: string, action: string, step?: number) => {
      fetch(`/api/tours/${tourId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, step }),
      }).catch(() => {});
    },
    []
  );

  // Fetch active tour for current page on navigation change
  useEffect(() => {
    const key = pathname;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    const fetchTour = async () => {
      try {
        const res = await fetch(`/api/tours?pathname=${encodeURIComponent(pathname)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.tour) {
          setTour(data.tour);
          setCurrentStep(data.currentStep ?? 0);
          setIsOpen(true);
        }
      } catch {
        // Non-blocking: silently fail
      }
    };

    fetchTour();
  }, [pathname]);

  const next = useCallback(() => {
    if (!tour) return;
    const nextStep = currentStep + 1;
    if (nextStep >= tour.steps.length) {
      complete();
    } else {
      setCurrentStep(nextStep);
      reportProgress(tour.id, 'next', nextStep);
    }
  }, [tour, currentStep, reportProgress]);

  const prev = useCallback(() => {
    if (!tour) return;
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    reportProgress(tour.id, 'next', prevStep);
  }, [tour, currentStep, reportProgress]);

  const dismiss = useCallback(() => {
    if (!tour) return;
    reportProgress(tour.id, 'dismiss');
    setIsOpen(false);
    setTimeout(() => {
      setTour(null);
      setCurrentStep(0);
    }, 400);
  }, [tour, reportProgress]);

  const complete = useCallback(() => {
    if (!tour) return;
    reportProgress(tour.id, 'complete');
    setIsOpen(false);
    setTimeout(() => {
      setTour(null);
      setCurrentStep(0);
    }, 400);
  }, [tour, reportProgress]);

  const startTour = useCallback(async (tourId: string) => {
    try {
      await fetch(`/api/tours/${tourId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const res = await fetch(`/api/tours?pathname=${encodeURIComponent(pathname)}`);
      if (!res.ok) return;
      const data = await res.json();
      // If this tour is for a different page, just navigate
      if (!data.tour || data.tour.id !== tourId) {
        window.location.reload();
        return;
      }
      setTour(data.tour);
      setCurrentStep(0);
      setIsOpen(true);
    } catch {
      // Non-blocking
    }
  }, [pathname]);

  const step = tour?.steps[currentStep] ?? null;

  return {
    isOpen,
    tour,
    currentStep,
    totalSteps: tour?.steps.length ?? 0,
    step,
    next,
    prev,
    dismiss,
    complete,
    startTour,
  };
}
