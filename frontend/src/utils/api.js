/**
 * Minimal fetch wrapper with timeout.
 * Used by home-blog.js (optional).
 */
export async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
