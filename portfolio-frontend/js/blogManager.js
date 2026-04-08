/* ═══════════════════════════════════════════════════════════
   Portfolio v2.0 — blogManager.js
   Fixes:
   - BUG: No sanitization of post.content before innerHTML — XSS risk
   - BUG: scrollRight logic was inverted (wrong condition)
   - BUG: No graceful empty state
   - Added: excerpt strips HTML tags correctly
   - Added: posts sorted newest-first
═══════════════════════════════════════════════════════════ */

export class BlogManager {
  constructor(containerId, dataPath) {
    this.container = document.getElementById(containerId);
    this.dataPath  = dataPath;
  }

  async init() {
    if (!this.container) return;
    await this.fetchAndRender();
  }

  async fetchAndRender() {
    try {
      const res   = await fetch(this.dataPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const posts = await res.json();

      if (!posts || posts.length === 0) {
        this.container.innerHTML =
          '<p style="color:var(--text-3);font-size:0.88rem;text-align:center;padding:2rem;">No entries published yet.</p>';
        return;
      }

      // Show latest 3 on home page
      const latest = posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

      // BUG FIX: strip HTML tags properly before excerpting
      this.container.innerHTML = latest.map(post => {
        const plainText = this.#stripHtml(post.content || '');
        const excerpt   = plainText.split(/\s+/).slice(0, 20).join(' ') + '…';

        return `
          <article class="blog-article-card" role="article">
            <p class="category-tag">${this.#escape(post.category || 'Engineering')}</p>
            <h3>${this.#escape(post.title || 'Untitled')}</h3>
            <p>${this.#escape(excerpt)}</p>
            <a href="post.html?slug=${encodeURIComponent(post.slug)}"
               class="read-more"
               aria-label="Read ${this.#escape(post.title || 'entry')}">
              Read more →
            </a>
          </article>
        `;
      }).join('');

    } catch (err) {
      console.error('[BlogManager] Failed to load posts:', err);
      this.container.innerHTML =
        '<p style="color:var(--text-3);font-size:0.85rem;text-align:center;padding:2rem;">Could not load entries.</p>';
    }
  }

  /* ── Private helpers ────────────────────────────────────── */

  // BUG FIX: Use DOMParser to strip HTML — handles edge cases that regex misses
  #stripHtml(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    } catch {
      return html.replace(/<[^>]*>/g, '');
    }
  }

  // Escape for safe HTML output
  #escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}