# 📊 Visit Tracking System - Complete Guide

## 🎯 Overview

Your app already has a **comprehensive analytics system** built in! Here's everything you need to know:

## ✅ What's Already Tracking

### Automatic Tracking:

- ✅ **Page views** - Every article visit
- ✅ **Unique visitors** - Deduplicated within 24 hours
- ✅ **Time on page** - How long users stay
- ✅ **Scroll depth** - How far they scroll (%)
- ✅ **Device type** - Desktop/Mobile/Tablet
- ✅ **Browser** - Chrome, Firefox, Safari, etc.
- ✅ **Operating System** - Windows, Mac, Linux, etc.
- ✅ **Referrer** - Where visitors came from
- ✅ **IP Address** - For geographic tracking
- ✅ **Trending articles** - Based on view counts

---

## 🚀 How to Use It

### Option 1: Use Existing PageViewTracker (Simple)

You already have this in your article page:

```tsx
import { PageViewTracker } from '@/lib/view-tracking';

export default function ArticlePage() {
  return (
    <>
      <PageViewTracker articleId={article.id} />
      {/* Your article content */}
    </>
  );
}
```

### Option 2: Use New Advanced Hook (Recommended)

For more control and better analytics:

```tsx
'use client';

import { useArticleTracking } from '@/hooks/useArticleTracking';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const { data: article } = useQuery({
    queryKey: ['article', params.slug],
    queryFn: () => fetchArticle(params.slug),
  });

  // 🎯 Track visits automatically
  const { isTracking, visitorId } = useArticleTracking({
    articleId: article?.id,
    enabled: !!article?.id, // Only track when article is loaded
  });

  return <div>{/* Your article content */}</div>;
}
```

---

## 📊 View Analytics Dashboard

### Add Analytics to Author's Dashboard:

```tsx
'use client';

import { AnalyticsDashboard } from '@/components/articles/AnalyticsDashboard';

export default function ArticleAnalyticsPage() {
  const articleId = 'your-article-id';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Article Analytics</h1>
      <AnalyticsDashboard articleId={articleId} />
    </div>
  );
}
```

This will show:

- 📈 Total views & unique visitors
- ⏱️ Average time on page
- 📱 Device breakdown (desktop/mobile/tablet)
- 🌐 Browser statistics
- 🔗 Traffic sources (referrers)
- 📅 Daily view timeline

---

## 🔌 API Endpoints

### 1. Track a View

```bash
POST /api/views/:articleId/track
Content-Type: application/json

{
  "visitorId": "unique-uuid",
  "timeOnPage": 120,        # seconds
  "scrollDepth": 85,        # percentage
  "referrer": "https://google.com"
}

Response:
{
  "success": true,
  "viewId": "view-uuid",
  "isUniqueView": true
}
```

### 2. Get Article Analytics

```bash
GET /api/views/:articleId/analytics?period=7d

Response:
{
  "article": {
    "id": "...",
    "title": "...",
    "totalViews": 1523,
    "totalUniqueViews": 987
  },
  "period": {
    "days": 7,
    "views": 234,
    "uniqueVisitors": 156
  },
  "metrics": {
    "avgTimeOnPage": 185,    # seconds
    "avgScrollDepth": 72     # percentage
  },
  "breakdown": {
    "devices": { "desktop": 150, "mobile": 80, "tablet": 4 },
    "browsers": { "Chrome": 180, "Safari": 45, "Firefox": 9 }
  },
  "topReferrers": [...],
  "viewsByDay": { "2025-12-13": 45, "2025-12-14": 52, ... }
}
```

### 3. Get Trending Articles

```bash
GET /api/views/trending?limit=10&period=7d

Response:
[
  {
    "id": "...",
    "title": "...",
    "slug": "...",
    "viewCount": 1523,
    "uniqueViews": 987,
    "author": {...},
    "tags": [...]
  }
]
```

---

## 🎨 Quick Implementation Examples

### 1. Add Tracking to Article Page

```tsx
// app/articles/[slug]/page.tsx
'use client';

import { useArticleTracking } from '@/hooks/useArticleTracking';

export default function ArticlePage({ params }) {
  const { data: article } = useQuery(['article', params.slug], fetchArticle);

  // ✨ Automatic tracking
  useArticleTracking({
    articleId: article?.id,
    enabled: !!article?.id,
  });

  return <div>{/* Article content */}</div>;
}
```

### 2. Show View Count in Article List

```tsx
// components/articles/article-card.tsx
export function ArticleCard({ article }) {
  return (
    <div className="card">
      <h2>{article.title}</h2>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {article.viewCount.toLocaleString()} views
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {article.uniqueViews.toLocaleString()} readers
        </span>
      </div>
    </div>
  );
}
```

### 3. Show Trending Articles

```tsx
// components/trending-articles.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function TrendingArticles() {
  const { data: trending } = useQuery({
    queryKey: ['trending-articles'],
    queryFn: async () => {
      const res = await fetch('/api/views/trending?limit=5&period=7d');
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">🔥 Trending This Week</h3>
      {trending?.map((article) => (
        <div key={article.id}>
          <h4>{article.title}</h4>
          <p className="text-sm text-muted-foreground">{article.viewCount} views</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 Advanced Features

### Custom Tracking Events

You can extend the tracking to capture more events:

```tsx
// Track external link clicks
const trackLinkClick = async (url: string) => {
  await fetch('/api/analytics/events', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'link_click',
      articleId: article.id,
      data: { url },
    }),
  });
};

// Track code snippet copies
const trackCodeCopy = async () => {
  await fetch('/api/analytics/events', {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'code_copy',
      articleId: article.id,
    }),
  });
};
```

---

## 📈 Database Schema

Your analytics data is stored in the `ArticleView` model:

```prisma
model ArticleView {
  id          String    @id @default(cuid())
  articleId   String
  article     Article   @relation(fields: [articleId], references: [id])
  visitorId   String    // Unique visitor identifier
  userId      String?   // If authenticated
  ipAddress   String?
  userAgent   String?
  referrer    String?
  device      String?   // desktop/mobile/tablet
  browser     String?
  os          String?
  country     String?
  timeOnPage  Int?      // seconds
  scrollDepth Int?      // percentage
  viewedAt    DateTime  @default(now())

  @@index([articleId])
  @@index([visitorId])
  @@index([viewedAt])
}
```

---

## 🎯 Best Practices

1. **Privacy Compliance**
   - Store visitor IDs in localStorage (not cookies)
   - Don't track personal data without consent
   - Consider GDPR/CCPA requirements

2. **Performance**
   - Use `navigator.sendBeacon()` for reliable tracking
   - Track views asynchronously
   - Don't block page rendering

3. **Accuracy**
   - Deduplicate views within 24 hours
   - Only count views with >3 seconds time on page
   - Filter out bot traffic

4. **Analytics**
   - Review metrics regularly
   - Use trending data for content strategy
   - Monitor user engagement (time + scroll depth)

---

## 🚀 Next Steps

1. **Add tracking to all article pages** ✅ Already done with PageViewTracker
2. **Create analytics dashboard** ✅ Component provided above
3. **Show trending articles** - Add TrendingArticles component to homepage
4. **Display view counts** - Add to article cards
5. **Export analytics** - Add CSV export feature

---

## 📊 Sample Analytics Dashboard

Your analytics will look like this:

```
📈 Article Analytics - Last 7 Days

┌─────────────────────────────────────────────────┐
│  Total Views: 1,523    Unique Visitors: 987     │
│  Avg Time: 3m 5s       Avg Scroll: 72%          │
└─────────────────────────────────────────────────┘

Device Breakdown:
  Desktop ████████████████░░░░  64% (150 views)
  Mobile  ████████░░░░░░░░░░░░  34% (80 views)
  Tablet  ░░░░░░░░░░░░░░░░░░░░   2% (4 views)

Top Referrers:
  1. Google Search         45 views
  2. Twitter               32 views
  3. Direct                28 views
  4. Reddit                15 views
  5. Hacker News           12 views

Daily Views:
  Mon  ███████████  45 views
  Tue  █████████████  52 views
  Wed  ████████  38 views
  Thu  ████████████  49 views
  Fri  ██████  30 views
  Sat  ████  20 views
  Sun  ████  15 views
```

---

## ✅ Summary

Your app has **enterprise-level analytics** built in:

- ✅ Automatic view tracking
- ✅ Engagement metrics (time + scroll)
- ✅ Device & browser analytics
- ✅ Traffic source tracking
- ✅ Trending algorithm
- ✅ Dashboard components ready

**Everything is ready to use!** Just add the components to your pages. 🎉
