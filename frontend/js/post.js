'use strict';

import { formatDate, readingTime, escHtml } from '../src/utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  const slug = getSlugFromUrl();

  // DOM refs matching post.html IDs exactly
  const loadingEl   = document.getElementById('post-loading');
  const containerEl = document.getElementById('post-container');
  const notFoundEl  = document.getElementById('post-not-found');
  const errorEl     = document.getElementById('post-error');
  const retryBtn    = document.getElementById('post-retry');

  // Post content refs
  const categoryEl  = document.getElementById('post-category');
  const dateEl      = document.getElementById('post-date');
  const readTimeEl  = document.getElementById('post-read-time');
  const titleEl     = document.getElementById('post-title');
  const tagsEl      = document.getElementById('post-tags');
  const bodyEl      = document.getElementById('post-body');

  if (!slug) {
    showState('not-found');
    return;
  }

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // DEFENSIVE: handle both plain array and { posts: [...] } wrapper
    const posts = Array.isArray(data) ? data : (data.posts || []);
    const post = posts.find(p => p.slug === slug);

    if (!post) {
      showState('not-found');
      document.title = 'Not Found | Engineering Log';
      return;
    }

    // Render post
    if (categoryEl) categoryEl.textContent = post.category || 'Engineering';
    if (dateEl)     dateEl.textContent = formatDate(post.date);
    if (readTimeEl) readTimeEl.textContent = post.readTime || readingTime(post.content || '');
    if (titleEl)    titleEl.textContent = post.title || 'Untitled';
    if (bodyEl)     bodyEl.innerHTML = post.content || '';

    if (tagsEl && post.tags) {
      tagsEl.innerHTML = post.tags.map(t =>
        `<span class="post__tag">${escHtml(t)}</span>`
      ).join('');
    }

    // Update page title & meta
    document.title = `${escHtml(post.title)} | Engineering Log`;
    updateMetaDescription(post);

    // Show post, hide loading
    showState('post');

  } catch (err) {
    console.error('[post.js]', err);
    showState('error');
  }

  // Retry handler
  retryBtn?.addEventListener('click', () => {
    window.location.reload();
  });

  // State helper
  function showState(state) {
    loadingEl?.classList.toggle('hidden', state !== 'loading');
    containerEl?.classList.toggle('hidden', state !== 'post');
    notFoundEl?.classList.toggle('hidden', state !== 'not-found');
    errorEl?.classList.toggle('hidden', state !== 'error');
  }
});

function getSlugFromUrl() {
  const path = window.location.pathname;
  // Support /blog/:slug and /blog/:slug/
  const match = path.match(/\/blog\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function updateMetaDescription(post) {
  const desc = stripHtml(post.content || '').slice(0, 160);
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', desc);
}

function stripHtml(html) {
  if (!html) return '';
  try {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
  } catch {
    return html.replace(/<[^>]*>/g, '');
  }
}