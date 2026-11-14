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
});
