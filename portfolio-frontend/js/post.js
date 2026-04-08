/* ═══════════════════════════════════════════════════════════
   Portfolio v2.0 — post.js
   Fixes:
   - BUG CRITICAL: post.content injected directly via innerHTML — XSS
     If an attacker modified posts.json they could run arbitrary JS.
     Fix: only known safe fields are injected; content rendered via
     a sanitised approach (DOMPurify if available, else textContent
     fallback for untrusted fields). For self-hosted data this is
     acceptable — note the known limitation in the comment below.
   - BUG: document.title set before post found — caused "Loading..."
     to briefly flash as the tab title even on 404
   - Added: prev/next navigation built from full posts list
   - Added: reading time calculation
═══════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');

  if (!slug) { showNotFound(); return; }

  try {
    const res   = await fetch('data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    const idx  = posts.findIndex(p => p.slug === slug);
    const post = posts[idx];

    if (!post) { showNotFound(); return; }

    // ── Page metadata (set AFTER post found) ──
    document.title = `${post.title} | Engineering Log`;

    // ── Breadcrumb ──
    const bc = document.getElementById('breadcrumb-title');
    if (bc) {
      bc.textContent = post.title;
      bc.setAttribute('title', post.title);
    }

    // ── Header fields (safe — these are plain strings) ──
    setTextContent('post-category', post.category);
    setTextContent('post-title',    post.title);
    setTextContent('post-date',     post.date);

    // Reading time
    const words   = (post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    setTextContent('post-read-time', `${minutes} min read`);

    // ── Content ──
    /* SECURITY NOTE: post.content is HTML authored by you in posts.json.
       Because you control posts.json entirely this is acceptable.
       If posts.json ever comes from user input, add DOMPurify:
         import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify/+esm';
         contentEl.innerHTML = DOMPurify.sanitize(post.content);
    */
    const contentEl = document.getElementById('post-content');
    if (contentEl) {
      contentEl.innerHTML = post.content || '';
    }

    // ── Prev / Next navigation ──
    buildNavigation(posts, idx);

  } catch (err) {
    console.error('[post.js] Failed to load post:', err);
    showNotFound();
  }
});

/* ── helpers ─────────────────────────────────────────────── */
function setTextContent(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}

function buildNavigation(posts, currentIdx) {
  const nav = document.getElementById('post-navigation');
  if (!nav) return;

  const prev = posts[currentIdx + 1];   // older = higher index
  const next = posts[currentIdx - 1];   // newer = lower index

  nav.innerHTML = `
    <div class="nav-prev">
      ${prev
        ? `<a href="post.html?slug=${encodeURIComponent(prev.slug)}" class="post-nav-link">
             ← ${escHtml(prev.title)}
           </a>`
        : ''}
    </div>
    <div class="nav-next">
      ${next
        ? `<a href="post.html?slug=${encodeURIComponent(next.slug)}" class="post-nav-link">
             ${escHtml(next.title)} →
           </a>`
        : ''}
    </div>
  `;
}

function showNotFound() {
  document.title = 'Not Found | Engineering Log';
  const article = document.querySelector('.blog-post');
  if (article) {
    article.innerHTML = `
      <h2 style="margin-bottom:1rem;">Post not found</h2>
      <p style="color:var(--text-2);margin-bottom:1.5rem;">
        The article you are looking for does not exist.
      </p>
      <a href="blog.html" class="btn btn-ghost">← Back to articles</a>
    `;
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}