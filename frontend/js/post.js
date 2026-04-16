/* ═══════════════════════════════════════════════════════════
   Portfolio v2.1 — post.js

   BUG FIXED (was a hard SyntaxError — page would never load):
   ──────────────────────────────────────────────────────────
   SYMPTOM : Every blog post page showed a blank screen.
             DevTools console: "SyntaxError: Identifier
             'escHtml' has already been declared"

   ROOT CAUSE:
     Line 4 imported `escHtml` from helpers.js.
     Line ~60 declared `function escHtml(str) { ... }`.
     In ES modules, re-declaring an imported binding at module
     scope is a hard parse-time SyntaxError. The browser never
     executes a single line of this file.

   FIX:
     1. Removed the local `function escHtml()` declaration.
        The import from helpers.js is the single definition.
     2. Removed unused import `DATA` (config.js) — the fetch
        already uses the correct hardcoded path `/data/posts.json`.
     3. Removed unused import `readingTime` (helpers.js) —
        reading time is calculated inline below.
═══════════════════════════════════════════════════════════ */

'use strict';

/* FIX: import only what is actually used in this module */
import { escHtml } from '../src/utils/helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');

  if (!slug) { showNotFound(); return; }

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    const idx  = posts.findIndex(p => p.slug === slug);
    const post = posts[idx];

    if (!post) { showNotFound(); return; }

    /* Set title AFTER post is found — prevents "Loading…" flashing in tab */
    document.title = `${post.title} | Engineering Log`;

    /* Breadcrumb */
    const bc = document.getElementById('breadcrumb-title');
    if (bc) {
      bc.textContent = post.title;
      bc.setAttribute('title', post.title);
    }

    /* Safe plain-text fields */
    setTextContent('post-category', post.category);
    setTextContent('post-title',    post.title);
    setTextContent('post-date',     post.date);

    /* Reading time — derived from content, not trusting posts.json value */
    const words   = (post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    setTextContent('post-read-time', `${minutes} min read`);

    /*
     * Content injection.
     * SECURITY NOTE: post.content is HTML you authored in posts.json.
     * This is acceptable because you control the data source entirely.
     * If posts.json ever comes from user input, sanitise first:
     *   import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify/+esm';
     *   contentEl.innerHTML = DOMPurify.sanitize(post.content);
     */
    const contentEl = document.getElementById('post-content');
    if (contentEl) contentEl.innerHTML = post.content || '';

    /* Prev / Next navigation */
    buildNavigation(posts, idx);

  } catch (err) {
    console.error('[post.js] Failed to load post:', err);
    showNotFound();
  }
});

/* ── Helpers ──────────────────────────────────────────────── */
function setTextContent(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}

function buildNavigation(posts, currentIdx) {
  const nav = document.getElementById('post-navigation');
  if (!nav) return;

  const prev = posts[currentIdx + 1];   // older entry = higher array index
  const next = posts[currentIdx - 1];   // newer entry = lower array index

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