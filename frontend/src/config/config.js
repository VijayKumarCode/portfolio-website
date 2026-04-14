/**
 * config.js — Central configuration for the portfolio frontend.
 *
 * All API endpoints and environment-sensitive values live here.
 * Import this module wherever you need to make API calls or
 * reference the backend URL. Never hardcode URLs in other files.
 *
 * Usage:
 *   import { API } from '../src/config/config.js';
 *   const res = await fetch(API.contact, { method: 'POST', ... });
 */

'use strict';

// ── Environment detection ─────────────────────────────────────
const IS_LOCAL = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

// ── Backend base URL ──────────────────────────────────────────
// Local dev: requests go to the same origin (proxy via Live Server
//            or a local Spring Boot instance on :8080)
// Production: your Render-deployed backend
export const BACKEND_URL = IS_LOCAL
  ? 'http://localhost:8080'
  : 'https://portfolio-backend-v17c.onrender.com';

// ── API endpoint map ──────────────────────────────────────────
export const API = {
  /** Submit the contact form */
  contact:  `${BACKEND_URL}/api/v1/contact`,

  /** Health check — used by cron-job.org to keep Render warm */
  health:   `${BACKEND_URL}/api/v1/health`,
};

// ── Static data paths ─────────────────────────────────────────
export const DATA = {
  /** Blog posts JSON file (served as a static asset by Vercel) */
  posts: '/data/posts.json',
};

// ── Site metadata ─────────────────────────────────────────────
export const SITE = {
  name:       'Vijay Kumar',
  role:       'Java Backend Engineer',
  email:      'vkumar.kumar31@gmail.com',
  github:     'https://github.com/VijayKumarCode',
  linkedin:   'https://linkedin.com/in/vijaykumarcode',
  x:          'https://x.com/VijayKumarCode',
  portfolio:  'https://vijaykumarcode.space',
  nexus:      'https://nexusgame.space',
};