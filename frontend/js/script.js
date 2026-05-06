/**
 * VIJAY KUMAR - PORTFOLIO
 * Production-Grade JavaScript
 * Module: Main Site Controller
 */

// ---------- NAVIGATION CONTROLLER ----------
const Navigation = {
  nav: null,
  hamburger: null,
  navLinks: null,
  allNavLinks: null,
  
  init() {
    this.nav = document.querySelector('.nav');
    this.hamburger = document.querySelector('.hamburger');
    this.navLinks = document.querySelector('.nav-links');
    this.allNavLinks = document.querySelectorAll('.nav-links a');
    
    if (!this.nav || !this.hamburger || !this.navLinks) {
      console.warn('Navigation elements not found');
      return;
    }
    
    this.bindEvents();
    this.initScrollBehavior();
  },
  
  bindEvents() {
    // Hamburger toggle
    this.hamburger.addEventListener('click', () => this.toggleMenu());
    
    // Close menu on link click (mobile)
    this.allNavLinks.forEach(link => {
      link.addEventListener('click', () => this.closeMenu());
    });
    
    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (this.navLinks.classList.contains('active') && 
          !this.navLinks.contains(e.target) && 
          !this.hamburger.contains(e.target)) {
        this.closeMenu();
      }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.navLinks.classList.contains('active')) {
        this.closeMenu();
      }
    });
  },
  
  toggleMenu() {
    this.hamburger.classList.toggle('active');
    this.navLinks.classList.toggle('active');
    document.body.style.overflow = this.navLinks.classList.contains('active') 
      ? 'hidden' 
      : '';
  },
  
  closeMenu() {
    this.hamburger.classList.remove('active');
    this.navLinks.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  initScrollBehavior() {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      // Add scrolled class for background
      if (currentScroll > 50) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }
      
      lastScroll = currentScroll;
    }, { passive: true });
  }
};

// ---------- ACTIVE NAV LINK ----------
const ActiveNavLink = {
  init() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
    
    if (!sections.length) return;
    
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
  }
};

// ---------- SCROLL ANIMATIONS ----------
const ScrollAnimations = {
  init() {
    const elements = document.querySelectorAll('.fade-in');
    
    if (!elements.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger delay
          entry.target.style.transitionDelay = `${index * 0.1}s`;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => observer.observe(el));
  }
};

// ---------- SMOOTH SCROLL ----------
const SmoothScroll = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        
        if (target) {
          e.preventDefault();
          const navHeight = document.querySelector('.nav')?.offsetHeight || 72;
          const targetPosition = target.offsetTop - navHeight - 24;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }
};

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
  ActiveNavLink.init();
  ScrollAnimations.init();
  SmoothScroll.init();
  
  console.log('%c🚀 Portfolio Initialized %c| %cVijay Kumar',
    'color: #6c63ff; font-weight: bold;',
    '',
    'color: #4ecdc4;');
});

// Export for potential module usage
export { Navigation, ActiveNavLink, ScrollAnimations, SmoothScroll };'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. GLOBAL UI ELEMENTS ---
  const header = document.getElementById('site-header');
  const hamburgerBtn = document.getElementById('hamburger-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.menu-links a');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#desktop-nav .nav-links a, .menu-links a');

  // --- 2. MOBILE NAVIGATION LOGIC ---
  let lastFocusedElement = null;

  if (hamburgerBtn && mobileMenu) {
    const toggleMenu = (isOpen) => {
      const expanding = isOpen ?? (hamburgerBtn.getAttribute('aria-expanded') !== 'true');
      hamburgerBtn.setAttribute('aria-expanded', expanding);
      mobileMenu.classList.toggle('active', expanding);
      hamburgerBtn.classList.toggle('active', expanding);

      if (expanding) {
        lastFocusedElement = document.activeElement;
        // Focus first menu item
        const firstLink = mobileMenu.querySelector('a');
        if (firstLink) firstLink.focus();
      } else if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    };

    hamburgerBtn.addEventListener('click', () => toggleMenu());

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        toggleMenu(false);
      }
    });

    // Focus trap inside mobile menu
    mobileMenu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = mobileMenu.querySelectorAll('a[href], button');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // --- 3. SCROLL REVEAL & SKILLS ANIMATION ---
  const revealElements = document.querySelectorAll('.reveal, .project-card, .about-card, .skills-group');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));

    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
      const skillsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            skillsObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      skillsObserver.observe(skillsSection);
    }
  } else {
    // Fallback: Show all elements immediately
    [...revealElements, document.getElementById('skills')].forEach(el => {
      if (el) el.classList.add('visible', 'animate');
    });
  }

  // --- 4. HEADER SHRINK ON SCROLL ---
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.borderBottomColor =
        window.scrollY > 20
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(255,255,255,0.06)';
    }, { passive: true });
  }

  // --- 5. ACTIVE NAV LINK (SCROLL SPY) ---
  const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', isActive);
          link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
      }
    });
  }, {
    rootMargin: `-${navHeight}px 0px -60% 0px`,
    threshold: 0
  });

  sections.forEach(s => navObserver.observe(s));
});
