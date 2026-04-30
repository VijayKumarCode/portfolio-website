import { BlogManager } from './blogManager.js';
document.addEventListener('DOMContentLoaded', () => {
  const blog = new BlogManager('blog-container', 'data/posts.json');
  blog.init().then(() => {
    const skeleton = document.getElementById('blog-container-skeleton');
    const container = document.getElementById('blog-container');
    if (skeleton) skeleton.style.display = 'none';
    if (container) container.style.display = 'grid';
  });
});
