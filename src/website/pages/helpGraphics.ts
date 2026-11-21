// Bespoke Anthropic-styled editorial SVG graphics for Krix Help Center & Legal pages.
// Built with generous inner safe-margins (zero clipping), clean hairline connectors with soft anchor dots
// (zero clunky polygon arrows), theme-aware CSS variables, and reduced-motion-safe animation classes.

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
      return `<svg class="doc-diagram" viewBox="0 0 680 148" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="32" width="174" height="84" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="111" y="66" text-anchor="middle" fill="var(--fg)" font-size="13.5" font-weight="600" font-family="var(--font-sans)">MCP Client</text>
        <text x="111" y="88" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">Editor · CLI · Agent</text>
        <line class="doc-flow-line" x1="198" y1="74" x2="254" y2="74" stroke="#d97757" stroke-width="2" stroke-dasharray="5 5"/>
        <circle cx="198" cy="74" r="3.5" fill="#d97757"/>
        <circle cx="254" cy="74" r="3.5" fill="#d97757"/>
        <rect x="254" y="22" width="172" height="104" rx="18" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.4"/>
        <text x="340" y="56" text-anchor="middle" fill="#d97757" font-size="11" font-weight="600" font-family="var(--font-mono)">POST / GET /mcp</text>
        <text x="340" y="80" text-anchor="middle" fill="#faf9f5" font-size="15" font-weight="600" font-family="var(--font-serif)">Krix Gateway</text>
        <text x="340" y="102" text-anchor="middle" fill="#9c9a92" font-size="11" font-family="var(--font-sans)">Auth · Policy · Routing</text>
        <line class="doc-flow-line" x1="426" y1="74" x2="482" y2="74" stroke="#788c5d" stroke-width="2" stroke-dasharray="5 5"/>
        <circle cx="426" cy="74" r="3.5" fill="#788c5d"/>
        <circle cx="482" cy="74" r="3.5" fill="#788c5d"/>
        <rect x="482" y="32" width="174" height="84" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="569" y="66" text-anchor="middle" fill="var(--fg)" font-size="13.5" font-weight="600" font-family="var(--font-sans)">Isolated Tools</text>
        <text x="569" y="88" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">Git · Sandbox · Cloud</text>
      </svg>`;

    case "oauth-handshake":
      return `<svg class="doc-diagram" viewBox="0 0 680 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="28" width="176" height="84" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="112" y="62" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">1. Discover</text>
        <text x="112" y="84" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">/mcp metadata</text>
        <line class="doc-flow-line" x1="200" y1="70" x2="252" y2="70" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 5"/>
        <circle cx="200" cy="70" r="3.2" fill="#d97757"/>
        <circle cx="252" cy="70" r="3.2" fill="#d97757"/>
        <rect x="252" y="28" width="176" height="84" rx="16" fill="var(--bg-surface-1)" stroke="#d97757" stroke-width="1.5"/>
        <text x="340" y="62" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">2. Approve</text>
        <text x="340" y="84" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">Browser consent</text>
        <line class="doc-flow-line" x1="428" y1="70" x2="480" y2="70" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 5"/>
        <circle cx="428" cy="70" r="3.2" fill="#788c5d"/>
        <circle cx="480" cy="70" r="3.2" fill="#788c5d"/>
        <rect x="480" y="28" width="176" height="84" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="568" y="62" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">3. Connected</text>
        <text x="568" y="84" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">Scoped session</text>
      </svg>`;

    case "verify-call":
      return `<svg class="doc-diagram" viewBox="0 0 680 124" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="18" width="632" height="88" rx="16" fill="#141413" stroke="rgba(250,249,245,0.14)" stroke-width="1.4"/>
        <circle cx="48" cy="39" r="4" fill="#d97757"/>
        <circle cx="62" cy="39" r="4" fill="#b0aea5"/>
        <circle cx="76" cy="39" r="4" fill="#788c5d"/>
        <text x="48" y="68" fill="#d97757" font-size="12.5" font-family="var(--font-mono)">&gt; sandbox_status()</text>
        <text x="48" y="90" fill="#9fd8a8" font-size="12" font-family="var(--font-mono)">ok · 11 runtimes ready · isolated workspace · 50 MB quota available</text>
      </svg>`;

    case "keys-separation":
      return `<svg class="doc-diagram" viewBox="0 0 680 148" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="26" width="194" height="96" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="121" y="56" text-anchor="middle" fill="#d97757" font-size="10.5" font-weight="600" font-family="var(--font-mono)">GATEWAY KEY</text>
        <text x="121" y="79" text-anchor="middle" fill="var(--fg)" font-size="14" font-weight="600" font-family="var(--font-sans)">Krix API Key</text>
        <text x="121" y="100" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-sans)">Authenticates your client</text>
        <line class="doc-flow-line" x1="218" y1="74" x2="274" y2="74" stroke="#d97757" stroke-width="2" stroke-dasharray="5 5"/>
        <circle cx="218" cy="74" r="3.5" fill="#d97757"/>
        <circle cx="274" cy="74" r="3.5" fill="#d97757"/>
        <rect x="274" y="22" width="132" height="104" rx="18" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.4"/>
        <text x="340" y="68" text-anchor="middle" fill="#faf9f5" font-size="14" font-weight="600" font-family="var(--font-serif)">Encrypted</text>
        <text x="340" y="90" text-anchor="middle" fill="#d97757" font-size="12" font-family="var(--font-mono)">Vault</text>
        <line class="doc-flow-line" x1="406" y1="74" x2="462" y2="74" stroke="#788c5d" stroke-width="2" stroke-dasharray="5 5"/>
        <circle cx="406" cy="74" r="3.5" fill="#788c5d"/>
        <circle cx="462" cy="74" r="3.5" fill="#788c5d"/>
        <rect x="462" y="26" width="194" height="96" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="559" y="56" text-anchor="middle" fill="#788c5d" font-size="10.5" font-weight="600" font-family="var(--font-mono)">PROVIDER TOKENS</text>
        <text x="559" y="79" text-anchor="middle" fill="var(--fg)" font-size="14" font-weight="600" font-family="var(--font-sans)">GitHub &amp; Render</text>
        <text x="559" y="100" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-sans)">Workspace or per-key</text>
      </svg>`;

    case "permission-cascade":
      return `<svg class="doc-diagram" viewBox="0 0 680 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="28" width="142" height="76" rx="14" fill="var(--bg-surface-0)" stroke="#d97757" stroke-width="1.5"/>
        <text x="95" y="60" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">1. Token Check</text>
        <text x="95" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Credentials valid</text>
        <line x1="166" y1="66" x2="188" y2="66" stroke="var(--border-medium)" stroke-width="1.6"/>
        <circle cx="177" cy="66" r="2.8" fill="#d97757"/>
        <rect x="188" y="28" width="142" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="259" y="60" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">2. Per-Key Rule</text>
        <text x="259" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Key overrides</text>
        <line x1="330" y1="66" x2="352" y2="66" stroke="var(--border-medium)" stroke-width="1.6"/>
        <circle cx="341" cy="66" r="2.8" fill="var(--fg-3)"/>
        <rect x="352" y="28" width="142" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="423" y="60" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">3. Workspace</text>
        <text x="423" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Account toggles</text>
        <line x1="494" y1="66" x2="516" y2="66" stroke="var(--border-medium)" stroke-width="1.6"/>
        <circle cx="505" cy="66" r="2.8" fill="#788c5d"/>
        <rect x="516" y="28" width="140" height="76" rx="14" fill="var(--bg-surface-1)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="586" y="60" text-anchor="middle" fill="var(--fg)" font-size="12.5" font-weight="600" font-family="var(--font-sans)">4. Defaults</text>
        <text x="586" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Sandbox + Git</text>
      </svg>`;

    case "github-explore":
      return `<svg class="doc-diagram" viewBox="0 0 680 144" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="24" width="190" height="96" rx="15" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="44" y="52" fill="#d97757" font-size="11.5" font-weight="600" font-family="var(--font-mono)">git_tree</text>
        <text x="44" y="75" fill="var(--fg-2)" font-size="11.5" font-family="var(--font-mono)">src/index.ts</text>
        <text x="44" y="96" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">src/auth.ts</text>
        <line class="doc-flow-line" x1="214" y1="72" x2="245" y2="72" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <circle cx="214" cy="72" r="3" fill="#d97757"/>
        <circle cx="245" cy="72" r="3" fill="#d97757"/>
        <rect x="245" y="24" width="190" height="96" rx="15" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="265" y="52" fill="#6a9bcc" font-size="11.5" font-weight="600" font-family="var(--font-mono)">view_file_outline</text>
        <text x="265" y="75" fill="var(--fg-2)" font-size="11.5" font-family="var(--font-mono)">fn verifyToken()</text>
        <text x="265" y="96" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">fn createSession()</text>
        <line class="doc-flow-line" x1="435" y1="72" x2="466" y2="72" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 4"/>
        <circle cx="435" cy="72" r="3" fill="#788c5d"/>
        <circle cx="466" cy="72" r="3" fill="#788c5d"/>
        <rect x="466" y="24" width="190" height="96" rx="15" fill="#141413" stroke="rgba(250,249,245,0.16)" stroke-width="1.4"/>
        <text x="486" y="52" fill="#9fd8a8" font-size="11.5" font-weight="600" font-family="var(--font-mono)">str_replace_editor</text>
        <text x="486" y="75" fill="#f87171" font-size="11.5" font-family="var(--font-mono)">- old block</text>
        <text x="486" y="96" fill="#9fd8a8" font-size="11.5" font-family="var(--font-mono)">+ updated block</text>
      </svg>`;

    case "github-pr-flow":
      return `<svg class="doc-diagram" viewBox="0 0 680 148" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <line x1="68" y1="92" x2="612" y2="92" stroke="var(--border-medium)" stroke-width="2" stroke-linecap="round"/>
        <path class="doc-flow-line" d="M170 92 C214 92, 224 48, 272 48 H416 C464 48, 474 92, 518 92" stroke="#d97757" stroke-width="2.2" stroke-dasharray="5 5"/>
        <circle cx="96" cy="92" r="7.5" fill="var(--fg)"/>
        <circle cx="170" cy="92" r="7.5" fill="#d97757"/>
        <circle cx="296" cy="48" r="7.5" fill="#d97757"/>
        <circle cx="392" cy="48" r="7.5" fill="#d97757"/>
        <circle cx="518" cy="92" r="8.5" fill="#788c5d"/>
        <text x="96" y="124" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">main</text>
        <text x="296" y="28" text-anchor="middle" fill="var(--fg-2)" font-size="11.5" font-family="var(--font-mono)">create_branch</text>
        <text x="392" y="28" text-anchor="middle" fill="var(--fg-2)" font-size="11.5" font-family="var(--font-mono)">push_files</text>
        <text x="518" y="124" text-anchor="middle" fill="#788c5d" font-size="11.5" font-family="var(--font-mono)">create_pull_request</text>
      </svg>`;

    case "github-extended":
      return `<svg class="doc-diagram" viewBox="0 0 680 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="26" width="148" height="80" rx="15" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="98" y="60" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Issues</text>
        <text x="98" y="82" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">list · write · sub</text>
        <rect x="186" y="26" width="148" height="80" rx="15" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="260" y="60" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">PR Reviews</text>
        <text x="260" y="82" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">comment · merge</text>
        <rect x="348" y="26" width="148" height="80" rx="15" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="422" y="60" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Releases</text>
        <text x="422" y="82" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">tags · commits</text>
        <rect x="510" y="26" width="146" height="80" rx="15" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="583" y="60" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Teams &amp; Repo</text>
        <text x="583" y="82" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-mono)">fork · scan · users</text>
      </svg>`;

    case "sandbox-runtime":
      return `<svg class="doc-diagram" viewBox="0 0 680 144" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="18" width="632" height="108" rx="18" fill="var(--bg-surface-1)" stroke="var(--border-medium)" stroke-dasharray="6 5" stroke-width="1.4"/>
        <text x="44" y="42" fill="#d97757" font-size="11" font-weight="600" font-family="var(--font-mono)">ISOLATED USER WORKSPACE</text>
        <rect x="44" y="54" width="186" height="56" rx="13" fill="#141413"/>
        <text x="137" y="79" text-anchor="middle" fill="#faf9f5" font-size="12" font-family="var(--font-mono)">sandbox_exec / run</text>
        <text x="137" y="98" text-anchor="middle" fill="#9c9a92" font-size="11" font-family="var(--font-sans)">Persistent shell · 11+ langs</text>
        <rect x="247" y="54" width="186" height="56" rx="13" fill="var(--bg-surface-0)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="340" y="79" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">sandbox_file</text>
        <text x="340" y="98" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Safe read · write · edit</text>
        <rect x="450" y="54" width="186" height="56" rx="13" fill="var(--bg-surface-0)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="543" y="79" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">sandbox_ps</text>
        <text x="543" y="98" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Background jobs &amp; logs</text>
      </svg>`;

    case "sandbox-git":
      return `<svg class="doc-diagram" viewBox="0 0 680 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="28" width="136" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="92" y="60" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">git_clone</text>
        <text x="92" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Fetch repo</text>
        <line class="doc-flow-line" x1="160" y1="66" x2="186" y2="66" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="186" y="28" width="142" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="257" y="60" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">sandbox_exec</text>
        <text x="257" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Build &amp; test</text>
        <line class="doc-flow-line" x1="328" y1="66" x2="354" y2="66" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="354" y="28" width="124" height="76" rx="14" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="416" y="60" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">git_diff</text>
        <text x="416" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11" font-family="var(--font-sans)">Review diff</text>
        <line class="doc-flow-line" x1="478" y1="66" x2="504" y2="66" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="504" y="28" width="152" height="76" rx="14" fill="#141413"/>
        <text x="580" y="60" text-anchor="middle" fill="#9fd8a8" font-size="11.5" font-family="var(--font-mono)">git_commit_push</text>
        <text x="580" y="81" text-anchor="middle" fill="#9c9a92" font-size="11" font-family="var(--font-sans)">Push verified code</text>
      </svg>`;

    case "render-cloud":
      return `<svg class="doc-diagram" viewBox="0 0 680 144" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="30" width="156" height="84" rx="16" fill="#141413"/>
        <text x="102" y="62" text-anchor="middle" fill="#d97757" font-size="10.5" font-weight="600" font-family="var(--font-mono)">WORKSPACE</text>
        <text x="102" y="86" text-anchor="middle" fill="#faf9f5" font-size="14" font-weight="600" font-family="var(--font-serif)">Render API</text>
        <path class="doc-flow-line" d="M180 72 H226" stroke="#d97757" stroke-width="2" stroke-dasharray="4 4"/>
        <circle cx="180" cy="72" r="3.2" fill="#d97757"/>
        <circle cx="226" cy="72" r="3.2" fill="#d97757"/>
        <rect x="226" y="20" width="196" height="46" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="324" y="48" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">Services · Static · Cron</text>
        <rect x="226" y="78" width="196" height="46" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="324" y="106" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">Deploys · Env Vars</text>
        <path class="doc-flow-line" d="M422 43 H466 M422 101 H466" stroke="#6a9bcc" stroke-width="1.8" stroke-dasharray="4 4"/>
        <circle cx="466" cy="43" r="3" fill="#6a9bcc"/>
        <circle cx="466" cy="101" r="3" fill="#6a9bcc"/>
        <rect x="466" y="20" width="190" height="46" rx="12" fill="var(--bg-surface-1)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="561" y="48" text-anchor="middle" fill="var(--fg-2)" font-size="12" font-family="var(--font-mono)">Logs &amp; Metrics</text>
        <rect x="466" y="78" width="190" height="46" rx="12" fill="var(--bg-surface-1)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="561" y="106" text-anchor="middle" fill="var(--fg-2)" font-size="12" font-family="var(--font-mono)">Postgres SQL</text>
      </svg>`;

    case "code-graph-net":
      return `<svg class="doc-diagram" viewBox="0 0 680 156" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path class="doc-flow-line" d="M148 78 C176 78, 178 44, 206 44" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <path class="doc-flow-line" d="M148 78 C176 78, 178 112, 206 112" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <path class="doc-flow-line" d="M326 44 C354 44, 356 78, 384 78" stroke="#3d7a6a" stroke-width="1.8" stroke-dasharray="4 4"/>
        <path class="doc-flow-line" d="M326 112 C354 112, 356 78, 384 78" stroke="#3d7a6a" stroke-width="1.8" stroke-dasharray="4 4"/>
        <path class="doc-flow-line" d="M506 78 C524 78, 528 44, 544 44" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 4"/>
        <path d="M506 78 C524 78, 528 112, 544 112" stroke="var(--border-medium)" stroke-width="1.4" stroke-dasharray="3 4"/>
        <rect x="24" y="54" width="124" height="48" rx="12" fill="#141413" stroke="#d97757" stroke-width="1.6"/>
        <text x="86" y="83" text-anchor="middle" fill="#faf9f5" font-size="12" font-family="var(--font-mono)">entry.ts</text>
        <rect x="206" y="20" width="120" height="48" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="266" y="49" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">auth.ts</text>
        <rect x="206" y="88" width="120" height="48" rx="12" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="266" y="117" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">router.ts</text>
        <rect x="384" y="54" width="122" height="48" rx="12" fill="var(--accent-soft)" stroke="#d97757" stroke-width="1.6"/>
        <text x="445" y="83" text-anchor="middle" fill="var(--fg)" font-size="12" font-weight="600" font-family="var(--font-mono)">service.ts</text>
        <rect x="544" y="20" width="112" height="48" rx="12" fill="var(--bg-surface-0)" stroke="#788c5d" stroke-width="1.5"/>
        <text x="600" y="49" text-anchor="middle" fill="var(--fg)" font-size="12" font-family="var(--font-mono)">db.ts</text>
        <rect x="544" y="88" width="112" height="48" rx="12" fill="var(--bg-surface-2)" stroke="var(--border-medium)" stroke-dasharray="4 3" stroke-width="1.3"/>
        <text x="600" y="117" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">unused()</text>
      </svg>`;

    case "files-lifecycle":
      return `<svg class="doc-diagram" viewBox="0 0 680 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="28" width="178" height="84" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="113" y="62" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Browser /upload</text>
        <text x="113" y="84" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">24h scratch</text>
        <line class="doc-flow-line" x1="202" y1="70" x2="251" y2="70" stroke="#d97757" stroke-width="2" stroke-dasharray="4 4"/>
        <circle cx="202" cy="70" r="3.2" fill="#d97757"/>
        <circle cx="251" cy="70" r="3.2" fill="#d97757"/>
        <rect x="251" y="28" width="178" height="84" rx="16" fill="#141413"/>
        <text x="340" y="62" text-anchor="middle" fill="#faf9f5" font-size="12.5" font-weight="600" font-family="var(--font-mono)">sandbox/upload/</text>
        <text x="340" y="84" text-anchor="middle" fill="#9c9a92" font-size="11.5" font-family="var(--font-sans)">Process &amp; generate</text>
        <line class="doc-flow-line" x1="429" y1="70" x2="478" y2="70" stroke="#788c5d" stroke-width="2" stroke-dasharray="4 4"/>
        <circle cx="429" cy="70" r="3.2" fill="#788c5d"/>
        <circle cx="478" cy="70" r="3.2" fill="#788c5d"/>
        <rect x="478" y="28" width="178" height="84" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="567" y="62" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Saved /store</text>
        <text x="567" y="84" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-mono)">Private or Permanent</text>
      </svg>`;

    case "security-shield":
      return `<svg class="doc-diagram" viewBox="0 0 680 136" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="24" width="196" height="88" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="122" y="58" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Encrypted Storage</text>
        <text x="122" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-sans)">Tokens protected at rest</text>
        <rect x="242" y="24" width="196" height="88" rx="16" fill="#141413"/>
        <text x="340" y="58" text-anchor="middle" fill="#faf9f5" font-size="13" font-weight="600" font-family="var(--font-sans)">Isolated Workspace</text>
        <text x="340" y="81" text-anchor="middle" fill="#d97757" font-size="11.5" font-family="var(--font-mono)">50 MB · Private</text>
        <rect x="460" y="24" width="196" height="88" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="558" y="58" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Instant Control</text>
        <text x="558" y="81" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-sans)">Alerts · 30d grace</text>
      </svg>`;

    case "hub-keys-banner":
      return `<svg class="doc-diagram" viewBox="0 0 680 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="22" width="186" height="76" rx="15" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="117" y="52" text-anchor="middle" fill="#d97757" font-size="11" font-weight="600" font-family="var(--font-mono)">STEP 01</text>
        <text x="117" y="74" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Create API Key</text>
        <line class="doc-flow-line" x1="210" y1="60" x2="247" y2="60" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <circle cx="210" cy="60" r="3" fill="#d97757"/>
        <circle cx="247" cy="60" r="3" fill="#d97757"/>
        <rect x="247" y="22" width="186" height="76" rx="15" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="340" y="52" text-anchor="middle" fill="#d97757" font-size="11" font-weight="600" font-family="var(--font-mono)">STEP 02</text>
        <text x="340" y="74" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Add Provider Tokens</text>
        <line class="doc-flow-line" x1="433" y1="60" x2="470" y2="60" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 4"/>
        <circle cx="433" cy="60" r="3" fill="#788c5d"/>
        <circle cx="470" cy="60" r="3" fill="#788c5d"/>
        <rect x="470" y="22" width="186" height="76" rx="15" fill="#141413"/>
        <text x="563" y="52" text-anchor="middle" fill="#9fd8a8" font-size="11" font-weight="600" font-family="var(--font-mono)">STEP 03</text>
        <text x="563" y="74" text-anchor="middle" fill="#faf9f5" font-size="13" font-weight="600" font-family="var(--font-sans)">Enable Tool Groups</text>
      </svg>`;

    case "limits-gauge":
      return `<svg class="doc-diagram" viewBox="0 0 680 116" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="20" width="632" height="76" rx="16" fill="var(--bg-surface-1)" stroke="var(--border-subtle)" stroke-width="1.4"/>
        <text x="48" y="48" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Account Storage Quota</text>
        <text x="632" y="48" text-anchor="end" fill="#d97757" font-size="12" font-family="var(--font-mono)">50 MB isolated</text>
        <rect x="48" y="64" width="584" height="12" rx="6" fill="var(--bg-surface-2)"/>
        <rect x="48" y="64" width="220" height="12" rx="6" fill="#d97757"/>
        <rect x="276" y="64" width="128" height="12" rx="6" fill="#788c5d"/>
      </svg>`;

    case "privacy-flow":
      return `<svg class="doc-diagram" viewBox="0 0 680 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="26" width="192" height="80" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="120" y="58" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Your Account</text>
        <text x="120" y="80" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-sans)">Encrypted credentials</text>
        <line class="doc-flow-line" x1="216" y1="66" x2="250" y2="66" stroke="#d97757" stroke-width="1.8" stroke-dasharray="4 4"/>
        <circle cx="216" cy="66" r="3" fill="#d97757"/>
        <circle cx="250" cy="66" r="3" fill="#d97757"/>
        <rect x="250" y="26" width="180" height="80" rx="16" fill="#141413"/>
        <text x="340" y="58" text-anchor="middle" fill="#faf9f5" font-size="13" font-weight="600" font-family="var(--font-sans)">Secret Redaction</text>
        <text x="340" y="80" text-anchor="middle" fill="#9fd8a8" font-size="11" font-family="var(--font-mono)">No training · No selling</text>
        <line class="doc-flow-line" x1="430" y1="66" x2="464" y2="66" stroke="#788c5d" stroke-width="1.8" stroke-dasharray="4 4"/>
        <circle cx="430" cy="66" r="3" fill="#788c5d"/>
        <circle cx="464" cy="66" r="3" fill="#788c5d"/>
        <rect x="464" y="26" width="192" height="80" rx="16" fill="var(--bg-surface-0)" stroke="var(--border-medium)" stroke-width="1.4"/>
        <text x="560" y="58" text-anchor="middle" fill="var(--fg)" font-size="13" font-weight="600" font-family="var(--font-sans)">Full Control</text>
        <text x="560" y="80" text-anchor="middle" fill="var(--fg-3)" font-size="11.5" font-family="var(--font-sans)">Instant revoke · 30d purge</text>
      </svg>`;

    default:
      return "";
  }
}
