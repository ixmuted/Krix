// Responsive editorial visual components & illustrations for Krix Help Center.
// Uses native crisp HTML/CSS architectural diagrams (so typography stays 100% readable on mobile
// and flows horizontally on desktop / stacks vertically on phones) plus a pure geometric hero SVG.

import { renderSvg } from "../icons.js";

interface FlowNode {
  icon?: string;
  logo?: boolean;
  tint?: string;
  kicker?: string;
  title: string;
  sub: string;
  dark?: boolean;
  dashed?: boolean;
}

function renderFlow(nodes: FlowNode[], opts?: { cols?: number; connected?: boolean }): string {
  const connected = opts?.connected !== false;
  const cols = opts?.cols || nodes.length;
  const items = nodes
    .map((n, idx) => {
      const iconHtml = n.logo
        ? `<span class="df-logo"><img src="/logo.svg?v=4" alt="" width="20" height="20"></span>`
        : n.icon
          ? `<span class="df-icon" data-tint="${n.tint || "clay"}">${renderSvg(n.icon, 16)}</span>`
          : "";
      const card = `
        <div class="df-node${n.dark ? " is-dark" : ""}${n.dashed ? " is-dashed" : ""}">
          <div class="df-node-top">
            ${iconHtml}
            ${n.kicker ? `<span class="df-kicker">${n.kicker}</span>` : ""}
          </div>
          <div class="df-title">${n.title}</div>
          <div class="df-sub">${n.sub}</div>
        </div>`;
      const sep =
        connected && idx < nodes.length - 1
          ? `<div class="df-sep" aria-hidden="true"><span></span></div>`
          : "";
      return card + sep;
    })
    .join("");
  return `<div class="df-wrap${connected ? " is-flow" : " is-grid"}" data-cols="${cols}">${items}</div>`;
}

export function renderHelpGraphic(name: string): string {
  switch (name) {
    case "hero":
      return `<svg class="doc-hero-svg" viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="144" cy="112" r="88" fill="var(--bg-surface-2)" />
        <path class="doc-flow-line" d="M52 150 C74 114, 104 86, 142 80 C178 74, 202 92, 222 66" stroke="var(--t-clay, #d97757)" stroke-width="2" stroke-linecap="round" stroke-dasharray="5 6"/>
        <circle cx="52" cy="150" r="3.5" fill="var(--t-clay, #d97757)"/>
        <circle cx="222" cy="66" r="3.5" fill="var(--t-clay, #d97757)"/>
        <rect x="44" y="56" width="94" height="64" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <rect x="58" y="72" width="52" height="5" rx="2.5" fill="var(--fg)"/>
        <rect x="58" y="85" width="66" height="4" rx="2" fill="var(--fg-3)" opacity="0.55"/>
        <rect x="58" y="96" width="44" height="4" rx="2" fill="var(--fg-3)" opacity="0.4"/>
        <rect x="130" y="102" width="104" height="72" rx="16" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.4"/>
        <circle cx="148" cy="120" r="3.2" fill="#d97757"/>
        <circle cx="159" cy="120" r="3.2" fill="#b0aea5"/>
        <circle cx="170" cy="120" r="3.2" fill="#788c5d"/>
        <path d="M148 140 L158 147 L148 154" stroke="#d97757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="166" y="151" width="46" height="3.5" rx="1.75" fill="#faf9f5" opacity="0.9"/>
        <circle class="doc-pulse" cx="216" cy="52" r="15" fill="var(--accent-soft)" stroke="#d97757" stroke-width="1.4"/>
        <path d="M211 52 H221 M216 47 V57" stroke="#d97757" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;

    case "transport-flow":
      return renderFlow([
        { icon: "command", tint: "slate", kicker: "Client", title: "MCP Client", sub: "Editor, CLI, or agent" },
        { logo: true, dark: true, kicker: "POST / GET /mcp", title: "Krix Gateway", sub: "Auth, policy & routing" },
        { icon: "terminal", tint: "olive", kicker: "Tools", title: "Isolated Workspace", sub: "Git, Sandbox & Cloud" },
      ]);

    case "oauth-handshake":
      return renderFlow([
        { icon: "search", tint: "clay", kicker: "Step 01", title: "Discover", sub: "Reads /mcp metadata" },
        { icon: "shield-check", tint: "fig", kicker: "Step 02", title: "Approve", sub: "Browser consent screen" },
        { icon: "check-circle", tint: "olive", kicker: "Step 03", title: "Connected", sub: "Scoped OAuth session" },
      ]);

    case "verify-call":
      return `
        <div class="doc-term-viz" role="img" aria-label="Sample sandbox_status verification output">
          <div class="doc-term-head">
            <span class="doc-term-dots"><i></i><i></i><i></i></span>
            <span>krix · health check</span>
          </div>
          <div class="doc-term-body">
            <div class="doc-term-cmd"><span>$</span> sandbox_status()</div>
            <div class="doc-term-ok">✓ 11+ runtimes ready · isolated workspace · 50 MB quota available</div>
          </div>
        </div>`;

    case "keys-separation":
      return renderFlow([
        { icon: "key", tint: "clay", kicker: "Gateway Key", title: "Krix API Key", sub: "Authenticates your MCP client" },
        { icon: "lock", dark: true, kicker: "Protected at rest", title: "Encrypted Vault", sub: "Auto-redacted from outputs" },
        { icon: "github", tint: "olive", kicker: "Provider Tokens", title: "GitHub & Render", sub: "Workspace or per-key override" },
      ]);

    case "permission-cascade":
      return renderFlow(
        [
          { icon: "key", tint: "clay", kicker: "01", title: "Token check", sub: "Required credentials present" },
          { icon: "sliders", tint: "fig", kicker: "02", title: "Per-key rule", sub: "Overrides for a single key" },
          { icon: "settings", tint: "sky", kicker: "03", title: "Workspace", sub: "Account-wide toggles" },
          { icon: "zap", tint: "olive", kicker: "04", title: "Defaults", sub: "Sandbox + Core GitHub on" },
        ],
        { cols: 4, connected: false },
      );

    case "github-explore":
      return renderFlow([
        { icon: "search", tint: "clay", kicker: "Explore", title: "<code>git_tree</code>", sub: "Map files & grep matches" },
        { icon: "layers", tint: "sky", kicker: "Inspect", title: "<code>view_file_outline</code>", sub: "Read AST symbols first" },
        { icon: "file-code", dark: true, kicker: "Edit", title: "<code>str_replace_editor</code>", sub: "Targeted block commits" },
      ]);

    case "github-pr-flow":
      return renderFlow(
        [
          { icon: "github", tint: "slate", kicker: "Base", title: "<code>main</code>", sub: "Default branch" },
          { icon: "zap", tint: "clay", kicker: "Branch", title: "<code>create_branch</code>", sub: "Isolate changes" },
          { icon: "upload", tint: "sky", kicker: "Commit", title: "<code>push_files</code>", sub: "Atomic multi-file push" },
          { icon: "check-circle", dark: true, kicker: "Review", title: "<code>create_pull_request</code>", sub: "Open PR for merge" },
        ],
        { cols: 4, connected: false },
      );

    case "github-extended":
      return renderFlow(
        [
          { icon: "info", tint: "clay", kicker: "Tracking", title: "Issues", sub: "list · write · sub-issues" },
          { icon: "check-circle", tint: "olive", kicker: "Code Review", title: "PR Reviews", sub: "comments · merge" },
          { icon: "zap", tint: "sky", kicker: "Shipping", title: "Releases", sub: "tags · commit history" },
          { icon: "shield-check", tint: "fig", kicker: "Admin", title: "Teams & Repo", sub: "fork · scan · members" },
        ],
        { cols: 4, connected: false },
      );

    case "sandbox-runtime":
      return renderFlow(
        [
          { icon: "terminal", dark: true, kicker: "Shell & Code", title: "<code>sandbox_exec / run</code>", sub: "Persistent shell · 11+ languages" },
          { icon: "files", tint: "olive", kicker: "Workspace Files", title: "<code>sandbox_file</code>", sub: "Safe read, write & exact edits" },
          { icon: "activity", tint: "clay", kicker: "Processes", title: "<code>sandbox_ps</code>", sub: "Background servers & logs" },
        ],
        { cols: 3, connected: false },
      );

    case "sandbox-git":
      return renderFlow(
        [
          { icon: "download", tint: "slate", kicker: "01", title: "<code>git_clone</code>", sub: "Clone repo locally" },
          { icon: "terminal", tint: "clay", kicker: "02", title: "<code>sandbox_exec</code>", sub: "Build & run tests" },
          { icon: "search", tint: "sky", kicker: "03", title: "<code>git_diff</code>", sub: "Inspect changes" },
          { icon: "upload", dark: true, kicker: "04", title: "<code>git_commit_push</code>", sub: "Push verified commits" },
        ],
        { cols: 4, connected: false },
      );

    case "render-cloud":
      return renderFlow([
        { icon: "render", dark: true, kicker: "Workspace", title: "Render API", sub: "Scoped team selection" },
        { icon: "server", tint: "sky", kicker: "Compute", title: "Services & Deploys", sub: "Web, static, cron & env vars" },
        { icon: "activity", tint: "olive", kicker: "Observe & Query", title: "Logs, Metrics & SQL", sub: "Live logs & Postgres queries" },
      ]);

    case "code-graph-net":
      return `
        <div class="doc-graph-viz" aria-label="Code graph symbol relationships">
          <div class="dg-tier">
            <div class="dg-label">Entry point</div>
            <div class="dg-node is-dark"><code>entry.ts</code></div>
          </div>
          <div class="df-sep" aria-hidden="true"><span></span></div>
          <div class="dg-tier">
            <div class="dg-label">Callers &amp; modules</div>
            <div class="dg-stack">
              <div class="dg-node"><code>auth.ts</code></div>
              <div class="dg-node"><code>router.ts</code></div>
            </div>
          </div>
          <div class="df-sep" aria-hidden="true"><span></span></div>
          <div class="dg-tier">
            <div class="dg-label">Core service</div>
            <div class="dg-node is-accent"><code>service.ts</code></div>
          </div>
          <div class="df-sep" aria-hidden="true"><span></span></div>
          <div class="dg-tier">
            <div class="dg-label">Targets &amp; audit</div>
            <div class="dg-stack">
              <div class="dg-node is-ok"><code>db.ts</code></div>
              <div class="dg-node is-dead"><code>unused()</code> <span>dead code</span></div>
            </div>
          </div>
        </div>`;

    case "files-lifecycle":
      return renderFlow([
        { icon: "upload", tint: "kraft", kicker: "Browser", title: "<code>/upload</code>", sub: "24h temporary scratch" },
        { icon: "terminal", dark: true, kicker: "Sandbox", title: "<code>upload/</code>", sub: "Process & generate outputs" },
        { icon: "files", tint: "olive", kicker: "Cloud Store", title: "<code>/store</code>", sub: "Private, public, or permanent" },
      ]);

    case "security-shield":
      return renderFlow(
        [
          { icon: "lock", tint: "clay", kicker: "Credentials", title: "Encrypted storage", sub: "Protected at rest & redacted" },
          { icon: "shield-check", dark: true, kicker: "Runtime", title: "Isolated workspace", sub: "Private per-user environment" },
          { icon: "activity", tint: "olive", kicker: "Control", title: "Alerts & revocation", sub: "Instant revoke · 30d deletion grace" },
        ],
        { cols: 3, connected: false },
      );

    case "hub-keys-banner":
      return renderFlow([
        { icon: "key", tint: "clay", kicker: "Step 01", title: "Create API key", sub: "Generate a key in /api for your client" },
        { icon: "settings", tint: "fig", kicker: "Step 02", title: "Add provider tokens", sub: "Save GitHub or Render keys in Settings" },
        { icon: "sliders", dark: true, kicker: "Step 03", title: "Enable tool groups", sub: "Toggle opt-in groups globally or per key" },
      ]);

    case "limits-gauge":
      return `
        <div class="doc-meter-viz" aria-label="Account storage quota breakdown">
          <div class="dm-head">
            <strong>Account storage quota</strong>
            <span class="dm-cap">50 MB isolated</span>
          </div>
          <div class="dm-track" role="presentation">
            <span class="dm-seg is-clay" style="width:36%"></span>
            <span class="dm-seg is-olive" style="width:22%"></span>
          </div>
          <div class="dm-legend">
            <span><i class="is-clay"></i>Saved files (/store)</span>
            <span><i class="is-olive"></i>Uploads (24h retention)</span>
            <span><i class="is-muted"></i>Available space</span>
          </div>
        </div>`;

    default:
      return "";
  }
}
