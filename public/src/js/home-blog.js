/**
 * home-blog.js
 * Initializes the blog preview section on the homepage.
 *
 * FIX: The previous try-catch wrapped an async call synchronously.
 * Since BlogManager.initHomePreview() returns a Promise, thrown errors
 * inside it are asynchronous rejections — a synchronous try-catch
 * cannot catch them. Changed to use .catch() on the returned Promise.
 *
 * Before:
 *   try { BlogManager.initHomePreview(); } catch(err) { ... }
 *   ↑ This never catches any real errors from the async function
 *
 * After:
 *   BlogManager.initHomePreview().catch(err => { ... })
 *   ↑ Correctly catches promise rejections
 */

import BlogManager from './blogManager.js';

document.addEventListener('DOMContentLoaded', () => {
  BlogManager.initHomePreview().catch((err) => {
    console.error('[home-blog] Failed to initialize blog preview:', err);
  });
});