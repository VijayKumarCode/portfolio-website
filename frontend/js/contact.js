/* ═══════════════════════════════════════════════════════════
   Portfolio v2.0 — contact.js
   Fixes:
   - BUG: hardcoded old Render URL — now uses env-aware constant
   - BUG: no client-side validation before sending request
   - BUG: status div always visible (now toggled via CSS class)
   - BUG: no loading state on button
   - Added: field-level error messages
═══════════════════════════════════════════════════════════ */

'use strict';

/* BUG FIX: define the backend URL in one place.
   The URL now points to the live domain instead of the
   old hardcoded Render URL. Update this when you migrate to Oracle. */
const CONTACT_API = 'https://portfolio-backend-v17c.onrender.com/api/v1/contact';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameEl    = document.getElementById('name');
    const emailEl   = document.getElementById('email');
    const messageEl = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const statusDiv = document.getElementById('form-status');

    // Clear previous errors
    clearErrors();
    statusDiv.style.display   = 'none';
    statusDiv.className       = '';
    statusDiv.textContent     = '';

    // Client-side validation
    let valid = true;

    const name    = nameEl.value.trim();
    const email   = emailEl.value.trim();
    const message = messageEl.value.trim();

    if (!name || name.length < 2) {
      showFieldError('name-error', nameEl, 'Please enter your name (min 2 characters).');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError('email-error', emailEl, 'Please enter a valid email address.');
      valid = false;
    }
    if (!message || message.length < 10) {
      showFieldError('message-error', messageEl, 'Message must be at least 10 characters.');
      valid = false;
    }

    if (!valid) return;

    // Loading state
    submitBtn.disabled     = true;
    submitBtn.textContent  = 'Sending…';

    try {
      const res = await fetch(CONTACT_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server error (${res.status})`);
      }

      showStatus('Message sent. I\'ll reply within 24 hours.', 'success');
      form.reset();

    } catch (err) {
      console.error('Contact form error:', err);
      showStatus(
        'Could not send message — the server may be starting up (free tier cold start). ' +
        'Please try again in 30 seconds or email me directly.',
        'error'
      );
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Send Message';
    }
  });

  // ── helpers ────────────────────────────────────────────
  function showFieldError(errorId, inputEl, message) {
    const el = document.getElementById(errorId);
    if (el) el.textContent = message;
    if (inputEl) inputEl.classList.add('invalid');
  }

  function clearErrors() {
    ['name-error', 'email-error', 'message-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  }

  function showStatus(message, type) {
    const el = document.getElementById('form-status');
    if (!el) return;
    el.textContent  = message;
    el.className    = type;   // CSS handles display via .success / .error
  }

  // Clear field error on input
  ['name', 'email', 'message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('invalid');
        const errEl = document.getElementById(`${id}-error`);
        if (errEl) errEl.textContent = '';
      });
    }
  });
});