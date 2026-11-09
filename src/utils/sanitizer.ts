/**
 * Security Utility: HTML Email Sanitizer
 * 
 * Sanitizes incoming HTML email bodies using DOMPurify to eliminate XSS,
 * malicious script tags, iframes, and phishing attack vectors.
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify hook to ensure all anchor tags open safely in a new tab
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong', 'table', 'tbody',
    'td', 'th', 'thead', 'tr', 'u', 'ul'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'align', 'target', 'rel'
  ],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * Sanitize an HTML string, stripping dangerous scripts and unapproved tags.
 */
export function sanitizeEmailHtml(rawHtml?: string | null): string {
  if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.trim()) {
    return '';
  }

  return DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);
}

/**
 * Converts plain text into safe HTML with automatic hyperlink detection.
 */
export function formatPlainTextToHtml(text?: string | null): string {
  if (!text) {
    return '<p class="text-slate-400 italic">(Empty message body)</p>';
  }

  // Escape basic HTML characters
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Autolink standard URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const linked = escaped.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline hover:text-sky-300">$1</a>'
  );

  // Convert line breaks to <br/>
  const withBreaks = linked.replace(/\n/g, '<br />');

  return `<div class="whitespace-pre-wrap leading-relaxed">${withBreaks}</div>`;
}

