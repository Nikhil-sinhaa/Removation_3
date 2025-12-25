'use client';

import React, { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// Initialize PostHog
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // We'll handle this manually
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    autocapture: {
      dom_event_allowlist: ['click', 'submit', 'change'],
      url_allowlist: ['removation.ai'],
      element_allowlist: ['button', 'a', 'input', 'select', 'textarea'],
      css_selector_allowlist: ['[data-track]'],
    },
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        // Disable in development unless explicitly enabled
        if (!process.env.NEXT_PUBLIC_POSTHOG_DEBUG) {
          posthog.opt_out_capturing();
        }
      }
    },
    bootstrap: {
      distinctID: undefined,
      isIdentifiedID: false,
    },
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-mask]',
    },
  });
}

interface AnalyticsProviderProps {
  children?: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Track page views
  useEffect(() => {
    if (!pathname) return;

    const url = window.origin + pathname;
    const search = searchParams?.toString();
    
    posthog.capture('$pageview', {
      $current_url: search ? `${url}?${search}` : url,
      path: pathname,
      referrer: document.referrer,
      title: document.title,
    });
  }, [pathname, searchParams]);

  // Identify user when loaded
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.emailAddresses?.[0]?.emailAddress,
        name: user.fullName || user.firstName,
        username: user.username,
        avatar: user.imageUrl,
        createdAt: user.createdAt?.toISOString(),
        plan: user.publicMetadata?.plan || 'free',
        credits: user.publicMetadata?.credits || 0,
      });

      // Set user properties for segmentation
      posthog.people.set({
        plan: user.publicMetadata?.plan || 'free',
        signupSource: user.publicMetadata?.signupSource,
        language: user.publicMetadata?.language || 'en',
      });
    } else {
      posthog.reset();
    }
  }, [user, isLoaded]);

  return children ? (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  ) : null;
}

// Analytics tracking utilities
export const analytics = {
  // Track custom events
  track: (event: string, properties?: Record<string, any>) => {
    posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  },

  // Track feature usage
  trackFeature: (feature: string, properties?: Record<string, any>) => {
    posthog.capture('feature_used', {
      feature,
      ...properties,
    });
  },

  // Track generation events
  trackGeneration: (type: string, properties: {
    roomType?: string;
    style?: string;
    mode?: string;
    duration?: number;
    success?: boolean;
    error?: string;
  }) => {
    posthog.capture('generation_completed', {
      type,
      ...properties,
    });
  },

  // Track conversion events
  trackConversion: (type: string, properties?: Record<string, any>) => {
    posthog.capture('conversion', {
      type,
      ...properties,
    });
  },

  // Track subscription events
  trackSubscription: (action: 'started' | 'upgraded' | 'downgraded' | 'canceled', properties: {
    plan: string;
    previousPlan?: string;
    amount?: number;
    currency?: string;
  }) => {
    posthog.capture(`subscription_${action}`, properties);
  },

  // Track errors
  trackError: (error: Error | string, context?: Record<string, any>) => {
    posthog.capture('error_occurred', {
      error: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      ...context,
    });
  },

  // Track Vastu analysis
  trackVastuAnalysis: (properties: {
    score: number;
    roomType: string;
    issuesFound: number;
    suggestionsApplied?: number;
  }) => {
    posthog.capture('vastu_analysis', properties);
  },

  // Track cost calculation
  trackCostCalculation: (properties: {
    roomType: string;
    city: string;
    currency: 'usd' | 'inr';
    totalCost: number;
    materialCost: number;
    laborCost: number;
  }) => {
    posthog.capture('cost_calculated', properties);
  },

  // Track user engagement
  trackEngagement: (action: string, properties?: Record<string, any>) => {
    posthog.capture('user_engagement', {
      action,
      ...properties,
    });
  },

  // A/B Testing - get feature flag value
  getFeatureFlag: (flag: string): boolean | string | undefined => {
    return posthog.getFeatureFlag(flag);
  },

  // A/B Testing - check if feature is enabled
  isFeatureEnabled: (flag: string): boolean => {
    return posthog.isFeatureEnabled(flag) || false;
  },

  // Opt out of tracking
  optOut: () => {
    posthog.opt_out_capturing();
  },

  // Opt in to tracking
  optIn: () => {
    posthog.opt_in_capturing();
  },

  // Check if opted out
  hasOptedOut: (): boolean => {
    return posthog.has_opted_out_capturing();
  },

  // Reset user (on logout)
  reset: () => {
    posthog.reset();
  },
};

// React hook for analytics
export function useAnalytics() {
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  }, []);

  const trackFeature = useCallback((feature: string, properties?: Record<string, any>) => {
    analytics.trackFeature(feature, properties);
  }, []);

  const trackGeneration = useCallback((type: string, properties: Parameters<typeof analytics.trackGeneration>[1]) => {
    analytics.trackGeneration(type, properties);
  }, []);

  return {
    // Return individual callback functions
    trackEvent,
    trackFeature,
    trackGeneration,
    // Spread only the non-duplicate functions from analytics object
    trackConversion: analytics.trackConversion,
    trackSubscription: analytics.trackSubscription,
    trackError: analytics.trackError,
    trackVastuAnalysis: analytics.trackVastuAnalysis,
    trackCostCalculation: analytics.trackCostCalculation,
    trackEngagement: analytics.trackEngagement,
    getFeatureFlag: analytics.getFeatureFlag,
    isFeatureEnabled: analytics.isFeatureEnabled,
    optOut: analytics.optOut,
    optIn: analytics.optIn,
    hasOptedOut: analytics.hasOptedOut,
    reset: analytics.reset,
  };
}

export default AnalyticsProvider;