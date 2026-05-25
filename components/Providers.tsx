'use client';

import React from 'react';
// REMOVE THIS: import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { CrispChat } from './CrispChat';
import { PWAPrompt } from './PWAPrompt';


// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// REMOVE ALL Clerk appearance configuration

import { useEffect } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { useUserStore } from '@/stores/user-store';

function PreferenceSync() {
  const { setTheme, theme } = useNextTheme();
  const dbTheme = useUserStore((state) => state.preferences?.theme);

  useEffect(() => {
    if (dbTheme && dbTheme !== theme) {
      setTheme(dbTheme);
    }
  }, [dbTheme, theme, setTheme]);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    // REMOVE: <ClerkProvider> wrapper
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="removation-theme"
      >
        <TooltipProvider delayDuration={300}>
          <PreferenceSync />
          {children}

          {/* Global Components */}
          <Toaster />
          <CrispChat />
          <PWAPrompt />
          <AnalyticsProvider />
        </TooltipProvider>
      </ThemeProvider>

      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
    // REMOVE: </ClerkProvider>
  );
}

// Keep this component for edge compatibility
export function ProvidersEdge({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default Providers;