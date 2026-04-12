/* ═══════════════════════════════════════════════════════════
   Portfolio v2.0 — script.js
   Fixes:
   - BUG: closeMenu was not defined; called from onclick in HTML
   - BUG: No scroll-reveal logic existed
   - BUG: Skills animation trigger was missing
   - Added: keyboard accessibility for hamburger
   - Added: header shrink on scroll
═══════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Hamburger menu ──────────────────────────────────────── */
  const toggle     = document.getElementById('hamburger-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !mobileMenu.contains(e.target)) {
        closeMenu();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ── Scroll-reveal (IntersectionObserver) ────────────────── */
  const revealEls = document.querySelectorAll('section, .project-card, .about-card, .blog-article-card');
  revealEls.forEach(el => {
    el.classList.add('reveal');
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // fire once
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ── Skills bar animation ────────────────────────────────── */
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

  /* ── Header shrink on scroll ─────────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.borderBottomColor =
        window.scrollY > 20
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(255,255,255,0.06)';
    }, { passive: true });
  }

  /* ── Active nav link on scroll ───────────────────────────── */
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('#desktop-nav .nav-links a, .menu-links a');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  }, { rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--nav-h')} 0px -60% 0px` });

  sections.forEach(s => navObserver.observe(s));

});

/* ── closeMenu — called from onclick in HTML ─────────────── */
function closeMenu() {
  const toggle     = document.getElementById('hamburger-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!toggle || !mobileMenu) return;
  mobileMenu.classList.remove('open');
  toggle.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}

// Expose globally so onclick="closeMenu()" in HTML works
window.closeMenu = closeMenu;