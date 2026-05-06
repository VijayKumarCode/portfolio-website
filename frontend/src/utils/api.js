/**
 * Fetch Abstraction Layer
 * Handles timeouts, retries, and error parsing
 */

import { API_TIMEOUT } from '../config/config.js';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch(url, options = {}, retries = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      'Accept': 'application/json',
      ...options.headers
    }
  };

  // Add Content-Type for non-GET requests
  if (fetchOptions.method && fetchOptions.method !== 'GET') {
    fetchOptions.headers['Content-Type'] = 'application/json';
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Don't retry if it's the last attempt
      if (attempt === retries) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timed out. Please try again.', 408, {});
        }
        throw error instanceof ApiError
          ? error
          : new ApiError(error.message || 'Network error', 0, {});
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

export { ApiError };
