/**
 * Individual Blog Post Renderer
 * Matches post.html DOM structure exactly.
 */
import { formatDate, readingTime, escHtml } from '../src/utils/helpers.js';

// ─── DOM Elements (matching post.html IDs) ───
const els = {
  loading: document.getElementById('post-loading'),
  content: document.getElementById('post-content'),
  error: document.getElementById('post-error'),
  title: document.getElementById('post-title'),
  category: document.getElementById('post-category'),
  date: document.getElementById('post-date'),
  body: document.getElementById('post-content'),
  breadcrumb: document.getElementById('breadcrumb-title'),
  share: document.getElementById('share-bar'),
  nav: document.getElementById('post-navigation'),
  readTime: document.getElementById('post-read-time'),
  ogTitle: document.querySelector('meta[property="og:title"]'),
  ogDesc: document.querySelector('meta[property="og:description"]'),
  ogUrl: document.querySelector('meta[property="og:url"]'),
  twitterTitle: document.querySelector('meta[name="twitter:title"]'),
  twitterDesc: document.querySelector('meta[name="twitter:description"]'),
  canonical: document.querySelector('link[rel="canonical"]'),
  pageTitle: document.querySelector('title')
};

// ─── Slug Extraction ───
function getSlugFromUrl() {
  // Try pathname first (clean URLs: /blog/hello-world)
  const path = window.location.pathname;
  const pathMatch = path.match(/\/blog\/([^/]+)/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);

  // Fallback to query param (/post.html?slug=hello-world)
  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get('slug');
  if (slugParam) return decodeURIComponent(slugParam);

  return null;
}

// ─── Post Loader ───
async function loadPost() {
  const rawSlug = getSlugFromUrl();
  const slug = (rawSlug || '').trim().toLowerCase();

  if (!slug) {
    showError('No post specified. <a href="/blog">Browse all posts</a>');
    return;
  }

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const posts = Array.isArray(data) ? data : data.posts || [];
    const post = posts.find(p =>
      (p.slug || '').trim().toLowerCase() === slug
    );

    if (!post) {
      showError(`Post "${escHtml(rawSlug)}" not found. <a href="/blog">Browse all posts</a>`);
      return;
    }

    renderPost(post, posts);
  } catch (err) {
    console.error('[Post] Failed to load:', err);
    showError('Failed to load post. <a href="/blog">Browse all posts</a>');
  }
}

// ─── Post Renderer ───
function renderPost(post, allPosts) {
  // Show content, hide loading/error
  if (els.loading) els.loading.style.display = 'none';
  if (els.content) els.content.style.display = '';
  if (els.error) els.error.style.display = 'none';

  // Document title
  document.title = `${post.title} — Vijay Kumar | Engineering Log`;
  if (els.pageTitle) els.pageTitle.textContent = document.title;

  // Meta tags
  const desc = post.excerpt || stripHtml(post.content || '').substring(0, 160);
  const canonicalUrl = `https://vijaykumarcode.space/blog/${post.slug}`;
  if (els.ogTitle) els.ogTitle.setAttribute('content', post.title);
  if (els.ogDesc) els.ogDesc.setAttribute('content', desc);
  if (els.ogUrl) els.ogUrl.setAttribute('content', canonicalUrl);
  if (els.twitterTitle) els.twitterTitle.setAttribute('content', post.title);
  if (els.twitterDesc) els.twitterDesc.setAttribute('content', desc);
  if (els.canonical) els.canonical.setAttribute('href', canonicalUrl);

  // Breadcrumb
  if (els.breadcrumb) els.breadcrumb.textContent = post.title;

  // Post title
  if (els.title) els.title.textContent = post.title;

  // Category tag
  if (els.category && post.tags && post.tags.length > 0) {
    els.category.textContent = `#${post.tags[0]}`;
  }

  // Date
  if (els.date) {
    els.date.textContent = formatDate(post.date || post.createdAt);
    els.date.setAttribute('datetime', post.date || post.createdAt || '');
  }

  // Read time
  if (els.readTime) {
    const mins = readingTime(post.content || '');
    els.readTime.textContent = `${mins} min read`;
  }

  // Post body
  if (els.body) {
    els.body.innerHTML = post.content || '<p>No content available.</p>';
  }

  // Share bar
  if (els.share) {
    const shareUrl = `https://vijaykumarcode.space/blog/${post.slug}`;
    const shareTitle = encodeURIComponent(post.title);
    els.share.innerHTML = `
      <span class="share-label">Share</span>
      <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}"
         target="_blank" rel="noopener" aria-label="Share on X">𝕏</a>
      <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${shareTitle}"
         target="_blank" rel="noopener" aria-label="Share on LinkedIn">LinkedIn</a>
    `;
  }

  // Previous/Next navigation
  if (els.nav && allPosts.length > 1) {
    const sorted = [...allPosts].sort((a, b) =>
      new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
    );
    const idx = sorted.findIndex(p => p.id === post.id || p.slug === post.slug);
    const prev = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
    const next = idx > 0 ? sorted[idx - 1] : null;

    els.nav.innerHTML = `
      <div class="post-nav-inner">
        ${prev ? `<a href="/blog/${prev.slug || prev.id}" class="post-nav-link prev">← ${escHtml(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a href="/blog/${next.slug || next.id}" class="post-nav-link next">${escHtml(next.title)} →</a>` : '<span></span>'}
      </div>
    `;
  }
}

// ─── Error Handler ───
function showError(message) {
  if (els.loading) els.loading.style.display = 'none';
  if (els.content) els.content.style.display = 'none';
  if (els.error) {
    els.error.style.display = '';
    els.error.innerHTML = `
      <div class="post-error">
        <p aria-hidden="true">⚠️</p>
        <h2>Post Not Found</h2>
        <p>${message}</p>
      </div>
    `;
  }
}

// ─── HTML Stripper (inline fallback) ───
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
