// Bespoke Anthropic-styled editorial SVG graphics for Krix Help Center & subpages.
// Theme-aware using Krix CSS variables with subtle, reduced-motion-safe animations.

export function renderHelpGraphic(name: string): string {
  switch (name) {
    case "hero":
      return `<svg class="hlp-spot-svg" viewBox="0 0 260 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="132" cy="106" r="84" fill="var(--bg-surface-2)" />
        <path class="hlp-flow-line" d="M48 142 C66 108, 94 82, 130 76 C164 70, 188 92, 206 68" stroke="#d97757" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="5 6"/>
        <rect x="42" y="56" width="84" height="58" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.5"/>
        <line x1="58" y1="76" x2="108" y2="76" stroke="var(--fg)" stroke-width="2" stroke-linecap="round"/>
        <line x1="58" y1="88" x2="98" y2="88" stroke="var(--fg-3)" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="58" y1="98" x2="86" y2="98" stroke="var(--fg-3)" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="124" y="98" width="92" height="64" rx="14" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.5"/>
        <circle cx="140" cy="114" r="3" fill="#d97757"/>
        <circle cx="150" cy="114" r="3" fill="#b0aea5"/>
        <circle cx="160" cy="114" r="3" fill="#788c5d"/>
        <path d="M139 132 L149 139 L139 146" stroke="#d97757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="156" y1="146" x2="188" y2="146" stroke="#faf9f5" stroke-width="2" stroke-linecap="round"/>
        <circle class="hlp-pulse" cx="196" cy="50" r="15" fill="var(--accent-soft)" stroke="#d97757" stroke-width="1.5"/>
        <path d="M191 50 H201 M196 45 V55" stroke="#d97757" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;

    case "transport-flow":
      return `<svg class="hlp-diagram" viewBox="0 0 640 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="12" y="28" width="152" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="88" y="61" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">MCP Client</text>
        <text x="88" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">Editor / CLI / Agent</text>
        <path class="hlp-flow-line" d="M164 66 H238" stroke="#d97757" stroke-width="2" stroke-dasharray="5 5"/>
        <polygon points="236,61 244,66 236,71" fill="#d97757"/>
        <rect x="244" y="20" width="156" height="92" rx="16" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.4"/>
        <text x="322" y="54" text-anchor="middle" fill="#d97757" font-size="10.5" font-weight="600" font-family="var(--font-mono)">POST / GET /mcp</text>
        <text x="322" y="75" text-anchor="middle" fill="#faf9f5" font-size="14" font-weight="600" font-family="var(--font-serif)">Krix Gateway</text>
        <text x="322" y="94" text-anchor="middle" fill="#9c9a92" font-size="10.5" font-family="var(--font-sans)">Auth · Policy · Routing</text>
        <path class="hlp-flow-line" d="M400 66 H474" stroke="#788c5d" stroke-width="2" stroke-dasharray="5 5"/>
        <polygon points="472,61 480,66 472,71" fill="#788c5d"/>
        <rect x="480" y="28" width="148" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="554" y="61" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Isolated Tools</text>
        <text x="554" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">Git · Sandbox · Cloud</text>
      </svg>`;

    case "oauth-handshake":
      return `<svg class="hlp-diagram" viewBox="0 0 640 124" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="26" width="144" height="72" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="88" y="58" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">1. Discover</text>
        <text x="88" y="77" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">/mcp metadata</text>
        <path class="hlp-flow-line" d="M160 62 H242" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 5"/>
        <rect x="248" y="26" width="144" height="72" rx="14" fill="var(--bg-surface-1)" stroke="#d97757" stroke-width="1.5"/>
        <text x="320" y="58" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">2. Approve</text>
        <text x="320" y="77" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">Browser consent</text>
        <path class="hlp-flow-line" d="M392 62 H474" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 5"/>
        <rect x="480" y="26" width="144" height="72" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="552" y="58" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">3. Connected</text>
        <text x="552" y="77" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">Scoped session</text>
      </svg>`;

    case "verify-call":
      return `<svg class="hlp-diagram" viewBox="0 0 640 116" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="16" width="608" height="84" rx="16" fill="#141413" stroke="rgba(250,249,245,0.14)" stroke-width="1.4"/>
        <circle cx="38" cy="36" r="4" fill="#d97757"/><circle cx="52" cy="36" r="4" fill="#b0aea5"/><circle cx="66" cy="36" r="4" fill="#788c5d"/>
        <text x="38" y="64" fill="#d97757" font-size="12" font-family="var(--font-mono)">&gt; sandbox_status()</text>
        <text x="38" y="84" fill="#9fd8a8" font-size="12" font-family="var(--font-mono)">ok · 11 runtimes ready · isolated workspace · 50 MB quota available</text>
      </svg>`;

    case "keys-separation":
      return `<svg class="hlp-diagram" viewBox="0 0 640 136" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="22" width="180" height="92" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="106" y="52" text-anchor="middle" fill="#d97757" font-size="10.5" font-weight="600" font-family="var(--font-mono)">GATEWAY KEY</text>
        <text x="106" y="74" text-anchor="middle" fill="var(--fg)" font-size="13.5" font-weight="600" font-family="var(--font-sans)">Krix API Key</text>
        <text x="106" y="94" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Authenticates your client</text>
        <path class="hlp-flow-line" d="M196 68 H258" stroke="#d97757" stroke-width="2" stroke-dasharray="5 5"/>
        <rect x="260" y="18" width="120" height="100" rx="16" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.4"/>
        <text x="320" y="62" text-anchor="middle" fill="#faf9f5" font-size="13" font-weight="600" font-family="var(--font-serif)">Encrypted</text>
        <text x="320" y="82" text-anchor="middle" fill="#d97757" font-size="11.5" font-family="var(--font-mono)">Vault</text>
        <path class="hlp-flow-line" d="M380 68 H442" stroke="#788c5d" stroke-width="2" stroke-dasharray="5 5"/>
        <rect x="444" y="22" width="180" height="92" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="534" y="52" text-anchor="middle" fill="#788c5d" font-size="10.5" font-weight="600" font-family="var(--font-mono)">PROVIDER TOKENS</text>
        <text x="534" y="74" text-anchor="middle" fill="var(--fg)" font-size="13.5" font-weight="600" font-family="var(--font-sans)">GitHub &amp; Render</text>
        <text x="534" y="94" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Workspace or per-key</text>
      </svg>`;

    case "permission-cascade":
      return `<svg class="hlp-diagram" viewBox="0 0 640 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="12" y="28" width="136" height="64" rx="12" fill="var(--bg-surface-0)" stroke="#d97757" stroke-width="1.5"/>
        <text x="80" y="55" text-anchor="middle" fill="var(--fg)" font-size="12" font-weight="600" font-family="var(--font-sans)">1. Token Check</text>
        <text x="80" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Required credentials</text>
        <path d="M148 60 H172" stroke="var(--border-medium)" stroke-width="1.8"/>
        <rect x="172" y="28" width="136" height="64" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="240" y="55" text-anchor="middle" fill="var(--fg)" font-size="12" font-weight="600" font-family="var(--font-sans)">2. Per-Key Rule</text>
        <text x="240" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Key overrides</text>
        <path d="M308 60 H332" stroke="var(--border-medium)" stroke-width="1.8"/>
        <rect x="332" y="28" width="136" height="64" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="400" y="55" text-anchor="middle" fill="var(--fg)" font-size="12" font-weight="600" font-family="var(--font-sans)">3. Workspace</text>
        <text x="400" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Account toggles</text>
        <path d="M468 60 H492" stroke="var(--border-medium)" stroke-width="1.8"/>
        <rect x="492" y="28" width="136" height="64" rx="12" fill="var(--bg-surface-1)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="560" y="55" text-anchor="middle" fill="var(--fg)" font-size="12" font-weight="600" font-family="var(--font-sans)">4. Defaults</text>
        <text x="560" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Sandbox + Core Git</text>
      </svg>`;

    case "github-explore":
      return `<svg class="hlp-diagram" viewBox="0 0 640 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="20" width="184" height="88" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="34" y="46" fill="#d97757" font-size="11" font-family="var(--font-mono)">git_tree</text>
        <text x="34" y="66" fill="var(--fg-2)" font-size="11" font-family="var(--font-mono)">├─ src/index.ts</text>
        <text x="34" y="84" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">└─ src/auth.ts</text>
        <path class="hlp-flow-line" d="M200 64 H232" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="232" y="20" width="184" height="88" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="250" y="46" fill="#6a9bcc" font-size="11" font-family="var(--font-mono)">view_file_outline</text>
        <text x="250" y="66" fill="var(--fg-2)" font-size="11" font-family="var(--font-mono)">fn verifyToken()</text>
        <text x="250" y="84" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">fn createSession()</text>
        <path class="hlp-flow-line" d="M416 64 H448" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="448" y="20" width="176" height="88" rx="14" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.4"/>
        <text x="466" y="46" fill="#9fd8a8" font-size="11" font-family="var(--font-mono)">str_replace_editor</text>
        <text x="466" y="66" fill="#f87171" font-size="11" font-family="var(--font-mono)">- old line</text>
        <text x="466" y="84" fill="#9fd8a8" font-size="11" font-family="var(--font-mono)">+ updated line</text>
      </svg>`;

    case "github-pr-flow":
      return `<svg class="hlp-diagram" viewBox="0 0 640 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <line x1="60" y1="60" x2="580" y2="60" stroke="var(--border-medium)" stroke-width="2"/>
        <path class="hlp-flow-line" d="M160 60 C210 60, 210 28, 260 28 H390 C440 28, 440 60, 490 60" stroke="#d97757" stroke-width="2.2" stroke-dasharray="5 4"/>
        <circle cx="96" cy="60" r="8" fill="var(--fg)"/>
        <circle cx="160" cy="60" r="8" fill="#d97757"/>
        <circle cx="290" cy="28" r="8" fill="#d97757"/>
        <circle cx="370" cy="28" r="8" fill="#d97757"/>
        <circle cx="490" cy="60" r="9" fill="#788c5d"/>
        <text x="96" y="92" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">main</text>
        <text x="290" y="16" text-anchor="middle" fill="var(--fg-2)" font-size="11" font-family="var(--font-mono)">create_branch</text>
        <text x="370" y="16" text-anchor="middle" fill="var(--fg-2)" font-size="11" font-family="var(--font-mono)">push_files</text>
        <text x="490" y="92" text-anchor="middle" fill="#788c5d" font-size="11" font-family="var(--font-mono)">create_pull_request</text>
      </svg>`;

    case "github-extended":
      return `<svg class="hlp-diagram" viewBox="0 0 640 118" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="22" width="144" height="74" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="88" y="54" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Issues</text>
        <text x="88" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">list · write · sub</text>
        <rect x="172" y="22" width="144" height="74" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="244" y="54" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">PR Reviews</text>
        <text x="244" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">comment · merge</text>
        <rect x="328" y="22" width="144" height="74" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="400" y="54" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Releases</text>
        <text x="400" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">tags · commits</text>
        <rect x="484" y="22" width="140" height="74" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="554" y="54" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Teams &amp; Repo</text>
        <text x="554" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">fork · scan · users</text>
      </svg>`;

    case "sandbox-runtime":
      return `<svg class="hlp-diagram" viewBox="0 0 640 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="14" width="608" height="104" rx="18" fill="var(--bg-surface-1)" stroke="var(--border-medium)" stroke-dasharray="6 5" stroke-width="1.5"/>
        <text x="36" y="36" fill="#d97757" font-size="10.5" font-weight="600" font-family="var(--font-mono)">ISOLATED USER WORKSPACE</text>
        <rect x="36" y="48" width="176" height="54" rx="12" fill="#141413"/>
        <text x="124" y="72" text-anchor="middle" fill="#faf9f5" font-size="12" font-family="var(--font-mono)">sandbox_exec / run</text>
        <text x="124" y="90" text-anchor="middle" fill="#9c9a92" font-size="10.5" font-family="var(--font-sans)">Persistent shell · 11+ langs</text>
        <rect x="232" y="48" width="176" height="54" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="320" y="72" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">sandbox_file</text>
        <text x="320" y="90" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Safe read · write · edit</text>
        <rect x="428" y="48" width="176" height="54" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="516" y="72" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">sandbox_ps</text>
        <text x="516" y="90" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Background jobs &amp; logs</text>
      </svg>`;

    case "sandbox-git":
      return `<svg class="hlp-diagram" viewBox="0 0 640 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="28" width="136" height="64" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="84" y="56" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">git_clone</text>
        <text x="84" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Fetch repo locally</text>
        <path class="hlp-flow-line" d="M152 60 H184" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="184" y="28" width="136" height="64" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="252" y="56" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">sandbox_exec</text>
        <text x="252" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Build &amp; run tests</text>
        <path class="hlp-flow-line" d="M320 60 H352" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="352" y="28" width="116" height="64" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="410" y="56" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">git_diff</text>
        <text x="410" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="10.5" font-family="var(--font-sans)">Review changes</text>
        <path class="hlp-flow-line" d="M468 60 H500" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="500" y="28" width="124" height="64" rx="12" fill="#141413"/>
        <text x="562" y="56" text-anchor="middle" fill="#9fd8a8" font-size="11.5" font-family="var(--font-mono)">git_commit_push</text>
        <text x="562" y="74" text-anchor="middle" fill="#9c9a92" font-size="10.5" font-family="var(--font-sans)">Ship to remote</text>
      </svg>`;

    case "render-cloud":
      return `<svg class="hlp-diagram" viewBox="0 0 640 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="28" width="150" height="76" rx="14" fill="#141413"/>
        <text x="91" y="58" text-anchor="middle" fill="#d97757" font-size="10.5" font-family="var(--font-mono)">WORKSPACE</text>
        <text x="91" y="79" text-anchor="middle" fill="#faf9f5" font-size="13" font-weight="600" font-family="var(--font-serif)">Render API</text>
        <path class="hlp-flow-line" d="M166 66 H214" stroke="#d97757" stroke-width="2" stroke-dasharray="4 4"/>
        <rect x="214" y="18" width="190" height="44" rx="11" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="309" y="44" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">Services · Static · Cron</text>
        <rect x="214" y="72" width="190" height="44" rx="11" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="309" y="98" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">Deploys · Env Vars</text>
        <path class="hlp-flow-line" d="M404 40 H448 M404 94 H448" stroke="#6a9bcc" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="448" y="18" width="176" height="44" rx="11" fill="var(--bg-surface-1)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="536" y="44" text-anchor="middle" fill="var(--fg-2)" font-size="12" font-family="var(--font-mono)">Logs &amp; Metrics</text>
        <rect x="448" y="72" width="176" height="44" rx="11" fill="var(--bg-surface-1)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="536" y="98" text-anchor="middle" fill="var(--fg-2)" font-size="12" font-family="var(--font-mono)">Postgres SQL</text>
      </svg>`;

    case "code-graph-net":
      return `<svg class="hlp-diagram" viewBox="0 0 640 138" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path class="hlp-flow-line" d="M120 68 L250 38 M120 68 L250 98 M250 38 L396 68 M250 98 L396 68 M396 68 L530 42" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <path d="M396 68 L530 98" stroke="var(--border-medium)" stroke-width="1.5" stroke-dasharray="3 4"/>
        <circle cx="120" cy="68" r="24" fill="#141413" stroke="#d97757" stroke-width="2"/>
        <text x="120" y="72" text-anchor="middle" fill="#faf9f5" font-size="10.5" font-family="var(--font-mono)">entry</text>
        <circle cx="250" cy="38" r="22" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.6"/>
        <text x="250" y="42" text-anchor="middle" fill="var(--fg)" font-size="10" font-family="var(--font-mono)">auth</text>
        <circle cx="250" cy="98" r="22" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.6"/>
        <text x="250" y="102" text-anchor="middle" fill="var(--fg)" font-size="10" font-family="var(--font-mono)">router</text>
        <circle cx="396" cy="68" r="25" fill="var(--accent-soft)" stroke="#d97757" stroke-width="1.8"/>
        <text x="396" y="72" text-anchor="middle" fill="var(--fg)" font-size="10" font-family="var(--font-mono)">service</text>
        <circle cx="530" cy="42" r="20" fill="var(--bg-surface-0)" stroke="#788c5d" stroke-width="1.6"/>
        <text x="530" y="46" text-anchor="middle" fill="var(--fg)" font-size="10" font-family="var(--font-mono)">db</text>
        <circle cx="530" cy="98" r="18" fill="var(--bg-surface-2)" stroke="var(--border-subtle)" stroke-dasharray="3 3" stroke-width="1.4"/>
        <text x="530" y="102" text-anchor="middle" fill="var(--fg-3)" font-size="9.5" font-family="var(--font-mono)">dead</text>
      </svg>`;

    case "files-lifecycle":
      return `<svg class="hlp-diagram" viewBox="0 0 640 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="26" width="166" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="99" y="56" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Browser /upload</text>
        <text x="99" y="76" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">24h scratch</text>
        <path class="hlp-flow-line" d="M182 64 H236" stroke="#d97757" stroke-width="2" stroke-dasharray="4 4"/>
        <rect x="236" y="26" width="168" height="76" rx="14" fill="#141413"/>
        <text x="320" y="56" text-anchor="middle" fill="#faf9f5" font-size="12.5" font-weight="600" font-family="var(--font-mono)">sandbox/upload/</text>
        <text x="320" y="76" text-anchor="middle" fill="#9c9a92" font-size="11" font-family="var(--font-sans)">Process &amp; generate</text>
        <path class="hlp-flow-line" d="M404 64 H458" stroke="#788c5d" stroke-width="2" stroke-dasharray="4 4"/>
        <rect x="458" y="26" width="166" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="541" y="56" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Saved /store</text>
        <text x="541" y="76" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">Private or Permanent</text>
      </svg>`;

    case "security-shield":
      return `<svg class="hlp-diagram" viewBox="0 0 640 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="22" width="184" height="84" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="108" y="54" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Encrypted Storage</text>
        <text x="108" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Tokens protected at rest</text>
        <rect x="228" y="22" width="184" height="84" rx="14" fill="#141413"/>
        <text x="320" y="54" text-anchor="middle" fill="#faf9f5" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Isolated Workspace</text>
        <text x="320" y="74" text-anchor="middle" fill="#d97757" font-size="11" font-family="var(--font-mono)">50 MB · Private</text>
        <rect x="440" y="22" width="184" height="84" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="532" y="54" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Instant Control</text>
        <text x="532" y="74" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Alerts · 30d grace</text>
      </svg>`;

    case "hub-keys-banner":
      return `<svg class="hlp-diagram" viewBox="0 0 640 108" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="12" y="20" width="180" height="68" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="102" y="48" text-anchor="middle" fill="#d97757" font-size="11" font-family="var(--font-mono)">STEP 01</text>
        <text x="102" y="68" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Create API Key</text>
        <path class="hlp-flow-line" d="M192 54 H230" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="230" y="20" width="180" height="68" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="320" y="48" text-anchor="middle" fill="#d97757" font-size="11" font-family="var(--font-mono)">STEP 02</text>
        <text x="320" y="68" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Add Provider Tokens</text>
        <path class="hlp-flow-line" d="M410 54 H448" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="448" y="20" width="180" height="68" rx="14" fill="#141413"/>
        <text x="538" y="48" text-anchor="middle" fill="#9fd8a8" font-size="11" font-family="var(--font-mono)">STEP 03</text>
        <text x="538" y="68" text-anchor="middle" fill="#faf9f5" font-size="13" font-weight="600" font-family="var(--font-sans)">Enable Tool Groups</text>
      </svg>`;

    case "limits-gauge":
      return `<svg class="hlp-diagram" viewBox="0 0 640 108" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="16" y="18" width="608" height="72" rx="14" fill="var(--bg-surface-1)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="40" y="44" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">Account Storage Quota</text>
        <text x="600" y="44" text-anchor="end" fill="#d97757" font-size="12" font-family="var(--font-mono)">50 MB isolated</text>
        <rect x="40" y="58" width="560" height="12" rx="6" fill="var(--bg-surface-2)"/>
        <rect x="40" y="58" width="210" height="12" rx="6" fill="#d97757"/>
        <rect x="256" y="58" width="120" height="12" rx="6" fill="#788c5d"/>
      </svg>`;

    default:
      return "";
  }
}
