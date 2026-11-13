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
}): string {
  if (!params.isOwner) {
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

      <!-- Dual Density Toggle -->
      <div style="display:inline-flex; align-items:center; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-full); padding:3px; gap:2px;">
        <button type="button" id="densityConciseBtn" class="nav-pill active" onclick="setToolDensity('concise')" style="font-size:12px; padding:4px 12px; border-radius:var(--radius-full);">Concise</button>
        <button type="button" id="densityVerboseBtn" class="nav-pill" onclick="setToolDensity('verbose')" style="font-size:12px; padding:4px 12px; border-radius:var(--radius-full);">Verbose</button>
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
                  JSON.stringify(tool.inputSchema || {}, null, 2),
                );

                return `
            <div class="tool-row tool-box card spotlight-card" data-cat="${tCat}" data-name="${tName}" style="padding:12px 18px; display:flex; align-items:center; justify-content:space-between; gap:16px; cursor:pointer;" onclick="openToolDrawer('${tName}', '${tDesc}', '${tCat}', '${schemaJson}')">
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

    <!-- Slide-Over Inspector Drawer -->
    <div id="toolDrawer" style="position:fixed; top:0; right:0; bottom:0; width:440px; max-width:90vw; background:var(--bg-surface-0); border-left:1px solid var(--border-medium); box-shadow:var(--shadow-popover); z-index:var(--z-drawer); transform:translateX(100%); transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); display:flex; flex-direction:column; padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2 id="drawerToolName" style="font-size:16px; font-weight:700; font-family:var(--font-mono); color:var(--fg);"></h2>
        <button type="button" class="btn ghost" onclick="closeToolDrawer()" style="padding:4px;" aria-label="Close Drawer">&times;</button>
      </div>

      <p id="drawerToolDesc" style="font-size:13px; color:var(--geist-gray-50); line-height:1.5; margin-bottom:16px;"></p>

      <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50); margin-bottom:6px;">Parameters Schema</div>
      <div style="flex:1; overflow-y:auto; background:var(--bg-surface-1); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:12px;">
        <pre id="drawerToolSchema" style="font-family:var(--font-mono); font-size:11px; color:var(--fg); white-space:pre-wrap;"></pre>
      </div>
    </div>

    <script>
      let currentCategory = 'All';

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
        document.querySelectorAll('.tool-row').forEach(row => {
          const matchCat = (currentCategory === 'All') || (row.getAttribute('data-cat') === currentCategory);
          const matchText = row.getAttribute('data-name').toLowerCase().includes(q) || row.textContent.toLowerCase().includes(q);
          row.style.display = (matchCat && matchText) ? 'flex' : 'none';
        });
      }

      function openToolDrawer(name, desc, cat, schema) {
        document.getElementById('drawerToolName').textContent = name;
        document.getElementById('drawerToolDesc').textContent = desc;
        try {
          const parsed = JSON.parse(schema);
          document.getElementById('drawerToolSchema').textContent = JSON.stringify(parsed, null, 2);
        } catch {
          document.getElementById('drawerToolSchema').textContent = schema;
        }
        document.getElementById('toolDrawer').style.transform = 'translateX(0)';
      }

      function closeToolDrawer() {
        document.getElementById('toolDrawer').style.transform = 'translateX(100%)';
      }
    </script>
  `;

  return renderPageShell({
    title: "Tools",
    activeTab: "tools",
    owner: params.owner,
    content,
  });
}
