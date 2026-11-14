// Single Source of Truth for Krix Design System CSS Tokens, Global Resets, Animations, and Visual Styling
// Grounded in Geist Design Guidelines, QuickWitty Visual Aesthetics, and Human Cognitive Psychology

export function getTokensCss(): string {
  return `
/* =====================================================
   1. FONT IMPORTS & ROOT DESIGN TOKENS
   ===================================================== */
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Geist:wght@400;500;600;700&display=swap');

:root {
  --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'Geist Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;

  /* Geist Grayscale 10-Tier Palette (Light Mode Default) */
  --geist-gray-100: #000000;
  --geist-gray-90: #111111;
  --geist-gray-80: #333333;
  --geist-gray-70: #444444;
  --geist-gray-60: #666666;
  --geist-gray-50: #888888;
  --geist-gray-40: #999999;
  --geist-gray-30: #eaeaea;
  --geist-gray-20: #f5f5f5;
  --geist-gray-10: #ffffff;

  /* Surfaces & Canvas */
  --bg: #ffffff;
  --fg: #000000;
  --bg-surface-0: #ffffff;
  --bg-surface-1: #fafafa;
  --bg-surface-2: #f4f4f5;
  --bg-surface-3: #e4e4e7;
  --nav-header-bg: rgba(255, 255, 255, 0.98);
  --border-subtle: #eaeaea;
  --border-medium: #d4d4d8;
  --border-focus: #000000;

  /* Semantic Color Tokens (WCAG AAA Contrast Standard) */
  --accent: #0070f3;
  --accent-light: #3291ff;
  --success: #16a34a;       /* Strictly Green, never blue */
  --success-subtle: #dcfce7;
  --warning: #f5a623;
  --warning-subtle: #fef9c3;
  --error: #ee0000;
  --error-subtle: #fee2e2;

  /* Interactive Spotlights & Ambient Glow */
  --spotlight-color: rgba(99, 102, 241, 0.08);
  --hero-glow: radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.08), transparent 70%);
  --dot-color: rgba(0, 0, 0, 0.06);

  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);
  --shadow-popover: 0 16px 48px -8px rgba(0, 0, 0, 0.2);

  /* Concentric Nested Border Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-full: 9999px;

  /* Z-Index Hierarchy */
  --z-sticky: 100;
  --z-dropdown: 200;
  --z-drawer: 600;
  --z-modal: 620;
  --z-toast: 700;
}

/* OLED Dark Mode Standard (html.dark) */
html.dark {
  --bg: #000000;
  --fg: #ededed;
  --bg-surface-0: #0a0a0c;
  --bg-surface-1: #111114;
  --bg-surface-2: #18181c;
  --bg-surface-3: #222228;
  --nav-header-bg: rgba(10, 10, 12, 0.85);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.15);
  --border-focus: #ffffff;

  --accent: #3b82f6;
  --accent-light: #60a5fa;
  --success: #22c55e;
  --success-subtle: rgba(34, 197, 94, 0.12);
  --warning: #f59e0b;
  --warning-subtle: rgba(245, 158, 11, 0.12);
  --error: #ef4444;
  --error-subtle: rgba(239, 68, 68, 0.12);

  --spotlight-color: rgba(129, 140, 248, 0.12);
  --hero-glow: radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.15), transparent 70%);
  --dot-color: rgba(255, 255, 255, 0.05);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.6);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.7);
  --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.85);
  --shadow-popover: 0 20px 60px -10px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* =====================================================
   2. GLOBAL RESET & BASE CANVAS
   ===================================================== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-sans);
  background-color: var(--bg);
  color: var(--fg);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
  line-height: 1.5;
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
  background-image: radial-gradient(var(--dot-color) 1px, transparent 1px);
  background-size: 24px 24px;
  background-attachment: fixed;
  color: var(--fg);
  overflow-x: hidden;
  position: relative;
  transition: background-color 0.25s ease, color 0.25s ease;
}

/* Ambient Radial Mesh Layer behind Hero */
.ambient-hero-mesh {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 480px;
  background: var(--hero-glow);
  pointer-events: none;
  z-index: 0;
}

/* Subtle Film Grain Noise Texture */
.noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  pointer-events: none;
  border-radius: inherit;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

::selection {
  background-color: var(--fg);
  color: var(--bg);
}

a {
  color: inherit;
  text-decoration: none;
  transition: color 0.15s ease, opacity 0.15s ease;
}

button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  border: none;
  outline: none;
  background: none;
}

code, kbd, pre, samp {
  font-family: var(--font-mono);
}

/* =====================================================
   3. CARD ARCHITECTURE & SPOTLIGHT HOVER EFFECTS
   ===================================================== */
.card, .spotlight-card {
  position: relative;
  background: var(--bg-surface-0);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.spotlight-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    var(--spotlight-color),
    transparent 65%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

.spotlight-card:hover::before {
  opacity: 1;
}

.spotlight-card:hover {
  border-color: var(--border-medium);
}

/* Top Accent Gradient Line on Cards */
.card-top-border {
  position: relative;
}

.card-top-border::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #818cf8, #38bdf8, #34d399);
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 2;
}

.card-top-border:hover::after {
  opacity: 1;
}

/* Scale Elevation on Hover */
.scale-on-hover {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
}

.scale-on-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* =====================================================
   4. BUTTONS & MICRO-INTERACTION FEEDBACK
   ===================================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface-1);
  color: var(--fg);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  user-select: none;
  transition: all 0.15s ease;
}

.btn:hover {
  background: var(--bg-surface-2);
  border-color: var(--border-medium);
}

.btn:active {
  transform: scale(0.98);
}

.btn.primary {
  background: var(--fg);
  color: var(--bg);
  border-color: var(--fg);
  font-weight: 600;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn.primary:hover {
  opacity: 0.92;
  border-color: var(--fg);
}

.btn.danger {
  background: var(--error);
  color: #ffffff;
  border-color: var(--error);
}

.btn.danger:hover {
  opacity: 0.9;
}

.btn.ghost {
  background: transparent;
  border-color: transparent;
}

.btn.ghost:hover {
  background: var(--bg-surface-2);
  border-color: var(--border-subtle);
}

/* Action Shimmer Sweep */
@keyframes deploy-shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}

.deploy-btn {
  position: relative;
  overflow: hidden;
}

.deploy-btn::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 50%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: deploy-shimmer 3s ease-in-out infinite;
}

/* =====================================================
   5. STATUS INDICATORS & VITALITY RINGS
   ===================================================== */
@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45); }
  50% { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0); }
}

.status-dot-available {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  display: inline-block;
  animation: pulse-green 2s ease infinite;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface-1);
  color: var(--fg);
}

/* Modern Animated Curved Checkbox */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--border-medium);
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  background-color: var(--bg-surface-1);
  display: inline-grid;
  place-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  vertical-align: middle;
}

input[type="checkbox"]:hover {
  border-color: var(--fg);
  background-color: var(--bg-surface-2);
}

input[type="checkbox"]:checked {
  background-color: var(--fg);
  border-color: var(--fg);
}

input[type="checkbox"]::before {
  content: "";
  width: 9px;
  height: 5px;
  border-left: 2px solid var(--bg);
  border-bottom: 2px solid var(--bg);
  transform: rotate(-45deg) scale(0);
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: -2px;
}

input[type="checkbox"]:checked::before {
  transform: rotate(-45deg) scale(1);
}

input[type="checkbox"]:focus-visible {
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
}

/* Modern Curved Animated Switch */
.krix-switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
  cursor: pointer;
  vertical-align: middle;
}

.krix-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.krix-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--border-medium);
  transition: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: var(--radius-full);
}

.krix-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.krix-switch input:checked + .krix-slider {
  background-color: var(--success);
}

.krix-switch input:checked + .krix-slider:before {
  transform: translateX(16px);
}

/* =====================================================
   6. REDESIGNED CUSTOM DROPDOWNS & KEBAB MENUS
   ===================================================== */
.krix-dropdown {
  position: relative;
  display: inline-block;
  overflow: visible;
}

td:has(.krix-dropdown),
th:has(.krix-dropdown),
.action-cell {
  position: relative;
  overflow: visible !important;
}

.krix-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 180px;
  padding: 6px;
  background: var(--bg-surface-0);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  box-shadow: var(--shadow-popover);
  backdrop-filter: blur(20px);
  z-index: 99999;
  display: none;
  flex-direction: column;
  gap: 2px;
  transform-origin: top right;
  animation: dropdown-pop 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes dropdown-pop {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.krix-dropdown-menu.active {
  display: flex;
}

.krix-dropdown-menu.drop-up {
  top: auto;
  bottom: calc(100% + 6px);
  transform-origin: bottom right;
}

.krix-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--fg);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
  text-decoration: none;
}

.krix-dropdown-item:hover {
  background: var(--bg-surface-2);
}

.krix-dropdown-item.danger {
  color: var(--error);
}

.krix-dropdown-item.danger:hover {
  background: var(--error-subtle);
}

.krix-dropdown-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 4px 0;
}

/* Kebab Trigger Button */
.krix-kebab-trigger {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  color: var(--geist-gray-50);
  cursor: pointer;
  transition: all 0.15s ease;
}

.krix-kebab-trigger:hover {
  background: var(--bg-surface-2);
  border-color: var(--border-subtle);
  color: var(--fg);
}

/* Standardized Pill Dropdown Select */
.krix-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  height: 34px;
  line-height: 32px;
  padding: 0 28px 0 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--fg);
  background-color: var(--bg-surface-1);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 11px center;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  text-align: left;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.krix-select:hover {
  border-color: var(--border-medium);
  background-color: var(--bg-surface-2);
}

.krix-select:focus-visible {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
}

.krix-select option {
  background-color: var(--bg-surface-0);
  color: var(--fg);
  padding: 6px 10px;
}

/* Custom Dropdown Trigger, Popover, and Options */
.krix-custom-dropdown {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.krix-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 34px;
  min-height: 34px;
  padding: 0 16px;
  background-color: var(--bg-surface-1);
  color: var(--fg);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-full);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  box-sizing: border-box;
  user-select: none;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.krix-dropdown-trigger:hover {
  background-color: var(--bg-surface-2);
  border-color: var(--border-strong);
}

.krix-dropdown-trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.krix-dropdown-label {
  display: inline-block;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.krix-dropdown-chevron {
  display: inline-flex;
  align-items: center;
  color: var(--geist-gray-50);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.krix-custom-dropdown.open .krix-dropdown-chevron {
  transform: rotate(180deg);
}

.krix-dropdown-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 100%;
  max-width: min(340px, 94vw);
  max-height: 280px;
  overflow-y: auto;
  background-color: var(--bg-surface-1);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: var(--z-dropdown, 800);
  padding: 4px;
  box-sizing: border-box;
}

.krix-dropdown-option {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px 14px;
  font-size: 12px;
  color: var(--fg);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.12s ease;
  white-space: nowrap;
}

.krix-dropdown-option:hover {
  background-color: var(--bg-surface-2);
}

.krix-dropdown-option.selected {
  background-color: var(--bg-surface-2);
  font-weight: 600;
  color: var(--accent);
}

/* Category Filter Equal-Sized Grid (Mobile and Desktop) */
.category-filter-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.category-filter-pill {
  width: 100%;
  height: 34px;
  min-height: 34px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-full) !important;
  border: 1px solid var(--border-medium);
  background: var(--bg-surface-1);
  color: var(--geist-gray-50);
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-filter-pill:hover {
  background: var(--bg-surface-2);
  color: var(--fg);
  border-color: var(--border-strong);
}

.category-filter-pill.active {
  background: var(--bg-surface-2);
  color: var(--fg);
  border-color: var(--border-strong);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

@media (max-width: 768px) {
  .category-filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .category-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
}

/* Concise vs Verbose Tools Mode */
.tools-grid.concise .tool-desc {
  display: none !important;
}

.tools-grid.verbose .tool-desc {
  display: block !important;
  white-space: normal !important;
}

/* Responsive Search Bar */
.search-bar-responsive {
  transition: width 0.2s ease, border-color 0.15s ease;
}

@media (max-width: 640px) {
  .search-bar-responsive {
    width: 100% !important;
  }
}

/* =====================================================
   7. REDESIGNED CUSTOM TOAST NOTIFICATIONS
   ===================================================== */
#krixToastContainer {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

@keyframes toast-slide-up {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.krix-toast {
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  max-width: 380px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface-0);
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-popover);
  backdrop-filter: blur(16px);
  animation: toast-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.krix-toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.krix-toast-text {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--fg);
}

.krix-toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  color: var(--geist-gray-50);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.krix-toast-close:hover {
  color: var(--fg);
  background: var(--bg-surface-2);
}

.krix-toast-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--success);
  transition: width linear;
}

/* =====================================================
   8. COMMAND PALETTE (⌘K) MODAL DIALOG
   ===================================================== */
.krix-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  z-index: var(--z-modal);
  display: none;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  animation: fade-in 0.15s ease;
}

.krix-palette-overlay.active {
  display: flex;
}

.krix-palette-dialog {
  width: 100%;
  max-width: 580px;
  background: var(--bg-surface-0);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-popover);
  overflow: hidden;
  animation: scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.krix-palette-search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.krix-palette-input {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--fg);
}

.krix-palette-input::placeholder {
  color: var(--geist-gray-50);
}

.krix-palette-results {
  max-height: 340px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.krix-palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--fg);
  cursor: pointer;
  transition: background 0.1s ease;
}

.krix-palette-item:hover, .krix-palette-item.selected {
  background: var(--bg-surface-2);
}

.krix-palette-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-top: 1px solid var(--border-subtle);
  font-size: 11px;
  color: var(--geist-gray-50);
  background: var(--bg-surface-1);
}

/* =====================================================
   9. SCROLL PROGRESS FAB
   ===================================================== */
#scrollProgressFab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-surface-0);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: calc(var(--z-sticky) - 10);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease, transform 0.2s ease;
}

#scrollProgressFab.visible {
  opacity: 1;
  visibility: visible;
}

#scrollProgressFab:hover {
  transform: translateY(-2px);
  border-color: var(--border-medium);
}

/* =====================================================
   10. BACKWARD COMPATIBILITY CLASS MAPPINGS (TEST INVARIANTS)
   ===================================================== */
.wrapper {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  position: relative;
  z-index: 1;
  width: 100%;
}

.nav-header {
  position: sticky;
  top: 0;
  width: 100%;
  z-index: var(--z-sticky);
  background: var(--nav-header-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
}

.nav-inner {
  max-width: 1040px;
  margin: 0 auto;
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.02em;
  color: var(--fg);
}

.brand-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-1);
}

.brand-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-pills {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-pill {
  position: relative;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--geist-gray-50);
  border-radius: var(--radius-md);
  transition: color 0.15s ease, background 0.15s ease;
}

.nav-pill:hover {
  color: var(--fg);
  background: var(--bg-surface-1);
}

.nav-pill.active {
  color: var(--fg);
  background: var(--bg-surface-2);
  border: 1px solid var(--border-subtle);
}

.profile-avatar-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-subnav {
  display: none;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface-0);
  overflow-x: auto;
}

.mobile-subnav-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  min-width: max-content;
}

.mobile-subnav-pill {
  width: 40px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--geist-gray-50);
  border-radius: 6px;
  border: 1px solid transparent;
  flex: 0 0 auto;
}

.mobile-subnav-pill.active {
  color: var(--fg);
  background: var(--bg-surface-2);
  border-color: var(--border-subtle);
}

.tool-cat-pill,
.settings-cat-pill {
  border-radius: 6px !important;
}

.permission-pagination button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.api-client-id-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: min(100%, 280px);
  min-width: 0;
  padding: 5px 7px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-surface-1);
}

.api-client-id-box code {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  display: block;
}

.settings-secret-control {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.settings-secret-control input {
  min-width: 0;
  flex: 1;
}

.settings-action-row .btn {
  min-width: 180px;
  min-height: 38px;
  justify-content: center;
  border-radius: 6px;
}

/* OAuth rows fit the card width; the kebab menu is always visible, no horizontal scrolling. */
.oauth-clients-scroll {
  scrollbar-width: thin;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}
.oauth-app-favicon { display:block; width:100%; height:100%; object-fit:contain; }
.oauth-app-favicon:not([src]),
.oauth-app-favicon[src=""],
.client-logo-img:not([src]),
.client-logo-img[src=""],
.oauth-app-favicon.hidden,
.client-logo-img.hidden {
  display: none !important;
}
.density-toggle {
  border-radius: var(--radius-full) !important;
  background: var(--bg-surface-1);
  border: 1px solid var(--border-medium);
  height: 34px;
  box-sizing: border-box;
}
.density-toggle .nav-pill,
.density-toggle .nav-pill.active {
  border-radius: var(--radius-full) !important;
}

/* Pill Search Bar Style */
.krix-pill-search {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  min-height: 38px;
  padding: 0 16px;
  background: var(--bg-surface-1);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-full) !important;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.krix-pill-search:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
}
.krix-pill-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--fg);
  font-size: 12.5px;
  font-family: inherit;
}

@media (max-width: 768px) {
  .oauth-clients-scroll .oauth-client-row { min-width:0; flex:0 0 auto; width:100%; }
  .mobile-subnav-scroll { justify-content: space-between; min-width: 100%; }
  .api-client-id-box { max-width: 100%; }
  .settings-action-row { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .settings-action-row .btn { min-width: 0; width: 100%; }
}

@media (max-width: 768px) {
  .desktop-only-nav { display: none !important; }
  .mobile-subnav { display: block; }
  .wrapper { padding: 20px 16px 48px; }
}

/* Key display scroll container for tests */
.key-display-scroll {
  max-width: 240px;
  overflow-x: auto;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 12px;
}

/* Google reCAPTCHA v3 badge hiding per Google Terms */
.grecaptcha-badge {
  visibility: hidden !important;
}

/* Profile name overflow prevention in header and menu */
.profile-trigger-name,
.profile-menu-name,
.profile-menu-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Endpoint input row for tests */
.endpoint-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

/* Auth Required Card Shell */
.auth-required-viewport {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.auth-required-card {
  max-width: 440px;
  width: 100%;
  margin: 0 auto;
  padding: 36px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-lg);
}

.auth-icon-halo {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg);
}

/* Footer Semantic Grid */
.krix-footer {
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface-0);
  margin-top: auto;
  padding: 48px 24px 36px;
  position: relative;
  z-index: 1;
}

.krix-footer-inner {
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
}

.krix-footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.krix-footer-col a {
  font-size: 12px;
  color: var(--geist-gray-50);
  text-decoration: none;
  transition: color 0.15s ease;
}

.krix-footer-col a:hover {
  color: var(--fg);
}

.krix-footer-bottom {
  max-width: 1040px;
  margin: 32px auto 0;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
/* Mobile overflow, controls and compact navigation refinements. */
.home-bento-grid,
.home-bento-grid > .card { min-width: 0; max-width: 100%; }
.tool-breakdown-select-wrap select { max-width: min(260px, 58vw); }
select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='m3 4.5 3 3 3-3' stroke='%23909098' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 11px center;
  padding-right: 32px !important;
}
.store-view-toggle .nav-pill,
.store-view-toggle .nav-pill.active { border-radius: 999px !important; }
.theme-mode-control .theme-mode-button { width: 42px; min-width: 42px; justify-content: center; padding: 0 !important; }
.theme-mode-control .theme-mode-button span { display: none !important; }
.oauth-authorizations-card,
.oauth-authorizations-card.card,
.oauth-authorizations-card.spotlight-card {
  height: auto !important;
  min-height: 0 !important;
  align-self: start !important;
  overflow: visible !important;
}
.oauth-clients-scroll {
  overflow: visible !important;
  width: 100%;
  min-width: 0;
  height: auto !important;
  min-height: 0 !important;
  flex: 0 0 auto !important;
  align-items: stretch !important;
}
.oauth-clients-scroll .oauth-client-row,
.oauth-client-row.card {
  flex: 0 0 auto;
  min-width: 0;
  width: 100%;
  height: auto !important;
  min-height: 68px;
  align-self: stretch;
  overflow: visible !important;
}

@media (max-width: 768px) {
  .home-bento-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 14px !important; }
  .home-bento-grid > .card,
  .home-bento-grid > .home-config-card,
  .home-bento-grid > .home-telemetry-card { grid-column: 1 / -1 !important; width: 100%; min-width: 0; }
  .home-config-card > div:first-child { gap: 10px; }
  .snippet-copy-button { flex: 0 0 36px; }
  .oauth-clients-scroll .oauth-client-row { flex: 0 0 auto; min-width: 0; width: 100%; }
  .store-view-toggle { flex: 0 0 auto; }
  #storeSearchInput { min-width: 0; }
  .store-table-toolbar { align-items: stretch !important; }
  .store-table-toolbar > div:last-child { min-width: 0; width: 100%; flex-wrap: wrap; }
  .store-table-toolbar > div:last-child > div:last-child { min-width: 0 !important; width: 100%; flex: 1 1 100%; }
  #toolSearchInput { min-width: 0; width: 100%; }
  .tool-breakdown-select-wrap { width: 100%; justify-content: space-between; }
  .tool-breakdown-select-wrap select { width: min(62%, 260px); }
  .density-toggle { border-radius: 999px !important; overflow: hidden; }
  .density-toggle .nav-pill,
  .density-toggle .nav-pill.active { border-radius: 999px !important; }
  .settings-action-row { grid-template-columns: minmax(0, 1fr) !important; }
}


/* Shared pagination buttons (Previous / Next and icon-only chevrons) */
.pager-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 34px; min-width: 34px; padding: 0 14px 0 10px; margin: 0;
  font: 500 12.5px/1 var(--font-sans, inherit); letter-spacing: -0.005em;
  color: var(--fg); background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle); border-radius: 10px;
  cursor: pointer; white-space: nowrap; user-select: none;
  transition: background .15s ease, border-color .15s ease, transform .1s ease, opacity .15s ease;
}
.pager-btn.pager-next { padding: 0 10px 0 14px; }
.pager-btn.pager-icon { padding: 0; width: 30px; height: 30px; min-width: 30px; border-radius: 999px; }
.pager-btn svg { flex: 0 0 auto; stroke-width: 2.2; transition: transform .15s ease; }
.pager-btn:hover:not(:disabled) { background: var(--bg-surface-2); border-color: var(--border-medium); }
.pager-btn:not(.pager-icon):hover:not(:disabled) .pager-prev-ico,
.pager-btn.pager-prev:hover:not(:disabled) svg { transform: translateX(-2px); }
.pager-btn.pager-next:hover:not(:disabled) svg { transform: translateX(2px); }
.pager-btn:active:not(:disabled) { transform: scale(0.97); }
.pager-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.pager-btn:disabled { opacity: .38; cursor: not-allowed; }
`;
}
