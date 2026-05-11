/**
 * post.js
 * Renders a single blog post on post.html.
 * Works with Vercel clean URLs: /blog/:slug
 *
 * Slug resolution order:
 *   1. URL path segment (for /blog/my-slug clean URLs)
 *   2. ?slug= query param (fallback for direct .html access)
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function escHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }

/**
 * Resolves the post slug from the current URL.
 * Handles both /blog/my-slug (Vercel clean URL) and ?slug=my-slug.
 * @returns {string|null}
 */
function resolveSlug() {
  // 1. Check query param first (direct .html access)
  const params = new URLSearchParams(window.location.search);
  if (params.has('slug')) return params.get('slug');

  // 2. Extract from URL path: /blog/my-slug → 'my-slug'
  const segments = window.location.pathname.split('/').filter(Boolean);
  // Path is /blog/:slug so slug is at index 1
  if (segments.length >= 2 && segments[0] === 'blog') {
    return segments[1];
  }

  return null;
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

async function fetchPosts() {
  const res = await fetch('/data/posts.json', {
    cache: 'no-cache',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.posts ?? []);
}

// ─── Render ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderPost(post) {
  const els = {
    container:  document.getElementById('post-container'),
    title:      document.getElementById('post-title'),
    meta:       document.getElementById('post-meta'),
    category:   document.getElementById('post-category'),
    date:       document.getElementById('post-date'),
    readTime:   document.getElementById('post-read-time'),
    tags:       document.getElementById('post-tags'),
    body:       document.getElementById('post-body'),
    loading:    document.getElementById('post-loading'),
    error:      document.getElementById('post-error'),
    notFound:   document.getElementById('post-not-found'),
  };

  hide(els.loading);
  hide(els.error);
  hide(els.notFound);

  // Update document title
  document.title = `${post.title} | Vijay Kumar`;

  // Update meta for SEO
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', post.excerpt);

  // Populate fields
  if (els.title)    els.title.textContent   = post.title;
  if (els.category) els.category.textContent = post.category;
  if (els.date)     els.date.textContent    = formatDate(post.date);
  if (els.readTime) els.readTime.textContent = post.readTime;

  // Tags
  if (els.tags && post.tags) {
    els.tags.innerHTML = post.tags
      .map(t => `<span class="post-tag">${escHtml(t)}</span>`)
      .join('');
  }

  // Body — post.content is trusted HTML authored in posts.json
  // Only inject content from your own data file, never from user input
  if (els.body) els.body.innerHTML = post.content;

  show(els.container);
}

// ─── Init ───────────────────────────────────────────────────────────────────

async function init() {
  const els = {
    loading:  document.getElementById('post-loading'),
    error:    document.getElementById('post-error'),
    notFound: document.getElementById('post-not-found'),
    container: document.getElementById('post-container'),
  };

  // Show loading, hide all else
  show(els.loading);
  hide(els.error);
  hide(els.notFound);
  hide(els.container);

  const slug = resolveSlug();

  if (!slug) {
    hide(els.loading);
    show(els.notFound);
    return;
  }

  try {
    const posts = await fetchPosts();
    const post = posts.find(p => p.slug === slug);

    if (!post) {
      hide(els.loading);
      show(els.notFound);
      return;
    }

    renderPost(post);

  } catch (err) {
    console.error('[post.js] Failed to load post:', err);
    hide(els.loading);
    show(els.error);

    const retryBtn = document.getElementById('post-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => init(), { once: true });
    }
  }
}

document.addEventListener('DOMContentLoaded', init);