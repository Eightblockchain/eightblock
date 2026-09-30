import { describe, expect, it } from 'vitest';
import {
  articleSlugFromPath,
  isBot,
  isTrackablePath,
  normalizePath,
  parseUserAgent,
  referrerHost,
  sourceName,
} from '../utils/analytics.js';
import { withCampaignTracking } from '../services/email-service.js';

describe('analytics helpers', () => {
  it('groups referrers and utm sources under readable names', () => {
    expect(sourceName('t.co', null)).toBe('X (Twitter)');
    expect(sourceName('google.co.uk', null)).toBe('Google');
    expect(sourceName('news.ycombinator.com', null)).toBe('Hacker News');
    expect(sourceName('l.facebook.com', null)).toBe('Facebook');
    expect(sourceName(null, 'newsletter')).toBe('Newsletter & email');
    expect(sourceName('t.co', 'linkedin')).toBe('LinkedIn');
    expect(sourceName('someblog.io', null)).toBe('someblog.io');
    expect(sourceName(null, null)).toBe('Direct');
  });

  it('keeps only external referrer hosts', () => {
    expect(referrerHost('https://www.Reddit.com/r/cardano')).toBe('reddit.com');
    expect(referrerHost('http://localhost:3000/writing')).toBeNull();
    expect(referrerHost('android-app://com.slack')).toBeNull();
    expect(referrerHost('not a url')).toBeNull();
  });

  it('normalizes paths so one page is one row', () => {
    expect(normalizePath('/articles/hello/?utm_source=x&fbclid=1')).toBe('/articles/hello');
    expect(normalizePath('/writing?tag=defi&utm_campaign=y')).toBe('/writing?tag=defi');
    expect(normalizePath('/')).toBe('/');
    expect(isTrackablePath('/admin/analytics')).toBe(false);
    expect(isTrackablePath('/administrator-notes')).toBe(true);
    expect(isTrackablePath('/articles/new')).toBe(false);
    expect(isTrackablePath('/articles/hello/edit')).toBe(false);
    expect(isTrackablePath('/articles/hello')).toBe(true);
    expect(articleSlugFromPath('/articles/cardano-101')).toBe('cardano-101');
    expect(articleSlugFromPath('/articles/new')).toBeNull();
    expect(articleSlugFromPath('/articles/cardano-101/edit')).toBeNull();
  });

  it('tags newsletter links to the site with the campaign', () => {
    const html = withCampaignTracking(
      '<a href="https://eightblock.dev/articles/x?ref=1">Read</a> <a href="https://github.com">GH</a> ' +
        "<a href='https://www.eightblock.dev/?utm_source=custom'>Home</a>",
      'Cardano, week 12!',
      'https://eightblock.dev'
    );
    expect(html).toContain(
      'href="https://eightblock.dev/articles/x?ref=1&amp;utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=cardano-week-12"'
    );
    expect(html).toContain('href="https://github.com"');
    expect(html).toContain("href='https://www.eightblock.dev/?utm_source=custom'");
  });

  it('recognises bots and device types', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true);
    expect(isBot(undefined)).toBe(true);
    expect(isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0 Safari/537.36')).toBe(
      false
    );
    expect(
      parseUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1'
      ).device
    ).toBe('mobile');
  });
});
