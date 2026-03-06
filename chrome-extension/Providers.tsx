"use client";

import { ReactNode, useState, useEffect } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { CrispChat } from './CrispChat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LanguageProvider } from '@/components/LanguageProvider';
import { AnimatePresence } from 'framer-motion';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, 
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="removation-theme"
        >
          <LanguageProvider>
            <AnalyticsProvider>
              <TooltipProvider delayDuration={100}>
                <AnimatePresence mode="wait">
                  {children}
                </AnimatePresence>
                <Toaster />
                <CrispChat />
              </TooltipProvider>
            </AnalyticsProvider>
          </LanguageProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </QueryClientProvider>
    </AuthProvider>
  );
}

export { AnalyticsProvider } from '@/components/AnalyticsProvider';
export { CrispChat } from './CrispChat';

export default Providers;