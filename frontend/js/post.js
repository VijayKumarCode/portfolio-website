import { formatDate, stripHtml, escHtml } from '../src/utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
  const els = {
    title: document.getElementById('post-title'),
    category: document.getElementById('post-category'),
    date: document.getElementById('post-date'),
    content: document.getElementById('post-content'),
    breadcrumb: document.getElementById('breadcrumb-title'),
    share: document.getElementById('share-bar'),
    nav: document.getElementById('post-navigation'),
    readTime: document.getElementById('post-read-time'),
    pageTitle: document.querySelector('title')
  };

  // Extract slug (supports ?slug= or path)
  const params = new URLSearchParams(window.location.search);
  let rawSlug = params.get('slug');
  if (!rawSlug) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'blog' && parts[1]) rawSlug = parts[1];
  }
  const slug = (rawSlug || '').trim().toLowerCase();

  if (!slug) { showError('No article specified.'); return; }

  fetch('/data/posts.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      const posts = data.posts || [];
      const post = posts.find(p => (p.slug || p.id || '').trim().toLowerCase() === slug);
      if (!post) throw new Error(`No post matching "${slug}"`);
      renderPost(post, posts);
    })
    .catch(err => { console.error(err); showError(err.message); });

  function renderPost(post, allPosts) {
    document.title = `${post.title} — Vijay Kumar | Engineering Log`;
    if (els.pageTitle) els.pageTitle.textContent = document.title;

    const desc = post.excerpt || stripHtml(post.content || '').substring(0, 160);
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', post.title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', `https://vijaykumarcode.space/blog/${post.slug || post.id}`);

    if (els.breadcrumb) els.breadcrumb.textContent = post.title;
    if (els.title) els.title.textContent = post.title;
    if (els.category && post.tags?.length) els.category.textContent = `#${post.tags[0]}`;
    if (els.date) {
      els.date.textContent = formatDate(post.date);
      els.date.setAttribute('datetime', post.date);
    }
    if (els.readTime) {
      const words = (post.content || '').split(/\s+/).length;
      els.readTime.textContent = `${Math.max(1, Math.ceil(words / 200))} min read`;
    }
    if (els.content) els.content.innerHTML = post.content || '<p>No content.</p>';

    // Share bar
    if (els.share) {
      const shareUrl = `https://vijaykumarcode.space/blog/${slug}`;
      const shareTitle = encodeURIComponent(post.title);
      els.share.innerHTML = `
        <span class="share-label">Share</span>
        <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">𝕏</a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${shareTitle}" target="_blank" rel="noopener">LinkedIn</a>
      `;
    }

    // Prev / Next
    if (els.nav && allPosts.length > 1) {
      const sorted = [...allPosts].sort((a,b) => new Date(b.date) - new Date(a.date));
      const idx = sorted.findIndex(p => (p.slug || p.id || '').trim().toLowerCase() === slug);
      const prev = sorted[idx + 1];
      const next = sorted[idx - 1];
      els.nav.innerHTML = `
        <div class="post-nav-inner">
          ${prev ? `<a href="/blog/${prev.slug || prev.id}" class="post-nav-link prev">← ${escHtml(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a href="/blog/${next.slug || next.id}" class="post-nav-link next">${escHtml(next.title)} →</a>` : '<span></span>'}
        </div>
      `;
    }
  }

  function showError(msg) {
    document.title = 'Post Not Found';
    if (els.pageTitle) els.pageTitle.textContent = document.title;
    if (els.title) els.title.textContent = 'Post Not Found';
    if (els.content) els.content.innerHTML = `<div class="post-error">⚠️ ${msg}<br><a href="/blog">← All entries</a></div>`;
    if (els.breadcrumb) els.breadcrumb.textContent = 'Not found';
    if (els.share) els.share.innerHTML = '';
    if (els.nav) els.nav.innerHTML = '';
  }

  function setMeta(selector, attr, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }
});
