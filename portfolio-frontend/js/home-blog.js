/* home-blog.js — loads BlogManager for the home page */
import { BlogManager } from './blogManager.js';

document.addEventListener('DOMContentLoaded', () => {
  /* BUG FIX: removed buttonId param (no longer used on home page) */
  const blog = new BlogManager('blog-container', 'data/posts.json');
  blog.init();
});