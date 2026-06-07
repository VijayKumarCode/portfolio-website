'use strict';

import { formatDate, escHtml, stripHtml, readingTime } from './helpers.js';

document.addEventListener('DOMContentLoaded', async () => {
    const slug = getSlugFromUrl();

    // DOM refs matching post.html IDs exactly
    const loadingEl   = document.getElementById('post-loading');
    const containerEl = document.getElementById('post-container');
    const notFoundEl  = document.getElementById('post-not-found');
    const errorEl     = document.getElementById('post-error');
    const retryBtn    = document.getElementById('post-retry');

    // Post content refs
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
      const res = await fetch('/src/data/posts.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // DEFENSIVE: handle both plain array and { posts: [...] } wrapper
      const posts = Array.isArray(data) ? data : (data.posts || []);
      const post = posts.find(p => p.slug === slug);

      if (!post) {
        showState('not-found');
        document.title = 'Not Found | Engineering Log';
        return;
      }

      // Convert raw \n to HTML paragraphs
      const htmlContent = convertNewlinesToHtml(post.content || '');

      // Render post
      if (categoryEl) categoryEl.textContent = post.category || 'Engineering';
      if (dateEl)     dateEl.textContent = formatDate(post.date);
      if (readTimeEl) readTimeEl.textContent = post.readTime || readingTime(post.content || '');
      if (titleEl)    titleEl.textContent = post.title || 'Untitled';
      if (bodyEl)     bodyEl.innerHTML = htmlContent;

      if (tagsEl && post.tags) {
        tagsEl.innerHTML = post.tags.map(t =>
          `<span class="post__tag">${escHtml(t)}</span>`
        ).join('');
      }

      // Update page title & meta
      document.title = `${escHtml(post.title)} | Engineering Log`;
      updateMetaDescription(post);

      // Show post, hide loading
      showState('post');

    } catch (err) {
    console.error('[post.js]', err);
    showState('error');
  }

  // Retry handler
  retryBtn?.addEventListener('click', () => {
      window.location.reload();
    });

    // State helper
    function showState(state) {
      loadingEl?.classList.toggle('hidden', state !== 'loading');
      containerEl?.classList.toggle('hidden', state !== 'post');
      notFoundEl?.classList.toggle('hidden', state !== 'not-found');
      errorEl?.classList.toggle('hidden', state !== 'error');
    }
  });

  function getSlugFromUrl() {
    const path = window.location.pathname;
    // Support /blog/:slug and /blog/:slug/
    const match = path.match(/\/blog\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function convertNewlinesToHtml(content) {
    // posts.json already contains rendered HTML — no conversion needed
    // Attempting to convert newlines would double-escape already-rendered HTML
    return content || '';
  }

  function updateMetaDescription(post) {
    const desc = stripHtml(post.content || '').slice(0, 160);
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    // Add Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const slug = window.location.pathname.match(/\/blog\/([^/]+)\/?$/)?.[1];
    canonical.setAttribute('href', `https://vijaykumarcode.space/blog/${slug}`);

    // Update Open Graph Tags
    updateOpenGraphTags(post);

    // Add Schema.org BlogPosting Structured Data
    addBlogPostingSchema(post);
  }

  function updateOpenGraphTags(post) {
    const excerpt = stripHtml(post.content || '').slice(0, 160);
    const slug = window.location.pathname.match(/\/blog\/([^/]+)\/?$/)?.[1];
    const postUrl = `https://vijaykumarcode.space/blog/${slug}`;

    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', post.title);

    // Update og:description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', excerpt);

    // Update og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', postUrl);

    // Update og:type
    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      document.head.appendChild(ogType);
    }
    ogType.setAttribute('content', 'article');

    // Update og:image (use a default image or generate from post)
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', 'https://vijaykumarcode.space/src/assets/icons/og-image.jpg');

    // Update article-specific OG tags
    let articleAuthor = document.querySelector('meta[property="article:author"]');
    if (!articleAuthor) {
      articleAuthor = document.createElement('meta');
      articleAuthor.setAttribute('property', 'article:author');
      document.head.appendChild(articleAuthor);
    }
    articleAuthor.setAttribute('content', 'Vijay Kumar');

    let articlePublished = document.querySelector('meta[property="article:published_time"]');
    if (!articlePublished) {
      articlePublished = document.createElement('meta');
      articlePublished.setAttribute('property', 'article:published_time');
      document.head.appendChild(articlePublished);
    }
    articlePublished.setAttribute('content', post.date);

    // Add tags as article keywords
    if (post.tags && post.tags.length > 0) {
      let articleTags = document.querySelector('meta[property="article:tag"]');
      if (!articleTags) {
        // Remove any existing article:tag meta
        document.querySelectorAll('meta[property="article:tag"]').forEach(tag => tag.remove());
        post.tags.forEach(tag => {
          const tagMeta = document.createElement('meta');
          tagMeta.setAttribute('property', 'article:tag');
          tagMeta.setAttribute('content', tag);
          document.head.appendChild(tagMeta);
        });
      }
    }
  }

  function addBlogPostingSchema(post) {
    const slug = window.location.pathname.match(/\/blog\/([^/]+)\/?$/)?.[1];
    const postUrl = `https://vijaykumarcode.space/blog/${slug}`;
    const excerpt = stripHtml(post.content || '').slice(0, 160);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': excerpt,
      'image': 'https://vijaykumarcode.space/src/assets/icons/og-image.jpg',
      'datePublished': post.date,
      'dateModified': post.date,
      'author': {
        '@type': 'Person',
        'name': 'Vijay Kumar',
        'url': 'https://vijaykumarcode.space'
      },
      'keywords': post.tags ? post.tags.join(', ') : post.category,
      'articleBody': stripHtml(post.content || ''),
      'url': postUrl,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': postUrl
      }
    };

    // Remove existing schema
    document.querySelectorAll('script[type="application/ld+json"][data-schema="BlogPosting"]').forEach(s => s.remove());

    // Add new schema
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.setAttribute('data-schema', 'BlogPosting');
    schemaScript.textContent = JSON.stringify(schema);
    document.head.appendChild(schemaScript);
  }
