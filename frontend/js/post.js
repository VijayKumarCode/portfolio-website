/**
 * Single Blog Post Renderer
 * Slug normalised (trim + lowercase) to avoid mismatches.
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

  /* ----- slug extraction ----- */
  const params = new URLSearchParams(window.location.search);
  let rawSlug = params.get('slug');
  if (!rawSlug) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'blog' && parts[1]) rawSlug = parts[1];
  }
  const slug = (rawSlug || '').trim().toLowerCase();
  console.log('🔍 Normalised slug:', slug);

  if (!slug) {
    showError('No article slug specified.');
    return;
  }

  /* ----- fetch posts.json ----- */
  fetch('/data/posts.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      const posts = data.posts || [];
      const post = posts.find(p => {
        const postSlug = (p.slug || p.id || '').trim().toLowerCase();
        return postSlug === slug;
      });
      if (!post) throw new Error(`No post matching "${slug}"`);
      renderPost(post, posts);
    })
    .catch(err => {
      console.error('Post error:', err);
      showError(err.message);
    });

  /* ----- render ----- */
  function renderPost(post, allPosts) {
    document.title = `${post.title} | Engineering Log — Vijay Kumar`;
    if (pageTitle) pageTitle.textContent = document.title;

    const desc = post.excerpt || stripHtml(post.content || '').substring(0, 160);
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', document.title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', `https://vijaykumarcode.space/blog/${slug}`);

    breadcrumbTitle.textContent = post.title;
    titleEl.textContent = post.title;

    if (categoryEl) {
      categoryEl.textContent = post.tags?.[0] ? `#${post.tags[0]}` : '';
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
      const shareUrl = `https://vijaykumarcode.space/blog/${slug}`;
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
      const idx = sorted.findIndex(p => (p.slug || p.id || '').trim().toLowerCase() === slug);
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
    if (contentEl) contentEl.innerHTML = `<p>⚠️ ${msg}</p><a href="/blog">← All entries</a>`;
    if (breadcrumbTitle) breadcrumbTitle.textContent = 'Not found';
    if (shareBar) shareBar.innerHTML = '';
    if (postNav) postNav.innerHTML = '';
  }

  function setMeta(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }
});
