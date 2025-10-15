"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initAnalytics, getAnalytics } from '@/utils/analytics';
import { useUser } from '@/hooks/use-user';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const analyticsInitialized = useRef(false);

  useEffect(() => {
    // Initialize analytics only once
    if (!analyticsInitialized.current && typeof window !== 'undefined') {
      const analytics = initAnalytics({
        enabled: process.env.NODE_ENV === 'production',
        debug: process.env.NODE_ENV === 'development',
        batchSize: 10,
        flushInterval: 30000, // 30 seconds
      });

      analyticsInitialized.current = true;

      // Clean up analytics on unmount
      return () => {
        analytics.destroy();
      };
    }
  }, []);

  // Track page views
  useEffect(() => {
    const analytics = getAnalytics();
    if (!analytics || !pathname) return;

    // Track page view with full URL including search params
    const fullUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    analytics.trackPageView(fullUrl, document.title);
  }, [pathname, searchParams]);

  // Identify user when authenticated
  useEffect(() => {
    const analytics = getAnalytics();
    if (!analytics || !user) return;

    analytics.identify(user.id, {
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    });
  }, [user]);

  // Track errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const analytics = getAnalytics();
      if (!analytics) return;

      analytics.trackError(event.message, 'global', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const analytics = getAnalytics();
      if (!analytics) return;

      analytics.trackError('Unhandled promise rejection', 'global', {
        reason: event.reason,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}

/**
 * Hook to track analytics events
 */
export function useAnalytics() {
  const analytics = getAnalytics();

  return {
    track: (event: string, properties?: Record<string, any>) => {
      analytics?.track(event, properties);
    },
    trackNameGeneration: (properties: {
      planType: string;
      nameCount: number;
      gender: string;
      isAuthenticated: boolean;
      hasPersonalityTraits?: boolean;
      generationTime?: number;
    }) => {
      analytics?.trackNameGeneration(properties);
    },
    trackInteraction: (element: string, action: string, properties?: Record<string, any>) => {
      analytics?.trackInteraction(element, action, properties);
    },
    trackConversion: (type: string, value?: number, properties?: Record<string, any>) => {
      analytics?.trackConversion(type, value, properties);
    },
    trackError: (error: string, context?: string, properties?: Record<string, any>) => {
      analytics?.trackError(error, context, properties);
    },
    identify: (userId: string, traits?: Record<string, any>) => {
      analytics?.identify(userId, traits);
    },
    pageView: (page?: string, title?: string) => {
      analytics?.trackPageView(page, title);
    },
  };
}