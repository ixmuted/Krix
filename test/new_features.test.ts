import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  renderHeader,
  renderFooter,
  renderGoogleLogoSvg,
  renderAuthRequiredCard,
  renderRecaptchaScript,
  renderApiKeysPage,
  renderStatsPage,
  renderToolsPage,
  renderStorePage,
  renderHomePage,
  renderNotFoundPage,
  getBaseStyles,
} from "../src/views.js";
import { StatsTracker } from "../src/stats.js";
import { shareFile } from "../src/fileShare.js";
import { getServerIcons } from "../src/icons.js";
import { renderUploadPage } from "../src/uploadSessions.js";

test("SEP-2127 MCP server card, icon sizes, and metadata standard", () => {
  const base = "https://krix.onrender.com";
  const icons = getServerIcons(base);

  // Must have 512x512 logo
  const logo512 = icons.find(
    (i) => i.sizes?.includes("512x512") && i.src.includes("logo.png"),
  );
  assert.ok(logo512, "Must contain 512x512 logo.png");
  assert.equal(logo512.type, "image/png");

  // Manifest JSON sizes check
  const manifest = JSON.parse(
    fs.readFileSync(path.resolve("manifest.json"), "utf-8"),
  );
  assert.ok(Array.isArray(manifest.icons), "manifest icons must be an array");
  const m48 = manifest.icons.find((i: any) => i.src.includes("48"));
  assert.equal(
    m48?.sizes,
    "48x48",
    "manifest icon sizes must be standard string '48x48'",
  );
  assert.equal(m48?.type, "image/png");

  const serverJson = JSON.parse(
    fs.readFileSync(path.resolve("server.json"), "utf-8"),
  );
  const sLogo = serverJson.icons.find((i: any) => i.src.includes("logo.png"));
  assert.deepEqual(
    sLogo?.sizes,
    ["512x512"],
    "server.json logo size must be ['512x512']",
  );

  // Assert all physical PNG icon assets are lightweight (< 25 KB) for client proxy compatibility
  const assetsDir = path.resolve("assets");
  const pngAssets = [
    "icon-24.png",
    "icon-48.png",
    "icon-64.png",
    "icon-128.png",
    "icon-192.png",
    "icon-512.png",
    "logo.png",
  ];
  for (const asset of pngAssets) {
    const fullPath = path.join(assetsDir, asset);
    assert.ok(fs.existsSync(fullPath), `Asset file ${asset} must exist`);
    const size = fs.statSync(fullPath).size;
    assert.ok(
      size > 0 && size < 25 * 1024,
      `Asset file ${asset} must be strictly under 25 KB (< 25,600 bytes), got ${size} bytes`,
    );
  }
});

test("Google logo SVG helper and sign-in button integration", () => {
  const svg = renderGoogleLogoSvg(18);
  assert.ok(svg.includes("<svg"), "Must output valid SVG");
  assert.ok(svg.includes("#4285F4"), "Must include Google Blue");
  assert.ok(svg.includes("#34A853"), "Must include Google Green");
  assert.ok(svg.includes("#FBBC05"), "Must include Google Yellow");
  assert.ok(svg.includes("#EA4335"), "Must include Google Red");

  // Header when unauthenticated: renders Google logo in sign-in button
  const headerUnauth = renderHeader("home", null);
  assert.ok(
    headerUnauth.includes("Sign in with Google"),
    "Header must include Sign in with Google",
  );
  assert.ok(
    headerUnauth.includes("#4285F4"),
    "Header sign in button must include Google logo SVG",
  );
});

test("Header authenticated profile dropdown, name overflow prevention, and sign out confirmation", () => {
  const longName =
    "Alexander Bartholomew Montgomery-Featherstonehaugh III Super Long Google User Name";
  const owner = {
    email: "owner@quickwitty.com",
    name: longName,
    picture: "https://lh3.googleusercontent.com/a/photo.jpg",
  };

  const headerAuth = renderHeader("home", owner);

  // Profile dropdown trigger and menu
  assert.ok(
    headerAuth.includes('id="headerProfileDropdownWrap"'),
    "Must include profile dropdown wrapper",
  );
  assert.ok(
    headerAuth.includes('id="headerProfileTrigger"'),
    "Must include profile trigger button",
  );
  assert.ok(
    headerAuth.includes('id="headerProfileMenu"'),
    "Must include profile dropdown menu",
  );

  // Long name overflow prevention
  assert.ok(
    headerAuth.includes("profile-trigger-name"),
    "Must include class profile-trigger-name",
  );
  assert.ok(
    headerAuth.includes("profile-menu-name"),
    "Must include class profile-menu-name",
  );
  assert.ok(
    headerAuth.includes("profile-menu-email"),
    "Must include class profile-menu-email",
  );

  // Sign out confirmation modal
  assert.ok(
    headerAuth.includes('id="headerSignOutModal"'),
    "Must include sign out confirmation modal",
  );
  assert.ok(
    headerAuth.includes("Confirm Sign Out"),
    "Must have Confirm Sign Out action",
  );
  assert.ok(
    headerAuth.includes("/auth/logout"),
    "Must point to logout endpoint",
  );

  // CSS rules for overflow prevention
  const styles = getBaseStyles();
  assert.ok(
    styles.includes("text-overflow: ellipsis"),
    "Base styles must include text-overflow: ellipsis for profile name",
  );
  assert.ok(
    styles.includes("white-space: nowrap"),
    "Base styles must include white-space: nowrap for profile name",
  );
});

test("Google reCAPTCHA v3 badge hiding, script loading, and footer terms links", () => {
  const styles = getBaseStyles();
  assert.ok(
    styles.includes(".grecaptcha-badge"),
    "Base styles must target .grecaptcha-badge",
  );
  assert.ok(
    styles.includes("visibility: hidden !important"),
    "Must hide grecaptcha-badge per Google terms",
  );

  // Test renderRecaptchaScript helper with and without nonce
  const scriptNoNonce = renderRecaptchaScript();
  assert.ok(
    scriptNoNonce.includes("https://www.google.com/recaptcha/api.js?render="),
    "Must load Google reCAPTCHA v3 script CDN",
  );
  assert.ok(
    scriptNoNonce.includes("grecaptcha.ready"),
    "Must include grecaptcha initialization hook",
  );

  const scriptWithNonce = renderRecaptchaScript("test_csp_nonce_xyz");
  assert.ok(
    scriptWithNonce.includes('nonce="test_csp_nonce_xyz"'),
    "Must attach CSP nonce to reCAPTCHA script tags",
  );

  // Ensure reCAPTCHA script is included across all pages
  const homeHtml = renderHomePage({
    base: "https://krix.onrender.com",
    isOwner: false,
    owner: null,
    uploads: [],
    dynamicKeys: [],
  });
  assert.ok(
    homeHtml.includes("https://www.google.com/recaptcha/api.js"),
    "Home page must include reCAPTCHA script",
  );

  const uploadHtml = renderUploadPage("test_nonce", {
    ttlMinutes: 60,
    retentionMinutes: 1440,
    maxFileMb: 50,
    maxTotalMb: 300,
    maxFiles: 20,
    folder: "upload",
    owner: null,
  });
  assert.ok(
    uploadHtml.includes("https://www.google.com/recaptcha/api.js"),
    "Upload page must include reCAPTCHA script",
  );
  assert.ok(
    uploadHtml.includes('nonce="test_nonce"'),
    "Upload page must pass nonce to header and scripts",
  );

  const footer = renderFooter();
  assert.ok(
    footer.includes("This site is protected by reCAPTCHA"),
    "Footer must include required reCAPTCHA notice",
  );
  assert.ok(
    footer.includes("https://policies.google.com/privacy"),
    "Footer must link to Google Privacy Policy",
  );
  assert.ok(
    footer.includes("https://policies.google.com/terms"),
    "Footer must link to Google Terms of Service",
  );
  assert.ok(
    footer.includes('href="/store"'),
    "Footer must include /store page link",
  );
});

test("Auth gating across pages: /stats, /tools, /store, /api, /upload show Authentication Required card when not signed in", () => {
  const tmpEmpty = path.join(
    os.tmpdir(),
    `krix-empty-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  const emptySummary = new StatsTracker(tmpEmpty).getSummary();

  // 1. Stats Page unauthenticated
  const statsHtml = renderStatsPage({
    base: "https://krix.onrender.com",
    isOwner: false,
    owner: null,
    summary: emptySummary,
  });
  assert.ok(
    statsHtml.includes("Authentication Required"),
    "Stats page must show Authentication Required card when !isOwner",
  );
  assert.ok(
    statsHtml.includes("returnTo=%2Fstats"),
    "Stats page auth card must return to /stats",
  );
  assert.ok(
    statsHtml.includes("#4285F4"),
    "Stats page auth card must include Google logo",
  );

  // 2. Tools Page unauthenticated
  const toolsHtml = renderToolsPage({
    base: "https://krix.onrender.com",
    isOwner: false,
    owner: null,
    tools: [],
    summary: emptySummary,
  });
  assert.ok(
    toolsHtml.includes("Authentication Required"),
    "Tools page must show Authentication Required card when !isOwner",
  );
  assert.ok(
    toolsHtml.includes("returnTo=%2Ftools"),
    "Tools page auth card must return to /tools",
  );

  // 3. Store Page unauthenticated
  const storeHtml = renderStorePage({
    base: "https://krix.onrender.com",
    isOwner: false,
    owner: null,
    files: [],
  });
  assert.ok(
    storeHtml.includes("Authentication Required"),
    "Store page must show Authentication Required card when !isOwner",
  );
  assert.ok(
    storeHtml.includes("returnTo=%2Fstore"),
    "Store page auth card must return to /store",
  );

  // 4. API Keys Page unauthenticated
  const apiHtml = renderApiKeysPage({
    base: "https://krix.onrender.com",
    isOwner: false,
    owner: null,
    keys: [],
  });
  assert.ok(
    apiHtml.includes("Authentication Required"),
    "API keys page must show Authentication Required card when !isOwner",
  );
  assert.ok(
    apiHtml.includes("returnTo=%2Fapi"),
    "API keys page auth card must return to /api",
  );

  // 5. Upload Page unauthenticated
  const uploadUnauthHtml = renderUploadPage("test_nonce_gate", {
    ttlMinutes: 60,
    retentionMinutes: 1440,
    maxFileMb: 50,
    maxTotalMb: 300,
    maxFiles: 20,
    folder: "upload",
    owner: null,
  });
  assert.ok(
    uploadUnauthHtml.includes("Authentication Required"),
    "Upload page must show Authentication Required card when !isOwner",
  );
  assert.ok(
    uploadUnauthHtml.includes("returnTo=%2Fupload"),
    "Upload page auth card must return to /upload",
  );
  assert.ok(
    uploadUnauthHtml.includes("#4285F4"),
    "Upload page auth card must include Google colored logo SVG",
  );
});

test("API key page form submission fix: prevents page reload and URL query insertion", () => {
  const owner = { email: "owner@krix.dev", name: "Krix Owner" };
  const apiHtml = renderApiKeysPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    keys: [],
  });

  // Verify form has event.preventDefault() and javascript:void(0)
  assert.ok(
    apiHtml.includes(
      'onsubmit="event.preventDefault(); handleCreateKey(event); return false;"',
    ),
    "createKeyForm onsubmit must prevent default and return false",
  );
  assert.ok(
    apiHtml.includes('action="javascript:void(0);"'),
    "createKeyForm action must be javascript:void(0) to prevent GET reloads",
  );
  assert.ok(
    apiHtml.includes('type="button"'),
    "createKeyBtn must be type=button to prevent default GET form submit",
  );
  assert.ok(
    apiHtml.includes("addEventListener('submit'"),
    "Must register submit event listener to prevent form GET reload",
  );
});

test("Dedicated Store page renders files table, download links, and permanent storage badges", () => {
  const owner = { email: "owner@krix.dev", name: "Krix Owner" };
  const testFiles = [
    {
      id: "662a1b2c3d4e5f6a7b8c9d0e",
      name: "results_dataset.csv",
      size: 1048576, // 1.0 MB
      contentType: "text/csv",
      createdAt: new Date(),
      expiresAt: null, // permanent
      source: "store" as const,
      downloadUrl:
        "https://krix.onrender.com/store/download/662a1b2c3d4e5f6a7b8c9d0e",
      permanent: true,
    },
    {
      id: "sbx_0123456789abcdef",
      name: "script.py",
      size: 4096, // 4.0 KB
      contentType: "text/x-python",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600_000), // expiring in 1 hour
      source: "sandbox" as const,
      downloadUrl: "https://krix.onrender.com/store/download?file=script.py",
      permanent: false,
    },
  ];

  const storeHtml = renderStorePage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    files: testFiles,
    usage: {
      count: 1,
      bytes: 1048576,
      permanentCount: 1,
      expiredCount: 0,
    },
  });

  // Check metrics cards
  assert.ok(
    storeHtml.includes("Total Stored Files"),
    "Must display Total Stored Files card",
  );
  assert.ok(
    storeHtml.includes("Storage Used"),
    "Must display Storage Used card",
  );
  assert.ok(
    storeHtml.includes("Permanent Files"),
    "Must display Permanent Files card",
  );

  // Check files table
  assert.ok(
    storeHtml.includes("results_dataset.csv"),
    "Must display results_dataset.csv",
  );
  assert.ok(storeHtml.includes("script.py"), "Must display script.py");
  assert.ok(
    storeHtml.includes("Cloud Store"),
    "Must display Cloud Store badge",
  );
  assert.ok(storeHtml.includes("Sandbox"), "Must display Sandbox badge");
  assert.ok(storeHtml.includes("Permanent"), "Must display Permanent badge");

  // Check download links & actions
  assert.ok(
    storeHtml.includes("/store/download/662a1b2c3d4e5f6a7b8c9d0e"),
    "Must include direct download URL for cloud store file",
  );
  assert.ok(
    storeHtml.includes("/store/download?file=script.py"),
    "Must include download URL for sandbox file",
  );
  assert.ok(storeHtml.includes("Copy URL"), "Must include Copy URL button");
  assert.ok(
    storeHtml.includes("openDeleteFileModal"),
    "Must include delete button modal",
  );
});

test("Key selector dropdown and per-key filtered stats calculation", () => {
  const tmpStats = path.join(
    os.tmpdir(),
    `krix-keystats-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  const tracker = new StatsTracker(tmpStats);

  // Record calls for 2 different keys
  tracker.recordRequest({
    keyId: "kx_key_alpha",
    label: "Claude Key",
    type: "api_key",
    endpoint: "/mcp",
    method: "POST",
    statusCode: 200,
    durationMs: 45,
    toolName: "sandbox_exec",
  });
  tracker.recordRequest({
    keyId: "kx_key_alpha",
    label: "Claude Key",
    type: "api_key",
    endpoint: "/mcp",
    method: "POST",
    statusCode: 200,
    durationMs: 55,
    toolName: "sandbox_exec",
  });
  tracker.recordRequest({
    keyId: "client_gemini_oauth",
    label: "Gemini OAuth",
    type: "oauth",
    endpoint: "/mcp",
    method: "POST",
    statusCode: 500,
    durationMs: 120,
    toolName: "sandbox_read",
  });

  // 1. Overall stats (all keys)
  const allSummary = tracker.getSummary();
  assert.equal(
    allSummary.totalRequests,
    3,
    "Total requests for all keys must be 3",
  );
  assert.equal(allSummary.totalSuccess, 2, "Total success must be 2");
  assert.equal(allSummary.totalErrors, 1, "Total errors must be 1");
  assert.equal(allSummary.toolDistribution["sandbox_exec"], 2);
  assert.equal(allSummary.toolDistribution["sandbox_read"], 1);

  // 2. Filtered by specific API key: kx_key_alpha
  const alphaSummary = tracker.getSummary(undefined, "kx_key_alpha");
  assert.equal(alphaSummary.selectedKeyId, "kx_key_alpha");
  assert.equal(alphaSummary.totalRequests, 2, "Alpha key requests must be 2");
  assert.equal(alphaSummary.totalSuccess, 2, "Alpha key success must be 2");
  assert.equal(alphaSummary.totalErrors, 0, "Alpha key errors must be 0");
  assert.equal(
    alphaSummary.avgDurationMs,
    50,
    "Alpha key avg duration must be 50ms",
  );
  assert.equal(alphaSummary.toolDistribution["sandbox_exec"], 2);
  assert.equal(alphaSummary.toolDistribution["sandbox_read"], undefined);

  // 3. Filtered by OAuth client: client_gemini_oauth
  const oauthSummary = tracker.getSummary(undefined, "client_gemini_oauth");
  assert.equal(oauthSummary.selectedKeyId, "client_gemini_oauth");
  assert.equal(
    oauthSummary.totalRequests,
    1,
    "OAuth client requests must be 1",
  );
  assert.equal(oauthSummary.totalSuccess, 0, "OAuth client success must be 0");
  assert.equal(oauthSummary.totalErrors, 1, "OAuth client errors must be 1");
  assert.equal(oauthSummary.toolDistribution["sandbox_read"], 1);
  assert.equal(oauthSummary.toolDistribution["sandbox_exec"], undefined);

  // 4. Verify Key Selector dropdown rendering on Stats and Tools pages
  const owner = { email: "owner@krix.dev", name: "Owner" };
  const statsHtml = renderStatsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    summary: alphaSummary,
  });
  assert.ok(
    statsHtml.includes('id="keySelector"'),
    "Stats page must render keySelector",
  );
  assert.ok(
    statsHtml.includes("All Keys &amp; OAuth"),
    "Must include All Keys option",
  );
  assert.ok(
    statsHtml.includes("Claude Key"),
    "Must include Claude Key in selector",
  );
  assert.ok(
    statsHtml.includes("Gemini OAuth"),
    "Must include Gemini OAuth in selector",
  );

  const toolsHtml = renderToolsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    tools: alphaSummary.toolsCatalog,
    summary: alphaSummary,
  });
  assert.ok(
    toolsHtml.includes('id="keySelector"'),
    "Tools page must render keySelector",
  );
  assert.ok(
    toolsHtml.includes("onKeyFilterChange"),
    "Tools page must have onKeyFilterChange",
  );

  // 5. Test syncKnownKeys populates unused keys and OAuth clients with 0 requests
  tracker.syncKnownKeys(
    [{ id: "kx_new_key_zero_traffic", label: "Cursor Fresh Key" }],
    [{ clientId: "client_fresh_oauth", clientName: "Claude Desktop OAuth" }],
  );
  const syncSummary = tracker.getSummary();
  const foundKey = syncSummary.keys.find(
    (k) => k.keyId === "kx_new_key_zero_traffic",
  );
  assert.ok(foundKey, "Must find newly synced API key in summary");
  assert.equal(foundKey?.totalRequests, 0, "Unused key should have 0 requests");
  assert.equal(foundKey?.type, "api_key");

  const foundOauth = syncSummary.keys.find(
    (k) => k.keyId === "client_fresh_oauth",
  );
  assert.ok(foundOauth, "Must find newly synced OAuth client in summary");
  assert.equal(
    foundOauth?.totalRequests,
    0,
    "Unused OAuth should have 0 requests",
  );
  assert.equal(foundOauth?.type, "oauth");

  const syncStatsHtml = renderStatsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    summary: syncSummary,
  });
  assert.ok(
    syncStatsHtml.includes("Cursor Fresh Key"),
    "Must render newly created API key in dropdown",
  );
  assert.ok(
    syncStatsHtml.includes("Claude Desktop OAuth"),
    "Must render newly connected OAuth in dropdown",
  );
});

test("OAuth token persistence and recovery from disk and Mongo sync", async () => {
  const {
    recordIssuedToken,
    listActiveOAuthAuthorizations,
    loadOAuthFromDisk,
  } = await import("../src/mcpOAuth.js");
  const tokenRecord = {
    token: "test_stateless_access_token_12345",
    refreshToken: "test_stateless_refresh_token_12345",
    clientId: "client_gemini_cli",
    ownerEmail: "owner@quickwitty.com",
    scope: "mcp:tools mcp:sandbox",
    expiresAt: Date.now() + 86400 * 1000,
    refreshExpiresAt: Date.now() + 30 * 86400 * 1000,
  };
  recordIssuedToken(tokenRecord);
  const activeAuths = listActiveOAuthAuthorizations();
  const foundAuth = activeAuths.find((a) => a.clientId === "client_gemini_cli");
  assert.ok(
    foundAuth,
    "Must include OAuth client in active authorizations list",
  );
  assert.equal(foundAuth?.ownerEmail, "owner@quickwitty.com");

  // Verify recovery from disk reload
  loadOAuthFromDisk();
  const diskAuths = listActiveOAuthAuthorizations();
  const diskFound = diskAuths.find((a) => a.clientId === "client_gemini_cli");
  assert.ok(diskFound, "Must recover OAuth token from disk");
});

test("Store permanent file toggle, revert retention, and dynamic live counters", async () => {
  const { renderStorePage, renderApiKeysPage } =
    await import("../dist/views.js");
  const owner = {
    sub: "12345",
    email: "owner@quickwitty.com",
    name: "ANKIT",
    picture: "https://example.com/pic.png",
  };

  // 1. Verify Store page counters and revert/permanent toggle UI
  const storeHtml = renderStorePage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    files: [
      {
        id: "file_test_perm_1",
        name: "document.pdf",
        size: 1048576,
        contentType: "application/pdf",
        ownerKey: "hash123",
        createdAt: new Date(),
        expiresAt: null, // permanent
        permanent: true,
      },
      {
        id: "file_test_temp_2",
        name: "data.csv",
        size: 524288,
        contentType: "text/csv",
        ownerKey: "hash123",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600 * 1000), // expiring
        permanent: false,
      },
    ],
    usage: {
      count: 2,
      bytes: 1572864,
      permanentCount: 1,
      expiredCount: 0,
    },
  });

  assert.ok(
    storeHtml.includes('id="valTotalFiles"'),
    "Store must have valTotalFiles counter element",
  );
  assert.ok(
    storeHtml.includes('id="valPermanentFiles"'),
    "Store must have valPermanentFiles counter element",
  );
  assert.ok(
    storeHtml.includes('id="valExpiringFiles"'),
    "Store must have valExpiringFiles counter element",
  );
  assert.ok(
    storeHtml.includes('id="valTotalBytes"'),
    "Store must have valTotalBytes counter element",
  );
  assert.ok(
    storeHtml.includes("togglePermanent"),
    "Store must have togglePermanent script function",
  );
  assert.ok(
    storeHtml.includes("kebab-btn"),
    "Store must render kebab-btn for actions",
  );
  assert.ok(
    storeHtml.includes("kebab-dropdown"),
    "Store must render kebab-dropdown menu",
  );
  assert.ok(
    storeHtml.includes("Revert"),
    "Store must render Revert option in kebab menu",
  );
  assert.ok(
    storeHtml.includes("Keep"),
    "Store must render Keep option in kebab menu",
  );
  assert.ok(
    storeHtml.includes("Copy URL"),
    "Store must render Copy URL in kebab menu",
  );
  assert.ok(
    storeHtml.includes("Download File"),
    "Store must render Download File in kebab menu",
  );

  // 2. Verify API Keys page keeps Master Key confidential, renders Dynamic Keys, and OAuth badge
  const apiHtml = renderApiKeysPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    keys: [
      {
        id: "kx_dynamic_key_1",
        key: "kx_dyn_1234567890",
        label: "Claude Desktop",
        createdAt: 1700000001000,
      },
    ],
    authorizations: [
      {
        clientId: "client_gemini_oauth",
        clientName: "Google Gemini",
        scope: "mcp:tools mcp:sandbox",
        ownerEmail: "owner@quickwitty.com",
        createdAt: 1700000000000,
      },
    ],
  });

  assert.ok(
    apiHtml.includes("Claude Desktop"),
    "API keys page must display dynamic key",
  );
  assert.ok(
    !apiHtml.includes("Primary Key"),
    "Master API key must remain confidential and hidden from normal users",
  );
  assert.ok(
    apiHtml.includes('id="oauthCountBadge"'),
    "API keys page must include oauthCountBadge",
  );
  assert.ok(
    apiHtml.includes("handleCreateKey"),
    "API keys page must declare handleCreateKey",
  );
  assert.ok(
    !apiHtml.includes("copyKeyText('' +"),
    "Must not have syntax errors in template onclick bindings",
  );
});

test("OAuth duplicate deduplication, CSP-compliant connector icons, and asset cache-busting", () => {
  const tmpStatsPath = path.join(
    os.tmpdir(),
    `stats_dedup_${Date.now()}_${Math.random().toString(36).slice(2)}.json`,
  );
  try {
    const stats = new StatsTracker(tmpStatsPath);

    // 1. Simulate legacy requests recorded under oauth:user@example.com
    const geminiClientId = "krix_client_8d8a367412f26f1099faf0a914688628";
    stats.recordRequest({
      keyId: "oauth:imitsankit@gmail.com",
      label: `OAuth (${geminiClientId})`,
      type: "oauth",
      durationMs: 120,
      isError: false,
      statusCode: 200,
      toolName: "sandbox_status",
      isActualTool: true,
      bytesIn: 100,
      bytesOut: 500,
    });

    // Before sync: 1 legacy key exists
    let summary = stats.getSummary();
    assert.equal(summary.keys.length, 1);
    assert.equal(summary.keys[0]?.keyId, "oauth:imitsankit@gmail.com");

    // 2. Run syncKnownKeys with the active OAuth clients
    stats.syncKnownKeys(
      [],
      [
        {
          clientId: geminiClientId,
          clientName: "Google Gemini",
        },
      ],
    );

    // After sync: Deduplicated to 1 consolidated canonical key
    summary = stats.getSummary();
    assert.equal(
      summary.keys.length,
      1,
      "Must consolidate duplicate OAuth keys into 1 row",
    );
    const canonicalKey = summary.keys[0];
    assert.equal(
      canonicalKey?.keyId,
      geminiClientId,
      "Key ID must match canonical OAuth client ID",
    );
    assert.equal(
      canonicalKey?.label,
      "Google Gemini",
      "Label must be 'Google Gemini'",
    );
    assert.equal(
      canonicalKey?.totalRequests,
      1,
      "Must preserve request count from legacy key",
    );
    assert.equal(
      canonicalKey?.toolCalls["sandbox_status"],
      1,
      "Must preserve tool call telemetry",
    );

    // 3. Verify brand icon cache buster ?v=2
    const headerHtml = renderHeader("home", null);
    assert.ok(
      headerHtml.includes("/icon-48.png?v=2"),
      "Header avatar must include ?v=2 cache buster",
    );

    const homeHtml = renderHomePage({
      base: "https://krix.onrender.com",
      isOwner: false,
      owner: null,
      uploads: [],
      dynamicKeys: [],
      activeOAuths: [],
      statsSummary: summary,
    });
    assert.ok(
      homeHtml.includes("/icon-48.png?v=2"),
      "Home page head link must include ?v=2 cache buster",
    );

    // 4. Verify CSP-compliant icon priority
    const icons = getServerIcons("https://krix.onrender.com");
    assert.ok(
      icons[0]?.src.startsWith("https://raw.githubusercontent.com"),
      "Primary icon must use raw.githubusercontent.com for Google CSP compliance on gemini.google.com",
    );
  } finally {
    try {
      if (fs.existsSync(tmpStatsPath)) fs.unlinkSync(tmpStatsPath);
    } catch {}
  }
});

test("404 error page, mobile navigation subnav, OAuth search, eye/copy icons, and deleted keys cleanup", async () => {
  const owner = {
    sub: "test-user-123",
    email: "owner@quickwitty.com",
    name: "ANKIT",
    picture: "https://example.com/pic.png",
  };

  // 1. 404 Not Found Page
  const notFoundHtml = renderNotFoundPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    pathname: "/does-not-exist",
  });
  assert.ok(
    notFoundHtml.includes("404 Error"),
    "404 page must render 404 badge",
  );
  assert.ok(
    notFoundHtml.includes("Page Not Found"),
    "404 page must render Page Not Found heading",
  );
  assert.ok(
    notFoundHtml.includes("/does-not-exist"),
    "404 page must display requested pathname",
  );
  assert.ok(
    notFoundHtml.includes("/home"),
    "404 page must provide Back to Home link",
  );
  assert.ok(
    notFoundHtml.includes("/tools"),
    "404 page must provide Browse Tools link",
  );

  // 2. Mobile-only Horizontally Scrollable Navigation Sub-bar in header
  const headerHtml = renderHeader("upload", owner);
  assert.ok(
    headerHtml.includes("mobile-subnav"),
    "Header must include mobile-subnav element",
  );
  assert.ok(
    headerHtml.includes("mobile-subnav-scroll"),
    "Header must include mobile-subnav-scroll container",
  );
  assert.ok(
    headerHtml.includes("mobile-subnav-pill active"),
    "Active page must have active class in mobile subnav",
  );
  assert.ok(
    headerHtml.includes('href="/home"'),
    "Mobile subnav must link to Home",
  );
  assert.ok(
    headerHtml.includes('href="/upload"'),
    "Mobile subnav must link to Upload",
  );
  assert.ok(
    headerHtml.includes('href="/store"'),
    "Mobile subnav must link to Store",
  );
  assert.ok(
    headerHtml.includes('href="/stats"'),
    "Mobile subnav must link to Stats",
  );
  assert.ok(
    headerHtml.includes('href="/tools"'),
    "Mobile subnav must link to Tools",
  );
  assert.ok(
    headerHtml.includes('href="/api"'),
    "Mobile subnav must link to API Keys",
  );
  assert.ok(
    headerHtml.includes("https://quickwitty.onrender.com"),
    "Mobile subnav must link to Contact",
  );

  // 3. Tools Search Bar: must NOT have prefilled placeholder text
  const emptySummary = {
    totalRequests: 0,
    totalSuccess: 0,
    totalErrors: 0,
    overallSuccessRate: 100,
    avgDurationMs: 0,
    p95DurationMs: 0,
    throughputRpm: 0,
    activeHttpSessions: 0,
    totalBytesIn: 0,
    totalBytesOut: 0,
    uniqueKeysCount: 0,
    keys: [],
    toolDistribution: {},
    protocolDistribution: {},
    dailyTimeline: [],
    weeklyTimeline: [],
    monthlyTimeline: [],
    availableYears: [2026],
    sharedSandbox: { exists: true, totalFiles: 0, totalBytes: 0, root: "" },
    systemHealth: {
      nodeUptimeSec: 100,
      memoryRssMb: 50,
      memoryHeapMb: 30,
      cpuUsagePercent: 1,
    },
    selectedKeyId: undefined,
  };
  const toolsHtml = renderToolsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    tools: [],
    summary: emptySummary as any,
  });
  assert.ok(
    toolsHtml.includes('id="toolSearchInput"'),
    "Tools page must render toolSearchInput",
  );
  assert.ok(
    toolsHtml.includes('placeholder=""'),
    "Tools search input must have empty placeholder",
  );

  // 4. API Keys & OAuth Search, Eye icon, Clipboard copy, and scroll container
  const apiKeysHtml = renderApiKeysPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner,
    keys: [
      {
        id: "dyn_test_key_1",
        label: "Claude Desktop",
        createdAt: Date.now(),
        prefix: "krix_sec_test",
        clientId: "client_123456",
        key: "krix_sec_test_secret_1234567890abcdef",
      } as any,
    ],
    oauthClients: [
      {
        clientId: "krix_client_test_oauth",
        clientName: "Google Gemini",
        scope: "mcp:tools mcp:sandbox",
        createdAt: Date.now(),
      },
    ],
  });
  assert.ok(
    apiKeysHtml.includes("key-display-scroll"),
    "API keys must have scrollable container to prevent overflow",
  );
  assert.ok(
    apiKeysHtml.includes("toggleKeyReveal"),
    "API keys must have toggleKeyReveal function",
  );
  assert.ok(
    apiKeysHtml.includes("oauthSearchInput"),
    "OAuth authorizations must include search bar",
  );
  assert.ok(
    apiKeysHtml.includes("filterOAuth"),
    "OAuth search must have filterOAuth function",
  );

  // 5. Upload Page Redesign: Keep switch, removed unwanted texts
  const uploadHtml = renderUploadPage("nonce-test", {
    ttlMinutes: 60,
    retentionMinutes: 1440,
    maxFileMb: 25,
    maxTotalMb: 100,
    maxFiles: 20,
    folder: "upload",
    owner,
  });
  assert.ok(
    uploadHtml.includes(">Keep<"),
    "Upload page switch must be named Keep",
  );
  assert.ok(
    !uploadHtml.includes(">Permanent Storage<"),
    "Upload page must not have visible Permanent Storage label",
  );
  assert.ok(
    !uploadHtml.includes("Exempt uploaded files from 24h auto-cleanup"),
    "Upload page must remove exemption text beneath Keep",
  );
  assert.ok(
    !uploadHtml.includes("Files are saved in your sandbox at upload"),
    "Upload page must remove sandbox path info text",
  );

  // 6. Pruning deleted keys in StatsTracker
  const tmpStatsPath = path.join(
    os.tmpdir(),
    `krix_stats_prune_${Date.now()}.json`,
  );
  const tracker = new StatsTracker(tmpStatsPath);
  try {
    tracker.syncKnownKeys(
      [
        { id: "key_active_1", label: "Active Key 1" },
        { id: "key_to_delete_2", label: "Key To Delete" },
      ],
      [{ clientId: "oauth_client_1", clientName: "Gemini" }],
    );

    let summary = tracker.getSummary();
    assert.equal(summary.keys.length, 3, "Must have 3 keys initially");

    // Remove key_to_delete_2
    tracker.removeKey("key_to_delete_2");
    summary = tracker.getSummary();
    assert.equal(
      summary.keys.find((k) => k.keyId === "key_to_delete_2"),
      undefined,
      "Deleted key must be removed from stats",
    );

    // Sync without key_to_delete_2 and verify persistence
    tracker.syncKnownKeys(
      [{ id: "key_active_1", label: "Active Key 1" }],
      [{ clientId: "oauth_client_1", clientName: "Gemini" }],
    );
    summary = tracker.getSummary();
    assert.equal(summary.keys.length, 2, "Only active keys must remain");
  } finally {
    try {
      if (fs.existsSync(tmpStatsPath)) fs.unlinkSync(tmpStatsPath);
    } catch {}
  }
});

test("Exact page titles, 10-day slider, error/working graph, store privacy, and unguessable token", async () => {
  const { fileShareRegistry } = await import("../src/fileShareRegistry.js");
  const {
    renderToolsPage,
    renderStatsPage,
    renderNotFoundPage,
    renderUploadPage,
  } = await import("../src/views.js");

  // 1. Verify exact page titles
  const toolsHtml = renderToolsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner: { name: "Ankit", email: "ankit@example.com" },
    tools: [],
    summary: { toolsCatalog: [] } as any,
  });
  assert.ok(
    toolsHtml.includes("<title>Tools</title>"),
    "Tools title must be exact",
  );

  const statsHtml = renderStatsPage({
    base: "https://krix.onrender.com",
    isOwner: true,
    owner: { name: "Ankit", email: "ankit@example.com" },
    summary: {
      totalRequests: 10,
      overallSuccessRate: 90,
      totalErrors: 1,
      throughputRpm: 5,
      activeHttpSessions: 1,
      avgDurationMs: 12,
      p95DurationMs: 25,
      systemHealth: {
        uptimeSec: 100,
        heapUsedMb: 50,
        heapTotalMb: 100,
        rssMb: 70,
        platform: "linux",
      },
      peakTraffic: { peakHourUtc: null, peakDay: null },
      statusCodes: { "200": 9, "500": 1 },
      clientEcosystems: {},
      toolDistribution: {},
      sharedSandbox: {
        totalDiskBytes: 1024,
        quotaUsedPercent: 1,
        uploadFileCount: 1,
        uploadBytes: 1024,
        activeWorkDirs: 1,
      },
      dailyTimeline: [
        { date: "2026-11-06", requests: 5, tools: 2, errors: 0, success: 5 },
        { date: "2026-11-07", requests: 5, tools: 2, errors: 1, success: 4 },
      ],
      weeklyTimeline: [],
      monthlyTimeline: [],
      availableYears: ["2026"],
      keys: [],
      toolsCatalog: [],
    } as any,
  });
  assert.ok(
    statsHtml.includes("<title>Stats</title>"),
    "Stats title must be exact",
  );
  assert.ok(
    statsHtml.includes("statsKeySearchInput"),
    "Stats must render Per-Key breakdown search input",
  );
  assert.ok(
    statsHtml.includes("dailyChunkNav"),
    "Stats must render 10-day desktop chunk navigation",
  );
  assert.ok(
    statsHtml.includes("btnPrevDailyChunk"),
    "Stats must render Prev 10d button",
  );
  assert.ok(
    statsHtml.includes("btnNextDailyChunk"),
    "Stats must render Next 10d button",
  );

  const notFoundHtml = renderNotFoundPage({
    base: "https://krix.onrender.com",
    isOwner: false,
    owner: null,
    pathname: "/does-not-exist",
  });
  assert.ok(
    notFoundHtml.includes("<title>404 Not Found</title>"),
    "404 title must be exact",
  );

  // 2. Verify Unguessable 64-char crypto sharing token and privacy toggle
  const meta = fileShareRegistry.ensureFileShare({
    fileId: "test_file_123",
    name: "dataset.csv",
    source: "store",
    contentType: "text/csv",
  });
  assert.equal(meta.shareToken.length, 64, "Share token must be 64-char hex");
  assert.equal(
    /^[0-9a-f]{64}$/.test(meta.shareToken),
    true,
    "Share token must be cryptographic hex",
  );
  assert.equal(meta.isPublic, true, "Default privacy must be public");

  const toggledFalse = fileShareRegistry.togglePrivacy("test_file_123", false);
  assert.equal(toggledFalse, false, "Must toggle privacy to false");
  const fetched = fileShareRegistry.getByToken(meta.shareToken);
  assert.ok(fetched, "Must retrieve share by 64-char token");
  assert.equal(fetched.isPublic, false, "Must reflect updated private state");

  const toggledTrue = fileShareRegistry.togglePrivacy("test_file_123", true);
  assert.equal(toggledTrue, true, "Must toggle privacy back to true");
});
