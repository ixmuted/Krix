// Standardized SVG Vector Registry and Brand Asset Handlers for Krix
// Standard 24x24 viewBox with 1.75px stroke width adhering to Geist & Lucide guidelines

export const SVG_ICONS: Record<string, string> = {
  // Brand & Infrastructure Vectors
  github: `<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>`,
  render: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`,

  // Top 24 Popular AI Application Logos & Connectors (OAuth 2.1 Handshake)
  // Brand marks are intentionally not approximated here. Provider marks load from the
  // provider website favicon; this neutral icon is only the failure/unknown fallback.
  gemini: `<path d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64 5.64 18.36"/><circle cx="12" cy="12" r="2.5"/>`,
  claude: `<path d="M12 3.2 13.8 9l5.8 1.8-5.8 1.8-1.8 5.8-1.8-5.8L4.4 10.8 10.2 9 12 3.2Z"/>`,
  chatgpt: `<circle cx="12" cy="12" r="9"/><path d="m9 10 3-2 3 2v4l-3 2-3-2z"/>`,
  antigravity: `<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><circle cx="12" cy="12" r="3"/>`,
  codex: `<path d="m7 8-4 4 4 4"/><path d="m17 8 4 4-4 4"/><path d="m14 4-4 16"/>`,
  cursor: `<polygon points="3 3 10 21 13 13 21 10 3 3"/><line x1="13" x2="20" y1="13" y2="20"/>`,
  windsurf: `<path d="M4 18c4-6 6-12 14-14-2 8-8 10-14 14z"/><path d="M7 17l10-10"/>`,
  cline: `<rect width="18" height="14" x="3" y="5" rx="3"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><line x1="12" x2="12" y1="2" y2="5"/>`,
  roocode: `<path d="M18 10c0-4-3-7-7-7S4 6 4 10c0 5 4 10 8 11 4-1 6-6 6-11z"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="9" r="1.5"/>`,
  continue: `<circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8"/>`,
  zed: `<polygon points="5 5 19 5 8 19 19 19"/>`,
  aider: `<circle cx="9" cy="8" r="4"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="3"/><path d="M15 17c1.5-.6 3.5-.6 5 0"/>`,
  perplexity: `<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/><circle cx="12" cy="12" r="4"/>`,
  mistral: `<path d="M4 4h4v4H4zM16 4h4v4h-4zM4 10h16v4H4zM4 16h4v4H4zM16 16h4v4h-4z"/>`,
  grok: `<path d="M4 4l16 16M4 20L20 4"/><circle cx="12" cy="12" r="2"/>`,
  deepseek: `<path d="M3 14c4-6 10-8 18-4-3 5-9 9-18 4z"/><circle cx="15" cy="11" r="1.5"/>`,
  ollama: `<ellipse cx="12" cy="13" rx="7" ry="8"/><path d="M8 8l-2-5M16 8l2-5"/><circle cx="10" cy="12" r="1.2"/><circle cx="14" cy="12" r="1.2"/>`,
  lmstudio: `<polygon points="12 2 21 9 12 22 3 9 12 2"/>`,
  openwebui: `<rect width="18" height="18" x="3" y="3" rx="4"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>`,
  replit: `<path d="M4 4h7v5H4zM11 9h7v5h-7zM4 14h7v5H4z"/>`,
  bolt: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>`,
  lovable: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>`,
  v0: `<polygon points="12 3 2 20 22 20"/><circle cx="12" cy="14" r="2"/>`,
  quickwitty: `<circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M7 7l2 2M15 15l2 2M7 17l2-2M15 9l2-2"/>`,

  // Layout View Options (Store & Catalog)
  list: `<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>`,
  grid: `<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>`,

  // Core Functional Micro-Interaction Icons
  copy: `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`,
  check: `<path d="M20 6 9 17l-5-5"/>`,
  save: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>`,
  eye: `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,
  "eye-off": `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>`,
  trash: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
  edit: `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
  sliders: `<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/>`,
  settings: `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`,

  // Kebab Action Trigger (More-Vertical)
  kebab: `<circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>`,
  "more-vertical": `<circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>`,

  // Navigation, Search & Command
  home: `<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>`,
  activity: `<path d="M3 12h4l3-8 4 16 3-8h4"/>`,
  key: `<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>`,
  search: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
  command: `<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3z"/>`,
  terminal: `<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>`,
  cpu: `<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>`,
  database: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>`,
  "external-link": `<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`,
  download: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>`,
  upload: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>`,
  refresh: `<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>`,

  // Chevrons & Indicators
  "chevron-down": `<path d="m6 9 6 6 6-6"/>`,
  "chevron-up": `<path d="m18 15-6-6-6 6"/>`,
  "chevron-right": `<path d="m9 18 6-6-6-6"/>`,
  x: `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
  plus: `<path d="M5 12h14"/><path d="M12 5v14"/>`,
  minus: `<path d="M5 12h14"/>`,

  // Alerts & Badges
  info: `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`,
  alert: `<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>`,
  warning: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>`,
  "check-circle": `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`,
  shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>`,
  lock: `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  unlock: `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>`,

  // Files & Folders
  folder: `<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`,
  file: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>`,
  "file-text": `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>`,

  // Theme Icons
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>`,
  moon: `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`,
  monitor: `<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>`,
  layers: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
  zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  sparkles: `<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>`,
  link: `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,
  book: `<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 2v20"/>`,
};

export function renderSvg(
  name: string,
  size: number = 18,
  className: string = "",
): string {
  const content = SVG_ICONS[name] || SVG_ICONS["info"];
  const safeClass = className.replace(/[^a-zA-Z0-9 _-]/g, "");
  return `<svg class="${safeClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
}

export function renderGoogleLogoSvg(size: number = 18): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.09 3.665-5.17 3.665-9.12z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.31 7.34 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.69 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
  </svg>`;
}

export function getCanonicalLogoUrl(): string {
  return "/icon-48.png?v=2";
}

const APP_FAVICON_HOSTS: Array<[string[], string]> = [
  [["gemini", "google gemini"], "https://gemini.google.com"],
  [["claude", "anthropic"], "https://claude.ai"],
  [["chatgpt", "openai", "gpt"], "https://chatgpt.com"],
  [["cursor"], "https://cursor.com"],
  [["windsurf", "codeium"], "https://windsurf.com"],
  [["github", "copilot"], "https://github.com"],
  [["perplexity"], "https://www.perplexity.ai"],
  [["mistral", "lechat"], "https://mistral.ai"],
  [["deepseek"], "https://www.deepseek.com"],
  [["grok", "xai"], "https://grok.com"],
  [["replit"], "https://replit.com"],
  [["vercel", "v0"], "https://vercel.com"],
  [["zed"], "https://zed.dev"],
  [["ollama"], "https://ollama.com"],
  [["bolt"], "https://bolt.new"],
  [["lovable"], "https://lovable.dev"],
];

function safeWebsiteOrigin(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
    return parsed.origin;
  } catch {
    return undefined;
  }
}

/** Prefer the provider favicon, retry through Google's favicon proxy, then use a neutral SVG. */
export function getAppLogoSvg(name: string, size: number = 20, websiteUrl?: string): string {
  const q = (name || "").toLowerCase();
  const matched = APP_FAVICON_HOSTS.find(([aliases]) => aliases.some((alias) => q.includes(alias)));
  const origin = safeWebsiteOrigin(websiteUrl) || matched?.[1];
  const fallback = `<span class="app-logo-fallback" style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;">${renderSvg("layers", size)}</span>`;
  if (!origin) return fallback;
  const favicon = `${origin}/favicon.ico`;
  const proxy = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=64`;
  const safeFavicon = favicon.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const safeProxy = proxy.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<img class="oauth-app-favicon" src="${safeFavicon}" data-proxy-src="${safeProxy}" width="${size}" height="${size}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="if(this.dataset.proxySrc && this.src!==this.dataset.proxySrc){this.src=this.dataset.proxySrc;this.dataset.proxySrc='';}else{this.style.display='none';this.nextElementSibling.style.display='inline-flex';}"><span class="app-logo-fallback" style="display:none;align-items:center;justify-content:center;width:${size}px;height:${size}px;">${renderSvg("layers", size)}</span>`;
}
