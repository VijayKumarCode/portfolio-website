
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GLOBAL UI ELEMENTS ---
    const header = document.getElementById('site-header');
    const hamburgerBtn = document.getElementById('hamburger-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.menu-links a');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#desktop-nav .nav-links a, .menu-links a');

    // --- 2. MOBILE NAVIGATION LOGIC ---
    if (hamburgerBtn && mobileMenu) {
        const toggleMenu = (isOpen) => {
            const expanding = isOpen ?? (hamburgerBtn.getAttribute('aria-expanded') !== 'true');
            hamburgerBtn.setAttribute('aria-expanded', expanding);
            mobileMenu.classList.toggle('active', expanding);
            hamburgerBtn.classList.toggle('active', expanding);
        };

        hamburgerBtn.addEventListener('click', () => toggleMenu());

        // Closes menu when links are clicked (replaces inline closeMenu)
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => toggleMenu(false));
        });
    }

    // --- 3. SCROLL REVEAL & SKILLS ANIMATION ---
    const revealElements = document.querySelectorAll('.reveal, .project-card, .about-card, .skills-group');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        // General Reveal Observer
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

        revealElements.forEach(el => revealObserver.observe(el));

        // Specific Skills Bar Observer
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
        // Fallback: Show all elements if observer is missing or motion is reduced
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
    // Calculate nav height dynamically for the offset
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { 
        rootMargin: `-${navHeight}px 0px -60% 0px`,
        threshold: 0 
    });

    sections.forEach(s => navObserver.observe(s));
});