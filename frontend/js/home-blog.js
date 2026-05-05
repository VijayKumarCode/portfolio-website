'use strict';

import { BlogManager } from './blogManager.js';

document.addEventListener('DOMContentLoaded', () => {
  const manager = new BlogManager('blog-preview-container', '/data/posts.json');
  manager.init();
});