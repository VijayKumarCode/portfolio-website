/**
 * blogManager.js
 * Centralized blog data manager with caching, error handling, and validation.
 * Single source of truth for all blog data operations.
 */

const BlogManager = (() => {
  // Internal cache — prevents duplicate fetch calls across pages
  let _postsCache = null;

  /**
   * Validates that a post object has all required fields.
   * @param {Object} post
   * @returns {boolean}
   */
  function _isValidPost(post) {
    return (
      post &&
      typeof post.slug === 'string' && post.slug.trim() !== '' &&
      typeof post.title === 'string' && post.title.trim() !== '' &&
      typeof post.date === 'string' &&
      typeof post.excerpt === 'string'
    );
  }

  /**
   * Fetches and caches all posts from the JSON data source.
   * Uses absolute path for Vercel deployment compatibility.
   * @returns {Promise<Array>} Array of validated post objects
   */
  async function fetchPosts() {
    // Return cached data if already fetched
    if (_postsCache !== null) {
      return _postsCache;
    }

    try {
      // CRITICAL: Use absolute path — works correctly on all Vercel routes
      const response = await fetch('/posts.json', {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: HTTP ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();

      // Validate that we received an array
      if (!Array.isArray(rawData)) {
        throw new Error('posts.json did not return an array. Check data structure.');
      }

      // Filter out any posts missing required fields
      const validPosts = rawData.filter((post, index) => {
        const valid = _isValidPost(post);
        if (!valid) {
          console.warn(`[BlogManager] Post at index ${index} is missing required fields. Skipping.`, post);
        }
        return valid;
      });

      // Sort by date descending (newest first)
      validPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Store in cache
      _postsCache = validPosts;
      return _postsCache;

    } catch (error) {
      console.error('[BlogManager] fetchPosts() failed:', error.message);
      // Return empty array — callers must handle empty state gracefully
      return [];
    }
  }

  /**
   * Retrieves a single post by its slug.
   * @param {string} slug
   * @returns {Promise<Object|null>} Post object or null if not found
   */
  async function getPostBySlug(slug) {
    if (!slug || typeof slug !== 'string') {
      console.warn('[BlogManager] getPostBySlug() called with invalid slug:', slug);
      return null;
    }

    const posts = await fetchPosts();
    return posts.find(post => post.slug === slug.trim()) || null;
  }

  /**
   * Retrieves the N most recent posts.
   * @param {number} count - Number of posts to return
   * @returns {Promise<Array>}
   */
  async function getRecentPosts(count = 3) {
    const posts = await fetchPosts();
    return posts.slice(0, Math.max(0, count));
  }

  /**
   * Formats a date string into a human-readable format.
   * @param {string} dateStr - ISO date string (YYYY-MM-DD)
   * @returns {string} Formatted date
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Generates the correct URL for a blog post.
   * Uses query parameter pattern for static HTML compatibility.
   * @param {string} slug
   * @returns {string}
   */
  function getPostURL(slug) {
    return `/post.html?slug=${encodeURIComponent(slug)}`;
  }

  // Public API
  return {
    fetchPosts,
    getPostBySlug,
    getRecentPosts,
    formatDate,
    getPostURL
  };
})();

// Expose globally for use by blog.js, home-blog.js, and post.js
window.BlogManager = BlogManager;
