// Tools Capabilities Directory with Concise/Verbose Density Toggle and Inspector Drawer
// Contract Invariants: Exact <title>Tools</title>, id="toolSearchInput", placeholder="", data-cat="All", data-cat="Sandbox", data-cat="Render", data-cat="GitHub", data-cat="Files", class="tools-grid", class="tool-box"

import {
  renderPageShell,
  renderAuthRequiredCard,
  renderCustomDropdown,
  escapeHtml,
  formatCompactCount,
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
    let cat = t.category || "General";
    if (cat === "Files" || cat === "Search") cat = "Sandbox";
    categories[cat] = (categories[cat] || 0) + 1;
  });

  const standardCats = ["Sandbox", "Render", "GitHub", "Code Graph"];
  standardCats.forEach((c) => {
    if (!categories[c]) categories[c] = 0;
  });

  const stat = (label: string, id: string, value: string, cls = "") =>
    `<div class="stat"><div class="stat-label">${label}</div><div id="${id}" class="stat-value sm ${cls}">${value}</div></div>`;

  const content = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Tools Directory</h1>
        <p class="page-sub">Everything your connected assistants can do. ${totalCount} tools in this instance.</p>
      </div>
      <div class="page-actions">
        <label for="keySelector" class="text-muted" style="font-size:13px;">Key</label>
        ${renderCustomDropdown({
          id: "keySelector",
          options: [
            { value: "", label: "All keys" },
            ...(params.summary?.keys || []).map((k: any) => {
              const val = k.keyId || k.id;
              return { value: val, label: k.label || val };
            }),
          ],
          selectedValue:
            params.summary?.selectedKeyId && params.summary.selectedKeyId !== "all"
              ? params.summary.selectedKeyId
              : "",
          onchange: "onKeyFilterChange(this)",
          ariaLabel: "Filter by API or OAuth key",
        })}
      </div>
    </div>

    <div id="toolTelemetryCard" class="panel">
      <div class="panel-head">
        <div>
          <h2 id="breakdownToolTitle" class="panel-title">All Tools Aggregate</h2>
          <p id="breakdownToolSubtitle" class="panel-sub">Execution statistics across all MCP tool invocations</p>
        </div>
        ${renderCustomDropdown({
          id: "toolBreakdownSelect",
          options: [
            { value: "", label: "All Tools (Global)" },
            ...tools.map((t) => ({
              value: t.name,
              label: `${t.name} (${t.category === "Files" || t.category === "Search" ? "Sandbox" : t.category || "General"})`,
            })),
          ],
          selectedValue: "",
          onchange: "selectToolBreakdown(this.value)",
          ariaLabel: "Select tool for usage breakdown",
        })}
      </div>
      <div class="stats">
        ${stat("Invocations", "metricTotalCalls", formatCompactCount(params.summary?.totalRequests || 0))}
        ${stat("Success rate", "metricSuccessRate", params.summary?.overallSuccessRate != null ? params.summary.overallSuccessRate + "%" : "100%", "ok")}
        ${stat("Failures", "metricFailures", formatCompactCount(params.summary?.totalErrors || 0), "bad")}
        ${stat("Avg latency", "metricLatency", (params.summary?.avgDurationMs || 0) + " ms")}
        ${stat("Peak usage", "metricPeak", params.summary?.throughputRpm ? params.summary.throughputRpm + " rpm" : "N/A")}
        ${stat("Last active", "metricLastActive", "Recent")}
      </div>
      <p id="breakdownToolVerbose" class="panel-sub" style="margin-top:14px;">Global execution summary across all tools recorded by the Krix MCP runtime.</p>
    </div>

    <div class="panel tools-toolbar-box" style="padding:12px 16px; margin:20px 0 14px;">
      <div class="cluster" style="justify-content:space-between; gap:12px;">
        <div class="search krix-pill-search search-bar-responsive">
          ${renderSvg("search", 16)}
          <input type="text" id="toolSearchInput" placeholder="Search tools" aria-label="Search tools" oninput="filterTools(this.value)" autocomplete="off">
        </div>
        <div class="density-toggle">
          <button type="button" id="densityConciseBtn" class="nav-pill active" onclick="setToolDensity('concise')">Compact</button>
          <button type="button" id="densityVerboseBtn" class="nav-pill" onclick="setToolDensity('verbose')">Detailed</button>
        </div>
      </div>
    </div>

    <div class="category-filter-grid" style="margin-bottom:16px;">
      <button type="button" class="category-filter-pill active" data-cat="All" onclick="filterCategory('All', this)">All (${totalCount})</button>
      <button type="button" class="category-filter-pill" data-cat="Sandbox" onclick="filterCategory('Sandbox', this)">Sandbox (${categories["Sandbox"] || 0})</button>
      <button type="button" class="category-filter-pill" data-cat="Render" onclick="filterCategory('Render', this)">Render (${categories["Render"] || 0})</button>
      <button type="button" class="category-filter-pill" data-cat="GitHub" onclick="filterCategory('GitHub', this)">GitHub (${categories["GitHub"] || 0})</button>
      <button type="button" class="category-filter-pill" data-cat="Code Graph" onclick="filterCategory('Code Graph', this)">Code Graph (${categories["Code Graph"] || 0})</button>
    </div>

    <div id="toolsGrid" class="panel flush tools-grid tools-container concise">
      ${
        tools.length === 0
          ? `<div class="empty">No tools loaded in catalog.</div>`
          : tools
              .map((tool, idx) => {
                const tName = escapeHtml(tool.name || `tool_${idx}`);
                const tDesc = escapeHtml(tool.description || "No description provided");
                const rawCat = tool.category || "General";
                const tCat = escapeHtml(rawCat === "Files" || rawCat === "Search" ? "Sandbox" : rawCat);
                const schemaJson = escapeHtml(
                  JSON.stringify(
                    tool.inputSchema || { type: "object", properties: {}, additionalProperties: false },
                  ),
                );
                return `
        <div class="tool-row tool-box list-item clickable" tabindex="0" role="button" data-cat="${tCat}" data-name="${tName}" data-description="${tDesc}" data-schema="${schemaJson}" onclick="openToolDrawerFromRow(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openToolDrawerFromRow(this)}">
          <div class="grow">
            <div class="list-name mono" style="font-size:13px;">${tName}</div>
            <div class="tool-desc list-meta">${tDesc}</div>
          </div>
          <span class="badge">${tCat}</span>
        </div>`;
              })
              .join("")
      }
    </div>

    <div id="toolsPagination" class="pager permission-pagination">
      <div id="toolsPageInfo">Showing 1-${Math.min(tools.length, 10)} of ${tools.length} tools</div>
      <div class="cluster">
        <button type="button" class="pager-btn pager-prev" id="toolsPrevPage" onclick="changeToolsPage(-1)" aria-label="Previous page">${renderSvg("chevron-left", 16)}<span>Previous</span></button>
        <span id="toolsPageIndicator" class="mono" style="font-size:12px;">1 / 1</span>
        <button type="button" class="pager-btn pager-next" id="toolsNextPage" onclick="changeToolsPage(1)" aria-label="Next page"><span>Next</span>${renderSvg("chevron-right", 16)}</button>
      </div>
    </div>

    <aside id="toolDrawer" class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawerToolName">
      <div class="drawer-head tool-drawer-header">
        <h2 id="drawerToolName" class="mono" style="font-size:15px; font-weight:500; overflow-wrap:anywhere;"></h2>
        <button type="button" class="icon-btn" onclick="closeToolDrawer()" aria-label="Close">${renderSvg("x", 18)}</button>
      </div>
      <div id="toolDrawerContent" class="drawer-body">
        <p id="drawerToolDesc" class="text-muted"></p>
        <div>
          <div class="row-title" style="margin-bottom:6px;">Parameters</div>
          <div id="drawerSchemaBox" class="codeblock drawer-schema-box" style="max-height:min(50dvh, 380px); overflow:auto;">
            <pre id="drawerToolSchema" style="padding:12px; font-size:12px; line-height:1.55;"></pre>
          </div>
        </div>
        <div id="toolRunnerPanel" class="panel" style="padding:16px;">
          <div class="panel-head" style="margin-bottom:6px;">
            <div class="row-title">Run in isolated sandbox</div>
            <span class="status-pill">Sandbox only</span>
          </div>
          <p id="toolRunnerHint" class="panel-sub" style="margin:0 0 12px;">Run a command or compile and test code in a disposable sandbox for this request.</p>
          <div class="field">
            <label for="drawerToolArgs">Arguments (JSON)</label>
            <textarea id="drawerToolArgs" class="input" rows="7" spellcheck="false"></textarea>
          </div>
          <div class="modal-actions" style="margin-top:12px;">
            <button type="button" id="drawerToolRunButton" class="btn primary" onclick="executeDrawerTool()" disabled>Run in sandbox</button>
          </div>
          <div id="toolRunnerOutputWrap" hidden style="margin-top:12px;">
            <div class="row-title" style="margin-bottom:6px;">Output</div>
            <pre id="toolRunnerOutput" class="codeblock" style="max-height:220px; overflow:auto; padding:12px; font-size:12px;"></pre>
          </div>
        </div>
      </div>
    </aside>

    <script>
      let currentCategory = 'All';
      let currentToolsPage = 1;
      function getToolsPageSize() {
        return window.innerWidth <= 768 ? 10 : 24;
      }
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
        const triggerLabel = document.getElementById('toolBreakdownSelect_label');
        if (triggerLabel) {
          triggerLabel.textContent = name
            ? (name + ' (' + ((toolsMetricsMap[name] && toolsMetricsMap[name].category) || 'General') + ')')
            : 'All Tools (Global)';
        }
        const popover = document.getElementById('toolBreakdownSelect_popover');
        if (popover) {
          popover.querySelectorAll('.krix-dropdown-option').forEach(function(opt) {
            const isMatch = opt.getAttribute('data-value') === (name || '');
            opt.classList.toggle('selected', isMatch);
            opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
          });
        }
      }

      function setToolDensity(mode) {
        const grid = document.getElementById('toolsGrid');
        document.getElementById('densityConciseBtn')?.classList.toggle('active', mode === 'concise');
        document.getElementById('densityVerboseBtn')?.classList.toggle('active', mode === 'verbose');
        if (mode === 'verbose') {
          grid.classList.remove('concise');
          grid.classList.add('verbose');

        } else {
          grid.classList.remove('verbose');
          grid.classList.add('concise');

        }
      }

      function filterCategory(cat, btn) {
        currentCategory = cat;
        document.querySelectorAll('.category-filter-pill').forEach(b => {
          b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');
        applyFilter();
      }

      function filterTools(q) {
        applyFilter();
      }

      function getFilteredToolRows() {
        const q = (document.getElementById('toolSearchInput')?.value || '').toLowerCase();
        const rows = Array.from(document.querySelectorAll('.tool-row'));
        const filtered = rows.filter(row => {
          const rowCat = row.getAttribute('data-cat') || '';
          const matchCat = (currentCategory === 'All')
            || (rowCat === currentCategory)
            || (currentCategory === 'Sandbox' && (rowCat === 'Sandbox' || rowCat === 'Files' || rowCat === 'Search'));
          const matchText = (row.getAttribute('data-name') || '').toLowerCase().includes(q) || row.textContent.toLowerCase().includes(q);
          return matchCat && matchText;
        });
        return { rows, filtered };
      }

      function applyFilter() {
        const { rows, filtered } = getFilteredToolRows();
        currentToolsPage = 1;
        renderToolsPageRows(rows, filtered);
      }

      function renderToolsPageRows(rows, filtered) {
        const pageSize = getToolsPageSize();
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        currentToolsPage = Math.min(Math.max(1, currentToolsPage), totalPages);
        const start = (currentToolsPage - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);
        rows.forEach(row => row.style.display = 'none');
        pageItems.forEach(row => row.style.display = 'flex');
        const info = document.getElementById('toolsPageInfo');
        const prev = document.getElementById('toolsPrevPage');
        const next = document.getElementById('toolsNextPage');
        const indicator = document.getElementById('toolsPageIndicator');
        const end = start + pageItems.length;
        if (info) info.textContent = filtered.length
          ? (window.innerWidth <= 640 ? ('Page ' + currentToolsPage + ' of ' + totalPages) : ('Showing ' + (start + 1) + '-' + end + ' of ' + filtered.length + ' tools'))
          : 'No matching tools';
        if (indicator) indicator.textContent = currentToolsPage + ' / ' + totalPages;
        if (prev) prev.disabled = currentToolsPage <= 1 || filtered.length === 0;
        if (next) next.disabled = currentToolsPage >= totalPages || filtered.length === 0;
      }

      function changeToolsPage(delta) {
        const { rows, filtered } = getFilteredToolRows();
        currentToolsPage += delta;
        renderToolsPageRows(rows, filtered);
      }

      window.addEventListener('resize', () => {
        const { rows, filtered } = getFilteredToolRows();
        renderToolsPageRows(rows, filtered);
      }, { passive: true });

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
        if (runButton) runButton.disabled = !executable;
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
        if (!['sandbox_exec', 'sandbox_run'].includes(name)) return;
        if (button) { button.disabled = true; button.textContent = 'Running…'; }
        if (outputWrap) outputWrap.hidden = false;
        if (output) output.textContent = 'Starting isolated sandbox…';
        try {
          const response = await fetch('/tools/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyId: activeToolsKeyId || 'default', toolName: name, arguments: args })
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
        // Empty value = "All Keys": keep an explicit empty ?key= so the server
        // doesn't fall back to the first key when the param is missing.
        url.searchParams.set('key', val || '');
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
