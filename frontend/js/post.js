/**
 * Single Post Renderer — final production version
 * Works with Vercel rewrites: ?slug=... or /blog/<slug>
 * Logs slugs to console and shows exact error reason in the UI.
 */

import { stripHtml, formatDate, escHtml } from '../src/utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('post-title');
  const categoryEl = document.getElementById('post-category');
  const dateEl = document.getElementById('post-date');
  const contentEl = document.getElementById('post-content');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  const shareBar = document.getElementById('share-bar');
  const postNav = document.getElementById('post-navigation');
  const readTimeEl = document.getElementById('post-read-time');
  const pageTitle = document.querySelector('title');

  // ---------- 1. Extract slug ----------
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug');

  if (!slug) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'blog' && pathParts[1]) {
      slug = pathParts[1];
    }
  }

  // Clean slug
  const cleanSlug = slug ? slug.trim() : '';
  console.log('🔍 Extracted slug:', cleanSlug);

  if (!cleanSlug) {
    showError('No article slug found in URL.');
    return;
  }

  // ---------- 2. Fetch posts.json ----------
  fetch('/data/posts.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} — unable to load posts.json`);
      return res.json();
    })
    .then(data => {
      const posts = data.posts || [];
      console.log('📋 Available slugs:', posts.map(p => (p.slug || p.id || '').trim()));

      // Find matching post (trim both for safety)
      const post = posts.find(p => {
        const postSlug = (p.slug || p.id || '').trim();
        return postSlug === cleanSlug;
      });

      if (!post) {
        throw new Error(`No post found with slug "${cleanSlug}". Check the slugs above.`);
      }

      renderPost(post, posts);
    })
    .catch(err => {
      console.error('❌ Post render error:', err);
      showError(`Unable to load article: ${err.message}`);
    });

  // ---------- 3. Render ----------
  function renderPost(post, allPosts) {
    document.title = `${post.title} | Engineering Log — Vijay Kumar`;
    if (pageTitle) pageTitle.textContent = document.title;

    const desc = post.excerpt || stripHtml(post.content || '').substring(0, 160);
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', document.title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', `https://vijaykumarcode.space/blog/${cleanSlug}`);
    setMeta('meta[name="twitter:title"]', 'content', document.title);
    setMeta('meta[name="twitter:description"]', 'content', desc);

    breadcrumbTitle.textContent = post.title;
    titleEl.textContent = post.title;

    if (categoryEl) {
      const mainTag = post.tags?.[0] || post.category || '';
      categoryEl.textContent = mainTag ? `#${mainTag}` : '';
    }
    if (dateEl) {
      dateEl.textContent = formatDate(post.date);
      dateEl.setAttribute('datetime', post.date);
    }
    if (readTimeEl) {
      const words = (post.content || '').split(/\s+/).length;
      readTimeEl.textContent = `${Math.max(1, Math.ceil(words / 200))} min read`;
    }

    contentEl.innerHTML = post.content || '<p>No content available.</p>';

    if (shareBar) {
      const shareUrl = `https://vijaykumarcode.space/blog/${cleanSlug}`;
      const shareTitle = encodeURIComponent(post.title);
      shareBar.innerHTML = `
        <span class="share-label">Share</span>
        <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">𝕏</a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${shareTitle}" target="_blank" rel="noopener">LinkedIn</a>
        <a href="https://github.com/VijayKumarCode" target="_blank" rel="noopener">GitHub</a>
      `;
    }

    if (postNav && allPosts.length > 1) {
      const sorted = allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      const idx = sorted.findIndex(p => (p.slug || p.id || '').trim() === cleanSlug);
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

  function showError(msg) {
    document.title = 'Post Not Found | Engineering Log';
    if (pageTitle) pageTitle.textContent = document.title;
    if (titleEl) titleEl.textContent = 'Post Not Found';
    if (contentEl) contentEl.innerHTML = `<div class="post-error">⚠️ ${msg}<br><a href="/blog">← All entries</a></div>`;
    if (breadcrumbTitle) breadcrumbTitle.textContent = 'Not found';
    if (shareBar) shareBar.innerHTML = '';
    if (postNav) postNav.innerHTML = '';
  }

  function setMeta(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }
});
