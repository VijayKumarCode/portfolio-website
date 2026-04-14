/**
 * helpers.js — Pure utility functions.
 *
 * No DOM dependencies. No side effects.
 * Safe to import from any module.
 */

'use strict';

/**
 * Strip all HTML tags from a string.
 * Uses DOMParser for correctness — handles edge cases that regex misses.
 * @param {string} html
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch {
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Escape a string for safe insertion into HTML.
 * Prevents XSS when injecting user-controlled content via innerHTML.
 * @param {string} str
 * @returns {string} HTML-escaped string
 */
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Truncate plain text to a word count and append an ellipsis.
 * @param {string} text  Plain text (not HTML)
 * @param {number} words Number of words to keep
 * @returns {string}
 */
export function excerpt(text, words = 25) {
  if (!text) return '';
  const parts = text.split(/\s+/);
  if (parts.length <= words) return text;
  return parts.slice(0, words).join(' ') + '\u2026';
}

/**
 * Format an ISO date string to a human-readable form.
 * e.g. "2026-03-10" → "Mar 10, 2026"
 * @param {string} iso  ISO date string
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Debounce a function — only calls fn after `delay` ms have passed
 * since the last invocation.
 * @param {Function} fn
 * @param {number} delay Milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Estimate reading time for plain text content.
 * @param {string} html HTML content
 * @param {number} wpm  Words per minute (default: 200)
 * @returns {string} e.g. "4 min read"
 */
export function readingTime(html, wpm = 200) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wpm));
  return `${minutes} min read`;
}

/**
 * Safely encode a slug for use in a URL path segment.
 * @param {string} slug
 * @returns {string}
 */
export function encodeSlug(slug) {
  return encodeURIComponent(String(slug));
}

/**
 * Build a clean blog post URL using the slug.
 * Matches the Vercel rewrite: /blog/:slug → post.html?slug=:slug
 * @param {string} slug
 * @returns {string} e.g. "/blog/jpql-enum-inner-class-bug"
 */
export function postUrl(slug) {
  return `/blog/${encodeSlug(slug)}`;
}