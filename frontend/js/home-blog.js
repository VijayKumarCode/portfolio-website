/**
 * VIJAY KUMAR - PORTFOLIO
 * Home Page Blog Section Loader
 * Module: Blog Preview with Loading/Error States
 */

const HomeBlog = {
  container: null,
  maxPosts: 3,
  
  init() {
    this.container = document.getElementById('home-blog-grid');
    if (!this.container) return;
    
    this.showLoadingState();
    this.fetchPosts();
  },
  
  showLoadingState() {
    this.container.innerHTML = '';
    
    for (let i = 0; i < this.maxPosts; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'blog-card-skeleton';
      skeleton.setAttribute('aria-hidden', 'true');
      skeleton.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      `;
      this.container.appendChild(skeleton);
    }
  },
  
  showErrorState() {
    this.container.innerHTML = `
      <div class="blog-error" role="alert">
        <p>Unable to load blog posts at the moment.</p>
        <a href="/blog" class="btn btn-secondary">
          View All Posts →
        </a>
      </div>
    `;
  },
  
  async fetchPosts() {
    try {
      const response = await fetch('/blog/posts.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.posts || !Array.isArray(data.posts)) {
        throw new Error('Invalid data format');
      }
      
      const recentPosts = data.posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, this.maxPosts);
      
      if (recentPosts.length === 0) {
        this.container.innerHTML = `
          <div class="blog-error">
            <p>No blog posts yet. Check back soon!</p>
          </div>
        `;
        return;
      }
      
      this.renderPosts(recentPosts);
      
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      this.showErrorState();
    }
  },
  
  renderPosts(posts) {
    this.container.innerHTML = '';
    
    posts.forEach(post => {
      const card = document.createElement('article');
      card.className = 'blog-card fade-in';
      card.innerHTML = `
        ${post.image ? `
          <img 
            class="blog-card-image" 
            src="${post.image}" 
            alt="${post.title}"
            loading="lazy"
            width="400"
            height="200"
          >
        ` : ''}
        <div class="blog-card-content">
          <div class="blog-card-meta">
            <span>${this.formatDate(post.date)}</span>
            ${post.tags ? post.tags.slice(0, 2).map(tag => 
              `<span>#${tag}</span>`
            ).join('') : ''}
          </div>
          <h3>${post.title}</h3>
          <p>${post.excerpt || post.content?.substring(0, 150) + '...'}</p>
          <a href="/blog/${post.slug}" class="blog-card-link">
            Read more
            <span aria-hidden="true">→</span>
          </a>
        </div>
      `;
      
      this.container.appendChild(card);
    });
    
    // Trigger fade-in animations
    setTimeout(() => {
      document.querySelectorAll('.blog-card.fade-in').forEach(card => {
        card.classList.add('visible');
      });
    }, 100);
  },
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => HomeBlog.init());

export { HomeBlog };
