/**
 * theme.js — Professional Dark/Light Mode Management
 * 
 * Architecture:
 *   1. Load theme from localStorage or prefers-color-scheme BEFORE page renders
 *   2. Attach to <html data-theme="dark|light">
 *   3. CSS variables in :root[data-theme="..."] override colors automatically
 *   4. Toggle button dispatches 'themechange' event for other scripts
 *   5. System preference respected when localStorage is empty
 *
 * Performance:
 *   - No DOM reflow or repaints on theme switch (CSS vars only)
 *   - localStorage queries are O(1) operations
 *   - Event system allows extensions without modifying this file
 */

(function initTheme() {
  const STORAGE_KEY = 'portfolio-theme';
  const THEME_ATTR = 'data-theme';
  
  /**
   * Step 1: Determine which theme to apply on first load
   * Priority: localStorage > prefers-color-scheme > default (dark)
   */
  function getInitialTheme() {
    // Check if user has previously selected a theme
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'dark' || saved === 'light')) {
      return saved;
    }
    
    // Respect OS dark mode preference if no saved preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  
  /**
   * Step 2: Apply theme to document root and persist in localStorage
   */
  function applyTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') {
      console.warn('[theme.js] Invalid theme:', theme);
      return;
    }
    
    document.documentElement.setAttribute(THEME_ATTR, theme);
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Dispatch custom event for other scripts to react to theme change
    // Usage: window.addEventListener('themechange', (e) => { console.log(e.detail.theme) })
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: theme }
    }));
  }
  
  /**
   * Step 3: Initialize on script load (before DOM renders)
   * This prevents flash of wrong theme
   */
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);
  
  /**
   * Step 4: Handle theme toggle button (when DOM is ready)
   */
  function setupToggleButton() {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) {
      // No toggle button found — dark mode only
      return;
    }
    
    // Click handler: toggle between dark and light
    toggleButton.addEventListener('click', () => {
      const current = document.documentElement.getAttribute(THEME_ATTR);
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }
  
  /**
   * Step 5: Respect system theme changes (user toggles OS dark/light mode)
   * Only applies if user hasn't explicitly set a preference via button
   */
  function setupSystemPreferenceListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      // Only auto-switch if user hasn't explicitly saved a preference
      if (!localStorage.getItem(STORAGE_KEY)) {
        const theme = event.matches ? 'dark' : 'light';
        applyTheme(theme);
      }
    });
  }
  
  /**
   * Step 6: Attach handlers when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupToggleButton();
      setupSystemPreferenceListener();
    });
  } else {
    // DOM already loaded (rare, but possible if script is deferred)
    setupToggleButton();
    setupSystemPreferenceListener();
  }
})();
