/**
 * blog.js
 * Entry point for the full Engineering Log listing (blog.html).
 * Import: <script type="module" src="./js/blog.js"></script>
 */

import BlogManager from './blogManager.js';

document.addEventListener('DOMContentLoaded', () => {
  BlogManager.initBlogPage();
});