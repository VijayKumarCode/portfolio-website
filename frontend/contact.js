/**
 * contact.js — Contact form handler.
 *
 * Uses the config and api utility modules.
 * Validates input, calls the backend, shows feedback.
 */

'use strict';

import { API } from '../config/config.js';
import { post, warmBackend } from '../utils/api.js';

document.addEventListener('DOMContentLoaded', () => {

  // Warm the Render backend on page load so by the time
  // the user fills and submits the form, it's already awake
  warmBackend();

  const form      = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusDiv = document.getElementById('form-status');

  if (!form) return;

  // Clear field error on input
  ['name', 'email', 'message'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      el.classList.remove('invalid');
      const err = document.getElementById(`${id}-error`);
      if (err) err.textContent = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    hideStatus();

    const name    = document.getElementById('name')?.value.trim()    ?? '';
    const email   = document.getElementById('email')?.value.trim()   ?? '';
    const message = document.getElementById('message')?.value.trim() ?? '';

    // Client-side validation
    let valid = true;
    if (!name || name.length < 2) {
      showFieldError('name-error', 'name', 'Please enter your name (min 2 characters).');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError('email-error', 'email', 'Please enter a valid email address.');
      valid = false;
    }
    if (!message || message.length < 10) {
      showFieldError('message-error', 'message', 'Message must be at least 10 characters.');
      valid = false;
    }
    if (!valid) return;

    // Loading state
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    const result = await post(API.contact, { name, email, message });

    if (result.ok) {
      showStatus('Message sent. I\'ll reply within 24 hours.', 'success');
      form.reset();
    } else {
      showStatus(
        result.error || 'Could not send message. Please try again or email me directly.',
        'error'
      );
    }

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
  });

  // ── Helpers ──────────────────────────────────────────────
  function showFieldError(errorId, inputId, message) {
    const err = document.getElementById(errorId);
    if (err) err.textContent = message;
    const input = document.getElementById(inputId);
    if (input) input.classList.add('invalid');
  }

  function clearErrors() {
    ['name-error', 'email-error', 'message-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  }

  function showStatus(message, type) {
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.className   = type;
  }

  function hideStatus() {
    if (!statusDiv) return;
    statusDiv.textContent = '';
    statusDiv.className   = '';
  }
});