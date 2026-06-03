'use client';
import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useDashboardTour(shouldShow: boolean) {
  useEffect(() => {
    if (!shouldShow) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: '#000',
      overlayOpacity: 0.75,
      smoothScroll: true,
      allowClose: true,
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: 'removation-tour-popover',
      onDestroyed: async () => {
        try {
          await fetch('/api/user/complete-tour', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tourKey: 'dashboard_tour' }),
          });
        } catch (error) {
          console.error('Failed to mark tour as complete', error);
        }
      },
      steps: [
        {
          element: '[data-tour="sidebar-ai-studio"]',
          popover: {
            title: '🎨 AI Design Studio',
            description: 'Your AI tools live here. Start with Room Changer to repaint walls, or Master Design for a full room transformation.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="sidebar-browse-designers"]',
          popover: {
            title: '👩‍🎨 Browse Designers',
            description: 'After your AI render, book a verified local designer to make it real. Designers are vetted and reviewed.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="dashboard-credits"]',
          popover: {
            title: '⚡ Your Credits',
            description: 'Each AI render uses 1-3 credits depending on the tool. You started with 10 free credits. Buy more anytime.',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '[data-tour="dashboard-quick-actions"]',
          popover: {
            title: '🚀 Quick Actions',
            description: 'Jump straight into any AI tool from here. Room Changer and Full Redesign are the most popular.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '[data-tour="dashboard-recent-projects"]',
          popover: {
            title: '📁 Your Projects',
            description: 'All your AI renders are saved here automatically. Tap any project to view, download, or share.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '[data-tour="sidebar-my-bookings"]',
          popover: {
            title: '📅 My Bookings',
            description: 'Once you book a designer, track the status here — from pending to confirmed to completed.',
            side: 'right',
            align: 'start'
          }
        },
        {
          // Final step — no element, centered popover
          popover: {
            title: "🎉 You're all set!",
            description: 'Start by uploading a room photo in the Room Changer. Your first render is free. Let\'s design something beautiful!',
            align: 'center'
          }
        }
      ]
    });

    // Small delay to let the page render fully
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 1000);

    return () => {
      clearTimeout(timer);
      driverObj.destroy();
    };
  }, [shouldShow]);
}
