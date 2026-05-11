/**
 * home-blog.js
 * Entry point for the Engineering Log preview on index.html.
 * Import: <script type="module" src="./js/home-blog.js"></script>
 */

import BlogManager from './blogManager.js';

document.addEventListener('DOMContentLoaded', () => {
  BlogManager.initHomePreview();
});