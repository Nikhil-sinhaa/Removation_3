'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTour } from '@/hooks/useTour';
import { GuidedTour } from './GuidedTour';

interface TourContextType {
  startTour: (tourId: string) => Promise<void>;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTourContext() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTourContext must be used within TourProvider');
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { isOpen, tour, step, currentStep, totalSteps, next, prev, dismiss, complete, startTour } = useTour();

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      <GuidedTour
        isOpen={isOpen}
        step={step}
        currentStep={currentStep}
        totalSteps={totalSteps}
        tourName={tour?.name ?? ''}
        isDismissible={tour?.isDismissible ?? true}
        onNext={next}
        onPrev={prev}
        onDismiss={dismiss}
        onComplete={complete}
      />
    </TourContext.Provider>
  );
}
