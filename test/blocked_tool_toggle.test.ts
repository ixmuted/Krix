// A tool the deployment forbids (e.g. sandbox on a Render host) used to be saved as "on" with a
// success toast and then show as off after a refresh. These tests pin the fixed behaviour:
//  - the API refuses to switch such a tool on (409) and says why,
//  - the Settings pages show the switch locked with the reason,
//  - nothing changes for tools that are allowed.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  blockedToolReasonLabel,
  categoryUnavailableMessage,
} from "../src/toolDefaults.js";
import { renderSettingsPage } from "../src/website/pages/settings.js";
import { renderApiKeySettingsPage } from "../src/website/pages/apiKeySettings.js";

describe("blocked tool helpers and pages", () => {
  test("only hard blocks get a label", () => {
    assert.equal(blockedToolReasonLabel("sandbox-unavailable"), "Disabled by the server");
    assert.equal(blockedToolReasonLabel("needs-github"), "Needs a GitHub token");
    assert.equal(blockedToolReasonLabel("needs-render"), "Needs a Render API key");
    for (const free of ["key-on", "key-off", "global-on", "global-off", "default-on", "default-off", undefined]) {
      assert.equal(blockedToolReasonLabel(free), "", String(free));
    }
  });

  test("the sandbox message tells the operator what to change", () => {
    const msg = categoryUnavailableMessage("sandbox_exec", "sandbox");
    assert.match(msg, /sandbox_exec/);
    assert.match(msg, /ENABLE_SANDBOX/);
  });

  const catalog = [
    { name: "sandbox_exec", category: "Sandbox", description: "x" },
    { name: "find_code", category: "Code Graph", description: "x" },
  ];
  const toolStates = {
    sandbox_exec: { enabled: false, reason: "sandbox-unavailable" },
    find_code: { enabled: true, reason: "global-on" },
  };

  test("global settings page locks a server-blocked switch and leaves others alone", () => {
    const html = renderSettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { email: "o@x.test", name: "O" },
      keys: [{ id: "primary-key" }],
      selectedKeyId: "primary-key",
      keySettings: {},
      userQuota: {},
      toolsCatalog: catalog,
      credentialAvailability: { github: false, render: false, sandboxEnabled: false },
      toolStates,
    } as any);
    const row = (name: string) =>
      html.match(new RegExp(`toggleToolPermission\\('${name}'[^>]*>`))?.[0] || "";
    assert.match(row("sandbox_exec"), /\sdisabled>/);
    assert.ok(!/\sdisabled>/.test(row("find_code")));
    assert.match(row("find_code"), /checked>/);
    assert.match(html, /Disabled by the server/);
  });

  test("per-key page locks a server-blocked switch and leaves others alone", () => {
    const html = renderApiKeySettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { email: "o@x.test", name: "O" },
      key: { id: "krix_k", label: "K", type: "api_key" },
      keySettings: {},
      globalKeySettings: {},
      sandboxAllowed: false,
      credentialAvailability: { github: false, render: false, sandboxEnabled: false },
      toolsCatalog: catalog,
      toolStates,
    } as any);
    const input = (name: string) =>
      html.match(new RegExp(`value="${name}"[^>]*>`))?.[0] || "";
    assert.match(input("sandbox_exec"), /\sdisabled\s/);
    assert.ok(!/\sdisabled\s/.test(input("find_code")));
    assert.match(input("find_code"), /checked/);
  });

  test("per-key page sends the real key id to the server, not its HTML-escaped form", () => {
    const weirdId = `k&1'"<x>`;
    const html = renderApiKeySettingsPage({
      base: "http://localhost:3000",
      isOwner: true,
      owner: { email: "o@x.test", name: "O" },
      key: { id: weirdId, label: "K", type: "api_key" },
      keySettings: {},
      globalKeySettings: {},
      sandboxAllowed: true,
      credentialAvailability: { github: false, render: false, sandboxEnabled: true },
      toolsCatalog: catalog,
      toolStates,
    } as any);
    const script = html; // the id is only ever placed inside the page's own <script> and attributes
    // Escaped form would make every toggle address a key that does not exist.
    assert.ok(!/keyId: "k&amp;/.test(script), "no HTML entities where the script builds requests");
    assert.ok(script.includes(`keyId: ${JSON.stringify(weirdId).replace(/</g, "\\u003c")}`));
    assert.ok(!script.includes("</script>x"), "a key id can never close the script tag");
    assert.ok(script.includes(`/api/keys/${encodeURIComponent(weirdId).replace(/'/g, "%27")}/settings`));
  });
});

// ---------------------------------------------------------------------------------------------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "owner@krix.test";
const SESSION_SECRET = "krix-blocked-session-secret-0123456789abcdef";
const MASTER_KEY = "krix-blocked-master-key-0123456789abcdef0123456789";

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

interface Booted {
  base: string;
  cookie: string;
  stop: () => Promise<void>;
}

async function bootServer(extraEnv: Record<string, string>): Promise<Booted> {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "krix-blocked-"));
  fs.chmodSync(dataDir, 0o755);
  const proc: ChildProcess = spawn(
    process.execPath,
    [
      "--require",
      path.join(ROOT, "node_modules/tsx/dist/preflight.cjs"),
      "--import",
      pathToFileURL(path.join(ROOT, "node_modules/tsx/dist/loader.mjs")).href,
      path.join(ROOT, "src/index.ts"),
    ],
    {
      cwd: dataDir,
      stdio: "ignore",
      env: {
        PATH: process.env.PATH || "",
        HOME: process.env.HOME || os.tmpdir(),
        PORT: String(port),
        NODE_ENV: "development",
        MCP_API_KEY: MASTER_KEY,
        OWNER_EMAIL: OWNER,
        SESSION_SECRET,
        KEY_ENCRYPTION_SECRET: "krix-blocked-encryption-secret-32-bytes!!",
        PUBLIC_BASE_URL: base,
        KRIX_DATA_DIR: dataDir,
        RENDER: "true",
        ...extraEnv,
      },
    },
  );
  const payload = Buffer.from(
    JSON.stringify({ email: OWNER, role: "owner", expiresAt: Date.now() + 3600_000 }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  const cookie = `krix_session=${encodeURIComponent(`${payload}.${sig}`)}`;
  const deadline = Date.now() + 60_000;
  let up = false;
  while (Date.now() < deadline && !up) {
    try {
      up = (await fetch(`${base}/healthz`)).status < 500;
    } catch {}
    if (!up) await new Promise((r) => setTimeout(r, 400));
  }
  if (!up) {
    proc.kill();
    throw new Error("server did not start");
  }
  return {
    base,
    cookie,
    stop: async () => {
      if (proc.exitCode === null) {
        const exited = new Promise<void>((resolve) => proc.once("exit", () => resolve()));
        proc.kill();
        await exited;
      }
      fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    },
  };
}

function client(b: Booted) {
  const post = (p: string, body: unknown) =>
    fetch(`${b.base}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: b.cookie, Origin: b.base },
      body: JSON.stringify(body),
    });
  const toggleRow = async (url: string, tool: string) => {
    const html = await (await fetch(`${b.base}${url}`, { headers: { Cookie: b.cookie } })).text();
    const tag = html.match(new RegExp(`toggleToolPermission\\('${tool}'[^>]*>`))?.[0] || "";
    return { present: tag !== "", checked: /"\s+checked/.test(tag), disabled: /\sdisabled>/.test(tag) };
  };
  return { post, toggleRow };
}

describe("real server on a Render-like host (sandbox not allowed)", () => {
  let b: Booted;
  let c: ReturnType<typeof client>;
  before(async () => {
    b = await bootServer({});
    c = client(b);
  });
  after(async () => b?.stop());

  test("enabling a sandbox tool is refused with a reason, not saved as on", async () => {
    const res = await c.post("/settings/api/tool-toggle", {
      keyId: "primary-key",
      toolName: "sandbox_exec",
      enabled: true,
    });
    assert.equal(res.status, 409);
    const data = (await res.json()) as any;
    assert.equal(data.ok, false);
    assert.equal(data.code, "TOOL_UNAVAILABLE_ON_SERVER");
    assert.match(data.error, /ENABLE_SANDBOX/);
    const after = await c.toggleRow("/settings?key=primary-key", "sandbox_exec");
    assert.equal(after.checked, false);
    assert.equal(after.disabled, true, "the switch is locked, not just unchecked");
  });

  test("the bulk endpoint refuses it too", async () => {
    const res = await c.post("/settings/api/tools", {
      keyId: "primary-key",
      enabledTools: ["sandbox_run"],
      disabledTools: [],
    });
    assert.equal(res.status, 409);
  });

  test("tools the server allows still toggle and survive a refresh", async () => {
    const on = await c.post("/settings/api/tool-toggle", {
      keyId: "primary-key",
      toolName: "web_search",
      enabled: true,
    });
    assert.equal(on.status, 200);
    assert.equal((await c.toggleRow("/settings?key=primary-key", "web_search")).checked, true);
    const off = await c.post("/settings/api/tool-toggle", {
      keyId: "primary-key",
      toolName: "web_search",
      enabled: false,
    });
    assert.equal(off.status, 200);
    assert.equal((await c.toggleRow("/settings?key=primary-key", "web_search")).checked, false);
  });

  test("switching a blocked tool OFF is still allowed", async () => {
    const res = await c.post("/settings/api/tool-toggle", {
      keyId: "primary-key",
      toolName: "sandbox_exec",
      enabled: false,
    });
    assert.equal(res.status, 200);
  });
});

// The same Render-like host, but run as root with the per-user isolation the Dockerfile sets up
// and the operator's explicit ENABLE_SANDBOX=true: sandbox tools become available to everyone.
const IS_ROOT = typeof process.getuid === "function" && process.getuid() === 0;
describe(
  "real server on a Render-like host with per-user isolation enabled",
  { skip: !IS_ROOT && "needs root to enforce isolation" },
  () => {
    let b: Booted;
    let c: ReturnType<typeof client>;
    before(async () => {
      b = await bootServer({
        ENABLE_SANDBOX: "true",
        SANDBOX_UID: "10001",
        SANDBOX_GID: "10001",
        SANDBOX_REQUIRE_ISOLATION: "true",
      });
      c = client(b);
    });
    after(async () => b?.stop());

    test("basic sandbox tools are on by default and not locked", async () => {
      const row = await c.toggleRow("/settings?key=primary-key", "sandbox_exec");
      assert.equal(row.present, true);
      assert.equal(row.checked, true);
      assert.equal(row.disabled, false);
    });

    test("a sandbox tool can be turned off and on, and the page agrees after a refresh", async () => {
      for (const enabled of [false, true]) {
        const res = await c.post("/settings/api/tool-toggle", {
          keyId: "primary-key",
          toolName: "sandbox_exec",
          enabled,
        });
        assert.equal(res.status, 200, `enabled=${enabled}`);
        const row = await c.toggleRow("/settings?key=primary-key", "sandbox_exec");
        assert.equal(row.checked, enabled, `after refresh, enabled=${enabled}`);
      }
    });
  },
);
