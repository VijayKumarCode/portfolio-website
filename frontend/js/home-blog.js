/**
 * home-blog.js
 * Renders the 3 most recent blog posts on the homepage.
 * Depends on BlogManager (blogManager.js must load first).
 */

(function () {
  'use strict';

  /**
   * Generates HTML for a single blog card.
   * @param {Object} post
   * @returns {string} HTML string
   */
  function createBlogCard(post) {
    const postURL = window.BlogManager.getPostURL(post.slug);
    const formattedDate = window.BlogManager.formatDate(post.date);
    const thumbnail = post.thumbnail || '/assets/blog/blog-default.jpg';
    const tagsHTML = Array.isArray(post.tags) && post.tags.length > 0
      ? `<div class="blog-card__tags">
           ${post.tags.slice(0, 2).map(tag => `<span class="blog-tag">${escapeHTML(tag)}</span>`).join('')}
         </div>`
      : '';

    return `
      <article class="blog-card" role="article">
        <a href="${postURL}" class="blog-card__image-link" tabindex="-1" aria-hidden="true">
          <div class="blog-card__image-wrapper">
            <img
              src="${escapeHTML(thumbnail)}"
              alt="${escapeHTML(post.title)}"
              class="blog-card__image"
              loading="lazy"
              width="400"
              height="225"
              onerror="this.src='/assets/blog/blog-default.jpg'"
            />
          </div>
        </a>
        <div class="blog-card__body">
          ${tagsHTML}
          <h3 class="blog-card__title">
            <a href="${postURL}" class="blog-card__title-link">
              ${escapeHTML(post.title)}
            </a>
          </h3>
          <p class="blog-card__excerpt">${escapeHTML(post.excerpt)}</p>
          <div class="blog-card__footer">
            <time class="blog-card__date" datetime="${escapeHTML(post.date)}">
              ${formattedDate}
            </time>
            <a href="${postURL}" class="blog-card__read-more" aria-label="Read more about ${escapeHTML(post.title)}">
              Read More
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Renders the loading skeleton UI.
   * @returns {string} HTML string
   */
  function createLoadingSkeleton() {
    return Array(3).fill(0).map(() => `
      <div class="blog-card blog-card--skeleton" aria-hidden="true">
        <div class="blog-card__image-wrapper skeleton-box"></div>
        <div class="blog-card__body">
          <div class="skeleton-line skeleton-line--short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line--medium"></div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Renders the error state UI.
   * @returns {string} HTML string
   */
  function createErrorState() {
    return `
      <div class="blog-error-state" role="alert">
        <p>Unable to load blog posts at this time. Please check back soon.</p>
      </div>
    `;
  }

  /**
   * Renders the empty state UI.
   * @returns {string} HTML string
   */
  function createEmptyState() {
    return `
      <div class="blog-empty-state">
        <p>No blog posts yet. Check back soon for articles on backend engineering.</p>
      </div>
    `;
  }

  /**
   * Safely escapes HTML to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Make escapeHTML available to card builder
  window.escapeHTML = escapeHTML;

  /**
   * Main render function.
   * Locates the homepage blog container and populates it.
   */
  async function renderHomepageBlogs() {
    // CRITICAL: Null-guard on container selector
    const container = document.getElementById('home-blog-list');
    if (!container) {
      // Not on the homepage — exit silently
      return;
    }

    // Verify BlogManager is available
    if (!window.BlogManager) {
      console.error('[home-blog.js] BlogManager is not loaded. Ensure blogManager.js loads before home-blog.js.');
      container.innerHTML = createErrorState();
      return;
    }

    // Show loading state immediately (prevents CLS)
    container.innerHTML = createLoadingSkeleton();
    container.setAttribute('aria-busy', 'true');

    try {
      const posts = await window.BlogManager.getRecentPosts(3);

      if (posts.length === 0) {
        container.innerHTML = createEmptyState();
        return;
      }

      container.innerHTML = posts.map(createBlogCard).join('');

    } catch (error) {
      console.error('[home-blog.js] Failed to render homepage blogs:', error);
      container.innerHTML = createErrorState();
    } finally {
      container.removeAttribute('aria-busy');
    }
  }

  // Initialize after DOM is fully ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHomepageBlogs);
  } else {
    // DOM already loaded (script loaded with defer or at end of body)
    renderHomepageBlogs();
  }

})();
