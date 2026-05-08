/**
 * Home page blog preview loader.
 * Uses native fetch, no external api.js dependency.
 */
import { stripHtml, formatDate } from '../src/utils/helpers.js';

const HomeBlog = {
  skeletonContainer: document.getElementById('blog-container-skeleton'),
  blogContainer: document.getElementById('blog-container'),
  fallbackContainer: document.getElementById('blog-fallback'),
  maxPosts: 3,

  async init() {
    if (!this.blogContainer) return;
    try {
      const res = await fetch('/data/posts.json');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      const posts = data.posts || [];
      if (posts.length === 0) {
        this.showEmpty();
        return;
      }
      const sorted = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      const recent = sorted.slice(0, this.maxPosts);
      this.render(recent);
    } catch (err) {
      console.error('Home blog error:', err);
      this.showError();
    }
  },

  render(posts) {
    this.skeletonContainer.style.display = 'none';
    this.blogContainer.style.display = 'grid'; /* preserve grid layout */
    this.blogContainer.innerHTML = '';
    posts.forEach(post => {
      const card = document.createElement('article');
      card.className = 'blog-article-card fade-in';
      const slug = post.slug || post.id;
      card.innerHTML = `
        <div class="blog-card-meta">
          <span class="blog-card-date">${formatDate(post.date)}</span>
          ${post.tags ? post.tags.slice(0, 2).map(tag => `<span class="blog-card-tag">#${tag}</span>`).join('') : ''}
        </div>
        <h3 class="blog-card-title"><a href="/blog/${slug}">${post.title}</a></h3>
        <p class="blog-card-excerpt">${post.excerpt || stripHtml(post.content || '').substring(0, 150) + '...'}</p>
        <a href="/blog/${slug}" class="blog-card-link">Read more <span aria-hidden="true">→</span></a>
      `;
      this.blogContainer.appendChild(card);
    });
  },

  showEmpty() {
    this.skeletonContainer.style.display = 'none';
    if (this.fallbackContainer) this.fallbackContainer.style.display = '';
    const emptyEl = document.getElementById('blog-empty');
    if (emptyEl) emptyEl.style.display = '';
  },

  showError() {
    this.skeletonContainer.style.display = 'none';
    if (this.fallbackContainer) this.fallbackContainer.style.display = '';
    const errorEl = document.getElementById('blog-error');
    if (errorEl) errorEl.style.display = '';
  }
};

document.addEventListener('DOMContentLoaded', () => HomeBlog.init());
