# Google Search Console Setup & Indexing Guide

## 1. Verify Site Ownership

### Method A: HTML File Upload (Recommended)

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property** → **URL prefix** → Enter `https://eightblock.dev`
3. Download the verification HTML file
4. Upload to `frontend/public/` directory
5. Deploy and click **Verify** in GSC

### Method B: DNS TXT Record

1. In GSC, select **DNS record** verification
2. Copy the TXT record value
3. Add to your DNS provider:
   - Type: `TXT`
   - Host: `@` or leave blank
   - Value: `google-site-verification=XXX...`
4. Wait 24-48 hours, then verify

## 2. Submit Sitemap

1. In GSC, go to **Sitemaps** (left sidebar)
2. Enter: `https://eightblock.dev/sitemap.xml`
3. Click **Submit**
4. Check status after 24-48 hours

### Verify Sitemap Locally First

```bash
# Check sitemap is accessible
curl https://eightblock.dev/sitemap.xml

# Validate XML structure
curl https://eightblock.dev/sitemap.xml | xmllint --format -
```

## 3. Request Indexing for Key URLs

### Priority URLs to Index:

- Homepage: `https://eightblock.dev/`
- Top 5-10 published articles (check your most important content)

### How to Request Indexing:

1. In GSC, use **URL Inspection** tool (top bar)
2. Enter the full URL
3. If not indexed, click **Request Indexing**
4. Repeat for each priority URL

**Rate Limits:** Google limits manual indexing requests to ~10-20 per day per property.

### Bulk Method (Advanced):

Use the [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) for programmatic indexing:

```bash
# Install Google API client
npm install googleapis

# Create service account in Google Cloud Console
# Enable Indexing API
# Add service account email as owner in GSC
```

## 4. robots.txt Verification

Ensure your robots.txt is accessible and correct:

```bash
curl https://eightblock.dev/robots.txt
```

Expected content:

```
User-agent: *
Allow: /

Sitemap: https://eightblock.dev/sitemap.xml

Disallow: /auth/
Disallow: /admin/
```

## 5. Monitor Indexing Status

### Check Coverage Report:

1. Go to **Coverage** or **Pages** in GSC
2. Look for:
   - ✅ **Valid** (indexed pages)
   - ⚠️ **Valid with warnings**
   - ❌ **Error** (not indexed)
   - ℹ️ **Excluded** (crawled but not indexed)

### Common Issues & Fixes:

| Issue                                | Cause                 | Fix                                 |
| ------------------------------------ | --------------------- | ----------------------------------- |
| "Crawled - currently not indexed"    | Low quality/duplicate | Improve content, add internal links |
| "Discovered - currently not indexed" | Low priority          | Wait or request indexing            |
| "Page with redirect"                 | 301/302 redirects     | Check URL structure                 |
| "Submitted URL not found (404)"      | URL doesn't exist     | Check sitemap accuracy              |
| "Blocked by robots.txt"              | robots.txt issue      | Review robots.txt rules             |

## 6. Speed Up Indexing

### Best Practices:

1. **Submit sitemap immediately** after deployment
2. **Request indexing** for priority pages manually
3. **Share on social media** (Twitter, Reddit, etc.) - external links help
4. **Add internal links** from existing pages to new content
5. **Update sitemap regularly** - trigger via API or webhook after new article publishes
6. **Submit to Bing Webmaster Tools** as well (often indexes faster)

### XML Sitemap Best Practices:

- Include `<lastmod>` timestamps for articles
- Add `<priority>` (0.1-1.0) and `<changefreq>` tags
- Keep sitemap under 50,000 URLs (create multiple if needed)
- Compress with gzip for faster crawling

## 7. Monitoring & Alerts

### Set Up Email Notifications:

1. In GSC, go to **Settings** (left sidebar)
2. **Users and permissions** → Add email
3. Enable alerts for:
   - Coverage issues
   - Manual actions
   - Security issues

### Regular Checks:

- **Weekly**: Check Coverage report for new errors
- **Monthly**: Review Search Performance (clicks, impressions, CTR)
- **After deploys**: Verify new pages are indexed within 48 hours

## 8. Advanced: API Integration

Automate sitemap submission and indexing with your CI/CD:

```javascript
// Example: Trigger sitemap ping after deploy
const fetch = require('node-fetch');

async function pingGoogle() {
  const sitemapUrl = 'https://eightblock.dev/sitemap.xml';
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

  const response = await fetch(pingUrl);
  console.log('Google sitemap ping:', response.status);
}

// Run after successful deployment
pingGoogle();
```

## 9. Expected Timeline

- **Sitemap submitted**: Processed within 24-48 hours
- **Manual indexing request**: 1-7 days (sometimes within hours)
- **Organic discovery**: 1-4 weeks for new sites
- **Updates to existing pages**: 1-7 days

## Troubleshooting

### Sitemap Not Processing?

```bash
# Check sitemap is valid XML
curl https://eightblock.dev/sitemap.xml | xmllint --noout -

# Verify all URLs return 200
curl -I https://eightblock.dev/
curl -I https://eightblock.dev/articles/welcome-to-eightblock
```

### Pages Not Indexing?

1. Check `meta robots` tags aren't blocking
2. Verify page returns 200 status
3. Ensure adequate content (avoid thin/duplicate content)
4. Check for canonical tag conflicts
5. Use **URL Inspection** tool for specific error message

## Summary Checklist

- [ ] Site verified in Google Search Console
- [ ] Sitemap submitted and processed
- [ ] Priority pages manually indexed
- [ ] robots.txt accessible and correct
- [ ] No critical errors in Coverage report
- [ ] Monitoring enabled
- [ ] Site verified in Bing Webmaster Tools (optional but recommended)

---

**Next Steps:** After setup, allow 2-4 weeks for full indexing. In parallel, work on content quality, internal linking, and earning backlinks to improve rankings.
