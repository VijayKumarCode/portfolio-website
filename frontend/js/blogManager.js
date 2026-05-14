/**
 * blogManager.js
 * Manages fetching and rendering blog post previews.
 * Used on: index.html (Engineering Log section, limited cards)
 *          blog.html (full listing, via blog.js)
 */

const BlogManager = (() => {

  // ─── State ────────────────────────────────────────────────────────────────

  let allPosts = [];
  const PREVIEW_LIMIT = 3; // number of posts shown on homepage

  // ─── DOM Helpers ──────────────────────────────────────────────────────────

  /**
   * Shows an element by removing the 'hidden' class.
   * @param {HTMLElement|null} el
   */
  function show(el) {
    if (el) el.classList.remove('hidden');
  }

  /**
   * Hides an element by adding the 'hidden' class.
   * @param {HTMLElement|null} el
   */
  function hide(el) {
    if (el) el.classList.add('hidden');
  }

  /**
   * Resets all blog states to hidden before showing the correct one.
   * CRITICAL: This is the fix for the dual-state visibility bug.
   * @param {Object} els - Object containing all state elements
   */
  function resetAllStates(els) {
    hide(els.loading);
    hide(els.empty);
    hide(els.error);
    hide(els.grid);
  }

  // ─── Template ─────────────────────────────────────────────────────────────

  /**
   * Generates a blog card HTML string.
   * @param {Object} post
   * @returns {string}
   */
  function createBlogCard(post) {
    const dateObj = new Date(post.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return `
      <article class="blog-card" data-category="${escHtml(post.category)}">
        <div class="blog-card__meta">
          <span class="blog-card__category">${escHtml(post.category)}</span>
          <span class="blog-card__date">${formattedDate}</span>
          <span class="blog-card__read-time">${escHtml(post.readTime)}</span>
        </div>
        <h3 class="blog-card__title">
          <a href="/blog/${escHtml(post.slug)}" class="blog-card__link">
            ${escHtml(post.title)}
          </a>
        </h3>
        <p class="blog-card__excerpt">${escHtml(post.excerpt)}</p>
        <div class="blog-card__tags">
          ${post.tags.map(tag => `<span class="blog-card__tag">${escHtml(tag)}</span>`).join('')}
        </div>
        <a href="/blog/${escHtml(post.slug)}" class="blog-card__read-link" aria-label="Read ${escHtml(post.title)}">
          Read entry →
        </a>
      </article>
    `.trim();
  }

  /**
   * Escapes HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─── Fetch ────────────────────────────────────────────────────────────────

  /**
   * Fetches posts from the data file.
   * Always uses root-relative path to avoid resolution ambiguity
   * regardless of which page (/ or /blog) is loading this module.
   * @returns {Promise<Array>}
   */
  async function fetchPosts() {
    const response = await fetch('/data/posts.json', {
      cache: 'no-cache',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: HTTP ${response.status}`);
    }
    const data = await response.json();
    // Support both { posts: [...] } and [...] shapes
    return Array.isArray(data) ? data : (data.posts ?? []);
  }

  // ─── Renderers ────────────────────────────────────────────────────────────

  /**
   * Renders blog cards into a container element.
   * @param {Array}       posts      - array of post objects
   * @param {HTMLElement} container  - target grid element
   * @param {number}      limit      - max cards to render (0 = all)
   */
  function renderCards(posts, container, limit = 0) {
    const slice = limit > 0 ? posts.slice(0, limit) : posts;
    container.innerHTML = slice.map(createBlogCard).join('');
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Initialises the homepage Engineering Log preview.
   * Selector contract (must match index.html):
   *   #home-blog-grid    — card grid
   *   #home-blog-empty   — "no posts yet" message
   *   #home-blog-error   — "failed to load" message + retry button
   *   #home-blog-loading — loading skeleton (optional)
   *   #home-blog-retry   — retry button inside error state
   */
  async function initHomePreview() {
    const els = {
      grid:    document.getElementById('home-blog-grid'),
      empty:   document.getElementById('home-blog-empty'),
      error:   document.getElementById('home-blog-error'),
      loading: document.getElementById('home-blog-loading'),
      retry:   document.getElementById('home-blog-retry'),
    };

    // Guard: if the section isn't on this page, exit silently
    if (!els.grid && !els.empty) return;

    // 1. Reset ALL states — this is the fix for the dual-visibility bug
    resetAllStates(els);
    show(els.loading);

    try {
      allPosts = await fetchPosts();

      // Sort by date descending
      allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      resetAllStates(els); // reset again after async gap

      if (allPosts.length === 0) {
        show(els.empty);
        return;
      }

      renderCards(allPosts, els.grid, PREVIEW_LIMIT);
      show(els.grid);

    } catch (err) {
      console.error('[BlogManager] initHomePreview failed:', err);
      resetAllStates(els); // ensure only error shows
      show(els.error);

      // Wire retry button
      if (els.retry) {
        els.retry.addEventListener('click', () => initHomePreview(), { once: true });
      }
    }
  }

  /**
   * Initialises the full blog listing page.
   * Selector contract (must match blog.html):
   *   #blog-grid      — card grid
   *   #blog-empty     — "no entries" message
   *   #blog-error     — "failed to load" message + retry button
   *   #blog-loading   — loading skeleton
   *   #blog-retry     — retry button
   *   #load-more-btn  — "load more" button
   *   .filter-btn     — category filter buttons (data-category attr)
   *   #blog-search    — search input (optional)
   */
  async function initBlogPage() {
    const els = {
      grid:     document.getElementById('blog-grid'),
      empty:    document.getElementById('blog-empty'),
      error:    document.getElementById('blog-error'),
      loading:  document.getElementById('blog-loading'),
      retry:    document.getElementById('blog-retry'),
      loadMore: document.getElementById('load-more-btn'),
      search:   document.getElementById('blog-search'),
    };

    if (!els.grid) return;

    const PAGE_SIZE = 6;
    let visibleCount = PAGE_SIZE;
    let activeCategory = 'all';
    let searchTerm = '';

    resetAllStates(els);
    hide(els.loadMore); // ALWAYS hide load-more before we know if there are posts
    show(els.loading);

    try {
      allPosts = await fetchPosts();
      allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      resetAllStates(els);

      if (allPosts.length === 0) {
        show(els.empty);
        hide(els.loadMore);
        return;
      }

      // Initial render
      applyFilters();

      // Category filter buttons
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeCategory = btn.dataset.category ?? 'all';
          visibleCount = PAGE_SIZE;
          applyFilters();
        });
      });

      // Search input
      if (els.search) {
        els.search.addEventListener('input', () => {
          searchTerm = els.search.value.trim().toLowerCase();
          visibleCount = PAGE_SIZE;
          applyFilters();
        });
      }

      // Load more
      if (els.loadMore) {
        els.loadMore.addEventListener('click', () => {
          visibleCount += PAGE_SIZE;
          applyFilters();
        });
      }

    } catch (err) {
      console.error('[BlogManager] initBlogPage failed:', err);
      resetAllStates(els);
      hide(els.loadMore);
      show(els.error);

      if (els.retry) {
        els.retry.addEventListener('click', () => initBlogPage(), { once: true });
      }
    }

    function applyFilters() {
      let filtered = allPosts;

      if (activeCategory !== 'all') {
        filtered = filtered.filter(
          p => p.category.toLowerCase() === activeCategory.toLowerCase()
        );
      }

      if (searchTerm) {
        filtered = filtered.filter(
          p =>
            p.title.toLowerCase().includes(searchTerm) ||
            p.excerpt.toLowerCase().includes(searchTerm) ||
            (p.tags ?? []).some(t => t.toLowerCase().includes(searchTerm))
        );
      }

      if (filtered.length === 0) {
        hide(els.grid);
        show(els.empty);
        hide(els.loadMore);
        return;
      }

      const slice = filtered.slice(0, visibleCount);
      renderCards(slice, els.grid, 0);
      hide(els.empty);
      show(els.grid);

      // Load more visibility
      if (filtered.length > visibleCount) {
        show(els.loadMore);
      } else {
        hide(els.loadMore);
      }
    }
  }

  // ─── Expose ───────────────────────────────────────────────────────────────
  return { initHomePreview, initBlogPage };

})();

export default BlogManager;
