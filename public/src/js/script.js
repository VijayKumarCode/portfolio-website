/**
 * VIJAY KUMAR — PORTFOLIO
 * Production-Grade JavaScript
 *
 * FIX: Logo click handler previously called e.preventDefault() unconditionally,
 * which prevented navigation from /blog or /resume back to the homepage.
 * On non-home pages, clicking the logo should navigate to '/'.
 * On the homepage ('/'), it should smooth-scroll to the top.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const header        = document.getElementById('site-header');
  const hamburgerBtn  = document.getElementById('hamburger-toggle');
  const mobileMenu    = document.getElementById('mobile-menu');
  const mobileLinks   = document.querySelectorAll('.menu-links a');
  const mobileBackdrop= document.getElementById('menu-backdrop');
  const sections      = document.querySelectorAll('section[id]');
  const navLinks      = document.querySelectorAll('#desktop-nav .nav-links a, .menu-links a');
  const backToTopBtn  = document.getElementById('back-to-top');
  const revealEls     = document.querySelectorAll('.reveal, .project-card, .about-card, .skills-group, .fade-in');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── MOBILE NAVIGATION ── */
  let lastFocused = null;

  function openMenu() {
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.classList.add('active');
    mobileMenu.classList.add('open');
    if (mobileBackdrop) mobileBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    mobileMenu.querySelector('a')?.focus();
  }

  function closeMenu() {
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.classList.remove('active');
    mobileMenu.classList.remove('open');
    if (mobileBackdrop) mobileBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    lastFocused?.focus();
  }

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
    });

    mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

    mobileBackdrop?.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });

    mobileMenu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = mobileMenu.querySelectorAll('a[href], button');
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ── SCROLL REVEAL ── */
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } }),
      { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }
    );
    revealEls.forEach(el => revealObs.observe(el));

    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
      const skillsObs = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animate'); skillsObs.unobserve(e.target); } }),
        { threshold: 0.2 }
      );
      skillsObs.observe(skillsSection);
    }
  } else {
    [...revealEls, document.getElementById('skills')].forEach(el => {
      if (el) el.classList.add('visible', 'animate');
    });
  }

  /* ── HEADER + BACK-TO-TOP ON SCROLL ── */
  if (header || backToTopBtn) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      header?.classList.toggle('scrolled', y > 20);
      backToTopBtn?.classList.toggle('visible', y > 500);
    }, { passive: true });
  }

  /* ── SCROLL SPY ── */
  const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;

  const navObs = new IntersectionObserver(
    (entries) => entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', active);
          link.setAttribute('aria-current', active ? 'page' : 'false');
        });
      }
    }),
    { rootMargin: `-${navHeight}px 0px -60% 0px`, threshold: 0 }
  );
  sections.forEach(s => navObs.observe(s));

  /* ── SMOOTH SCROLL FOR ANCHOR LINKS ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      try {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const top = target.offsetTop - (header?.offsetHeight ?? 72) - 12;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      } catch { /* ignore invalid selectors */ }
    });
  });

  /* ── LOGO CLICK ──
   * FIX: Previously called e.preventDefault() unconditionally, breaking
   * logo navigation from /blog and /resume back to the homepage.
   * Now: only prevent default (smooth scroll) when already on the homepage.
   * On other pages, let the browser navigate normally to '/'.
   */
  document.querySelectorAll('.logo-container').forEach(logo => {
    logo.addEventListener('click', (e) => {
      const isHomePage = window.location.pathname === '/';
      if (isHomePage) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      /* On other pages: href="/" navigates normally — no prevention needed */
    });
  });

  /* ── BACK-TO-TOP ── */
  backToTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  console.log(
    '%c🚀 Portfolio Ready %c| %cVijay Kumar',
    'color: #8b5cf6; font-weight: bold;',
    '',
    'color: #0d9488;'
  );
});