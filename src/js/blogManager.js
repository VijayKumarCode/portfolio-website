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
   * Matches CSS classes: .blog-card, .blog-meta, .blog-category, .blog-read
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

    // Build tags HTML if present
    const tagsHtml = (post.tags || []).length > 0
      ? `<div class="blog-tags">
           ${post.tags.map(tag => `<span class="blog-tag">${escHtml(tag)}</span>`).join('')}
         </div>`
      : '';

    return `
      <article class="blog-card" data-category="${escHtml(post.category)}">
        <div class="blog-meta">
          <time datetime="${post.date}">${formattedDate}</time>
          <span class="sep">•</span>
          <span class="blog-category">${escHtml(post.category)}</span>
          <span class="sep">•</span>
          <span>${escHtml(post.readTime || '')}</span>
        </div>
        <h3>
          <a href="/blog/${escHtml(post.slug)}">
            ${escHtml(post.title)}
          </a>
        </h3>
        <p class="blog-excerpt">${escHtml(post.excerpt)}</p>
        ${tagsHtml}
        <a href="/blog/${escHtml(post.slug)}" class="blog-read" aria-label="Read ${escHtml(post.title)}">
          <span>Read entry</span>
          <span class="arrow" aria-hidden="true">→</span>
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

  return { initHomePreview };

})();

export default BlogManager;