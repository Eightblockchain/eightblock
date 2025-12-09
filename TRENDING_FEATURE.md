# Trending Articles Feature

## Overview

Replaced the "Featured Articles" section with an intelligent **"Trending Now"** section that dynamically surfaces the most engaging content based on community interactions.

## Implementation Details

### 1. Trending Algorithm (`useTrendingArticles.ts`)

The trending system uses a sophisticated scoring algorithm that combines:

#### Engagement Score

```typescript
Score = (Likes × 1) + (Comments × 2)
```

- **Likes**: 1x weight (simple engagement)
- **Comments**: 2x weight (prioritizes discussion and deeper engagement)

#### Time Decay Factor

```typescript
Decay = 0.5 ^ (daysSincePublished / halfLife);
```

- **Half-life**: 7 days
- Articles lose 50% of their trending relevance every 7 days
- Ensures fresh content surfaces while giving older popular content a chance

#### Final Trending Score

```typescript
TrendingScore = EngagementScore × TimeDecay
```

### 2. Components

#### `TrendingArticleCard` Component

Enhanced article card specifically designed for trending articles:

- **Ranking badges**: Top 3 articles get special gradient badges (#1, #2, #3)
- **Engagement metrics**: Visible likes and comments counts with icons
- **Visual indicators**: Filled heart/message icons to show activity
- **Author info**: Avatar and name prominently displayed
- **Hover effects**: Scale and shadow transitions for better UX

#### `TrendingArticlesSection`

- Smart layout: Grid (≤3 articles) or Carousel (>3 articles)
- Section header with fire emoji and description
- Smooth carousel navigation with drag support

### 3. Key Features

✅ **Smart Filtering**: Only shows articles with engagement (likes + comments > 0)
✅ **Recency Bias**: Recent articles get a boost through time decay
✅ **Real-time Updates**: Refreshes every 5 minutes automatically
✅ **Top 6 Display**: Shows the top 6 trending articles by default
✅ **Professional UI**: Clean, modern design with engagement indicators
✅ **Responsive**: Works seamlessly on mobile and desktop

### 4. User Experience Improvements

**Before (Featured):**

- Static, manually curated articles
- No indication of popularity
- No engagement metrics visible
- Basic card design

**After (Trending):**

- Dynamic, algorithm-driven content
- Clear ranking for top 3 articles
- Visible likes and comments counts
- Enhanced card with engagement indicators
- Subtitle explaining the criteria

### 5. Technical Architecture

```
HomePage
  └── TrendingArticlesSection
        ├── TrendingCarousel (if >3 articles)
        │     └── TrendingArticleCard (with rank & engagement)
        └── TrendingGrid (if ≤3 articles)
              └── TrendingArticleCard (with rank & engagement)
```

### 6. Performance Optimizations

- **Caching**: 5-minute stale time prevents excessive API calls
- **Auto-refresh**: Background refresh every 5 minutes keeps data fresh
- **Client-side sorting**: Heavy computation done once, cached efficiently
- **Lazy loading**: Images load on demand with proper error handling

### 7. Configuration Options

```typescript
useTrendingArticles({
  limit: 6, // Number of trending articles (default: 6)
  enabled: true, // Enable/disable the query (default: true)
});
```

### 8. Exported Utilities

For testing or external use:

```typescript
import { trendingUtils } from '@/hooks/useTrendingArticles';

// Available utilities:
-calculateEngagementScore(article) -
  calculateTimeDecay(publishedAt) -
  calculateTrendingScore(article) -
  sortByTrending(articles);
```

## Files Changed/Created

### New Files

- `/frontend/hooks/useTrendingArticles.ts` - Trending algorithm and hook
- `/frontend/components/articles/trending-article-card.tsx` - Enhanced article card

### Modified Files

- `/frontend/app/page.tsx` - Replaced featured section with trending
- Component renames: `FeaturedArticlesSection` → `TrendingArticlesSection`
- Component renames: `FeaturedCarousel` → `TrendingCarousel`
- Component renames: `FeaturedGrid` → `TrendingGrid`

### Deprecated

- `/frontend/hooks/useFeaturedArticles.ts` (can be removed if not used elsewhere)

## Future Enhancements

Potential improvements for the trending system:

1. **View Count Integration**: Include view counts in engagement score
2. **Category-based Trending**: Separate trending lists per category
3. **Personalized Trending**: User-specific trending based on interests
4. **Trending Badges**: Visual indicators on article cards throughout the site
5. **Trending History**: Track trending articles over time
6. **Share Count**: Include social shares in the algorithm
7. **Author Reputation**: Boost articles from high-reputation authors
8. **A/B Testing**: Test different weight configurations

## Migration Notes

No database changes required. The feature works with existing article data and engagement metrics (`_count.likes`, `_count.comments`).

To revert to featured articles, simply:

1. Replace `useTrendingArticles` import with `useFeaturedArticles`
2. Rename components back to `Featured*`
3. Remove the trending algorithm hook
