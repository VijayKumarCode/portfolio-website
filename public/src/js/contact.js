/**
 * contact.js
 * Multi-step Contact Form Handler with Validation, Progress Tracking, and Secure Submission.
 */

import { CONTACT_ENDPOINT } from './config.js';

// Inline sanitizer to prevent basic XSS
function sanitizeInput(input) {
  if (!input) return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

const ContactForm = {
  form: null,
  progressBar: null,
  submitBtn: null,
  resetBtn: null,
  steps: [],
  fields: {},
  currentStep: 1,
  totalSteps: 5, // Updated to match your 5 HTML form steps

  init() {
    this.form = document.getElementById('contact-form');
    if (!this.form) return;

    this.progressBar = document.getElementById('form-progress-bar');
    this.submitBtn = document.getElementById('cf-submit-btn');
    this.resetBtn = document.getElementById('cf-reset-btn');

    // Select steps
    this.steps = Array.from(this.form.querySelectorAll('.form-step'));

    // Cache input fields and their error message spans
    this.fields = {
      name: {
        input: document.getElementById('cf-name'),
        error: document.getElementById('cf-name-error')
      },
      email: {
        input: document.getElementById('cf-email'),
        error: document.getElementById('cf-email-error')
      },
      subject: {
        input: document.getElementById('cf-subject'),
        error: document.getElementById('cf-subject-error')
      },
      engagement: { // Track engagement type selections
        input: document.getElementById('cf-engagement'),
        error: document.getElementById('cf-engagement-error')
      },
      message: {
        input: document.getElementById('cf-message'),
        error: document.getElementById('cf-message-error')
      },
      honeypot: document.getElementById('website') // Honeypot spam filter
    };

    this.bindEvents();
    this.updateProgress();
  },

  bindEvents() {
    // Prevent default form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Next buttons transition
    this.form.querySelectorAll('.form-step-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.dataset.next, 10);
        this.handleStepTransition(nextStep);
      });
    });

    // Back buttons transition
    this.form.querySelectorAll('.form-step-back').forEach(btn => {
      btn.addEventListener('click', () => {
        const prevStep = parseInt(btn.dataset.back, 10);
        this.goToStep(prevStep);
      });
    });

    // Reset button transition
    this.resetBtn?.addEventListener('click', () => this.handleReset());

    // Enter key handling on input fields to progress naturally
    Object.values(this.fields).forEach(fieldGroup => {
      const input = fieldGroup.input;
      if (!input) return;

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const activeStepEl = input.closest('.form-step');
          const nextBtn = activeStepEl?.querySelector('.form-step-next');
          if (nextBtn) {
            nextBtn.click();
          } else if (this.currentStep === this.totalSteps) {
            this.form.dispatchEvent(new Event('submit'));
          }
        }
      });

      // Clear errors on change/input
      const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventType, () => {
        this.clearFieldError(fieldGroup);
      });
    });
  },

  handleStepTransition(targetStep) {
    if (this.validateCurrentStep()) {
      this.goToStep(targetStep);
    }
  },

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;

    this.currentStep = step;

    // Toggle active step elements
    this.steps.forEach(stepEl => {
      const stepNum = parseInt(stepEl.dataset.step, 10);
      const isActive = stepNum === step;
      stepEl.classList.toggle('active', isActive);
      if (isActive) {
        // Accessibility: Focus first input element in the active step
        const input = stepEl.querySelector('input, textarea, select');
        input?.focus();
      }
    });

    this.updateProgress();
  },

  updateProgress() {
    if (this.progressBar) {
      const percentage = (this.currentStep / this.totalSteps) * 100;
      this.progressBar.style.width = `${percentage}%`;
    }
  },

  validateCurrentStep() {
    let isValid = true;

    if (this.currentStep === 1) {
      isValid = this.validateField('name');
    } else if (this.currentStep === 2) {
      isValid = this.validateField('email');
    } else if (this.currentStep === 3) {
      isValid = this.validateField('subject');
    } else if (this.currentStep === 4) {
      isValid = this.validateField('engagement');
    } else if (this.currentStep === 5) {
      isValid = this.validateField('message');
    }

    return isValid;
  },

  validateField(fieldName) {
    const fieldGroup = this.fields[fieldName];
    if (!fieldGroup || !fieldGroup.input) return true;

    const value = fieldGroup.input.value.trim();
    let error = '';

    if (!value) {
      error = 'This field is required';
    } else {
      switch (fieldName) {
        case 'name':
          if (value.length < 2) error = 'Name must be at least 2 characters';
          if (value.length > 100) error = 'Name cannot exceed 100 characters';
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = 'Please enter a valid email address';
          }
          break;
        case 'subject':
          if (value.length < 5) error = 'Subject must be at least 5 characters';
          if (value.length > 200) error = 'Subject cannot exceed 200 characters';
          break;
        case 'message':
          if (value.length < 20) error = 'Message must be at least 20 characters';
          if (value.length > 5000) error = 'Message cannot exceed 5000 characters';
          break;
      }
    }

    if (error) {
      this.showFieldError(fieldGroup, error);
      return false;
    }

    this.clearFieldError(fieldGroup);
    return true;
  },

  showFieldError(fieldGroup, message) {
    if (fieldGroup.error) {
      fieldGroup.error.textContent = message;
    }
    fieldGroup.input.setAttribute('aria-invalid', 'true');
    fieldGroup.input.classList.add('input-error');
  },

  clearFieldError(fieldGroup) {
    if (fieldGroup.error) {
      fieldGroup.error.textContent = '';
    }
    fieldGroup.input.setAttribute('aria-invalid', 'false');
    fieldGroup.input.classList.remove('input-error');
  },

  async handleSubmit(e) {
    e.preventDefault();

    // Check honeypot first
    if (this.fields.honeypot?.value) {
      console.warn('[Contact] Honeypot triggered. Silent rejection.');
      this.showSuccessState();
      return;
    }

    // Validate all fields before submission
    let isValid = true;
    Object.keys(this.fields).forEach(key => {
      if (key !== 'honeypot') {
        if (!this.validateField(key)) isValid = false;
      }
    });

    if (!isValid) {
      // Route flow back to first found broken node
      if (!this.validateField('name')) this.goToStep(1);
      else if (!this.validateField('email')) this.goToStep(2);
      else if (!this.validateField('subject')) this.goToStep(3);
      else if (!this.validateField('engagement')) this.goToStep(4);
      else if (!this.validateField('message')) this.goToStep(5);
      return;
    }

    const data = {
      name: sanitizeInput(this.fields.name.input.value.trim()),
      email: sanitizeInput(this.fields.email.input.value.trim()),
      subject: sanitizeInput(this.fields.subject.input.value.trim()),
      engagement_type: sanitizeInput(this.fields.engagement.input.value.trim()),
      message: sanitizeInput(this.fields.message.input.value.trim())
    };

    this.setLoading(true);

    try {
      await this.submitWithTimeout(data, 15000);
      this.showSuccessState();
    } catch (err) {
      console.error('[Contact] Submission failed:', err);
      const message = err.name === 'AbortError'
        ? 'Request timed out. The server may be waking up — please try again in 30 seconds.'
        : 'Failed to send message. Please try again or email me directly.';
      
      this.showFieldError(this.fields.message, message);
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

      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  setLoading(isLoading) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = isLoading;
    this.submitBtn.classList.toggle('loading', isLoading);
  },

  showSuccessState() {
    this.currentStep = 'success';
    this.steps.forEach(stepEl => {
      stepEl.classList.toggle('active', stepEl.dataset.step === 'success');
    });
    if (this.progressBar) {
      this.progressBar.style.width = '100%';
    }
  },

  handleReset() {
    this.form.reset();
    Object.values(this.fields).forEach(fieldGroup => {
      if (fieldGroup.input) {
        this.clearFieldError(fieldGroup);
      }
    });
    this.goToStep(1);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ContactForm.init());
} else {
  ContactForm.init();
}