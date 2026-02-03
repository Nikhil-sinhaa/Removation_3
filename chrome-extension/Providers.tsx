// components/Providers.tsx
"use client";

import { ReactNode, useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
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

// Clerk appearance configuration matching Spacely AI style
const clerkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: '#8B5CF6', // Purple
    colorBackground: '#0F0F0F',
    colorInputBackground: '#1A1A1A',
    colorInputText: '#FFFFFF',
    colorText: '#FFFFFF',
    colorTextSecondary: '#A1A1AA',
    colorDanger: '#EF4444',
    colorSuccess: '#22C55E',
    colorWarning: '#F59E0B',
    colorNeutral: '#71717A',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontFamilyButtons: 'Inter, system-ui, sans-serif',
    borderRadius: '0.75rem',
    spacingUnit: '1rem',
  },
  elements: {
    formButtonPrimary:
      'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all duration-200 shadow-lg shadow-purple-500/25',
    card: 'bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-2xl',
    headerTitle: 'text-white font-bold',
    headerSubtitle: 'text-zinc-400',
    socialButtonsBlockButton:
      'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white transition-all duration-200',
    socialButtonsBlockButtonText: 'text-white font-medium',
    dividerLine: 'bg-zinc-700',
    dividerText: 'text-zinc-500',
    formFieldLabel: 'text-zinc-300',
    formFieldInput:
      'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent',
    footerActionLink: 'text-purple-400 hover:text-purple-300',
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-purple-400 hover:text-purple-300',
    formFieldAction: 'text-purple-400 hover:text-purple-300',
    alertText: 'text-zinc-300',
    formFieldSuccessText: 'text-green-400',
    formFieldErrorText: 'text-red-400',
    logoImage: 'brightness-0 invert',
    navbar: 'bg-zinc-900 border-b border-zinc-800',
    navbarButton: 'text-white hover:bg-zinc-800',
    profileSectionTitle: 'text-white',
    profileSectionContent: 'text-zinc-300',
    userButtonPopoverCard: 'bg-zinc-900 border border-zinc-800',
    userButtonPopoverActionButton: 'text-zinc-300 hover:bg-zinc-800',
    userButtonPopoverActionButtonText: 'text-zinc-300',
    userButtonPopoverFooter: 'hidden',
    userPreviewMainIdentifier: 'text-white',
    userPreviewSecondaryIdentifier: 'text-zinc-400',
    organizationSwitcherTrigger: 'bg-zinc-800 border-zinc-700',
    organizationSwitcherPopoverCard: 'bg-zinc-900 border border-zinc-800',
    organizationPreviewMainIdentifier: 'text-white',
    organizationPreviewSecondaryIdentifier: 'text-zinc-400',
    membersPageInviteButton:
      'bg-purple-600 hover:bg-purple-700 text-white',
    badge: 'bg-purple-500/20 text-purple-400',
  },
  layout: {
    socialButtonsPlacement: 'bottom' as const,
    socialButtonsVariant: 'blockButton' as const,
    termsPageUrl: '/terms',
    privacyPageUrl: '/privacy',
    helpPageUrl: '/help',
    logoPlacement: 'inside' as const,
    shimmer: true,
  },
};

// Dark theme Clerk appearance
const clerkDarkAppearance = {
  ...clerkAppearance,
};

// Light theme Clerk appearance
const clerkLightAppearance = {
  ...clerkAppearance,
  variables: {
    ...clerkAppearance.variables,
    colorBackground: '#FFFFFF',
    colorInputBackground: '#F4F4F5',
    colorInputText: '#18181B',
    colorText: '#18181B',
    colorTextSecondary: '#71717A',
  },
  elements: {
    ...clerkAppearance.elements,
    card: 'bg-white border border-zinc-200 shadow-2xl',
    socialButtonsBlockButton:
      'bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-900 transition-all duration-200',
    socialButtonsBlockButtonText: 'text-zinc-900 font-medium',
    dividerLine: 'bg-zinc-200',
    dividerText: 'text-zinc-500',
    formFieldLabel: 'text-zinc-700',
    formFieldInput:
      'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent',
    alertText: 'text-zinc-700',
    navbar: 'bg-white border-b border-zinc-200',
    navbarButton: 'text-zinc-900 hover:bg-zinc-100',
    profileSectionTitle: 'text-zinc-900',
    profileSectionContent: 'text-zinc-700',
    userButtonPopoverCard: 'bg-white border border-zinc-200',
    userButtonPopoverActionButton: 'text-zinc-700 hover:bg-zinc-100',
    userButtonPopoverActionButtonText: 'text-zinc-700',
    userPreviewMainIdentifier: 'text-zinc-900',
    userPreviewSecondaryIdentifier: 'text-zinc-500',
    organizationSwitcherTrigger: 'bg-zinc-100 border-zinc-200',
    organizationSwitcherPopoverCard: 'bg-white border border-zinc-200',
    organizationPreviewMainIdentifier: 'text-zinc-900',
    organizationPreviewSecondaryIdentifier: 'text-zinc-500',
    logoImage: '',
  },
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
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

  // Prevent flash during hydration
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
    <ClerkProvider
      appearance={clerkAppearance}
      localization={{
        locale: 'en-US',
      }}
    >
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
    </ClerkProvider>
  );
}

// Export individual providers for testing/isolation
export { AnalyticsProvider } from '@/components/AnalyticsProvider';
export { CrispChat } from './CrispChat';

export default Providers;