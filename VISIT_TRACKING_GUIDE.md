# Visit Tracking Guide

Eightblock records visits with one first-party tracker. The `PageView` table is the single source of truth: the admin analytics pages read it directly, and the public view count on each article is kept in step with it.

## How a visit is recorded

`PageTracker` (`frontend/components/analytics/page-tracker.tsx`) is mounted once in the blog layout. On every route change it sends:

```
POST /api/analytics/collect          { path, timezone, referrer?, utm? }
POST /api/analytics/collect/:id      { duration, scrollDepth }   (heartbeat every 30 s, and on leave)
```

- The visitor is identified by the httpOnly `eb_vid` cookie, set by the API. Clients cannot choose or spoof it.
- A session is a run of views from one visitor with no gap longer than 30 minutes.
- Engaged time only grows while the tab is visible, and scroll depth only ever goes up.
- Bots (by user agent) get a `204` and nothing is stored.
- The editor pages (`/articles/new`, `/articles/:slug/edit`) are not tracked.

## How article views are counted

When the path is an article, the API records the page view and decides in the same transaction whether it counts toward the article's public `viewCount`:

- The article must be published.
- The reader must not be the author (only detectable when the author is signed in).
- The same visitor counts at most once per 30 minutes per article. Reloads and quick returns are still stored as page views, but do not raise the count.
- `uniqueViews` goes up the first time a visitor reads the article.

Simultaneous requests from one browser are serialised with a Postgres advisory lock, so they count once. The response is `{ id, counted, viewCount }`. The tracker passes `viewCount` to the article header, which shows the live count even when the page itself is served from cache.

## Ignoring the team's own visits

The admin app links to the blog with `?eb_analytics=off` (or `on`). The tracker stores the choice in `localStorage` (`eb_analytics_ignore`) and removes the parameter from the URL. While it is on, that browser sends nothing.

## Data model

See `PageView` in `backend/prisma/schema.prisma`. Each row holds the path, the article (if any), visitor and session ids, the signed-in user (if any), entry referrer and UTM tags, country, device, browser, OS, engaged seconds and scroll depth.

## Privacy

- No third-party scripts and no fingerprinting.
- IP addresses are not stored. Country comes from the proxy's country header or the browser's time zone.
- Referrers are reduced to a host name.
