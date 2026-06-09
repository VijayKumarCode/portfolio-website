/**
 * contact.js
 * Multi-step Contact Form Handler with Validation, Progress Tracking, and Secure Formspree Submission.
 * DESIGN INTEGRITY GUARANTEE: Preserves 100% of the existing visual styling, animations, 
 * layout, and responsive breakpoints while decoupling backend dependencies.
 */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🚨 BACKUP — LEGACY SPRING BOOT CONTACT IMPLEMENTATION
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * The code block below contains the original production connection baseline built for 
 * your distributed Java Framework architecture. This ensures absolute recoverability.
 *
 * import { CONTACT_ENDPOINT } from './config.js';
 *
 * async submitData(data) {
 * const timeoutMs = 15000;
 * const controller = new AbortController();
 * const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
 *
 * try {
 * const response = await fetch(CONTACT_ENDPOINT, {
 * method: 'POST',
 * headers: {
 * 'Content-Type': 'application/json',
 * 'Accept': 'application/json'
 * },
 * body: JSON.stringify(data),
 * signal: controller.signal
 * });
 *
 * clearTimeout(timeoutId);
 *
 * if (!response.ok) {
 * const errorData = await response.json().catch(() => ({}));
 * throw new Error(errorData.message || `HTTP ${response.status}`);
 * }
 *
 * return response;
 * } catch (err) {
 * clearTimeout(timeoutId);
 * throw err;
 * }
 * }
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// Inline sanitizer to prevent cross-site scripting (XSS) anomalies
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
  totalSteps: 5, // Fully synced with the 5 operational HTML wizard containers

  init() {
    this.form = document.getElementById('contact-form');
    if (!this.form) return;

    this.progressBar = document.getElementById('form-progress-bar');
    this.submitBtn = document.getElementById('cf-submit-btn');
    this.resetBtn = document.getElementById('cf-reset-btn');

    // Select step containers
    this.steps = Array.from(this.form.querySelectorAll('.form-step'));

    // Cache input elements and error layouts matching index.html structural nodes
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
      engagement: {
        input: document.getElementById('cf-engagement'),
        error: document.getElementById('cf-engagement-error')
      },
      message: {
        input: document.getElementById('cf-message'),
        error: document.getElementById('cf-message-error')
      },
      honeypot: document.getElementById('website') // Silent bot catching field
    };

    this.bindEvents();
    this.updateProgress();
  },

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    this.form.querySelectorAll('.form-step-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.dataset.next, 10);
        this.handleStepTransition(nextStep);
      });
    });

    this.form.querySelectorAll('.form-step-back').forEach(btn => {
      btn.addEventListener('click', () => {
        const prevStep = parseInt(btn.dataset.back, 10);
        this.goToStep(prevStep);
      });
    });

    this.resetBtn?.addEventListener('click', () => this.handleReset());

    // Enable intuitive enter-key navigation across input nodes
    Object.values(this.fields).forEach(fieldGroup => {
      const input = fieldGroup.input;
      if (!input) return;
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.tagName !== 'TEXTAREA' && input.tagName !== 'SELECT') {
          e.preventDefault();
          const currentStepEl = input.closest('.form-step');
          const nextBtn = currentStepEl?.querySelector('.form-step-next');
          if (nextBtn) {
            nextBtn.click();
          } else if (this.currentStep === this.totalSteps) {
            this.form.requestSubmit();
          }
        }
      });

      // Clear structural errors immediately upon user correction
      const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventType, () => {
        this.clearFieldError(fieldGroup);
      });
    });
  },

  handleStepTransition(nextStep) {
    if (nextStep > this.currentStep) {
      if (this.validateCurrentStep()) {
        this.goToStep(nextStep);
      }
    } else {
      this.goToStep(nextStep);
    }
  },

  goToStep(stepNumber) {
    this.currentStep = stepNumber;
    
    this.steps.forEach(stepEl => {
      const isCurrent = (stepNumber === 'success' && stepEl.dataset.step === 'success') || 
                        (parseInt(stepEl.dataset.step, 10) === stepNumber);
      stepEl.classList.toggle('active', isCurrent);
    });

    this.updateProgress();
    
    // Accessibility focus management
    setTimeout(() => {
      const activeStepEl = this.steps.find(s => s.classList.contains('active'));
      if (activeStepEl) {
        if (stepNumber === 'success') {
          const successHeader = activeStepEl.querySelector('.success-title');
          successHeader?.setAttribute('tabindex', '-1');
          successHeader?.focus();
        } else {
          const firstInput = activeStepEl.querySelector('input, textarea, select');
          firstInput?.focus();
        }
      }
    }, 100);
  },

  updateProgress() {
    if (!this.progressBar) return;
    if (this.currentStep === 'success') {
      this.progressBar.style.width = '100%';
      return;
    }
    const ratio = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    this.progressBar.style.width = `${ratio}%`;
  },

  validateCurrentStep() {
    let isValid = true;
    if (this.currentStep === 1) isValid = this.validateField('name');
    else if (this.currentStep === 2) isValid = this.validateField('email');
    else if (this.currentStep === 3) isValid = this.validateField('subject');
    else if (this.currentStep === 4) isValid = this.validateField('engagement');
    else if (this.currentStep === 5) isValid = this.validateField('message');
    return isValid;
  },

  validateField(fieldName) {
    const fieldGroup = this.fields[fieldName];
    if (!fieldGroup || !fieldGroup.input) return true;

    const value = fieldGroup.input.value.trim();
    
    if (!value) {
      this.showFieldError(fieldGroup, `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required.`);
      return false;
    }

    if (fieldName === 'email') {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(value)) {
        this.showFieldError(fieldGroup, 'Please provide a valid email address.');
        return false;
      }
    }

    this.clearFieldError(fieldGroup);
    return true;
  },

  showFieldError(fieldGroup, msg) {
    if (!fieldGroup || !fieldGroup.input) return;
    fieldGroup.input.classList.add('error-field');
    fieldGroup.input.setAttribute('aria-invalid', 'true');
    if (fieldGroup.error) {
      fieldGroup.error.textContent = msg;
      fieldGroup.error.classList.add('visible');
      fieldGroup.error.setAttribute('aria-hidden', 'false');
    }
  },

  clearFieldError(fieldGroup) {
    if (!fieldGroup || !fieldGroup.input) return;
    fieldGroup.input.classList.remove('error-field');
    fieldGroup.input.removeAttribute('aria-invalid');
    if (fieldGroup.error) {
      fieldGroup.error.textContent = '';
      fieldGroup.error.classList.remove('visible');
      fieldGroup.error.setAttribute('aria-hidden', 'true');
    }
  },

  async handleSubmit(e) {
    e.preventDefault();

    let formHasErrors = false;
    ['name', 'email', 'subject', 'engagement', 'message'].forEach(field => {
      if (!this.validateField(field)) formHasErrors = true;
    });

    if (formHasErrors) return;

    if (this.fields.honeypot && this.fields.honeypot.value) {
      this.showSuccessState();
      return;
    }

    this.setLoading(true);
    const targetEndpoint = this.form.getAttribute('action');

    const payload = {
      name: sanitizeInput(this.fields.name.input.value),
      email: this.fields.email.input.value.trim(),
      subject: sanitizeInput(this.fields.subject.input.value),
      engagement_type: this.fields.engagement.input.value,
      message: sanitizeInput(this.fields.message.input.value)
    };

    try {
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        this.showSuccessState();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status code: ${response.status}`);
      }
    } catch (err) {
      console.error('Formspree Delivery Failure:', err);
      if (this.fields.message) {
        this.showFieldError(this.fields.message, `Transmission Error: ${err.message || 'Check connection status.'}`);
      }
    } finally {
      this.setLoading(false);
    }
  },

  setLoading(isLoading) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = isLoading;
    this.submitBtn.classList.toggle('loading', isLoading);
    if (isLoading) {
      this.submitBtn.setAttribute('aria-label', 'Transmitting message securely...');
    } else {
      this.submitBtn.removeAttribute('aria-label');
    }
  },

  showSuccessState() {
    this.goToStep('success');
  },

  handleReset() {
    this.form.reset();
    Object.values(this.fields).forEach(fieldGroup => {
      if (fieldGroup.input) this.clearFieldError(fieldGroup);
    });
    this.goToStep(1);
  }
};

document.addEventListener('DOMContentLoaded', () => ContactForm.init());