export function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return isNaN(d) ? dateString : d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

export function escHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Estimate reading time from HTML content
 * @param {string} content - HTML content
 * @returns {string} - "X min read"
 */
export function readingTime(content) {
  if (!content) return '1 min read';
  const text = stripHtml(content);
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}
