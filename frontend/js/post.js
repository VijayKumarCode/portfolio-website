'use strict';

import { SITE } from '../src/config/config.js';
import { formatDate, readingTime, escHtml } from '../src/utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  const slug = getSlugFromUrl();
  const postWrap = document.querySelector('.post-wrap');
  const postNav = document.querySelector('.post-navigation');

  if (!slug || !postWrap) {
    showError(postWrap, 'Post not found.');
    return;
  }

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();
    const post = posts.find(p => p.slug === slug);

    if (!post) {
      showError(postWrap, 'Post not found.');
      document.title = 'Not Found | Engineering Log';
      return;
    }

    renderPost(postWrap, post);
    renderNav(postNav, posts, post);
    updateMeta(post);
    updateShareButtons(post);

  } catch (err) {
    console.error('[post.js]', err);
    showError(postWrap, 'Could not load post. Please refresh.');
  }
});

function getSlugFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/\/blog\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function renderPost(container, post) {
  const titleEl = container.querySelector('.post-title');
  const contentEl = container.querySelector('.post-content');
  const metaEl = container.querySelector('.post-meta');
  const categoryEl = container.querySelector('.category-tag');

  if (categoryEl) categoryEl.textContent = post.category || 'Engineering';
  if (titleEl) titleEl.textContent = post.title || 'Untitled';
  if (metaEl) {
    metaEl.innerHTML = `
      <span class="post-meta-author">
        <img src="/assets/profile-pic.jpg" alt="" class="post-avatar" loading="lazy">
        <span>${escHtml(SITE.name)}</span>
      </span>
      <span class="post-meta-sep">·</span>
      <time datetime="${escHtml(post.date)}">${formatDate(post.date)}</time>
      <span class="post-meta-sep">·</span>
      <span>${escHtml(post.readTime || readingTime(post.content))}</span>
    `;
  }
  if (contentEl) contentEl.innerHTML = post.content || '';
}

function renderNav(container, posts, currentPost) {
  if (!container) return;
  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const idx = sorted.findIndex(p => p.id === currentPost.id);

  const prev = sorted[idx + 1];
  const next = sorted[idx - 1];

  container.innerHTML = `
    ${prev ? `
      <div class="nav-prev">
        <a href="/blog/${encodeURIComponent(prev.slug)}" class="post-nav-link">
          ← ${escHtml(prev.title)}
        </a>
      </div>
    ` : '<div class="nav-prev"></div>'}
    ${next ? `
      <div class="nav-next">
        <a href="/blog/${encodeURIComponent(next.slug)}" class="post-nav-link">
          ${escHtml(next.title)} →
        </a>
      </div>
    ` : '<div class="nav-next"></div>'}
  `;
}

function updateMeta(post) {
  document.title = `${escHtml(post.title)} | Engineering Log`;
  const desc = stripHtml(post.content).slice(0, 160);
  updateMetaTag('description', desc);
  updateMetaTag('og:title', post.title);
  updateMetaTag('og:description', desc);
  updateMetaTag('og:url', `${SITE.portfolio}/blog/${post.slug}`);
  updateMetaTag('twitter:title', post.title);
  updateMetaTag('twitter:description', desc);
}

function updateMetaTag(property, content) {
  let el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(property.startsWith('og:') ? 'property' : 'name', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function updateShareButtons(post) {
  const url = encodeURIComponent(`${SITE.portfolio}/blog/${post.slug}`);
  const text = encodeURIComponent(post.title);

  document.querySelectorAll('.share-btn--x').forEach(btn => {
    btn.href = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
  });
  document.querySelectorAll('.share-btn--linkedin').forEach(btn => {
    btn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  });
  document.querySelectorAll('.share-btn--whatsapp').forEach(btn => {
    btn.href = `https://wa.me/?text=${text}%20${url}`;
  });
  document.querySelectorAll('.share-btn--email').forEach(btn => {
    btn.href = `mailto:?subject=${text}&body=${url}`;
  });
}

function showError(container, message) {
  if (!container) return;
  container.innerHTML = `<p class="blog-empty">${escHtml(message)}</p>`;
}

function stripHtml(html) {
  if (!html) return '';
  try {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
  } catch {
    return html.replace(/<[^>]*>/g, '');
  }
}