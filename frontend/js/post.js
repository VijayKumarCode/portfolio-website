/**
 * post.js
 * Renders an individual blog post on post.html.
 * Extracts slug from URL query parameters.
 * Depends on BlogManager (blogManager.js must load first).
 */

(function () {
  'use strict';

  /**
   * Extracts the post slug from the URL query string.
   * Correct pattern: /post.html?slug=my-post-slug
   * @returns {string|null}
   */
  function getSlugFromURL() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    return slug ? slug.trim() : null;
  }

  /**
   * Renders the full post content into the DOM.
   * @param {Object} post
   */
  function renderPost(post) {
    // Set page title
    document.title = `${post.title} | Vijay Kumar`;

    // Update meta description for SEO
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', post.excerpt || '');
    }

    // Render post header
    const titleEl = document.getElementById('post-title');
    if (titleEl) titleEl.textContent = post.title;

    const dateEl = document.getElementById('post-date');
    if (dateEl) {
      dateEl.textContent = window.BlogManager.formatDate(post.date);
      dateEl.setAttribute('datetime', post.date);
    }

    const authorEl = document.getElementById('post-author');
    if (authorEl) authorEl.textContent = post.author || 'Vijay Kumar';

    // Render tags
    const tagsEl = document.getElementById('post-tags');
    if (tagsEl && Array.isArray(post.tags)) {
      tagsEl.innerHTML = post.tags
        .map(tag => `<span class="blog-tag">${escapeHTML(tag)}</span>`)
        .join('');
    }

    // Render thumbnail
    const thumbnailEl = document.getElementById('post-thumbnail');
    if (thumbnailEl && post.thumbnail) {
      thumbnailEl.src = post.thumbnail;
      thumbnailEl.alt = post.title;
      thumbnailEl.style.display = 'block';
    }

    // Render post body content (HTML from JSON)
    const contentEl = document.getElementById('post-content');
    if (contentEl) {
      // post.content is trusted authored HTML from posts.json
      contentEl.innerHTML = post.content || '<p>This post has no content yet.</p>';
    }

    // Render "back to blog" breadcrumb
    const backLink = document.getElementById('post-back-link');
    if (backLink) {
      backLink.href = '/blog.html';
    }

    // Show the post container
    const postContainer = document.getElementById('post-container');
    if (postContainer) {
      postContainer.style.display = 'block';
    }

    // Hide loading state
    const loadingEl = document.getElementById('post-loading');
    if (loadingEl) loadingEl.style.display = 'none';
  }

  /**
   * Renders a 404 not-found state when post doesn't exist.
   * @param {string} slug
   */
  function renderNotFound(slug) {
    document.title = 'Post Not Found | Vijay Kumar';

    const loadingEl = document.getElementById('post-loading');
    if (loadingEl) loadingEl.style.display = 'none';

    const notFoundEl = document.getElementById('post-not-found');
    if (notFoundEl) {
      notFoundEl.style.display = 'block';
    } else {
      // Fallback: inject not-found message into page
      const mainEl = document.querySelector('main') || document.body;
      const div = document.createElement('div');
      div.className = 'post-not-found';
      div.innerHTML = `
        <div class="post-not-found__inner">
          <h1>Article Not Found</h1>
          <p>The article you're looking for doesn't exist or has been moved.</p>
          ${slug ? `<p class="post-not-found__slug">Requested: <code>${escapeHTML(slug)}</code></p>` : ''}
          <div class="post-not-found__actions">
            <a href="/blog.html" class="btn btn--primary">Browse All Articles</a>
            <a href="/" class="btn btn--secondary">Back to Home</a>
          </div>
        </div>
      `;
      mainEl.appendChild(div);
    }
  }

  /**
   * Renders an error state when fetch fails.
   */
  function renderFetchError() {
    const loadingEl = document.getElementById('post-loading');
    if (loadingEl) loadingEl.style.display = 'none';

    const mainEl = document.querySelector('main') || document.body;
    const div = document.createElement('div');
    div.className = 'post-error-state';
    div.setAttribute('role', 'alert');
    div.innerHTML = `
      <div class="post-not-found__inner">
        <h1>Failed to Load Article</h1>
        <p>There was an error loading this article. Please try again.</p>
        <div class="post-not-found__actions">
          <button class="btn btn--primary" onclick="window.location.reload()">Retry</button>
          <a href="/blog.html" class="btn btn--secondary">Browse Articles</a>
        </div>
      </div>
    `;
    mainEl.appendChild(div);
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

  /**
   * Main initialization — loads and renders a single post.
   */
  async function initPostPage() {
    if (!window.BlogManager) {
      console.error('[post.js] BlogManager is not loaded. Ensure blogManager.js loads first.');
      renderFetchError();
      return;
    }

    const slug = getSlugFromURL();

    if (!slug) {
      console.warn('[post.js] No slug found in URL. Cannot load post.');
      renderNotFound(null);
      return;
    }

    // Show loading indicator
    const loadingEl = document.getElementById('post-loading');
    if (loadingEl) loadingEl.style.display = 'block';

    try {
      const post = await window.BlogManager.getPostBySlug(slug);

      if (!post) {
        console.warn(`[post.js] No post found for slug: "${slug}"`);
        renderNotFound(slug);
        return;
      }

      renderPost(post);

    } catch (error) {
      console.error('[post.js] Failed to load post:', error);
      renderFetchError();
    }
  }

  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostPage);
  } else {
    initPostPage();
  }

})();
