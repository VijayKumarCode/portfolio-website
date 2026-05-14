/**
 * blog.js
 * Renders all blog posts on the blog listing page (blog.html).
 * Depends on BlogManager (blogManager.js must load first).
 */

(function () {
  'use strict';

  /**
   * Generates HTML for a full blog list card.
   * @param {Object} post
   * @returns {string} HTML string
   */
  function createBlogListCard(post) {
    const postURL = window.BlogManager.getPostURL(post.slug);
    const formattedDate = window.BlogManager.formatDate(post.date);
    const thumbnail = post.thumbnail || '/assets/blog/blog-default.jpg';
    const tagsHTML = Array.isArray(post.tags) && post.tags.length > 0
      ? `<div class="blog-card__tags">
           ${post.tags.map(tag => `<span class="blog-tag">${window.escapeHTML(tag)}</span>`).join('')}
         </div>`
      : '';

    return `
      <article class="blog-card blog-card--list" role="article">
        <a href="${postURL}" class="blog-card__image-link" tabindex="-1" aria-hidden="true">
          <div class="blog-card__image-wrapper">
            <img
              src="${window.escapeHTML(thumbnail)}"
              alt="${window.escapeHTML(post.title)}"
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
          <h2 class="blog-card__title">
            <a href="${postURL}" class="blog-card__title-link">
              ${window.escapeHTML(post.title)}
            </a>
          </h2>
          <p class="blog-card__excerpt">${window.escapeHTML(post.excerpt)}</p>
          <div class="blog-card__footer">
            <time class="blog-card__date" datetime="${window.escapeHTML(post.date)}">
              ${formattedDate}
            </time>
            <a href="${postURL}" class="btn btn--secondary blog-card__read-more" aria-label="Read ${window.escapeHTML(post.title)}">
              Read Article
            </a>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Renders loading skeleton for blog list page.
   * @returns {string}
   */
  function createLoadingSkeleton() {
    return Array(4).fill(0).map(() => `
      <div class="blog-card blog-card--list blog-card--skeleton" aria-hidden="true">
        <div class="blog-card__image-wrapper skeleton-box"></div>
        <div class="blog-card__body">
          <div class="skeleton-line skeleton-line--short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line--medium"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Renders error state.
   * @returns {string}
   */
  function createErrorState() {
    return `
      <div class="blog-error-state" role="alert">
        <h2>Failed to Load Articles</h2>
        <p>We couldn't load the blog posts. Please refresh the page or try again later.</p>
        <button class="btn btn--primary" onclick="window.location.reload()">
          Retry
        </button>
      </div>
    `;
  }

  /**
   * Renders empty state.
   * @returns {string}
   */
  function createEmptyState() {
    return `
      <div class="blog-empty-state">
        <h2>No Articles Yet</h2>
        <p>Articles on backend engineering, databases, and system design are coming soon.</p>
        <a href="/" class="btn btn--primary">Back to Home</a>
      </div>
    `;
  }

  /**
   * Main render function for blog listing page.
   */
  async function renderBlogList() {
    const container = document.getElementById('blog-list-container');
    if (!container) {
      return; // Not on blog.html
    }

    if (!window.BlogManager) {
      console.error('[blog.js] BlogManager is not loaded.');
      if (container) container.innerHTML = createErrorState();
      return;
    }

    // Show loading state
    container.innerHTML = createLoadingSkeleton();
    container.setAttribute('aria-busy', 'true');

    try {
      const posts = await window.BlogManager.fetchPosts();

      if (posts.length === 0) {
        container.innerHTML = createEmptyState();
        return;
      }

      container.innerHTML = posts.map(createBlogListCard).join('');

      // Update post count in header if element exists
      const countEl = document.getElementById('blog-post-count');
      if (countEl) {
        countEl.textContent = `${posts.length} ${posts.length === 1 ? 'Article' : 'Articles'}`;
      }

    } catch (error) {
      console.error('[blog.js] Failed to render blog list:', error);
      container.innerHTML = createErrorState();
    } finally {
      container.removeAttribute('aria-busy');
    }
  }

  // Initialize after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBlogList);
  } else {
    renderBlogList();
  }

})();
