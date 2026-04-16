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
      const path = this.dataPath.startsWith('/') ? this.dataPath : `/${this.dataPath}`;
      const res  = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const posts = await res.json();

      if (!posts || posts.length === 0) {
        this.container.innerHTML =
          '<p style="color:var(--text-3);font-size:0.88rem;text-align:center;padding:2rem;">No entries published yet.</p>';
        return;
      }

      const latest = [...posts]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

      this.container.innerHTML = latest.map(post => {
        const plainText = this.#stripHtml(post.content || '');
        const excerpt   = plainText.split(/\s+/).slice(0, 20).join(' ') + '\u2026';

        return `
          <article class="blog-article-card" role="article">
            <p class="category-tag">${this.#escape(post.category || 'Engineering')}</p>
            <h3>${this.#escape(post.title || 'Untitled')}</h3>
            <p>${this.#escape(excerpt)}</p>
            <a href="/blog/${encodeURIComponent(post.slug)}"
               class="read-more"
               aria-label="Read ${this.#escape(post.title || 'entry')}">
              Read more \u2192
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

  #stripHtml(html) {
    try {
      return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
    } catch {
      return html.replace(/<[^>]*>/g, '');
    }
  }

  #escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}