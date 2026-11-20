// Global enable lock:
//  - a workspace lock (and a per-key choice) stops tools that are switched ON globally, or
//    unlocked by adding a GitHub/Render credential, from reaching a key; switching OFF still does,
//  - removing a credential never erases tool choices: the switch is greyed out, locked, and comes
//    back exactly as it was when the credential is added again.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveToolState, globalSkippedLabel } from "../src/toolDefaults.js";
import {
  getKeySettings,
  isToolEnabledForKey,
  setKeyGlobalEnableMode,
  setWorkspaceGlobalLock,
  toggleKeyTool,
  updateKeyTools,
  resolveAcceptGlobalEnables,
} from "../src/userSettings.js";
import { renderSettingsPage } from "../src/website/pages/settings.js";
import { renderApiKeySettingsPage } from "../src/website/pages/apiKeySettings.js";

const WS = "primary-key";
const withGithub = { github: true, render: true };
const noGithub = { github: false, render: true };

function on(keyId: string, tool: string, category: string, creds = withGithub) {
  return isToolEnabledForKey(keyId, tool, category, undefined, creds, true, WS);
}

describe("resolveToolState: accepting global enables", () => {
  const base = {
    category: "core",
    credentials: { github: true, render: true },
    categoryAllowed: true,
  };

  test("default behaviour is unchanged when the key accepts (or says nothing)", () => {
    const a = resolveToolState({ ...base, toolName: "get_me", requires: "github" });
    assert.deepEqual(a, { enabled: true, reason: "default-on" });
    const b = resolveToolState({
      ...base,
      toolName: "list_issues",
      category: "github_issues_prs",
      requires: "github",
      globalEnabled: ["list_issues"],
    });
    assert.deepEqual(b, { enabled: true, reason: "global-on" });
  });

  test("a key that does not accept ignores global enables and credential-gated defaults", () => {
    const def = resolveToolState({
      ...base,
      toolName: "get_me",
      requires: "github",
      acceptGlobalEnables: false,
    });
    assert.deepEqual(def, { enabled: false, reason: "global-skipped" });
    const glob = resolveToolState({
      ...base,
      toolName: "find_code",
      category: "codegraph",
      requires: null,
      globalEnabled: ["find_code"],
      acceptGlobalEnables: false,
    });
    assert.deepEqual(glob, { enabled: false, reason: "global-skipped" });
  });

  test("sandbox tools that need no credential stay on for everyone", () => {
    const r = resolveToolState({
      ...base,
      toolName: "sandbox_exec",
      category: "sandbox",
      requires: null,
      acceptGlobalEnables: false,
    });
    assert.deepEqual(r, { enabled: true, reason: "default-on" });
  });

  test("global DISABLES are blocked for a protected key's baseline tools, while missing credentials still grey them out", () => {
    const protectedTool = resolveToolState({
      ...base,
      toolName: "get_me",
      requires: "github",
      acceptGlobalEnables: false,
      globalBaseline: ["get_me"],
      globalDisabled: ["get_me"],
    });
    assert.deepEqual(protectedTool, { enabled: true, reason: "global-protected" });

    // Missing GitHub/Render credential still hard-blocks the tool even when protected.
    const missingCred = resolveToolState({
      ...base,
      credentials: { github: false, render: true },
      toolName: "get_me",
      requires: "github",
      acceptGlobalEnables: false,
      globalBaseline: ["get_me"],
      globalDisabled: ["get_me"],
    });
    assert.deepEqual(missingCred, { enabled: false, reason: "needs-github" });

    // A tool that was NOT in the baseline stays off when disabled globally.
    const notInBaseline = resolveToolState({
      ...base,
      toolName: "sandbox_exec",
      category: "sandbox",
      requires: null,
      acceptGlobalEnables: false,
      globalBaseline: ["get_me"],
      globalDisabled: ["sandbox_exec"],
    });
    assert.deepEqual(notInBaseline, { enabled: false, reason: "global-off" });
  });

  test("baseline tools keep following the workspace; the key's own choice still wins", () => {
    const inBaseline = resolveToolState({
      ...base,
      toolName: "get_me",
      requires: "github",
      acceptGlobalEnables: false,
      globalBaseline: ["get_me"],
    });
    assert.equal(inBaseline.enabled, true);
    const own = resolveToolState({
      ...base,
      toolName: "get_me",
      requires: "github",
      acceptGlobalEnables: false,
      keyEnabled: ["get_me"],
    });
    assert.deepEqual(own, { enabled: true, reason: "key-on" });
  });

  test("skipped and protected reasons get friendly hints", () => {
    assert.match(globalSkippedLabel("global-skipped"), /not applied to this key/);
    assert.match(globalSkippedLabel("global-protected"), /kept on for this key/);
    assert.equal(globalSkippedLabel("global-on"), "");
    assert.equal(globalSkippedLabel(undefined), "");
  });
});

describe("workspace lock: adding a credential does not switch tools on for existing keys", () => {
  test("the GitHub-token scenario, end to end", () => {
    const k = "lock-scn-key";
    const key = getKeySettings(k);
    key.email = "owner@localhost";

    // No GitHub token yet: the GitHub tools are blocked.
    assert.equal(on(k, "get_me", "core", noGithub), false);

    // The user locks global enabling (nothing is on through inheritance yet, so the baseline is empty).
    setWorkspaceGlobalLock(WS, true, [k], () => []);
    assert.equal(getKeySettings(WS).lockGlobalEnables, true);
    assert.equal(resolveAcceptGlobalEnables(key, getKeySettings(WS)), false);

    // Now the token is added: nothing switches on for this key.
    assert.equal(on(k, "get_me", "core", withGithub), false, "gated default stays off");
    // Credential-free sandbox tools are unaffected.
    assert.equal(on(k, "sandbox_exec", "sandbox", withGithub), true);

    // The user enables it on this key themselves.
    toggleKeyTool(k, "get_me", true);
    assert.equal(on(k, "get_me", "core", withGithub), true);

    // Unlocking makes the key follow the workspace again.
    setWorkspaceGlobalLock(WS, false, [k], () => []);
    assert.equal(on(k, "merge_pull_request", "github_issues_prs"), false, "opt-in tools stay off");
    assert.equal(on(k, "get_file_contents", "core"), true, "defaults are back");
  });

  test("neither a global enable nor a global disable reaches a locked key", () => {
    const k = "lock-enable-disable-key";
    getKeySettings(k).email = "owner@localhost";
    setWorkspaceGlobalLock(WS, true, [k], () => []);
    const ws = getKeySettings(WS);

    toggleKeyTool(WS, "list_issues", true);
    assert.equal(on(WS, "list_issues", "github_issues_prs"), true, "workspace itself is on");
    assert.equal(on(k, "list_issues", "github_issues_prs"), false, "locked key ignores global enable");

    // Disabling globally does NOT turn off a tool in the locked key's baseline.
    getKeySettings(k).globalEnableBaseline = ["get_me"];
    assert.equal(on(k, "get_me", "core"), true);
    toggleKeyTool(WS, "get_me", false);
    assert.equal(on(WS, "get_me", "core"), false, "workspace itself is off");
    assert.equal(on(k, "get_me", "core"), true, "locked key stays protected from global disable");
    // Without the GitHub credential it is still blocked (greyed out).
    assert.equal(on(k, "get_me", "core", noGithub), false, "missing credential still blocks tool");

    // Clean up the shared workspace state for other tests in this file.
    updateKeyTools(WS, [], []);
    delete ws.lockGlobalEnables;
  });

  test("locking records what each following key already has; keys with their own choice are left alone", () => {
    const follower = "lock-follower";
    const chooser = "lock-chooser";
    getKeySettings(follower);
    getKeySettings(chooser).acceptGlobalEnables = true;
    const asked: string[] = [];
    const { changedKeyIds } = setWorkspaceGlobalLock(WS, true, [follower, chooser], (id) => {
      asked.push(id);
      return ["get_me", "grep"];
    });
    assert.deepEqual(asked, [follower]);
    assert.deepEqual(changedKeyIds, [follower]);
    assert.deepEqual(getKeySettings(follower).globalEnableBaseline, ["get_me", "grep"]);
    assert.equal(getKeySettings(chooser).globalEnableBaseline, undefined);

    setWorkspaceGlobalLock(WS, false, [follower, chooser], () => []);
    assert.equal(getKeySettings(follower).globalEnableBaseline, undefined);
    assert.equal(getKeySettings(WS).lockGlobalEnables, undefined);
  });
});

describe("per-key choice", () => {
  test("accept / block / follow, with the baseline recorded only when a key stops accepting", () => {
    const k = "per-key-mode";
    getKeySettings(k);
    let calls = 0;
    const baseline = () => {
      calls += 1;
      return ["get_me"];
    };

    setKeyGlobalEnableMode(k, "block", WS, baseline);
    assert.equal(getKeySettings(k).acceptGlobalEnables, false);
    assert.deepEqual(getKeySettings(k).globalEnableBaseline, ["get_me"]);
    assert.equal(calls, 1);

    // Already not accepting: nothing is recomputed.
    setKeyGlobalEnableMode(k, "block", WS, baseline);
    assert.equal(calls, 1);

    setKeyGlobalEnableMode(k, "accept", WS, baseline);
    assert.equal(getKeySettings(k).acceptGlobalEnables, true);
    assert.equal(getKeySettings(k).globalEnableBaseline, undefined);

    setKeyGlobalEnableMode(k, "follow", WS, baseline);
    assert.equal(getKeySettings(k).acceptGlobalEnables, undefined);
  });

  test("a key can accept while the workspace is locked, and refuse while it is unlocked", () => {
    const locked = "per-key-accepts";
    const open = "per-key-refuses";
    getKeySettings(locked);
    getKeySettings(open);
    setWorkspaceGlobalLock(WS, true, [], () => []);
    setKeyGlobalEnableMode(locked, "accept", WS, () => []);
    assert.equal(on(locked, "get_me", "core"), true);
    setWorkspaceGlobalLock(WS, false, [], () => []);
    setKeyGlobalEnableMode(open, "block", WS, () => []);
    assert.equal(on(open, "get_me", "core"), false);
  });
});

describe("removing a credential keeps tool choices", () => {
  test("choices survive removal and come back when the credential is added again", () => {
    const k = "cred-removal-key";
    getKeySettings(k).email = "owner@localhost";
    toggleKeyTool(k, "list_issues", true);
    assert.equal(on(k, "list_issues", "github_issues_prs", withGithub), true);

    // Token removed: unavailable...
    assert.equal(on(k, "list_issues", "github_issues_prs", noGithub), false);
    // ...but the stored choice is untouched (it used to be pruned here).
    assert.ok(getKeySettings(k).enabledTools?.includes("list_issues"));

    // Token added again: on again with no re-enabling.
    assert.equal(on(k, "list_issues", "github_issues_prs", withGithub), true);
  });
});

describe("pages", () => {
  const catalog = [
    { name: "get_me", category: "GitHub", description: "x" },
    { name: "sandbox_exec", category: "Sandbox", description: "x" },
  ];
  const toolStates = {
    get_me: { enabled: false, reason: "needs-github", remembered: true },
    sandbox_exec: { enabled: true, reason: "default-on", remembered: true },
  };

  test("Settings shows a Friendly zone with the lock button in the right state", () => {
    for (const locked of [false, true]) {
      const html = renderSettingsPage({
        base: "http://localhost:3000",
        isOwner: true,
        keys: [{ id: "primary-key" }],
        selectedKeyId: "primary-key",
        keySettings: {},
        userQuota: {},
        toolsCatalog: catalog,
        credentialAvailability: {},
        toolStates,
        globalLocked: locked,
      });
      assert.ok(html.includes("Friendly zone"));
      assert.ok(html.includes("Lock global tool changes"));
      assert.ok(html.includes('id="globalLockBtn"'));
      assert.ok(html.includes(`data-locked="${locked}"`));
      assert.ok(html.includes(locked ? "Unlock changes" : "Lock changes"));
      assert.ok(html.includes("/settings/api/global-lock"));
    }
  });

  test("a tool missing its credential is greyed out, locked, and keeps its remembered state", () => {
    const html = renderSettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      keys: [{ id: "primary-key" }],
      selectedKeyId: "primary-key",
      keySettings: {},
      userQuota: {},
      toolsCatalog: catalog,
      credentialAvailability: {},
      toolStates,
    });
    const row = html.split('data-name="get_me"')[1].split("</label>")[0];
    assert.ok(html.includes('tool-blocked" data-cat="GitHub"'));
    assert.match(row, /Needs a GitHub token/);
    assert.match(row, /back on once added/);
    assert.match(row, /checked\s+disabled/);
    const free = html.split('data-name="sandbox_exec"')[1].split("</label>")[0];
    assert.ok(!/disabled/.test(free));
  });

  test("the key page has the per-key choice, and hides it for the workspace key", () => {
    const render = (extra: Record<string, unknown>) =>
      renderApiKeySettingsPage({
        base: "http://localhost:3000",
        isOwner: true,
        key: { id: "abc123", label: "My key", type: "api" },
        toolsCatalog: catalog,
        keySettings: extra.keySettings || {},
        credentialAvailability: {},
        toolStates,
        ...extra,
      } as any);
    const html = render({ globalLocked: true, keySettings: {} });
    assert.ok(html.includes('id="globalModeBtn"'));
    assert.ok(html.includes("friendly-zone-btn"));
    assert.ok(html.includes("Inherit global tool changes"));
    assert.ok(html.includes("Locked by workspace"));
    assert.ok(html.includes('data-inherits="false"'));
    assert.ok(html.includes("/settings/api/key-global-mode"));
    const unlockedHtml = render({ globalLocked: false, keySettings: {} });
    assert.ok(unlockedHtml.includes('data-inherits="true"'));
    assert.ok(!render({ isWorkspaceKey: true }).includes('id="globalModeBtn"'));
    const row = html.split('class="key-tool-check" value="get_me"')[1].split("</label>")[0];
    assert.match(row, /checked\s+disabled/);
  });
});
