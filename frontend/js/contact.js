/**
 * contact.js — Contact form handler with ARIA accessibility.
 */

'use strict';

import { API } from '../src/config/config.js';
import { post, warmBackend } from '../src/utils/api.js';

document.addEventListener('DOMContentLoaded', () => {

  warmBackend();

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusDiv = document.getElementById('form-status');

  if (!form) return;

  // Ensure status div is an ARIA live region
  if (statusDiv) {
    statusDiv.setAttribute('role', 'status');
    statusDiv.setAttribute('aria-live', 'polite');
    statusDiv.setAttribute('aria-atomic', 'true');
  }

  ['name', 'email', 'message'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      el.classList.remove('invalid');
      el.removeAttribute('aria-invalid');
      const err = document.getElementById(`${id}-error`);
      if (err) {
        err.textContent = '';
        err.setAttribute('aria-hidden', 'true');
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    hideStatus();

    const name = document.getElementById('name')?.value.trim() ?? '';
    const email = document.getElementById('email')?.value.trim() ?? '';
    const message = document.getElementById('message')?.value.trim() ?? '';

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

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = 'Sending…';
    }

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

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = 'Send Message';
    }
  });

  function showFieldError(errorId, inputId, message) {
    const err = document.getElementById(errorId);
    if (err) {
      err.textContent = message;
      err.setAttribute('aria-hidden', 'false');
    }
    const input = document.getElementById(inputId);
    if (input) {
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
    }
  }

  function clearErrors() {
    ['name-error', 'email-error', 'message-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = '';
        el.setAttribute('aria-hidden', 'true');
      }
    });
    document.querySelectorAll('.invalid').forEach(el => {
      el.classList.remove('invalid');
      el.removeAttribute('aria-invalid');
    });
  }

  function showStatus(message, type) {
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.setAttribute('aria-hidden', 'false');
  }

  function hideStatus() {
    if (!statusDiv) return;
    statusDiv.textContent = '';
    statusDiv.className = '';
    statusDiv.setAttribute('aria-hidden', 'true');
  }
});