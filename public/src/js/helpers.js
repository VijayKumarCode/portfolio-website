/**
 * helpers.js
 * Common utility functions for formatting, security, and rendering.
 */

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-readable format.
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Jun 7, 2026")
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  // Avoid time zone shifts by appending local time context
  const dateObj = new Date(dateStr + 'T00:00:00');
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS) attacks.
 * @param {string} str - Raw string to escape
 * @returns {string} Safe HTML-escaped string
 */
export function escHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips HTML tags from a string to get plain text.
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Estimates the reading time of a body of text.
 * @param {string} text - The input text
 * @returns {string} Reading time description (e.g. "3 min read")
 */
export function readingTime(text) {
  if (!text) return '0 min read';
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}
