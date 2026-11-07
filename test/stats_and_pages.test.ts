import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { StatsTracker } from "../src/stats.js";
import { renderHomePage, renderStatsPage } from "../src/views.js";

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
