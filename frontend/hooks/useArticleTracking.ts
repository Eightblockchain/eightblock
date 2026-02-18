import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// CSRF token handling
const CSRF_COOKIE_NAME = 'csrf_token';

function getBrowserCsrfToken() {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

interface TrackViewOptions {
  articleId: string;
  enabled?: boolean;
}

interface VisitorAnalytics {
  timeOnPage: number;
  scrollDepth: number;
  referrer: string;
}

/**
 * Hook to track article views and user engagement
 * Automatically tracks time on page and scroll depth
 */
export function useArticleTracking({ articleId, enabled = true }: TrackViewOptions) {
  const [isTracking, setIsTracking] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const hasTrackedRef = useRef<boolean>(false);

  // Get or create visitor ID
  const getVisitorId = () => {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = uuidv4();
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  };

  // Calculate scroll depth
  const calculateScrollDepth = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
    return Math.min(scrollPercent, 100);
  };

  // Track scroll depth
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollDepth = calculateScrollDepth();
      if (scrollDepth > maxScrollRef.current) {
        maxScrollRef.current = scrollDepth;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled]);

  // Track view when component mounts
  useEffect(() => {
    if (!enabled || !articleId || hasTrackedRef.current) return;

    const trackView = async () => {
      try {
        setIsTracking(true);
        const visitorId = getVisitorId();
        const referrer = document.referrer || window.location.origin;

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        const csrfToken = getBrowserCsrfToken();
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/views/${articleId}/track`,
          {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              visitorId,
              referrer,
            }),
          }
        );

        if (response.ok) {
          hasTrackedRef.current = true;
          console.log('✅ View tracked successfully');
        }
      } catch (error) {
        console.error('Failed to track view:', error);
      } finally {
        setIsTracking(false);
      }
    };

    trackView();
  }, [articleId, enabled]);

  // Send final analytics when user leaves
  useEffect(() => {
    if (!enabled || !articleId) return;

    const sendFinalAnalytics = async () => {
      if (!hasTrackedRef.current) return;

      const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000);
      const scrollDepth = maxScrollRef.current;

      // Only send if user spent more than 3 seconds
      if (timeOnPage < 3) return;

      const visitorId = getVisitorId();

      try {
        // Use sendBeacon for reliable tracking even when page is closing
        const data = JSON.stringify({
          visitorId,
          timeOnPage,
          scrollDepth,
          referrer: document.referrer || window.location.origin,
        });

        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(`${process.env.NEXT_PUBLIC_API_URL}/views/${articleId}/track`, blob);
      } catch (error) {
        console.error('Failed to send final analytics:', error);
      }
    };

    // Track before page unload
    window.addEventListener('beforeunload', sendFinalAnalytics);

    return () => {
      sendFinalAnalytics();
      window.removeEventListener('beforeunload', sendFinalAnalytics);
    };
  }, [articleId, enabled]);

  return {
    isTracking,
    visitorId: getVisitorId(),
  };
}

/**
 * Hook to fetch article analytics
 */
export function useArticleAnalytics(articleId: string, period: '7d' | '30d' | '90d' = '7d') {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/views/${articleId}/analytics?period=${period}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [articleId, period]);

  return { analytics, loading, error };
}
