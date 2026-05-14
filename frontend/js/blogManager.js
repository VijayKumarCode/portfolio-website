/**
 * blogManager.js
 * ─────────────────────────────────────────────────────────
 * Centralized blog data manager.
 * - Single source of truth for all post data
 * - In-memory cache (prevents duplicate fetches)
 * - Full error boundary (never crashes silently)
 * - Data validation (malformed posts are skipped, not fatal)
 * - Utility functions shared across all blog modules
 *
 * ARCHITECTURE: Exposed as window.BlogManager global IIFE.
 * DEPENDENCY: None. Must load BEFORE blog.js, home-blog.js, post.js.
 * FETCH PATH: Uses absolute /posts.json for Vercel compatibility.
 * ─────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // ─── Private: In-memory cache ───────────────────────────
  let _cache = null;
  let _fetchPromise = null; // Prevents duplicate in-flight fetches

  // ─── Private: Validate a single post object ─────────────
  function _isValidPost(post) {
    return (
      post !== null &&
      typeof post === 'object' &&
      typeof post.slug   === 'string' && post.slug.trim()    !== '' &&
      typeof post.title  === 'string' && post.title.trim()   !== '' &&
      typeof post.date   === 'string' && post.date.trim()    !== '' &&
      typeof post.excerpt === 'string' && post.excerpt.trim() !== ''
    );
  }

  // ─── Private: Sort posts newest first ───────────────────
  function _sortByDate(posts) {
    return posts.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: fetchPosts
  // Returns: Promise<Array> — validated, sorted post array
  // On error: returns [] (never throws — callers always get array)
  // ─────────────────────────────────────────────────────────
  async function fetchPosts() {
    // 1. Return cache if already populated
    if (_cache !== null) {
      return _cache;
    }

    // 2. If a fetch is already in-flight, reuse it (prevents race conditions)
    if (_fetchPromise !== null) {
      return _fetchPromise;
    }

    // 3. Initiate fetch
    _fetchPromise = (async function () {
      try {
        // CRITICAL: Absolute path — works on ALL Vercel routes
        // DO NOT use './posts.json' — breaks on /blog.html context
        const response = await fetch('/posts.json', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store' // Always fresh on static deployments
        });

        if (!response.ok) {
          throw new Error(
            'HTTP ' + response.status + ' ' + response.statusText +
            ' when fetching /posts.json'
          );
        }

        const raw = await response.json();

        if (!Array.isArray(raw)) {
          throw new Error(
            'posts.json returned ' + typeof raw + ' instead of Array. ' +
            'Verify the JSON structure is a top-level array.'
          );
        }

        // Validate each post — skip invalid, do not crash
        const valid = raw.filter(function (post, i) {
          const ok = _isValidPost(post);
          if (!ok) {
            console.warn('[BlogManager] Post at index ' + i + ' failed validation. Skipping.', post);
          }
          return ok;
        });

        const sorted = _sortByDate(valid);
        _cache = sorted;
        return _cache;

      } catch (err) {
        console.error('[BlogManager] fetchPosts() failed:', err.message);
        _fetchPromise = null; // Allow retry on next call
        return []; // Never throw — callers always receive an array
      }
    })();

    return _fetchPromise;
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: getPostBySlug
  // Returns: Promise<Object|null>
  // ─────────────────────────────────────────────────────────
  async function getPostBySlug(slug) {
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      console.warn('[BlogManager] getPostBySlug() called with invalid slug:', slug);
      return null;
    }

    const posts = await fetchPosts();
    const normalizedSlug = slug.trim().toLowerCase();

    return posts.find(function (post) {
      return post.slug.trim().toLowerCase() === normalizedSlug;
    }) || null;
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: getRecentPosts
  // Returns: Promise<Array> — last N posts
  // ─────────────────────────────────────────────────────────
  async function getRecentPosts(count) {
    var n = (typeof count === 'number' && count > 0) ? count : 3;
    const posts = await fetchPosts();
    return posts.slice(0, n);
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: getPostURL
  // Generates static-HTML-compatible post URL using query params.
  // Pattern: /post.html?slug=my-slug
  // This is the ONLY correct pattern for static Vercel deployments.
  // ─────────────────────────────────────────────────────────
  function getPostURL(slug) {
    if (!slug) return '/blog.html';
    return '/post.html?slug=' + encodeURIComponent(slug.trim());
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: formatDate
  // Returns: Human-readable date string
  // ─────────────────────────────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    try {
      // Append T00:00:00 to prevent timezone offset date shift
      var d = new Date(dateStr.trim() + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC: escapeHTML
  // Prevents XSS when injecting post data into innerHTML
  // ─────────────────────────────────────────────────────────
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  // ─── Expose public API on window ────────────────────────
  global.BlogManager = {
    fetchPosts:    fetchPosts,
    getPostBySlug: getPostBySlug,
    getRecentPosts: getRecentPosts,
    getPostURL:    getPostURL,
    formatDate:    formatDate,
    escapeHTML:    escapeHTML
  };

})(window);
