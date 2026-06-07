'use strict';

/**
 * post.js
 *
 * FIX: updateOpenGraphTags() had a bug in article:tag handling:
 *   if (!articleTags) { remove existing; add new }
 * This skipped the update if ANY article:tag already existed (e.g. from a
 * previous navigation or a prior call). Tags were never refreshed.
 *
 * Fixed: always remove existing article:tag metas and recreate from post.tags.
 *
 * FIX 2: Added timeout on posts.json fetch to prevent indefinite hanging
 * if the data file is unreachable.
 */

import { formatDate, escHtml, stripHtml, readingTime } from './helpers.js';

const FETCH_TIMEOUT_MS = 10000;

document.addEventListener('DOMContentLoaded', async () => {
  const slug = getSlugFromUrl();

  const loadingEl   = document.getElementById('post-loading');
  const containerEl = document.getElementById('post-container');
  const notFoundEl  = document.getElementById('post-not-found');
  const errorEl     = document.getElementById('post-error');
  const retryBtn    = document.getElementById('post-retry');

  const categoryEl  = document.getElementById('post-category');
  const dateEl      = document.getElementById('post-date');
  const readTimeEl  = document.getElementById('post-read-time');
  const titleEl     = document.getElementById('post-title');
  const tagsEl      = document.getElementById('post-tags');
  const bodyEl      = document.getElementById('post-body');

  if (!slug) {
    showState('not-found');
    return;
  }

  try {
    /* FIX 2: add timeout so the loading skeleton doesn't spin forever */
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch('/src/data/posts.json', { signal: controller.signal });
    clearTimeout(tid);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data  = await res.json();
    const posts = Array.isArray(data) ? data : (data.posts || []);
    const post  = posts.find(p => p.slug === slug);

    if (!post) {
      showState('not-found');
      document.title = 'Not Found | Engineering Log';
      return;
    }

    if (categoryEl) categoryEl.textContent = post.category || 'Engineering';
    if (dateEl)     dateEl.textContent     = formatDate(post.date);
    if (readTimeEl) readTimeEl.textContent = post.readTime || readingTime(post.content || '');
    if (titleEl)    titleEl.textContent    = post.title || 'Untitled';
    if (bodyEl)     bodyEl.innerHTML       = post.content || '';

    if (tagsEl && post.tags?.length) {
      tagsEl.innerHTML = post.tags.map(t =>
        `<span class="post__tag">${escHtml(t)}</span>`
      ).join('');
    }

    document.title = `${escHtml(post.title)} | Engineering Log`;
    updateMetaDescription(post);
    showState('post');

  } catch (err) {
    console.error('[post.js]', err);
    showState(err.name === 'AbortError' ? 'error' : 'error');
  }

  retryBtn?.addEventListener('click', () => window.location.reload());

  function showState(state) {
    loadingEl?.classList.toggle('hidden',     state !== 'loading');
    containerEl?.classList.toggle('hidden',   state !== 'post');
    notFoundEl?.classList.toggle('hidden',    state !== 'not-found');
    errorEl?.classList.toggle('hidden',       state !== 'error');
  }
});

/* ── Utilities ── */

function getSlugFromUrl() {
  const match = window.location.pathname.match(/\/blog\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function updateMetaDescription(post) {
  const desc = stripHtml(post.content || '').slice(0, 160);
  const slug = getSlugFromUrl();
  const url  = `https://vijaykumarcode.space/blog/${slug}`;

  setMeta('name',     'description', desc);
  setLink('rel',      'canonical',   url);

  updateOpenGraphTags(post, url);
  addBlogPostingSchema(post, url);
}

function setMeta(attrName, attrVal, content) {
  let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(attrName, attrVal, href) {
  let el = document.querySelector(`link[${attrName}="${attrVal}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function updateOpenGraphTags(post, postUrl) {
  const excerpt = stripHtml(post.content || '').slice(0, 160);

  setMeta('property', 'og:title',       post.title || '');
  setMeta('property', 'og:description', excerpt);
  setMeta('property', 'og:url',         postUrl);
  setMeta('property', 'og:type',        'article');
  setMeta('property', 'og:image',       'https://vijaykumarcode.space/src/assets/icons/og-image.jpg');
  setMeta('property', 'article:author', 'Vijay Kumar');
  setMeta('property', 'article:published_time', post.date || '');

  /* Twitter/X card */
  setMeta('name', 'twitter:card',        'summary_large_image');
  setMeta('name', 'twitter:title',       post.title || '');
  setMeta('name', 'twitter:description', excerpt);
  setMeta('name', 'twitter:image',       'https://vijaykumarcode.space/src/assets/icons/og-image.jpg');

  /* FIX: Always remove and recreate article:tag metas.
   * Old code checked `if (!articleTags)` which skipped updates when any
   * article:tag already existed — tags were never refreshed on navigation. */
  document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
  (post.tags || []).forEach(tag => {
    const el = document.createElement('meta');
    el.setAttribute('property', 'article:tag');
    el.setAttribute('content', tag);
    document.head.appendChild(el);
  });
}

function addBlogPostingSchema(post, postUrl) {
  const excerpt = stripHtml(post.content || '').slice(0, 160);

  const schema = {
    '@context':  'https://schema.org',
    '@type':     'BlogPosting',
    'headline':  post.title,
    'description': excerpt,
    'image':     'https://vijaykumarcode.space/src/assets/icons/og-image.jpg',
    'datePublished': post.date,
    'dateModified':  post.date,
    'author': {
      '@type': 'Person',
      'name':  'Vijay Kumar',
      'url':   'https://vijaykumarcode.space',
    },
    'keywords': (post.tags || []).join(', ') || post.category,
    'articleBody': stripHtml(post.content || ''),
    'url': postUrl,
    'mainEntityOfPage': { '@type': 'WebPage', '@id': postUrl },
  };

  document.querySelectorAll('script[data-schema="BlogPosting"]').forEach(s => s.remove());

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.schema = 'BlogPosting';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}