import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { renderApiKeySettingsPage } from "../src/website/pages/apiKeySettings.js";
import { getKeySettings } from "../src/userSettings.js";

function renderPage(): string {
  return renderApiKeySettingsPage({
    base: "http://localhost:3000",
    isOwner: true,
    owner: { email: "owner@example.com", name: "Owner" },
    key: { id: "krix_key_switch_test", label: "Dev Key", type: "api_key" },
    keySettings: getKeySettings("krix_key_switch_test"),
    globalKeySettings: getKeySettings("primary-key"),
    sandboxAllowed: true,
    credentialAvailability: { github: false, render: false, sandboxEnabled: true },
    toolsCatalog: [{ name: "sandbox_exec", category: "Sandbox", description: "x" }],
  } as any);
}

function pageScript(html: string): string {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .filter((s) => s.includes("toggleKeyActiveStatus"));
  assert.equal(scripts.length, 1);
  return scripts[0];
}

test("the browser script of the key page is valid JavaScript", () => {
  new vm.Script(pageScript(renderPage()));
});

test("Save / Cancel start hidden", () => {
  const html = renderPage();
  for (const id of ["saveKeySettingsButton", "cancelKeySettingsButton"]) {
    const tag = html.match(new RegExp(`id="${id}"[^>]*>`))?.[0] || "";
    assert.match(tag, /display:\s*none/, `${id} must start hidden`);
  }
});

test("the Active switch saves by itself and never opens the Save / Cancel bar", () => {
  const script = pageScript(renderPage());
  const fn = script.slice(
    script.indexOf("async function toggleKeyActiveStatus"),
    script.indexOf("function refreshKeySettingsBar"),
  );
  assert.match(fn, /fetch\('\/api\/keys\/krix_key_switch_test\/settings'/);
  assert.match(fn, /disabled: !nextActive/);
  assert.ok(!fn.includes("showKeySettingsSave"), "switch must not show the bar");
  assert.ok(!fn.includes("refreshKeySettingsBar"), "switch must not touch the bar");
  // The bar is driven only by credential editing.
  const bar = script.slice(script.indexOf("function refreshKeySettingsBar"));
  const barFn = bar.slice(0, bar.indexOf("function showKeySettingsSave"));
  assert.ok(!barFn.includes("keyActiveToggle"));
  assert.match(barFn, /overrideEditing\.github \|\| overrideEditing\.render/);
});

test("Save only sends credentials, never the Active state or tool lists", () => {
  const script = pageScript(renderPage());
  const save = script.slice(script.indexOf("async function saveKeySettings"));
  const body = save.slice(0, save.indexOf("try {"));
  assert.ok(!/disabled\s*:/.test(body) && !body.includes("body.disabled"));
  assert.ok(!body.includes("enabledTools"));
  assert.ok(!body.includes("disabledTools"));
});
