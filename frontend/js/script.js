/**
 * script.js
 * ─────────────────────────────────────────────────────────
 * Site-wide JavaScript: navigation, scroll, active states.
 *
 * CRITICAL: Every DOM operation is null-guarded.
 * This file runs on index.html, blog.html, AND post.html.
 * Not all pages have all elements — must never crash.
 * ─────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // HAMBURGER MENU — Toggle mobile nav
  // ─────────────────────────────────────────────────────────
  function initHamburgerMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navMenu   = document.querySelector('.nav-menu');

    if (!hamburger || !navMenu) {
      return; // Either element missing — not an error, just not applicable
    }

    function openMenu() {
      navMenu.classList.add('nav-menu--active');
      hamburger.classList.add('hamburger--active');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    }

    function closeMenu() {
      navMenu.classList.remove('nav-menu--active');
      hamburger.classList.remove('hamburger--active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }

    // Toggle on hamburger click
    hamburger.addEventListener('click', function () {
      var isOpen = navMenu.classList.contains('nav-menu--active');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close when any nav link is clicked (mobile UX)
    var navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key (accessibility)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('nav-menu--active')) {
        closeMenu();
        hamburger.focus(); // Return focus to trigger element
      }
    });

    // Close when clicking outside menu area
    document.addEventListener('click', function (e) {
      if (
        navMenu.classList.contains('nav-menu--active') &&
        !navMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        closeMenu();
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // ACTIVE NAV LINK — Mark current page link as active
  // ─────────────────────────────────────────────────────────
  function setActiveNavLink() {
    var navLinks = document.querySelectorAll('.nav-link');
    if (!navLinks.length) return;

    var path = window.location.pathname;

    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;

      var isActive = false;

      if (href === '/' || href === '/index.html') {
        isActive = (path === '/' || path === '/index.html');
      } else if (href.includes('blog.html')) {
        // Active on blog.html AND post.html (both are blog-related)
        isActive = path.includes('blog.html') || path.includes('post.html');
      } else {
        isActive = path === href || path.startsWith(href.replace('.html', ''));
      }

      link.classList.toggle('nav-link--active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // NAVBAR SCROLL SHADOW — Add visual depth on scroll
  // ─────────────────────────────────────────────────────────
  function initNavScrollBehavior() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    function onScroll() {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 20);
    }

    // Passive listener — does not block scrolling
    window.addEventListener('scroll', onScroll, { passive: true });

    // Run once on load to handle page restored at scroll position
    onScroll();
  }

  // ─────────────────────────────────────────────────────────
  // SMOOTH SCROLL — Internal anchor links
  // ─────────────────────────────────────────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href').slice(1);
        if (!targetId) return;

        var target = document.getElementById(targetId);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Move focus for keyboard/screen reader users
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  // ─────────────────────────────────────────────────────────
  // SCROLL REVEAL — Animate .reveal elements into view
  // ─────────────────────────────────────────────────────────
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements without animation
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('reveal--visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target); // Animate once only
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    var revealEls = document.querySelectorAll('.reveal');
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  // Expose for re-use by home-blog.js after dynamic render
  window.initScrollReveal = initScrollReveal;

  // ─────────────────────────────────────────────────────────
  // INIT — Run all modules after DOM is ready
  // ─────────────────────────────────────────────────────────
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
