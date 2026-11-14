import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { TOOL_CATEGORY } from "../src/security.js";
import {
  getKeySettings,
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

  test("category-enabled tools with risky-sounding names are NOT hidden", () => {
    const key = "toggle-all-category";
    getKeySettings(key);
    for (const [name, cat] of ALL) {
      if (["codegraph", "search", "render"].includes(cat) || name === "web_search") continue;
      assert.equal(isToolEnabledForKey(key, name, cat, ALL_CATS), true, `${name} (${cat}) on by category`);
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

  test("settings UI renders key/OAuth selector, Apply to All Keys, and respects sandboxAllowed=false", () => {
    const html = renderSettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { email: "owner@example.com", name: "Owner" },
      keys: [
        { id: "primary-key", label: "Primary API Key" },
        { id: "krix_client_gemini_test", label: "OAuth: Google Gemini" },
      ],
      selectedKeyId: "krix_client_gemini_test",
      keySettings: getKeySettings("krix_client_gemini_test"),
      sandboxAllowed: false,
      credentialAvailability: { github: true, render: true, sandboxEnabled: false },
      toolsCatalog: [
        { name: "sandbox_exec", category: "Sandbox", description: "Run shell command" },
        { name: "get_file_contents", category: "GitHub", description: "Read file" },
      ],
      userQuota: { role: "owner" },
    });
    assert.ok(html.includes('id="settingsKeySelect"'), "must render key/OAuth selector");
    assert.ok(html.includes("krix_client_gemini_test"), "must include OAuth client option");
    assert.ok(html.includes("applyToolsToAllKeys()"), "must include Apply to All Keys action");
    assert.ok(
      html.includes("toggleToolPermission('sandbox_exec', this.checked, this)\" >"),
      "sandbox_exec must render unchecked when sandboxAllowed is false",
    );
    assert.ok(
      html.includes("toggleToolPermission('get_file_contents', this.checked, this)\" checked>"),
      "default GitHub tool must remain checked when GitHub credential is present",
    );

    const keyDetailHtml = renderApiKeySettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { email: "owner@example.com", name: "Owner" },
      key: { id: "krix_client_gemini_test", label: "Google Gemini", type: "oauth" },
      keySettings: getKeySettings("krix_client_gemini_test"),
      sandboxAllowed: false,
      credentialAvailability: { github: true, render: true, sandboxEnabled: false },
      toolsCatalog: [
        { name: "sandbox_exec", category: "Sandbox", description: "Run shell command" },
      ],
    });
    assert.ok(
      keyDetailHtml.includes('value="sandbox_exec"  onchange="onKeyToolToggle(this)"'),
      "apiKeySettings must render sandbox_exec unchecked when sandboxAllowed is false",
    );
  });
});
