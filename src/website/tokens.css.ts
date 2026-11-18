// Krix design system: a warm, quiet interface modelled on the Claude web app.
// One stylesheet, no external fonts, no decorative layers. Motion is limited to state changes.

export function getTokensCss(): string {
  return `
:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, Cambria, "Times New Roman", serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  --bg: #faf9f5;
  --bg-side: #f5f4ed;
  --fg: #141413;
  --fg-2: #3d3d3a;
  --fg-3: #73726c;
  --bg-surface-0: #ffffff;
  --bg-surface-1: #faf9f5;
  --bg-surface-2: #f0eee6;
  --bg-surface-3: #e8e6dc;
  --hover: rgba(31, 30, 29, 0.05);
  --active: rgba(31, 30, 29, 0.08);
  --border-subtle: rgba(31, 30, 29, 0.1);
  --border-medium: rgba(31, 30, 29, 0.18);
  --border-focus: #c6613f;

  --accent: #c6613f;
  --accent-hover: #b4553a;
  --accent-fg: #ffffff;
  --accent-soft: rgba(198, 97, 63, 0.1);
  --success: #2f7d4f;
  --success-subtle: rgba(47, 125, 79, 0.1);
  --warning: #9a6a12;
  --warning-subtle: rgba(154, 106, 18, 0.12);
  --error: #b53333;
  --error-subtle: rgba(181, 51, 51, 0.09);

  --geist-gray-100: var(--fg);
  --geist-gray-90: var(--fg);
  --geist-gray-80: var(--fg-2);
  --geist-gray-70: var(--fg-2);
  --geist-gray-60: var(--fg-3);
  --geist-gray-50: var(--fg-3);
  --geist-gray-40: var(--fg-3);

  --shadow-sm: 0 1px 2px rgba(20, 20, 19, 0.04);
  --shadow-md: 0 4px 20px rgba(20, 20, 19, 0.05);
  --shadow-lg: 0 8px 32px rgba(20, 20, 19, 0.1);
  --shadow-popover: 0 4px 24px rgba(20, 20, 19, 0.1), 0 0 0 1px rgba(31, 30, 29, 0.08);
  --scrim: rgba(20, 20, 19, 0.4);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --sidebar-w: 272px;
  --sidebar-w-collapsed: 56px;
  --z-sticky: 100;
  --z-dropdown: 200;
  --z-drawer: 600;
  --z-modal: 620;
  --z-toast: 700;
  color-scheme: light;
}

html.dark {
  --bg: #262624;
  --bg-side: #1f1e1d;
  --fg: #faf9f5;
  --fg-2: #dedcd1;
  --fg-3: #9c9a92;
  --bg-surface-0: #30302e;
  --bg-surface-1: #2b2b29;
  --bg-surface-2: #3a3938;
  --bg-surface-3: #454443;
  --hover: rgba(250, 249, 245, 0.05);
  --active: rgba(250, 249, 245, 0.09);
  --border-subtle: rgba(222, 220, 209, 0.1);
  --border-medium: rgba(222, 220, 209, 0.2);

  --accent: #d97757;
  --accent-hover: #e58a6b;
  --accent-fg: #1f1e1d;
  --accent-soft: rgba(217, 119, 87, 0.14);
  --success: #6bbf8a;
  --success-subtle: rgba(107, 191, 138, 0.12);
  --warning: #d8a64a;
  --warning-subtle: rgba(216, 166, 74, 0.14);
  --error: #e5706b;
  --error-subtle: rgba(229, 112, 107, 0.12);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-popover: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(222, 220, 209, 0.12);
  --scrim: rgba(0, 0, 0, 0.55);
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-family: var(--font-sans); font-size: 15px; line-height: 1.5; background: var(--bg); color: var(--fg); -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; }
body { min-height: 100vh; min-height: 100dvh; background: var(--bg); color: var(--fg); overflow-x: hidden; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; color: inherit; }
button { background: none; border: 0; cursor: pointer; }
button:disabled { cursor: not-allowed; }
h1, h2, h3 { font-weight: 500; line-height: 1.25; }
code, kbd, pre, samp { font-family: var(--font-mono); }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
::selection { background: var(--accent-soft); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
input:focus-visible, textarea:focus-visible, select:focus-visible { outline: none; }
[hidden] { display: none !important; }
.text-muted { color: var(--fg-3); }
.mono { font-family: var(--font-mono); }
.grecaptcha-badge { visibility: hidden !important; }
* { scrollbar-width: thin; scrollbar-color: var(--border-medium) transparent; }

/* ---------- App frame ---------- */
.app { display: flex; min-height: 100vh; min-height: 100dvh; }
.sidebar { position: fixed; inset: 0 auto 0 0; width: var(--sidebar-w); background: var(--bg-side); border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; z-index: var(--z-sticky); transition: width .18s ease; }
.main { flex: 1; min-width: 0; margin-left: var(--sidebar-w); display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; transition: margin-left .18s ease; }
.sb-head { display: flex; align-items: center; justify-content: space-between; height: 56px; padding: 0 12px 0 16px; flex-shrink: 0; }
.sb-brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-serif); font-size: 22px; letter-spacing: -0.01em; color: var(--fg); min-width: 0; }
.sb-brand img { width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0; }
.sb-nav { display: flex; flex-direction: column; gap: 2px; padding: 4px 8px; overflow-y: auto; flex: 1; }
.sb-label { padding: 14px 10px 6px; font-size: 12px; color: var(--fg-3); }
.sb-link { display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 10px; border-radius: var(--radius-md); color: var(--fg-2); font-size: 14px; white-space: nowrap; transition: background .12s; }
.sb-link svg { flex-shrink: 0; color: var(--fg-3); }
.sb-link:hover { background: var(--hover); color: var(--fg); }
.sb-link.active { background: var(--active); color: var(--fg); font-weight: 500; }
.sb-link.active svg { color: var(--fg); }
.sb-foot { padding: 8px; border-top: 1px solid var(--border-subtle); position: relative; flex-shrink: 0; }
.sb-user { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; border-radius: var(--radius-lg); text-align: left; min-width: 0; }
.sb-user:hover { background: var(--hover); }
.sb-user-text { min-width: 0; flex: 1; }
.profile-trigger-name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sb-user-sub { font-size: 12px; color: var(--fg-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-avatar-wrap { width: 32px; height: 32px; border-radius: 50%; background: var(--fg); color: var(--bg); display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; overflow: hidden; flex-shrink: 0; }
.profile-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
.icon-btn { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--fg-3); flex-shrink: 0; }
.icon-btn:hover { background: var(--hover); color: var(--fg); }
.sb-signin { margin: 4px; width: calc(100% - 8px); }

.sb-collapsed .sidebar { width: var(--sidebar-w-collapsed); }
.sb-collapsed .main { margin-left: var(--sidebar-w-collapsed); }
.sb-collapsed .sb-brand span, .sb-collapsed .sb-link span, .sb-collapsed .sb-label, .sb-collapsed .sb-user-text, .sb-collapsed .sb-user > svg, .sb-collapsed .sb-signin span { display: none; }
.sb-collapsed .sb-head { padding: 0; flex-direction: column; justify-content: center; gap: 4px; height: 84px; }
.sb-collapsed .sb-link, .sb-collapsed .sb-user { justify-content: center; padding: 0; }
.sb-collapsed .sb-user { height: 44px; }

.topbar { display: none; position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-sticky); height: 52px; align-items: center; justify-content: space-between; padding: 0 8px; background: var(--bg); border-bottom: 1px solid var(--border-subtle); }
.topbar .sb-brand { font-size: 20px; }
.sb-close-btn { display: none; }
.scrim { position: fixed; inset: 0; background: var(--scrim); z-index: calc(var(--z-sticky) - 1); opacity: 0; pointer-events: none; transition: opacity .18s; }

@media (max-width: 860px) {
  .sidebar { transform: translateX(-100%); width: min(300px, 86vw); transition: transform .2s ease; box-shadow: none; }
  .nav-open .sidebar { transform: none; box-shadow: var(--shadow-lg); }
  .nav-open .scrim { opacity: 1; pointer-events: auto; }
  .main, .sb-collapsed .main { margin-left: 0; padding-top: 52px; }
  .sb-collapsed .sidebar { width: min(300px, 86vw); }
  .sb-collapsed .sb-brand span, .sb-collapsed .sb-link span, .sb-collapsed .sb-label, .sb-collapsed .sb-user-text, .sb-collapsed .sb-user > svg { display: revert; }
  .sb-collapsed .sb-head { flex-direction: row; justify-content: space-between; padding: 0 12px 0 16px; height: 56px; }
  .sb-collapsed .sb-link, .sb-collapsed .sb-user { justify-content: flex-start; padding: 0 10px; }
  .sb-collapsed .sb-user { padding: 8px; height: auto; }
  .topbar { display: flex; }
  .sb-collapse-btn { display: none; }
  .sb-close-btn { display: inline-flex; }
}

/* ---------- Page ---------- */
.page { width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 24px 32px; flex: 1; }
.page.wide { max-width: 1040px; }
.page.narrow { max-width: 620px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
.page-title { font-family: var(--font-serif); font-size: 32px; font-weight: 400; letter-spacing: -0.015em; }
.page-sub { margin-top: 6px; color: var(--fg-3); font-size: 15px; max-width: 60ch; }
.page-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.page-foot { padding: 20px 24px 28px; text-align: center; font-size: 12px; color: var(--fg-3); display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 16px; }
.page-foot a:hover { color: var(--fg); text-decoration: underline; }
.page-foot .recaptcha-notice { width: 100%; }
.section-title { font-size: 14px; font-weight: 500; margin: 32px 0 10px; }
.stack { display: flex; flex-direction: column; gap: 16px; }
.cluster { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.grow { flex: 1; min-width: 0; }
@media (max-width: 860px) { .page { padding: 28px 16px 24px; } .page-title { font-size: 26px; } }

/* ---------- Surfaces ---------- */
.panel, .card { background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 20px; }
.panel + .panel { margin-top: 16px; }
.panel.flush { padding: 0; overflow: hidden; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.panel.flush > .panel-head { padding: 16px 20px; margin: 0; border-bottom: 1px solid var(--border-subtle); }
.panel-title { font-size: 16px; font-weight: 500; }
.panel-sub { font-size: 13px; color: var(--fg-3); margin-top: 2px; }
.panel.danger { border-color: rgba(181, 51, 51, 0.35); }
.rows > .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; }
.rows > .row:first-child { padding-top: 0; }
.rows > .row:last-child { border-bottom: 0; padding-bottom: 0; }
.row-title { font-size: 14px; font-weight: 500; }
.row-desc { font-size: 13px; color: var(--fg-3); margin-top: 2px; }
.row-title.danger { color: var(--error); }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.stat { background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 12px 14px; min-width: 0; }
html.dark .stat { background: var(--bg-surface-1); }
.stat-label { font-size: 12px; color: var(--fg-3); }
.stat-value { font-family: var(--font-serif); font-size: 24px; margin-top: 2px; overflow-wrap: anywhere; }
.stat-value.sm { font-family: var(--font-sans); font-size: 15px; font-weight: 500; margin-top: 4px; }
.stat-value.ok { color: var(--success); }
.stat-value.bad { color: var(--error); }
.empty { text-align: center; padding: 40px 16px; color: var(--fg-3); font-size: 14px; }

/* ---------- Lists ---------- */
.list { display: flex; flex-direction: column; }
.list-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--border-subtle); min-width: 0; }
.list-item:last-child { border-bottom: 0; }
.list-item.clickable { cursor: pointer; }
.list-item.clickable:hover { background: var(--hover); }
.list-main { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
.list-name { font-size: 14px; font-weight: 500; overflow-wrap: anywhere; }
.list-meta { font-size: 12px; color: var(--fg-3); }
.logo-tile { width: 36px; height: 36px; flex: 0 0 36px; border-radius: var(--radius-md); background: var(--bg-surface-2); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.oauth-app-favicon { display: block; width: 100%; height: 100%; object-fit: contain; }
.oauth-app-favicon:not([src]), .oauth-app-favicon[src=""], .client-logo-img:not([src]), .client-logo-img[src=""], .oauth-app-favicon.hidden, .client-logo-img.hidden { display: none; }
.oauth-scope-line { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; max-height: 44px; overflow: hidden; }
.oauth-scope-chip { font: 500 11px/1 var(--font-mono); padding: 4px 7px; border-radius: var(--radius-sm); background: var(--bg-surface-2); color: var(--fg-3); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.table-wrap { overflow-x: auto; }
.oauth-authorizations-card, .oauth-client-row { overflow: visible !important; }
table { width: 100%; border-collapse: collapse; font-size: 14px; text-align: left; }
th { font-weight: 500; font-size: 12px; color: var(--fg-3); padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); white-space: nowrap; }
td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr.clickable { cursor: pointer; }
tbody tr.clickable:hover { background: var(--hover); }

/* ---------- Buttons ---------- */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: var(--radius-md); border: 1px solid var(--border-medium); background: var(--bg-surface-0); color: var(--fg); font-size: 14px; font-weight: 500; white-space: nowrap; cursor: pointer; transition: background .12s, border-color .12s; }
.btn:hover:not(:disabled) { background: var(--hover); }
.btn:active:not(:disabled) { background: var(--active); }
.btn:disabled { opacity: .5; }
.btn.primary { background: var(--fg); color: var(--bg); border-color: var(--fg); }
.btn.primary:hover:not(:disabled) { background: var(--fg-2); border-color: var(--fg-2); }
.btn.accent { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
.btn.accent:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
.btn.danger { color: var(--error); border-color: rgba(181, 51, 51, 0.35); background: transparent; }
.btn.danger:hover:not(:disabled) { background: var(--error-subtle); }
.btn.ghost, .btn.secondary { background: transparent; border-color: transparent; }
.btn.secondary { border-color: var(--border-medium); }
.btn.ghost:hover:not(:disabled) { background: var(--hover); }
.btn.sm { height: 30px; padding: 0 10px; font-size: 13px; }
.btn.icon { width: 32px; height: 32px; padding: 0; }
.btn.block { width: 100%; }
.status-pill, .badge { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: var(--radius-full); background: var(--bg-surface-2); color: var(--fg-2); font-size: 12px; font-weight: 500; white-space: nowrap; }
.badge.success { background: var(--success-subtle); color: var(--success); }
.badge.warn { background: var(--warning-subtle); color: var(--warning); }
.badge.bad { background: var(--error-subtle); color: var(--error); }
.status-dot-available { width: 8px; height: 8px; border-radius: 50%; background: var(--success); display: inline-block; }

/* ---------- Inputs ---------- */
.input, .krix-select, select, textarea.input { width: 100%; height: 38px; padding: 0 12px; background: var(--bg-surface-0); border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-size: 14px; color: var(--fg); transition: border-color .12s, box-shadow .12s; }
textarea.input { height: auto; padding: 10px 12px; line-height: 1.5; resize: vertical; font-family: var(--font-mono); font-size: 13px; }
.input:focus, select:focus, textarea.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.input.mono { font-family: var(--font-mono); font-size: 13px; }
.input::placeholder { color: var(--fg-3); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field > label { font-size: 13px; font-weight: 500; }
.search, .krix-pill-search { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; background: var(--bg-surface-0); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); color: var(--fg-3); min-width: 0; width: 100%; max-width: 360px; }
.search:focus-within, .krix-pill-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.search input, .krix-pill-search input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; font-size: 14px; color: var(--fg); height: 100%; }
.search.block { max-width: none; }
.settings-secret-control { display: flex; align-items: center; gap: 4px; }
.settings-secret-control input { flex: 1; min-width: 0; }
input[type="checkbox"]:not(.krix-switch input) { accent-color: var(--accent); width: 16px; height: 16px; }
.krix-switch { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
.krix-switch input { position: absolute; opacity: 0; inset: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; z-index: 1; }
.krix-slider { position: absolute; inset: 0; border-radius: 20px; background: var(--bg-surface-3); transition: background .15s; }
.krix-slider::before { content: ""; position: absolute; width: 16px; height: 16px; left: 2px; top: 2px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25); transition: transform .15s; }
.krix-switch input:checked + .krix-slider { background: var(--accent); }
.krix-switch input:checked + .krix-slider::before { transform: translateX(16px); }
.krix-switch input:focus-visible + .krix-slider { outline: 2px solid var(--accent); outline-offset: 2px; }
.krix-switch input:disabled + .krix-slider { opacity: .5; }

/* ---------- Tabs and chips ---------- */
.tabs, .density-toggle, .theme-mode-control, .store-view-toggle { display: inline-flex; gap: 2px; padding: 3px; background: var(--bg-surface-2); border-radius: var(--radius-lg); }
.nav-pill, .theme-mode-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: var(--radius-md); font-size: 13px; font-weight: 500; color: var(--fg-3); white-space: nowrap; }
.nav-pill:hover, .theme-mode-button:hover { color: var(--fg); }
.nav-pill.active, .theme-mode-button.active { background: var(--bg-surface-0); color: var(--fg); box-shadow: var(--shadow-sm); }
html.dark .nav-pill.active, html.dark .theme-mode-button.active { background: var(--bg-surface-3); }
.theme-mode-button { width: 36px; padding: 0; }
.category-filter-grid, .chips { display: flex; flex-wrap: wrap; gap: 8px; }
.category-filter-pill, .chip { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: var(--radius-full); border: 1px solid var(--border-medium); color: var(--fg-2); font-size: 13px; white-space: nowrap; background: transparent; }
.category-filter-pill:hover, .chip:hover { background: var(--hover); color: var(--fg); }
.category-filter-pill.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }

/* ---------- Code ---------- */
.codeblock { background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; }
html.dark .codeblock { background: var(--bg-side); }
.codeblock-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 8px 8px 14px; font-size: 12px; color: var(--fg-3); border-bottom: 1px solid var(--border-subtle); font-family: var(--font-mono); }
.codeblock pre { padding: 14px; font-size: 13px; line-height: 1.6; overflow-x: auto; white-space: pre; }
.inline-code, .api-client-id-box code { font-family: var(--font-mono); font-size: 12.5px; background: var(--bg-surface-2); padding: 2px 6px; border-radius: var(--radius-sm); }
.endpoint-row { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 14px; background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); font-family: var(--font-mono); font-size: 13px; min-width: 0; }
.endpoint-row code { flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; }
.key-display-scroll { overflow-x: auto; white-space: nowrap; }
kbd { font-size: 11px; padding: 1px 6px; background: var(--bg-surface-2); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--fg-3); }

/* ---------- Composer-style hero ---------- */
.hero { text-align: center; padding: 8vh 0 24px; }
.hero-title { font-family: var(--font-serif); font-size: clamp(30px, 5vw, 40px); font-weight: 400; letter-spacing: -0.02em; }
.hero-sub { margin: 10px auto 0; color: var(--fg-3); font-size: 16px; max-width: 52ch; }
.composer { background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: 20px; box-shadow: var(--shadow-md); padding: 14px; text-align: left; }
.composer .endpoint-row { border: 0; background: transparent; padding: 4px 4px 4px 6px; font-size: 14px; }
.composer-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; flex-wrap: wrap; }

/* ---------- Menus ---------- */
.krix-dropdown { position: relative; display: inline-block; }
.krix-dropdown-menu { display: none; position: absolute; min-width: 200px; padding: 6px; background: var(--bg-surface-0); border-radius: var(--radius-lg); box-shadow: var(--shadow-popover); z-index: var(--z-dropdown); flex-direction: column; gap: 1px; }
.krix-dropdown-menu.active { display: flex; animation: pop .12s ease-out; }
.krix-dropdown-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: var(--radius-md); font-size: 14px; color: var(--fg); text-align: left; cursor: pointer; }
.krix-dropdown-item svg { color: var(--fg-3); flex-shrink: 0; }
.krix-dropdown-item:hover { background: var(--hover); }
.krix-dropdown-item.danger, .krix-dropdown-item.danger svg { color: var(--error); }
.krix-dropdown-item.danger:hover { background: var(--error-subtle); }
.krix-dropdown-divider { height: 1px; background: var(--border-subtle); margin: 4px 2px; }
.krix-kebab-trigger { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); color: var(--fg-3); }
.krix-kebab-trigger:hover { background: var(--hover); color: var(--fg); }
.sb-menu { position: absolute; left: 8px; right: 8px; bottom: calc(100% + 4px); }
.sb-collapsed .sb-menu { right: auto; width: 240px; }
.profile-menu-head { padding: 8px 10px 10px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px; }
.profile-menu-name { font-size: 14px; font-weight: 500; }
.profile-menu-email { font-size: 12px; color: var(--fg-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.krix-custom-dropdown { position: relative; display: inline-block; min-width: 160px; }
.krix-dropdown-trigger { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; height: 36px; padding: 0 10px 0 12px; border: 1px solid var(--border-medium); border-radius: var(--radius-md); background: var(--bg-surface-0); font-size: 14px; text-align: left; }
.krix-dropdown-trigger:hover { background: var(--hover); }
.krix-dropdown-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.krix-dropdown-chevron { display: inline-flex; color: var(--fg-3); }
.krix-custom-dropdown.open .krix-dropdown-chevron { transform: rotate(180deg); }
.krix-dropdown-popover { position: absolute; top: calc(100% + 4px); left: 0; min-width: 100%; max-height: 280px; overflow-y: auto; padding: 6px; background: var(--bg-surface-0); border-radius: var(--radius-lg); box-shadow: var(--shadow-popover); z-index: var(--z-dropdown); animation: pop .12s ease-out; }
.krix-dropdown-option { padding: 8px 10px; border-radius: var(--radius-md); font-size: 14px; cursor: pointer; white-space: nowrap; }
.krix-dropdown-option:hover { background: var(--hover); }
.krix-dropdown-option.selected { background: var(--active); font-weight: 500; }
.krix-dropdown-native { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

/* ---------- Modal, drawer, toast, palette ---------- */
.modal-backdrop { display: none; position: fixed; inset: 0; background: var(--scrim); z-index: var(--z-modal); align-items: center; justify-content: center; padding: 16px; overscroll-behavior: contain; }
.modal-card { width: 100%; max-width: 440px; max-height: calc(100dvh - 32px); overflow-y: auto; background: var(--bg-surface-0); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 24px; box-shadow: var(--shadow-lg); animation: pop .14s ease-out; }
.modal-title { font-family: var(--font-serif); font-size: 20px; font-weight: 400; }
.modal-text { margin-top: 6px; font-size: 14px; color: var(--fg-3); }
.modal-body { margin: 18px 0; display: flex; flex-direction: column; gap: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(480px, 100vw); background: var(--bg-surface-0); border-left: 1px solid var(--border-subtle); z-index: var(--z-drawer); transform: translateX(105%); transition: transform .2s ease; display: flex; flex-direction: column; padding: 0 20px; }
.drawer-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 0 24px; display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 640px) { .drawer { width: 100vw; } }
#krixToastContainer, .toast-container { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: var(--z-toast); pointer-events: none; width: max-content; max-width: calc(100vw - 32px); }
.krix-toast { pointer-events: auto; display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 14px; background: var(--fg); color: var(--bg); border-radius: var(--radius-lg); font-size: 14px; box-shadow: var(--shadow-lg); animation: toast-in .16s ease-out; }
.krix-toast-icon { display: flex; }
.krix-toast-icon svg { stroke: currentColor !important; }
.krix-toast.error { background: var(--error); color: #fff; }
.krix-toast-close { color: inherit; opacity: .7; font-size: 18px; line-height: 1; padding: 0 4px; }
.krix-toast-close:hover { opacity: 1; }
.toast { pointer-events: auto; padding: 10px 14px; background: var(--fg); color: var(--bg); border-radius: var(--radius-lg); font-size: 14px; opacity: 0; transform: translateY(6px); transition: opacity .16s, transform .16s; }
.toast.show { opacity: 1; transform: none; }
.toast.error { background: var(--error); color: #fff; }
.krix-palette-overlay { display: none; position: fixed; inset: 0; background: var(--scrim); z-index: var(--z-modal); align-items: flex-start; justify-content: center; padding: 12vh 16px 16px; }
.krix-palette-overlay.active { display: flex; }
.krix-palette-dialog { width: 100%; max-width: 560px; background: var(--bg-surface-0); border-radius: 20px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-subtle); overflow: hidden; animation: pop .14s ease-out; }
.krix-palette-search { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); color: var(--fg-3); }
.krix-palette-input { flex: 1; border: 0; background: transparent; outline: none; font-size: 16px; color: var(--fg); }
.krix-palette-results { padding: 6px; max-height: 320px; overflow-y: auto; }
.krix-palette-item { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: var(--radius-md); font-size: 14px; }
.krix-palette-item svg { color: var(--fg-3); }
.krix-palette-item:hover, .krix-palette-item.selected { background: var(--hover); }
.krix-palette-path { margin-left: auto; font-size: 12px; color: var(--fg-3); font-family: var(--font-mono); }
.krix-palette-footer { display: flex; gap: 16px; padding: 10px 16px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--fg-3); }
@keyframes pop { from { opacity: 0; transform: scale(.98) translateY(-2px); } to { opacity: 1; transform: none; } }
@keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.tools-grid.concise .tool-desc { display: none; }
.tools-grid.verbose .tool-desc { display: block; margin-top: 2px; }
.tools-grid .list-item { content-visibility: auto; contain-intrinsic-size: 52px; }
.tools-grid .list-meta { overflow: hidden; text-overflow: ellipsis; }
.tools-grid.concise .list-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---------- Tool toggle grid ---------- */
.settings-tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; margin-top: 16px; }
.settings-tool-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); min-width: 0; }
.tool-toggle-row[style*="display: none"] { display: none; }

.chart { min-height: 140px; display: flex; align-items: flex-end; gap: 8px; padding: 8px 0 0; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
.bar { width: 100%; max-width: 40px; background: var(--accent); border-radius: 4px 4px 0 0; opacity: .9; }
.bar-label { font-size: 11px; font-family: var(--font-mono); color: var(--fg-3); }
.text-ok { color: var(--success); }
.text-bad { color: var(--error); }

.file-tile { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: var(--radius-md); background: var(--bg-surface-2); }
.store-grid { display: none; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; padding: 16px 20px; }
.store-grid-card { display: flex; flex-direction: column; gap: 12px; padding: 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); min-width: 0; }
.store-row[style*="display: none"], .store-grid-card[style*="display: none"] { display: none; }

/* ---------- Pager, progress, misc ---------- */
.pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 2px 0; font-size: 13px; color: var(--fg-3); flex-wrap: wrap; }
.pager-btn { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px; border: 1px solid var(--border-medium); border-radius: var(--radius-md); font-size: 13px; color: var(--fg); background: var(--bg-surface-0); }
.pager-btn:hover:not(:disabled) { background: var(--hover); }
.pager-btn:disabled { opacity: .4; }
.progress { height: 6px; border-radius: 6px; background: var(--bg-surface-3); overflow: hidden; }
.progress > span { display: block; height: 100%; background: var(--accent); border-radius: 6px; }
.dropzone { border: 1.5px dashed var(--border-medium); border-radius: var(--radius-xl); padding: 40px 20px; text-align: center; color: var(--fg-3); cursor: pointer; transition: background .12s, border-color .12s; }
.dropzone:hover, .dropzone.dragover { background: var(--accent-soft); border-color: var(--accent); }
.auth-gate { min-height: 50vh; display: flex; align-items: center; justify-content: center; padding: 24px 0; }
.auth-gate-card { max-width: 420px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.auth-gate-card h2 { font-family: var(--font-serif); font-size: 26px; font-weight: 400; }
.prose { font-size: 15px; line-height: 1.7; color: var(--fg-2); }
.prose h2 { font-family: var(--font-serif); font-size: 20px; font-weight: 500; color: var(--fg); margin: 28px 0 8px; }
.prose p + p { margin-top: 10px; }
.prose ul, .prose ol { padding-left: 22px; margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.prose a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
.prose strong { color: var(--fg); font-weight: 600; }
.center-screen { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; }

@media (max-width: 640px) {
  .btn, .krix-dropdown-trigger, .input { min-height: 40px; }
  .modal-card { padding: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
`;
}
