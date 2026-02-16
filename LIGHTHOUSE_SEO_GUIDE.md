# Lighthouse SEO Audit Guide

This guide walks you through running Lighthouse audits to measure and improve your site's SEO, performance, accessibility, and best practices.

## Quick Start: Run Lighthouse

### Option 1: Chrome DevTools (Easiest)

1. Open Chrome/Edge
2. Navigate to your site (e.g., `https://eightblock.dev`)
3. Press `F12` or `Ctrl+Shift+I` (Mac: `Cmd+Opt+I`)
4. Click **Lighthouse** tab
5. Select categories: ✅ Performance, ✅ Accessibility, ✅ Best Practices, ✅ SEO
6. Click **Analyze page load** (or **Generate report**)

### Option 2: Command Line (For CI/CD)

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run audit on production
lighthouse https://eightblock.dev --view --output=html --output-path=./lighthouse-report.html

# Run on localhost (must be running)
lighthouse http://localhost:3000 --view

# Run with specific categories
lighthouse https://eightblock.dev --only-categories=performance,seo --view
```

### Option 3: PageSpeed Insights (Google's Tool)

1. Go to [PageSpeed Insights](https://pagespeed.web.dev/)
2. Enter: `https://eightblock.dev`
3. Click **Analyze**
4. Review Mobile and Desktop scores

### Option 4: CI/CD Integration

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://eightblock.dev
            https://eightblock.dev/articles/welcome-to-eightblock
          uploadArtifacts: true
```

## Understanding Scores

### Score Ranges:

- 🟢 **90-100**: Good
- 🟠 **50-89**: Needs improvement
- 🔴 **0-49**: Poor

### Target Scores for Eightblock:

- **Performance**: 85+ (90+ ideal)
- **Accessibility**: 95+
- **Best Practices**: 90+
- **SEO**: 95+ (100 ideal)

## Key SEO Checks

Lighthouse SEO audit verifies:

### ✅ Must Pass (Critical):

- [ ] **Document has a valid `<title>`** - Check every page has unique title
- [ ] **Document has a meta description** - 50-160 characters, unique per page
- [ ] **Page is mobile-friendly** - Responsive viewport, legible font sizes
- [ ] **Links have descriptive text** - Avoid "click here", use meaningful anchor text
- [ ] **Page has successful HTTP status** - Returns 200, not 404/500
- [ ] **`robots.txt` is valid** - No syntax errors blocking crawlers
- [ ] **Hreflang valid** (if multilingual) - Correct language/region codes

### 🎯 Should Pass (Important):

- [ ] **Canonical URL** - Avoid duplicate content issues
- [ ] **Structured data valid** - JSON-LD schema passes validation
- [ ] **Image elements have `alt` attributes** - Describe images for accessibility/SEO
- [ ] **Document uses legible font sizes** - 16px+ for body text
- [ ] **Tap targets sized appropriately** - 48x48px minimum on mobile

## Common Issues & Fixes

### Issue: Low SEO Score

#### Missing Meta Description

**Error:** `Document does not have a meta description`

**Fix:** Add to each page's metadata:

```tsx
// app/page.tsx or generateMetadata
export const metadata = {
  description: 'Your 50-160 character description here...',
};
```

#### Links Without Descriptive Text

**Error:** `Links do not have descriptive text`

**Fix:** Replace:

```tsx
<a href="/articles/123">Click here</a>
```

With:

```tsx
<a href="/articles/123">Read full article about Cardano governance</a>
```

#### Missing Alt Text on Images

**Error:** `Image elements do not have [alt] attributes`

**Fix:** Add alt to all images:

```tsx
<Image src="/logo.svg" alt="Eightblock logo" width={120} height={40} />
```

#### Non-Crawlable Links

**Error:** `Links are not crawlable`

**Fix:** Use proper anchor tags, not JS-only clicks:

```tsx
// ❌ Bad
<div onClick={() => router.push('/page')}>Go</div>

// ✅ Good
<Link href="/page">Go</Link>
```

### Issue: Low Performance Score

#### Large Images

**Error:** `Properly size images` / `Serve images in modern formats`

**Fix:**

```tsx
// Use Next.js Image with optimization
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  priority // For above-fold images
  quality={85} // Reduce if file too large
/>;
```

#### Render-Blocking Resources

**Error:** `Eliminate render-blocking resources`

**Fix:** Optimize CSS/fonts:

```tsx
// app/layout.tsx - use next/font
import { Lato } from 'next/font/google';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap', // Important!
});
```

#### Unused JavaScript

**Error:** `Reduce unused JavaScript`

**Fix:** Check bundle size and lazy load:

```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

```tsx
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

### Issue: Low Accessibility Score

#### Color Contrast

**Error:** `Background and foreground colors do not have sufficient contrast`

**Fix:** Use WCAG AA compliant colors (4.5:1 ratio minimum):

```css
/* ❌ Poor contrast */
color: #999;
background: #fff;

/* ✅ Good contrast */
color: #333;
background: #fff;
```

Test with: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### Form Labels

**Error:** `Form elements do not have associated labels`

**Fix:**

```tsx
// ❌ Bad
<input type="email" placeholder="Email" />

// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

## Core Web Vitals

Focus on these real-world performance metrics:

### 1. Largest Contentful Paint (LCP)

**Target:** < 2.5s  
**Measures:** Time to render largest visible element

**Fixes:**

- Optimize hero images (use Next.js Image with `priority`)
- Reduce server response time
- Remove render-blocking JavaScript

### 2. First Input Delay (FID) / Interaction to Next Paint (INP)

**Target:** < 100ms (FID) / < 200ms (INP)  
**Measures:** Responsiveness to user interaction

**Fixes:**

- Reduce JavaScript execution time
- Break up long tasks
- Use web workers for heavy computation

### 3. Cumulative Layout Shift (CLS)

**Target:** < 0.1  
**Measures:** Visual stability (avoid unexpected layout shifts)

**Fixes:**

```tsx
// Always set image dimensions
<Image src="/image.jpg" width={800} height={600} alt="..." />

// Reserve space for dynamic content
<div style={{ minHeight: '400px' }}>
  {isLoading ? <Skeleton /> : <Content />}
</div>

// Avoid inserting content above existing content
```

## Automated Monitoring

### Setup Lighthouse CI

```bash
# Install
npm install -D @lhci/cli

# Configure
cat > lighthouserc.json << EOF
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "startServerCommand": "npm run start"
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "categories:best-practices": ["error", {"minScore": 0.90}],
        "categories:seo": ["error", {"minScore": 0.95}]
      }
    }
  }
}
EOF

# Run locally
npm run build
npx lhci autorun
```

### GitHub Actions Integration

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

## Quick Wins for Better Scores

### For SEO (Target: 100):

1. ✅ Add `robots.txt` (done)
2. ✅ Create `sitemap.xml` (done)
3. ✅ Add meta descriptions to all pages
4. ✅ Use semantic HTML (h1, h2, nav, main, article)
5. ✅ Add structured data (JSON-LD)
6. ✅ Ensure mobile-friendly (responsive design)

### For Performance (Target: 90+):

1. ✅ Use Next.js Image component everywhere
2. ✅ Enable font optimization (next/font)
3. ⚠️ Minimize client-side JavaScript
4. ⚠️ Lazy load below-fold content
5. ⚠️ Optimize bundle size

### For Accessibility (Target: 95+):

1. ✅ Add alt text to all images
2. ✅ Use semantic HTML
3. ✅ Ensure color contrast (4.5:1 minimum)
4. ✅ Add ARIA labels where needed
5. ✅ Keyboard navigation support

## Testing Checklist

Run Lighthouse on these pages:

- [ ] **Homepage**: `https://eightblock.dev/`
- [ ] **Article page**: `https://eightblock.dev/articles/[slug]`
- [ ] **Contributors**: `https://eightblock.dev/contributors`
- [ ] **GitHub**: `https://eightblock.dev/github`

For each page, verify:

- [ ] SEO score: 95+
- [ ] Performance score: 85+
- [ ] Accessibility score: 95+
- [ ] All images have alt text
- [ ] All links have descriptive text
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Mobile-friendly
- [ ] Fast LCP (< 2.5s)
- [ ] Low CLS (< 0.1)

## Resources

- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)

## Summary Commands

```bash
# Production audit
lighthouse https://eightblock.dev --view --output=html,json --output-path=./reports/lighthouse

# Local audit (dev server must be running)
lighthouse http://localhost:3000 --view

# Mobile audit
lighthouse https://eightblock.dev --preset=mobile --view

# Multiple pages
for url in / /articles/welcome-to-eightblock /contributors; do
  lighthouse "https://eightblock.dev$url" --output=html --output-path="./reports$url.html"
done
```

---

**Next Steps:** Run initial audit, document baseline scores, fix critical issues first (SEO), then iterate on performance and accessibility improvements.
