// Tools Capabilities Directory with Concise/Verbose Density Toggle and Inspector Drawer
// Contract Invariants: Exact <title>Tools</title>, id="toolSearchInput", placeholder="", data-cat="All", data-cat="Sandbox", data-cat="Render", data-cat="GitHub", data-cat="Files", class="tools-grid", class="tool-box"

import {
  renderPageShell,
  renderAuthRequiredCard,
  escapeHtml,
} from "../components.js";
import { renderSvg } from "../icons.js";

export function renderToolsPage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  tools?: any[];
  summary?: any;
  selectedKeyId?: string;
}): string {
  const isAuthenticated = Boolean(params.owner || params.isOwner);
  if (!isAuthenticated) {
    return renderPageShell({
      title: "Tools",
      activeTab: "tools",
      owner: params.owner,
      content: renderAuthRequiredCard(
        "Tools Directory",
        "Please sign in with your authorized Google Account to inspect available tools.",
        "/tools",
      ),
    });
  }

  const tools = Array.isArray(params.tools) ? params.tools : [];
  const totalCount = tools.length || 117;

  // Build category count
  const categories: Record<string, number> = {};
  tools.forEach((t) => {
    const cat = t.category || "General";
    categories[cat] = (categories[cat] || 0) + 1;
  });

  const standardCats = ["Sandbox", "Render", "GitHub", "Files"];
  standardCats.forEach((c) => {
    if (!categories[c]) categories[c] = 0;
  });

  const content = `
    <!-- Top Header Deck -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">CAPABILITIES MATRIX</div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:4px;">Tools Directory</h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px;">
          Explore and inspect all ${totalCount} MCP tools available in this instance.
        </p>
      </div>

      <!-- Dual Density Toggle & Key Selector -->
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px;">
          <label for="keySelector" style="font-size:12px; color:var(--geist-gray-50); font-weight:500;">Filter Key:</label>
          <select id="keySelector" onchange="onKeyFilterChange(this)" class="krix-select">
            <option value="">All Keys</option>
            ${(params.summary?.keys || [])
              .map((k: any) => {
                const val = k.keyId || k.id;
                const lbl = k.label || val;
                const sel =
                  params.summary?.selectedKeyId === val ? "selected" : "";
                return `<option value="${escapeHtml(val)}" ${sel}>${escapeHtml(lbl)}</option>`;
              })
              .join("")}
          </select>
        </div>
        <div class="density-toggle" style="display:inline-flex; align-items:center; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:6px; padding:3px; gap:2px;">
          <button type="button" id="densityConciseBtn" class="nav-pill active" onclick="setToolDensity('concise')" style="font-size:12px; padding:4px 12px; border-radius:4px;">Concise</button>
          <button type="button" id="densityVerboseBtn" class="nav-pill" onclick="setToolDensity('verbose')" style="font-size:12px; padding:4px 12px; border-radius:4px;">Verbose</button>
        </div>
      </div>
    </div>

    <!-- Telemetry Breakdown Dashboard Card -->
    <div id="toolTelemetryCard" class="card spotlight-card card-top-border" style="padding:22px 24px; margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">TELEMETRY BREAKDOWN</div>
          <h2 id="breakdownToolTitle" style="font-size:18px; font-weight:700; color:var(--fg); margin-top:2px;">All Tools Aggregate</h2>
          <p id="breakdownToolSubtitle" style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Execution statistics across all MCP tool invocations</p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label for="toolBreakdownSelect" style="font-size:12px; color:var(--geist-gray-50); font-weight:500;">Select Tool:</label>
          <select id="toolBreakdownSelect" onchange="selectToolBreakdown(this.value)" class="krix-select" style="max-width:260px;">
            <option value="">All Tools (Global)</option>
            ${tools.map((t) => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)} (${escapeHtml(t.category || "General")})</option>`).join("")}
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:14px;">
        <div style="padding:12px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Invocations</div>
          <div id="metricTotalCalls" style="font-size:18px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:4px;">${params.summary?.totalRequests || 0}</div>
        </div>
        <div style="padding:12px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Success Rate</div>
          <div id="metricSuccessRate" style="font-size:18px; font-weight:700; font-family:var(--font-mono); color:var(--success); margin-top:4px;">${params.summary?.overallSuccessRate != null ? params.summary.overallSuccessRate + "%" : "100%"}</div>
        </div>
        <div style="padding:12px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Failures</div>
          <div id="metricFailures" style="font-size:18px; font-weight:700; font-family:var(--font-mono); color:var(--error); margin-top:4px;">${params.summary?.totalErrors || 0}</div>
        </div>
        <div style="padding:12px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Avg Latency</div>
          <div id="metricLatency" style="font-size:18px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:4px;">${params.summary?.avgDurationMs || 0} ms</div>
        </div>
        <div style="padding:12px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Peak Usage</div>
          <div id="metricPeak" style="font-size:18px; font-weight:700; font-family:var(--font-mono); color:var(--fg); margin-top:4px;">${params.summary?.throughputRpm ? params.summary.throughputRpm + " rpm" : "N/A"}</div>
        </div>
        <div style="padding:12px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
          <div style="font-size:11px; color:var(--geist-gray-50); font-weight:600; text-transform:uppercase;">Last Active</div>
          <div id="metricLastActive" style="font-size:14px; font-weight:600; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">Recent</div>
        </div>
      </div>

      <div id="breakdownToolVerbose" style="font-size:12px; color:var(--geist-gray-50); line-height:1.5; padding:10px 14px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
        Global execution summary across all tools recorded by the Krix MCP runtime.
      </div>
    </div>

    <!-- Search & Category Filters (Contract Invariants: id="toolSearchInput" placeholder="", data-cat pills) -->
    <div class="card spotlight-card" style="padding:16px 20px; margin-bottom:24px; display:flex; flex-direction:column; gap:12px;">
      <div style="display:flex; align-items:center; gap:10px; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:8px 12px;">
        ${renderSvg("search", 16, "text-muted")}
        <input type="text" id="toolSearchInput" placeholder="" oninput="filterTools(this.value)" style="flex:1; font-size:13px; color:var(--fg);">
      </div>

      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button type="button" class="tool-cat-pill active" data-cat="All" onclick="filterCategory('All', this)" style="padding:4px 10px; font-size:11px; font-weight:500; border-radius:var(--radius-full); border:1px solid var(--border-subtle); background:var(--bg-surface-2); color:var(--fg); cursor:pointer;">
          All (${totalCount})
        </button>
        <button type="button" class="tool-cat-pill" data-cat="Sandbox" onclick="filterCategory('Sandbox', this)" style="padding:4px 10px; font-size:11px; font-weight:500; border-radius:var(--radius-full); border:1px solid var(--border-subtle); background:var(--bg-surface-1); color:var(--geist-gray-50); cursor:pointer;">
          Sandbox (${categories["Sandbox"] || 0})
        </button>
        <button type="button" class="tool-cat-pill" data-cat="Render" onclick="filterCategory('Render', this)" style="padding:4px 10px; font-size:11px; font-weight:500; border-radius:var(--radius-full); border:1px solid var(--border-subtle); background:var(--bg-surface-1); color:var(--geist-gray-50); cursor:pointer;">
          Render (${categories["Render"] || 0})
        </button>
        <button type="button" class="tool-cat-pill" data-cat="GitHub" onclick="filterCategory('GitHub', this)" style="padding:4px 10px; font-size:11px; font-weight:500; border-radius:var(--radius-full); border:1px solid var(--border-subtle); background:var(--bg-surface-1); color:var(--geist-gray-50); cursor:pointer;">
          GitHub (${categories["GitHub"] || 0})
        </button>
        <button type="button" class="tool-cat-pill" data-cat="Files" onclick="filterCategory('Files', this)" style="padding:4px 10px; font-size:11px; font-weight:500; border-radius:var(--radius-full); border:1px solid var(--border-subtle); background:var(--bg-surface-1); color:var(--geist-gray-50); cursor:pointer;">
          Files (${categories["Files"] || 0})
        </button>
        ${Object.keys(categories)
          .filter((cat) => !standardCats.includes(cat) && cat !== "All")
          .map(
            (cat) => `
          <button type="button" class="tool-cat-pill" data-cat="${escapeHtml(cat)}" onclick="filterCategory('${escapeHtml(cat)}', this)" style="padding:4px 10px; font-size:11px; font-weight:500; border-radius:var(--radius-full); border:1px solid var(--border-subtle); background:var(--bg-surface-1); color:var(--geist-gray-50); cursor:pointer;">
            ${escapeHtml(cat)} (${categories[cat]})
          </button>
        `,
          )
          .join("")}
      </div>
    </div>

    <!-- Tools Catalog Grid (Contract Invariant: class="tools-grid", class="tool-box") -->
    <div id="toolsGrid" class="tools-grid tools-container concise" style="display:flex; flex-direction:column; gap:8px;">
      ${
        tools.length === 0
          ? `<div style="text-align:center; padding:48px; color:var(--geist-gray-50);">No tools loaded in catalog.</div>`
          : tools
              .map((tool, idx) => {
                const tName = escapeHtml(tool.name || `tool_${idx}`);
                const tDesc = escapeHtml(
                  tool.description || "No description provided",
                );
                const tCat = escapeHtml(tool.category || "General");
                const schemaJson = escapeHtml(
                  JSON.stringify(
                    tool.inputSchema || {
                      type: "object",
                      properties: {},
                      additionalProperties: false,
                    },
                  ),
                );

                return `
            <div class="tool-row tool-box card spotlight-card" data-cat="${tCat}" data-name="${tName}" data-description="${tDesc}" data-schema="${schemaJson}" style="padding:12px 18px; display:flex; align-items:center; justify-content:space-between; gap:16px; cursor:pointer;" onclick="openToolDrawerFromRow(this)" role="button" tabindex="0">
              <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                <div style="width:28px; height:28px; border-radius:6px; background:var(--bg-surface-2); display:flex; align-items:center; justify-content:center; color:var(--fg); flex-shrink:0;">
                  ${renderSvg("terminal", 14)}
                </div>
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:600; font-family:var(--font-mono); font-size:13px; color:var(--fg); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${tName}</div>
                  <div class="tool-desc" style="font-size:12px; color:var(--geist-gray-50); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-top:2px;">${tDesc}</div>
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
                <span style="font-size:11px; padding:2px 8px; border-radius:var(--radius-full); background:var(--bg-surface-2); border:1px solid var(--border-subtle); color:var(--geist-gray-50);">
                  ${tCat}
                </span>
                ${renderSvg("chevron-right", 14, "text-muted")}
              </div>
            </div>
          `;
              })
              .join("")
      }
    </div>

    <div id="toolsPagination" class="permission-pagination" style="display:flex; justify-content:space-between; align-items:center; padding:16px 4px 0; border-top:1px solid var(--border-subtle); margin:16px 0 28px; font-size:12px; color:var(--geist-gray-50); flex-wrap:wrap; gap:10px;">
      <div id="toolsPageInfo">Showing 1-${Math.min(tools.length, 10)} of ${tools.length} tools</div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button type="button" class="pager-btn pager-prev" id="toolsPrevPage" onclick="changeToolsPage(-1)" aria-label="Previous page">${renderSvg("chevron-left", 16)}<span>Previous</span></button>
        <span id="toolsPageIndicator" style="font-family:var(--font-mono); font-size:11px; padding:0 6px;">1 / 1</span>
        <button type="button" class="pager-btn pager-next" id="toolsNextPage" onclick="changeToolsPage(1)" aria-label="Next page"><span>Next</span>${renderSvg("chevron-right", 16)}</button>
      </div>
    </div>

    <style>
      /* Keep the inspector below the persistent mobile and desktop app headers. */
      #toolDrawer {
        top: 56px !important;
        bottom: 0 !important;
        height: calc(100dvh - 56px) !important;
        max-height: calc(100dvh - 56px) !important;
        z-index: 900 !important;
      }
      @media (max-width: 768px) {
        #toolDrawer {
          inset: 104px 0 0 0 !important;
          top: 104px !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          max-width: 100vw !important;
          height: calc(100dvh - 104px) !important;
          max-height: calc(100dvh - 104px) !important;
          padding: 0 14px 14px !important;
          border-left: 0 !important;
          border-top: 1px solid var(--border-medium) !important;
          border-radius: 14px 14px 0 0 !important;
          box-sizing: border-box !important;
          z-index: 900 !important;
        }
        #toolDrawer .tool-drawer-header {
          position: sticky !important;
          top: 0 !important;
          min-height: 52px !important;
          padding: 10px 0 10px !important;
          margin: 0 0 12px !important;
          gap: 8px !important;
          box-sizing: border-box !important;
        }
        #toolDrawer .tool-drawer-header > div {
          min-width: 0 !important;
        }
        #toolDrawer .tool-drawer-header button {
          width: 34px !important;
          min-width: 34px !important;
          height: 34px !important;
          min-height: 34px !important;
          padding: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          white-space: nowrap !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        #toolDrawerContent {
          width: 100% !important;
          min-width: 0 !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          padding-bottom: max(16px, env(safe-area-inset-bottom)) !important;
          box-sizing: border-box !important;
        }
        #toolDrawerContent > *,
        #toolDrawer #toolRunnerPanel,
        #toolDrawer #drawerToolSchema {
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        #toolDrawer #drawerToolSchema {
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
        }
        #toolDrawer #drawerToolArgs {
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          resize: vertical !important;
        }
        #toolDrawer #drawerToolRunButton {
          max-width: 100% !important;
          white-space: normal !important;
        }
      }
    </style>

    <style>
      /* The drawer body is a flex column: without flex-shrink:0 the schema box was squashed to
         almost nothing on phones. Give it a real height and let the page scroll instead. */
      #toolDrawerContent > * { flex-shrink: 0; }
      #toolDrawer .drawer-schema-box {
        flex: 0 0 auto;
        min-height: 160px;
        max-height: min(56dvh, 420px);
        overflow: auto;
        -webkit-overflow-scrolling: touch;
      }
      #toolDrawer .drawer-schema-box pre { font-size: 12px; line-height: 1.55; }
      @media (max-width: 640px) {
        #toolDrawer .drawer-schema-box { min-height: 220px; max-height: 52dvh; padding: 12px 14px; }
        #toolDrawer .drawer-schema-box pre { font-size: 12.5px; }
      }
    </style>

    <!-- Slide-Over Inspector Drawer -->
    <div id="toolDrawer" role="dialog" aria-modal="true" aria-labelledby="drawerToolName" style="position:fixed; top:56px; right:0; bottom:0; width:480px; max-width:100vw; height:calc(100dvh - 56px); max-height:calc(100dvh - 56px); box-sizing:border-box; background:var(--bg-surface-0); border-left:1px solid var(--border-medium); box-shadow:var(--shadow-popover); z-index:900; transform:translateX(105%); transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); display:flex; flex-direction:column; padding:0 20px 20px; overflow:hidden;">
      <div class="tool-drawer-header" style="position:sticky; top:0; z-index:2; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-shrink:0; padding:18px 0 14px; background:var(--bg-surface-0); border-bottom:1px solid var(--border-subtle); margin-bottom:16px;">
        <div style="min-width:0; flex:1;">
          <div style="font-size:10px; font-weight:600; color:var(--geist-gray-50); letter-spacing:.06em; text-transform:uppercase; margin-bottom:4px;">Tool Inspector</div>
          <h2 id="drawerToolName" style="font-size:15px; font-weight:700; font-family:var(--font-mono); color:var(--fg); overflow-wrap:anywhere;"></h2>
        </div>
        <button type="button" class="btn ghost icon-btn" onclick="closeToolDrawer()" style="width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid var(--border-medium); background:var(--bg-surface-1); color:var(--fg); flex-shrink:0; cursor:pointer;" aria-label="Close tool inspector" title="Close">
          ${renderSvg("x", 16)}
        </button>
      </div>

      <div id="toolDrawerContent" style="flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column;">
        <p id="drawerToolDesc" style="font-size:13px; color:var(--geist-gray-50); line-height:1.5; margin-bottom:18px;"></p>
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50); margin-bottom:6px;">Parameters Schema</div>
        <div id="drawerSchemaBox" class="drawer-schema-box" style="background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:12px; margin-bottom:18px; overflow:auto;">
          <pre id="drawerToolSchema" style="font-family:var(--font-mono); color:var(--fg); white-space:pre-wrap; overflow-wrap:anywhere; margin:0;"></pre>
        </div>

        <div id="toolRunnerPanel" style="padding:14px; border:1px solid var(--border-subtle); border-radius:var(--radius-md); background:var(--bg-surface-1); margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:8px;">
            <div style="font-size:12px; font-weight:600; color:var(--fg);">Run in isolated sandbox</div>
            <span class="status-pill" style="font-size:10px;">Sandbox only</span>
          </div>
          <p id="toolRunnerHint" style="font-size:11px; color:var(--geist-gray-50); margin-bottom:10px;">Run a command or compile and test code in a disposable sandbox for this request.</p>
          <label for="drawerToolArgs" style="display:block; font-size:11px; color:var(--geist-gray-50); margin-bottom:5px;">Arguments (JSON)</label>
          <textarea id="drawerToolArgs" rows="7" spellcheck="false" style="width:100%; resize:vertical; background:var(--bg-surface-0); border:1px solid var(--border-medium); border-radius:6px; padding:10px; color:var(--fg); font:11px/1.5 var(--font-mono);">{}</textarea>
          <div style="display:flex; justify-content:flex-end; margin-top:10px;">
            <button type="button" id="drawerToolRunButton" class="btn primary" onclick="executeDrawerTool()" style="height:36px; border-radius:6px;" disabled>Run in Sandbox</button>
          </div>
          <div id="toolRunnerOutputWrap" hidden style="margin-top:12px;">
            <div style="font-size:11px; font-weight:600; color:var(--geist-gray-50); margin-bottom:5px;">Execution output</div>
            <pre id="toolRunnerOutput" style="max-height:220px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; background:var(--bg-surface-0); border:1px solid var(--border-subtle); border-radius:6px; padding:10px; margin:0; color:var(--fg); font:11px/1.5 var(--font-mono);"></pre>
          </div>
        </div>
      </div>
    </div>

    <script>
      let currentCategory = 'All';
      let currentToolsPage = 1;
      const toolsPageSize = 10;
      const activeToolsKeyId = ${JSON.stringify(params.selectedKeyId || params.summary?.selectedKeyId || "")};

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeToolDrawer();
      });

      const toolsMetricsMap = ${JSON.stringify(
        tools.reduce((acc: any, t: any) => {
          acc[t.name] = {
            name: t.name,
            category: t.category || "General",
            description: t.description || "",
            totalCalls: t.totalCalls || 0,
            successRate: t.successRate != null ? t.successRate + "%" : "100%",
            failures: t.errorCount || 0,
            avgDurationMs: t.avgDurationMs ? t.avgDurationMs + " ms" : "0 ms",
            peak: t.peakUsage || "N/A",
            lastActive: t.lastActiveAt
              ? new Date(t.lastActiveAt).toLocaleString()
              : "Recent",
          };
          return acc;
        }, {}),
      )};

      function selectToolBreakdown(name) {
        const titleEl = document.getElementById('breakdownToolTitle');
        const subEl = document.getElementById('breakdownToolSubtitle');
        const descEl = document.getElementById('breakdownToolVerbose');
        const callsEl = document.getElementById('metricTotalCalls');
        const rateEl = document.getElementById('metricSuccessRate');
        const failEl = document.getElementById('metricFailures');
        const latEl = document.getElementById('metricLatency');
        const peakEl = document.getElementById('metricPeak');
        const activeEl = document.getElementById('metricLastActive');

        if (!name || !toolsMetricsMap[name]) {
          if (titleEl) titleEl.textContent = 'All Tools Aggregate';
          if (subEl) subEl.textContent = 'Execution statistics across all MCP tool invocations';
          if (descEl) descEl.textContent = 'Global execution summary across all tools recorded by the Krix MCP runtime.';
          if (callsEl) callsEl.textContent = '${params.summary?.totalRequests || 0}';
          if (rateEl) rateEl.textContent = '${params.summary?.overallSuccessRate != null ? params.summary.overallSuccessRate + "%" : "100%"}';
          if (failEl) failEl.textContent = '${params.summary?.totalErrors || 0}';
          if (latEl) latEl.textContent = '${params.summary?.avgDurationMs || 0} ms';
          if (peakEl) peakEl.textContent = '${params.summary?.throughputRpm ? params.summary.throughputRpm + " rpm" : "N/A"}';
          if (activeEl) activeEl.textContent = 'Recent';
          return;
        }

        const m = toolsMetricsMap[name];
        if (titleEl) titleEl.textContent = m.name;
        if (subEl) subEl.textContent = 'Category: ' + m.category;
        if (descEl) descEl.textContent = m.description || 'No extended documentation provided for this tool.';
        if (callsEl) callsEl.textContent = String(m.totalCalls);
        if (rateEl) rateEl.textContent = m.successRate;
        if (failEl) failEl.textContent = String(m.failures);
        if (latEl) latEl.textContent = m.avgDurationMs;
        if (peakEl) peakEl.textContent = m.peak;
        if (activeEl) activeEl.textContent = m.lastActive;

        const select = document.getElementById('toolBreakdownSelect');
        if (select && select.value !== name) select.value = name;
      }

      function setToolDensity(mode) {
        const grid = document.getElementById('toolsGrid');
        document.getElementById('densityConciseBtn').classList.toggle('active', mode === 'concise');
        document.getElementById('densityVerboseBtn').classList.toggle('active', mode === 'verbose');
        if (mode === 'verbose') {
          grid.classList.remove('concise');
          grid.classList.add('verbose');
          document.querySelectorAll('.tool-desc').forEach(d => d.style.whiteSpace = 'normal');
        } else {
          grid.classList.remove('verbose');
          grid.classList.add('concise');
          document.querySelectorAll('.tool-desc').forEach(d => d.style.whiteSpace = 'nowrap');
        }
      }

      function filterCategory(cat, btn) {
        currentCategory = cat;
        document.querySelectorAll('.tool-cat-pill').forEach(b => {
          b.style.background = 'var(--bg-surface-1)';
          b.style.color = 'var(--geist-gray-50)';
        });
        btn.style.background = 'var(--bg-surface-2)';
        btn.style.color = 'var(--fg)';
        applyFilter();
      }

      function filterTools(q) {
        applyFilter();
      }

      function applyFilter() {
        const q = (document.getElementById('toolSearchInput').value || '').toLowerCase();
        const rows = Array.from(document.querySelectorAll('.tool-row'));
        const filtered = rows.filter(row => {
          const matchCat = (currentCategory === 'All') || (row.getAttribute('data-cat') === currentCategory);
          const matchText = row.getAttribute('data-name').toLowerCase().includes(q) || row.textContent.toLowerCase().includes(q);
          return matchCat && matchText;
        });
        currentToolsPage = 1;
        renderToolsPageRows(rows, filtered);
      }

      function renderToolsPageRows(rows, filtered) {
        const totalPages = Math.max(1, Math.ceil(filtered.length / toolsPageSize));
        currentToolsPage = Math.min(currentToolsPage, totalPages);
        const start = (currentToolsPage - 1) * toolsPageSize;
        rows.forEach(row => row.style.display = 'none');
        filtered.forEach((row, index) => {
          if (index >= start && index < start + toolsPageSize) row.style.display = 'flex';
        });
        const info = document.getElementById('toolsPageInfo');
        const prev = document.getElementById('toolsPrevPage');
        const next = document.getElementById('toolsNextPage');
        const indicator = document.getElementById('toolsPageIndicator');
        if (info) info.textContent = filtered.length
          ? 'Showing ' + (start + 1) + '-' + Math.min(start + toolsPageSize, filtered.length) + ' of ' + filtered.length + ' tools'
          : 'No matching tools';
        if (indicator) indicator.textContent = currentToolsPage + ' / ' + totalPages;
        if (prev) prev.disabled = currentToolsPage <= 1 || filtered.length === 0;
        if (next) next.disabled = currentToolsPage >= totalPages || filtered.length === 0;
      }

      function changeToolsPage(delta) {
        const rows = Array.from(document.querySelectorAll('.tool-row'));
        const q = (document.getElementById('toolSearchInput').value || '').toLowerCase();
        const filtered = rows.filter(row => {
          const matchCat = currentCategory === 'All' || row.getAttribute('data-cat') === currentCategory;
          const matchText = row.getAttribute('data-name').toLowerCase().includes(q) || row.textContent.toLowerCase().includes(q);
          return matchCat && matchText;
        });
        currentToolsPage += delta;
        renderToolsPageRows(rows, filtered);
      }

      function openToolDrawerFromRow(row) {
        const name = row.dataset.name || '';
        const desc = row.dataset.description || '';
        const schema = row.dataset.schema || '{}';
        selectToolBreakdown(name);
        document.getElementById('drawerToolName').textContent = name;
        document.getElementById('drawerToolDesc').textContent = desc;
        try {
          const parsed = JSON.parse(schema);
          document.getElementById('drawerToolSchema').textContent = JSON.stringify(parsed, null, 2);
        } catch {
          document.getElementById('drawerToolSchema').textContent = schema;
        }
        const executable = name === 'sandbox_exec' || name === 'sandbox_run';
        const runnerHint = document.getElementById('toolRunnerHint');
        const runButton = document.getElementById('drawerToolRunButton');
        const argsInput = document.getElementById('drawerToolArgs');
        const outputWrap = document.getElementById('toolRunnerOutputWrap');
        if (argsInput) {
          argsInput.value = name === 'sandbox_exec'
            ? JSON.stringify({ command: 'pwd && ls -la' }, null, 2)
            : (name === 'sandbox_run'
              ? JSON.stringify({ lang: 'py', code: 'print("Hello from Krix sandbox")' }, null, 2)
              : '{}');
        }
        if (runButton) runButton.disabled = !executable || !activeToolsKeyId;
        if (runnerHint) runnerHint.textContent = executable
          ? 'Run commands or compile and test code in a disposable sandbox. The execution environment enforces the server sandbox policy.'
          : 'Execution is available only for sandbox_exec and sandbox_run. Other tools can be inspected here and invoked through an authenticated MCP client.';
        if (outputWrap) outputWrap.hidden = true;
        document.getElementById('toolDrawer').style.transform = 'translateX(0)';
      }

      function closeToolDrawer() {
        document.getElementById('toolDrawer').style.transform = 'translateX(105%)';
      }

      async function executeDrawerTool() {
        const name = document.getElementById('drawerToolName')?.textContent || '';
        const button = document.getElementById('drawerToolRunButton');
        const outputWrap = document.getElementById('toolRunnerOutputWrap');
        const output = document.getElementById('toolRunnerOutput');
        let args;
        try {
          args = JSON.parse(document.getElementById('drawerToolArgs')?.value || '{}');
          if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Arguments must be a JSON object.');
        } catch (error) {
          if (outputWrap) outputWrap.hidden = false;
          if (output) output.textContent = error.message || 'Invalid JSON.';
          return;
        }
        if (!['sandbox_exec', 'sandbox_run'].includes(name) || !activeToolsKeyId) return;
        if (button) { button.disabled = true; button.textContent = 'Running…'; }
        if (outputWrap) outputWrap.hidden = false;
        if (output) output.textContent = 'Starting isolated sandbox…';
        try {
          const response = await fetch('/tools/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyId: activeToolsKeyId, toolName: name, arguments: args })
          });
          const data = await response.json();
          if (output) output.textContent = data.ok ? data.result : (data.error || 'Execution failed.');
        } catch (error) {
          if (output) output.textContent = 'Request failed: ' + (error.message || String(error));
        } finally {
          if (button) { button.disabled = false; button.textContent = 'Run in Sandbox'; }
        }
      }

      function onKeyFilterChange(selectEl) {
        const val = selectEl ? selectEl.value : '';
        const url = new URL(window.location.href);
        if (val) url.searchParams.set('key', val);
        else url.searchParams.delete('key');
        window.location.href = url.toString();
      }

      applyFilter();
    </script>
  `;

  return renderPageShell({
    title: "Tools",
    activeTab: "tools",
    owner: params.owner,
    content,
  });
}
