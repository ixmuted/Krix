import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import crypto from "node:crypto";
import express from "express";
import {
  getUserQuota,
  getUserRole,
  isOwnerEmail,
  getOwnerEmail,
  maskSecret,
  generateSandboxId,
  getOrCreateUser,
  getKeySettings,
  updateKeyCredentials,
  toggleKeyTool,
  updateKeyTools,
  isToolEnabledForKey,
  type UserRole,
} from "../src/userSettings.js";
import {
  CODE_GRAPH_TOOLS_CATALOG,
  CODE_GRAPH_TOOL_NAMES,
  registerCodeGraphTools,
} from "../src/codeGraphTools.js";
import { statsTracker } from "../src/stats.js";
import {
  createDynamicKey,
  listDynamicKeys,
  createGoogleAuthRouter,
} from "../src/googleAuth.js";
import {
  sandboxRootPath,
  registerSessionSandboxId,
  getSandboxIdForSession,
  TOOL_CATEGORY,
  getToolCredentialRequirement,
  getMissingToolCredential,
} from "../src/security.js";
import { renderSettingsPage } from "../src/views.js";

describe("Multi-User Architecture, Quotas, Settings & Code Graph Tools", () => {
  const OWNER_EMAIL = "admin@krix.test";
  const USER_EMAIL = "developer@krix.test";
  const OTHER_EMAIL = "other@krix.test";

  before(() => {
    process.env.OWNER_EMAIL = OWNER_EMAIL;
    process.env.SESSION_SECRET = "krix-test-secret-32-chars-long-123456";
    process.env.KEY_ENCRYPTION_SECRET =
      "krix-test-encryption-secret-32-bytes-ok";
  });

  describe("0. Credential-aware tool availability", () => {
    test("GitHub API tools require a GitHub token", () => {
      assert.equal(getToolCredentialRequirement("get_file_contents"), "github");
      assert.equal(getToolCredentialRequirement("list_issues"), "github");
      assert.equal(getToolCredentialRequirement("create_branch"), "github");
      assert.equal(
        getMissingToolCredential("get_file_contents", { github: false }),
        "github",
      );
      assert.equal(
        getMissingToolCredential("get_file_contents", { github: true }),
        null,
      );
    });

    test("Render tools require a Render API key", () => {
      assert.equal(getToolCredentialRequirement("list_services"), "render");
      assert.equal(
        getMissingToolCredential("list_services", { render: false }),
        "render",
      );
      assert.equal(
        getMissingToolCredential("list_services", { render: true }),
        null,
      );
    });

    test("local sandbox tools remain available without GitHub credentials", () => {
      for (const name of [
        "sandbox_exec",
        "sandbox_run",
        "sandbox_install",
        "sandbox_ps",
        "sandbox_status",
        "sandbox_file",
        "sandbox_store",
        "git_status",
        "git_diff",
      ]) {
        assert.equal(
          getToolCredentialRequirement(name),
          null,
          `${name} should not require a GitHub PAT`,
        );
      }
    });

    test("sandbox remote Git operations require a GitHub token", () => {
      for (const name of [
        "git_clone",
        "git_checkout",
        "git_pull",
        "git_commit_push",
      ]) {
        assert.equal(
          getToolCredentialRequirement(name),
          "github",
          `${name} should require a GitHub PAT`,
        );
      }
    });

    test("context selection and sandbox status remain credential-free", () => {
      assert.equal(getToolCredentialRequirement("set_active_context"), null);
      assert.equal(getToolCredentialRequirement("sandbox_status"), null);
    });
  });

  describe("1. Multi-User Role & Quota Distribution", () => {
    test("isOwnerEmail correctly recognizes owner and non-owners", () => {
      assert.equal(isOwnerEmail(OWNER_EMAIL), true);
      assert.equal(isOwnerEmail("ADMIN@KRIX.TEST"), true);
      assert.equal(isOwnerEmail(USER_EMAIL), false);
      assert.equal(isOwnerEmail(""), false);
      assert.equal(isOwnerEmail(null), false);
    });

    test("getUserRole returns 'owner' for owner and 'user' for others", () => {
      assert.equal(getUserRole(OWNER_EMAIL), "owner");
      assert.equal(getUserRole(USER_EMAIL), "user");
      assert.equal(getUserRole("random@test.org"), "user");
    });

    test("Owner quota maintains standard full resources", () => {
      const ownerQuota = getUserQuota("owner");
      assert.equal(ownerQuota.role, "owner");
      assert.equal(ownerQuota.storageMb, 300);
      assert.equal(ownerQuota.maxFileMb, 25);
      assert.equal(ownerQuota.maxTotalMb, 100);
      assert.equal(ownerQuota.downloadMaxMb, 50);
      assert.equal(ownerQuota.maxOutputBytes, 4 * 1024 * 1024); // 4MB
      assert.equal(ownerQuota.ulimitProc, 2048);
      assert.equal(ownerQuota.ulimitFile, 1048576);
      assert.equal(ownerQuota.rateLimitPerMin, 600);
    });

    test("Non-owner receives 50MB storage and 1/10th of compute/RAM/process limits", () => {
      const userQuota = getUserQuota("user");
      assert.equal(userQuota.role, "user");
      assert.equal(userQuota.storageMb, 50); // 50MB distributed storage
      assert.equal(userQuota.maxFileMb, 2.5); // 1/10th of 25MB
      assert.equal(userQuota.maxTotalMb, 10); // 1/10th of 100MB
      assert.equal(userQuota.downloadMaxMb, 5); // 1/10th of 50MB
      assert.equal(userQuota.maxOutputBytes, 400 * 1024); // 1/10th of 4MB (400KB)
      assert.equal(userQuota.ulimitProc, 204); // 1/10th of 2048
      assert.equal(userQuota.ulimitFile, 104857); // 1/10th of 1048576
      assert.equal(userQuota.rateLimitPerMin, 60); // 1/10th of 600
    });

    test("getOrCreateUser registers accounts with persistent role", () => {
      const ownerAcc = getOrCreateUser(OWNER_EMAIL);
      assert.equal(ownerAcc.email, OWNER_EMAIL);
      assert.equal(ownerAcc.role, "owner");

      const userAcc = getOrCreateUser(USER_EMAIL);
      assert.equal(userAcc.email, USER_EMAIL);
      assert.equal(userAcc.role, "user");
    });
  });

  describe("2. Sandbox Isolation Per User / Per Key", () => {
    test("generateSandboxId returns 'owner' for master key and isolated ids for user keys", () => {
      assert.equal(generateSandboxId("primary-key", true), "owner");
      assert.equal(
        generateSandboxId("kx_alpha_123", false),
        "sbx_kx_alpha_123",
      );
      assert.equal(generateSandboxId("kx_beta_456", false), "sbx_kx_beta_456");
      assert.notEqual(
        generateSandboxId("kx_alpha_123", false),
        generateSandboxId("kx_beta_456", false),
      );
    });

    test("sandboxRootPath isolates paths based on registered session sandboxId", () => {
      const sessionOwner = "sess_owner_" + crypto.randomUUID();
      const sessionUser1 = "sess_user1_" + crypto.randomUUID();
      const sessionUser2 = "sess_user2_" + crypto.randomUUID();

      registerSessionSandboxId(sessionOwner, "owner");
      registerSessionSandboxId(sessionUser1, "sbx_key_1");
      registerSessionSandboxId(sessionUser2, "sbx_key_2");

      assert.equal(getSandboxIdForSession(sessionOwner), "owner");
      assert.equal(getSandboxIdForSession(sessionUser1), "sbx_key_1");
      assert.equal(getSandboxIdForSession(sessionUser2), "sbx_key_2");

      const rootOwner = sandboxRootPath(sessionOwner);
      const rootUser1 = sandboxRootPath(sessionUser1);
      const rootUser2 = sandboxRootPath(sessionUser2);

      assert.ok(rootOwner.includes("krix_sbx_owner"));
      assert.ok(rootUser1.includes("krix_sbx_sbx_key_1"));
      assert.ok(rootUser2.includes("krix_sbx_sbx_key_2"));
      assert.notEqual(rootUser1, rootUser2);
      assert.notEqual(rootUser1, rootOwner);
    });
  });

  describe("3. Secret Masking & Key Credential Management", () => {
    test("maskSecret masks tokens showing only first 4 and last 4 characters", () => {
      assert.equal(maskSecret(""), "");
      assert.equal(maskSecret(undefined), "");
      assert.equal(maskSecret("short"), "••••••••");
      assert.equal(maskSecret("ghp_1234567890abcdef"), "ghp_••••••••cdef");
      assert.equal(maskSecret("rnd_abcdef1234567890"), "rnd_••••••••7890");
    });

    test("updateKeyCredentials updates and persists tokens per key", () => {
      const testKeyId = "test_key_" + crypto.randomBytes(4).toString("hex");
      const ghToken = "ghp_mockSecretTokenForTesting1234";
      const rndToken = "rnd_mockRenderTokenForTesting5678";

      const updated = updateKeyCredentials(
        testKeyId,
        USER_EMAIL,
        ghToken,
        rndToken,
      );

      assert.equal(updated.keyId, testKeyId);
      assert.equal(updated.email, USER_EMAIL);
      assert.equal(updated.customGitHubToken, ghToken);
      assert.equal(updated.customRenderToken, rndToken);

      // Verify in-memory retrieval
      const retrieved = getKeySettings(testKeyId);
      assert.equal(retrieved.customGitHubToken, ghToken);
      assert.equal(retrieved.customRenderToken, rndToken);
    });
  });

  describe("4. Code Graph Context Tools & Default-Disabled Policy", () => {
    test("All 29 Code Graph tools + 1 web_search tool are cataloged (30 tools total)", () => {
      assert.equal(CODE_GRAPH_TOOLS_CATALOG.length, 30);
      assert.equal(CODE_GRAPH_TOOL_NAMES.length, 30);

      // Verify essential code graph tools
      assert.ok(CODE_GRAPH_TOOL_NAMES.includes("find_code"));
      assert.ok(CODE_GRAPH_TOOL_NAMES.includes("analyze_code_relationships"));
      assert.ok(CODE_GRAPH_TOOL_NAMES.includes("execute_cypher_query"));
      assert.ok(
        CODE_GRAPH_TOOL_NAMES.includes("calculate_cyclomatic_complexity"),
      );
      assert.ok(CODE_GRAPH_TOOL_NAMES.includes("find_dead_code"));
      assert.ok(CODE_GRAPH_TOOL_NAMES.includes("web_search"));

      // Verify all tools are mapped to 'codegraph' category in security
      for (const name of CODE_GRAPH_TOOL_NAMES) {
        assert.equal(TOOL_CATEGORY[name], "codegraph");
      }
    });

    test("Total tools catalog in statsTracker includes all 117 tools", () => {
      const summary = statsTracker.getSummary("/tmp");
      assert.equal(summary.toolsCatalog.length, 117);
      const codeGraphTools = summary.toolsCatalog.filter(
        (t) => t.category === "Code Graph" || t.category === "Search",
      );
      assert.equal(codeGraphTools.length, 30);
    });

    test("Code Graph and Search tools are strictly DISABLED BY DEFAULT", () => {
      const testKeyId = "test_key_cg_" + crypto.randomBytes(4).toString("hex");
      const sessionCategories = new Set([
        "core",
        "sandbox",
        "files",
        "codegraph",
      ]);

      // By default, code graph tools return false
      assert.equal(
        isToolEnabledForKey(
          testKeyId,
          "find_code",
          "codegraph",
          sessionCategories,
        ),
        false,
      );
      assert.equal(
        isToolEnabledForKey(
          testKeyId,
          "execute_cypher_query",
          "codegraph",
          sessionCategories,
        ),
        false,
      );
      assert.equal(
        isToolEnabledForKey(
          testKeyId,
          "web_search",
          "search",
          sessionCategories,
        ),
        false,
      );

      // Regular sandbox tool is enabled
      assert.equal(
        isToolEnabledForKey(
          testKeyId,
          "sandbox_run",
          "sandbox",
          sessionCategories,
        ),
        true,
      );
    });

    test("Users can specifically enable selected Code Graph tools for their key", () => {
      const testKeyId =
        "test_key_toggle_" + crypto.randomBytes(4).toString("hex");
      const sessionCategories = new Set([
        "core",
        "sandbox",
        "files",
        "codegraph",
      ]);

      // Explicitly enable 'find_code'
      toggleKeyTool(testKeyId, "find_code", true);

      // find_code is now enabled
      assert.equal(
        isToolEnabledForKey(
          testKeyId,
          "find_code",
          "codegraph",
          sessionCategories,
        ),
        true,
      );

      // Other code graph tools remain disabled
      assert.equal(
        isToolEnabledForKey(
          testKeyId,
          "execute_cypher_query",
          "codegraph",
          sessionCategories,
        ),
        false,
      );
      assert.equal(
        isToolEnabledForKey(
          testKeyId,
          "web_search",
          "search",
          sessionCategories,
        ),
        false,
      );

      // Disable 'find_code' again
      toggleKeyTool(testKeyId, "find_code", false);
      assert.equal(
        isToolEnabledForKey(
          testKeyId,
          "find_code",
          "codegraph",
          sessionCategories,
        ),
        false,
      );
    });
  });

  describe("5. Settings Page Rendering & Multi-User Filtering", () => {
    test("renderSettingsPage displays 50MB quota card for non-owners", () => {
      const userQuota = getUserQuota("user");
      const keySettings = getKeySettings("user-key-1");

      const html = renderSettingsPage({
        base: "https://krix.onrender.com",
        isOwner: false,
        owner: {
          email: USER_EMAIL,
          name: "Developer",
          expiresAt: Date.now() + 86400000,
          role: "user",
        },
        keys: [
          {
            id: "user-key-1",
            label: "Developer Key",
            prefix: "krix_key_user1",
            role: "user",
            email: USER_EMAIL,
          },
        ],
        selectedKeyId: "user-key-1",
        keySettings,
        toolsCatalog: statsTracker.getSummary("/tmp").toolsCatalog,
        userQuota,
      });

      assert.ok(html.includes("50 MB"), "Must show 50MB storage quota");
      assert.ok(
        html.includes("Standard Member (1/10th Limits)"),
        "Must show member role badge",
      );
      assert.ok(html.includes("2.5 MB"), "Must show 1/10th file limit");
      assert.ok(html.includes("Per file limit"), "Must show file limit label");
      assert.ok(
        html.includes("400 KB max output"),
        "Must show 1/10th buffer limit",
      );
      assert.ok(html.includes("204 PIDs"), "Must show 1/10th ulimit proc");
      assert.ok(
        !html.includes("Code Graph Context (29 tools)") &&
          !html.includes("Deep structural AST inspection"),
        "Code Graph Context banner must be removed from tool permissions",
      );
      assert.ok(
        html.includes(">Tool Permissions<"),
        "Must include tool permission manager",
      );
    });

    test("renderSettingsPage displays 300MB quota for owner", () => {
      const ownerQuota = getUserQuota("owner");
      const keySettings = getKeySettings("primary-key");

      const html = renderSettingsPage({
        base: "https://krix.onrender.com",
        isOwner: true,
        owner: {
          email: OWNER_EMAIL,
          name: "Admin",
          expiresAt: Date.now() + 86400000,
          role: "owner",
        },
        keys: [
          {
            id: "primary-key",
            label: "Primary Master Key",
            prefix: "MCP_API_KEY",
            role: "owner",
            email: OWNER_EMAIL,
          },
        ],
        selectedKeyId: "primary-key",
        keySettings,
        toolsCatalog: statsTracker.getSummary("/tmp").toolsCatalog,
        userQuota: ownerQuota,
      });

      assert.ok(html.includes("300 MB"), "Owner receives 300MB storage");
      assert.ok(html.includes("Server Owner"), "Owner badge displayed");
      assert.ok(html.includes("2048 PIDs"), "Owner receives full ulimit PIDs");
    });

    test("listDynamicKeys filters keys so non-owners only see their own keys", () => {
      const rand = crypto.randomBytes(4).toString("hex");
      // Create a key for user1 and a key for user2
      const key1 = createDynamicKey("User 1 Key " + rand, USER_EMAIL);
      const key2 = createDynamicKey("User 2 Key " + rand, OTHER_EMAIL);

      const user1Keys = listDynamicKeys(USER_EMAIL);
      assert.ok(user1Keys.some((k) => k.id === key1.id));
      assert.ok(
        !user1Keys.some((k) => k.id === key2.id),
        "User 1 must not see User 2's key",
      );

      // Owner sees all keys
      const ownerKeys = listDynamicKeys(OWNER_EMAIL);
      assert.ok(ownerKeys.some((k) => k.id === key1.id));
      assert.ok(ownerKeys.some((k) => k.id === key2.id));
    });
  });

  describe("6. Settings Endpoints & Security Access Control", () => {
    let server: http.Server;
    let base = "";

    function makeSessionCookie(email: string, role?: "owner" | "user"): string {
      const payload = Buffer.from(
        JSON.stringify({
          email,
          name: email.split("@")[0],
          expiresAt: Date.now() + 3600000,
          role: role || (isOwnerEmail(email) ? "owner" : "user"),
        }),
      ).toString("base64url");
      const hmac = crypto
        .createHmac("sha256", process.env.SESSION_SECRET!)
        .update(payload)
        .digest("base64url");
      return `krix_session=${payload}.${hmac}`;
    }

    before(async () => {
      const app = express();
      app.use(express.json());

      // Helper function matching index.ts
      function userOwnsKey(email: string, keyId: string): boolean {
        if (isOwnerEmail(email)) return true;
        if (keyId === "primary-key") return false;
        const userKeys = listDynamicKeys(email);
        if (userKeys.some((k) => k.id === keyId)) return true;
        return false;
      }

      app.post("/settings/api/credentials", (req, res) => {
        const cookie = req.headers.cookie;
        if (!cookie) {
          res.status(401).json({ ok: false, error: "Unauthorized" });
          return;
        }
        const match = cookie.match(/krix_session=([^;]+)/);
        if (!match) {
          res.status(401).json({ ok: false, error: "Unauthorized" });
          return;
        }
        const [payload, sig] = match[1].split(".");
        const expected = crypto
          .createHmac("sha256", process.env.SESSION_SECRET!)
          .update(payload)
          .digest("base64url");
        if (sig !== expected) {
          res.status(401).json({ ok: false, error: "Unauthorized" });
          return;
        }
        const user = JSON.parse(Buffer.from(payload, "base64url").toString());
        const { keyId, githubToken, renderToken } = req.body || {};

        if (!userOwnsKey(user.email, keyId)) {
          res
            .status(403)
            .json({ ok: false, error: "Forbidden: Cannot edit this key" });
          return;
        }

        const updated = updateKeyCredentials(
          keyId,
          user.email,
          githubToken,
          renderToken,
        );
        res.json({
          ok: true,
          maskedGitHub: maskSecret(updated.customGitHubToken),
          maskedRender: maskSecret(updated.customRenderToken),
        });
      });

      app.post("/settings/api/tool-toggle", (req, res) => {
        const cookie = req.headers.cookie;
        if (!cookie) {
          res.status(401).json({ ok: false, error: "Unauthorized" });
          return;
        }
        const match = cookie.match(/krix_session=([^;]+)/);
        if (!match) {
          res.status(401).json({ ok: false, error: "Unauthorized" });
          return;
        }
        const [payload, sig] = match[1].split(".");
        const expected = crypto
          .createHmac("sha256", process.env.SESSION_SECRET!)
          .update(payload)
          .digest("base64url");
        if (sig !== expected) {
          res.status(401).json({ ok: false, error: "Unauthorized" });
          return;
        }
        const user = JSON.parse(Buffer.from(payload, "base64url").toString());
        const { keyId, toolName, enabled } = req.body || {};

        if (!userOwnsKey(user.email, keyId)) {
          res.status(403).json({ ok: false, error: "Forbidden" });
          return;
        }

        const updated = toggleKeyTool(keyId, toolName, Boolean(enabled));
        res.json({
          ok: true,
          enabledTools: updated.enabledTools,
          disabledTools: updated.disabledTools,
        });
      });

      server = await new Promise<http.Server>((r) => {
        const s = app.listen(0, "127.0.0.1", () => r(s));
      });
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    after(async () => {
      await new Promise<void>((r) => server.close(() => r()));
    });

    test("Unauthenticated requests to settings API return 401", async () => {
      const res = await fetch(`${base}/settings/api/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: "some-key" }),
      });
      assert.equal(res.status, 401);
    });

    test("Non-owner user cannot modify Primary Master Key (403 Forbidden)", async () => {
      const userCookie = makeSessionCookie(USER_EMAIL, "user");
      const res = await fetch(`${base}/settings/api/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: userCookie,
        },
        body: JSON.stringify({
          keyId: "primary-key",
          githubToken: "ghp_hackerAttempt12345678",
        }),
      });
      assert.equal(res.status, 403);
    });

    test("User can successfully save their custom GitHub & Render credentials", async () => {
      const rand = crypto.randomBytes(4).toString("hex");
      const userKey = createDynamicKey("User Endpoint Key " + rand, USER_EMAIL);
      const userCookie = makeSessionCookie(USER_EMAIL, "user");

      const res = await fetch(`${base}/settings/api/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: userCookie,
        },
        body: JSON.stringify({
          keyId: userKey.id,
          githubToken: "ghp_myPersonalGitHubTokenForTesting",
          renderToken: "rnd_myPersonalRenderTokenForTesting",
        }),
      });

      assert.equal(res.status, 200);
      const data = (await res.json()) as any;
      assert.equal(data.ok, true);
      assert.equal(data.maskedGitHub, "ghp_••••••••ting");
      assert.equal(data.maskedRender, "rnd_••••••••ting");

      // Verify stored settings
      const settings = getKeySettings(userKey.id);
      assert.equal(
        settings.customGitHubToken,
        "ghp_myPersonalGitHubTokenForTesting",
      );
      assert.equal(
        settings.customRenderToken,
        "rnd_myPersonalRenderTokenForTesting",
      );
    });

    test("User can toggle specific Code Graph tool on and off via API", async () => {
      const rand = crypto.randomBytes(4).toString("hex");
      const userKey = createDynamicKey("User Toggle Key " + rand, USER_EMAIL);
      const userCookie = makeSessionCookie(USER_EMAIL, "user");

      // Enable find_code
      const res1 = await fetch(`${base}/settings/api/tool-toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: userCookie,
        },
        body: JSON.stringify({
          keyId: userKey.id,
          toolName: "find_code",
          enabled: true,
        }),
      });
      assert.equal(res1.status, 200);
      const data1 = (await res1.json()) as any;
      assert.ok(data1.enabledTools.includes("find_code"));

      // Disable find_code
      const res2 = await fetch(`${base}/settings/api/tool-toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: userCookie,
        },
        body: JSON.stringify({
          keyId: userKey.id,
          toolName: "find_code",
          enabled: false,
        }),
      });
      assert.equal(res2.status, 200);
      const data2 = (await res2.json()) as any;
      assert.ok(data2.disabledTools.includes("find_code"));
    });
  });
});
