import DOMPurify from 'isomorphic-dompurify';
import { describe, expect, it } from 'vitest';
import { sanitizeArticleHtml } from '../article-html';

describe('sanitizeArticleHtml', () => {
  it('opens article links in a new tab', () => {
    const html = sanitizeArticleHtml(
      '<p><a href="https://cardano.org">Cardano</a> and <a href="/writing?tag=defi">DeFi</a></p>'
    );
    const links = new DOMParser().parseFromString(html, 'text/html').querySelectorAll('a');
    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('keeps in-page anchors in the same tab', () => {
    const html = sanitizeArticleHtml('<a href="#setup" target="_blank">Setup</a>');
    expect(html).toBe('<a href="#setup">Setup</a>');
  });

  it('still strips scripts and event handlers', () => {
    const html = sanitizeArticleHtml(
      '<a href="javascript:alert(1)" onclick="alert(2)">x</a><script>alert(3)</script>'
    );
    expect(html).not.toMatch(/javascript:|onclick|script/);
  });

  it('leaves other sanitize calls untouched', () => {
    sanitizeArticleHtml('<a href="https://cardano.org">Cardano</a>');
    expect(DOMPurify.sanitize('<a href="https://cardano.org">Cardano</a>')).toBe(
      '<a href="https://cardano.org">Cardano</a>'
    );
  });
});
