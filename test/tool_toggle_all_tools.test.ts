import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { TOOL_CATEGORY } from "../src/security.js";
import { isDefaultOnTool } from "../src/toolDefaults.js";
import {
  getKeySettings,
  removeKeySettings,
  isToolEnabledForKey,
  toggleKeyTool,
  updateKeyTools,
  updateKeyToolRiskLevel,
  getDefaultToolRiskLevel,
} from "../src/userSettings.js";
import { renderSettingsPage } from "../src/website/pages/settings.js";
import { renderApiKeySettingsPage } from "../src/website/pages/apiKeySettings.js";

const ALL = Object.entries(TOOL_CATEGORY);
const ALL_CATS = new Set(Object.values(TOOL_CATEGORY));

describe("every tool respects the enable/disable toggle", () => {
  test("covers a large catalogue including high/critical-named tools", () => {
    assert.ok(ALL.length >= 100, `expected 100+ tools, got ${ALL.length}`);
    const risky = ALL.filter(([n, c]) => ["high", "critical"].includes(getDefaultToolRiskLevel(n, c)));
    assert.ok(risky.length > 10);
  });

  test("single toggle ON lists every tool, OFF hides it (all categories active)", () => {
    getKeySettings("toggle-all-single");
    for (const [name, cat] of ALL) {
      toggleKeyTool("toggle-all-single", name, true);
      assert.equal(isToolEnabledForKey("toggle-all-single", name, cat, ALL_CATS), true, `${name} should be on`);
      toggleKeyTool("toggle-all-single", name, false);
      assert.equal(isToolEnabledForKey("toggle-all-single", name, cat, ALL_CATS), false, `${name} should be off`);
    }
  });

  test("explicitly-enabled tools are listed even when their category is not active", () => {
    const key = "toggle-all-explicit";
    getKeySettings(key);
    for (const [name, cat] of ALL) {
      toggleKeyTool(key, name, true);
      assert.equal(isToolEnabledForKey(key, name, cat, new Set()), true, `${name} explicit on`);
    }
  });

  test("bulk save enables and disables every tool", () => {
    const key = "toggle-all-bulk";
    getKeySettings(key);
    const names = ALL.map(([n]) => n);
    updateKeyTools(key, names, []);
    for (const [name, cat] of ALL) assert.equal(isToolEnabledForKey(key, name, cat, new Set()), true, name);
    updateKeyTools(key, [], names);
    for (const [name, cat] of ALL) assert.equal(isToolEnabledForKey(key, name, cat, ALL_CATS), false, name);
  });

  test("default-on tools with risky-sounding names are NOT hidden; everything else is opt-in", () => {
    const key = "toggle-all-defaults";
    getKeySettings(key);
    for (const [name, cat] of ALL) {
      const expected = isDefaultOnTool(name, cat);
      assert.equal(
        isToolEnabledForKey(key, name, cat),
        expected,
        `${name} (${cat}) default should be ${expected ? "on" : "off"}`,
      );
    }
    // Every sandbox / file tool is on by default, including risky-sounding ones.
    for (const name of ["sandbox_exec", "sandbox_run", "sandbox_install", "delete_file"]) {
      assert.equal(isToolEnabledForKey(key, name, TOOL_CATEGORY[name]), true, name);
    }
    // Issues/PRs, admin, Render, code graph and web search are opt-in.
    for (const name of ["list_issues", "find_code", "web_search"]) {
      assert.equal(isToolEnabledForKey(key, name, TOOL_CATEGORY[name]), false, name);
    }
  });

  test("an explicit user-set high risk level still gates until acknowledged", () => {
    const key = "toggle-all-explicit-risk";
    getKeySettings(key);
    updateKeyToolRiskLevel(key, "delete_file", "critical", false);
    assert.equal(isToolEnabledForKey(key, "delete_file", "core", ALL_CATS), false);
    toggleKeyTool(key, "delete_file", true);
    assert.equal(isToolEnabledForKey(key, "delete_file", "core", ALL_CATS), true);
  });

  test("global settings on primary-key are inherited only by owner-account or explicitly workspace-scoped keys, and per-key overrides win", () => {
    const primary = getKeySettings("primary-key");
    const prevEnabled = [...(primary.enabledTools || [])];
    const prevDisabled = [...(primary.disabledTools || [])];
    const oauthClientId = "krix_client_inherit_test";
    const apiKeyId = "krix_key_inherit_test";
    try {
      // Globally enable a Code Graph tool (opt-in by default) and globally disable a core GitHub tool
      toggleKeyTool("primary-key", "find_code", true);
      toggleKeyTool("primary-key", "delete_file", false);

      // Keys that are not tied to the owner account and have no workspace scope are isolated:
      // they must NOT pick up the primary key's global toggles
      assert.equal(isToolEnabledForKey(oauthClientId, "find_code", "codegraph", ALL_CATS), false);
      assert.equal(isToolEnabledForKey(apiKeyId, "find_code", "codegraph", ALL_CATS), false);

      // Keys explicitly scoped to the primary workspace inherit the global toggles dynamically
      const inherit = (id: string, tool: string, cat: string) =>
        isToolEnabledForKey(id, tool, cat, ALL_CATS, undefined, true, "primary-key");
      assert.equal(inherit(oauthClientId, "find_code", "codegraph"), true);
      assert.equal(inherit(oauthClientId, "delete_file", "core"), false);
      assert.equal(inherit(apiKeyId, "find_code", "codegraph"), true);

      // Keys whose account email is the owner's also inherit without an explicit workspace id
      const ownerKeyId = "krix_key_inherit_owner_test";
      const prevOwnerEmail = process.env.OWNER_EMAIL;
      process.env.OWNER_EMAIL = "owner-inherit-test@example.com";
      getKeySettings(ownerKeyId).email = process.env.OWNER_EMAIL;
      try {
        assert.equal(isToolEnabledForKey(ownerKeyId, "find_code", "codegraph", ALL_CATS), true);
        assert.equal(isToolEnabledForKey(ownerKeyId, "delete_file", "core", ALL_CATS), false);
      } finally {
        if (prevOwnerEmail === undefined) delete process.env.OWNER_EMAIL;
        else process.env.OWNER_EMAIL = prevOwnerEmail;
        removeKeySettings(ownerKeyId);
      }

      // Per-key override on the OAuth client takes precedence over global settings without affecting other keys
      toggleKeyTool(oauthClientId, "find_code", false);
      toggleKeyTool(oauthClientId, "delete_file", true);
      assert.equal(inherit(oauthClientId, "find_code", "codegraph"), false);
      assert.equal(inherit(oauthClientId, "delete_file", "core"), true);
      assert.equal(inherit(apiKeyId, "find_code", "codegraph"), true);
      assert.equal(inherit(apiKeyId, "delete_file", "core"), false);

      // Per-key settings UI renders inherited global state and per-key overrides accurately
      const keyDetailHtml = renderApiKeySettingsPage({
        base: "http://localhost:3000",
        isOwner: true,
        owner: { email: "owner@example.com", name: "Owner" },
        key: { id: apiKeyId, label: "Dev Key", type: "api_key" },
        keySettings: getKeySettings(apiKeyId),
        globalKeySettings: getKeySettings("primary-key"),
        sandboxAllowed: false,
        credentialAvailability: { github: true, render: true, sandboxEnabled: false },
        toolsCatalog: [
          { name: "find_code", category: "Code Graph", description: "Find code" },
          { name: "sandbox_exec", category: "Sandbox", description: "Run shell command" },
        ],
      });
      assert.ok(
        keyDetailHtml.includes('value="find_code" checked onchange="onKeyToolToggle(this)"'),
        "apiKeySettings must reflect globally enabled find_code when not overridden on the key",
      );
      assert.ok(
        keyDetailHtml.includes('value="sandbox_exec"  onchange="onKeyToolToggle(this)"'),
        "apiKeySettings must render sandbox_exec unchecked when sandboxAllowed is false",
      );

      // Global settings page stays clean without per-key selector and respects sandboxAllowed=false
      const globalHtml = renderSettingsPage({
        base: "http://localhost:3000",
        isOwner: true,
        owner: { email: "owner@example.com", name: "Owner" },
        keys: [{ id: "primary-key", label: "Primary API Key" }],
        selectedKeyId: "primary-key",
        keySettings: getKeySettings("primary-key"),
        sandboxAllowed: false,
        credentialAvailability: { github: true, render: true, sandboxEnabled: false },
        toolsCatalog: [
          { name: "sandbox_exec", category: "Sandbox", description: "Run shell command" },
          { name: "get_file_contents", category: "GitHub", description: "Read file" },
        ],
        userQuota: { role: "owner" },
      });
      assert.ok(!globalHtml.includes('id="settingsKeySelect"'), "global /settings must not render per-key dropdown");
      assert.ok(
        globalHtml.includes("toggleToolPermission('sandbox_exec', this.checked, this)\" >"),
        "sandbox_exec must render unchecked when sandboxAllowed is false",
      );
      assert.ok(
        globalHtml.includes("toggleToolPermission('get_file_contents', this.checked, this)\" checked>"),
        "default GitHub tool must remain checked when GitHub credential is present",
      );
    } finally {
      updateKeyTools("primary-key", prevEnabled, prevDisabled);
      // Per-key overrides are persisted to disk; drop them so reruns start clean.
      removeKeySettings(oauthClientId);
      removeKeySettings(apiKeyId);
    }
  });
});
