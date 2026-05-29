/**
 * VIJAY KUMAR — PORTFOLIO
 * Production-Grade JavaScript
 * 
 * Features:
 * - Accessible mobile nav with focus trap & backdrop
 * - Scroll spy active nav link
 * - IntersectionObserver scroll reveal
 * - Skills bar animation
 * - Header shrink on scroll
 * - Smooth scroll for all anchor links
 * - Back-to-top button
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM ELEMENTS ---
  const header = document.getElementById('site-header');
  const hamburgerBtn = document.getElementById('hamburger-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.menu-links a');
  const mobileBackdrop = document.getElementById('menu-backdrop');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#desktop-nav .nav-links a, .menu-links a');
  const backToTopBtn = document.getElementById('back-to-top');
  const revealElements = document.querySelectorAll('.reveal, .project-card, .about-card, .skills-group, .fade-in');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- MOBILE NAVIGATION (with backdrop & focus trap) ---
  let lastFocusedElement = null;

  function openMenu() {
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.classList.add('active');
    mobileMenu.classList.add('open'); // using .open class for mobile menu visibility
    if (mobileBackdrop) mobileBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    lastFocusedElement = document.activeElement;
    const firstLink = mobileMenu.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.classList.remove('active');
    mobileMenu.classList.remove('open');
    if (mobileBackdrop) mobileBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = hamburgerBtn.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on backdrop click
    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', closeMenu);
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
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

  // --- SCROLL REVEAL & SKILLS ANIMATION ---
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

    // Skills section special animation
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
    // Reduced motion fallback: show all immediately
    [...revealElements, document.getElementById('skills')].forEach(el => {
      if (el) el.classList.add('visible', 'animate');
    });
  }

  // --- HEADER & BACK-TO-TOP SCROLL EVENT LISTENER ---
  if (header || backToTopBtn) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (header) {
        header.classList.toggle('scrolled', scrollY > 20);
      }
      if (backToTopBtn) {
        backToTopBtn.classList.toggle('visible', scrollY > 500);
      }
    }, { passive: true });
  }

  // --- ACTIVE NAV LINK (SCROLL SPY) ---
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

  // --- SMOOTH SCROLL FOR ALL ANCHOR LINKS ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      try {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const headerH = header ? header.offsetHeight : 72;
          const targetPos = target.offsetTop - headerH - 12;
          window.scrollTo({ top: targetPos, behavior: 'smooth' });
        }
      } catch (err) {
        // Safe fallback for non-selector hash routes (e.g. #/about)
      }
    });
  });

  // --- BACK-TO-TOP BUTTON CLICK ---
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- INIT LOG ---
  console.log(
    '%c🚀 Portfolio Ready %c| %cVijay Kumar',
    'color: #8b5cf6; font-weight: bold;',
    '',
    'color: #0d9488;'
  );
});
