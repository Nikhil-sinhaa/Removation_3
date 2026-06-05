'use client';
import { useEffect } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

interface UsePageTourOptions {
  tourKey: string;        // e.g. 'room_changer_tour'
  steps: DriveStep[];
  completed: boolean;     // from user object
  delay?: number;         // ms before tour starts, default 800
}

export function usePageTour({ tourKey, steps, completed, delay = 800 }: UsePageTourOptions) {
  useEffect(() => {
    if (completed) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.75,
      smoothScroll: true,
      allowClose: true,
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: 'removation-tour-popover',
      onDestroyed: async () => {
        await fetch('/api/user/complete-tour', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tourKey })
        });
      },
      steps
    });

    const timer = setTimeout(() => driverObj.drive(), delay);
    return () => {
      clearTimeout(timer);
      driverObj.destroy();
    };
  }, [completed]);
}
