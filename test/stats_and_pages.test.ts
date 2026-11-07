import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { StatsTracker } from "../src/stats.js";
import {
  renderHomePage,
  renderStatsPage,
  renderToolsPage,
  renderApiKeysPage,
} from "../src/views.js";
import { renderUploadPage } from "../src/uploadSessions.js";
import {
  createDynamicKey,
  revokeDynamicKey,
  generateClientId,
} from "../src/googleAuth.js";

test("StatsTracker records requests, computes timeline graphs, and tracks 4 metrics per key", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "krix-stats-test-"));
  const statsFile = path.join(tmpDir, "stats.json");
  const tracker = new StatsTracker(statsFile);

  // 1. Record requests across multiple keys and auth types
  tracker.recordRequest({
    keyId: "master-env-key",
    label: "Master Key (Server Env)",
    type: "master",
    toolName: "sandbox_file",
    durationMs: 45,
    isError: false,
    bytesIn: 1200,
    bytesOut: 4500,
    ip: "127.0.0.1",
    userAgent: "Claude-Desktop/1.0",
  });

  tracker.recordRequest({
    keyId: "dyn:client_abc123456789",
    label: "Gemini CLI Key",
    type: "api_key",
    toolName: "sandbox_exec",
    durationMs: 120,
    isError: false,
    bytesIn: 800,
    bytesOut: 2300,
    ip: "10.0.0.2",
    userAgent: "Gemini-CLI/2.0",
  });

  tracker.recordRequest({
    keyId: "dyn:client_abc123456789",
    label: "Gemini CLI Key",
    type: "api_key",
    toolName: "sandbox_exec",
    durationMs: 250,
    isError: true,
    bytesIn: 500,
    bytesOut: 150,
    ip: "10.0.0.2",
    userAgent: "Gemini-CLI/2.0",
  });

  tracker.recordRequest({
    keyId: "oauth:chatgpt-client-999",
    label: "ChatGPT OAuth",
    type: "oauth",
    toolName: "git_clone",
    durationMs: 800,
    isError: false,
    bytesIn: 3400,
    bytesOut: 12800,
    ip: "192.168.1.50",
    userAgent: "ChatGPT-MCP/1.1",
  });

  // Create a dummy sandbox folder with test files to verify shared quota calculation
  const sandboxDir = path.join(tmpDir, "sandbox");
  const uploadDir = path.join(sandboxDir, "upload");
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, "file1.txt"), "hello world"); // 11 bytes
  fs.writeFileSync(path.join(uploadDir, "file2.bin"), Buffer.alloc(1024)); // 1024 bytes

  const summary = tracker.getSummary(sandboxDir);

  // Assert global aggregations
  assert.equal(summary.totalRequests, 4);
  assert.equal(summary.totalErrors, 1);
  assert.equal(summary.totalBytesIn, 1200 + 800 + 500 + 3400);
  assert.equal(summary.totalBytesOut, 4500 + 2300 + 150 + 12800);

  // Assert tool distributions
  assert.equal(summary.toolDistribution["sandbox_file"], 1);
  assert.equal(summary.toolDistribution["sandbox_exec"], 2);
  assert.equal(summary.toolDistribution["git_clone"], 1);

  // Assert timelines (Daily 30d, Weekly 12w, Monthly 12m)
  assert.equal(summary.dailyTimeline.length, 30);
  assert.equal(summary.weeklyTimeline.length, 12);
  assert.equal(summary.monthlyTimeline.length, 12);
  const todayEntry = summary.dailyTimeline[summary.dailyTimeline.length - 1];
  assert.equal(todayEntry.requests, 4);
  assert.equal(todayEntry.tools, 4);

  // Assert Per-Key Metrics & the 4 specific details:
  // Detail 1: Success vs error rate (% and counts)
  // Detail 2: Latency distribution (average response duration in ms)
  // Detail 3: Data volume transferred (bytes in / bytes out)
  // Detail 4: Last active timestamp, client IP, and User-Agent
  assert.equal(summary.keys.length, 3);
  const geminiKey = summary.keys.find(
    (k) => k.keyId === "dyn:client_abc123456789",
  )!;
  assert.ok(geminiKey);
  assert.equal(geminiKey.totalRequests, 2);
  assert.equal(geminiKey.errorCount, 1);
  assert.equal(geminiKey.successCount, 1);
  assert.equal(geminiKey.avgDurationMs, 185); // (120 + 250) / 2
  assert.equal(geminiKey.bytesIn, 1300);
  assert.equal(geminiKey.bytesOut, 2450);
  assert.equal(geminiKey.lastClientIp, "10.0.0.2");
  assert.equal(geminiKey.lastUserAgent, "Gemini-CLI/2.0");

  // Assert shared quota calculation: all keys share same sandbox pool
  assert.ok(summary.sharedSandbox);
  assert.equal(summary.sharedSandbox.uploadFileCount, 2);
  assert.equal(summary.sharedSandbox.uploadBytes, 1035);
  assert.equal(summary.sharedSandbox.quotaLimitMb, 300);

  // Assert persistence to disk
  tracker.flush();
  assert.ok(fs.existsSync(statsFile));
  const reloadedTracker = new StatsTracker(statsFile);
  const reloadedSummary = reloadedTracker.getSummary();
  assert.equal(reloadedSummary.totalRequests, 4);

  // Clean up test temp dir
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Home and Stats pages adhere to Geist Minimalist Design, Zero-Neon, and Zero-Ellipsis", () => {
  const homeHtml = renderHomePage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner: {
      email: "owner@example.com",
      name: "Owner User",
      expiresAt: Date.now() + 100000,
    },
    uploads: [{ name: "test.py", size: 1024 }],
    dynamicKeys: [
      {
        id: "key-1",
        label: "Gemini CLI",
        prefix: "kx_live_12345678",
        createdAt: Date.now(),
      },
    ],
  });

  const statsHtml = renderStatsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner: {
      email: "owner@example.com",
      name: "Owner User",
      expiresAt: Date.now() + 100000,
    },
    summary: {
      totalRequests: 10,
      totalSuccess: 9,
      totalErrors: 1,
      overallSuccessRate: 90,
      avgDurationMs: 42,
      p95DurationMs: 45,
      throughputRpm: 2.5,
      activeHttpSessions: 1,
      totalBytesIn: 2048,
      totalBytesOut: 8192,
      uniqueKeysCount: 1,
      toolDistribution: { sandbox_exec: 8, sandbox_file: 2 },
      protocolDistribution: {},
      dailyTimeline: [{ date: "2026-11-07", requests: 10, tools: 10 }],
      weeklyTimeline: [{ week: "2026-W45", requests: 10, tools: 10 }],
      monthlyTimeline: [{ month: "2026-11", requests: 10, tools: 10 }],
      availableYears: [2026],
      keys: [
        {
          keyId: "master-env-key",
          label: "Master Key (Server Env)",
          type: "master",
          totalRequests: 10,
          successCount: 9,
          errorCount: 1,
          totalDurationMs: 420,
          avgDurationMs: 42,
          bytesIn: 2048,
          bytesOut: 8192,
          lastActiveAt: Date.now(),
          lastClientIp: "127.0.0.1",
          lastUserAgent: "Mozilla/5.0",
          toolCalls: { sandbox_exec: 8, sandbox_file: 2 },
          daily: { "2026-11-07": 10 },
          weekly: { "2026-W45": 10 },
          monthly: { "2026-11": 10 },
        },
      ],
      sharedSandbox: {
        uploadFileCount: 1,
        uploadBytes: 1024,
        uploadFiles: [{ name: "test.py", size: 1024, mtime: Date.now() }],
        activeWorkDirs: 0,
        totalDiskBytes: 1024,
        quotaLimitMb: 300,
        quotaUsedPercent: 0.1,
      },
      systemHealth: {
        heapUsedMb: 35.2,
        heapTotalMb: 60.5,
        rssMb: 75.1,
        uptimeSec: 120,
        nodeVersion: "v22.0.0",
        platform: "linux (x64)",
      },
      statusCodes: { "200": 9, "500": 1 },
      clientEcosystems: { "Claude Desktop": 10 },
      recentErrors: [],
      peakTraffic: {
        peakHourUtc: 14,
        peakDay: "Friday",
      },
      toolsCatalog: [],
      lastUpdated: Date.now(),
    },
  });

  // 1. Zero-Ellipsis Audit: No '...' or '&hellip;' in UI microcopy
  // We check buttons, search placeholders, prefixes, and labels
  assert.equal(
    homeHtml.includes("..."),
    false,
    "homeHtml must not contain '...'",
  );
  assert.equal(
    homeHtml.includes("&hellip;"),
    false,
    "homeHtml must not contain '&hellip;'",
  );
  assert.equal(
    statsHtml.includes("..."),
    false,
    "statsHtml must not contain '...'",
  );
  assert.equal(
    statsHtml.includes("&hellip;"),
    false,
    "statsHtml must not contain '&hellip;'",
  );

  // 2. Zero Neon Glow Audit: No neon glowing classes or cyan text glow
  assert.equal(
    homeHtml.includes("#39c5bb"),
    false,
    "Must not contain old cyan #39c5bb",
  );
  assert.equal(
    statsHtml.includes("#39c5bb"),
    false,
    "Must not contain old cyan #39c5bb",
  );
  assert.equal(
    homeHtml.includes("box-shadow: 0 0 16px"),
    false,
    "Must not contain neon box-shadow",
  );

  // 3. Theme Toggle Support: Check Geist monochrome tokens and qw-theme persistence
  assert.ok(homeHtml.includes("qw-theme"));
  assert.ok(statsHtml.includes("qw-theme"));
  assert.ok(
    homeHtml.includes("document.documentElement.classList.toggle('dark')"),
  );
  assert.ok(
    statsHtml.includes("document.documentElement.classList.toggle('dark')"),
  );

  // 4. Contact and Security Hardening Audit
  // Verified contact link is displayed
  assert.ok(homeHtml.includes("https://quickwitty.onrender.com"));
  assert.ok(statsHtml.includes("https://quickwitty.onrender.com"));
  // Verified security leaks are stripped from public HTML
  assert.equal(
    homeHtml.includes("/.well-known/jwks.json"),
    false,
    "JWKS must not be linked in public UI",
  );
  assert.equal(
    statsHtml.includes("/.well-known/jwks.json"),
    false,
    "JWKS must not be linked in public UI",
  );
  assert.equal(
    homeHtml.includes("v1.1.0"),
    false,
    "Version tag must not be visible",
  );
  assert.equal(
    statsHtml.includes("v1.1.0"),
    false,
    "Version tag must not be visible",
  );
  assert.equal(
    homeHtml.includes("RS256"),
    false,
    "RSA algorithm must not be advertised",
  );
  assert.equal(
    statsHtml.includes("RS256"),
    false,
    "RSA algorithm must not be advertised",
  );
  assert.equal(
    homeHtml.includes("Single-User Architecture"),
    false,
    "Must be just Krix",
  );
  assert.equal(
    statsHtml.includes("Single-User Architecture"),
    false,
    "Must be just Krix",
  );

  // Verified navigation contains Tools and API Keys
  assert.ok(homeHtml.includes("/tools"));
  assert.ok(statsHtml.includes("/tools"));
  assert.ok(homeHtml.includes("/api"));
  assert.ok(statsHtml.includes("/api"));

  // 5. Shared sandbox storage cleanly highlighted with concise professional terms
  assert.ok(statsHtml.includes("Sandbox Storage"));
  assert.ok(
    statsHtml.includes("Shared storage across all API keys and OAuth clients."),
  );

  // 6. Professional terminology audit: zero 'Gateway' or silly 'pool' in UI copy
  assert.equal(
    homeHtml.includes("Gateway"),
    false,
    "homeHtml must not contain 'Gateway'",
  );
  assert.equal(
    homeHtml.includes("pool"),
    false,
    "homeHtml must not contain 'pool'",
  );
  assert.equal(
    statsHtml.includes("Gateway"),
    false,
    "statsHtml must not contain 'Gateway'",
  );
  assert.equal(
    statsHtml.includes("pool"),
    false,
    "statsHtml must not contain 'pool'",
  );
});

test("Tools page renders modular compact boxes, search bar, category pills, and full 87+ tools catalog", () => {
  const tracker = new StatsTracker();
  const summary = tracker.getSummary();

  assert.ok(
    summary.toolsCatalog.length >= 87,
    `toolsCatalog must contain at least 87 tools, got ${summary.toolsCatalog.length}`,
  );

  const toolsHtml = renderToolsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner: {
      email: "owner@example.com",
      name: "Owner User",
      expiresAt: Date.now() + 100000,
    },
    tools: summary.toolsCatalog,
    summary,
  });

  // Zero-Ellipsis Audit
  assert.equal(
    toolsHtml.includes("..."),
    false,
    "toolsHtml must not contain '...'",
  );
  assert.equal(
    toolsHtml.includes("&hellip;"),
    false,
    "toolsHtml must not contain '&hellip;'",
  );

  // Search input & Category Pills
  assert.ok(
    toolsHtml.includes('id="toolSearchInput"'),
    "Must include tool search input",
  );
  assert.ok(
    toolsHtml.includes('data-cat="All"'),
    "Must include All category pill",
  );
  assert.ok(
    toolsHtml.includes('data-cat="Sandbox"'),
    "Must include Sandbox category pill",
  );
  assert.ok(
    toolsHtml.includes('data-cat="Render"'),
    "Must include Render category pill",
  );
  assert.ok(
    toolsHtml.includes('data-cat="GitHub"'),
    "Must include GitHub category pill",
  );
  assert.ok(
    toolsHtml.includes('data-cat="Files"'),
    "Must include Files category pill",
  );

  // Compact grid structure
  assert.ok(
    toolsHtml.includes('class="tools-grid"'),
    "Must use tools-grid layout",
  );
  assert.ok(
    toolsHtml.includes('class="tool-box"'),
    "Must use tool-box containers",
  );

  // Verify representative tools across all categories
  assert.ok(toolsHtml.includes("sandbox_exec"), "Must include sandbox_exec");
  assert.ok(toolsHtml.includes("sandbox_store"), "Must include sandbox_store");
  assert.ok(
    toolsHtml.includes("create_web_service"),
    "Must include create_web_service",
  );
  assert.ok(
    toolsHtml.includes("create_pull_request"),
    "Must include create_pull_request",
  );
});

test("API keys page includes live search, custom toasts, revoke confirmation modal, and OAuth authorizations", () => {
  const apiKeysHtml = renderApiKeysPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner: {
      email: "owner@example.com",
      name: "Owner User",
      expiresAt: Date.now() + 100000,
    },
    dynamicKeys: [
      {
        id: "key-test-1",
        label: "Gemini CLI Key",
        prefix: "kx_live_abcdef123456",
        createdAt: Date.now(),
      },
    ],
    oauthAuthorizations: [
      {
        clientId: "client-gemini-mcp",
        clientName: "Google Gemini Connected App",
        authorizedAt: Date.now(),
        lastUsedAt: Date.now(),
        scope: "read write sandbox",
        active: true,
      },
    ],
  });

  // Zero-Ellipsis Audit
  assert.equal(
    apiKeysHtml.includes("..."),
    false,
    "apiKeysHtml must not contain '...'",
  );
  assert.equal(
    apiKeysHtml.includes("&hellip;"),
    false,
    "apiKeysHtml must not contain '&hellip;'",
  );

  // Live search bar
  assert.ok(
    apiKeysHtml.includes('id="keySearchInput"'),
    "Must include API key search input",
  );

  // Custom Toast notifications (no browser alert popups)
  assert.ok(
    apiKeysHtml.includes('class="toast-container"'),
    "Must have custom toast container",
  );
  assert.ok(
    apiKeysHtml.includes("function showToast("),
    "Must implement custom showToast",
  );

  // Custom Revocation Confirmation Modal (no browser confirm popups)
  assert.ok(
    apiKeysHtml.includes('id="confirmModal"'),
    "Must have custom confirmation modal",
  );
  assert.ok(
    apiKeysHtml.includes("function openRevokeKeyModal("),
    "Must implement openRevokeKeyModal",
  );

  // Active OAuth Authorizations section
  assert.ok(
    apiKeysHtml.includes("Active OAuth Authorizations"),
    "Must display OAuth authorizations header",
  );
  assert.ok(
    apiKeysHtml.includes("client-gemini-mcp"),
    "Must list OAuth client ID",
  );
  assert.ok(
    apiKeysHtml.includes("Google Gemini Connected App"),
    "Must list OAuth client name",
  );
});

test("Real telemetry audit: Peak traffic falls back to N/A when 0 requests, Primary Key rename, and clean tools", () => {
  const tracker = new StatsTracker();
  const summary = tracker.getSummary();

  // Peak traffic must be null when requests are 0
  assert.equal(summary.totalRequests, 0);
  assert.equal(summary.peakTraffic.peakHourUtc, null);
  assert.equal(summary.peakTraffic.peakDay, null);

  const emptyStatsHtml = renderStatsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner: {
      email: "owner@example.com",
      name: "Owner User",
      expiresAt: Date.now() + 100000,
    },
    summary,
  });

  // Must display N/A for peak window
  assert.ok(
    emptyStatsHtml.includes('id="valPeakTime"') &&
      emptyStatsHtml.includes("N/A"),
    "Empty stats must show N/A for peak window",
  );

  // Must display N/A for empty tools and client traffic
  assert.ok(
    emptyStatsHtml.includes("No tool calls recorded yet (N/A)"),
    "Must display N/A fallback when no tool calls exist",
  );
  assert.ok(
    emptyStatsHtml.includes("No client traffic recorded yet (N/A)"),
    "Must display N/A fallback when no client traffic exists",
  );

  // Primary Key rename audit
  assert.equal(
    emptyStatsHtml.includes("Master Key"),
    false,
    "Stats page must not display 'Master Key'",
  );
  assert.equal(
    emptyStatsHtml.includes("master-env-key"),
    false,
    "Stats page must not display 'master-env-key'",
  );
});

test("Upload Page redesign, 12-char Client ID, 4-char unique API key enforcement, and UI polish", () => {
  // 1. Upload Page standard layout and modern controls
  const uploadHtml = renderUploadPage("dummy_nonce", {
    ttlMinutes: 60,
    retentionMinutes: 1440,
    maxFileMb: 25,
    maxTotalMb: 100,
    maxFiles: 20,
    folder: "upload",
    owner: {
      email: "owner@example.com",
      name: "Owner User",
      expiresAt: Date.now() + 3600000,
    },
  });

  // Must use standard header and footer
  assert.ok(
    uploadHtml.includes("nav-pill"),
    "Upload page must include standard nav-pill navigation",
  );
  assert.ok(
    uploadHtml.includes("Krix"),
    "Upload page must include Krix branding",
  );
  assert.ok(
    uploadHtml.includes("Drag and drop files here, or click to browse"),
    "Must have modern drop zone text",
  );
  assert.ok(
    uploadHtml.includes("drop-zone"),
    "Must have modern drop-zone class",
  );
  assert.ok(
    uploadHtml.includes("Search files"),
    "Must rename Filter files to Search files",
  );
  assert.ok(
    uploadHtml.includes("Permanent Storage"),
    "Must include Permanent Storage switch",
  );
  assert.ok(
    uploadHtml.includes("switch-wrap"),
    "Must include switch-wrap toggle component",
  );
  assert.ok(
    uploadHtml.includes("toastContainer"),
    "Must include custom toast notification container",
  );
  assert.ok(
    uploadHtml.includes("confirmModal"),
    "Must include custom confirmation modal",
  );

  // 2. Client ID generation: 12-character alphanumeric
  const clientId = generateClientId();
  assert.equal(clientId.length, 12, "Client ID must be exactly 12 characters");
  assert.ok(
    /^[a-z0-9]{12}$/.test(clientId),
    "Client ID must be alphanumeric lowercase string",
  );

  // 3. Minimum 4 characters key name enforcement
  assert.throws(
    () => createDynamicKey("abc"),
    /Key name must be at least 4 characters long/,
    "Must reject key name shorter than 4 characters",
  );

  // 4. Unique key name enforcement
  const uniqueName = `Suite-Key-${Date.now()}`;
  const key1 = createDynamicKey(uniqueName);
  assert.ok(key1.clientId, "Key must have clientId property");
  assert.equal(key1.clientId.length, 12, "Key clientId must be 12 characters");

  assert.throws(
    () => createDynamicKey(uniqueName.toLowerCase()),
    /already exists/,
    "Must reject duplicate key name case-insensitively",
  );

  // Clean up key
  revokeDynamicKey(key1.id);

  // 5. API Keys Page layout: Client ID column, count badge, and no unified auth card
  const apiKeysHtml = renderApiKeysPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner: {
      email: "owner@example.com",
      name: "Owner User",
      expiresAt: Date.now() + 3600000,
    },
    keys: [
      {
        id: "test_k1",
        clientId: "x9k2m1p0q8w4",
        key: "krix_key_dummy_secret_1234567890",
        prefix: "krix_key_dummy_",
        label: "Primary Production Key",
        createdAt: Date.now(),
      },
    ],
    oauthClients: [],
  });

  assert.ok(
    apiKeysHtml.includes("Client ID"),
    "API keys table must display Client ID column header",
  );
  assert.ok(
    apiKeysHtml.includes("x9k2m1p0q8w4"),
    "API keys table must render the 12-char client ID",
  );
  assert.ok(
    apiKeysHtml.includes("keysCountBadge"),
    "Must include keysCountBadge element for reactive counter updates",
  );
  assert.equal(
    apiKeysHtml.includes("Unified Authentication &amp; MCP Integration") ||
      apiKeysHtml.includes("Unified Authentication & MCP Integration"),
    false,
    "API keys page must remove the Unified Authentication & MCP Integration card",
  );
});
