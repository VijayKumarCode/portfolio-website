/**
 * Utility Helpers
 * Shared functions across the frontend
 */

/**
 * Strip HTML tags and return plain text
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Format a date string to readable format
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date (e.g., "Jan 15, 2026")
 */
export function formatDate(date) {
  if (!date) return 'Unknown date';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Calculate reading time in minutes
 * @param {string} content - Text content
 * @param {number} wpm - Words per minute (default: 200)
 * @returns {number} Reading time in minutes
 */
export function readingTime(content, wpm = 200) {
  if (!content || typeof content !== 'string') return 1;
  const words = stripHtml(content).trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wpm));
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - Raw string
 * @returns {string} Escaped HTML string
 */
export function escHtml(str) {
  if (!str || typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Sanitize user input for safe display
 * @param {string} input - Raw user input
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 1000);
}

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export function isInViewport(el, offset = 0) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
