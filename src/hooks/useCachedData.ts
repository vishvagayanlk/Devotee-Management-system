import { useState, useEffect, useCallback, useRef } from 'react';
import { queryCache } from '../utils/queryCache';

interface CachedDataOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
  refetchOnMount?: boolean; // Refetch when component mounts
  refetchOnWindowFocus?: boolean; // Refetch when window gains focus
}

interface CachedDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CachedDataOptions = {}
): CachedDataResult<T> {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;

    // Check cache first if not forcing
    if (!force) {
      const cached = queryCache.get<T>(key);
      if (cached) {
        setData(cached);
        setError(null);
        
        // If staleWhileRevalidate is enabled, fetch fresh data in background
        if (staleWhileRevalidate && Date.now() - lastFetchRef.current > ttl) {
          // Don't await this - let it run in background
          fetchData(true).catch(console.error);
        }
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      if (isMountedRef.current) {
        setData(result);
        queryCache.set(key, result, ttl);
        lastFetchRef.current = Date.now();
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, fetchFn, ttl, staleWhileRevalidate]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);
  const invalidate = useCallback(() => {
    queryCache.invalidate(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchData(refetchOnMount);
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, refetchOnMount]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, refetchOnWindowFocus]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  };
}

// Hook for caching Supabase queries specifically
export function useCachedSupabaseQuery<T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: CachedDataOptions = {}
): CachedDataResult<T> {
  const wrappedQueryFn = useCallback(async () => {
    const result = await queryFn();
    if (result.error) {
      throw new Error(result.error.message || 'Query failed');
    }
    return result.data;
  }, [queryFn]);

  return useCachedData(key, wrappedQueryFn, options);
}

// Hook for caching dashboard stats
export function useCachedDashboardStats(
  profileId: string,
  isAdmin: boolean,
  isCommittee: boolean
) {
  const key = `dashboard-stats-${profileId}-${isAdmin}-${isCommittee}`;
  
  const fetchStats = useCallback(async () => {
    const { supabase } = await import('../lib/supabase');
    
    if (isAdmin) {
      const results = await Promise.allSettled([
        supabase.from('devotee_records').select('id', { count: 'exact' }),
        supabase.from('temple_events').select('id', { count: 'exact' }),
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('user_profiles').select('id', { count: 'exact' }).eq('is_approved', false),
        supabase.from('devotee_records').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('temple_events').select('title, start_date, user_id').gte('start_date', new Date().toISOString()).order('start_date', { ascending: true }).limit(5),
      ]);

      const [recordsRes, eventsRes, devoteesRes, pendingRes, recentRecordsRes, upcomingEventsRes] = results.map(result => 
        result.status === 'fulfilled' ? result.value : { count: 0, data: [], error: null }
      );

      return {
        totalRecords: recordsRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalDevotees: devoteesRes.count || 0,
        pendingDevotees: pendingRes.count || 0,
        recentRecords: (recentRecordsRes as any).data || [],
        upcomingEvents: (upcomingEventsRes as any).data || [],
      };
    } else if (isCommittee) {
      const results = await Promise.allSettled([
        supabase.from('devotee_records').select('id', { count: 'exact' }),
        supabase.from('temple_events').select('id', { count: 'exact' }),
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        Promise.resolve({ count: 0 }), // Committee can't see pending users
        supabase.from('devotee_records').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('temple_events').select('title, start_date, user_id').gte('start_date', new Date().toISOString()).order('start_date', { ascending: true }).limit(5),
      ]);

      const [recordsRes, eventsRes, devoteesRes, pendingRes, recentRecordsRes, upcomingEventsRes] = results.map(result => 
        result.status === 'fulfilled' ? result.value : { count: 0, data: [], error: null }
      );

      return {
        totalRecords: recordsRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalDevotees: devoteesRes.count || 0,
        pendingDevotees: pendingRes.count || 0,
        recentRecords: (recentRecordsRes as any).data || [],
        upcomingEvents: (upcomingEventsRes as any).data || [],
      };
    } else {
      // For regular users
      const results = await Promise.allSettled([
        supabase.from('devotee_records').select('id', { count: 'exact' }).eq('user_id', profileId),
        supabase.from('temple_events').select('id', { count: 'exact' }).eq('user_id', profileId),
        supabase.from('event_assignments').select('event_id').eq('user_id', profileId),
        supabase.from('devotee_records').select('title, created_at').eq('user_id', profileId).order('created_at', { ascending: false }).limit(5),
        supabase.from('temple_events').select('title, start_date').eq('user_id', profileId).gte('start_date', new Date().toISOString()).order('start_date', { ascending: true }).limit(5),
      ]);

      const [recordsRes, createdEventsRes, assignedEventsRes, recentRecordsRes, createdUpcomingRes] = results.map(result => 
        result.status === 'fulfilled' ? result.value : { count: 0, data: [], error: null }
      );

      // Get assigned event IDs
      const assignedEventIds = assignedEventsRes.data?.map((assignment: any) => assignment.event_id) || [];
      
      // Fetch assigned events details
      let assignedEventsData: any[] = [];
      let assignedUpcomingData: any[] = [];
      if (assignedEventIds.length > 0) {
        const assignedEventsRes = await supabase
          .from('temple_events')
          .select('id, title, start_date')
          .in('id', assignedEventIds);
        
        if (assignedEventsRes.data) {
          assignedEventsData = assignedEventsRes.data;
          assignedUpcomingData = assignedEventsRes.data
            .filter((event: any) => new Date(event.start_date) >= new Date())
            .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
            .slice(0, 5);
        }
      }

      // Combine created and assigned events
      const totalEvents = (createdEventsRes.count || 0) + assignedEventsData.length;
      const allUpcomingEvents = [
        ...(createdUpcomingRes.data || []),
        ...assignedUpcomingData
      ].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).slice(0, 5);

      return {
        totalRecords: recordsRes.count || 0,
        totalEvents: totalEvents,
        recentRecords: recentRecordsRes.data || [],
        upcomingEvents: allUpcomingEvents,
      };
    }
  }, [profileId, isAdmin, isCommittee]);

  return useCachedData(key, fetchStats, {
    ttl: 2 * 60 * 1000, // 2 minutes for dashboard stats
    staleWhileRevalidate: true,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}
