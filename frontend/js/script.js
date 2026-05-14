/**
 * script.js
 * Core site-wide JavaScript: navigation, scroll behavior, active states.
 * Runs on all pages — every DOM operation must be null-guarded.
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // NAVIGATION — Hamburger Menu
  // ─────────────────────────────────────────────

  function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!hamburger || !navMenu) {
      return; // Not on a page with nav menu
    }

    // Toggle menu open/close
    hamburger.addEventListener('click', function () {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!isExpanded));
      hamburger.classList.toggle('hamburger--active');
      navMenu.classList.toggle('nav-menu--active');
      document.body.classList.toggle('nav-open');
    });

    // Close menu when a nav link is clicked
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('hamburger--active');
        navMenu.classList.remove('nav-menu--active');
        document.body.classList.remove('nav-open');
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('nav-menu--active')) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('hamburger--active');
        navMenu.classList.remove('nav-menu--active');
        document.body.classList.remove('nav-open');
        hamburger.focus(); // Return focus to trigger
      }
    });
  }

  // ─────────────────────────────────────────────
  // NAVIGATION — Active Link State
  // ─────────────────────────────────────────────

  function setActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    if (!navLinks.length) return;

    const currentPath = window.location.pathname;

    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href) return;

      const isActive =
        href === currentPath ||
        (currentPath === '/' && href === '/index.html') ||
        (currentPath.includes('blog.html') && href.includes('blog.html')) ||
        (currentPath.includes('post.html') && href.includes('blog.html'));

      link.classList.toggle('nav-link--active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // ─────────────────────────────────────────────
  // NAVIGATION — Scroll Shadow
  // ─────────────────────────────────────────────

  function initNavScrollBehavior() {
    const nav = document.querySelector('nav') || document.querySelector('.navbar');
    if (!nav) return;

    // Use passive listener for performance
    window.addEventListener('scroll', function () {
      nav.classList.toggle('navbar--scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // ─────────────────────────────────────────────
  // SMOOTH SCROLL — Anchor links
  // ─────────────────────────────────────────────

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href').slice(1);
        if (!targetId) return;

        const target = document.getElementById(targetId);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  // ─────────────────────────────────────────────
  // SCROLL REVEAL — Intersection Observer
  // ─────────────────────────────────────────────

  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ─────────────────────────────────────────────
  // INIT — Run after DOM is ready
  // ─────────────────────────────────────────────

  function init() {
    initHamburgerMenu();
    setActiveNavLink();
    initNavScrollBehavior();
    initSmoothScroll();
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
