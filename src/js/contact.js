/**
* Contact Form Module
* Handles validation, submission, and user feedback
*/
// contact.js
import { CONTACT_ENDPOINT } from '../src/config/config.js';

// Inline sanitize function
function sanitizeInput(input) {
  if (!input) return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

const ContactForm = {
  form: null,
  submitBtn: null,
  statusEl: null,
  fields: {},

  init() {
    this.form = document.getElementById('contact-form');
    if (!this.form) return;

    this.submitBtn = document.getElementById('submit-btn');
    this.statusEl = document.getElementById('form-status');
    this.fields = {
      name: document.getElementById('name'),
      email: document.getElementById('email'),
      message: document.getElementById('message')
      // REMOVED: subject — not in HTML
    };

    this.bindEvents();
  },

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    Object.entries(this.fields).forEach(([key, field]) => {
        if (!field) return;
        field.addEventListener('blur', () => this.validateField(key, field));
        field.addEventListener('input', () => this.clearFieldError(field));
      });
    },

    validateField(name, field) {
      const value = field.value.trim();
      let error = '';

      if (!value) {
        error = 'This field is required';
      } else if (name === 'email' && !this.isValidEmail(value)) {
      error = 'Please enter a valid email address';
    } else if (name === 'message' && value.length < 10) {
    error = 'Message must be at least 10 characters';
  }

  this.showFieldError(field, error);
  return !error;
},

isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
},

showFieldError(field, message) {
  const errorEl = field.parentElement?.querySelector('.field-error');
  if (errorEl) errorEl.textContent = message;
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
},

clearFieldError(field) {
  this.showFieldError(field, '');
},

async handleSubmit(e) {
  e.preventDefault();

  let isValid = true;
  Object.entries(this.fields).forEach(([key, field]) => {
      if (!this.validateField(key, field)) isValid = false;
    });

    if (!isValid) return;

    // REMOVED: subject from data
    const data = {
      name: sanitizeInput(this.fields.name.value.trim()),
      email: sanitizeInput(this.fields.email.value.trim()),
      message: sanitizeInput(this.fields.message.value.trim())
    };

    this.setLoading(true);
    this.showStatus('', '');

    try {
      const result = await this.submitWithTimeout(data, 15000);
      this.showStatus("Message sent successfully! I'll get back to you soon.", 'success');
      this.form.reset();
    } catch (err) {
    console.error('[Contact] Submission failed:', err);
    const message = err.name === 'AbortError'
    ? 'Request timed out. The server may be waking up — please try again in 30 seconds.'
    : 'Failed to send message. Please try again or email me directly.';
    this.showStatus(message, 'error');
  } finally {
  this.setLoading(false);
}
},

async submitWithTimeout(data, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
},

setLoading(isLoading) {
  if (!this.submitBtn) return;
  this.submitBtn.disabled = isLoading;
  this.submitBtn.classList.toggle('loading', isLoading);
  const spinner = this.submitBtn.querySelector('.btn-spinner');
  if (spinner) spinner.style.display = isLoading ? 'block' : 'none';
},

showStatus(message, type) {
  if (!this.statusEl) return;
  this.statusEl.textContent = message;
  this.statusEl.className = type;
  this.statusEl.style.display = message ? 'block' : 'none';
}
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ContactForm.init());
} else {
ContactForm.init();
}