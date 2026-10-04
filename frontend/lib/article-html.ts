import DOMPurify from 'isomorphic-dompurify';

function openLinksInNewTab(node: Element) {
  if (node.tagName !== 'A') return;
  const href = node.getAttribute('href');
  if (!href || href.startsWith('#')) {
    node.removeAttribute('target');
    return;
  }
  node.setAttribute('target', '_blank');
  node.setAttribute('rel', 'noopener noreferrer');
}

// Article links open in a new tab so readers keep their place; in-page anchors stay put.
export function sanitizeArticleHtml(html: string | null | undefined): string {
  DOMPurify.addHook('afterSanitizeAttributes', openLinksInNewTab);
  try {
    return DOMPurify.sanitize(html ?? '');
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes', openLinksInNewTab);
  }
}
