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

    if (!this.container) return;

    this.bindEvents();
    this.fetchPosts();
  },

  bindEvents() {
    this.searchInput?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
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
      this.posts = data.posts || [];
      if (this.posts.length === 0) {
        this.showEmpty();
        return;
      }
      this.buildFilters();
      this.render();
    } catch (err) {
      console.error('Blog listing failed:', err);
      this.showError();
    }
  },

  buildFilters() {
    const tags = new Set();
    this.posts.forEach(p => p.tags?.forEach(t => tags.add(t)));
    if (this.filterContainer) {
      this.filterContainer.innerHTML = `
        <button class="filter-tag active" data-tag="all">All</button>
        ${[...tags].map(t => `<button class="filter-tag" data-tag="${t}">#${t}</button>`).join('')}
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
      result = result.filter(p => p.tags?.includes(this.currentTag));
    }
    if (this.searchTerm) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(this.searchTerm) ||
        (p.excerpt || '').toLowerCase().includes(this.searchTerm)
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

    pagePosts.forEach(post => {
      const card = document.createElement('article');
      card.className = 'blog-article-card fade-in';
      card.innerHTML = `
        <div class="blog-card-meta">
          <time>${formatDate(post.date)}</time>
          ${post.tags?.map(t => `<span class="blog-card-tag">#${t}</span>`).join('')}
        </div>
        <h3 class="blog-card-title"><a href="/blog/${post.slug || post.id}">${post.title}</a></h3>
        <p class="blog-card-excerpt">${post.excerpt || stripHtml(post.content || '').substring(0, 150) + '...'}</p>
        <a href="/blog/${post.slug || post.id}" class="blog-card-link">Read more →</a>
      `;
      this.container.appendChild(card);
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
  }
};

document.addEventListener('DOMContentLoaded', () => BlogListing.init());
