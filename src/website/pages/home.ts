// Homepage: editorial hero, live runtime preview, client compatibility, how it works, capabilities, security, setup snippets, FAQ

import { renderPageShell, escapeHtml } from "../components.js";
import { renderSvg, renderGoogleLogoSvg } from "../icons.js";

const FEATURES = [
  ["terminal", "Persistent Bash Shell", "Keeps your working directory, exports, and environment alive across every tool call."],
  ["cpu", "Multi-Language Runner", "Execute Python, Node.js, TypeScript, Go, C++, Rust, Java, and Ruby in one call."],
  ["shield-check", "Per-User Linux Isolation", "Every key and OAuth client runs under its own unprivileged OS user and home directory."],
  ["github", "GitHub Automation", "Read files, inspect commits, open pull requests, and manage issues directly from your agent."],
  ["layers", "Code Graph Intelligence", "Build AST symbol graphs for fast call-chain tracing and blast-radius impact analysis."],
  ["server", "Render Cloud Control", "Trigger deploys, stream service logs, and inspect environment configs in real time."],
  ["lock", "OAuth 2.1 PKCE Discovery", "Zero-config authorization handshake with automatic protected-resource metadata."],
  ["sliders", "Granular Tool Permissions", "Toggle individual tools on or off globally or per API key with instant propagation."],
  ["key", "Per-Key Credential Overrides", "Bind custom GitHub or Render tokens to specific keys without exposing workspace secrets."],
  ["files", "Ephemeral & Permanent Store", "Upload datasets for 24-hour scratch work or persist artifacts with shareable links."],
  ["activity", "Real-Time Telemetry & Logs", "Track daily request timelines, P95 latency, tool breakdowns, and per-key error rates."],
  ["refresh", "Idle Workspace Auto-Clear", "Inactive cloned repositories automatically clear after timeout to keep storage clean."],
];

const CAPABILITIES = [
  {
    tag: "Runtime",
    title: "A real shell, isolated per user",
    desc: "Each authenticated key and OAuth session runs inside its own unprivileged Linux user with a persistent bash shell, a private workspace, and automatic idle cleanup.",
    specs: [["Transport", "Streamable HTTP + SSE"], ["Languages", "Python · Node · TS · Go · C++ · Rust"], ["Shell state", "Persistent cwd and env per session"]],
    cta: ["Explore sandbox tools", "/tools"],
  },
  {
    tag: "Engineering",
    title: "Repositories and code intelligence",
    desc: "Inspect repositories, manage branches, commits, and pull requests, or build a structured symbol graph for fast dependency and impact tracing across large codebases.",
    specs: [["Integrations", "GitHub REST + Code Graph"], ["Credential scope", "Workspace or per-key override"], ["Access control", "Per-tool permissions"]],
    cta: ["Configure keys and credentials", "/api"],
  },
  {
    tag: "Infrastructure",
    title: "Deployments and managed artifacts",
    desc: "Trigger deployments, inspect service logs, manage environment variables, and exchange datasets or build outputs between your browser and your AI agent.",
    specs: [["Storage modes", "24h ephemeral · permanent store"], ["Sharing", "Signed and public download links"], ["Telemetry", "Real-time usage and latency"]],
    cta: ["Open files and usage", "/store"],
  },
];

const STEPS = [
  ["Connect", "Paste the Krix endpoint into any MCP client. OAuth 2.1 discovery handles the handshake, or use an API key."],
  ["Configure", "Choose which tools each key may call, attach optional GitHub or Render credentials, and set the boundaries once."],
  ["Ship", "Your agent edits code, runs tests, opens pull requests and deploys, all inside an isolated workspace you can audit."],
];

const CLIENTS = [
  ["claude", "Claude"], ["chatgpt", "ChatGPT"], ["gemini", "Gemini"], ["cursor", "Cursor"],
  ["windsurf", "Windsurf"], ["cline", "Cline"], ["zed", "Zed"], ["codex", "Codex"],
];

const SECURITY = [
  ["Per-user OS isolation", "Every key and OAuth client gets its own unprivileged Linux user, home directory and sandbox. Nothing is shared."],
  ["OAuth 2.1 with PKCE", "Standards-based authorization with automatic discovery, so clients connect without hand-copied secrets."],
  ["Tools off until credentials exist", "GitHub and Render tools stay disabled until a token is present, and can never be switched on without one."],
  ["Instant, granular control", "Disable a key or a single tool and the change applies immediately, globally or per key."],
];

const FAQ = [
  ["Which clients can connect?", "Any MCP client that supports Streamable HTTP. Authenticate with OAuth 2.1 where the client supports it, or send an API key."],
  ["How are users kept apart?", "Each key and OAuth client runs as its own unprivileged OS user with a private home directory, so files, shells and credentials never cross."],
  ["How long are uploaded files kept?", "Uploads are scratch space and clear after 24 hours. Mark a file permanent to keep it, then share it with a link."],
  ["What if I have no GitHub or Render token?", "The sandbox tools work on their own. GitHub and Render tools stay off until you add a token, workspace-wide or per key."],
];

function sectionHead(eyebrow: string, title: string, sub?: string): string {
  return `<div class="hm-sec-head"><div class="hm-eyebrow">${escapeHtml(eyebrow)}</div><h2 class="hm-h2">${escapeHtml(title)}</h2>${sub ? `<p class="hm-sub">${escapeHtml(sub)}</p>` : ""}</div>`;
}

function codeBlock(file: string, id: string, code: string): string {
  return `
      <div class="panel flush">
        <div class="codeblock" style="border:0; border-radius:0;">
          <div class="codeblock-head">
            <span>${escapeHtml(file)}</span>
            <button type="button" class="btn ghost sm snippet-copy-button" aria-label="Copy ${escapeHtml(file)}" onclick="window.copyToClipboard(document.getElementById('${id}').textContent, this)">${renderSvg("copy", 14)}<span>Copy</span></button>
          </div>
          <pre id="${id}">${escapeHtml(code)}</pre>
        </div>
      </div>`;
}

export function renderHomePage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  uploads?: any;
  dynamicKeys?: any[];
  nonce?: string;
}): string {
  const base = params.base ? params.base.replace(/\/+$/, "") : "";
  const nonceAttr = params.nonce ? ` nonce="${escapeHtml(params.nonce)}"` : "";
  const jsonConfig = JSON.stringify({ mcpServers: { krix: { url: endpoint } } }, null, 2);
  const cliConfig = `claude mcp add --transport http krix ${endpoint}`;

  const primaryCta = isAuth
    ? `<a href="/api" class="btn primary">${renderSvg("key", 15)}<span>Create an API key</span></a>`
    : `<a href="/auth/google" class="btn primary">${renderSvg("key", 15)}<span>Get started</span></a>`;

  const stats = [
    ["1", "MCP endpoint for every client"],
    ["8", "Languages in the sandbox"],
    ["3", "Integrations: GitHub, Render, Code Graph"],
    ["24h", "Scratch retention, or keep forever"],
  ];

  const content = `
  <div class="hm">
    <section class="hm-hero">
      <div class="hm-hero-text">
        <h1 class="hm-title"><strong>One endpoint for your agents.</strong> GitHub, Render and an isolated sandbox, wired up over MCP.</h1>
        <p class="hm-lead">Krix gives every AI assistant a real workspace to write code, run it, open pull requests and deploy, with permissions you control per key.</p>
        <div class="hm-endpoint">
          <code id="mcpEndpointValue">${escapeHtml(endpoint)}</code>
          <button type="button" class="btn primary sm" onclick="window.copyToClipboard('${escapeHtml(endpoint)}', this)">${renderSvg("copy", 14)}<span>Copy</span></button>
        </div>
        <div class="hm-cta">
          ${primaryCta}
          <a href="/tools" class="btn">${renderSvg("terminal", 15)}<span>Browse tools</span></a>
          <a href="/help" class="btn ghost">${renderSvg("help-circle", 15)}<span>Setup guide</span></a>
        </div>${
          !isAuth
            ? `
        <div class="hm-google-signup">
          <a href="/auth/google" class="btn hm-google-btn">${renderGoogleLogoSvg(18)}<span>Sign up with Google</span></a>
        </div>`
            : ""
        }
      </div>
      <div class="hm-art" aria-label="Live runtime preview">
        <div class="hm-term">
          <div class="hm-term-head"><span class="hm-dots"><span></span><span></span><span></span></span><span>krix-sandbox · bash</span></div>
          <div class="hm-term-body">
            <div class="hm-dim">$ git_status</div>
            <div class="hm-dim">On branch feat/oauth · 3 files changed</div>
            <div class="hm-line"><span class="hm-prompt">$</span><span id="termCmdText">sandbox_exec "npm run typecheck && npm test"</span><span class="hm-cur" aria-hidden="true"></span></div>
            <div id="termOutText" class="hm-out">✓ 0 type errors · 24/24 suites passed in 1.4s</div>
          </div>
        </div>
      </div>
    </section>

    <section class="hm-stats" aria-label="Key numbers">
      ${stats.map((s) => `<div class="hm-stat"><div class="hm-stat-n">${s[0]}</div><div class="hm-stat-l">${escapeHtml(s[1])}</div></div>`).join("")}
    </section>

    <section>
      ${sectionHead("Compatibility", "Works with the tools you already use", "Any MCP client that speaks Streamable HTTP can connect in seconds.")}
      <div class="hm-clients">${CLIENTS.map((c) => `<span class="hm-client">${renderSvg(c[0], 18)}${escapeHtml(c[1])}</span>`).join("")}</div>
    </section>

    <section>
      ${sectionHead("How it works", "From zero to a working agent in three steps")}
      <div class="hm-steps">
        ${STEPS.map((s, i) => `<div class="hm-step"><div class="hm-step-n">0${i + 1}</div><h3>${escapeHtml(s[0])}</h3><p>${escapeHtml(s[1])}</p></div>`).join("")}
      </div>
    </section>

    <section id="platform">
      ${sectionHead("Platform", "Everything an agent needs to ship real work")}
      <div class="hm-caps">
        ${CAPABILITIES.map((c) => `
        <article class="hm-cap">
          <div class="hm-cap-text">
            <span class="badge">${escapeHtml(c.tag)}</span>
            <h3>${escapeHtml(c.title)}</h3>
            <p>${escapeHtml(c.desc)}</p>
            <a href="${c.cta[1]}" class="btn">${escapeHtml(c.cta[0])} ${renderSvg("chevron-right", 14)}</a>
          </div>
          <div class="hm-specs">${c.specs.map((s) => `<div class="hm-spec"><span>${escapeHtml(s[0])}</span><strong>${escapeHtml(s[1])}</strong></div>`).join("")}</div>
        </article>`).join("")}
      </div>
    </section>

    <section>
      ${sectionHead("Features", "Everything included")}
      <div class="features-grid">
        ${FEATURES.map((f) => `<div class="feature-card"><span class="feature-icon">${renderSvg(f[0], 18)}</span><div class="feature-title">${escapeHtml(f[1])}</div><div class="feature-desc">${escapeHtml(f[2])}</div></div>`).join("")}
      </div>
    </section>

    <section id="security" class="hm-secure">
      <div>
        <div class="hm-eyebrow">Security</div>
        <h2 class="hm-h2">Built to be trusted with your code</h2>
        <p class="hm-sub">Isolation, standards-based auth and tight defaults come first, so agents get power without getting the keys to everything.</p>
      </div>
      <div class="hm-secure-list">
        ${SECURITY.map((s) => `<div><h3>${escapeHtml(s[0])}</h3><p>${escapeHtml(s[1])}</p></div>`).join("")}
      </div>
    </section>

    <section id="quickstart">
      ${sectionHead("Quick start", "Add Krix to your client", "Use the JSON config in any MCP client, or one command in Claude Code.")}
      <div class="hm-code-grid">
        ${codeBlock("mcp_config.json", "mcpSnippetCode", jsonConfig)}
        ${codeBlock("terminal", "mcpCliCode", cliConfig)}
      </div>
    </section>

    <section>
      ${sectionHead("Workspace", "Three places your agent can work")}
      <div class="ws-grid">
        <a href="/upload" class="ws-card"><span class="ws-icon">${renderSvg("upload", 20)}</span><div class="ws-body"><div class="ws-title">Uploads <code class="inline-code">upload/</code></div><div class="ws-desc">Drop files here for your agent. Kept for 24 hours.</div></div><span class="ws-go">${renderSvg("chevron-right", 16)}</span></a>
        <a href="/store" class="ws-card"><span class="ws-icon">${renderSvg("files", 20)}</span><div class="ws-body"><div class="ws-title">Saved files <code class="inline-code">store/</code></div><div class="ws-desc">Files you keep. Share them with a link.</div></div><span class="ws-go">${renderSvg("chevron-right", 16)}</span></a>
        <div class="ws-card"><span class="ws-icon">${renderSvg("terminal", 20)}</span><div class="ws-body"><div class="ws-title">Sandbox <code class="inline-code">workspace/</code></div><div class="ws-desc">Scratch space for code your agent runs.</div></div></div>
      </div>
    </section>

    <section id="faq">
      ${sectionHead("FAQ", "Questions, answered")}
      <div class="hm-faq">
        ${FAQ.map((q) => `<details class="hm-faq-item hlp-smooth-details"><summary>${escapeHtml(q[0])}</summary><div class="hlp-details-body"><p>${escapeHtml(q[1])}</p></div></details>`).join("")}
      </div>
    </section>

    <section class="hm-final">
      <h2 class="hm-h2">Give your agent a real workspace</h2>
      <p class="hm-sub">Connect once, set your boundaries, and let it ship.</p>
      <div class="hm-cta" style="justify-content:center;">
        ${primaryCta}
        <a href="/stats" class="btn">${renderSvg("activity", 15)}<span>View usage</span></a>
      </div>
    </section>
  </div>

  <script${nonceAttr}>
    (function() {
      var demos = [
        { cmd: 'sandbox_exec "npm run typecheck && npm test"', out: '✓ 0 type errors · 24/24 suites passed in 1.4s' },
        { cmd: 'code_graph_impact --symbol "verifyAccessToken"', out: '✓ Indexed 142 files · 3 callers traced in 18ms' },
        { cmd: 'github_create_pr --base main --head feat/oauth', out: '✓ Pull request #84 opened · checks pending' },
        { cmd: 'render_deploy --service krix-prod --wait', out: '✓ Live at https://krix.onrender.com · 200 OK' }
      ];
      var i = 0;
      setInterval(function() {
        i = (i + 1) % demos.length;
        var c = document.getElementById('termCmdText');
        var o = document.getElementById('termOutText');
        if (c) c.textContent = demos[i].cmd;
        if (o) o.textContent = demos[i].out;
      }, 3800);

      var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced && typeof Element.prototype.animate === 'function') {
        var detailsList = Array.prototype.slice.call(document.querySelectorAll('details.hlp-smooth-details'));
        detailsList.forEach(function(el) {
          var summary = el.querySelector('summary');
          var body = el.querySelector('.hlp-details-body');
          if (!summary || !body) return;
          var anim = null;
          var bodyAnim = null;
          var isClosing = false;
          var isExpanding = false;

          summary.addEventListener('click', function(e) {
            e.preventDefault();
            el.style.overflow = 'hidden';
            if (isClosing || !el.open) {
              el.style.height = el.offsetHeight + 'px';
              el.open = true;
              window.requestAnimationFrame(function() {
                isExpanding = true;
                var startH = el.offsetHeight + 'px';
                var endH = (summary.offsetHeight + body.offsetHeight) + 'px';
                if (anim) anim.cancel();
                if (bodyAnim) bodyAnim.cancel();
                anim = el.animate({ height: [startH, endH] }, { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
                bodyAnim = body.animate({ opacity: [0, 1], transform: ['translateY(-4px)', 'translateY(0)'] }, { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
                anim.onfinish = function() {
                  el.open = true;
                  anim = null;
                  bodyAnim = null;
                  isClosing = false;
                  isExpanding = false;
                  el.style.height = '';
                  el.style.overflow = '';
                };
              });
            } else if (isExpanding || el.open) {
              isClosing = true;
              var startH = el.offsetHeight + 'px';
              var endH = summary.offsetHeight + 'px';
              if (anim) anim.cancel();
              if (bodyAnim) bodyAnim.cancel();
              anim = el.animate({ height: [startH, endH] }, { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
              bodyAnim = body.animate({ opacity: [1, 0] }, { duration: 160, easing: 'ease-out' });
              anim.onfinish = function() {
                el.open = false;
                anim = null;
                bodyAnim = null;
                isClosing = false;
                isExpanding = false;
                el.style.height = '';
                el.style.overflow = '';
              };
            }
          });
        });
      }
    })();
  </script>
  `;

  return renderPageShell({
    title: "Krix",
    activeTab: "home",
    wide: true,
    content,
    owner: params.owner,
    nonce: params.nonce,
  });
}