export function getDocsCss(): string {
  return `
:root {
  --t-clay: #b4553a; --t-clay-bg: rgba(198, 97, 63, 0.13);
  --t-olive: #5b6f43; --t-olive-bg: rgba(120, 140, 93, 0.18);
  --t-sky: #3b73a3; --t-sky-bg: rgba(106, 155, 204, 0.18);
  --t-kraft: #8f6234; --t-kraft-bg: rgba(212, 162, 127, 0.26);
  --t-fig: #7a4768; --t-fig-bg: rgba(150, 90, 130, 0.14);
  --t-cactus: #2f7260; --t-cactus-bg: rgba(61, 122, 106, 0.15);
  --t-slate: #4f4e49; --t-slate-bg: rgba(85, 84, 79, 0.12);
}
html.dark {
  --t-clay: #e8957a; --t-clay-bg: rgba(217, 119, 87, 0.18);
  --t-olive: #a9bf8b; --t-olive-bg: rgba(120, 140, 93, 0.24);
  --t-sky: #8fbbe3; --t-sky-bg: rgba(106, 155, 204, 0.22);
  --t-kraft: #e6bc98; --t-kraft-bg: rgba(212, 162, 127, 0.2);
  --t-fig: #cfa3c1; --t-fig-bg: rgba(150, 90, 130, 0.26);
  --t-cactus: #82c9b5; --t-cactus-bg: rgba(61, 122, 106, 0.28);
  --t-slate: #c9c7bd; --t-slate-bg: rgba(222, 220, 209, 0.1);
}
[data-tint="clay"] { --t: var(--t-clay); --tb: var(--t-clay-bg); }
[data-tint="olive"] { --t: var(--t-olive); --tb: var(--t-olive-bg); }
[data-tint="sky"] { --t: var(--t-sky); --tb: var(--t-sky-bg); }
[data-tint="kraft"] { --t: var(--t-kraft); --tb: var(--t-kraft-bg); }
[data-tint="fig"] { --t: var(--t-fig); --tb: var(--t-fig-bg); }
[data-tint="cactus"] { --t: var(--t-cactus); --tb: var(--t-cactus-bg); }
[data-tint="slate"] { --t: var(--t-slate); --tb: var(--t-slate-bg); }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
body[data-tab] .page.docs-page { max-width: 1240px; padding-top: 40px; }
.docs-page *, .docs-page *::before, .docs-page *::after { min-width: 0; }
.docs-page code, .docs-page .inline-code { overflow-wrap: anywhere; }

.tile { width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--t, var(--fg)); background: var(--tb, var(--bg-surface-2)); }
.tile.lg { width: 56px; height: 56px; border-radius: 16px; }
.docs-logo-badge { width: 44px; height: 44px; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; background: #141413; border: 1px solid rgba(250,249,245,0.14); flex-shrink: 0; padding: 7px; }
.docs-logo-badge img { width: 100%; height: 100%; display: block; border-radius: 6px; }
.docs-pill { display: inline-flex; align-items: center; padding: 3px 11px; border-radius: var(--radius-full); font-size: 12.5px; font-weight: 500; background: var(--tb, var(--bg-surface-2)); color: var(--t, var(--fg-2)); white-space: nowrap; }
.docs-link { color: var(--fg); text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }
.docs-link:hover { color: var(--accent); }

/* Hub hero (2-column split matching homepage aesthetic, no eyebrow kicker) */
.docs-hero-split { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr); gap: 36px; align-items: center; padding: 6px 0 36px; }
.docs-title { font-family: var(--font-serif); font-weight: 400; font-size: clamp(34px, 5vw, 54px); line-height: 1.07; letter-spacing: -0.026em; text-wrap: balance; }
.docs-title strong { font-weight: 500; }
.docs-lede { margin-top: 16px; max-width: 58ch; font-size: clamp(16px, 1.6vw, 18px); line-height: 1.62; color: var(--fg-2); }
.docs-search { position: relative; margin-top: 26px; max-width: 520px; }
.docs-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--fg-3); display: inline-flex; pointer-events: none; }
.docs-search input { width: 100%; height: 52px; padding: 0 54px 0 46px; font-size: 16px; border-radius: 15px; border: 1px solid var(--border-medium); background: var(--bg-surface-0); color: var(--fg); transition: border-color .15s, box-shadow .15s; }
.docs-search input::placeholder { color: var(--fg-3); }
.docs-search input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 4px var(--accent-soft); outline: none; }
.docs-search kbd { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); min-width: 24px; height: 24px; padding: 0 7px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; color: var(--fg-3); border: 1px solid var(--border-medium); border-bottom-width: 2px; border-radius: 6px; background: var(--bg-surface-1); }
.docs-hero-cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
.docs-hero-art { display: flex; justify-content: center; align-items: center; }
.doc-hero-svg { width: 100%; max-width: 270px; height: auto; display: block; }

/* Dark Streamable HTTP Transport Card with Krix Logo */
.docs-transport {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 28px 36px;
  align-items: center;
  padding: 32px 34px;
  border-radius: 24px;
  background: #141413;
  color: #faf9f5;
  border: 1px solid rgba(250, 249, 245, 0.1);
}
.docs-transport-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.docs-transport-eyebrow { font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: #d97757; }
.docs-transport-title { font-family: var(--font-serif); font-weight: 400; font-size: clamp(24px, 3vw, 32px); line-height: 1.15; letter-spacing: -0.02em; color: #faf9f5; }
.docs-transport-sub { margin-top: 10px; font-size: 15px; line-height: 1.6; color: #b8b6ad; max-width: 48ch; }
.docs-transport-sub code { padding: 1px 6px; border-radius: 6px; background: rgba(250, 249, 245, 0.09); color: #faf9f5; font-size: 0.88em; }
.docs-transport-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.docs-dark-btn { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 15px; border-radius: 11px; font-size: 13.5px; font-weight: 500; border: 1px solid rgba(250, 249, 245, 0.16); background: rgba(250, 249, 245, 0.06); color: #faf9f5; transition: background .15s, border-color .15s; }
.docs-dark-btn:hover { background: rgba(250, 249, 245, 0.13); border-color: rgba(250, 249, 245, 0.28); }
.docs-dark-btn.primary { background: #d97757; border-color: #d97757; color: #141413; font-weight: 600; }
.docs-dark-btn.primary:hover { background: #e38667; border-color: #e38667; }
.docs-transport-box { padding: 18px 20px; border-radius: 16px; background: #1c1c1a; border: 1px solid rgba(250, 249, 245, 0.1); display: flex; flex-direction: column; gap: 14px; }
.docs-transport-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-family: var(--font-mono); font-size: 11.5px; color: #9c9a92; }
.docs-transport-url { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: 11px; background: #111110; border: 1px solid rgba(250, 249, 245, 0.1); }
.docs-transport-url code { font-family: var(--font-mono); font-size: 13px; color: #faf9f5; overflow-wrap: anywhere; flex: 1 1 160px; }
.docs-copy-dark { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px; border-radius: 8px; border: 1px solid rgba(250, 249, 245, 0.16); background: rgba(250, 249, 245, 0.08); color: #faf9f5; font-size: 12.5px; font-weight: 500; cursor: pointer; flex-shrink: 0; transition: background .14s; }
.docs-copy-dark:hover { background: rgba(250, 249, 245, 0.16); }
.docs-transport-headers { display: flex; flex-direction: column; gap: 6px; font-family: var(--font-mono); font-size: 12.5px; color: #d4d2c9; }
.docs-transport-headers span { color: #d97757; }

/* Graphic frame & subtle reduced-motion-safe SVG animations */
.doc-graphic-frame {
  margin: 14px 0 22px;
  padding: 16px;
  border-radius: 18px;
  background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}
.doc-diagram { width: 100%; height: auto; display: block; }
@keyframes doc-dash { to { stroke-dashoffset: -36; } }
@keyframes doc-pulse-anim { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
.doc-flow-line { animation: doc-dash 2.8s linear infinite; }
.doc-pulse { animation: doc-pulse-anim 3.2s ease-in-out infinite; }

/* Scroll reveal */
.doc-reveal {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity .44s cubic-bezier(0.22, 1, 0.36, 1), transform .44s cubic-bezier(0.22, 1, 0.36, 1);
}
.doc-reveal.is-visible { opacity: 1; transform: none; }

/* Sections */
.docs-section { margin-top: 56px; }
.docs-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px 20px; flex-wrap: wrap; margin-bottom: 20px; }
.docs-section-title { font-family: var(--font-serif); font-size: clamp(25px, 3vw, 32px); font-weight: 400; letter-spacing: -0.018em; line-height: 1.15; }
.docs-section-sub { margin-top: 6px; max-width: 60ch; font-size: 15px; color: var(--fg-3); }
.docs-count { font-size: 13px; color: var(--fg-3); }

/* Guides */
.guide-feature { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 28px 40px; padding: 30px; border-radius: 22px; background: var(--tb); border: 1px solid var(--border-subtle); transition: border-color .18s, transform .22s cubic-bezier(0.22, 1, 0.36, 1); }
.guide-feature:hover { border-color: var(--border-medium); transform: translateY(-2px); }
.guide-feature h3 { margin-top: 16px; font-family: var(--font-serif); font-weight: 400; font-size: clamp(24px, 3vw, 32px); line-height: 1.15; letter-spacing: -0.015em; }
.guide-feature p { margin-top: 10px; font-size: 15.5px; line-height: 1.6; color: var(--fg-2); }
.guide-feature ul { list-style: none; display: flex; flex-direction: column; gap: 12px; align-self: center; }
.guide-feature li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: var(--bg-surface-0); border: 1px solid var(--border-subtle); font-size: 14.5px; line-height: 1.45; }
.guide-feature li svg { color: var(--t); flex-shrink: 0; margin-top: 2px; }
.guide-meta { display: flex; align-items: center; gap: 14px; margin-top: 20px; font-size: 13.5px; color: var(--fg-2); }
.guide-go { display: inline-flex; align-items: center; gap: 4px; font-weight: 500; color: var(--fg); }
.guide-list { list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 44px; margin-top: 12px; }
.guide-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 16px; align-items: start; height: 100%; padding: 22px 12px; border-top: 1px solid var(--border-subtle); border-radius: 12px; transition: background .14s, transform .18s cubic-bezier(0.22, 1, 0.36, 1); }
.guide-row:hover { background: var(--hover); transform: translateX(2px); }
.guide-row h3 { font-family: var(--font-serif); font-size: 19px; font-weight: 500; line-height: 1.25; }
.guide-row p { margin-top: 5px; font-size: 14px; line-height: 1.55; color: var(--fg-3); }
.guide-row-meta { margin-top: 8px; font-size: 12.5px; color: var(--fg-3); }
.guide-row > svg { margin-top: 12px; color: var(--fg-3); transition: color .14s, transform .14s; }
.guide-row:hover > svg { color: var(--accent); transform: translateX(2px); }
.docs-empty { padding: 28px; border: 1px dashed var(--border-medium); border-radius: 16px; text-align: center; color: var(--fg-3); }

/* Tool groups */
.groups { list-style: none; border-top: 1px solid var(--border-subtle); }
.group-row { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) 120px minmax(0, 1.2fr); gap: 12px 24px; align-items: center; padding: 18px 4px; border-bottom: 1px solid var(--border-subtle); }
.group-name { font-weight: 500; font-size: 15px; }
.group-name a { display: inline-block; margin-top: 3px; font-weight: 400; font-size: 13px; }
.group-bar { display: flex; align-items: center; gap: 12px; }
.group-track { flex: 1; height: 8px; border-radius: 4px; background: var(--bg-surface-3); overflow: hidden; }
.group-fill { display: block; height: 100%; border-radius: 4px; background: var(--t, var(--accent)); }
.group-count { width: 62px; flex-shrink: 0; font-size: 13px; color: var(--fg-2); text-align: right; }
.group-need { font-size: 13.5px; color: var(--fg-3); line-height: 1.5; }

/* FAQ (smooth animated accordions) */
.docs-faq-list { border-top: 1px solid var(--border-subtle); }
.docs-faq { border-bottom: 1px solid var(--border-subtle); }
.docs-faq summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 4px; cursor: pointer; list-style: none; font-family: var(--font-serif); font-size: 18.5px; line-height: 1.35; user-select: none; }
.docs-faq summary::-webkit-details-marker { display: none; }
.docs-faq summary::after { content: ""; width: 20px; height: 20px; flex-shrink: 0; background: linear-gradient(var(--fg-3), var(--fg-3)) center / 14px 1.5px no-repeat, linear-gradient(var(--fg-3), var(--fg-3)) center / 1.5px 14px no-repeat; transition: transform .24s cubic-bezier(0.22, 1, 0.36, 1); }
.docs-faq[open] summary::after { transform: rotate(45deg); }
.docs-faq summary:hover { color: var(--accent); }
.docs-faq-body { padding: 0 4px 22px; max-width: 70ch; font-size: 15px; line-height: 1.7; color: var(--fg-2); }
.docs-faq-body a { color: var(--fg); text-decoration: underline; text-decoration-color: var(--accent); text-underline-offset: 3px; }

.docs-policies { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 56px; }
.docs-policy { display: flex; gap: 14px; align-items: center; padding: 18px; border: 1px solid var(--border-subtle); border-radius: 16px; background: var(--bg-surface-0); transition: border-color .16s, transform .2s cubic-bezier(0.22, 1, 0.36, 1); }
.docs-policy:hover { border-color: var(--border-medium); transform: translateY(-2px); }
.docs-policy strong { display: block; font-weight: 500; font-size: 15px; }
.docs-policy span.d { display: block; margin-top: 2px; font-size: 13px; color: var(--fg-3); line-height: 1.4; }

/* Article layout */
.docs-crumbs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 22px; font-size: 13.5px; color: var(--fg-3); }
.docs-crumbs a:hover { color: var(--fg); text-decoration: underline; }
.docs-head { display: flex; gap: 20px; align-items: flex-start; padding-bottom: 32px; margin-bottom: 8px; border-bottom: 1px solid var(--border-subtle); }
.docs-head-body { flex: 1; }
.docs-head h1 { font-family: var(--font-serif); font-weight: 400; font-size: clamp(30px, 4.4vw, 46px); line-height: 1.08; letter-spacing: -0.025em; text-wrap: balance; }
.docs-head-sub { margin-top: 12px; max-width: 64ch; font-size: 17px; line-height: 1.6; color: var(--fg-2); }
.docs-head-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-top: 18px; font-size: 13.5px; color: var(--fg-3); }
.docs-grid { display: grid; grid-template-columns: 220px minmax(0, 1fr) 215px; gap: 44px; align-items: start; margin-top: 32px; }
.docs-grid.legal { grid-template-columns: 230px minmax(0, 1fr); gap: 56px; }
.docs-rail { position: sticky; top: 80px; max-height: calc(100vh - 100px); max-height: calc(100dvh - 100px); overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px; }
.docs-rail-label { padding: 0 10px 8px; font-size: 13px; color: var(--fg-3); }
.docs-rail a { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; font-size: 14px; color: var(--fg-2); line-height: 1.3; transition: background .12s, color .12s; }
.docs-rail a svg { color: var(--fg-3); flex-shrink: 0; }
.docs-rail a:hover { background: var(--hover); color: var(--fg); }
.docs-rail a[aria-current="page"] { background: var(--tb, var(--accent-soft)); color: var(--t, var(--accent)); font-weight: 500; }
.docs-rail a[aria-current="page"] svg { color: var(--t, var(--accent)); }

/* Bulleted TOC (clean, zero brackets, smooth mobile accordion) */
.docs-toc { position: sticky; top: 80px; display: flex; flex-direction: column; border-left: 1px solid var(--border-subtle); }
.docs-toc-label { padding: 0 0 10px 16px; font-size: 13px; color: var(--fg-3); }
.docs-toc a { position: relative; padding: 6px 0 6px 16px; font-size: 13.5px; line-height: 1.4; color: var(--fg-3); transition: color .12s; }
.docs-toc a:hover { color: var(--fg); }
.docs-toc a[aria-current="true"] { color: var(--fg); font-weight: 500; }
.docs-toc a[aria-current="true"]::before { content: ""; position: absolute; left: -1px; top: 4px; bottom: 4px; width: 2px; background: var(--accent); border-radius: 2px; }

.docs-toc-m { display: none; margin-top: 20px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-surface-0); }
.docs-toc-m summary { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; cursor: pointer; list-style: none; font-size: 14.5px; font-weight: 500; user-select: none; }
.docs-toc-m summary::-webkit-details-marker { display: none; }
.docs-toc-m summary svg { transition: transform .24s cubic-bezier(0.22, 1, 0.36, 1); color: var(--fg-3); }
.docs-toc-m[open] summary svg { transform: rotate(180deg); color: var(--accent); }
.docs-toc-bullets { list-style: none; margin: 0; padding: 10px 16px 14px; border-top: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 8px; }
.docs-toc-bullets li { position: relative; padding-left: 14px; line-height: 1.45; }
.docs-toc-bullets li::before { content: ""; position: absolute; left: 0; top: 0.58em; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
.docs-toc-bullets a { font-size: 14px; color: var(--fg-2); display: inline-block; transition: color .14s; }
.docs-toc-bullets a:hover { color: var(--fg); }

.docs-chips { display: none; gap: 8px; margin: 22px -24px 0; padding: 2px 24px 6px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; }
.docs-chips::-webkit-scrollbar { display: none; }
.docs-chips a { flex-shrink: 0; scroll-snap-align: start; display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: var(--radius-full); border: 1px solid var(--border-medium); font-size: 13.5px; color: var(--fg-2); white-space: nowrap; background: var(--bg-surface-0); }
.docs-chips a[aria-current="page"] { background: var(--fg); color: var(--bg); border-color: var(--fg); }

/* Article body */
.doc-main { display: flex; flex-direction: column; }
.doc-section { scroll-margin-top: 84px; padding: 40px 0; border-top: 1px solid var(--border-subtle); }
.doc-section:first-of-type { padding-top: 0; border-top: 0; }
.doc-section-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; margin-bottom: 16px; }
.doc-section h2 { display: flex; align-items: baseline; gap: 12px; margin: 0; font-family: var(--font-serif); font-size: clamp(23px, 2.8vw, 30px); font-weight: 400; line-height: 1.2; letter-spacing: -0.018em; }
.doc-section h2 .num { flex-shrink: 0; min-width: 1.6ch; color: var(--accent); font-size: 0.82em; }
.doc-body > p, .doc-body li, .doc-body .doc-subcard p, .doc-body .doc-step-body p { font-size: 15.5px; line-height: 1.72; color: var(--fg-2); }
.doc-body > p { max-width: 68ch; }
.doc-body > p + p, .doc-body > p + .doc-grid-2, .doc-body > p + .doc-grid-3, .doc-body > p + .doc-chip-row { margin-top: 14px; }
.doc-body strong { color: var(--fg); font-weight: 600; }
.doc-body a:not(.btn) { color: var(--fg); text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }
.doc-body a:not(.btn):hover { color: var(--accent); }
.doc-body h4 { font-size: 15.5px; font-weight: 600; color: var(--fg); line-height: 1.35; }
.doc-body .inline-code, .legal-body .inline-code { padding: 1px 6px; border-radius: 6px; background: var(--bg-surface-2); border: 1px solid var(--border-subtle); font-size: 0.86em; color: var(--fg); }
.doc-body > div + p, .doc-body > ol + p, .doc-body > ul + p { margin-top: 16px; }
.doc-list { margin: 14px 0 0 22px; display: flex; flex-direction: column; gap: 9px; max-width: 70ch; }
.doc-list li::marker { color: var(--accent); }

.doc-steps { list-style: none; display: flex; flex-direction: column; margin-top: 18px; }
.doc-step { position: relative; display: grid; grid-template-columns: 38px minmax(0, 1fr); gap: 18px; padding-bottom: 24px; }
.doc-step:last-child { padding-bottom: 0; }
.doc-step:not(:last-child)::before { content: ""; position: absolute; left: 18px; top: 42px; bottom: 4px; width: 1px; background: var(--border-medium); }
.doc-step-num { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; border: 1px solid var(--border-medium); background: var(--bg-surface-0); font-family: var(--font-serif); font-size: 17px; color: var(--accent); }
.doc-step-body { padding-top: 6px; }
.doc-step-body p { margin-top: 4px; max-width: 62ch; }

.doc-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
.doc-grid-2:has(.doc-code) { grid-template-columns: minmax(0, 1fr); }
.doc-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
.doc-subcard { display: flex; flex-direction: column; gap: 10px; padding: 20px; border: 1px solid var(--border-subtle); border-radius: 16px; background: var(--bg-surface-0); }
.doc-subcard-head { display: flex; align-items: center; gap: 10px; color: var(--fg); }
.doc-subcard-head svg { flex-shrink: 0; }
.doc-subcard .doc-list { margin-top: 4px; margin-left: 18px; }
.doc-subcard .doc-list li { font-size: 14.5px; line-height: 1.6; }
.doc-mini-card { padding: 16px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-surface-1); }
.doc-mini-card p { font-size: 14px; line-height: 1.6; color: var(--fg-2); }
.doc-mono-title { display: inline-block; margin-bottom: 8px; padding: 2px 9px; border-radius: 8px; background: var(--accent-soft); color: var(--accent); font-family: var(--font-mono); font-size: 13px; font-weight: 600; }
.doc-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.doc-chip-row .doc-pill { background: var(--bg-surface-2); color: var(--fg-2); border: 1px solid var(--border-subtle); }

.doc-code { margin-top: 12px; border: 1px solid var(--border-subtle); border-radius: 14px; overflow: hidden; background: var(--bg-surface-1); }
.doc-code-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 8px 6px 14px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface-2); font-family: var(--font-mono); font-size: 12.5px; color: var(--fg-3); }
.doc-code pre { margin: 0; padding: 14px 16px; overflow-x: auto; white-space: pre; font-size: 13px; line-height: 1.65; color: var(--fg); }
.doc-code pre code { overflow-wrap: normal; }
.doc-endpoint-card { display: flex; flex-direction: column; gap: 12px; margin-top: 18px; padding: 16px; border: 1px solid var(--border-subtle); border-radius: 16px; background: var(--bg-surface-1); }
.doc-endpoint-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.doc-endpoint-note { font-size: 13px; color: var(--fg-3); }
.docs-page .endpoint-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 8px 8px 8px 14px; border: 1px solid var(--border-medium); border-radius: 12px; background: var(--bg-surface-0); }
.docs-page .endpoint-row code { flex: 1 1 170px; white-space: normal; overflow-wrap: anywhere; font-size: 13.5px; line-height: 1.5; color: var(--fg); }
.docs-page .endpoint-row .btn { flex-shrink: 0; }

.doc-callout { display: flex; gap: 12px; align-items: flex-start; margin-top: 20px; padding: 16px 18px; border-radius: 14px; border: 1px solid var(--border-subtle); border-left: 3px solid var(--accent); background: var(--bg-surface-1); }
.doc-callout-warn { border-left-color: var(--warning); background: var(--warning-subtle); }
.doc-callout-tip { border-left-color: var(--success); background: var(--success-subtle); }
.doc-callout-icon { margin-top: 2px; color: var(--accent); flex-shrink: 0; }
.doc-callout-warn .doc-callout-icon { color: var(--warning); }
.doc-callout-tip .doc-callout-icon { color: var(--success); }
.doc-callout-title { margin-bottom: 4px; font-size: 14.5px; font-weight: 600; color: var(--fg); }
.doc-callout-text { font-size: 14.5px; line-height: 1.65; color: var(--fg-2); }

.doc-table-wrap { margin-top: 16px; border: 1px solid var(--border-subtle); border-radius: 14px; overflow-x: auto; background: var(--bg-surface-0); }
.doc-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.doc-table th { padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 500; color: var(--fg-3); background: var(--bg-surface-1); border-bottom: 1px solid var(--border-subtle); white-space: nowrap; }
.doc-table td { padding: 14px 16px; vertical-align: top; line-height: 1.65; color: var(--fg-2); border-bottom: 1px solid var(--border-subtle); }
.doc-table tbody tr:last-child td { border-bottom: 0; }
.doc-table td:first-child { color: var(--fg); }

.doc-pager { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 40px; }
.doc-pager-card { display: flex; flex-direction: column; gap: 6px; padding: 18px 20px; border: 1px solid var(--border-subtle); border-radius: 16px; background: var(--bg-surface-0); transition: border-color .16s, transform .18s cubic-bezier(0.22, 1, 0.36, 1); }
.doc-pager-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.doc-pager-next { text-align: right; align-items: flex-end; }
.doc-pager-dir { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--fg-3); }
.doc-pager-title { font-family: var(--font-serif); font-size: 18px; line-height: 1.3; color: var(--fg); }
.docs-help { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 40px; padding: 22px 24px; border-radius: 18px; background: var(--bg-surface-2); }
.docs-help strong { display: block; font-family: var(--font-serif); font-size: 19px; font-weight: 500; }
.docs-help span.d { display: block; margin-top: 3px; font-size: 14px; color: var(--fg-3); }

/* Legal */
.legal-tabs { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-top: 22px; padding: 4px; border-radius: 12px; background: var(--bg-surface-2); }
.legal-tabs a { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 14px; border-radius: 9px; font-size: 13.5px; font-weight: 500; color: var(--fg-2); white-space: nowrap; transition: background .14s, color .14s; }
.legal-tabs a:hover { color: var(--fg); background: var(--hover); }
.legal-tabs a[aria-current="page"] { background: var(--bg-surface-0); color: var(--fg); box-shadow: var(--shadow-sm); }
.legal-facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; margin-top: 12px; border: 1px solid var(--border-subtle); border-radius: 20px; background: var(--bg-surface-0); overflow: hidden; }
.legal-fact { display: flex; flex-direction: column; gap: 10px; padding: 22px; border-left: 1px solid var(--border-subtle); }
.legal-fact:first-child { border-left: 0; }
.legal-fact h3 { font-family: var(--font-serif); font-size: 18px; font-weight: 500; line-height: 1.25; }
.legal-fact p { font-size: 14px; line-height: 1.6; color: var(--fg-3); }
.legal-facts-title { margin-top: 32px; font-size: 14px; color: var(--fg-3); }
.legal-body { display: flex; flex-direction: column; }
.legal-sec { scroll-margin-top: 84px; display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 0 8px; padding: 36px 0; border-top: 1px solid var(--border-subtle); }
.legal-sec:first-of-type { border-top: 0; padding-top: 0; }
.legal-num { font-family: var(--font-serif); font-size: 30px; line-height: 1.1; color: var(--accent); }
.legal-sec h2 { font-family: var(--font-serif); font-weight: 400; font-size: clamp(22px, 2.6vw, 28px); line-height: 1.2; letter-spacing: -0.016em; margin-bottom: 14px; }
.legal-text p, .legal-text li { font-size: 15.5px; line-height: 1.75; color: var(--fg-2); max-width: 68ch; }
.legal-text p + p { margin-top: 12px; }
.legal-text ul { margin: 14px 0 0 20px; display: flex; flex-direction: column; gap: 10px; }
.legal-text li::marker { color: var(--accent); }
.legal-text strong { color: var(--fg); font-weight: 600; }
.legal-text a { color: var(--fg); text-decoration: underline; text-decoration-color: var(--accent); text-underline-offset: 3px; }
.legal-text a:hover { color: var(--accent); }
.legal-caps { font-size: 13.5px !important; letter-spacing: 0.01em; }
.legal-contact { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 12px; padding: 24px; border-radius: 18px; background: var(--bg-surface-2); }
.legal-contact strong { display: block; font-family: var(--font-serif); font-size: 20px; font-weight: 500; }
.legal-contact span.d { display: block; margin-top: 4px; font-size: 14px; color: var(--fg-3); max-width: 52ch; }

@media (max-width: 1180px) {
  .docs-grid { grid-template-columns: 220px minmax(0, 1fr); gap: 40px; }
  .docs-toc { display: none; }
  .docs-toc-m { display: block; }
  .docs-grid > .docs-rail ~ .doc-main .docs-toc-m { margin-top: 0; margin-bottom: 28px; }
  .docs-grid.legal > .docs-toc { display: flex; }
  .docs-grid.legal .docs-toc-m { display: none; }
}
@media (max-width: 960px) {
  body[data-tab] .page.docs-page { padding-top: 28px; }
  .docs-hero-split { grid-template-columns: minmax(0, 1fr); gap: 24px; padding-bottom: 28px; }
  .docs-hero-art { order: -1; }
  .doc-hero-svg { max-width: 210px; }
  .docs-transport { grid-template-columns: minmax(0, 1fr); padding: 24px 20px; gap: 22px; border-radius: 20px; }
  .guide-feature { grid-template-columns: minmax(0, 1fr); padding: 24px; }
  .guide-list { grid-template-columns: minmax(0, 1fr); }
  .group-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .group-need { grid-column: 1 / -1; }
  .docs-policies { grid-template-columns: minmax(0, 1fr); margin-top: 44px; }
  .docs-grid, .docs-grid.legal { grid-template-columns: minmax(0, 1fr); gap: 0; margin-top: 8px; }
  .docs-rail { display: none; }
  .docs-chips { display: flex; }
  .docs-toc-m { display: block; }
  .docs-grid.legal > .docs-toc { display: none; }
  .docs-grid.legal .docs-toc-m { display: block; margin-top: 0; margin-bottom: 8px; }
  .legal-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .legal-fact:nth-child(3) { border-left: 0; }
  .legal-fact:nth-child(n+3) { border-top: 1px solid var(--border-subtle); }
  .docs-section { margin-top: 44px; }
}
@media (max-width: 640px) {
  body[data-tab] .page.docs-page { padding-left: 18px; padding-right: 18px; }
  .docs-chips { margin-left: -18px; margin-right: -18px; padding-left: 18px; padding-right: 18px; }
  .docs-head { gap: 14px; }
  .docs-head .tile.lg { width: 44px; height: 44px; border-radius: 13px; }
  .docs-head-sub { font-size: 16px; }
  .docs-search kbd { display: none; }
  .docs-search input { padding-right: 16px; }
  .docs-title { letter-spacing: -0.02em; }
  .doc-graphic-frame { padding: 10px; border-radius: 14px; }
  .group-row { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .doc-grid-2, .doc-grid-3, .doc-pager, .legal-facts { grid-template-columns: minmax(0, 1fr); }
  .legal-fact, .legal-fact:nth-child(3) { border-left: 0; }
  .legal-fact:nth-child(n+2) { border-top: 1px solid var(--border-subtle); }
  .doc-section { padding: 32px 0; }
  .doc-body > p, .doc-body li, .legal-text p, .legal-text li { font-size: 15px; }
  .doc-step { grid-template-columns: 32px minmax(0, 1fr); gap: 14px; }
  .doc-step-num { width: 32px; height: 32px; font-size: 15px; }
  .doc-step:not(:last-child)::before { left: 15px; top: 36px; }
  .doc-subcard { padding: 16px; }
  .doc-pager-next { text-align: left; align-items: flex-start; }
  .guide-row { grid-template-columns: auto minmax(0, 1fr); padding: 18px 6px; }
  .guide-row > svg { display: none; }
  .legal-sec { grid-template-columns: minmax(0, 1fr); padding: 30px 0; }
  .legal-num { font-size: 22px; margin-bottom: 4px; }
  .docs-help, .legal-contact { padding: 18px; }
  .doc-table-wrap { border: 0; background: transparent; overflow: visible; }
  .doc-table, .doc-table tbody, .doc-table tr, .doc-table td { display: block; width: 100%; }
  .doc-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
  .doc-table tr { margin-bottom: 12px; padding: 4px 14px; border: 1px solid var(--border-subtle); border-radius: 14px; background: var(--bg-surface-0); }
  .doc-table td { padding: 10px 0; border-bottom: 1px solid var(--border-subtle); }
  .doc-table td:last-child { border-bottom: 0; }
  .doc-table td[data-label]::before { content: attr(data-label); display: block; margin-bottom: 3px; font-size: 12.5px; color: var(--fg-3); }
}
@media (hover: none) { .docs-search kbd { display: none; } }
@media (prefers-reduced-motion: reduce) {
  .docs-faq summary::after, .docs-toc-m summary svg, .guide-feature, .guide-row, .doc-pager-card, .docs-policy { transition: none; }
  .doc-flow-line, .doc-pulse { animation: none; }
  .doc-reveal { opacity: 1; transform: none; transition: none; }
}
@media print {
  .topbar, .sidebar, .docs-rail, .docs-toc, .docs-toc-m, .docs-chips, .legal-tabs, .docs-help, .doc-pager, #krixToastContainer { display: none !important; }
  .main { padding-top: 0 !important; }
  body[data-tab] .page.docs-page { max-width: none; padding: 0; }
  .docs-grid, .docs-grid.legal { display: block; }
  .legal-sec, .doc-section { break-inside: avoid-page; }
}
`;
}
