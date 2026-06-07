/**
 * config.js
 * Frontend application configuration.
 *
 * FIX: Changed CONTACT_ENDPOINT from the slow Render Spring Boot backend
 * (https://portfolio-backend-v17c.onrender.com/api/v1/contact)
 * to the Vercel Edge Function at /api/contact.
 *
 * Why: The Render free tier has 30-60 second cold starts, causing the form
 * to appear to hang. The Vercel Edge function is co-located, has zero cold
 * start, and handles Resend delivery directly.
 */

export const CONTACT_ENDPOINT = '/api/contact';