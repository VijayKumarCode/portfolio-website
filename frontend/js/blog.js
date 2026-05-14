/**
 * blog.js
 * ─────────────────────────────────────────────────────────
 * Renders all blog posts on the blog listing page (blog.html).
 *
 * DEPENDENCY: blogManager.js must be loaded first.
 * TARGET: <div id="blog-list-container"> in blog.html
 * ─────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ─── Template: Blog list card ────────────────────────────
  function createBlogListCard(post) {
    var bm = window.BlogManager;
    var url = bm.getPostURL(post.slug);
    var date = bm.formatDate(post.date);
    var thumbnail = post.thumbnail || '/assets/blog/blog-default.jpg';
    var readTime = post.readTime || '5 min read';

    var tagsHTML = '';
    if (Array.isArray(post.tags) && post.tags.length > 0) {
      tagsHTML = '<div class="blog-card__tags" aria-label="Tags">';
      post.tags.forEach(function (tag) {
        tagsHTML += '<span class="blog-tag">' + bm.escapeHTML(tag) + '</span>';
      });
      tagsHTML += '</div>';
    }

    return (
      '<article class="blog-card blog-card--list reveal" role="article">' +
        '<a href="' + url + '" class="blog-card__image-link" tabindex="-1" aria-hidden="true">' +
          '<div class="blog-card__image-wrapper">' +
            '<img' +
              ' src="' + bm.escapeHTML(thumbnail) + '"' +
              ' alt="' + bm.escapeHTML(post.title) + '"' +
              ' class="blog-card__image"' +
              ' loading="lazy"' +
              ' width="400"' +
              ' height="225"' +
              ' onerror="this.src=\'/assets/blog/blog-default.jpg\'"' +
            '/>' +
          '</div>' +
        '</a>' +
        '<div class="blog-card__body">' +
          tagsHTML +
          '<h2 class="blog-card__title">' +
            '<a href="' + url + '" class="blog-card__title-link">' +
              bm.escapeHTML(post.title) +
            '</a>' +
          '</h2>' +
          '<p class="blog-card__excerpt">' + bm.escapeHTML(post.excerpt) + '</p>' +
          '<div class="blog-card__footer">' +
            '<time class="blog-card__date" datetime="' + bm.escapeHTML(post.date) + '">' +
              bm.escapeHTML(date) +
            '</time>' +
            '<span class="blog-card__read-time">' + bm.escapeHTML(readTime) + '</span>' +
            '<a href="' + url + '" class="btn btn--secondary btn--sm" aria-label="Read ' + bm.escapeHTML(post.title) + '">' +
              'Read Article' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  // ─── Template: Skeletons ─────────────────────────────────
  function createSkeletons(count) {
    var html = '';
    for (var i = 0; i < count; i++) {
      html += (
        '<div class="blog-card blog-card--list blog-card--skeleton" aria-hidden="true">' +
          '<div class="blog-card__image-wrapper skeleton-box"></div>' +
          '<div class="blog-card__body">' +
            '<div class="skeleton-line skeleton-line--short"></div>' +
            '<div class="skeleton-line"></div>' +
            '<div class="skeleton-line skeleton-line--medium"></div>' +
            '<div class="skeleton-line skeleton-line--short"></div>' +
          '</div>' +
        '</div>'
      );
    }
    return html;
  }

  // ─── Template: Error state ───────────────────────────────
  function createErrorState() {
    return (
      '<div class="blog-state blog-state--error" role="alert">' +
        '<h2>Could Not Load Articles</h2>' +
        '<p>There was an error fetching the articles. Please refresh to try again.</p>' +
        '<button class="btn btn--primary" onclick="window.location.reload()">Retry</button>' +
      '</div>'
    );
  }

  // ─── Template: Empty state ───────────────────────────────
  function createEmptyState() {
    return (
      '<div class="blog-state blog-state--empty">' +
        '<h2>No Articles Yet</h2>' +
        '<p>Engineering articles on backend systems, databases, and infrastructure are coming soon.</p>' +
        '<a href="/" class="btn btn--primary">Back to Home</a>' +
      '</div>'
    );
  }

  // ─── Main render function ────────────────────────────────
  async function renderBlogList() {
    // 1. Guard: only run on blog.html
    var container = document.getElementById('blog-list-container');
    if (!container) {
      return;
    }

    // 2. Guard: BlogManager required
    if (!window.BlogManager) {
      console.error('[blog.js] BlogManager not found.');
      container.innerHTML = createErrorState();
      return;
    }

    // 3. Show skeletons
    container.innerHTML = createSkeletons(4);
    container.setAttribute('aria-busy', 'true');

    try {
      // 4. Fetch all posts
      var posts = await window.BlogManager.fetchPosts();

      // 5. Handle empty
      if (!posts || posts.length === 0) {
        container.innerHTML = createEmptyState();
        return;
      }

      // 6. Update post count badge if it exists
      var countEl = document.getElementById('blog-post-count');
      if (countEl) {
        countEl.textContent = posts.length + ' ' + (posts.length === 1 ? 'Article' : 'Articles');
      }

      // 7. Render all cards
      var html = '';
      posts.forEach(function (post) {
        html += createBlogListCard(post);
      });
      container.innerHTML = html;

    } catch (err) {
      console.error('[blog.js] Render failed:', err);
      container.innerHTML = createErrorState();
    } finally {
      container.removeAttribute('aria-busy');
    }
  }

  // ─── Init ─────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBlogList);
  } else {
    renderBlogList();
  }

})();
