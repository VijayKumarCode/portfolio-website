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
   * Shows an element by removing 'hidden' class and clearing inline styles.
   * @param {HTMLElement|null} el
   */
  function show(el) {
    if (el) {
      el.classList.remove('hidden');
      el.style.display = '';
    }
  }

  /**
   * Hides an element by adding 'hidden' class and setting display: none.
   * @param {HTMLElement|null} el
   */
  function hide(el) {
    if (el) {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  }

  /**
   * Resets all blog states to hidden before showing the correct one.
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
   * Always uses root-relative path to avoid resolution ambiguity.
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
   * Resolved selectors to match index.html elements.
   */
  async function initHomePreview() {
    const els = {
      grid:    document.getElementById('blog-container'),
      empty:   document.getElementById('blog-empty'),
      error:   document.getElementById('blog-error'),
      loading: document.getElementById('blog-container-skeleton'),
      retry:   document.getElementById('blog-retry-btn'),
    };

    if (!els.grid && !els.empty) return;

    resetAllStates(els);
    show(els.loading);

    try {
      allPosts = await fetchPosts();
      allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      resetAllStates(els);

      if (allPosts.length === 0) {
        show(els.empty);
        return;
      }

      renderCards(allPosts, els.grid, PREVIEW_LIMIT);
      show(els.grid);

    } catch (err) {
      console.error('[BlogManager] initHomePreview failed:', err);
      resetAllStates(els);
      show(els.error);

      if (els.retry) {
        els.retry.addEventListener('click', () => initHomePreview(), { once: true });
      }
    }
  }

  /**
   * Initialises the full blog listing page.
   * Resolves selector contracts to match blog.html elements.
   */
  async function initBlogPage() {
    const els = {
      grid:     document.getElementById('blog-container'),
      empty:    document.getElementById('blog-empty'),
      error:    document.getElementById('blog-error'),
      loading:  document.getElementById('blog-container-skeleton'),
      retry:    document.getElementById('blog-retry-btn'),
      loadMore: document.getElementById('load-more-btn'),
      search:   document.getElementById('blog-search'),
    };

    if (!els.grid) return;

    const PAGE_SIZE = 6;
    let visibleCount = PAGE_SIZE;
    let activeCategory = 'all';
    let searchTerm = '';

    resetAllStates(els);
    hide(els.loadMore);
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

      applyFilters();

      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeCategory = btn.dataset.category ?? 'all';
          visibleCount = PAGE_SIZE;
          applyFilters();
        });
      });

      if (els.search) {
        els.search.addEventListener('input', () => {
          searchTerm = els.search.value.trim().toLowerCase();
          visibleCount = PAGE_SIZE;
          applyFilters();
        });
      }

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

      if (filtered.length > visibleCount) {
        show(els.loadMore);
      } else {
        hide(els.loadMore);
      }
    }
  }

  return { initHomePreview, initBlogPage };

})();

export default BlogManager;
