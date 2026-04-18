
'use strict';

import { escHtml } from '../src/utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {

  /*
   * PRIME FIX — slug extraction.
   *
   * Priority 1: pathname   → /blog/websocket-stomp-spring-boot
   *   parts = ['', 'blog', 'websocket-stomp-spring-boot']
   *   slug  = parts[2]
   *
   * Priority 2: query string → ?slug=websocket-stomp-spring-boot
   *   Fallback for local dev: open post.html?slug=... directly
   */
  const slug = getSlug();

  if (!slug) { showNotFound(); return; }

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    const idx  = posts.findIndex(p => p.slug === slug);
    const post = posts[idx];

    if (!post) { showNotFound(); return; }

    /* Set title AFTER post is found — prevents "Loading…" flash in tab */
    document.title = `${post.title} | Engineering Log`;

    /* Breadcrumb — full title, no truncation */
    const bc = document.getElementById('breadcrumb-title');
    if (bc) bc.textContent = post.title;

    /* Plain-text fields */
    setTextContent('post-category',  post.category);
    setTextContent('post-title',     post.title);
    setTextContent('post-date',      post.date);

    /* Reading time calculated from actual content */
    const words   = (post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    setTextContent('post-read-time', `${minutes} min read`);

    /*
     * Content injection.
     * post.content is HTML authored by you in posts.json.
     * You control the data — innerHTML is acceptable here.
     * If posts.json ever comes from user input, add DOMPurify.
     */
    const contentEl = document.getElementById('post-content');
    if (contentEl) contentEl.innerHTML = post.content || '';

    /* Prev / Next */
    buildNavigation(posts, idx);

  } catch (err) {
    console.error('[post.js] Failed to load post:', err);
    showNotFound();
  }
});

/* ── Slug extraction ──────────────────────────────────────── */
function getSlug() {
  /*
   * Clean URL pattern: /blog/some-post-slug
   *   pathname = '/blog/some-post-slug'
   *   parts    = ['', 'blog', 'some-post-slug']
   */
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'blog' && parts[1]) {
    return decodeURIComponent(parts[1]);
  }

  /* Fallback: ?slug=some-post-slug (local dev / direct file access) */
  return new URLSearchParams(window.location.search).get('slug') || null;
}

/* ── Helpers ──────────────────────────────────────────────── */
function setTextContent(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}

function buildNavigation(posts, currentIdx) {
  const nav = document.getElementById('post-navigation');
  if (!nav) return;

  const prev = posts[currentIdx + 1];   /* older  = higher array index */
  const next = posts[currentIdx - 1];   /* newer  = lower  array index */

  nav.innerHTML = `
    <div class="nav-prev">
      ${prev
        ? `<a href="/blog/${encodeURIComponent(prev.slug)}" class="post-nav-link">
             ← ${escHtml(prev.title)}
           </a>`
        : ''}
    </div>
    <div class="nav-next">
      ${next
        ? `<a href="/blog/${encodeURIComponent(next.slug)}" class="post-nav-link">
             ${escHtml(next.title)} →
           </a>`
        : ''}
    </div>
  `;
}

function showNotFound() {
  document.title = 'Not Found | Engineering Log';
  const article = document.querySelector('.post-wrap');
  if (article) {
    article.innerHTML = `
      <h2 style="margin-bottom:1rem; color:var(--text);">Post not found</h2>
      <p style="color:var(--text-2); margin-bottom:1.5rem;">
        The article you are looking for does not exist.
      </p>
      <a href="/blog" class="btn btn-ghost">← Back to articles</a>
    `;
  }
}