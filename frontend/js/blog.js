
'use strict';

const LIMIT = 10;
let allPosts = [];
let filtered = [];
let shown    = 0;

document.addEventListener('DOMContentLoaded', async () => {
  const blogList  = document.getElementById('blog-list');
  const loadBtn   = document.getElementById('load-more-btn');
  const emptyEl   = document.getElementById('empty-state');
  const searchEl  = document.getElementById('blog-search');
  const tagsEl    = document.getElementById('filter-tags');

  try {
    const res = await fetch('/data/posts.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allPosts = await res.json();
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    buildCategoryTags(tagsEl, allPosts);

    if (allPosts.length === 0) {
      blogList.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }

    filtered = [...allPosts];
    renderBatch(blogList, loadBtn);

    // Search
    searchEl.addEventListener('input', () => {
      const q = searchEl.value.toLowerCase().trim();
      filterAndRender(q, getActiveCategory(), blogList, loadBtn, emptyEl);
    });

    // Load more
    loadBtn.addEventListener('click', () => {
      renderBatch(blogList, loadBtn);
    });

    // Category filter
    tagsEl.addEventListener('click', e => {
      const btn = e.target.closest('.filter-tag');
      if (!btn) return;
      tagsEl.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterAndRender(searchEl.value.toLowerCase().trim(), btn.dataset.category, blogList, loadBtn, emptyEl);
    });

  } catch (err) {
    console.error('[blog.js]', err);
    blogList.innerHTML = `<p style="color:var(--text-3);text-align:center;padding:3rem;">Could not load entries. Please refresh.</p>`;
  }
});

/* ── Helpers ──────────────────────────────────────────────── */
function filterAndRender(query, category, list, btn, empty) {
  filtered = allPosts.filter(p => {
    const matchCat   = !category || category === 'all' || (p.category || '').toLowerCase() === category.toLowerCase();
    const matchQuery = !query
      || p.title.toLowerCase().includes(query)
      || stripHtml(p.content).toLowerCase().includes(query)
      || (p.category || '').toLowerCase().includes(query);
    return matchCat && matchQuery;
  });

  shown = 0;
  list.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    btn.style.display   = 'none';
  } else {
    empty.style.display = 'none';
    renderBatch(list, btn);
  }
}

function renderBatch(list, btn) {
  const batch = filtered.slice(shown, shown + LIMIT);

  batch.forEach(post => {
    const plain   = stripHtml(post.content || '');
    const excerpt = plain.split(/\s+/).slice(0, 25).join(' ') + '…';

    const card = document.createElement('a');
    card.className  = 'blog-card';
    card.href       = `/blog/${encodeURIComponent(post.slug)}`;
    card.setAttribute('role', 'article');
    card.innerHTML  = `
      <span class="category-tag">${esc(post.category || 'Engineering')}</span>
      <h2 class="blog-card-title">${esc(post.title || 'Untitled')}</h2>
      <p class="blog-card-excerpt">${esc(excerpt)}</p>
      <div class="blog-card-meta">
        <time>${esc(post.date || '')}</time>
        <span class="sep">·</span>
        <span>${esc(post.readTime || '')}</span>
        <span class="blog-card-read">Read →</span>
      </div>
    `;
    list.appendChild(card);
  });

  shown += batch.length;
  btn.style.display = shown >= filtered.length ? 'none' : 'block';
}

function buildCategoryTags(container, posts) {
  const cats = [...new Set(posts.map(p => p.category).filter(Boolean))];
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className    = 'filter-tag';
    btn.dataset.category = cat;
    btn.textContent  = cat;
    container.appendChild(btn);
  });
}

function getActiveCategory() {
  const active = document.querySelector('.filter-tag.active');
  return active ? active.dataset.category : 'all';
}

function stripHtml(html) {
  try {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
  } catch {
    return html.replace(/<[^>]*>/g, '');
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}