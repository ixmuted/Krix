// Real-Time Telemetry Dashboard with 10-Day Chunk Navigation and Per-Key Metrics
// Contract Invariants: Exact <title>Stats</title>, id="keySelector", id="valPeakTime", id="statsKeySearchInput", dailyChunkNav, btnPrevDailyChunk, btnNextDailyChunk, N/A fallbacks

import {
  renderPageShell,
  renderAuthRequiredCard,
  renderCustomDropdown,
  CustomDropdownOption,
  escapeHtml,
  formatBytes,
} from "../components.js";
import { renderSvg } from "../icons.js";

export function renderStatsPage(params: {
  base: string;
  isOwner?: boolean;
  owner?: any;
  summary?: any;
}): string {
  const isAuthenticated = Boolean(params.owner || params.isOwner);
  if (!isAuthenticated) {
    return renderPageShell({
      title: "Stats",
      activeTab: "stats",
      owner: params.owner,
      content: renderAuthRequiredCard(
        "Authentication Required",
        "Please sign in with your authorized Google Account to access this section.",
        "/stats",
      ),
    });
  }

  const summary = params.summary || {};
  const totalRequests = summary.totalRequests || 0;
  const overallSuccessRate =
    summary.overallSuccessRate ?? (totalRequests > 0 ? 100 : 100);
  const totalErrors = summary.totalErrors || 0;
  const throughputRpm = summary.throughputRpm ?? 0;
  const activeHttpSessions = summary.activeHttpSessions ?? 0;
  const avgDurationMs = summary.avgDurationMs ?? 0;
  const p95DurationMs = summary.p95DurationMs ?? 0;

  const hasPeakTraffic =
    summary.peakTraffic &&
    summary.peakTraffic.peakHourUtc !== null &&
    summary.peakTraffic.peakHourUtc !== undefined &&
    totalRequests > 0;

  const sharedSandbox = summary.sharedSandbox || {
    quotaUsedPercent: 0,
    totalDiskBytes: 0,
    quotaLimitMb: 300,
    uploadFileCount: 0,
    uploadBytes: 0,
    activeWorkDirs: 0,
  };

  const systemHealth = summary.systemHealth || {
    heapUsedMb: 0,
    heapTotalMb: 0,
    rssMb: 0,
    uptimeSec: 0,
    platform: "linux",
  };

  const clientEcosystems = summary.clientEcosystems || {};
  const clientValues = Object.values(clientEcosystems) as number[];
  const totalClientTraffic = clientValues.reduce((a, b) => a + b, 0);

  const toolDistribution = summary.toolDistribution || {};
  const toolEntries = Object.entries(toolDistribution);

  const keys = summary.keys || [];
  const statusCodes = summary.statusCodes || {};
  const recentErrors = summary.recentErrors || [];
  const availableYears = summary.availableYears || [new Date().getFullYear()];

  // Key selector options
  const apiKeys = keys.filter(
    (k: any) => k.type === "api_key" || k.type === "master" || !k.type,
  );
  const oauthKeys = keys.filter((k: any) => k.type === "oauth");

  const keyOptions: CustomDropdownOption[] = [
    { value: "", label: "All Keys & OAuth" },
    ...apiKeys.map((k: any) => {
      const label =
        k.label === "Master Key" || k.keyId === "master-env-key"
          ? "Primary Key"
          : k.label || k.keyId;
      const val =
        k.keyId === "master-env-key" ? "primary-key" : k.keyId || k.id;
      return { value: val, label: String(label) };
    }),
    ...oauthKeys.map((k: any) => ({
      value: k.keyId || k.id,
      label: String(k.label || k.keyId || k.id),
    })),
  ];

  const keySelectorHtml = `
    <div class="cluster">
      <label for="keySelector" class="text-muted" style="font-size:13px;">Key</label>
      ${renderCustomDropdown({
        id: "keySelector",
        options: keyOptions,
        selectedValue: summary.selectedKeyId || "",
        onchange:
          "window.location.search = this.value && this.value !== '' ? '?key=' + encodeURIComponent(this.value) : window.location.pathname",
        ariaLabel: "Filter by API key or OAuth authorization",
      })}
    </div>
  `;

  const initialChunk = (summary.dailyTimeline || []).slice(-10);
  let initialRangeText = "Days 1–10";
  if (initialChunk.length > 0) {
    const firstDate = initialChunk[0].date;
    const lastDate = initialChunk[initialChunk.length - 1].date;
    if (firstDate && lastDate) {
      const d1 = parseInt(firstDate.split("-")[2], 10);
      const d2 = parseInt(lastDate.split("-")[2], 10);
      initialRangeText = `Days ${d1}–${d2}`;
    } else {
      const total = (summary.dailyTimeline || []).length;
      const startNum = Math.max(1, total - 9);
      initialRangeText = `Days ${startNum}–${total}`;
    }
  }

  const kv = (label: string, value: string, id = "", cls = "") =>
    `<div class="row"><span class="text-muted">${label}</span><span${id ? ` id="${id}"` : ""} class="mono ${cls}">${value}</span></div>`;
  const timelineBars = (items: any[]) =>
    items
      .map((item: any) => {
        const reqs = item.requests || 0;
        const h = Math.min(100, Math.max(8, reqs * 10));
        return `<div class="bar-col"><div class="bar" style="height:${h}px;" title="${escapeHtml(item.date || "")}: ${reqs} calls"></div><span class="bar-label">${escapeHtml((item.date || "").slice(5))}</span></div>`;
      })
      .join("");

  const content = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Usage</h1>
        <p class="page-sub">Live throughput, latency and per-key request activity.</p>
      </div>
      <div class="page-actions">
        ${keySelectorHtml}
        <span class="status-pill"><span class="status-dot-available"></span><span>Live</span></span>
      </div>
    </div>

    <div class="stats grid-4" style="margin-bottom:16px;">
      <div class="stat">
        <div class="stat-label">Total Requests</div>
        <div class="stat-value metric-value" id="valTotalRequests">${totalRequests.toLocaleString()}</div>
        <div class="cluster" style="margin-top:6px; font-size:12px;">
          <span class="badge success" id="valSuccessRate">${overallSuccessRate}% success</span>
          <span class="text-muted" id="valErrorCount">${totalErrors} errors</span>
        </div>
      </div>
      <div class="stat">
        <div class="stat-label">Throughput &amp; Streams</div>
        <div class="stat-value metric-value" id="valThroughput">${throughputRpm} <span class="text-muted" style="font-size:14px; font-family:var(--font-sans);">RPM</span></div>
        <div class="text-muted" style="font-size:12px; margin-top:6px;">Active HTTP streams: <strong id="valActiveStreams" style="color:var(--fg);">${activeHttpSessions}</strong></div>
      </div>
      <div class="stat">
        <div class="stat-label">Latency (Avg / P95)</div>
        <div class="stat-value metric-value" id="valLatency">${avgDurationMs} <span class="text-muted" style="font-size:14px; font-family:var(--font-sans);">/ ${p95DurationMs} ms</span></div>
        <div class="text-muted" style="font-size:12px; margin-top:6px;">Peak window: <strong id="valPeakTime" data-utc-hour="${hasPeakTraffic ? summary.peakTraffic.peakHourUtc : ""}" data-utc-day="${hasPeakTraffic ? summary.peakTraffic.peakDay : ""}" style="color:var(--fg);">${
          hasPeakTraffic
            ? `${summary.peakTraffic.peakHourUtc}:00 UTC (${summary.peakTraffic.peakDay})`
            : "N/A"
        }</strong></div>
      </div>
      <div class="stat">
        <div class="stat-label">Sandbox Storage</div>
        <div class="stat-value metric-value" id="valQuotaUsed">${sharedSandbox.quotaUsedPercent}%</div>
        <div class="progress" style="margin-top:8px;"><span id="barQuotaFill" style="width:${sharedSandbox.totalDiskBytes > 0 ? Math.min(100, Math.max(2, sharedSandbox.quotaUsedPercent)) : 0}%;"></span></div>
        <div class="cluster" style="justify-content:space-between; margin-top:6px; font-size:12px;" ><span class="text-muted" id="valDiskBytes">${formatBytes(sharedSandbox.totalDiskBytes)} used</span><span class="text-muted">${sharedSandbox.quotaLimitMb} MB quota</span></div>
        <p class="text-muted" style="font-size:12px; margin-top:6px;">Shared storage across all API keys and OAuth clients.</p>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">Activity</h2>
          <p class="panel-sub">Requests per day</p>
        </div>
        <div class="cluster">
          <div id="dailyChunkNav" class="dailyChunkNav cluster" style="gap:4px;">
            <button type="button" class="pager-btn btnPrevDailyChunk" id="btnPrevDailyChunk" aria-label="Previous 10 days" title="Previous 10 days" onclick="changeDailyChunk(-1)">${renderSvg("chevron-left", 14)}</button>
            <span id="lblDailyChunkRange" class="mono" style="font-size:12px; min-width:84px; text-align:center;">${initialRangeText}</span>
            <button type="button" class="pager-btn btnNextDailyChunk" id="btnNextDailyChunk" aria-label="Next 10 days" title="Next 10 days" onclick="changeDailyChunk(1)">${renderSvg("chevron-right", 14)}</button>
          </div>
          ${renderCustomDropdown({
            id: "yearFilter",
            options: [
              { value: "all", label: "All years" },
              ...availableYears.map((y: any) => ({ value: String(y), label: String(y) })),
            ],
            selectedValue: "all",
            onchange: "renderTimelineChart()",
            ariaLabel: "Filter timeline by year",
          })}
        </div>
      </div>
      <div id="timelineChart" class="chart">
        ${timelineBars((summary.dailyTimeline || []).slice(-10)) || `<div class="empty" style="width:100%;">No timeline data available</div>`}
      </div>
    </div>

    <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); margin-bottom:16px; align-items:start;">
      <div class="panel" style="margin:0;">
        <h3 class="panel-title" style="margin-bottom:12px;">Process health</h3>
        <div class="rows">
          ${kv("Heap memory", `${systemHealth.heapUsedMb} MB / ${systemHealth.heapTotalMb} MB`, "valHeap")}
          ${kv("Resident RSS", `${systemHealth.rssMb} MB`, "valRss")}
          ${kv("Uptime", `${Math.round(systemHealth.uptimeSec / 60)} mins`, "valUptime")}
          ${kv("Platform", escapeHtml(String(systemHealth.platform)))}
        </div>
      </div>
      <div class="panel" style="margin:0;">
        <h3 class="panel-title" style="margin-bottom:12px;">Response codes</h3>
        <div class="rows">
          ${kv("200 OK", String(statusCodes["200"] || 0), "", "text-ok")}
          ${kv("400 Bad Request", String(statusCodes["400"] || 0))}
          ${kv("401 Unauthorized", String(statusCodes["401"] || 0))}
          ${kv("500 Server Error", String(statusCodes["500"] || 0), "", "text-bad")}
        </div>
      </div>
      <div class="panel" style="margin:0;">
        <h3 class="panel-title" style="margin-bottom:12px;">Clients</h3>
        <div class="rows" id="clientEcosystemList">
          ${
            totalClientTraffic > 0
              ? Object.entries(clientEcosystems)
                  .map(([client, count]) => kv(escapeHtml(client), String(count)))
                  .join("")
              : `<div class="empty" style="padding:12px 0;">No client traffic recorded yet (N/A)</div>`
          }
        </div>
      </div>
    </div>

    <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); margin-bottom:16px; align-items:start;">
      <div class="panel" style="margin:0;">
        <div class="panel-head">
          <h3 class="panel-title">Top tools</h3>
          <a href="/tools" class="btn ghost sm">View tools</a>
        </div>
        <div id="topToolsList" class="stack" style="gap:14px;">
          ${
            toolEntries.length > 0
              ? (() => {
                  const sorted = toolEntries
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 5);
                  const max = Math.max(1, ...sorted.map((e) => Number(e[1]) || 0));
                  return sorted
                    .map(
                      ([tool, count]) => `
                    <div>
                      <div class="cluster" style="justify-content:space-between; font-size:13px; margin-bottom:6px;">
                        <span class="mono">${escapeHtml(tool)}</span>
                        <span class="text-muted">${count} calls</span>
                      </div>
                      <div class="progress"><span style="width:${Math.max(3, Math.round(((Number(count) || 0) / max) * 100))}%;"></span></div>
                    </div>`,
                    )
                    .join("");
                })()
              : `<div class="empty" style="padding:16px 0;">No tool calls recorded yet (N/A)</div>`
          }
        </div>
      </div>
      <div class="panel" style="margin:0;">
        <h3 class="panel-title" style="margin-bottom:12px;">Storage &amp; bandwidth</h3>
        <div class="rows">
          ${kv("Data transferred", `${formatBytes(summary.totalBytesIn || 0)} in / ${formatBytes(summary.totalBytesOut || 0)} out`)}
          ${kv("Stored files", `${sharedSandbox.uploadFileCount} files (${formatBytes(sharedSandbox.uploadBytes || 0)})`)}
          ${kv("Active repositories", `${sharedSandbox.activeWorkDirs} active repositories`)}
          ${kv("Quota", `${sharedSandbox.quotaLimitMb} MB shared by all your keys`)}
        </div>
      </div>
    </div>

    <div class="panel flush">
      <div class="panel-head">
        <div class="cluster"><h2 class="panel-title">Per-key breakdown</h2><span class="badge">${keys.length} keys</span></div>
        <div class="search krix-pill-search">
          ${renderSvg("search", 15)}
          <input type="text" id="statsKeySearchInput" class="statsKeySearchInput" placeholder="Filter keys" aria-label="Filter keys" oninput="filterStatsKeys(this.value)">
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Key</th><th>Requests</th><th>Errors</th><th>Latency</th><th>Status</th></tr></thead>
          <tbody id="statsKeysTableBody">
            ${
              keys.length > 0
                ? keys
                    .map((k: any) => {
                      const displayLabel =
                        k.label === "Master Key" ||
                        k.label?.includes("Master Key") ||
                        k.keyId === "master-env-key"
                          ? "Primary Key"
                          : k.label || k.keyId;
                      const displayKeyId =
                        k.keyId === "master-env-key" ? "primary-key" : k.keyId || k.id;
                      return `
                <tr class="stats-row stats-key-row">
                  <td><div class="list-name">${escapeHtml(displayLabel)}</div><div class="list-meta mono">${escapeHtml(displayKeyId)}</div></td>
                  <td class="mono">${k.totalRequests || 0}</td>
                  <td class="mono ${k.errorCount > 0 ? "text-bad" : "text-ok"}">${k.errorCount || 0}</td>
                  <td class="mono">${k.avgDurationMs || 0}ms</td>
                  <td><span class="badge success">Active</span></td>
                </tr>`;
                    })
                    .join("")
                : `<tr><td colspan="5" class="empty">No client activity yet. Connect an MCP client to start tracking.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>

    <script>
      const fullDailyTimeline = ${JSON.stringify(summary.dailyTimeline || [])};
      const firstCallIndex = fullDailyTimeline.findIndex(item => (item.requests || 0) > 0);
      const maxPastOffset = firstCallIndex === -1
        ? 0
        : -Math.floor((fullDailyTimeline.length - 1 - firstCallIndex) / 10);
      let currentChunkOffset = 0;
      let activeTimelineData = fullDailyTimeline;

      function updateTimelineView() {
        const total = activeTimelineData.length;
        const end = Math.max(0, total + currentChunkOffset * 10);
        const start = Math.max(0, end - 10);
        const chunkItems = activeTimelineData.slice(start, end);

        // Update range label (reflecting the real days displayed)
        const lbl = document.getElementById("lblDailyChunkRange");
        if (lbl) {
          if (chunkItems.length > 0 && chunkItems[0].date && chunkItems[chunkItems.length - 1].date) {
            const d1 = parseInt(chunkItems[0].date.split("-")[2], 10);
            const d2 = parseInt(chunkItems[chunkItems.length - 1].date.split("-")[2], 10);
            lbl.textContent = "Days " + d1 + "–" + d2;
          } else {
            const startNum = start + 1;
            const endNum = Math.min(total, start + (chunkItems.length || 10));
            lbl.textContent = "Days " + startNum + "–" + endNum;
          }
        }

        // Render chart bars dynamically for the selected chunk
        const chart = document.getElementById("timelineChart");
        if (chart) {
          if (!chunkItems.length) {
            chart.innerHTML = '<div class="empty" style="width:100%;">No timeline data available for this range</div>';
          } else {
            chart.innerHTML = chunkItems.map(item => {
              const reqs = item.requests || 0;
              const h = Math.min(100, Math.max(8, reqs * 10));
              const date = String(item.date || '').replace(/[<>&"]/g, '');
              return '<div class="bar-col"><div class="bar" style="height:' + h + 'px;" title="' + date + ': ' + reqs + ' calls"></div><span class="bar-label">' + date.slice(5) + '</span></div>';
            }).join('');
          }
        }

        // Safeguard buttons: disable navigating before first call date or past today
        const btnPrev = document.getElementById("btnPrevDailyChunk");
        const btnNext = document.getElementById("btnNextDailyChunk");
        if (btnPrev) {
          const canGoPrev = currentChunkOffset > maxPastOffset && start > 0;
          btnPrev.disabled = !canGoPrev;
          btnPrev.style.opacity = canGoPrev ? '1' : '0.35';
          btnPrev.style.cursor = canGoPrev ? 'pointer' : 'not-allowed';
          btnPrev.setAttribute('aria-disabled', String(!canGoPrev));
        }
        if (btnNext) {
          const canGoNext = currentChunkOffset < 0;
          btnNext.disabled = !canGoNext;
          btnNext.style.opacity = canGoNext ? '1' : '0.35';
          btnNext.style.cursor = canGoNext ? 'pointer' : 'not-allowed';
          btnNext.setAttribute('aria-disabled', String(!canGoNext));
        }
      }

      function changeDailyChunk(direction) {
        const target = currentChunkOffset + direction;
        if (target > 0) return;
        if (target < maxPastOffset) return;
        currentChunkOffset = target;
        updateTimelineView();
      }

      function renderTimelineChart() {
        const yearSelect = document.getElementById("yearFilter");
        const selectedYear = yearSelect ? yearSelect.value : "all";
        if (selectedYear && selectedYear !== "all") {
          activeTimelineData = fullDailyTimeline.filter(item => (item.date || "").startsWith(selectedYear));
        } else {
          activeTimelineData = fullDailyTimeline;
        }
        currentChunkOffset = 0;
        updateTimelineView();
      }
      window.renderTimelineChart = renderTimelineChart;

      function filterStatsKeys(q) {
        const query = q.toLowerCase();
        document.querySelectorAll('.stats-key-row').forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
      }

      // Initialize initial chunk button states
      updateTimelineView();
    </script>
  `;

  return renderPageShell({
    title: "Stats",
    activeTab: "stats",
    owner: params.owner,
    content,
  });
}
