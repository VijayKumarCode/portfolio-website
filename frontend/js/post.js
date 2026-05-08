/**
 * Individual Blog Post Renderer
 * Handles slug extraction, post lookup, and rendering
 */

import { SITE } from '../src/config/config.js';
import { formatDate, readingTime, escHtml } from '../src/utils/helpers.js';

// ─── DOM Element References ───
const els = {
  loading: document.getElementById('post-loading'),
  content: document.getElementById('post-content'),
  error: document.getElementById('post-error'),
  nav: document.getElementById('post-nav'),
  title: document.getElementById('post-title'),
  meta: document.getElementById('post-meta'),
  body: document.getElementById('post-body'),
  tags: document.getElementById('post-tags'),
  toc: document.getElementById('post-toc'),
  ogTitle: document.querySelector('meta[property="og:title"]'),
  ogDesc: document.querySelector('meta[property="og:description"]'),
  ogUrl: document.querySelector('meta[property="og:url"]'),
  twitterTitle: document.querySelector('meta[name="twitter:title"]'),
  twitterDesc: document.querySelector('meta[name="twitter:description"]'),
  canonical: document.querySelector('link[rel="canonical"]')
};

// ─── Slug Extraction ───
function getSlugFromUrl() {
  // Try pathname first (for clean URLs like /blog/hello-world)
  const path = window.location.pathname;
  const pathMatch = path.match(/\/blog\/([^/]+)/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);

  // Fallback to query param (for URLs like /post.html?slug=hello-world)
  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get('slug');
  if (slugParam) return decodeURIComponent(slugParam);

  // Fallback to hash (for hash-based routing)
  const hash = window.location.hash.replace('#', '');
  if (hash) return decodeURIComponent(hash);

  return null;
}

// ─── Post Loader ───
async function loadPost() {
  const slug = getSlugFromUrl();

  if (!slug) {
    showError('No post specified. <a href="/blog.html">Browse all posts</a>');
    return;
  }

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    // Defensive: handle both array and object with .posts
    const posts = Array.isArray(data) ? data : data.posts || [];
    const post = posts.find(p => p.slug === slug);

    if (!post) {
      showError(`Post "${escHtml(slug)}" not found. <a href="/blog.html">Browse all posts</a>`);
      return;
    }

    renderPost(post, posts);
  } catch (err) {
    console.error('[Post] Failed to load post:', err);
    showError('Failed to load post. <a href="/blog.html">Browse all posts</a>');
  }
}

// ─── Post Renderer ───
function renderPost(post, allPosts) {
  // Hide loading, show content
  if (els.loading) els.loading.style.display = 'none';
  if (els.content) els.content.style.display = '';
  if (els.error) els.error.style.display = 'none';

  // Update document title
  document.title = `${post.title} — ${SITE.name}`;

  // Update meta tags
  const description = post.excerpt || stripHtml(post.content || '').substring(0, 160);
  const canonicalUrl = `${SITE.url}/blog/${post.slug}`;

  if (els.ogTitle) els.ogTitle.content = post.title;
  if (els.ogDesc) els.ogDesc.content = description;
  if (els.ogUrl) els.ogUrl.content = canonicalUrl;
  if (els.twitterTitle) els.twitterTitle.content = post.title;
  if (els.twitterDesc) els.twitterDesc.content = description;
  if (els.canonical) els.canonical.href = canonicalUrl;

  // Render title
  if (els.title) els.title.textContent = post.title;

  // Render meta
  if (els.meta) {
    const dateStr = formatDate(post.date || post.createdAt);
    const readTime = readingTime(post.content || '');
    els.meta.innerHTML = `
      <time datetime="${post.date || post.createdAt || ''}">${dateStr}</time>
      <span aria-hidden="true">·</span>
      <span>${readTime} min read</span>
      ${post.author ? `<span aria-hidden="true">·</span><span>By ${escHtml(post.author)}</span>` : ''}
    `;
  }

  // Render body
  if (els.body) {
    els.body.innerHTML = post.content || '<p>No content available.</p>';
  }

  // Render tags
  if (els.tags && post.tags && post.tags.length > 0) {
    els.tags.innerHTML = post.tags
      .map(tag => `<span class="post-tag">${escHtml(tag)}</span>`)
      .join('');
  }

  // Build TOC from headings
  buildTOC();

  // Render prev/next navigation
  renderNav(allPosts, post);
}

// ─── Table of Contents ───
function buildTOC() {
  if (!els.toc || !els.body) return;

  const headings = els.body.querySelectorAll('h2, h3');
  if (headings.length === 0) {
    els.toc.style.display = 'none';
    return;
  }

  const tocList = document.createElement('ul');
  tocList.className = 'toc-list';

  headings.forEach((heading, index) => {
    const id = heading.id || `section-${index}`;
    heading.id = id;

    const li = document.createElement('li');
    li.className = heading.tagName === 'H3' ? 'toc-sub-item' : 'toc-item';
    li.innerHTML = `<a href="#${id}">${escHtml(heading.textContent)}</a>`;
    tocList.appendChild(li);
  });

  els.toc.innerHTML = '<h3 class="toc-title">Contents</h3>';
  els.toc.appendChild(tocList);
}

// ─── Prev/Next Navigation ───
function renderNav(allPosts, currentPost) {
  if (!els.nav || !allPosts || allPosts.length === 0) return;

  const sorted = [...allPosts].sort((a, b) => {
    return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
  });

  const idx = sorted.findIndex(p => p.id === currentPost.id || p.slug === currentPost.slug);

  const prev = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const next = idx > 0 ? sorted[idx - 1] : null;

  els.nav.innerHTML = `
    ${prev ? `
      <a href="/blog/${prev.slug}" class="post-nav-link post-nav-prev">
        <span class="post-nav-label">← Previous</span>
        <span class="post-nav-title">${escHtml(prev.title)}</span>
      </a>
    ` : '<span></span>'}
    ${next ? `
      <a href="/blog/${next.slug}" class="post-nav-link post-nav-next">
        <span class="post-nav-label">Next →</span>
        <span class="post-nav-title">${escHtml(next.title)}</span>
      </a>
    ` : '<span></span>'}
  `;
}

// ─── Error Handler ───
function showError(message) {
  if (els.loading) els.loading.style.display = 'none';
  if (els.content) els.content.style.display = 'none';
  if (els.error) {
    els.error.style.display = '';
    els.error.innerHTML = `
      <div class="post-error-icon">⚠️</div>
      <h2>Post Not Found</h2>
      <p>${message}</p>
    `;
  }
}

// ─── Simple HTML stripper for meta description ───
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// ─── Initialize ───
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPost);
} else {
  loadPost();
}
