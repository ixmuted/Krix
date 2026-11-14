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
    <div style="display:flex; align-items:center; gap:8px;">
      <label for="keySelector" style="font-size:12px; color:var(--geist-gray-50); font-weight:500;">Filter Key:</label>
      ${renderCustomDropdown({
        id: "keySelector",
        options: keyOptions,
        selectedValue: summary.selectedKeyId || "",
        onchange:
          "window.location.search = this.value ? '?key=' + encodeURIComponent(this.value) : ''",
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

  const content = `
    <!-- Top Header Deck -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--geist-gray-50);">TELEMETRY & ANALYTICS</div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-0.03em; color:var(--fg); margin-top:4px;">Usage &amp; Analytics</h1>
        <p style="font-size:13px; color:var(--geist-gray-50); margin-top:2px;">
          Live throughput, latency distribution, and per-key request analytics.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        ${keySelectorHtml}
        <div class="status-pill">
          <span class="status-dot-available"></span>
          <span>Live</span>
        </div>
      </div>
    </div>

    <!-- 4 High-Level KPI Cards -->
    <div class="grid-4" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:28px;">
      <div class="card spotlight-card card-top-border" style="padding:20px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Total Requests</div>
        <div class="metric-value" id="valTotalRequests" style="font-size:28px; font-weight:800; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">${totalRequests.toLocaleString()}</div>
        <div style="font-size:12px; color:var(--geist-gray-50); margin-top:4px; display:flex; align-items:center; gap:6px;">
          <span class="badge success" id="valSuccessRate">${overallSuccessRate}% success</span>
          <span id="valErrorCount">${totalErrors} errors</span>
        </div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:20px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Throughput &amp; Streams</div>
        <div class="metric-value" id="valThroughput" style="font-size:28px; font-weight:800; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">
          ${throughputRpm} <span style="font-size:14px; font-weight:500;">RPM</span>
        </div>
        <div style="font-size:12px; color:var(--geist-gray-50); margin-top:4px;">
          Active HTTP streams: <strong id="valActiveStreams" style="color:var(--fg);">${activeHttpSessions}</strong>
        </div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:20px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Latency (Avg / P95)</div>
        <div class="metric-value" id="valLatency" style="font-size:28px; font-weight:800; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">
          ${avgDurationMs} <span style="font-size:14px; font-weight:500;">/ ${p95DurationMs} ms</span>
        </div>
        <div style="font-size:12px; color:var(--geist-gray-50); margin-top:4px;">
          Peak window: <strong id="valPeakTime" data-utc-hour="${hasPeakTraffic ? summary.peakTraffic.peakHourUtc : ""}" data-utc-day="${hasPeakTraffic ? summary.peakTraffic.peakDay : ""}" style="color:var(--fg);">${
            hasPeakTraffic
              ? `${summary.peakTraffic.peakHourUtc}:00 UTC (${summary.peakTraffic.peakDay})`
              : "N/A"
          }</strong>
        </div>
      </div>

      <div class="card spotlight-card card-top-border" style="padding:20px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:var(--geist-gray-50);">Sandbox Storage</div>
        <div class="metric-value" id="valQuotaUsed" style="font-size:28px; font-weight:800; font-family:var(--font-mono); color:var(--fg); margin-top:6px;">${sharedSandbox.quotaUsedPercent}%</div>
        <div class="progress-bar-bg" style="height:6px; background:var(--bg-surface-2); border-radius:var(--radius-full); overflow:hidden; margin-top:8px;">
          <div class="progress-bar-fill" id="barQuotaFill" style="height:100%; background:var(--accent); width: ${Math.min(100, Math.max(2, sharedSandbox.quotaUsedPercent))}%;"></div>
        </div>
        <div style="font-size:11px; color:var(--geist-gray-50); margin-top:6px; display:flex; justify-content:space-between;">
          <span id="valDiskBytes">${formatBytes(sharedSandbox.totalDiskBytes)} used</span>
          <span>${sharedSandbox.quotaLimitMb} MB quota</span>
        </div>
        <p style="font-size:11px; color:var(--geist-gray-50); margin-top:6px;">Shared storage across all API keys and OAuth clients.</p>
      </div>
    </div>

    <!-- Timeline Graph Section (Vector SVG with 10-day Chunk Navigation) -->
    <div class="card spotlight-card" style="padding:24px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Activity Timeline</h2>
          <p style="font-size:12px; color:var(--geist-gray-50); margin-top:2px;">Volume of requests and tool invocations over time</p>
        </div>

        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <!-- 10-Day Desktop Chunk Slider (Contract Invariants: dailyChunkNav, btnPrevDailyChunk, btnNextDailyChunk) -->
          <div id="dailyChunkNav" class="dailyChunkNav" style="display:inline-flex; align-items:center; justify-content:center; height:34px; min-height:34px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-full); padding:0 10px; gap:6px; box-sizing:border-box;">
            <button type="button" class="pager-btn pager-icon btnPrevDailyChunk" id="btnPrevDailyChunk" aria-label="Previous 10 days" title="Previous 10 days" onclick="changeDailyChunk(-1)" style="width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; border:none; background:transparent; color:var(--fg); cursor:pointer; padding:0;">
              ${renderSvg("chevron-left", 14)}
            </button>
            <span id="lblDailyChunkRange" style="font-size:11px; font-family:var(--font-mono); color:var(--fg); padding:0 4px; text-align:center;">${initialRangeText}</span>
            <button type="button" class="pager-btn pager-icon btnNextDailyChunk" id="btnNextDailyChunk" aria-label="Next 10 days" title="Next 10 days" onclick="changeDailyChunk(1)" style="width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; border:none; background:transparent; color:var(--fg); cursor:pointer; padding:0;">
              ${renderSvg("chevron-right", 14)}
            </button>
          </div>

          <!-- Smart Year Filter -->
          ${renderCustomDropdown({
            id: "yearFilter",
            options: [
              { value: "all", label: "All Years" },
              ...availableYears.map((y: any) => ({
                value: String(y),
                label: String(y),
              })),
            ],
            selectedValue: "all",
            onchange: "renderTimelineChart()",
            ariaLabel: "Filter timeline by year",
          })}
        </div>
      </div>

      <div id="timelineChart" style="min-height:140px; display:flex; align-items:flex-end; gap:6px; padding:16px 0; border-bottom:1px solid var(--border-subtle);">
        ${
          (summary.dailyTimeline || [])
            .slice(-10)
            .map((item: any) => {
              const reqs = item.requests || 0;
              const h = Math.min(100, Math.max(8, reqs * 10));
              return `
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
                <div style="width:100%; height:${h}px; background:var(--accent); border-radius:4px 4px 0 0; opacity:0.85;" title="${item.date}: ${reqs} calls"></div>
                <span style="font-size:10px; font-family:var(--font-mono); color:var(--geist-gray-50);">${(item.date || "").slice(5)}</span>
              </div>
            `;
            })
            .join("") ||
          `<div style="width:100%; text-align:center; color:var(--geist-gray-50); font-size:12px; padding:40px 0;">No timeline data available</div>`
        }
      </div>
    </div>

    <!-- System Performance, Status Codes & Client Ecosystem -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:28px;">
      <!-- Process Health -->
      <div class="card spotlight-card" style="padding:20px;">
        <h3 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          ${renderSvg("cpu", 15)} System Process Health
        </h3>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:12px;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">Heap Memory:</span>
            <span id="valHeap" style="font-family:var(--font-mono); color:var(--fg);">${systemHealth.heapUsedMb} MB / ${systemHealth.heapTotalMb} MB</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">Resident RSS:</span>
            <span id="valRss" style="font-family:var(--font-mono); color:var(--fg);">${systemHealth.rssMb} MB</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">Process Uptime:</span>
            <span id="valUptime" style="font-family:var(--font-mono); color:var(--fg);">${Math.round(systemHealth.uptimeSec / 60)} mins</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">Platform:</span>
            <span style="font-family:var(--font-mono); color:var(--fg);">${systemHealth.platform}</span>
          </div>
        </div>
      </div>

      <!-- HTTP Status Codes -->
      <div class="card spotlight-card" style="padding:20px;">
        <h3 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          ${renderSvg("server", 15)} Response Status Codes
        </h3>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:12px;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">200 OK:</span>
            <strong style="color:var(--success); font-family:var(--font-mono);">${statusCodes["200"] || 0}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">400 Bad Request:</span>
            <span style="font-family:var(--font-mono); color:var(--fg);">${statusCodes["400"] || 0}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">401 Unauthorized:</span>
            <span style="font-family:var(--font-mono); color:var(--fg);">${statusCodes["401"] || 0}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">500 Server Error:</span>
            <span style="color:var(--error); font-family:var(--font-mono);">${statusCodes["500"] || 0}</span>
          </div>
        </div>
      </div>

      <!-- Client Ecosystem -->
      <div class="card spotlight-card" style="padding:20px;">
        <h3 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          ${renderSvg("activity", 15)} Client Ecosystem
        </h3>
        <div style="display:flex; flex-direction:column; gap:10px; font-size:12px;" id="clientEcosystemList">
          ${
            totalClientTraffic > 0
              ? Object.entries(clientEcosystems)
                  .map(
                    ([client, count]) => `
                  <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--geist-gray-50);">${escapeHtml(client)}:</span>
                    <strong style="font-family:var(--font-mono); color:var(--fg);">${count}</strong>
                  </div>
                `,
                  )
                  .join("")
              : `<div style="font-size:13px; color:var(--geist-gray-50); text-align:center; padding:12px 0;">No client traffic recorded yet (N/A)</div>`
          }
        </div>
      </div>
    </div>

    <!-- Top Tools & Storage Details -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px; margin-bottom:28px;">
      <!-- Top Tools Executed -->
      <div class="card spotlight-card" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="font-size:14px; font-weight:600; color:var(--fg);">Top Tools Executed</h3>
          <a href="/tools" class="btn ghost" style="font-size:11px; padding:3px 8px;">View tools</a>
        </div>
        <div id="topToolsList" style="display:flex; flex-direction:column; gap:12px;">
          ${
            toolEntries.length > 0
              ? toolEntries
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .slice(0, 5)
                  .map(
                    ([tool, count]) => `
                    <div>
                      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                        <span style="font-family:var(--font-mono); font-weight:600; color:var(--fg);">${escapeHtml(tool)}</span>
                        <span style="color:var(--geist-gray-50); font-family:var(--font-mono);">${count} calls</span>
                      </div>
                      <div style="height:4px; background:var(--bg-surface-2); border-radius:var(--radius-full); overflow:hidden;">
                        <div style="height:100%; background:var(--accent); width:60%;"></div>
                      </div>
                    </div>
                  `,
                  )
                  .join("")
              : `<div style="font-size:13px; color:var(--geist-gray-50); padding:16px 0; text-align:center;">No tool calls recorded yet (N/A)</div>`
          }
        </div>
      </div>

      <!-- Storage & Bandwidth Telemetry -->
      <div class="card spotlight-card" style="padding:20px;">
        <h3 style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:14px;">Storage &amp; Bandwidth Telemetry</h3>
        <div style="display:flex; flex-direction:column; gap:12px; font-size:12px;">
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border-subtle);">
            <span style="color:var(--geist-gray-50);">Data Volume Transferred:</span>
            <span style="font-family:var(--font-mono); color:var(--fg);">${formatBytes(summary.totalBytesIn || 0)} in / ${formatBytes(summary.totalBytesOut || 0)} out</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border-subtle);">
            <span style="color:var(--geist-gray-50);">Uploads Directory:</span>
            <span style="font-family:var(--font-mono); color:var(--fg);">${sharedSandbox.uploadFileCount} files (${formatBytes(sharedSandbox.uploadBytes || 0)})</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:8px; border-bottom:1px solid var(--border-subtle);">
            <span style="color:var(--geist-gray-50);">Active Repositories:</span>
            <span style="font-family:var(--font-mono); color:var(--fg);">${sharedSandbox.activeWorkDirs} active repositories</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--geist-gray-50);">Quota Threshold:</span>
            <span style="font-family:var(--font-mono); color:var(--fg);">300 MB shared limit</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Per-Key Filtered Metrics Table (Contract Invariants: statsKeySearchInput, statsKeysTableBody) -->
    <div class="card spotlight-card" style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <h2 style="font-size:16px; font-weight:600; color:var(--fg);">Per-Key &amp; Client Breakdown</h2>
          <span class="badge" style="font-size:11px;">${keys.length} keys</span>
        </div>
        <div class="krix-pill-search search-bar-responsive" style="display:flex; align-items:center; gap:8px; background:var(--bg-surface-1); border:1px solid var(--border-medium); border-radius:var(--radius-full); padding:0 16px; width:260px; height:34px; min-height:34px; box-sizing:border-box;">
          ${renderSvg("search", 14, "text-muted")}
          <input type="text" id="statsKeySearchInput" class="statsKeySearchInput" placeholder="Filter keys" oninput="filterStatsKeys(this.value)" style="border:none; background:transparent; font-size:12px; color:var(--fg); outline:none; width:100%;">
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle); color:var(--geist-gray-50); font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">
              <th style="padding:10px 12px; font-weight:600;">Key ID</th>
              <th style="padding:10px 12px; font-weight:600;">Requests</th>
              <th style="padding:10px 12px; font-weight:600;">Errors</th>
              <th style="padding:10px 12px; font-weight:600;">Latency</th>
              <th style="padding:10px 12px; font-weight:600;">Status</th>
            </tr>
          </thead>
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
                        k.keyId === "master-env-key"
                          ? "primary-key"
                          : k.keyId || k.id;

                      return `
                <tr style="border-bottom:1px solid var(--border-subtle);" class="stats-row stats-key-row">
                  <td style="padding:12px;">
                    <div style="font-weight:600; color:var(--fg);">${escapeHtml(displayLabel)}</div>
                    <div style="font-family:var(--font-mono); font-size:11px; color:var(--geist-gray-50);">${escapeHtml(displayKeyId)}</div>
                  </td>
                  <td style="padding:12px; font-family:var(--font-mono); color:var(--fg);">${k.totalRequests || 0}</td>
                  <td style="padding:12px; font-family:var(--font-mono); color:${k.errorCount > 0 ? "var(--error)" : "var(--success)"};">${k.errorCount || 0}</td>
                  <td style="padding:12px; font-family:var(--font-mono); color:var(--fg);">${k.avgDurationMs || 0}ms</td>
                  <td style="padding:12px;">
                    <span class="status-pill" style="font-size:11px;">
                      <span class="status-dot-available" style="width:5px; height:5px;"></span>
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              `;
                    })
                    .join("")
                : `
                <tr>
                  <td colspan="5" style="text-align:center; padding:24px; color:var(--geist-gray-50); font-size:13px;">
                    No client activity recorded yet. Connect an MCP client above to start tracking.
                  </td>
                </tr>
              `
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
            chart.innerHTML = '<div style="width:100%; text-align:center; color:var(--geist-gray-50); font-size:12px; padding:40px 0;">No timeline data available for this range</div>';
          } else {
            chart.innerHTML = chunkItems.map(item => {
              const reqs = item.requests || 0;
              const h = Math.min(100, Math.max(8, reqs * 10));
              return '<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">' +
                '<div style="width:100%; height:' + h + 'px; background:var(--accent); border-radius:4px 4px 0 0; opacity:0.85;" title="' + (item.date || '') + ': ' + reqs + ' calls"></div>' +
                '<span style="font-size:10px; font-family:var(--font-mono); color:var(--geist-gray-50);">' + (item.date || '').slice(5) + '</span>' +
              '</div>';
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
