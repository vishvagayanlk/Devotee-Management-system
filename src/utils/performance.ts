// Performance monitoring utilities
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled = process.env.NODE_ENV === 'production';

  // Measure Core Web Vitals
  measureWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // First Contentful Paint (FCP)
    this.observePaint('first-contentful-paint', 'FCP');

    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // First Input Delay (FID)
    this.observeFID();

    // Time to Interactive (TTI)
    this.observeTTI();
  }

  private observePaint(name: string, metricName: string) {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === name) {
          this.recordMetric(metricName, entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  }

  private observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordMetric('CLS', clsValue);
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private observeFID() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('FID', (entry as any).processingStart - entry.startTime);
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
  }

  private observeTTI() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && entry.name === 'TTI') {
          this.recordMetric('TTI', entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    // Measure TTI
    setTimeout(() => {
      performance.mark('tti-start');
      performance.measure('TTI', 'tti-start');
    }, 0);
  }

  // Measure custom metrics
  measureCustom(name: string, fn: () => void | Promise<void>) {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        this.recordMetric(name, end - start);
      });
    } else {
      const end = performance.now();
      this.recordMetric(name, end - start);
      return result;
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.metrics.push(metric);
    console.log(`Performance Metric: ${name} = ${value.toFixed(2)}ms`);

    // Send to analytics if configured
    this.sendToAnalytics(metric);
  }

  // Send metrics to analytics service
  private sendToAnalytics(metric: PerformanceMetric) {
    // Example: Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
        page_url: metric.url,
      });
    }

    // Example: Send to custom analytics endpoint
    if (process.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(process.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      }).catch(console.error);
    }
  }

  // Get performance summary
  getSummary() {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = { avg: 0, min: Infinity, max: -Infinity, count: 0 };
      }

      const stats = summary[metric.name];
      stats.count++;
      stats.min = Math.min(stats.min, metric.value);
      stats.max = Math.max(stats.max, metric.value);
      stats.avg = (stats.avg * (stats.count - 1) + metric.value) / stats.count;
    });

    return summary;
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component performance
export function usePerformanceMeasure(name: string, deps: any[] = []) {
  React.useEffect(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      performanceMonitor.recordMetric(`${name}_render`, end - start);
    };
  }, deps);
}

// Higher-order component for measuring render performance
export function withPerformanceMeasure<P extends object>(
  Component: React.ComponentType<P>,
  measureName: string
) {
  return React.memo((props: P) => {
    const start = performance.now();
    
    React.useEffect(() => {
      const end = performance.now();
      performanceMonitor.recordMetric(`${measureName}_mount`, end - start);
    });

    return React.createElement(Component, props);
  });
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    performanceMonitor.measureWebVitals();
    
    // Measure page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      performanceMonitor.recordMetric('page_load', loadTime);
    });
  }
}
