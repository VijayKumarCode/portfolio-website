/**
 * post.js
 * ─────────────────────────────────────────────────────────
 * Renders an individual blog post on post.html.
 *
 * SLUG EXTRACTION:
 *   CORRECT: URLSearchParams — /post.html?slug=my-slug
 *   WRONG:   pathname — /post.html gives "/post.html" not slug
 *
 * DEPENDENCY: blogManager.js must be loaded first.
 * ─────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // getSlugFromURL
  // FIXED: Uses URLSearchParams — the ONLY correct approach
  // for static HTML deployments.
  // URL pattern: /post.html?slug=my-post-slug
  // ─────────────────────────────────────────────────────────
  function getSlugFromURL() {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    return (slug && slug.trim() !== '') ? slug.trim() : null;
  }

  // ─── Set a DOM element's text content safely ─────────────
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = (typeof value === 'string') ? value : '';
  }

  // ─── Set a DOM element's attribute safely ────────────────
  function setAttr(id, attr, value) {
    var el = document.getElementById(id);
    if (el && typeof value === 'string') el.setAttribute(attr, value);
  }

  // ─────────────────────────────────────────────────────────
  // renderPost
  // Populates all post DOM elements with post data.
  // ─────────────────────────────────────────────────────────
  function renderPost(post) {
    var bm = window.BlogManager;

    // SEO: Update page title and meta description
    document.title = bm.escapeHTML(post.title) + ' | Vijay Kumar';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', post.excerpt || '');

    // Open Graph tags for social sharing
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', post.title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', post.excerpt || '');

    // Post header fields
    setText('post-title', post.title);
    setText('post-author', post.author || 'Vijay Kumar');
    setText('post-read-time', post.readTime || '5 min read');

    // Date — use <time> element with datetime attribute
    var dateEl = document.getElementById('post-date');
    if (dateEl) {
      dateEl.textContent = bm.formatDate(post.date);
      dateEl.setAttribute('datetime', post.date);
    }

    // Tags
    var tagsEl = document.getElementById('post-tags');
    if (tagsEl && Array.isArray(post.tags) && post.tags.length > 0) {
      var tagsHTML = '';
      post.tags.forEach(function (tag) {
        tagsHTML += '<span class="blog-tag">' + bm.escapeHTML(tag) + '</span>';
      });
      tagsEl.innerHTML = tagsHTML;
    }

    // Hero thumbnail
    var thumbEl = document.getElementById('post-thumbnail');
    if (thumbEl) {
      if (post.thumbnail) {
        thumbEl.src = post.thumbnail;
        thumbEl.alt = post.title;
        thumbEl.style.display = 'block';
        thumbEl.onerror = function () {
          this.style.display = 'none';
        };
      } else {
        thumbEl.style.display = 'none';
      }
    }

    // Post body — trusted HTML content from posts.json
    var contentEl = document.getElementById('post-content');
    if (contentEl) {
      contentEl.innerHTML = post.content || '<p>This post has no content yet.</p>';
    }

    // Back link
    var backEl = document.getElementById('post-back-link');
    if (backEl) {
      backEl.href = '/blog.html';
      backEl.textContent = 'Back to Articles';
    }

    // Show post, hide loading state
    var loadingEl = document.getElementById('post-loading');
    if (loadingEl) loadingEl.style.display = 'none';

    var postContainer = document.getElementById('post-container');
    if (postContainer) postContainer.style.display = 'block';
  }

  // ─────────────────────────────────────────────────────────
  // renderNotFound — shown when slug has no matching post
  // ─────────────────────────────────────────────────────────
  function renderNotFound(slug) {
    document.title = 'Article Not Found | Vijay Kumar';

    var loadingEl = document.getElementById('post-loading');
    if (loadingEl) loadingEl.style.display = 'none';

    var notFoundEl = document.getElementById('post-not-found');
    if (notFoundEl) {
      notFoundEl.style.display = 'block';
      return;
    }

    // Fallback inject if #post-not-found doesn't exist in HTML
    var main = document.querySelector('main') || document.body;
    var div = document.createElement('div');
    div.className = 'post-state post-state--not-found';
    div.setAttribute('role', 'main');
    div.innerHTML = (
      '<div class="post-state__inner">' +
        '<h1>Article Not Found</h1>' +
        '<p>The article you are looking for does not exist or may have been moved.</p>' +
        (slug
          ? '<p class="post-state__slug">Requested slug: <code>' + window.BlogManager.escapeHTML(slug) + '</code></p>'
          : ''
        ) +
        '<div class="post-state__actions">' +
          '<a href="/blog.html" class="btn btn--primary">Browse All Articles</a>' +
          '<a href="/" class="btn btn--secondary">Back to Home</a>' +
        '</div>' +
      '</div>'
    );
    main.appendChild(div);
  }

  // ─────────────────────────────────────────────────────────
  // renderError — shown when fetch itself fails
  // ─────────────────────────────────────────────────────────
  function renderError() {
    document.title = 'Error | Vijay Kumar';

    var loadingEl = document.getElementById('post-loading');
    if (loadingEl) loadingEl.style.display = 'none';

    var main = document.querySelector('main') || document.body;
    var div = document.createElement('div');
    div.className = 'post-state post-state--error';
    div.setAttribute('role', 'alert');
    div.innerHTML = (
      '<div class="post-state__inner">' +
        '<h1>Failed to Load Article</h1>' +
        '<p>There was a problem loading this article. Please check your connection and try again.</p>' +
        '<div class="post-state__actions">' +
          '<button class="btn btn--primary" onclick="window.location.reload()">Try Again</button>' +
          '<a href="/blog.html" class="btn btn--secondary">Browse Articles</a>' +
        '</div>' +
      '</div>'
    );
    main.appendChild(div);
  }

  // ─────────────────────────────────────────────────────────
  // renderNoSlug — shown when URL has no ?slug= parameter
  // ─────────────────────────────────────────────────────────
  function renderNoSlug() {
    console.warn('[post.js] No slug parameter in URL. Cannot load post.');
    renderNotFound(null);
  }

  // ─────────────────────────────────────────────────────────
  // initPostPage — main entry point
  // ─────────────────────────────────────────────────────────
  async function initPostPage() {
    // Guard: only run on post.html
    if (!document.getElementById('post-container') &&
        !document.getElementById('post-loading')) {
      return;
    }

    // Guard: BlogManager required
    if (!window.BlogManager) {
      console.error('[post.js] BlogManager not loaded. Verify script order in post.html.');
      renderError();
      return;
    }

    // Extract slug from URL query parameters
    // URL must be: /post.html?slug=my-post-slug
    var slug = getSlugFromURL();

    if (!slug) {
      renderNoSlug();
      return;
    }

    // Show loading state
    var loadingEl = document.getElementById('post-loading');
    if (loadingEl) loadingEl.style.display = 'block';

    var postContainer = document.getElementById('post-container');
    if (postContainer) postContainer.style.display = 'none';

    try {
      var post = await window.BlogManager.getPostBySlug(slug);

      if (!post) {
        renderNotFound(slug);
        return;
      }

      renderPost(post);

    } catch (err) {
      console.error('[post.js] Failed to load post for slug "' + slug + '":', err);
      renderError();
    }
  }

  // ─── Init ─────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostPage);
  } else {
    initPostPage();
  }

})();
