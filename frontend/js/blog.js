/**
 * Blog Listing Page Module
 * Handles post loading, search, filtering, and pagination
 */

import { formatDate, readingTime, escHtml } from '../src/utils/helpers.js';

// ─── State ───
const state = {
  allPosts: [],
  filteredPosts: [],
  currentPage: 1,
  postsPerPage: 6,
  currentCategory: 'all',
  searchQuery: ''
};

// ─── DOM References ───
const els = {
  grid: document.getElementById('blog-grid'),
  skeleton: document.getElementById('blog-skeleton'),
  empty: document.getElementById('blog-empty'),
  error: document.getElementById('blog-error'),
  searchInput: document.getElementById('blog-search'),
  searchBtn: document.getElementById('search-btn'),
  clearBtn: document.getElementById('clear-search'),
  categoryBtns: document.querySelectorAll('.category-btn'),
  loadMoreBtn: document.getElementById('load-more'),
  resultsCount: document.getElementById('results-count'),
  retryBtn: document.getElementById('blog-retry-btn')
};

// ─── Initialize ───
function init() {
  if (!els.grid) return;

  bindEvents();
  loadPosts();
}

function bindEvents() {
  // Search
  els.searchInput?.addEventListener('input', debounce(handleSearch, 300));
  els.searchBtn?.addEventListener('click', handleSearch);
  els.searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Clear search
  els.clearBtn?.addEventListener('click', () => {
    if (els.searchInput) {
      els.searchInput.value = '';
      state.searchQuery = '';
      state.currentPage = 1;
      applyFilters();
      updateClearButton();
    }
  });

  // Categories
  els.categoryBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      els.categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentCategory = btn.dataset.category || 'all';
      state.currentPage = 1;
      applyFilters();
    });
  });

  // Load more
  els.loadMoreBtn?.addEventListener('click', () => {
    state.currentPage++;
    renderPosts(state.filteredPosts, true);
  });

  // Retry
  els.retryBtn?.addEventListener('click', () => {
    showSkeleton();
    loadPosts();
  });
}

// ─── Load Posts ───
async function loadPosts() {
  showSkeleton();

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    // Defensive: handle both array and object with .posts
    state.allPosts = Array.isArray(data) ? data : data.posts || [];
    state.filteredPosts = [...state.allPosts];

    if (state.allPosts.length === 0) {
      showEmpty('No posts published yet.');
      return;
    }

    applyFilters();
  } catch (err) {
    console.error('[Blog] Failed to load posts:', err);
    showError();
  }
}

// ─── Search & Filter ───
function handleSearch() {
  const query = els.searchInput?.value.trim().toLowerCase() || '';
  state.searchQuery = query;
  state.currentPage = 1;
  applyFilters();
  updateClearButton();
}

function applyFilters() {
  let posts = [...state.allPosts];

  // Category filter
  if (state.currentCategory !== 'all') {
    posts = posts.filter(post =>
      post.tags?.some(tag => tag.toLowerCase() === state.currentCategory.toLowerCase())
    );
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery;
    posts = posts.filter(post =>
      post.title?.toLowerCase().includes(q) ||
      post.excerpt?.toLowerCase().includes(q) ||
      post.content?.toLowerCase().includes(q) ||
      post.tags?.some(tag => tag.toLowerCase().includes(q))
    );
  }

  // Sort by date (newest first)
  posts.sort((a, b) => {
    return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
  });

  state.filteredPosts = posts;
  renderPosts(posts, false);
  updateResultsCount(posts.length);
}

// ─── Render Posts ───
function renderPosts(posts, append = false) {
  if (!els.grid) return;

  if (!append) {
    els.grid.innerHTML = '';
  }

  const start = (state.currentPage - 1) * state.postsPerPage;
  const end = start + state.postsPerPage;
  const pagePosts = posts.slice(0, end);

  if (pagePosts.length === 0) {
    showEmpty(state.searchQuery
      ? `No results for "${escHtml(state.searchQuery)}"`
      : 'No posts in this category.'
    );
    return;
  }

  hideFallbacks();
  els.grid.style.display = '';

  pagePosts.forEach((post, index) => {
    const card = createPostCard(post, index);
    els.grid.appendChild(card);
  });

  // Update load more button
  if (els.loadMoreBtn) {
    els.loadMoreBtn.style.display = posts.length > end ? '' : 'none';
  }
}

function createPostCard(post, index) {
  const article = document.createElement('article');
  article.className = 'blog-article-card fade-in';
  article.style.transitionDelay = `${index * 80}ms`;

  const tagsHtml = post.tags
    ? post.tags.slice(0, 3).map(tag => `<span class="blog-card-tag">${escHtml(tag)}</span>`).join('')
    : '';

  const excerpt = post.excerpt
    ? post.excerpt
    : stripHtml(post.content || '').substring(0, 160) + '...';

  const readTime = readingTime(post.content || '');

  article.innerHTML = `
    <div class="blog-card-meta">
      <time datetime="${post.date || post.createdAt || ''}">${formatDate(post.date || post.createdAt)}</time>
      <span aria-hidden="true">·</span>
      <span>${readTime} min read</span>
    </div>
    <h3 class="blog-card-title"><a href="/blog/${post.slug}">${escHtml(post.title)}</a></h3>
    <p class="blog-card-excerpt">${escHtml(excerpt)}</p>
    <div class="blog-card-tags">${tagsHtml}</div>
    <a href="/blog/${post.slug}" class="blog-card-link">Read more →</a>
  `;

  requestAnimationFrame(() => {
    article.classList.add('visible');
  });

  return article;
}

// ─── UI Helpers ───
function showSkeleton() {
  if (els.skeleton) els.skeleton.style.display = '';
  if (els.grid) els.grid.style.display = 'none';
  if (els.empty) els.empty.style.display = 'none';
  if (els.error) els.error.style.display = 'none';
  if (els.loadMoreBtn) els.loadMoreBtn.style.display = 'none';
}

function hideFallbacks() {
  if (els.skeleton) els.skeleton.style.display = 'none';
  if (els.empty) els.empty.style.display = 'none';
  if (els.error) els.error.style.display = 'none';
}

function showEmpty(message) {
  hideFallbacks();
  if (els.grid) els.grid.style.display = 'none';
  if (els.empty) {
    els.empty.style.display = '';
    const msgEl = els.empty.querySelector('p');
    if (msgEl) msgEl.textContent = message;
  }
}

function showError() {
  hideFallbacks();
  if (els.grid) els.grid.style.display = 'none';
  if (els.error) els.error.style.display = '';
}

function updateResultsCount(count) {
  if (els.resultsCount) {
    els.resultsCount.textContent = state.searchQuery
      ? `${count} result${count !== 1 ? 's' : ''} for "${escHtml(state.searchQuery)}"`
      : `${count} post${count !== 1 ? 's' : ''}`;
  }
}

function updateClearButton() {
  if (els.clearBtn) {
    els.clearBtn.style.display = state.searchQuery ? '' : 'none';
  }
}

// ─── Utilities ───
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// ─── Start ───
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
