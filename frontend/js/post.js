'use strict';

import { escHtml } from '../src/utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  const slug = getSlug();
  if (!slug) { showNotFound(); return; }

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    const idx  = posts.findIndex(p => p.slug === slug);
    const post = posts[idx];
    if (!post) { showNotFound(); return; }

    document.title = `${post.title} | Engineering Log`;

    const bc = document.getElementById('breadcrumb-title');
    if (bc) bc.textContent = post.title;

    setTextContent('post-category',  post.category);
    setTextContent('post-title',     post.title);
    setTextContent('post-date',      post.date);

    const words   = (post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    setTextContent('post-read-time', `${minutes} min read`);

    const contentEl = document.getElementById('post-content');
    if (contentEl) contentEl.innerHTML = post.content || '';

    buildNavigation(posts, idx);

    /* Share bar — needs post title + canonical URL */
    buildShareBar(post.title, `https://vijaykumarcode.space/blog/${encodeURIComponent(post.slug)}`);

  } catch (err) {
    console.error('[post.js] Failed to load post:', err);
    showNotFound();
  }
});

/* ── Slug extraction ──────────────────────────────────────── */
function getSlug() {
  /* Clean URL: /blog/some-post-slug */
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'blog' && parts[1]) {
    return decodeURIComponent(parts[1]);
  }
  /* Fallback for local dev: ?slug=some-post-slug */
  return new URLSearchParams(window.location.search).get('slug') || null;
}

/* ── Share bar ────────────────────────────────────────────── */
/*
 * Share platform config.
 * Each entry: { id, label, color, buildUrl(title, url), svgPath }
 * SVG paths are trimmed to the essential viewBox shape only —
 * no external dependencies, no img requests, no CDN needed.
 */
const SHARE_PLATFORMS = [
  {
    id:    'x',
    label: 'Share on X',
    color: '#000000',
    buildUrl: (title, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&via=VijayKumarCode`,
    /* X (formerly Twitter) logo */
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>`,
  },
  {
    id:    'linkedin',
    label: 'Share on LinkedIn',
    color: '#0a66c2',
    buildUrl: (title, url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    /* LinkedIn logo */
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>`,
  },
  {
    id:    'whatsapp',
    label: 'Share on WhatsApp',
    color: '#25d366',
    buildUrl: (title, url) =>
      `https://wa.me/?text=${encodeURIComponent(title + ' — ' + url)}`,
    /* WhatsApp logo */
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>`,
  },
  {
    id:    'email',
    label: 'Share via Email',
    color: '#6b7280',
    buildUrl: (title, url) =>
      `mailto:?subject=${encodeURIComponent('Read: ' + title)}&body=${encodeURIComponent('I thought you might find this useful:\n\n' + title + '\n' + url)}`,
    /* Email envelope */
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>`,
  },
];

function buildShareBar(postTitle, postUrl) {
  const bar = document.getElementById('share-bar');
  if (!bar) return;

  const buttons = SHARE_PLATFORMS.map(p => `
    <a href="${p.buildUrl(postTitle, postUrl)}"
       class="share-btn share-btn--${p.id}"
       target="${p.id === 'email' ? '_self' : '_blank'}"
       rel="noopener noreferrer"
       aria-label="${escHtml(p.label)}"
       title="${escHtml(p.label)}">
      ${p.svg}
      <span class="share-btn-label">${escHtml(p.id === 'x' ? 'X' : p.id.charAt(0).toUpperCase() + p.id.slice(1))}</span>
    </a>
  `).join('');

  bar.innerHTML = `
    <span class="share-label">Share</span>
    ${buttons}
  `;
}

/* ── Navigation ───────────────────────────────────────────── */
function buildNavigation(posts, currentIdx) {
  const nav = document.getElementById('post-navigation');
  if (!nav) return;

  const prev = posts[currentIdx + 1];
  const next = posts[currentIdx - 1];

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

/* ── Helpers ──────────────────────────────────────────────── */
function setTextContent(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
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