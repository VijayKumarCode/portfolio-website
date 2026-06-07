/**
* home-blog.js
* Initializes the blog preview section on the homepage.
* Loads a limited preview of recent blog posts.
*/

import BlogManager from './src/js/blogManager.js';

// Initialize the blog preview on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
      BlogManager.initHomePreview();
    } catch (err) {
    console.error('[home-blog] Failed to initialize blog preview:', err);
  }
});
