/**
 * Home Page Blog Preview Loader
 * Fetches from API with fallback to static JSON
 */

import { apiFetch } from '../src/utils/api.js';
import { BLOG_ENDPOINT, BLOG_FALLBACK } from '../src/config/config.js';
import { stripHtml, formatDate } from '../src/utils/helpers.js';

const HomeBlog = {
  skeletonContainer: null,
  blogContainer: null,
  fallbackContainer: null,
  maxPosts: 3,

  init() {
    this.skeletonContainer = document.getElementById('blog-container-skeleton');
    this.blogContainer = document.getElementById('blog-container');
    this.fallbackContainer = document.getElementById('blog-fallback');

    if (!this.blogContainer) return;

    this.fetchPosts();
  },

  async fetchPosts() {
    try {
      // Try primary endpoint
      let data = await apiFetch(BLOG_ENDPOINT, {}, 1);

      // Ensure we have posts array
      const posts = Array.isArray(data) ? data : data.posts || [];

      if (!Array.isArray(posts) || posts.length === 0) {
        return this.showEmpty();
      }

      const recentPosts = posts
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        .slice(0, this.maxPosts);

      this.renderPosts(recentPosts);
    } catch (error) {
      console.warn('Primary blog fetch failed, trying fallback:', error.message);

      // Try fallback (static JSON)
      try {
        const response = await fetch(BLOG_FALLBACK);
        if (!response.ok) throw new Error('Fallback fetch failed');
        const fallbackData = await response.json();
        const posts = fallbackData.posts || [];

        if (posts.length === 0) return this.showEmpty();

        const recentPosts = posts
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, this.maxPosts);

        this.renderPosts(recentPosts);
      } catch (fallbackError) {
        console.error('Both blog fetches failed:', fallbackError);
        this.showError();
      }
    }
  },

  renderPosts(posts) {
    // Hide skeletons
    if (this.skeletonContainer) {
      this.skeletonContainer.style.display = 'none';
    }

    // Clear and show container
    this.blogContainer.innerHTML = '';
    this.blogContainer.style.display = '';

    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'blog-article-card fade-in';
      article.innerHTML = `
        <div class="blog-card-meta">
          <span class="blog-card-date">${formatDate(post.date || post.createdAt)}</span>
          ${post.tags ? post.tags.slice(0, 2).map(tag =>
            `<span class="blog-card-tag">#${tag}</span>`
          ).join('') : ''}
        </div>
        <h3 class="blog-card-title">
          <a href="/blog/${post.slug || post.id}">${post.title}</a>
        </h3>
        <p class="blog-card-excerpt">${post.excerpt || stripHtml(post.content || '').substring(0, 150) + '...'}</p>
        <a href="/blog/${post.slug || post.id}" class="blog-card-link">
          Read more <span aria-hidden="true">→</span>
        </a>
      `;
      this.blogContainer.appendChild(article);
    });

    // Trigger animations
    requestAnimationFrame(() => {
      this.blogContainer.querySelectorAll('.fade-in').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.1}s`;
        el.classList.add('visible');
      });
    });
  },

  showEmpty() {
    this.hideAll();
    const emptyEl = document.getElementById('blog-empty');
    if (emptyEl) {
      emptyEl.closest('#blog-fallback').style.display = '';
      emptyEl.style.display = '';
    }
  },

  showError() {
    this.hideAll();
    const errorEl = document.getElementById('blog-error');
    if (errorEl) {
      errorEl.closest('#blog-fallback').style.display = '';
      errorEl.style.display = '';

      // Retry button
      const retryBtn = document.getElementById('blog-retry-btn');
      retryBtn?.addEventListener('click', () => {
        if (this.skeletonContainer) this.skeletonContainer.style.display = '';
        if (this.fallbackContainer) this.fallbackContainer.style.display = 'none';
        if (this.blogContainer) this.blogContainer.style.display = 'none';
        this.fetchPosts();
      }, { once: true });
    }
  },

  hideAll() {
    if (this.skeletonContainer) this.skeletonContainer.style.display = 'none';
    if (this.blogContainer) this.blogContainer.style.display = 'none';
    if (this.fallbackContainer) this.fallbackContainer.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => HomeBlog.init());
