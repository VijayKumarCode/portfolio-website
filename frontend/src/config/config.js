/**
 * Portfolio Configuration
 * Environment-aware API endpoint + timeout settings
 */

const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal
  ? 'http://localhost:8080/api'
  : 'https://portfolio-backend-v17c.onrender.com/api';

export const API_TIMEOUT = 15000; // 15s — Render cold starts can be slow

export const CONTACT_ENDPOINT = `${API_BASE_URL}/contact`;

export const BLOG_ENDPOINT = isLocal
  ? '/data/posts.json'  // Static JSON for local dev
  : `${API_BASE_URL}/posts`; // Backend API in production

export const BLOG_FALLBACK = '/data/posts.json'; // Fallback to static JSON

export const REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
