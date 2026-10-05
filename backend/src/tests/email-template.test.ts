import { describe, expect, it } from 'vitest';
import {
  htmlToText,
  renderMessage,
  renderNewsletter,
  styleContent,
} from '../services/email-template.js';
import {
  checkTemplate,
  defaultCopy,
  fillCopy,
  fillTemplate,
  validateCopy,
  type TemplateKey,
  type Variables,
} from '../services/email-copy.js';

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

  const SITE = 'https://eightblock.dev';
  const message = (
    key: TemplateKey,
    variables: Variables,
    options: Partial<Parameters<typeof renderMessage>[0]> = {}
  ) =>
    renderMessage({
      copy: fillCopy(defaultCopy(key), { siteUrl: SITE, ...variables }),
      siteUrl: SITE,
      logoSrc: 'cid:eightblock-logo',
      label: 'Newsletter',
      reason: 'You are receiving this because of a test.',
      button: { href: `${SITE}/writing` },
      ...options,
    });

  it('words the welcome differently for returning subscribers', () => {
    const { html, text } = message('newsletter-welcome-back', {}, { articles: [article] });
    expect(html).toContain('Welcome back');
    expect(html).toContain('Catch up on these');
    expect(text.startsWith('Welcome back')).toBe(true);
  });

  it('renders the account welcome with next steps and no unsubscribe link', () => {
    const base = { firstName: 'Ada', name: 'Ada Lovelace', email: 'ada@example.com' };
    const button = { href: `${SITE}/settings` };
    const fresh = message('account-welcome', { ...base, subscribed: false }, { button });
    expect(fresh.html).toContain('Welcome to Eightblock, Ada');
    expect(fresh.html).toContain('ada@example.com');
    expect(fresh.html).toContain(`href="${SITE}/settings"`);
    expect(fresh.html).toContain(`href="${SITE}/newsletter"`);
    expect(fresh.html).toMatch(/<li style="[^"]*"><strong[^>]*>Bookmarks<\/strong>/);
    expect(fresh.html).not.toContain('Unsubscribe');
    expect(fresh.text).toContain(`Set up your profile: ${SITE}/settings`);
    expect(fresh.text).toContain(`subscribe to the newsletter (${SITE}/newsletter)`);

    const subscribed = message('account-welcome', { ...base, subscribed: true }, { button });
    expect(subscribed.html).toContain('also subscribed to the newsletter');
    expect(subscribed.html).not.toContain('/newsletter"');
    expect(subscribed.html).not.toMatch(/<p[^>]*>\s*<\/p>/);

    const nameless = message(
      'account-welcome',
      { email: 'x@example.com', firstName: '' },
      { button }
    );
    expect(nameless.html).toContain('Welcome to Eightblock</h1>');
  });

  it('renders the confirmation request with the link twice and a way to ignore it', () => {
    const confirmUrl = `${SITE}/newsletter/confirm?token=abc-123`;
    const { html, text } = message(
      'subscription-confirm',
      { email: 'ada@example.com', expiresInDays: 7 },
      { button: { href: confirmUrl, showLink: true } }
    );
    expect(html).toContain('Confirm your subscription');
    expect(html.split(`href="${confirmUrl}"`)).toHaveLength(3);
    expect(html).toContain('ada@example.com');
    expect(html).not.toContain('Unsubscribe');
    expect(text).toContain(`Confirm subscription: ${confirmUrl}`);
    expect(text).toContain(
      "Ignore this email and you won't be subscribed. The link expires in 7 days."
    );
  });

  it('renders the welcome email with a call to action and starter articles', () => {
    const { html, text } = message(
      'newsletter-welcome',
      {},
      { articles: [article], unsubscribeUrl: `${SITE}/newsletter/unsubscribe?token=t2` }
    );
    expect(html).toContain('src="cid:eightblock-logo"');
    expect(html).toContain('You&#39;re on the list');
    expect(html).toContain(`href="${SITE}/writing"`);
    expect(html).toContain('Start with these');
    expect(text).toContain(`Browse the articles: ${SITE}/writing`);
  });

  it('escapes variables in the message but not in plain-text fields', () => {
    const copy = { ...defaultCopy('newsletter-welcome'), body: '<p>Hi {{email}}</p>' };
    const filled = fillCopy({ ...copy, subject: 'For {{email}}' }, { email: '<b>&</b>' });
    expect(filled.body).toBe('<p>Hi &lt;b&gt;&amp;&lt;/b&gt;</p>');
    expect(filled.subject).toBe('For <b>&</b>');
    const { html } = renderMessage({
      copy: filled,
      siteUrl: SITE,
      logoSrc: 'x',
      label: 'Newsletter',
      reason: 'r',
      button: { href: SITE },
    });
    expect(html).toContain('<title>For &lt;b&gt;&amp;&lt;/b&gt;</title>');
    expect(html).not.toContain('<b>&</b>');
  });
});

describe('email copy', () => {
  it('fills variables and shows sections only when their value is set', () => {
    const template = 'Hi{{#name}} {{name}}{{/name}}{{^name}} there{{/name}}, {{ count }} new';
    expect(fillTemplate(template, { name: 'Ada', count: 3 })).toBe('Hi Ada, 3 new');
    expect(fillTemplate(template, { name: '', count: 0 })).toBe('Hi there, 0 new');
    expect(fillTemplate('{{#a}}A{{#b}}B{{/b}}{{/a}}', { a: true, b: false })).toBe('A');
    expect(fillTemplate('{{#more}} and {{more}} more{{/more}}', { more: 0 })).toBe('');
  });

  it('points at unknown variables and unbalanced sections', () => {
    const allowed = ['email', 'subscribed'];
    expect(checkTemplate('Hi {{email}} {{#subscribed}}yes{{/subscribed}}', allowed)).toBeNull();
    expect(checkTemplate('Hi {{emial}}', allowed)).toMatch(
      /\{\{emial\}\} is not a variable.*\{\{email\}\}/
    );
    expect(checkTemplate('{{#subscribed}}yes', allowed)).toBe(
      'Close {{#subscribed}} with {{/subscribed}}.'
    );
    expect(checkTemplate('yes{{/subscribed}}', allowed)).toMatch(/no matching/);
    expect(checkTemplate('{{ }}', allowed)).toMatch(/empty/);
  });

  it('keeps only the template fields and rejects empty required ones', () => {
    const ok = validateCopy('weekly-digest', {
      subject: '  Week {{count}}  ',
      body: '<p></p>',
      heading: 'ignored',
    });
    expect(ok).toEqual({ copy: { subject: 'Week {{count}}', preheader: '', body: '' } });
    expect(
      validateCopy('newsletter-welcome', { ...defaultCopy('newsletter-welcome'), heading: ' ' })
    ).toEqual({
      error: 'Heading cannot be empty.',
    });
    expect(
      validateCopy('subscription-confirm', {
        ...defaultCopy('subscription-confirm'),
        body: '<p>{{name}}</p>',
      })
    ).toMatchObject({
      error: expect.stringMatching(/^Message: \{\{name\}\} is not a variable/),
    });
  });

  it('defaults match the wording the emails always had', () => {
    for (const key of [
      'subscription-confirm',
      'newsletter-welcome',
      'newsletter-welcome-back',
      'account-welcome',
      'weekly-digest',
      'article-announcement',
    ] as const) {
      expect(validateCopy(key, defaultCopy(key))).toHaveProperty('copy');
    }
    const digest = fillCopy(defaultCopy('weekly-digest'), { leadTitle: 'Plutus', moreCount: 2 });
    expect(digest.subject).toBe('This week on Eightblock: Plutus and 2 more');
    expect(
      fillCopy(defaultCopy('weekly-digest'), { leadTitle: 'Plutus', moreCount: 0 }).subject
    ).toBe('This week on Eightblock: Plutus');
  });
});
