import { formatDate, stripHtml } from '../src/utils/helpers.js';

const BlogListing = {
  posts: [],
  currentTag: 'all',
  searchTerm: '',
  pageSize: 6,
  currentPage: 1,

  init() {
    this.container = document.getElementById('blog-container');
    this.searchInput = document.getElementById('blog-search');
    this.filterContainer = document.getElementById('blog-filter-tags');
    this.loadMoreBtn = document.getElementById('load-more-btn');
    this.skeleton = document.getElementById('blog-container-skeleton');
    this.emptyState = document.getElementById('blog-empty');
    this.errorState = document.getElementById('blog-error');

    if (!this.container) {
      console.error('[BlogListing] #blog-container not found in DOM');
      return;
    }

    this.bindEvents();
    this.fetchPosts();
  },

  bindEvents() {
    this.searchInput?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase().trim();
      this.currentPage = 1;
      this.render();
    });

    this.filterContainer?.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-tag')) {
        this.currentTag = e.target.dataset.tag;
        this.currentPage = 1;
        this.updateFilterActiveState();
        this.render();
      }
    });

    this.loadMoreBtn?.addEventListener('click', () => {
      this.currentPage++;
      this.render(true);
    });
  },

  async fetchPosts() {
    try {
      const res = await fetch('/data/posts.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // CRITICAL FIX: Handle both plain array and { posts: [...] } wrapper
      this.posts = Array.isArray(data) ? data : (data.posts || []);

      if (this.posts.length === 0) {
        this.showEmpty();
        return;
      }

      this.buildFilters();
      this.render();
    } catch (err) {
      console.error('[BlogListing] Failed to load posts:', err);
      this.showError();
    }
  },

  buildFilters() {
    const tags = new Set();
    this.posts.forEach(p => {
      // FIX: Fallback to category if tags missing
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => tags.add(t));
      } else if (p.category) {
        tags.add(p.category);
      }
    });

    if (this.filterContainer) {
      this.filterContainer.innerHTML = `
        <button class="filter-tag active" data-tag="all">All</button>
        ${[...tags].map(t => `<button class="filter-tag" data-tag="${this.escHtml(t)}">${this.escHtml(t)}</button>`).join('')}
      `;
    }
  },

  updateFilterActiveState() {
    this.filterContainer?.querySelectorAll('.filter-tag').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tag === this.currentTag);
    });
  },

  filterPosts() {
    let result = [...this.posts];
    if (this.currentTag !== 'all') {
      result = result.filter(p => {
        const postTags = p.tags || [];
        const categories = p.category ? [p.category] : [];
        return postTags.includes(this.currentTag) || categories.includes(this.currentTag);
      });
    }
    if (this.searchTerm) {
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(this.searchTerm) ||
        (p.excerpt || '').toLowerCase().includes(this.searchTerm) ||
        stripHtml(p.content || '').toLowerCase().includes(this.searchTerm)
      );
    }
    return result;
  },

  render(append = false) {
    const filtered = this.filterPosts();
    if (!append) {
      this.container.innerHTML = '';
      this.hideStates();
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const pagePosts = filtered.slice(start, start + this.pageSize);

    if (pagePosts.length === 0 && !append) {
      this.showEmpty();
      return;
    }

    pagePosts.forEach((post, index) => {
      const card = document.createElement('article');
      card.className = 'blog-article-card fade-in';
      card.style.transitionDelay = `${index * 100}ms`;

      const tags = post.tags || (post.category ? [post.category] : []);
      const excerpt = post.excerpt
        ? post.excerpt
        : stripHtml(post.content || '').substring(0, 150) + '...';

      card.innerHTML = `
        <div class="blog-card-meta">
          <time datetime="${post.date || ''}">${formatDate(post.date)}</time>
          ${tags.map(t => `<span class="blog-card-tag">${this.escHtml(t)}</span>`).join('')}
        </div>
        <h3 class="blog-card-title">
          <a href="/blog/${post.slug}" rel="bookmark">${this.escHtml(post.title)}</a>
        </h3>
        <p class="blog-card-excerpt">${this.escHtml(excerpt)}</p>
        <a class="blog-card-link" href="/blog/${post.slug}" aria-label="Read ${this.escHtml(post.title)}">
          Read more <span aria-hidden="true">→</span>
        </a>
      `;
      this.container.appendChild(card);

      requestAnimationFrame(() => {
        card.classList.add('visible');
      });
    });

    if (this.loadMoreBtn) {
      this.loadMoreBtn.style.display = start + this.pageSize < filtered.length ? '' : 'none';
    }

    if (this.skeleton) this.skeleton.style.display = 'none';
    this.container.style.display = 'grid';
  },

  hideStates() {
    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.errorState) this.errorState.style.display = 'none';
    if (this.skeleton) this.skeleton.style.display = 'none';
  },

  showEmpty() {
    this.hideStates();
    if (this.emptyState) this.emptyState.style.display = '';
    this.container.style.display = 'none';
  },

  showError() {
    this.hideStates();
    if (this.errorState) this.errorState.style.display = '';
    this.container.style.display = 'none';
  },

  escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => BlogListing.init());