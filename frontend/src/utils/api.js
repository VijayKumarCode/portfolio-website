/**
 * api.js — Fetch abstraction layer.
 *
 * Wraps native fetch with:
 *  - Consistent error handling
 *  - JSON parsing
 *  - Timeout support
 *  - Request/response logging in development
 *
 * Usage:
 *   import { post, get } from '../src/utils/api.js';
 *
 *   const result = await post(API.contact, { name, email, message });
 *   if (result.ok) { ... }
 */

'use strict';

import { BACKEND_URL } from '../config/config.js';

const IS_DEV = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Core fetch wrapper with timeout and error normalisation.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 * @returns {Promise<{ ok: boolean, status: number, data: any, error: string|null }>}
 */
async function request(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    signal: controller.signal,
  };

  if (IS_DEV) {
    console.debug(`[API] ${config.method || 'GET'} ${url}`, config.body ? JSON.parse(config.body) : '');
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timer);

    // Try JSON first, fall back to text
    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (IS_DEV) {
      console.debug(`[API] Response ${response.status}`, data);
    }

    if (!response.ok) {
      const errorMsg = (data && (data.message || data.error)) || `HTTP ${response.status}`;
      return { ok: false, status: response.status, data: null, error: errorMsg };
    }

    return { ok: true, status: response.status, data, error: null };

  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      return { ok: false, status: 0, data: null, error: 'Request timed out. Please try again.' };
    }

    if (IS_DEV) {
      console.error('[API] Network error:', err);
    }

    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Network error — please check your connection.',
    };
  }
}

/**
 * POST request with JSON body.
 * @param {string} url
 * @param {object} body
 * @returns {Promise<{ ok: boolean, status: number, data: any, error: string|null }>}
 */
export function post(url, body) {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * GET request.
 * @param {string} url
 * @returns {Promise<{ ok: boolean, status: number, data: any, error: string|null }>}
 */
export function get(url) {
  return request(url, { method: 'GET' });
}

/**
 * Ping the health endpoint to wake the Render backend.
 * Called on page load so by the time a user fills the form,
 * the server is already warm.
 */
export async function warmBackend() {
  try {
    await fetch(`${BACKEND_URL}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (IS_DEV) console.debug('[API] Backend warmed.');
  } catch {
    // Silent — warming is best-effort
  }
}