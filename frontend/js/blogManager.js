/**
 * Blog Manager — Home Page Preview
 * Loads and renders latest 3 posts on the homepage
 */

import { formatDate, stripHtml } from './helpers.js';

const BlogManager = {
  container: null,
  fallback: null,

  init() {
    this.container = document.getElementById('home-blog-grid');
    this.fallback = document.getElementById('home-blog-fallback');

    if (!this.container) return;

    this.loadPosts();
  },

  async loadPosts() {
    try {
      const res = await fetch('/data/posts.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // Defensive: handle both array and object with .posts
      const posts = Array.isArray(data) ? data : data.posts || [];
      const latest = posts
        .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
        .slice(0, 3);

      if (latest.length === 0) {
        this.showFallback('No posts yet.');
        return;
      }

      this.render(latest);
    } catch (err) {
      console.error('[BlogManager] Failed to load posts:', err);
      this.showFallback('Unable to load posts.');
    }
  },

  render(posts) {
    if (!this.container) return;

    this.container.innerHTML = '';
    this.container.style.display = '';
    if (this.fallback) this.fallback.style.display = 'none';

    posts.forEach((post, index) => {
      const card = document.createElement('article');
      card.className = 'blog-article-card fade-in';
      card.style.transitionDelay = `${index * 100}ms`;

      const excerpt = post.excerpt
        ? post.excerpt
        : stripHtml(post.content || '').substring(0, 140) + '...';

      card.innerHTML = `
        <div class="blog-card-meta">
          <time datetime="${post.date || post.createdAt || ''}">${formatDate(post.date || post.createdAt)}</time>
        </div>
        <h3 class="blog-card-title"><a href="/blog/${post.slug}">${this.escHtml(post.title)}</a></h3>
        <p class="blog-card-excerpt">${this.escHtml(excerpt)}</p>
        <a href="/blog/${post.slug}" class="blog-card-link">Read more →</a>
      `;

      this.container.appendChild(card);

      requestAnimationFrame(() => {
        card.classList.add('visible');
      });
    });
  },

  showFallback(message) {
    if (this.container) this.container.style.display = 'none';
    if (this.fallback) {
      this.fallback.style.display = '';
      const msgEl = this.fallback.querySelector('p');
      if (msgEl) msgEl.textContent = message;
    }
  },

  escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BlogManager.init());
} else {
  BlogManager.init();
}

export default BlogManager;
