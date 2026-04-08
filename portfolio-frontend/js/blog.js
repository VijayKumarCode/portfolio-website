/* ═══════════════════════════════════════════════════════════
   Portfolio v2.0 — blog.js (blog listing page)
   Fixes:
   - BUG: post.content.substring(0,120) cut raw HTML mid-tag,
     rendering broken/visible HTML entities in the excerpt.
     Fix: strip HTML first, then substring the plain text.
   - BUG: No empty state / error state handling
   - BUG: Load More hid itself before the last batch was confirmed
═══════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const blogList  = document.getElementById('blog-list');
  const loadBtn   = document.getElementById('load-more-btn');
  const emptyEl   = document.getElementById('empty-state');

  const LIMIT     = 10;
  let allPosts    = [];
  let shown       = 0;

  /* ── Load data ─────────────────────────────────────────── */
  try {
    const res = await fetch('data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allPosts = await res.json();

    // Sort newest first
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allPosts.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (loadBtn) loadBtn.style.display = 'none';
      return;
    }

    renderBatch();
    if (loadBtn) loadBtn.addEventListener('click', renderBatch);

  } catch (err) {
    console.error('[blog.js] Failed to load posts:', err);
    if (blogList) {
      blogList.innerHTML = '<p style="color:var(--text-3);text-align:center;padding:3rem;">Failed to load entries. Please refresh.</p>';
    }
    if (loadBtn) loadBtn.style.display = 'none';
  }

  /* ── Render next batch ─────────────────────────────────── */
  function renderBatch() {
    const batch = allPosts.slice(shown, shown + LIMIT);

    batch.forEach(post => {
      /* BUG FIX: strip HTML before excerpting */
      const plain   = stripHtml(post.content || '');
      const excerpt = plain.split(/\s+/).slice(0, 25).join(' ') + '…';

      const card    = document.createElement('article');
      card.className = 'blog-card';
      card.innerHTML = `
        <span class="category-tag">${escHtml(post.category || 'Engineering')}</span>
        <h2>${escHtml(post.title || 'Untitled')}</h2>
        <p>${escHtml(excerpt)}</p>
        <div class="meta">${escHtml(post.date || '')} · ${escHtml(post.readTime || '')}</div>
        <a href="post.html?slug=${encodeURIComponent(post.slug)}"
           class="read-more"
           aria-label="Read ${escHtml(post.title || 'entry')}">
          Read Entry →
        </a>
      `;
      blogList.appendChild(card);
    });

    shown += batch.length;

    /* Hide button only after confirming nothing left */
    if (loadBtn) {
      loadBtn.style.display = shown >= allPosts.length ? 'none' : 'block';
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function stripHtml(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    } catch {
      return html.replace(/<[^>]*>/g, '');
    }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});