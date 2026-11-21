import { escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import { EFFECTIVE_DATE, REPO_URL, renderDocsShell, tintFor } from "./docsKit.js";
import { HELP_CORE } from "./helpContent.js";
import { HELP_MORE } from "./helpContentMore.js";
import type { HelpCategory } from "./helpTypes.js";

export type { HelpCategory, HelpSection } from "./helpTypes.js";

export const HELP_CATEGORIES: HelpCategory[] = [...HELP_CORE, ...HELP_MORE];

export function getHelpCategory(slug: string): HelpCategory | undefined {
  const clean = (slug || "").trim().toLowerCase();
  return HELP_CATEGORIES.find((c) => c.slug === clean);
}

const GROUPS = [
  { name: "Sandbox and local Git", count: 15, on: true, tint: "olive", need: "Server setting ENABLE_SANDBOX=true", href: "/help/sandbox", label: "Sandbox guide" },
  { name: "GitHub core", count: 17, on: true, tint: "slate", need: "GitHub token saved in Settings", href: "/help/github", label: "GitHub guide" },
  { name: "GitHub extended", count: 34, on: false, tint: "slate", need: "GitHub token, then switch on in Settings", href: "/help/github", label: "GitHub guide" },
  { name: "Render cloud", count: 21, on: false, tint: "sky", need: "Render API key, then switch on in Settings", href: "/help/render", label: "Render guide" },
  { name: "Code graph and web search", count: 30, on: false, tint: "cactus", need: "Switch on in Settings", href: "/help/code-graph", label: "Code graph guide" },
];

const FAQ: Array<[string, string]> = [
  [
    "Why do some tools not appear in my assistant?",
    `Krix hides tools that are switched off or missing a credential, so your assistant never wastes a turn calling them. Extended GitHub, Render and Code Graph start off. Switch them on in <a href="/settings">Settings</a> or on your key's page, and make sure the matching GitHub or Render token is saved.`,
  ],
  [
    "Which transport and URL should I use?",
    `Use the Streamable HTTP endpoint at <code class="inline-code">/mcp</code>. Current MCP clients expect it, and it accepts an API key header or OAuth 2.1 discovery. Start with <a href="/help/getting-started">Getting started</a> for copy-ready configs.`,
  ],
  [
    "Can I use different GitHub or Render credentials per API key?",
    `Yes. Open any key on <a href="/api/keys">API keys</a> to set key-specific provider tokens and tool overrides. Keys without overrides inherit your workspace settings.`,
  ],
  [
    "How are my tokens and sandbox files protected?",
    `Provider credentials are encrypted at rest with AES-256-GCM, scrubbed from tool output, and never exposed to sandbox processes. Each user's sandbox runs under an unprivileged Unix user in a private directory. Read <a href="/help/security-and-quotas">Security and quotas</a> and the <a href="/privacy">Privacy Policy</a> for the details.`,
  ],
  [
    "How long are shared and uploaded files kept?",
    `Files shared with <code class="inline-code">sandbox_store</code> expire after <code class="inline-code">FILE_TTL_HOURS</code> (typically 48 hours) unless you pin them as Permanent in <a href="/store">Files</a>. Web uploads from <a href="/upload">Upload</a> are kept for the configured retention window after the session closes.`,
  ],
  [
    "What happens if I delete my account?",
    `Deleting starts a 30-day grace period. Signing back in cancels it. After 30 days a background purge removes your keys, credentials, files and sandbox. See the <a href="/privacy#retention">retention table</a>.`,
  ],
];

function splitTitle(title: string): { num: string; text: string } {
  const m = title.match(/^(\d+)\.\s+(.*)$/);
  return m ? { num: m[1], text: m[2] } : { num: "", text: title };
}

function renderMap(mcpUrl: string): string {
  const left = [
    ["claude", "Claude"],
    ["cursor", "Cursor"],
    ["gemini", "Gemini"],
    ["chatgpt", "ChatGPT"],
  ]
    .map(([icon, name]) => `<div class="map-node">${renderSvg(icon, 18)}<span>${name}</span></div>`)
    .join("");
  const right = [
    ["github", "GitHub", "51 tools"],
    ["render", "Render", "21 tools"],
    ["terminal", "Sandbox", "15 tools"],
    ["layers", "Code graph", "30 tools"],
  ]
    .map(([icon, name, n]) => `<div class="map-node">${renderSvg(icon, 18)}<span>${name}</span><small>${n}</small></div>`)
    .join("");
  return `
    <div class="map" role="group" aria-label="How Krix connects assistants to tools">
      <div class="map-col"><div class="map-col-title">Your assistant</div>${left}</div>
      <div class="map-link" aria-hidden="true"></div>
      <div class="map-core" data-tint="clay">
        <div class="map-core-head">
          <span class="tile lg">${renderSvg("krix-spark", 26)}</span>
          <div><div class="map-core-name">Krix</div><div class="map-core-sub">MCP gateway, one URL</div></div>
        </div>
        <div class="endpoint-row">
          <code>${escapeHtml(mcpUrl)}</code>
          <button type="button" class="btn sm doc-copy-btn" data-copy="${escapeHtml(mcpUrl)}" aria-label="Copy MCP endpoint URL">${renderSvg("copy", 14)}<span>Copy</span></button>
        </div>
        <p class="map-core-note">Sign in with an <code class="inline-code">Authorization: Bearer</code> key, an <code class="inline-code">x-api-key</code> header, or OAuth 2.1 discovery.</p>
      </div>
      <div class="map-link" aria-hidden="true"></div>
      <div class="map-col"><div class="map-col-title">What it can reach</div>${right}</div>
    </div>
    <div class="docs-quick">
      <a href="/api/keys" class="btn sm">${renderSvg("key", 14)}<span>API keys</span></a>
      <a href="/settings" class="btn sm">${renderSvg("settings", 14)}<span>Settings</span></a>
      <a href="/tools" class="btn sm">${renderSvg("terminal", 14)}<span>Tools</span></a>
      <a href="/store" class="btn sm">${renderSvg("folder", 14)}<span>Files</span></a>
    </div>`;
}

function searchIndex(c: HelpCategory): string {
  return escapeHtml(`${c.title} ${c.summary} ${c.topics.join(" ")} ${c.keywords}`);
}

function renderFeature(c: HelpCategory): string {
  const topics = c.topics
    .map((t) => `<li>${renderSvg("check-circle", 16)}<span>${escapeHtml(t)}</span></li>`)
    .join("");
  return `
    <a href="/help/${escapeHtml(c.slug)}" class="guide-feature" data-tint="${tintFor(c.slug)}" data-guide data-search="${searchIndex(c)}">
      <div>
        <span class="docs-pill">${escapeHtml(c.badge)}</span>
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.summary)}</p>
        <div class="guide-meta"><span>${escapeHtml(c.readTime)}</span><span class="guide-go">Open the guide ${renderSvg("chevron-right", 15)}</span></div>
      </div>
      <ul>${topics}</ul>
    </a>`;
}

function renderRow(c: HelpCategory): string {
  return `
    <li data-guide data-search="${searchIndex(c)}">
      <a href="/help/${escapeHtml(c.slug)}" class="guide-row" data-tint="${tintFor(c.slug)}">
        <span class="tile">${renderSvg(c.icon, 20)}</span>
        <div>
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.summary)}</p>
          <div class="guide-row-meta">${escapeHtml(c.badge)} &middot; ${escapeHtml(c.readTime)}</div>
        </div>
        ${renderSvg("chevron-right", 18)}
      </a>
    </li>`;
}

function renderGroups(): string {
  const rows = GROUPS.map(
    (g) => `
      <li class="group-row" data-tint="${g.tint}">
        <div class="group-name">${escapeHtml(g.name)}<br><a class="docs-link" href="${g.href}">${escapeHtml(g.label)}</a></div>
        <div class="group-bar">
          <span class="group-track"><span class="group-fill" style="width:${Math.round((g.count / 34) * 100)}%"></span></span>
          <span class="group-count">${g.count} tools</span>
        </div>
        <div>${g.on ? '<span class="badge success">On by default</span>' : '<span class="badge">Opt-in</span>'}</div>
        <div class="group-need">${escapeHtml(g.need)}</div>
      </li>`,
  ).join("");
  return `<ul class="groups">${rows}</ul>`;
}

function renderFaq(): string {
  return `<div class="docs-faq-list">${FAQ.map(
    ([q, a]) => `
      <details class="docs-faq">
        <summary>${escapeHtml(q)}</summary>
        <div class="docs-faq-body">${a}</div>
      </details>`,
  ).join("")}</div>`;
}

function renderPolicies(): string {
  const items = [
    ["/privacy", "shield", "clay", "Privacy Policy", "What Krix stores and for how long"],
    ["/terms", "file-text", "kraft", "Terms of Service", "Rules for keys, sandboxes and quotas"],
    ["/help/security-and-quotas", "shield-check", "olive", "Security and quotas", "Isolation, limits and troubleshooting"],
  ];
  return `<div class="docs-policies">${items
    .map(
      ([href, icon, tint, name, d]) => `
      <a href="${href}" class="docs-policy" data-tint="${tint}">
        <span class="tile">${renderSvg(icon, 20)}</span>
        <span><strong>${name}</strong><span class="d">${d}</span></span>
      </a>`,
    )
    .join("")}</div>`;
}

export function renderHelpPage(params: {
  owner?: any;
  base?: string;
  nonce?: string;
}): string {
  const base = (params.base || "https://krix.onrender.com").replace(/\/+$/, "");
  const mcpUrl = `${base}/mcp`;
  const [first, ...rest] = HELP_CATEGORIES;

  const content = `
    <header class="docs-hero">
      <span class="docs-kicker"><i class="docs-dot"></i><span>Krix Documentation &amp; Help Center</span></span>
      <h1 class="docs-title">Set up Krix, then decide exactly what your assistant can touch.</h1>
      <p class="docs-lede">Connect Claude, Cursor, Gemini or any MCP client, manage keys and OAuth, and run code in a sandbox that keeps every user's files apart.</p>
      <div class="docs-search">
        <span class="docs-search-icon" aria-hidden="true">${renderSvg("search", 18)}</span>
        <label for="helpSearchInput" class="sr-only">Search guides</label>
        <input id="helpSearchInput" type="search" placeholder="Search guides" autocomplete="off" enterkeyhint="search">
        <kbd aria-hidden="true">/</kbd>
      </div>
      <div class="docs-try"><span>Try</span>
        <button type="button" data-fill="Cursor">Cursor</button>
        <button type="button" data-fill="OAuth">OAuth scopes</button>
        <button type="button" data-fill="GitHub">GitHub token</button>
        <button type="button" data-fill="quota">Quotas</button>
      </div>
    </header>

    ${renderMap(mcpUrl)}

    <section class="docs-section" aria-labelledby="guides-h">
      <div class="docs-section-head">
        <div>
          <h2 id="guides-h" class="docs-section-title">Guides</h2>
          <p class="docs-section-sub">Start with the first one. Each guide stands alone, so jump to whatever you need.</p>
        </div>
        <span id="helpCategoryCount" class="docs-count" aria-live="polite">${HELP_CATEGORIES.length} of ${HELP_CATEGORIES.length} guides</span>
      </div>
      ${renderFeature(first)}
      <ul class="guide-list">${rest.map(renderRow).join("")}</ul>
      <div id="helpSearchEmpty" class="docs-empty" hidden>No guides match that search. Try <strong>OAuth</strong>, <strong>GitHub</strong>, <strong>sandbox</strong>, <strong>Render</strong> or <strong>quotas</strong>.</div>
    </section>

    <section class="docs-section" aria-labelledby="groups-h">
      <div class="docs-section-head">
        <div>
          <h2 id="groups-h" class="docs-section-title">What works out of the box</h2>
          <p class="docs-section-sub">Krix ships 117 tools in five groups. Bars show how many tools each group adds.</p>
        </div>
      </div>
      ${renderGroups()}
    </section>

    <section class="docs-section" aria-labelledby="faq-h">
      <div class="docs-section-head"><h2 id="faq-h" class="docs-section-title">Common questions</h2></div>
      ${renderFaq()}
    </section>

    ${renderPolicies()}
  `;

  return renderDocsShell({
    title: "Help Center - Krix",
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}

export function renderHelpCategoryPage(params: {
  slug: string;
  owner?: any;
  base?: string;
  nonce?: string;
}): string | null {
  const category = getHelpCategory(params.slug);
  if (!category) return null;

  const base = (params.base || "https://krix.onrender.com").replace(/\/+$/, "");
  const mcpUrl = `${base}/mcp`;
  const idx = HELP_CATEGORIES.findIndex((c) => c.slug === category.slug);
  const prev = idx > 0 ? HELP_CATEGORIES[idx - 1] : null;
  const next = idx < HELP_CATEGORIES.length - 1 ? HELP_CATEGORIES[idx + 1] : null;
  const tint = tintFor(category.slug);

  const railLinks = HELP_CATEGORIES.map(
    (c) => `<a href="/help/${escapeHtml(c.slug)}" data-tint="${tintFor(c.slug)}"${c.slug === category.slug ? ' aria-current="page"' : ""}>${renderSvg(c.icon, 16)}<span>${escapeHtml(c.shortTitle)}</span></a>`,
  ).join("");
  const chips = HELP_CATEGORIES.map(
    (c) => `<a href="/help/${escapeHtml(c.slug)}"${c.slug === category.slug ? ' aria-current="page"' : ""}>${escapeHtml(c.shortTitle)}</a>`,
  ).join("");

  const tocLinks = category.sections
    .map((s) => `<a href="#${escapeHtml(s.id)}">${escapeHtml(splitTitle(s.title).text)}</a>`)
    .join("");

  const sections = category.sections
    .map((s) => {
      const t = splitTitle(s.title);
      return `
      <section id="${escapeHtml(s.id)}" class="doc-section doc-body">
        <h2>${t.num ? `<span class="num">${t.num}</span>` : ""}<span>${escapeHtml(t.text)}</span></h2>
        ${s.render({ base, mcpUrl })}
      </section>`;
    })
    .join("");

  const pager = `
    <nav class="doc-pager" aria-label="Adjacent guides">
      ${
        prev
          ? `<a href="/help/${escapeHtml(prev.slug)}" class="doc-pager-card"><span class="doc-pager-dir">${renderSvg("chevron-left", 14)} Previous</span><span class="doc-pager-title">${escapeHtml(prev.title)}</span></a>`
          : `<a href="/help" class="doc-pager-card"><span class="doc-pager-dir">${renderSvg("chevron-left", 14)} Back</span><span class="doc-pager-title">Help Center overview</span></a>`
      }
      ${
        next
          ? `<a href="/help/${escapeHtml(next.slug)}" class="doc-pager-card doc-pager-next"><span class="doc-pager-dir">Next ${renderSvg("chevron-right", 14)}</span><span class="doc-pager-title">${escapeHtml(next.title)}</span></a>`
          : `<a href="/tools" class="doc-pager-card doc-pager-next"><span class="doc-pager-dir">Explore ${renderSvg("chevron-right", 14)}</span><span class="doc-pager-title">Live tools catalog</span></a>`
      }
    </nav>`;

  const content = `
    <nav class="docs-crumbs" aria-label="Breadcrumb">
      <a href="/help">Help Center</a>
      ${renderSvg("chevron-right", 14)}
      <span aria-current="page">${escapeHtml(category.shortTitle)}</span>
    </nav>

    <header class="docs-head" data-tint="${tint}">
      <span class="tile lg" aria-hidden="true">${renderSvg(category.icon, 26)}</span>
      <div class="docs-head-body">
        <h1>${escapeHtml(category.title)}</h1>
        <p class="docs-head-sub">${escapeHtml(category.summary)}</p>
        <div class="docs-head-meta">
          <span class="docs-pill">${escapeHtml(category.badge)}</span>
          <span>${escapeHtml(category.readTime)}</span>
          <span>${category.sections.length} sections</span>
          <span>Updated ${EFFECTIVE_DATE}</span>
        </div>
      </div>
    </header>

    <nav class="docs-chips" aria-label="Guides">
      <a href="/help">Overview</a>${chips}
    </nav>

    <div class="docs-grid">
      <aside class="docs-rail" aria-label="Guides">
        <div class="docs-rail-label">Guides</div>
        <a href="/help" data-tint="slate">${renderSvg("book", 16)}<span>Overview</span></a>
        ${railLinks}
      </aside>

      <article class="doc-main">
        <details class="docs-toc-m">
          <summary><span>On this page</span>${renderSvg("chevron-down", 16)}</summary>
          <nav aria-label="On this page">${tocLinks}</nav>
        </details>
        ${sections}
        <div class="docs-help">
          <div><strong>Still stuck?</strong><span class="d">Check troubleshooting, or open an issue with what you tried.</span></div>
          <div class="cluster">
            <a href="/help/security-and-quotas#troubleshooting" class="btn sm">${renderSvg("help-circle", 14)}<span>Troubleshooting</span></a>
            <a href="${REPO_URL}/issues" target="_blank" rel="noopener noreferrer" class="btn sm">${renderSvg("github", 14)}<span>Open an issue</span></a>
          </div>
        </div>
        ${pager}
      </article>

      <nav class="docs-toc" aria-label="On this page">
        <div class="docs-toc-label">On this page</div>
        ${tocLinks}
      </nav>
    </div>
  `;

  return renderDocsShell({
    title: `${category.shortTitle} - Help - Krix`,
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}
