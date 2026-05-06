/**
 * Contact Form Handler
 * Validates, submits to Spring Boot backend, handles all UX states
 */

import { apiFetch, ApiError } from '../src/utils/api.js';
import { CONTACT_ENDPOINT } from '../src/config/config.js';

const ContactForm = {
  form: null,
  submitBtn: null,
  btnText: null,
  btnSpinner: null,
  statusEl: null,
  fields: {},

  init() {
    this.form = document.getElementById('contact-form');
    if (!this.form) return;

    this.submitBtn = document.getElementById('submit-btn');
    this.btnText = this.submitBtn?.querySelector('.btn-text');
    this.btnSpinner = this.submitBtn?.querySelector('.btn-spinner');
    this.statusEl = document.getElementById('form-status');
    this.fields = {
      name: document.getElementById('name'),
      email: document.getElementById('email'),
      message: document.getElementById('message')
    };

    this.bindEvents();
  },

  bindEvents() {
    // Real-time validation on blur
    Object.values(this.fields).forEach(field => {
      if (!field) return;
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => this.clearFieldError(field));
    });

    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  },

  validateField(field) {
    const errorEl = document.getElementById(`${field.id}-error`);
    if (!errorEl) return true;

    const value = field.value.trim();

    // Required check
    if (field.required && !value) {
      this.showFieldError(field, errorEl, 'This field is required');
      return false;
    }

    // Minlength check
    if (field.minLength && value.length < field.minLength) {
      this.showFieldError(field, errorEl, `Minimum ${field.minLength} characters required`);
      return false;
    }

    // Maxlength check
    if (field.maxLength && value.length > field.maxLength) {
      this.showFieldError(field, errorEl, `Maximum ${field.maxLength} characters allowed`);
      return false;
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(field, errorEl, 'Please enter a valid email address');
        return false;
      }
    }

    return true;
  },

  showFieldError(field, errorEl, message) {
    field.classList.add('field-error-state');
    field.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  },

  clearFieldError(field) {
    const errorEl = document.getElementById(`${field.id}-error`);
    field.classList.remove('field-error-state');
    field.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  },

  validateForm() {
    let isValid = true;
    Object.values(this.fields).forEach(field => {
      if (field && !this.validateField(field)) {
        isValid = false;
      }
    });
    return isValid;
  },

  async handleSubmit(e) {
    e.preventDefault();

    // Clear previous status
    this.clearStatus();

    // Validate
    if (!this.validateForm()) {
      const firstError = this.form.querySelector('.field-error-state');
      firstError?.focus();
      this.showStatus('Please fix the errors above before submitting.', 'error');
      return;
    }

    // Set loading state
    this.setLoading(true);

    try {
      const payload = {
        name: this.fields.name.value.trim(),
        email: this.fields.email.value.trim(),
        message: this.fields.message.value.trim()
      };

      await apiFetch(CONTACT_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, 2); // Retry once on failure (Render cold start)

      // Success
      this.showStatus('Message sent successfully! I\'ll get back to you within 24 hours.', 'success');
      this.form.reset();
      Object.values(this.fields).forEach(f => f?.classList.remove('field-error-state'));

    } catch (error) {
      console.error('Contact form error:', error);

      if (error instanceof ApiError) {
        if (error.status === 408 || error.status === 0) {
          this.showStatus('Request timed out. The server might be waking up — please try again in a few seconds.', 'error');
        } else if (error.status >= 500) {
          this.showStatus('Server error. I\'m aware of it — please email me directly at vkumar.kumar31@gmail.com.', 'error');
        } else {
          this.showStatus(error.message || 'Something went wrong. Please try again.', 'error');
        }
      } else {
        this.showStatus('Network error. Please check your connection and try again.', 'error');
      }
    } finally {
      this.setLoading(false);
    }
  },

  setLoading(isLoading) {
    if (!this.submitBtn) return;

    if (isLoading) {
      this.submitBtn.disabled = true;
      this.submitBtn.setAttribute('aria-disabled', 'true');
      this.btnText?.setAttribute('aria-hidden', 'true');
      this.btnSpinner?.classList.add('visible');
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.removeAttribute('aria-disabled');
      this.btnText?.removeAttribute('aria-hidden');
      this.btnSpinner?.classList.remove('visible');
    }
  },

  showStatus(message, type) {
    if (!this.statusEl) return;
    this.statusEl.textContent = message;
    this.statusEl.className = `form-status form-status-${type}`;
    this.statusEl.style.display = 'block';

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        this.statusEl.style.display = 'none';
      }, 8000);
    }
  },

  clearStatus() {
    if (this.statusEl) {
      this.statusEl.textContent = '';
      this.statusEl.className = '';
      this.statusEl.style.display = 'none';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ContactForm.init());
