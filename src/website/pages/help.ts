import { escapeHtml } from "../components.js";
import { renderSvg } from "../icons.js";
import { EFFECTIVE_DATE, REPO_URL, renderDocsShell, tintFor } from "./docsKit.js";
import { HELP_CORE } from "./helpContent.js";
import { HELP_MORE } from "./helpContentMore.js";
import { renderHelpGraphic } from "./helpGraphics.js";
import type { HelpCategory } from "./helpTypes.js";

export type { HelpCategory, HelpSection } from "./helpTypes.js";

export const HELP_CATEGORIES: HelpCategory[] = [...HELP_CORE, ...HELP_MORE];

export function getHelpCategory(slug: string): HelpCategory | undefined {
  const clean = (slug || "").trim().toLowerCase();
  const resolved = clean === "authentication" ? "adding-keys" : clean;
  return HELP_CATEGORIES.find((c) => c.slug === resolved);
}

const GROUPS = [
  {
    name: "Sandbox and local Git",
    count: 15,
    on: true,
    tint: "olive",
    need: "Included with your isolated workspace",
    href: "/help/sandbox",
    label: "Sandbox guide",
  },
  {
    name: "GitHub core",
    count: 17,
    on: true,
    tint: "slate",
    need: "GitHub PAT saved in Settings",
    href: "/help/github",
    label: "GitHub guide",
  },
  {
    name: "GitHub extended",
    count: 34,
    on: false,
    tint: "slate",
    need: "GitHub PAT + switch on in Settings",
    href: "/help/github",
    label: "GitHub guide",
  },
  {
    name: "Render cloud",
    count: 21,
    on: false,
    tint: "sky",
    need: "Render API key + switch on in Settings",
    href: "/help/render",
    label: "Render guide",
  },
  {
    name: "Code graph and web search",
    count: 30,
    on: false,
    tint: "cactus",
    need: "Switch on in Settings",
    href: "/help/code-graph",
    label: "Code graph guide",
  },
];

const FAQ: Array<[string, string]> = [
  [
    "Why do some tools not appear in my assistant?",
    `Krix lists only tools that are enabled and have valid credentials, so your assistant never hits broken calls. Extended GitHub, Render, and Code Graph start disabled—switch them on in <a href="/settings">Settings</a> or on your key's page, and confirm the matching GitHub or Render token is saved.`,
  ],
  [
    "Which transport and URL should I use?",
    `Use the Streamable HTTP endpoint at <code class="inline-code">/mcp</code>. Current MCP clients expect it, and it accepts an API key header or OAuth 2.1 discovery. Start with <a href="/help/getting-started">Connecting an MCP client</a> for copy-ready configs.`,
  ],
  [
    "Can I use different GitHub or Render credentials per API key?",
    `Yes. Open any key on <a href="/api">API keys</a> to set key-specific provider tokens and tool overrides. Keys without overrides inherit your workspace settings.`,
  ],
  [
    "How are my credentials and workspace protected?",
    `Provider tokens are strongly encrypted at rest, automatically filtered from tool outputs, and never exposed inside sandbox environments. Every account runs in an isolated workspace separate from other users. Read <a href="/help/security-and-quotas">Security &amp; limits</a> and the <a href="/privacy">Privacy Policy</a> for details.`,
  ],
  [
    "How long are uploaded and shared files kept?",
    `Web uploads clear automatically after 24 hours, and shared links expire unless you mark a file Permanent in <a href="/store">Files</a>. Idle cloned repositories clear after 30 minutes.`,
  ],
  [
    "What happens if I delete my account?",
    `Requesting account deletion in <a href="/settings">Settings</a> starts a 30-day grace period. Signing back in cancels it. After 30 days, all keys, stored files, and workspace data are permanently removed. See the <a href="/privacy#retention">retention table</a>.`,
  ],
];

function splitTitle(title: string): { num: string; text: string } {
  const m = title.match(/^(\d+)\.\s+(.*)$/);
  return m ? { num: m[1], text: m[2] } : { num: "", text: title };
}

function searchIndex(c: HelpCategory): string {
  return escapeHtml(`${c.title} ${c.summary} ${c.topics.join(" ")} ${c.keywords}`);
}

function renderFeature(c: HelpCategory): string {
  const topics = c.topics
    .map((t) => `<li>${renderSvg("check-circle", 16)}<span>${escapeHtml(t)}</span></li>`)
    .join("");
  return `
    <a href="/help/${escapeHtml(c.slug)}" class="guide-feature doc-reveal" data-reveal data-tint="${tintFor(c.slug)}" data-guide data-search="${searchIndex(c)}">
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
    <li class="doc-reveal" data-reveal data-guide data-search="${searchIndex(c)}">
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
        <div>${g.on ? '<span class="badge success">Enabled</span>' : '<span class="badge">Opt-in</span>'}</div>
        <div class="group-need">${escapeHtml(g.need)}</div>
      </li>`,
  ).join("");
  return `<ul class="groups">${rows}</ul>`;
}

function renderFaq(): string {
  return `<div class="docs-faq-list">${FAQ.map(
    ([q, a]) => `
      <details class="docs-faq docs-smooth-details">
        <summary>${escapeHtml(q)}</summary>
        <div class="docs-details-body"><div class="docs-faq-body">${a}</div></div>
      </details>`,
  ).join("")}</div>`;
}

function renderPolicies(): string {
  const items = [
    ["/privacy", "shield", "clay", "Privacy Policy", "What Krix stores and for how long"],
    ["/terms", "files", "kraft", "Terms of Service", "Rules for keys, sandboxes, and quotas"],
    ["/help/security-and-quotas", "shield-check", "olive", "Security & limits", "Isolation, quotas, and troubleshooting"],
  ];
  return `<div class="docs-policies doc-reveal" data-reveal>${items
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
    <header class="docs-hero-split">
      <div>
        <h1 class="docs-title"><strong>Krix documentation.</strong> Setup, credentials, and tool reference.</h1>
        <p class="docs-lede">Connect any Streamable HTTP MCP client, configure API keys and provider tokens, and manage permissions across every tool group.</p>
        <div class="docs-search">
          <span class="docs-search-icon" aria-hidden="true">${renderSvg("search", 18)}</span>
          <label for="helpSearchInput" class="sr-only">Search guides</label>
          <input id="helpSearchInput" type="search" placeholder="Search guides" autocomplete="off" enterkeyhint="search">
          <kbd aria-hidden="true">/</kbd>
        </div>
        <div class="docs-hero-cta">
          <a href="/help/adding-keys" class="btn primary">${renderSvg("key", 15)}<span>Adding keys</span></a>
          <a href="/api" class="btn">${renderSvg("sliders", 15)}<span>API keys</span></a>
          <a href="/tools" class="btn ghost">${renderSvg("terminal", 15)}<span>Tools catalog</span></a>
        </div>
      </div>
      <div class="docs-hero-art">
        ${renderHelpGraphic("hero")}
      </div>
    </header>

    <section class="docs-transport doc-reveal" data-reveal aria-label="Streamable HTTP Transport">
      <div>
        <div class="docs-transport-head">
          <span class="docs-logo-badge"><img src="/logo.svg?v=4" alt="Krix logo" width="28" height="28"></span>
          <div class="docs-transport-eyebrow">Streamable HTTP Transport</div>
        </div>
        <h2 class="docs-transport-title">Connect over one authenticated endpoint</h2>
        <p class="docs-transport-sub">Point your MCP client at <code>/mcp</code> using a Bearer key from API keys or OAuth 2.1 automatic discovery.</p>
        <div class="docs-transport-actions">
          <a href="/help/adding-keys" class="docs-dark-btn primary">${renderSvg("key", 15)}<span>Adding keys</span></a>
          <a href="/api" class="docs-dark-btn">${renderSvg("plus", 15)}<span>API keys</span></a>
          <a href="/settings" class="docs-dark-btn">${renderSvg("settings", 15)}<span>Settings</span></a>
        </div>
      </div>
      <div class="docs-transport-box">
        <div class="docs-transport-meta">
          <span>POST / GET · Streamable HTTP</span>
          <span>TLS</span>
        </div>
        <div class="docs-transport-url">
          <code>${escapeHtml(mcpUrl)}</code>
          <button type="button" class="docs-copy-dark doc-copy-btn" data-copy="${escapeHtml(mcpUrl)}" aria-label="Copy MCP endpoint URL">${renderSvg("copy", 13)}<span>Copy</span></button>
        </div>
        <div class="docs-transport-headers">
          <div><span>Authorization:</span> Bearer &lt;api-key&gt;</div>
          <div><span>x-api-key:</span> &lt;api-key&gt;</div>
        </div>
      </div>
    </section>

    <section class="docs-section doc-reveal" data-reveal aria-labelledby="keys-steps-h">
      <div class="docs-section-head">
        <div>
          <h2 id="keys-steps-h" class="docs-section-title">Add your keys in three steps</h2>
          <p class="docs-section-sub">Create a Krix key for your client, attach optional GitHub or Render tokens, and enable the tool groups you need.</p>
        </div>
      </div>
      <div class="doc-graphic-frame">${renderHelpGraphic("hub-keys-banner")}</div>
    </section>

    <section class="docs-section" aria-labelledby="guides-h">
      <div class="docs-section-head">
        <div>
          <h2 id="guides-h" class="docs-section-title">Browse by topic</h2>
          <p class="docs-section-sub">Start with the connection guide, or jump straight to any tool reference.</p>
        </div>
        <span id="helpCategoryCount" class="docs-count" aria-live="polite">${HELP_CATEGORIES.length} of ${HELP_CATEGORIES.length} guides</span>
      </div>
      ${renderFeature(first)}
      <ul class="guide-list">${rest.map(renderRow).join("")}</ul>
      <div id="helpSearchEmpty" class="docs-empty" hidden>No guides match that search. Try <strong>keys</strong>, <strong>OAuth</strong>, <strong>GitHub</strong>, <strong>sandbox</strong>, <strong>Render</strong>, or <strong>limits</strong>.</div>
    </section>

    <section class="docs-section doc-reveal" data-reveal aria-labelledby="groups-h">
      <div class="docs-section-head">
        <div>
          <h2 id="groups-h" class="docs-section-title">Tool availability by group</h2>
          <p class="docs-section-sub">Krix includes 117 tools across five groups. Bars show how many tools each group provides.</p>
        </div>
      </div>
      ${renderGroups()}
    </section>

    <section class="docs-section doc-reveal" data-reveal aria-labelledby="faq-h">
      <div class="docs-section-head"><h2 id="faq-h" class="docs-section-title">Common questions</h2></div>
      ${renderFaq()}
    </section>

    ${renderPolicies()}
  `;

  return renderDocsShell({
    title: "Help - Krix",
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
    (c) =>
      `<a href="/help/${escapeHtml(c.slug)}" data-tint="${tintFor(c.slug)}"${c.slug === category.slug ? ' aria-current="page"' : ""}>${renderSvg(c.icon, 16)}<span>${escapeHtml(c.shortTitle)}</span></a>`,
  ).join("");
  const chips = HELP_CATEGORIES.map(
    (c) =>
      `<a href="/help/${escapeHtml(c.slug)}"${c.slug === category.slug ? ' aria-current="page"' : ""}>${escapeHtml(c.shortTitle)}</a>`,
  ).join("");

  const tocLinks = category.sections
    .map((s) => `<a href="#${escapeHtml(s.id)}">${escapeHtml(splitTitle(s.title).text)}</a>`)
    .join("");
  const tocBullets = category.sections
    .map((s) => `<li><a href="#${escapeHtml(s.id)}">${escapeHtml(splitTitle(s.title).text)}</a></li>`)
    .join("");

  const sections = category.sections
    .map((s) => {
      const t = splitTitle(s.title);
      return `
      <section id="${escapeHtml(s.id)}" class="doc-section doc-body doc-reveal" data-reveal>
        <div class="doc-section-head">
          <h2>${t.num ? `<span class="num">${t.num}</span>` : ""}<span>${escapeHtml(t.text)}</span></h2>
          ${s.badge ? `<span class="docs-pill">${escapeHtml(s.badge)}</span>` : ""}
        </div>
        ${s.graphic ? `<div class="doc-graphic-frame">${renderHelpGraphic(s.graphic)}</div>` : ""}
        ${s.render({ base, mcpUrl })}
      </section>`;
    })
    .join("");

  const pager = `
    <nav class="doc-pager" aria-label="Adjacent guides">
      ${
        prev
          ? `<a href="/help/${escapeHtml(prev.slug)}" class="doc-pager-card"><span class="doc-pager-dir">${renderSvg("chevron-left", 14)} Previous</span><span class="doc-pager-title">${escapeHtml(prev.title)}</span></a>`
          : `<a href="/help" class="doc-pager-card"><span class="doc-pager-dir">${renderSvg("chevron-left", 14)} Back</span><span class="doc-pager-title">Help overview</span></a>`
      }
      ${
        next
          ? `<a href="/help/${escapeHtml(next.slug)}" class="doc-pager-card doc-pager-next"><span class="doc-pager-dir">Next ${renderSvg("chevron-right", 14)}</span><span class="doc-pager-title">${escapeHtml(next.title)}</span></a>`
          : `<a href="/tools" class="doc-pager-card doc-pager-next"><span class="doc-pager-dir">Explore ${renderSvg("chevron-right", 14)}</span><span class="doc-pager-title">Tools catalog</span></a>`
      }
    </nav>`;

  const content = `
    <nav class="docs-crumbs" aria-label="Breadcrumb">
      <a href="/help">Help</a>
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
        <details class="docs-toc-m docs-smooth-details">
          <summary><span>In this guide</span>${renderSvg("chevron-down", 16)}</summary>
          <div class="docs-details-body">
            <ul class="docs-toc-bullets">${tocBullets}</ul>
          </div>
        </details>
        ${sections}
        <div class="docs-help doc-reveal" data-reveal>
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
