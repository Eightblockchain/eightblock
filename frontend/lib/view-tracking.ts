// View tracking utilities for analytics

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Generate or retrieve visitor ID (browser fingerprint)
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem('visitorId');

  if (!visitorId) {
    // Create fingerprint based on browser characteristics
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width,
      screen.height,
      screen.colorDepth,
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    visitorId = `visitor_${Math.abs(hash)}_${Date.now()}`;
    localStorage.setItem('visitorId', visitorId);
  }

  return visitorId;
}

// Track page view with timing and engagement metrics
export class PageViewTracker {
  private articleId: string;
  private visitorId: string;
  private startTime: number;
  private maxScrollDepth: number = 0;
  private tracked: boolean = false;

  constructor(articleId: string) {
    this.articleId = articleId;
    this.visitorId = getVisitorId();
    this.startTime = Date.now();

    // Track scroll depth
    this.trackScrollDepth();

    // Send view data when user leaves
    this.setupBeforeUnload();
  }

  private trackScrollDepth() {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      const scrollPercentage = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

      this.maxScrollDepth = Math.max(this.maxScrollDepth, Math.min(scrollPercentage, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    handleScroll();
  }

  private setupBeforeUnload() {
    if (typeof window === 'undefined') return;

    const sendData = () => {
      if (!this.tracked) {
        this.sendViewData();
      }
    };

    // Send data when user navigates away
    window.addEventListener('beforeunload', sendData);
    window.addEventListener('pagehide', sendData);

    // Also send data after 30 seconds as a heartbeat
    setTimeout(() => sendData(), 30000);
  }

  private async sendViewData() {
    if (this.tracked) return;
    this.tracked = true;

    const timeOnPage = Math.round((Date.now() - this.startTime) / 1000); // seconds

    try {
      const response = await fetch(`${API_URL}/views/${this.articleId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorId: this.visitorId,
          timeOnPage,
          scrollDepth: this.maxScrollDepth,
          referrer: document.referrer || undefined,
        }),
        // Use sendBeacon if available for more reliable tracking
        keepalive: true,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('View tracked:', data);
      }
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  }

  // Manual method to send data (e.g., when user clicks away)
  public async track() {
    await this.sendViewData();
  }
}

// Fetch article analytics
export async function getArticleAnalytics(articleId: string, period: string = '7d') {
  try {
    const response = await fetch(`${API_URL}/views/${articleId}/analytics?period=${period}`);

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return null;
  }
}

// Fetch trending articles
export async function getTrendingArticles(limit: number = 10, period: string = '7d') {
  try {
    const response = await fetch(`${API_URL}/views/trending?limit=${limit}&period=${period}`);

    if (!response.ok) {
      throw new Error('Failed to fetch trending articles');
    }

    return await response.json();
  } catch (error) {
    console.error('Trending articles fetch error:', error);
    return [];
  }
}
