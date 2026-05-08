/**
 * Home Blog Preview Module
 * Fetches and renders latest blog posts on the homepage
 */

import { apiFetch } from '../src/utils/api.js';
import { BLOG_ENDPOINT, BLOG_FALLBACK } from '../src/config/config.js';
import { stripHtml, formatDate } from '../src/utils/helpers.js';

const HomeBlog = {
  blogContainer: null,
  skeletonContainer: null,
  fallbackContainer: null,
  retryBtn: null,

  init() {
    this.blogContainer = document.getElementById('blog-container');
    this.skeletonContainer = document.getElementById('blog-container-skeleton');
    this.fallbackContainer = document.getElementById('blog-fallback');
    this.retryBtn = document.getElementById('blog-retry-btn');

    if (!this.blogContainer) return;

    this.fetchPosts();
  },

  async fetchPosts() {
    try {
      let data = await apiFetch(BLOG_ENDPOINT, {}, 1);
      const posts = Array.isArray(data) ? data : data.posts || [];
      if (posts.length === 0) return this.showEmpty();
      this.renderPosts(posts.slice(0, 3));
    } catch (err) {
      try {
        const response = await fetch(BLOG_FALLBACK);
        if (!response.ok) throw new Error('Fallback fetch failed');
        const fallbackData = await response.json();
        // FIX: posts.json is a plain JSON array, not an object with .posts property
        const posts = Array.isArray(fallbackData)
          ? fallbackData
          : fallbackData.posts || [];
        if (posts.length === 0) return this.showEmpty();
        this.renderPosts(posts.slice(0, 3));
      } catch (fallbackErr) {
        console.error('[HomeBlog] Failed to load posts:', fallbackErr);
        this.showError();
      }
    }
  },

  renderPosts(posts) {
    if (this.skeletonContainer) {
      this.skeletonContainer.style.display = 'none';
    }
    this.blogContainer.innerHTML = '';
    this.blogContainer.style.display = '';

    posts.forEach((post, index) => {
      const article = document.createElement('article');
      article.className = 'blog-article-card fade-in';
      article.style.transitionDelay = `${index * 100}ms`;

      const tagsHtml = post.tags
        ? post.tags.slice(0, 2).map(tag => `<span class="blog-card-tag">#${tag}</span>`).join('')
        : '';

      const excerpt = post.excerpt
        ? post.excerpt
        : stripHtml(post.content || '').substring(0, 150) + '...';

      article.innerHTML = `
        <div class="blog-card-meta">
          <time datetime="${post.date || post.createdAt || ''}">${formatDate(post.date || post.createdAt)}</time>
          ${tagsHtml}
        </div>
        <h3 class="blog-card-title"><a href="/blog/${post.slug}">${post.title}</a></h3>
        <p class="blog-card-excerpt">${excerpt}</p>
        <a href="/blog/${post.slug}" class="blog-card-link">Read more →</a>
      `;
      this.blogContainer.appendChild(article);

      // Trigger fade-in animation
      requestAnimationFrame(() => {
        article.classList.add('visible');
      });
    });
  },

  showEmpty() {
    this.hideAll();
    const emptyEl = document.getElementById('blog-empty');
    if (emptyEl) {
      const fallback = emptyEl.closest('#blog-fallback');
      if (fallback) fallback.style.display = '';
      emptyEl.style.display = '';
    }
  },

  showError() {
    this.hideAll();
    const errorEl = document.getElementById('blog-error');
    if (errorEl) {
      const fallback = errorEl.closest('#blog-fallback');
      if (fallback) fallback.style.display = '';
      errorEl.style.display = '';
    }

    const retryBtn = document.getElementById('blog-retry-btn');
    retryBtn?.addEventListener('click', () => {
      if (this.skeletonContainer) this.skeletonContainer.style.display = '';
      if (this.fallbackContainer) this.fallbackContainer.style.display = 'none';
      if (this.blogContainer) this.blogContainer.style.display = 'none';
      this.fetchPosts();
    }, { once: true });
  },

  hideAll() {
    if (this.skeletonContainer) this.skeletonContainer.style.display = 'none';
    if (this.blogContainer) this.blogContainer.style.display = 'none';
    if (this.fallbackContainer) this.fallbackContainer.style.display = 'none';
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HomeBlog.init());
} else {
  HomeBlog.init();
}
