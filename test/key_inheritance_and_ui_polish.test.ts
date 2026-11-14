import test, { describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.NODE_ENV = "test";
process.env.MCP_API_KEY =
  process.env.MCP_API_KEY || "krix-test-master-key-0123456789-abcdef";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || "krix-test-session-secret-32-chars-long";

import { getKeySettings, updateKeyCredentials } from "../src/userSettings.js";
import { createDynamicKey, revokeDynamicKey } from "../src/googleAuth.js";
import { renderToolsPage } from "../src/website/pages/tools.js";
import { renderStatsPage } from "../src/website/pages/stats.js";
import { renderApiKeysPage } from "../src/website/pages/apiKeys.js";
import { renderApiKeySettingsPage } from "../src/website/pages/apiKeySettings.js";
import { renderSettingsPage } from "../src/website/pages/settings.js";
import { renderOAuthConsentPage } from "../src/website/pages/oauthConsent.js";
import { getAppLogoSvg } from "../src/website/icons.js";

describe("New Features & UI Polish Verification", () => {
  test("1. New dynamic API key inherits global default tool categories and access", () => {
    const primary = getKeySettings("primary-key");
    assert.ok(primary, "Primary key settings must exist");

    const rand = crypto.randomBytes(4).toString("hex");
    const dynamicKey = createDynamicKey(
      "Inherit Test Key " + rand,
      "user@example.com",
    );
    try {
      const dynamicSettings = getKeySettings(dynamicKey.id);
      assert.ok(dynamicSettings, "Dynamic key settings must exist");

      // Check inheritance of categories
      assert.deepEqual(
        dynamicSettings.enabledCategories,
        primary.enabledCategories,
        "New key should inherit primary key enabled categories",
      );
    } finally {
      revokeDynamicKey(dynamicKey.id);
    }
  });

  test("2. Tools directory and Stats page allow logged in non-owner users", () => {
    const loggedInUser = {
      email: "regular_user@example.com",
      name: "Regular User",
    };

    // When logged in as non-owner (isOwner: false, but owner object provided)
    const toolsHtml = renderToolsPage({
      base: "http://localhost:3000",
      isOwner: false,
      owner: loggedInUser,
      tools: [
        { name: "test_tool", category: "Sandbox", description: "A test tool" },
      ],
    });
    assert.ok(
      !toolsHtml.includes("Please sign in with your authorized Google Account"),
      "Logged-in user must not see the sign-in prompt on tools page",
    );
    assert.ok(
      toolsHtml.includes("Tools Directory"),
      "Logged-in user should see the Tools Directory",
    );

    const statsHtml = renderStatsPage({
      base: "http://localhost:3000",
      isOwner: false,
      owner: loggedInUser,
      summary: { totalRequests: 5 },
    });
    assert.ok(
      !statsHtml.includes("Please sign in with your authorized Google Account"),
      "Logged-in user must not see the sign-in prompt on stats page",
    );
    assert.ok(
      statsHtml.includes("TELEMETRY &amp; USAGE ANALYTICS") ||
        statsHtml.includes("Telemetry &amp; Usage Analytics") ||
        statsHtml.includes("Stats"),
      "Logged-in user should see the Stats dashboard",
    );

    // When NOT logged in (both isOwner: false and owner: null)
    const unauthedToolsHtml = renderToolsPage({
      base: "http://localhost:3000",
      isOwner: false,
      owner: null,
      tools: [],
    });
    assert.ok(
      unauthedToolsHtml.includes(
        "Please sign in with your authorized Google Account",
      ),
      "Unauthenticated visitor must see the sign in prompt on tools page",
    );
  });

  test("3. Active OAuth authorizations search bar is 260px matching API keys search bar", () => {
    const html = renderApiKeysPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { email: "owner@example.com" },
      keys: [],
      oauthAuthorizations: [
        {
          clientId: "client_test_1",
          clientName: "Google Gemini Desktop",
          scopes: ["mcp:tools"],
          ownerEmail: "owner@example.com",
          createdAt: Date.now(),
        },
      ],
    });

    // Both search bars should have width:260px and max-width:100%
    assert.ok(
      html.includes('id="oauthSearchInput"'),
      "Must contain oauthSearchInput",
    );
    assert.ok(
      html.includes("width:260px; max-width:100%") ||
        html.includes("width:260px;max-width:100%"),
      "Active OAuth search bar must have 260px width matching API keys search bar",
    );
  });

  test("4. getAppLogoSvg renders Google Favicon proxy with clean fallback without broken image", () => {
    // Check known client
    const geminiLogo = getAppLogoSvg("Google Gemini Desktop", 18);
    assert.ok(
      geminiLogo.includes("google.com/s2/favicons"),
      "Must pull favicon via Google favicon proxy",
    );
    assert.ok(
      geminiLogo.includes("onerror="),
      "Must include onerror fallback handler",
    );
    assert.ok(
      geminiLogo.includes("app-logo-fallback"),
      "Must include SVG fallback container",
    );

    // Check fallback for unknown client
    const unknownLogo = getAppLogoSvg("UnknownCustomBot", 18);
    assert.ok(
      unknownLogo.includes("app-logo-fallback") && unknownLogo.includes("<svg"),
      "Unknown client must cleanly render fallback SVG without broken image",
    );
  });

  test("5. renderOAuthConsentPage includes client logo, peer handshake, and Privacy/Terms buttons", () => {
    const html = renderOAuthConsentPage({
      clientId: "gemini_desktop",
      clientName: "Google Gemini Desktop",
      redirectUri: "https://gemini.google.com/oauth/callback",
      scope: "mcp:tools mcp:sandbox",
      state: "xyz",
      codeChallenge: "challenge_123",
      codeChallengeMethod: "S256",
      owner: { name: "Ankit", email: "owner@quickwitty.com" },
      nonce: "mock_nonce",
    });

    assert.ok(
      html.includes("Authorize Connection"),
      "Must include Authorize Connection",
    );
    assert.ok(
      html.includes("Google Gemini Desktop"),
      "Must display client name",
    );
    assert.ok(html.includes("handshake-beam"), "Must feature handshake beam");
    assert.ok(html.includes("/icon-48.png?v=2"), "Must feature anime avatar");
    assert.ok(
      html.includes("/privacy"),
      "Must include Privacy Policy button/link",
    );
    assert.ok(
      html.includes("/terms"),
      "Must include Terms of Service button/link",
    );
    assert.ok(html.includes("Privacy Policy"), "Must have Privacy Policy text");
    assert.ok(
      html.includes("Terms of Service"),
      "Must have Terms of Service text",
    );
  });

  test("6. Settings page Danger Zone includes Reset Tool Permissions title and description", () => {
    const html = renderSettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { email: "owner@example.com" },
      keys: [{ id: "primary-key", name: "Primary Master Key" }],
      selectedKeyId: "primary-key",
      keySettings: getKeySettings("primary-key"),
      credentialAvailability: { github: true, render: true },
      toolsCatalog: [],
      userQuota: {
        role: "owner",
        storageMb: 300,
        maxFileMb: 25,
        maxTotalMb: 100,
        downloadMaxMb: 50,
        maxOutputBytes: 4194304,
        ulimitProc: 2048,
        ulimitFile: 1048576,
        rateLimitPerMin: 600,
      },
    });

    assert.ok(
      html.includes("Reset Tool Permissions"),
      "Must include Reset Tool Permissions header",
    );
    assert.ok(
      html.includes(
        "Reset all tool access overrides to their default permissions.",
      ),
      "Must include descriptive text explaining what Reset Tools does",
    );
    assert.ok(
      html.includes("resetToolDefaults()"),
      "Must retain resetToolDefaults button action",
    );
  });

  test("7. API key settings page displays 'Not configured (inherits workspace ...)' for empty credentials", () => {
    const html = renderApiKeySettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { email: "owner@example.com" },
      key: { id: "test_key_unconf", name: "Test Key" },
      toolsCatalog: [],
      keySettings: {
        keyId: "test_key_unconf",
        email: "owner@example.com",
        role: "owner",
        sandboxId: "sandbox_unconf",
        enabledTools: [],
        disabledTools: [],
        enabledCategories: ["core"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      apiKeyToken: "krix_test_unconf_1234",
      credentialAvailability: { github: true, render: true },
    });

    assert.ok(
      html.includes("Not configured (inherits workspace token)"),
      "Must show 'Not configured (inherits workspace token)' when custom GitHub token is empty",
    );
    assert.ok(
      html.includes("Not configured (inherits workspace key)"),
      "Must show 'Not configured (inherits workspace key)' when custom Render key is empty",
    );
  });

  test("8. Dynamic tool configuration allows toggling when global workspace credentials are present", async () => {
    const { getWorkspaceCredential, getEffectiveCredential } =
      await import("../src/index.js");

    // Set primary key workspace credential
    const primary = getKeySettings("primary-key");
    const prevPrimaryGh = primary.customGitHubToken;
    try {
      primary.customGitHubToken = "ghp_workspaceGlobalGitHubToken123456";

      // Verify workspace credential resolution
      assert.equal(
        getWorkspaceCredential("github"),
        "ghp_workspaceGlobalGitHubToken123456",
        "Workspace should expose primary key GitHub token",
      );

      // Verify effective credential inheritance for a child key without override
      const childSettings = getKeySettings("test-child-key-dynamic");
      delete childSettings.customGitHubToken;
      assert.equal(
        getEffectiveCredential("test-child-key-dynamic", "github"),
        "ghp_workspaceGlobalGitHubToken123456",
        "Child key should dynamically inherit workspace credential",
      );

      // Verify that when a child key has its own override, it takes precedence
      childSettings.customGitHubToken = "ghp_childKeyCustomOverride789";
      assert.equal(
        getEffectiveCredential("test-child-key-dynamic", "github"),
        "ghp_childKeyCustomOverride789",
        "Child key override takes precedence over workspace credential",
      );

      // Verify rendered HTML includes workspaceReady and dynamic providerReady logic
      const html = renderApiKeySettingsPage({
        base: "http://localhost:3000",
        isOwner: true,
        owner: { email: "owner@example.com" },
        key: { id: "test-child-key-dynamic", name: "Dynamic Test Key" },
        toolsCatalog: [
          {
            name: "get_file_contents",
            category: "GitHub",
            description: "Read file",
          },
        ],
        keySettings: childSettings,
        apiKeyToken: "krix_test_dynamic_1234",
        credentialAvailability: {
          github: true,
          render: false,
          workspaceGithub: true,
          workspaceRender: false,
        },
      });

      assert.ok(
        html.includes("workspaceCredentialReady"),
        "Rendered HTML script must define workspaceCredentialReady",
      );
      assert.ok(
        html.includes("workspaceCredentialReady[provider]"),
        "providerReady must dynamically check workspaceCredentialReady",
      );
    } finally {
      if (prevPrimaryGh) primary.customGitHubToken = prevPrimaryGh;
      else delete primary.customGitHubToken;
    }
  });
});
