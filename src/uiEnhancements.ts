/**
 * Krix visual system additions inspired by the information hierarchy and
 * restrained motion language of Quick-Witty. This module contains only
 * presentation primitives; it does not alter routes or application data.
 */

const GRAPHICS: Record<string, string> = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  arrowUp: '<path d="M12 19V5m-7 7 7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14m7-7-7 7-7-7"/>',
  arrowLeft: '<path d="M19 12H5m7 7-7-7 7-7"/>',
  arrowRight: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  chart: '<path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 6-7"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/>',
  key: '<circle cx="8" cy="15" r="5"/><path d="m12 11 8-8m-3 3 3 3m-6 0 3 3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8L6.3 12l1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8H14l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.9z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  fingerprint: '<path d="M12 11a2 2 0 0 0-2 2c0 3-.5 5-1.5 7M12 7a6 6 0 0 0-6 6c0 2-.2 4-1 6m7-16a10 10 0 0 1 10 10c0 2-.2 4-1 6M12 3a10 10 0 0 0-10 10m10-2a2 2 0 0 1 2 2c0 2.5-.3 5-1 7"/>',
  server: '<rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h6m-6 10h6"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 8.5 4.8 4.8 0 0 0 7 18z"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  folderCode: '<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m9 11-2 2 2 2m6-4 2 2-2 2m-2-5-2 6"/>',
  file: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>',
  fileCode: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7m-11 4-2 2 2 2m5-4 2 2-2 2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  json: '<path d="M8 3H6a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2m8-16h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-2"/><path d="m10 9 4 6m0-6-4 6"/>',
  branch: '<circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 6v12m12-13v2a6 6 0 0 1-6 6H6"/>',
  commit: '<circle cx="12" cy="12" r="3"/><path d="M3 12h6m6 0h6"/>',
  github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 0 0-1.4-3.6 4.8 4.8 0 0 0-.1-3.6s-1.2-.4-3.8 1.4a13 13 0 0 0-6.9 0C5.5 1.1 4.3 1.5 4.3 1.5a4.8 4.8 0 0 0-.1 3.6 5.2 5.2 0 0 0-1.4 3.6c0 5.2 3.2 6.4 6.2 6.7A3.4 3.4 0 0 0 8 18.1V22"/>',
  render: '<path d="M4 19.5 12 3l8 16.5H4z"/><path d="M8 15h8"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 4-2 4s2.7-.5 4-2l2-2-2-2z"/><path d="M14 4c3-2 6-2 7-1 1 1 1 4-1 7l-7 7-6-6z"/><path d="m9 8 7 7"/><circle cx="15.5" cy="8.5" r="1.5"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  radar: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 6M12 12l7-4"/><circle cx="12" cy="12" r="2"/>',
  gauge: '<path d="M4 19a9 9 0 1 1 16 0"/><path d="m12 13 5-5m-5 5-2 2"/><path d="M7 19h10"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5"/>',
  network: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10.5 7.5-4 9m7 0-4-9m-1.5 11h8"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  filter: '<path d="M4 5h16M7 12h10m-7 7h4"/><circle cx="8" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/>',
  sort: '<path d="M8 6h12M8 12h8M8 18h4m-7-14v16m-3-3 3 3 3-3"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-4 4.7M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7c1.5 0 2.8-.4 4-1"/>',
  trash: '<path d="M3 6h18m-2 0-1 14H6L5 6m3 0V4h8v2m-6 4v6m4-6v6"/>',
  pencil: '<path d="m3 17.5 11.5-11.5 4.5 4.5L7.5 22H3z"/><path d="m13 7 4.5 4.5M18 3l3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  warning: '<path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/><path d="M12 9v4m0 4h.01"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01"/>',
  command: '<path d="M9 7V5a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v14a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5m-18 5 9 5 9-5"/>',
  sliders: '<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 6h4"/>',
  sparkles: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l1 2.5 2.5 1-2.5 1L19 22l-1-2.5-2.5-1 2.5-1z"/>',
};

export type KrixGraphicName = keyof typeof GRAPHICS;

export function renderKrixGraphic(name: KrixGraphicName, size = 18, className = ""): string {
  const path = GRAPHICS[name];
  if (!path) return "";
  const safeClass = className.replace(/[^a-zA-Z0-9 _-]/g, "");
  return `<svg class="krix-graphic ${safeClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
}

const MOTIONS: Record<string, [string, string]> = {
  "fade-up": ["opacity:0;transform:translateY(14px)", "opacity:1;transform:translateY(0)"],
  "fade-down": ["opacity:0;transform:translateY(-14px)", "opacity:1;transform:translateY(0)"],
  "fade-left": ["opacity:0;transform:translateX(14px)", "opacity:1;transform:translateX(0)"],
  "fade-right": ["opacity:0;transform:translateX(-14px)", "opacity:1;transform:translateX(0)"],
  "slide-up": ["transform:translateY(24px)", "transform:translateY(0)"],
  "slide-down": ["transform:translateY(-24px)", "transform:translateY(0)"],
  "slide-left": ["transform:translateX(24px)", "transform:translateX(0)"],
  "slide-right": ["transform:translateX(-24px)", "transform:translateX(0)"],
  "scale-in": ["opacity:0;transform:scale(.94)", "opacity:1;transform:scale(1)"],
  "scale-out": ["opacity:0;transform:scale(1.06)", "opacity:1;transform:scale(1)"],
  "pop-in": ["opacity:0;transform:scale(.86)", "opacity:1;transform:scale(1)"],
  "float": ["transform:translateY(0)", "transform:translateY(-8px)"],
  "float-soft": ["transform:translateY(-3px)", "transform:translateY(3px)"],
  "drift": ["transform:translate3d(-4px,2px,0)", "transform:translate3d(4px,-2px,0)"],
  "pulse": ["opacity:.72;transform:scale(.98)", "opacity:1;transform:scale(1.02)"],
  "pulse-ring": ["opacity:.65;transform:scale(.88)", "opacity:0;transform:scale(1.65)"],
  "glow": ["box-shadow:0 0 0 rgba(100,160,255,0)", "box-shadow:0 0 26px rgba(100,160,255,.2)"],
  "shimmer": ["background-position:180% 0", "background-position:-80% 0"],
  "shine": ["transform:translateX(-130%) skewX(-18deg)", "transform:translateX(160%) skewX(-18deg)"],
  "spin": ["transform:rotate(0deg)", "transform:rotate(360deg)"],
  "spin-reverse": ["transform:rotate(360deg)", "transform:rotate(0deg)"],
  "orbit": ["transform:rotate(0deg) translateX(5px) rotate(0deg)", "transform:rotate(360deg) translateX(5px) rotate(-360deg)"],
  "blink": ["opacity:1", "opacity:.35"],
  "breathe": ["transform:scale(1);opacity:.85", "transform:scale(1.045);opacity:1"],
  "tilt": ["transform:rotate(-1.2deg)", "transform:rotate(1.2deg)"],
  "wiggle": ["transform:rotate(-3deg)", "transform:rotate(3deg)"],
  "shake": ["transform:translateX(-2px)", "transform:translateX(2px)"],
  "ripple": ["opacity:.4;transform:scale(.4)", "opacity:0;transform:scale(1.8)"],
  "wave": ["transform:translateY(0) rotate(0deg)", "transform:translateY(-5px) rotate(2deg)"],
  "scan": ["transform:translateY(-110%)", "transform:translateY(110%)"],
  "scanline": ["background-position:0 -100%", "background-position:0 200%"],
  "caret": ["border-color:currentColor", "border-color:transparent"],
  "dash": ["stroke-dashoffset:100", "stroke-dashoffset:0"],
  "draw": ["stroke-dasharray:100;stroke-dashoffset:100", "stroke-dasharray:100;stroke-dashoffset:0"],
  "blur-in": ["opacity:0;filter:blur(8px)", "opacity:1;filter:blur(0)"],
  "flip-in": ["opacity:0;transform:perspective(600px) rotateX(-12deg)", "opacity:1;transform:perspective(600px) rotateX(0)"],
  "roll-in": ["opacity:0;transform:translateX(-20px) rotate(-5deg)", "opacity:1;transform:translateX(0) rotate(0)"],
  "gradient-shift": ["background-position:0% 50%", "background-position:100% 50%"],
  "border-flow": ["background-position:0% 50%", "background-position:200% 50%"],
  "gradient-pan": ["background-position:100% 0", "background-position:0 100%"],
  "ping": ["opacity:.7;transform:scale(.75)", "opacity:0;transform:scale(1.45)"],
  "heartbeat": ["transform:scale(1)", "transform:scale(1.07)"],
};

export function getKrixDesignCss(): string {
  const motionCss = Object.entries(MOTIONS).map(([name, [from, to]]) => `
    @keyframes krix-${name} { from { ${from}; } to { ${to}; } }
    .motion-${name} { animation: krix-${name} ${name === "spin" || name === "spin-reverse" ? "8s" : "700ms"} cubic-bezier(.2,.7,.2,1) both; }
  `).join("\n");
  return `
    :root {
      --bg: #fafafa;
      --fg: #111111;
      --accents-1: #f5f5f5;
      --accents-2: #e5e5e5;
      --accents-3: #d4d4d4;
      --accents-4: #a3a3a3;
      --accents-5: #737373;
      --accents-6: #525252;
      --accents-7: #262626;
      --accents-8: #171717;
      --border: rgba(128,128,128,.23);
      --card-bg: rgba(255,255,255,.78);
      --card-sub: rgba(245,245,245,.82);
      --code-bg: rgba(245,245,245,.9);
      --accent: #2563eb;
      --success: #16a34a;
      --error: #dc2626;
      --header-bg: rgba(250,250,250,.84);
      --glass: rgba(255,255,255,.62);
      --shadow-soft: 0 12px 36px rgba(0,0,0,.055);
    }
    .dark {
      color-scheme: dark;
      --bg: #050505;
      --fg: #f5f5f5;
      --accents-1: #0b0b0b;
      --accents-2: #1b1b1b;
      --accents-3: #292929;
      --accents-4: #555;
      --accents-5: #8a8a8a;
      --accents-6: #a3a3a3;
      --accents-7: #d4d4d4;
      --accents-8: #f5f5f5;
      --border: rgba(255,255,255,.13);
      --card-bg: rgba(12,12,12,.82);
      --card-sub: rgba(18,18,18,.88);
      --code-bg: rgba(255,255,255,.035);
      --accent: #60a5fa;
      --success: #4ade80;
      --error: #fb7185;
      --header-bg: rgba(5,5,5,.84);
      --glass: rgba(15,15,15,.68);
      --shadow-soft: 0 14px 42px rgba(0,0,0,.32);
    }
    html { scroll-behavior:smooth; }
    body { font-family:Inter, Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing:-.012em; background-image:radial-gradient(rgba(128,128,128,.17) .75px,transparent .75px); background-size:22px 22px; }
    body:before { content:""; position:fixed; inset:0; pointer-events:none; z-index:-1; background:radial-gradient(ellipse at 50% -18%,rgba(90,130,210,.10),transparent 52%),linear-gradient(180deg,transparent 0%,rgba(120,120,120,.018) 100%); }
    a,button,input,select,textarea { -webkit-tap-highlight-color:transparent; }
    button,a { touch-action:manipulation; }
    :focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
    .wrapper { width:min(1100px,calc(100% - 40px)); max-width:1100px; margin:0 auto; }
    .nav-header { background:var(--header-bg); border-bottom:1px solid var(--border); backdrop-filter:blur(20px) saturate(145%); -webkit-backdrop-filter:blur(20px) saturate(145%); }
    .nav-inner { max-width:1100px; height:64px; padding:0 20px; }
    .brand-wrap { gap:10px; font-size:14px; letter-spacing:-.03em; }
    .brand-avatar { width:32px;height:32px;border-radius:9px;box-shadow:0 0 0 1px rgba(255,255,255,.04),0 4px 16px rgba(0,0,0,.12); }
    .nav-pills { gap:4px; }
    .nav-pill { padding:7px 12px; border:1px solid transparent; border-radius:9px; transition:background .18s,border-color .18s,color .18s; }
    .nav-pill:hover,.nav-pill.active { background:var(--glass); border-color:var(--border); }
    .theme-toggle-btn,.profile-trigger-btn { min-height:36px; border:1px solid var(--border); border-radius:11px; background:var(--glass); backdrop-filter:blur(16px); }
    .profile-dropdown-menu { border:1px solid var(--border); border-radius:14px; background:var(--glass); backdrop-filter:blur(24px) saturate(150%); -webkit-backdrop-filter:blur(24px) saturate(150%); box-shadow:var(--shadow-soft); padding:7px; }
    .profile-menu-item { border-radius:9px; min-height:38px; }
    .profile-menu-divider { height:1px;background:var(--border);margin:6px 4px; }
    .card { border-color:var(--border); border-radius:15px; background:var(--card-bg); box-shadow:var(--shadow-soft); transition:transform .22s cubic-bezier(.2,.7,.2,1),border-color .22s,box-shadow .22s; }
    .card:hover { border-color:rgba(128,128,128,.38); }
    .btn,.pagination-btn,.pill-btn { border-radius:10px; transition:transform .16s,background .16s,border-color .16s,box-shadow .16s; }
    .btn:hover,.pagination-btn:hover { transform:translateY(-1px); }
    .btn.primary { box-shadow:0 4px 14px rgba(37,99,235,.14); }
    input,select,textarea { border-radius:10px !important; }
    .badge { border-radius:999px; padding:4px 9px; letter-spacing:.01em; }
    .nav-right { gap:9px; }
    .profile-dropdown-wrap { position:relative; }
    .profile-dropdown-menu { min-width:218px; }
    .profile-menu-item { width:100%; display:flex; align-items:center; gap:10px; padding:9px 10px; color:var(--fg); text-decoration:none; font-size:12px; background:transparent; border:0; cursor:pointer; text-align:left; }
    .profile-menu-item:hover { background:var(--accents-1); }
    .profile-menu-item svg { flex:0 0 auto; opacity:.8; }
    .mobile-subnav { display:none !important; }
    .mobile-icon-nav { display:none; }
    .mobile-icon-nav-inner { display:flex; justify-content:space-around; align-items:center; gap:5px; max-width:520px; margin:8px auto 10px; padding:6px; border:1px solid var(--border); border-radius:16px; background:var(--glass); box-shadow:var(--shadow-soft); backdrop-filter:blur(20px) saturate(150%); }
    .mobile-icon-link { width:46px; height:42px; display:grid; place-items:center; border:1px solid transparent; border-radius:11px; color:var(--accents-5); text-decoration:none; transition:color .18s,background .18s,border-color .18s,transform .18s; }
    .mobile-icon-link svg { width:19px;height:19px; }
    .mobile-icon-link.active { color:var(--fg); border-color:var(--border); background:var(--card-bg); box-shadow:0 2px 10px rgba(0,0,0,.08); }
    .mobile-icon-link:active { transform:scale(.94); }
    .krix-command-trigger { display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:0 10px;border:1px solid var(--border);border-radius:10px;background:var(--glass);color:var(--accents-6);font:500 12px/1 ui-sans-serif,system-ui;cursor:pointer;transition:background .18s,border-color .18s,color .18s; }
    .krix-command-trigger:hover { color:var(--fg);border-color:var(--accents-4);background:var(--card-bg); }
    .krix-command-trigger kbd { padding:3px 5px;border:1px solid var(--border);border-radius:5px;background:var(--card-sub);font:10px ui-monospace,monospace;color:var(--accents-5); }
    .krix-command-backdrop { position:fixed;inset:0;z-index:10020;display:grid;place-items:start center;padding:12vh 18px 24px;background:rgba(0,0,0,.48);backdrop-filter:blur(7px);opacity:0;visibility:hidden;transition:opacity .16s,visibility .16s; }
    .krix-command-backdrop.open { opacity:1;visibility:visible; }
    .krix-command-backdrop[hidden] { display:none; }
    .krix-command-panel { width:min(560px,100%);max-height:min(620px,76vh);overflow:hidden;border:1px solid var(--border);border-radius:17px;background:var(--card-bg);backdrop-filter:blur(26px) saturate(150%);box-shadow:0 28px 100px rgba(0,0,0,.38);transform:translateY(-8px) scale(.985);transition:transform .18s; }
    .krix-command-backdrop.open .krix-command-panel { transform:translateY(0) scale(1); }
    .krix-command-head { display:flex;align-items:center;gap:11px;padding:17px 18px 14px;border-bottom:1px solid var(--border); }
    .krix-command-mark { display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--border);border-radius:10px;background:var(--card-sub);color:var(--accent); }
    .krix-command-head h2 { font-size:14px;font-weight:680;color:var(--fg);margin:0; }
    .krix-command-head p { color:var(--accents-5);font-size:11px;margin:3px 0 0; }
    .krix-command-head kbd { margin-left:auto;border:1px solid var(--border);border-radius:6px;padding:4px 6px;color:var(--accents-5);font:10px ui-monospace,monospace; }
    .krix-command-input-wrap { display:flex;align-items:center;gap:10px;margin:13px 15px 10px;padding:0 11px;min-height:43px;border:1px solid var(--border);border-radius:10px;background:var(--code-bg);color:var(--accents-5); }
    .krix-command-input-wrap input { flex:1;min-width:0;border:0!important;outline:none!important;background:transparent!important;color:var(--fg)!important;padding:0!important;font-size:13px!important;box-shadow:none!important; }
    .krix-command-label { padding:4px 18px 8px;color:var(--accents-5);font:600 9px ui-monospace,monospace;letter-spacing:.12em; }
    .krix-command-results { max-height:330px;overflow:auto;padding:0 8px 9px; }
    .krix-command-option { width:100%;display:flex;align-items:center;gap:11px;text-align:left;padding:10px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--fg);cursor:pointer; }
    .krix-command-option:hover,.krix-command-option.active { border-color:var(--border);background:var(--card-sub); }
    .krix-command-option-icon { display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--border);border-radius:9px;background:var(--glass);color:var(--accents-6);font-size:15px; }
    .krix-command-option-body { display:flex;flex:1;min-width:0;flex-direction:column;gap:3px; }
    .krix-command-option-body strong { font-size:12px;font-weight:600; }
    .krix-command-option-body small { color:var(--accents-5);font-size:10px; }
    .krix-command-enter { color:var(--accents-5);font-size:12px; }
    .krix-command-empty { padding:26px 12px;text-align:center;color:var(--accents-5);font-size:12px; }
    .krix-command-foot { display:flex;justify-content:space-between;gap:8px;padding:10px 16px;border-top:1px solid var(--border);color:var(--accents-5);font-size:10px; }
    .krix-footer-controls { display:flex;align-items:center;gap:12px; }
    .footer-theme-label { color:var(--accents-5);font-size:10px; }
    .footer-theme-switch { display:inline-flex;gap:3px;padding:3px;border:1px solid var(--border);border-radius:9px;background:var(--glass); }
    .footer-theme-switch button { display:grid;place-items:center;width:29px;height:27px;border:0;border-radius:6px;background:transparent;color:var(--accents-5);cursor:pointer; }
    .footer-theme-switch button:hover { background:var(--card-sub);color:var(--fg); }
    .footer-btn { display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);border-radius:8px;background:var(--glass);color:var(--accents-5);padding:7px 10px;font-size:10px;cursor:pointer; }
    .footer-to-top { width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--border);border-radius:50%;background:var(--glass);color:var(--accents-5);cursor:pointer; }
    .footer-to-top:hover { color:var(--fg);background:var(--card-sub); }
    .settings-header.page-heading { margin:30px 0 22px; }
    .settings-tabs { position:sticky;top:72px;z-index:5;backdrop-filter:blur(18px); }
    .settings-tabs a { white-space:nowrap; }
    .settings-header .settings-desc { max-width:650px;line-height:1.65; }
    .page-title-line { display:flex;align-items:center;gap:10px;flex-wrap:wrap; }
    .credentials-form-actions { display:flex;justify-content:flex-end;gap:10px;margin-top:16px; }
    .credential-remove-btn svg { flex:0 0 auto; }
    .krix-progress-line { transform-origin:left center;will-change:width; }
    .krix-reveal-pending { opacity:0;transform:translateY(12px); }
    .krix-reveal-visible { opacity:1;transform:none; }
    #resources,#integrations,#permissions { scroll-margin-top:86px; }
    #integrations .credentials-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px; }
    #integrations .field-group { min-width:0;padding:15px;border:1px solid var(--border);border-radius:12px;background:var(--card-sub); }
    #integrations .credential-remove-btn { margin-top:10px; }
    .tool-risk-control { flex-wrap:wrap; }
    .tool-risk-select { border-radius:8px!important; }
    .tool-perm-row { align-items:center; }
    .tool-perm-row:focus-within { background:var(--accents-1); }
    .resource-stat-box { border-radius:12px; }
    .page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; margin:34px 0 28px; }
    .page-heading h1 { font-size:clamp(26px,4vw,38px) !important; line-height:1.12; letter-spacing:-.045em !important; font-weight:720 !important; }
    .page-heading p { max-width:680px; margin-top:8px !important; line-height:1.65; font-size:14px !important; }
    .page-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .krix-eyebrow { display:inline-flex; align-items:center; gap:8px; margin-bottom:12px; font:600 10px/1.2 ui-monospace,monospace; letter-spacing:.13em; text-transform:uppercase; color:var(--accents-5); }
    .krix-eyebrow:before { content:""; width:6px;height:6px;border-radius:50%;background:var(--success);box-shadow:0 0 12px color-mix(in srgb,var(--success) 55%,transparent); }
    .krix-graphic { display:inline-block; vertical-align:middle; flex:0 0 auto; }
    .graphic-tile { width:44px;height:44px;display:grid;place-items:center;border:1px solid var(--border);border-radius:13px;background:linear-gradient(145deg,var(--glass),var(--card-sub));color:var(--accents-6);box-shadow:inset 0 1px rgba(255,255,255,.05); }
    .graphic-tile.accent { color:var(--accent); }
    .graphic-tile.success { color:var(--success); }
    .graphic-tile.danger { color:var(--error); }
    .visual-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px; }
    .visual-card { position:relative;isolation:isolate;overflow:hidden;border:1px solid var(--border);border-radius:14px;background:var(--card-bg);padding:16px; }
    .visual-card:after { content:"";position:absolute;right:-28px;top:-35px;width:105px;height:105px;border-radius:50%;background:radial-gradient(circle,rgba(96,165,250,.12),transparent 68%);z-index:-1;pointer-events:none; }
    .visual-card-title { font-size:13px;font-weight:650;color:var(--fg);margin-top:10px; }
    .visual-card-desc { font-size:11px;line-height:1.55;color:var(--accents-5);margin-top:4px; }
    .section-kicker { display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;color:var(--accents-5);font:600 10px/1.4 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase; }
    .table-scroll-container { max-width:100%;overscroll-behavior-inline:contain; }
    .key-row:hover td,.oauth-row:hover td { background:var(--accents-1); }
    .kebab-dropdown { border:1px solid var(--border);border-radius:12px;background:var(--glass);backdrop-filter:blur(22px);box-shadow:var(--shadow-soft);padding:6px; }
    .kebab-item { border-radius:8px;min-height:36px; }
    .secret-input-wrap input { padding-right:86px !important; }
    .settings-grid { gap:14px !important; }
    .settings-grid > .card { padding:20px !important; }
    .tool-perm-row { flex-wrap:wrap; padding:14px 15px; }
    .tool-perm-desc { white-space:normal;max-width:75ch; }
    .tool-risk-control { display:flex;align-items:center;gap:7px;flex:0 0 auto; }
    .tool-risk-select { min-width:118px;padding:6px 9px;border:1px solid var(--border);background:var(--code-bg);color:var(--fg);font-size:11px; }
    .risk-pill { display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border:1px solid var(--border);border-radius:999px;font-size:10px;font-weight:650;white-space:nowrap; }
    .risk-safe { color:#16a34a;background:rgba(22,163,74,.08); }
    .risk-low { color:#0ea5e9;background:rgba(14,165,233,.08); }
    .risk-moderate { color:#ca8a04;background:rgba(202,138,4,.09); }
    .risk-high { color:#ea580c;background:rgba(234,88,12,.09); }
    .risk-critical { color:#dc2626;background:rgba(220,38,38,.1); }
    .settings-tabs { display:flex;gap:6px;flex-wrap:wrap;padding:5px;border:1px solid var(--border);border-radius:12px;background:var(--glass);margin:0 0 18px; }
    .settings-tabs a { padding:8px 11px;border-radius:8px;color:var(--accents-5);text-decoration:none;font-size:12px; }
    .settings-tabs a:hover,.settings-tabs a.active { background:var(--card-bg);color:var(--fg);box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .credential-remove-btn { display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:7px 10px;border:1px solid rgba(220,38,38,.28);border-radius:9px;background:rgba(220,38,38,.06);color:var(--error);font-size:11px;font-weight:600;cursor:pointer; }
    .credential-remove-btn:hover { background:rgba(220,38,38,.12);border-color:var(--error); }
    .drop-zone { border-radius:15px !important; background:linear-gradient(145deg,var(--card-sub),var(--card-bg)) !important; transition:border-color .2s,background .2s,transform .2s !important; }
    .drop-zone:hover,.drop-zone.dragover { border-color:var(--accent) !important;transform:translateY(-2px); }
    .switch-wrap { border-radius:12px !important;background:var(--card-sub) !important; }
    .file-item { border-radius:11px !important; }
    footer.krix-footer { display:block;width:100%;max-width:none;margin-top:64px;padding:0;border-top:1px solid var(--border);background:var(--bg); }
    .krix-footer-main { max-width:1100px;margin:0 auto;padding:42px 20px 34px;display:grid;grid-template-columns:1.45fr 1fr 1fr 1fr;gap:34px; }
    .krix-footer-brand { max-width:230px; }
    .krix-footer-brand p { color:var(--accents-5);font-size:12px;line-height:1.7;margin-top:12px; }
    .krix-footer-title { color:var(--accents-5);font:600 10px/1.4 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;margin:2px 0 13px; }
    .krix-footer-links { display:flex;flex-direction:column;gap:10px; }
    .krix-footer-links a { color:var(--accents-5);font-size:12px;text-decoration:none;transition:color .15s; }
    .krix-footer-links a:hover { color:var(--fg); }
    .krix-footer-bottom { border-top:1px solid var(--border); }
    .krix-footer-bottom-inner { max-width:1100px;margin:0 auto;padding:15px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:var(--accents-5);font-size:11px; }
    .krix-footer-socials { display:flex;gap:7px;margin-top:14px; }
    .krix-footer-socials a { width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--border);border-radius:10px;color:var(--accents-5);text-decoration:none; }
    .krix-footer-socials a:hover { color:var(--fg);background:var(--card-sub); }
    .recaptcha-notice { max-width:1100px;margin:0 auto 14px !important;padding:0 20px; }
    .toast,.modal-card { border-radius:14px !important; }
    .modal-card { box-shadow:var(--shadow-soft); }
    .stat-card,.tool-card,.store-card { animation: krix-fade-up .55s both; }
    .card:focus-within { border-color:color-mix(in srgb,var(--accent) 40%,var(--border)); }
    .motion-on-hover:hover { animation:krix-float 1.6s ease-in-out infinite alternate; }
    .krix-progress-line { height:2px;position:fixed;top:0;left:0;z-index:1000;background:linear-gradient(90deg,#60a5fa,#a78bfa,#34d399);width:0; }
    ${motionCss}
    @media (max-width: 760px) {
      .wrapper { width:calc(100% - 28px); }
      .desktop-only-nav { display:none !important; }
      .nav-inner { height:58px;padding:0 14px; }
      .mobile-icon-nav { display:block; width:100%;padding:0 12px; }
      .mobile-icon-nav-inner { width:min(520px,100%); }
      .nav-right { margin-left:auto;gap:6px; }
      .krix-command-trigger { width:36px;padding:0;justify-content:center; }
      .krix-command-trigger span,.krix-command-trigger kbd { display:none; }
      .profile-trigger-name { display:none; }
      #integrations .credentials-grid { grid-template-columns:1fr; }
      .krix-footer-controls { width:100%;justify-content:space-between;flex-wrap:wrap; }
      .footer-theme-label { display:none; }
      .krix-command-backdrop { padding:8vh 12px 16px; }
      .profile-trigger-btn { padding:5px 8px !important; }
      .page-heading { margin:26px 0 20px;align-items:flex-start; }
      .page-heading h1 { font-size:28px !important; }
      .krix-footer-main { grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 20px;padding:30px 18px; }
      .krix-footer-brand { grid-column:1/-1;max-width:340px; }
      .krix-footer-bottom-inner { padding:14px 18px;flex-wrap:wrap; }
      .tool-perm-row { align-items:flex-start; }
      .tool-risk-control { width:100%;justify-content:flex-end; }
      .tool-risk-select { flex:1;max-width:180px; }
      .settings-tabs { overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none; }
      .settings-tabs::-webkit-scrollbar { display:none; }
      .key-display-scroll { max-width:calc(100vw - 170px) !important; }
    }
    @media (max-width: 420px) {
      .mobile-icon-link { width:42px;height:40px; }
      .krix-footer-main { gap:22px 14px; }
      .credentials-form-actions { width:100%; }
      .credentials-form-actions .btn { width:100%; }
      .page-actions { width:100%; }
      .page-actions .btn { flex:1;justify-content:center; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior:auto; }
      *,*::before,*::after { animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important; }
    }
  `;
}
