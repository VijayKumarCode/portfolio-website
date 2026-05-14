/**
 * home-blog.js
 * ─────────────────────────────────────────────────────────
 * Renders the 3 most recent blog posts on the homepage.
 *
 * DEPENDENCY: blogManager.js must be loaded first.
 * TARGET: <div id="home-blog-list"> in index.html
 * PATTERN: Self-executing IIFE with DOMContentLoaded guard.
 * ─────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ─── Template: Single blog card ─────────────────────────
  function createBlogCard(post) {
    var bm = window.BlogManager;
    var url = bm.getPostURL(post.slug);
    var date = bm.formatDate(post.date);
    var thumbnail = post.thumbnail || '/assets/blog/blog-default.jpg';
    var readTime = post.readTime || '5 min read';

    var tagsHTML = '';
    if (Array.isArray(post.tags) && post.tags.length > 0) {
      tagsHTML = '<div class="blog-card__tags" aria-label="Tags">';
      post.tags.slice(0, 2).forEach(function (tag) {
        tagsHTML += '<span class="blog-tag">' + bm.escapeHTML(tag) + '</span>';
      });
      tagsHTML += '</div>';
    }

    return (
      '<article class="blog-card reveal" role="article">' +
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
          '<h3 class="blog-card__title">' +
            '<a href="' + url + '" class="blog-card__title-link">' +
              bm.escapeHTML(post.title) +
            '</a>' +
          '</h3>' +
          '<p class="blog-card__excerpt">' + bm.escapeHTML(post.excerpt) + '</p>' +
          '<div class="blog-card__footer">' +
            '<time class="blog-card__date" datetime="' + bm.escapeHTML(post.date) + '">' +
              bm.escapeHTML(date) +
            '</time>' +
            '<span class="blog-card__read-time">' + bm.escapeHTML(readTime) + '</span>' +
          '</div>' +
          '<a href="' + url + '" class="blog-card__cta" aria-label="Read: ' + bm.escapeHTML(post.title) + '">' +
            'Read Article' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M5 12h14M12 5l7 7-7 7"/>' +
            '</svg>' +
          '</a>' +
        '</div>' +
      '</article>'
    );
  }

  // ─── Template: Loading skeletons ────────────────────────
  function createSkeletons(count) {
    var html = '';
    for (var i = 0; i < count; i++) {
      html += (
        '<div class="blog-card blog-card--skeleton" aria-hidden="true">' +
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
        '<p>Could not load articles. Please refresh the page to try again.</p>' +
      '</div>'
    );
  }

  // ─── Template: Empty state ───────────────────────────────
  function createEmptyState() {
    return (
      '<div class="blog-state blog-state--empty">' +
        '<p>No articles yet. Engineering content coming soon.</p>' +
      '</div>'
    );
  }

  // ─── Main render function ────────────────────────────────
  async function renderHomepageBlogs() {
    // 1. Guard: ensure we are on the homepage (container must exist)
    var container = document.getElementById('home-blog-list');
    if (!container) {
      return; // Not on index.html — exit silently
    }

    // 2. Guard: BlogManager must be available
    if (!window.BlogManager) {
      console.error('[home-blog.js] BlogManager not found. Verify blogManager.js loads before home-blog.js.');
      container.innerHTML = createErrorState();
      return;
    }

    // 3. Show loading skeletons immediately (prevents layout shift)
    container.innerHTML = createSkeletons(3);
    container.setAttribute('aria-busy', 'true');
    container.setAttribute('aria-label', 'Loading recent articles');

    try {
      // 4. Fetch 3 most recent posts
      var posts = await window.BlogManager.getRecentPosts(3);

      // 5. Handle empty data
      if (!posts || posts.length === 0) {
        container.innerHTML = createEmptyState();
        return;
      }

      // 6. Render cards
      var html = '';
      posts.forEach(function (post) {
        html += createBlogCard(post);
      });
      container.innerHTML = html;
      container.setAttribute('aria-label', 'Recent articles');

      // 7. Trigger scroll reveal for cards
      if (window.initScrollReveal) {
        window.initScrollReveal();
      }

    } catch (err) {
      console.error('[home-blog.js] Render failed:', err);
      container.innerHTML = createErrorState();
    } finally {
      container.removeAttribute('aria-busy');
    }
  }

  // ─── Init: DOMContentLoaded guard ───────────────────────
  // Works correctly whether script is deferred or inline
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHomepageBlogs);
  } else {
    renderHomepageBlogs();
  }

})();
