import { describe, expect, it } from 'vitest';
import {
  htmlToText,
  renderNewsletter,
  renderWelcome,
  styleContent,
  renderAccountWelcome,
  renderConfirmSubscription,
} from '../services/email-template.js';

const article = {
  title: 'Plutus <deep> dive',
  url: 'https://eightblock.dev/articles/plutus',
  excerpt: 'How validators really work.',
  category: 'Cardano',
  author: 'Mechack',
  imageUrl: 'https://api.eightblock.dev/uploads/plutus.webp',
  readingMinutes: 6,
};

describe('email template', () => {
  it('inlines typography and keeps existing styles', () => {
    const html = styleContent('<p>Hi</p><a href="x" style="color:red">x</a><img src="y"/>');
    expect(html).toMatch(/<p style="margin:0 0 18px;[^"]*">Hi<\/p>/);
    expect(html).toMatch(/<a href="x" style="color:#0a6fa3;[^"]*color:red">/);
    expect(html).toMatch(/<img src="y" style="display:block;[^"]*"\/>/);
  });

  it('drops scripts and inline event handlers', () => {
    const html = styleContent('<p onclick="alert(1)">ok</p><script>alert(2)</script>');
    expect(html).not.toMatch(/onclick|script/);
  });

  it('keeps editor list items single-spaced', () => {
    const html = styleContent('<ul><li><p>One</p></li><li class="x"><p>Two</p></li></ul>');
    expect(html).not.toMatch(/<p/);
    expect(html).toMatch(/<li style="[^"]*">One<\/li><li class="x" style="[^"]*">Two<\/li>/);
  });

  it('turns HTML into readable text', () => {
    const text = htmlToText(
      '<h2>News</h2><p>Read <a href="https://eightblock.dev/a">this</a> &amp; that.</p><ul><li>One</li><li>Two</li></ul>'
    );
    expect(text).toBe('News\n\nRead this (https://eightblock.dev/a) & that.\n\n- One\n- Two');
  });

  it('renders a newsletter with preheader, articles, footer and a text part', () => {
    const { html, text } = renderNewsletter({
      subject: 'Issue 1',
      preheader: 'What changed this week',
      html: '<p>Hello readers</p>',
      articles: [article, { ...article, title: 'Second', imageUrl: null }],
      siteUrl: 'https://eightblock.dev',
      logoSrc: 'https://api.eightblock.dev/email-assets/logo.png',
      unsubscribeUrl: 'https://eightblock.dev/newsletter/unsubscribe?token=t1',
      postalAddress: 'Kinshasa, DR Congo',
      date: new Date(2026, 8, 29),
    });

    expect(html).toMatch(
      /<img src="https:\/\/api\.eightblock\.dev\/email-assets\/logo\.png" width="169" height="60" alt="Eightblock"/
    );
    expect(html).toContain('What changed this week');
    expect(html).toContain('Sep 29, 2026');
    expect(html).toContain('In this issue');
    expect(html).toContain('Plutus &lt;deep&gt; dive');
    expect(html).toContain('Mechack · 6 min read');
    expect(html).toContain('href="https://eightblock.dev/newsletter/unsubscribe?token=t1"');
    expect(html).toContain('Kinshasa, DR Congo');
    expect(html).not.toMatch(/gradient|box-shadow/);

    expect(text).toContain('Hello readers');
    expect(text).toContain('Plutus <deep> dive');
    expect(text).toContain('Unsubscribe: https://eightblock.dev/newsletter/unsubscribe?token=t1');
  });

  it('words the welcome differently for returning subscribers', () => {
    const { html, text } = renderWelcome({
      returning: true,
      articles: [article],
      siteUrl: 'https://eightblock.dev',
      logoSrc: 'cid:eightblock-logo',
    });
    expect(html).toContain('Welcome back');
    expect(html).toContain('Catch up on these');
    expect(text.startsWith('Welcome back')).toBe(true);
  });

  it('renders the account welcome with next steps and no unsubscribe link', () => {
    const base = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      siteUrl: 'https://eightblock.dev',
      logoSrc: 'cid:eightblock-logo',
    };
    const fresh = renderAccountWelcome({ ...base, subscribed: false });
    expect(fresh.html).toContain('Welcome to Eightblock, Ada');
    expect(fresh.html).toContain('ada@example.com');
    expect(fresh.html).toContain('href="https://eightblock.dev/settings"');
    expect(fresh.html).toContain('href="https://eightblock.dev/newsletter"');
    expect(fresh.html).not.toContain('Unsubscribe');
    expect(fresh.text).toContain('Subscribe: https://eightblock.dev/newsletter');

    const subscribed = renderAccountWelcome({ ...base, subscribed: true });
    expect(subscribed.html).toContain('also subscribed to the newsletter');
    expect(subscribed.html).not.toContain('/newsletter"');
  });

  it('renders the confirmation request with the link twice and a way to ignore it', () => {
    const confirmUrl = 'https://eightblock.dev/newsletter/confirm?token=abc-123';
    const { html, text } = renderConfirmSubscription({
      email: 'ada@example.com',
      confirmUrl,
      siteUrl: 'https://eightblock.dev',
      logoSrc: 'cid:eightblock-logo',
      expiresInDays: 7,
    });
    expect(html).toContain('Confirm your subscription');
    expect(html.split(`href="${confirmUrl}"`)).toHaveLength(3);
    expect(html).toContain('ada@example.com');
    expect(html).not.toContain('Unsubscribe');
    expect(text).toContain(`Confirm subscription: ${confirmUrl}`);
    expect(text).toContain("Ignore this email and you won't be subscribed");
  });

  it('renders the welcome email with a call to action and starter articles', () => {
    const { html, text } = renderWelcome({
      articles: [article],
      siteUrl: 'https://eightblock.dev/',
      logoSrc: 'cid:eightblock-logo',
      unsubscribeUrl: 'https://eightblock.dev/newsletter/unsubscribe?token=t2',
    });
    expect(html).toContain('src="cid:eightblock-logo"');
    expect(html).toContain('You&#39;re on the list');
    expect(html).toContain('href="https://eightblock.dev/writing"');
    expect(html).toContain('Start with these');
    expect(text).toContain('Browse the articles: https://eightblock.dev/writing');
  });
});
