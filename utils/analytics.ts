/**
 * Privacy-friendly analytics tracking utility
 * Tracks user behavior while respecting privacy and GDPR compliance
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  page?: string;
  referrer?: string;
  userAgent?: string;
}

interface PageView {
  page: string;
  title: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
}

class Analytics {
  private config: AnalyticsConfig;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private pageViewQueue: PageView[] = [];
  private userId: string | null = null;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production' && !this.isDoNotTrackEnabled(),
      debug: process.env.NODE_ENV === 'development',
      endpoint: process.env.ANALYTICS_ENDPOINT || '/api/analytics',
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeUserIdentity();
    this.startFlushTimer();
    this.trackPageView();

    if (this.config.debug) {
      console.log('Analytics initialized:', {
        enabled: this.config.enabled,
        sessionId: this.sessionId,
        userId: this.userId,
      });
    }
  }

  /**
   * Check if user has enabled Do Not Track
   */
  private isDoNotTrackEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const w: any = window as any;
    return navigator.doNotTrack === '1' || w.doNotTrack === '1' || (navigator as any).msDoNotTrack === '1';
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initialize user identity from local storage
   */
  private initializeUserIdentity(): void {
    if (typeof window === 'undefined') return;

    try {
      // Try to get existing user ID
      let storedUserId = localStorage.getItem('analytics_user_id');

      if (!storedUserId) {
        // Generate new user ID
        storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('analytics_user_id', storedUserId);
      }

      this.userId = storedUserId;
    } catch (error) {
      // Local storage might be disabled
      this.userId = null;
    }
  }

  /**
   * Start flush timer for batch sending
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Get current page information
   */
  private getPageInfo(): { page: string; title: string; referrer?: string } {
    if (typeof window === 'undefined') {
      return { page: '', title: '' };
    }

    return {
      page: window.location.pathname + window.location.search,
      title: document.title,
      referrer: document.referrer,
    };
  }

  /**
   * Extract UTM parameters from URL
   */
  private getUTMParameters(): Record<string, string> {
    if (typeof window === 'undefined') return {};

    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};

    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');

    if (utmSource) utmParams.utmSource = utmSource;
    if (utmMedium) utmParams.utmMedium = utmMedium;
    if (utmCampaign) utmParams.utmCampaign = utmCampaign;

    return utmParams;
  }

  /**
   * Track page view
   */
  public trackPageView(page?: string, title?: string): void {
    if (!this.config.enabled) return;

    const pageInfo = this.getPageInfo();
    const utmParams = this.getUTMParameters();

    const pageView: PageView = {
      page: page || pageInfo.page,
      title: title || pageInfo.title,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      referrer: pageInfo.referrer,
      ...utmParams,
    };

    this.pageViewQueue.push(pageView);

    if (this.config.debug) {
      console.log('Page view tracked:', pageView);
    }

    // Flush immediately for page views
    this.flushPageViews();
  }

  /**
   * Track custom event
   */
  public track(event: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) return;

    const pageInfo = this.getPageInfo();

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      page: pageInfo.page,
      referrer: pageInfo.referrer,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.eventQueue.push(analyticsEvent);

    if (this.config.debug) {
      console.log('Event tracked:', analyticsEvent);
    }

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track name generation events
   */
  public trackNameGeneration(properties: {
    planType: string;
    nameCount: number;
    gender: string;
    isAuthenticated: boolean;
    hasPersonalityTraits?: boolean;
    generationTime?: number;
  }): void {
    this.track('name_generated', {
      category: 'engagement',
      ...properties,
    });
  }

  /**
   * Track user interactions
   */
  public trackInteraction(element: string, action: string, properties?: Record<string, any>): void {
    this.track('interaction', {
      category: 'user_behavior',
      element,
      action,
      ...properties,
    });
  }

  /**
   * Track conversion events
   */
  public trackConversion(type: string, value?: number, properties?: Record<string, any>): void {
    this.track('conversion', {
      category: 'conversion',
      type,
      value,
      ...properties,
    });
  }

  /**
   * Track errors
   */
  public trackError(error: string, context?: string, properties?: Record<string, any>): void {
    this.track('error', {
      category: 'error',
      error,
      context,
      ...properties,
    });
  }

  /**
   * Identify user
   */
  public identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('analytics_user_id', userId);
      } catch (error) {
        // Local storage disabled
      }
    }

    this.track('identify', { traits });
  }

  /**
   * Reset user identity
   */
  public reset(): void {
    this.userId = null;
    this.sessionId = this.generateSessionId();

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('analytics_user_id');
      } catch (error) {
        // Local storage disabled
      }
    }
  }

  /**
   * Flush events queue
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      // Re-add events to queue if send failed
      this.eventQueue.unshift(...events);

      if (this.config.debug) {
        console.error('Failed to send analytics events:', error);
      }
    }
  }

  /**
   * Flush page views queue
   */
  private async flushPageViews(): Promise<void> {
    if (this.pageViewQueue.length === 0) return;

    const pageViews = [...this.pageViewQueue];
    this.pageViewQueue = [];

    try {
      await this.sendPageViews(pageViews);
    } catch (error) {
      // Re-add page views to queue if send failed
      this.pageViewQueue.unshift(...pageViews);

      if (this.config.debug) {
        console.error('Failed to send page views:', error);
      }
    }
  }

  /**
   * Send events to analytics endpoint
   */
  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.endpoint) return;

    await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'events',
        data: events,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Send page views to analytics endpoint
   */
  private async sendPageViews(pageViews: PageView[]): Promise<void> {
    if (!this.config.endpoint) return;

    await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'page_views',
        data: pageViews,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Destroy analytics instance
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining events
    this.flush();
    this.flushPageViews();
  }
}

// Global analytics instance
let analytics: Analytics | null = null;

/**
 * Initialize analytics
 */
export function initAnalytics(config?: Partial<AnalyticsConfig>): Analytics {
  if (typeof window === 'undefined') {
    // Return mock instance for server-side
    return new Analytics({ enabled: false, ...config });
  }

  if (!analytics) {
    analytics = new Analytics(config);
  }

  return analytics;
}

/**
 * Get analytics instance
 */
export function getAnalytics(): Analytics | null {
  return analytics;
}

/**
 * React hook for analytics
 */
export function useAnalytics() {
  return {
    track: (event: string, properties?: Record<string, any>) => {
      analytics?.track(event, properties);
    },
    trackNameGeneration: (properties: any) => {
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

export default Analytics;
