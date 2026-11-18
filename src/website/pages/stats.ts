// Real-Time Telemetry Dashboard with Lazy-Loaded Historical Timeline, Boundary Detection, and Per-Key Metrics
// Contract Invariants: Exact <title>Stats</title>, id="keySelector", id="valPeakTime", id="statsKeySearchInput", dailyChunkNav, btnPrevDailyChunk, btnNextDailyChunk, N/A fallbacks

import {
  renderPageShell,
  renderAuthRequiredCard,
  renderCustomDropdown,
  CustomDropdownOption,
  escapeHtml,
  formatBytes,
  formatCompactCount,
} from "../components.js";
import { renderSvg } from "../icons.js";

function truncateKeyId(id: string): string {
  const raw = String(id || "");
  if (raw.length <= 14) return raw;
  return `${raw.slice(0, 6)}...${raw.slice(-4)}`;
}

function niceChartMax(maxVal: number): number {
  if (maxVal <= 4) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const residual = maxVal / magnitude;
  let nice = 10;
  if (residual <= 1) nice = 1;
  else if (residual <= 2) nice = 2;
  else if (residual <= 5) nice = 5;
  return Math.max(4, nice * magnitude);
}

function renderServerChartHtml(items: any[]): string {
  if (!items.length) {
    return `<div class="empty" style="width:100%;">No timeline data available</div>`;
  }
  const maxReqs = Math.max(0, ...items.map((i: any) => Number(i.requests || 0)));
  const ceiling = niceChartMax(maxReqs);
  const ticks = [
    ceiling,
    Math.round(ceiling * 0.75),
    Math.round(ceiling * 0.5),
    Math.round(ceiling * 0.25),
    0,
  ];
  const yAxis = ticks
    .map((t) => `<span class="chart-y-tick">${escapeHtml(formatCompactCount(t))}</span>`)
    .join("");
  const bars = items
    .map((item: any) => {
      const reqs = Number(item.requests || 0);
      const h = reqs === 0 ? 0 : Math.max(4, Math.round((reqs / ceiling) * 140));
      return `<div class="bar-col"><div class="bar-track"><div class="bar" style="height:${h}px;" title="${escapeHtml(item.date || "")}: ${reqs.toLocaleString()} calls"></div></div><span class="bar-label">${escapeHtml((item.date || "").slice(5))}</span></div>`;
    })
    .join("");
  return `
    <div class="chart-with-axis">
      <div class="chart-y-axis" aria-hidden="true">${yAxis}</div>
      <div class="chart-plot">
        <div class="chart-gridlines" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <div class="chart-bars">${bars}</div>
      </div>
    </div>`;
}

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
  const earliestDate: string | null = summary.earliestDate || null;

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
  const availableYears = summary.availableYears || [new Date().getFullYear()];

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
      initialRangeText = `${firstDate.slice(5)} – ${lastDate.slice(5)}`;
    }
  }

  const kv = (label: string, value: string, id = "", cls = "") =>
    `<div class="row"><span class="text-muted">${label}</span><span${id ? ` id="${id}"` : ""} class="mono ${cls}">${value}</span></div>`;

  const content = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Usage</h1>
        <p class="page-sub">Throughput, latency and per-key request activity.</p>
      </div>
      <div class="page-actions">
        ${keySelectorHtml}
      </div>
    </div>

    <div class="stats grid-4" style="margin-bottom:16px;">
      <div class="stat">
        <div class="stat-label">Total Requests</div>
        <div class="stat-value metric-value" id="valTotalRequests" title="${totalRequests.toLocaleString()}">${formatCompactCount(totalRequests)}</div>
        <div class="cluster" style="margin-top:6px; font-size:12px;">
          <span class="badge success" id="valSuccessRate">${overallSuccessRate}% success</span>
          <span class="text-muted" id="valErrorCount">${formatCompactCount(totalErrors)} errors</span>
        </div>
      </div>
      <div class="stat">
        <div class="stat-label">Throughput &amp; Streams</div>
        <div class="stat-value metric-value" id="valThroughput">${formatCompactCount(throughputRpm)} <span class="text-muted" style="font-size:14px; font-family:var(--font-sans);">RPM</span></div>
        <div class="text-muted" style="font-size:12px; margin-top:6px;">Active HTTP streams: <strong id="valActiveStreams" style="color:var(--fg);">${formatCompactCount(activeHttpSessions)}</strong></div>
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
          <p class="panel-sub">Requests per day${earliestDate ? ` · Since ${escapeHtml(earliestDate)}` : ""}</p>
        </div>
        <div class="cluster">
          <div id="dailyChunkNav" class="dailyChunkNav cluster" style="gap:4px;">
            <button type="button" class="pager-btn btnPrevDailyChunk" id="btnPrevDailyChunk" aria-label="Previous period" title="Previous period" onclick="changeDailyChunk(-1)">${renderSvg("chevron-left", 14)}</button>
            <span id="lblDailyChunkRange" class="mono" style="font-size:12px; min-width:110px; text-align:center;">${escapeHtml(initialRangeText)}</span>
            <button type="button" class="pager-btn btnNextDailyChunk" id="btnNextDailyChunk" aria-label="Next period" title="Next period" onclick="changeDailyChunk(1)">${renderSvg("chevron-right", 14)}</button>
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
        ${renderServerChartHtml(initialChunk)}
      </div>
    </div>

    <div class="stats stats-balanced-3" style="margin-top:16px; margin-bottom:16px;">
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
          ${kv("200 OK", formatCompactCount(statusCodes["200"] || 0), "", "text-ok")}
          ${kv("400 Bad Request", formatCompactCount(statusCodes["400"] || 0))}
          ${kv("401 Unauthorized", formatCompactCount(statusCodes["401"] || 0))}
          ${kv("500 Server Error", formatCompactCount(statusCodes["500"] || 0), "", "text-bad")}
        </div>
      </div>
      <div class="panel" style="margin:0;">
        <h3 class="panel-title" style="margin-bottom:12px;">Clients</h3>
        <div class="rows" id="clientEcosystemList">
          ${
            totalClientTraffic > 0
              ? Object.entries(clientEcosystems)
                  .map(([client, count]) => kv(escapeHtml(client), formatCompactCount(Number(count) || 0)))
                  .join("")
              : `<div class="empty" style="padding:12px 0;">No client traffic recorded yet (N/A)</div>`
          }
        </div>
      </div>
    </div>

    <div class="stats stats-balanced-2" style="margin-bottom:16px;">
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
                      ([tool, count]) => {
                        const n = Number(count) || 0;
                        return `
                    <div>
                      <div class="cluster" style="justify-content:space-between; font-size:13px; margin-bottom:6px;">
                        <span class="mono">${escapeHtml(tool)}</span>
                        <span class="text-muted" title="${n.toLocaleString()} calls">${formatCompactCount(n)} calls</span>
                      </div>
                      <div class="progress"><span style="width:${Math.max(3, Math.round((n / max) * 100))}%;"></span></div>
                    </div>`;
                      },
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
                      const rawKeyId = String(
                        k.keyId === "master-env-key" ? "primary-key" : k.keyId || k.id || "",
                      );
                      const shortKeyId = truncateKeyId(rawKeyId);
                      const keyUrl = `/api/settings?key=${encodeURIComponent(rawKeyId)}`;
                      return `
                <tr class="stats-row stats-key-row">
                  <td>
                    <div class="list-name">${escapeHtml(displayLabel)}</div>
                    <a href="${keyUrl}" class="list-meta mono key-id-link" title="${escapeHtml(rawKeyId)}">${escapeHtml(shortKeyId)}</a>
                  </td>
                  <td class="mono" title="${Number(k.totalRequests || 0).toLocaleString()}">${formatCompactCount(k.totalRequests || 0)}</td>
                  <td class="mono ${k.errorCount > 0 ? "text-bad" : "text-ok"}" title="${Number(k.errorCount || 0).toLocaleString()}">${formatCompactCount(k.errorCount || 0)}</td>
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
      function formatCompactCount(count) {
        var n = Number(count) || 0;
        if (n <= 9999) return n.toLocaleString();
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\\.0$/, '') + 'm';
        return (n / 1000).toFixed(1).replace(/\\.0$/, '') + 'k';
      }

      function niceChartMax(maxVal) {
        if (maxVal <= 4) return 4;
        var magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
        var residual = maxVal / magnitude;
        var nice = 10;
        if (residual <= 1) nice = 1;
        else if (residual <= 2) nice = 2;
        else if (residual <= 5) nice = 5;
        return Math.max(4, nice * magnitude);
      }

      var selectedKeyQuery = ${JSON.stringify(summary.selectedKeyId || "")};
      var earliestRecordedDate = ${JSON.stringify(earliestDate)};
      var dayMap = {};
      (${JSON.stringify(summary.dailyTimeline || [])}).forEach(function(item) {
        if (item && item.date) dayMap[item.date] = item;
      });
      var loadedMonths = new Set();
      Object.keys(dayMap).forEach(function(d) { loadedMonths.add(d.slice(0, 7)); });
      var currentChunkOffset = 0;
      var CHUNK_SIZE = 10;
      var isLoadingHistory = false;

      function getSortedTimeline(yearFilter) {
        var dates = Object.keys(dayMap).sort();
        if (yearFilter && yearFilter !== 'all') {
          dates = dates.filter(function(d) { return d.startsWith(yearFilter); });
        }
        return dates.map(function(d) { return dayMap[d]; });
      }

      function dateMinusDays(isoDate, days) {
        var parts = isoDate.split('-').map(Number);
        var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] - days));
        return dt.toISOString().slice(0, 10);
      }

      function fillMonthDays(monthKey, chunkObj) {
        var parts = monthKey.split('-').map(Number);
        var year = parts[0], month = parts[1];
        var daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        var today = new Date().toISOString().slice(0, 10);
        for (var d = 1; d <= daysInMonth; d++) {
          var key = monthKey + '-' + String(d).padStart(2, '0');
          if (key > today) continue;
          if (earliestRecordedDate && key < earliestRecordedDate) continue;
          var rec = (chunkObj && chunkObj[key]) || { requests: 0, tools: 0, errors: 0 };
          var reqs = Number(rec.requests || 0);
          var errs = Number(rec.errors || 0);
          dayMap[key] = {
            date: key,
            requests: reqs,
            tools: Number(rec.tools || 0),
            errors: errs,
            success: Math.max(0, reqs - errs)
          };
        }
      }

      async function ensureHistoryForOffset(targetOffset) {
        var yearSelect = document.getElementById('yearFilter');
        var selectedYear = yearSelect ? yearSelect.value : 'all';
        if (selectedYear && selectedYear !== 'all') return;
        var list = getSortedTimeline('all');
        if (!list.length) return;
        var neededStartIdx = list.length + (targetOffset - 1) * CHUNK_SIZE;
        if (neededStartIdx >= 0) return;

        var earliestLoaded = list[0].date;
        if (earliestRecordedDate && earliestLoaded <= earliestRecordedDate) return;

        var targetDate = dateMinusDays(earliestLoaded, Math.abs(neededStartIdx) + 5);
        if (earliestRecordedDate && targetDate < earliestRecordedDate) targetDate = earliestRecordedDate;

        var curMonth = targetDate.slice(0, 7);
        var endMonth = earliestLoaded.slice(0, 7);
        var monthsToFetch = [];
        var safety = 0;
        while (curMonth <= endMonth && safety < 24) {
          safety++;
          if (!loadedMonths.has(curMonth)) monthsToFetch.push(curMonth);
          var mp = curMonth.split('-').map(Number);
          var nextM = mp[1] === 12 ? (mp[0] + 1) + '-01' : mp[0] + '-' + String(mp[1] + 1).padStart(2, '0');
          curMonth = nextM;
        }
        if (!monthsToFetch.length) return;
        isLoadingHistory = true;
        try {
          for (var i = 0; i < monthsToFetch.length; i++) {
            var m = monthsToFetch[i];
            var url = '/stats/api/timeline?month=' + encodeURIComponent(m) + (selectedKeyQuery ? '&key=' + encodeURIComponent(selectedKeyQuery) : '');
            var res = await fetch(url, { credentials: 'same-origin' });
            var data = await res.json().catch(function() { return {}; });
            if (res.ok && data && data.ok) {
              loadedMonths.add(m);
              fillMonthDays(m, data.chunk || {});
            }
          }
        } finally {
          isLoadingHistory = false;
        }
      }

      function updateTimelineView() {
        var yearSelect = document.getElementById('yearFilter');
        var selectedYear = yearSelect ? yearSelect.value : 'all';
        var activeTimelineData = getSortedTimeline(selectedYear);
        var total = activeTimelineData.length;
        var end = Math.max(0, total + currentChunkOffset * CHUNK_SIZE);
        var start = Math.max(0, end - CHUNK_SIZE);
        var chunkItems = activeTimelineData.slice(start, end);

        var lbl = document.getElementById('lblDailyChunkRange');
        if (lbl) {
          if (chunkItems.length > 0 && chunkItems[0].date && chunkItems[chunkItems.length - 1].date) {
            lbl.textContent = chunkItems[0].date.slice(5) + ' – ' + chunkItems[chunkItems.length - 1].date.slice(5);
          } else {
            lbl.textContent = 'No data';
          }
        }

        var chart = document.getElementById('timelineChart');
        if (chart) {
          if (!chunkItems.length) {
            chart.innerHTML = '<div class="empty" style="width:100%;">No timeline data available for this range</div>';
          } else {
            var maxReqs = Math.max.apply(null, [0].concat(chunkItems.map(function(i) { return Number(i.requests || 0); })));
            var ceiling = niceChartMax(maxReqs);
            var ticks = [ceiling, Math.round(ceiling * 0.75), Math.round(ceiling * 0.5), Math.round(ceiling * 0.25), 0];
            var yAxisHtml = ticks.map(function(t) {
              return '<span class="chart-y-tick">' + formatCompactCount(t) + '</span>';
            }).join('');
            var barsHtml = chunkItems.map(function(item) {
              var reqs = Number(item.requests || 0);
              var h = reqs === 0 ? 0 : Math.max(4, Math.round((reqs / ceiling) * 140));
              var date = String(item.date || '').replace(/[<>&"]/g, '');
              return '<div class="bar-col"><div class="bar-track"><div class="bar" style="height:' + h + 'px;" title="' + date + ': ' + reqs.toLocaleString() + ' calls"></div></div><span class="bar-label">' + date.slice(5) + '</span></div>';
            }).join('');
            chart.innerHTML = '<div class="chart-with-axis"><div class="chart-y-axis" aria-hidden="true">' + yAxisHtml + '</div><div class="chart-plot"><div class="chart-gridlines" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><div class="chart-bars">' + barsHtml + '</div></div></div>';
          }
        }

        var btnPrev = document.getElementById('btnPrevDailyChunk');
        var btnNext = document.getElementById('btnNextDailyChunk');
        var earliestInChunk = chunkItems.length ? chunkItems[0].date : '';
        var atBoundary = Boolean(
          (earliestRecordedDate && earliestInChunk && earliestInChunk <= earliestRecordedDate) ||
          (!earliestRecordedDate && start <= 0)
        );
        if (btnPrev) {
          var canGoPrev = !atBoundary && (start > 0 || !earliestRecordedDate ? start > 0 : earliestInChunk > earliestRecordedDate);
          btnPrev.disabled = !canGoPrev;
          btnPrev.style.opacity = canGoPrev ? '1' : '0.35';
          btnPrev.style.cursor = canGoPrev ? 'pointer' : 'not-allowed';
          btnPrev.setAttribute('aria-disabled', String(!canGoPrev));
        }
        if (btnNext) {
          var canGoNext = currentChunkOffset < 0;
          btnNext.disabled = !canGoNext;
          btnNext.style.opacity = canGoNext ? '1' : '0.35';
          btnNext.style.cursor = canGoNext ? 'pointer' : 'not-allowed';
          btnNext.setAttribute('aria-disabled', String(!canGoNext));
        }
      }

      async function changeDailyChunk(direction) {
        if (isLoadingHistory) return;
        var target = currentChunkOffset + direction;
        if (target > 0) return;
        if (direction < 0) {
          await ensureHistoryForOffset(target);
          var yearSelect = document.getElementById('yearFilter');
          var activeTimelineData = getSortedTimeline(yearSelect ? yearSelect.value : 'all');
          var newEnd = activeTimelineData.length + target * CHUNK_SIZE;
          if (newEnd <= 0) return;
        }
        currentChunkOffset = target;
        updateTimelineView();
      }

      function renderTimelineChart() {
        currentChunkOffset = 0;
        updateTimelineView();
      }
      window.renderTimelineChart = renderTimelineChart;

      function filterStatsKeys(q) {
        var query = q.toLowerCase();
        document.querySelectorAll('.stats-key-row').forEach(function(row) {
          row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
      }

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
