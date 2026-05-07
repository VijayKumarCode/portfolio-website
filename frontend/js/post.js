/**
 * Single Post Renderer
 * Works with Vercel rewrites that deliver the slug as:
 *   ?slug=... (query string)   OR   /blog/<slug> (path)
 * Populates post.html completely, including meta tags, share bar, prev/next.
 */

import { stripHtml, formatDate, escHtml } from '../src/utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- DOM references ---------- */
  const titleEl = document.getElementById('post-title');
  const categoryEl = document.getElementById('post-category');
  const dateEl = document.getElementById('post-date');
  const contentEl = document.getElementById('post-content');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  const shareBar = document.getElementById('share-bar');
  const postNav = document.getElementById('post-navigation');
  const readTimeEl = document.getElementById('post-read-time');
  const pageTitle = document.querySelector('title');

  /* ---------- 1. Extract slug from URL ---------- */
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug');

  // Fallback: if no query param, try the path  (e.g., /blog/websocket-stomp-spring-boot)
  if (!slug) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'blog' && pathParts[1]) {
      slug = pathParts[1];
    }
  }

  if (!slug) {
    showError('No article specified.');
    return;
  }

  /* ---------- 2. Fetch posts.json ---------- */
  fetch('/data/posts.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      const posts = data.posts || [];
      const post = posts.find(p => (p.slug === slug || p.id === slug));
      if (!post) throw new Error('Post not found');
      renderPost(post, posts);
    })
    .catch(err => {
      console.error('Post render error:', err);
      showError('The article could not be loaded. Please try again or head back to the main log.');
    });

  /* ---------- 3. Render the post ---------- */
  function renderPost(post, allPosts) {
    // --- Document title & meta (update in-place) ---
    document.title = `${post.title} | Engineering Log — Vijay Kumar`;
    pageTitle.textContent = document.title;

    const desc = post.excerpt || stripHtml(post.content || '').substring(0, 160);
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', document.title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', `https://vijaykumarcode.space/blog/${slug}`);
    setMeta('meta[name="twitter:title"]', 'content', document.title);
    setMeta('meta[name="twitter:description"]', 'content', desc);

    // --- Breadcrumb ---
    breadcrumbTitle.textContent = post.title;

    // --- Post header ---
    titleEl.textContent = post.title;
    if (categoryEl) {
      const mainTag = post.tags?.[0] || post.category || '';
      categoryEl.textContent = mainTag ? `#${mainTag}` : '';
    }
    if (dateEl) {
      dateEl.textContent = formatDate(post.date);
      dateEl.setAttribute('datetime', post.date);
    }

    // --- Read time ---
    if (readTimeEl) {
      const words = (post.content || '').split(/\s+/).length;
      const minutes = Math.max(1, Math.ceil(words / 200));
      readTimeEl.textContent = `${minutes} min read`;
    }

    // --- Article body ---
    contentEl.innerHTML = post.content || '<p>No content available.</p>';

    // --- Share bar ---
    if (shareBar) {
      const shareUrl = `https://vijaykumarcode.space/blog/${slug}`;
      const shareTitle = encodeURIComponent(post.title);
      shareBar.innerHTML = `
        <span class="share-label">Share</span>
        <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}" 
           target="_blank" rel="noopener" aria-label="Share on X">𝕏</a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${shareTitle}" 
           target="_blank" rel="noopener" aria-label="Share on LinkedIn">LinkedIn</a>
        <a href="https://github.com/VijayKumarCode" target="_blank" rel="noopener" aria-label="GitHub">GitHub</a>
      `;
    }

    // --- Previous / Next navigation ---
    if (postNav && allPosts.length > 1) {
      const sorted = allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      const idx = sorted.findIndex(p => (p.slug || p.id) === slug);
      const prev = sorted[idx - 1];
      const next = sorted[idx + 1];

      postNav.innerHTML = `
        <div class="post-nav-inner">
          ${prev ? `<a href="/blog/${prev.slug || prev.id}" class="post-nav-link prev">← ${escHtml(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a href="/blog/${next.slug || next.id}" class="post-nav-link next">${escHtml(next.title)} →</a>` : '<span></span>'}
        </div>
      `;
    }
  }

  /* ---------- 4. Error fallback ---------- */
  function showError(msg) {
    if (titleEl) titleEl.textContent = 'Post Not Found';
    if (contentEl) contentEl.innerHTML = `<div class="post-error">⚠️ ${msg}<br><a href="/blog">← All entries</a></div>`;
    document.title = 'Post Not Found | Engineering Log';
    if (pageTitle) pageTitle.textContent = document.title;
    if (breadcrumbTitle) breadcrumbTitle.textContent = 'Not found';
    if (shareBar) shareBar.innerHTML = '';
    if (postNav) postNav.innerHTML = '';
  }

  function setMeta(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }
});
