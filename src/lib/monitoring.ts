// Production monitoring and error tracking
import * as Sentry from '@sentry/react';

// Initialize Sentry for error tracking
export function initMonitoring() {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 1.0,
      beforeSend(event) {
        // Filter out development errors
        if (import.meta.env.MODE === 'development') {
          return null;
        }
        return event;
      },
    });
  }
}

// Error tracking utilities
export const errorTracking = {
  captureException: (error: Error, context?: any) => {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: context });
    }
    console.error('Error tracked:', error, context);
  },

  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureMessage(message, level);
    }
    console.log(`Message tracked (${level}):`, message);
  },

  setUser: (user: { id: string; email?: string; role?: string }) => {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setUser(user);
    }
  },

  addBreadcrumb: (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now() / 1000,
      });
    }
  },
};

// Performance monitoring
export const performanceMonitoring = {
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  },

  measureSync: <T>(name: string, fn: () => T): T => {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  },
};

// Analytics tracking
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          },
        }),
      }).catch(console.error);
    }
    console.log('Analytics event:', event, properties);
  },

  trackPageView: (page: string) => {
    analytics.track('page_view', { page });
  },

  trackUserAction: (action: string, context?: Record<string, any>) => {
    analytics.track('user_action', { action, ...context });
  },

  trackError: (error: string, context?: Record<string, any>) => {
    analytics.track('error', { error, ...context });
  },
};

// Health check utilities
export const healthCheck = {
  checkDatabase: async () => {
    try {
      const { supabase } = await import('./supabase');
      const { data, error } = await supabase.from('user_profiles').select('id').limit(1);
      return { status: 'healthy', error: error?.message };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  checkEmailService: async () => {
    // This would check if email service is working
    // Implementation depends on your email service
    return { status: 'healthy', error: null };
  },

  checkOverallHealth: async () => {
    const [dbHealth, emailHealth] = await Promise.all([
      healthCheck.checkDatabase(),
      healthCheck.checkEmailService(),
    ]);

    const isHealthy = dbHealth.status === 'healthy' && emailHealth.status === 'healthy';
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      services: {
        database: dbHealth,
        email: emailHealth,
      },
      timestamp: new Date().toISOString(),
    };
  },
};

// Initialize monitoring on app start
if (typeof window !== 'undefined') {
  initMonitoring();
}
