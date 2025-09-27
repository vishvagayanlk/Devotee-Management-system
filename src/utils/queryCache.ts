// Simple in-memory cache for database queries
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Generate cache key from query parameters
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }
}

export const queryCache = new QueryCache();

// Higher-order function to wrap Supabase queries with caching
export function withCache<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey: string,
  ttl?: number
): Promise<{ data: T | null; error: any }> {
  return new Promise(async (resolve) => {
    // Check cache first
    const cached = queryCache.get<T>(cacheKey);
    if (cached) {
      resolve({ data: cached, error: null });
      return;
    }

    // Execute query
    const result = await queryFn();
    
    // Cache successful results
    if (result.data && !result.error) {
      queryCache.set(cacheKey, result.data, ttl);
    }

    resolve(result);
  });
}

// Cache invalidation helpers
export const invalidateUserCache = () => queryCache.invalidate('user:');
export const invalidateRecordsCache = () => queryCache.invalidate('records:');
export const invalidateDevoteesCache = () => queryCache.invalidate('devotees:');
export const invalidateEventsCache = () => queryCache.invalidate('events:');
export const invalidateGroupsCache = () => queryCache.invalidate('groups:');
export const invalidateDashboardCache = () => queryCache.invalidate('dashboard:');
export const invalidateStatsCache = () => queryCache.invalidate('stats:');
export const invalidateAllCache = () => queryCache.clear();
