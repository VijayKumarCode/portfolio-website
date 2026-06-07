/**
 * blogManager.js
 * Manages fetching and rendering blog post previews.
 * Used on: index.html (Engineering Log section, limited cards)
 *          blog.html (full listing, via blog.js)
 *
 * FIX: Removed duplicate local escHtml() function.
 *      Now imports from helpers.js (single source of truth).
 *      Previously, both helpers.js and blogManager.js defined
 *      identical escHtml functions — a maintenance risk if they diverge.
 */

import { escHtml, formatDate } from './helpers.js';

const BlogManager = (() => {

  let allPosts = [];
  const PREVIEW_LIMIT = 3;

  /* ── DOM Helpers ── */
  function show(el) {
    if (el) { el.classList.remove('hidden'); el.style.display = ''; }
  }

  function hide(el) {
    if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
  }

  function resetAllStates(els) {
    hide(els.loading);
    hide(els.empty);
    hide(els.error);
    hide(els.grid);
  }

  /* ── Template ── */
  function createBlogCard(post) {
    const tagsHtml = (post.tags || []).length > 0
      ? `<div class="blog-tags">
          ${post.tags.map(tag => `<span class="blog-tag">${escHtml(tag)}</span>`).join('')}
         </div>`
      : '';

    return `
      <article class="blog-card" data-category="${escHtml(post.category || '')}">
        <div class="blog-meta">
          <time datetime="${escHtml(post.date || '')}">${formatDate(post.date)}</time>
          <span class="sep">•</span>
          <span class="blog-category">${escHtml(post.category || '')}</span>
          <span class="sep">•</span>
          <span>${escHtml(post.readTime || '')}</span>
        </div>
        <h3>
          <a href="/blog/${escHtml(post.slug)}">${escHtml(post.title)}</a>
        </h3>
        <p class="blog-excerpt">${escHtml(post.excerpt || '')}</p>
        ${tagsHtml}
        <a href="/blog/${escHtml(post.slug)}" class="blog-read" aria-label="Read ${escHtml(post.title)}">
          <span>Read entry</span>
          <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>
    `.trim();
  }

  /* ── Fetch ── */
  async function fetchPosts() {
    const response = await fetch('/src/data/posts.json', {
      /* FIX: was 'no-cache' which bypasses the service worker cache entirely.
         'default' respects cache headers and allows SW caching. */
      cache: 'default',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: HTTP ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.posts ?? []);
  }

  /* ── Render ── */
  function renderCards(posts, container, limit = 0) {
    const slice = limit > 0 ? posts.slice(0, limit) : posts;
    container.innerHTML = slice.map(createBlogCard).join('');
  }

  /* ── Public API ── */
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