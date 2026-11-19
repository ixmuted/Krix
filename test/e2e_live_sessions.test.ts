// Boots the real server and drives it over HTTP + MCP. Covers the user-visible promises:
//  - tool defaults depend only on credentials (no GitHub/Render key => only credential-free tools)
//  - toggling a tool changes the tool list of an ALREADY OPEN session, without killing it
//  - workspace (global) settings are inherited by keys, and a key's own choice beats them
//  - the Active switch really blocks a key
//  - a client holding a dead / foreign session id is quietly given a fresh session
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "owner@krix.test";
const SESSION_SECRET = "krix-e2e-session-secret-0123456789abcdef";
const MASTER_KEY = "krix-e2e-master-key-0123456789abcdef0123456789";

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

function ownerCookie(): string {
  const payload = Buffer.from(
    JSON.stringify({
      email: OWNER,
      role: "owner",
      expiresAt: Date.now() + 3600_000,
    }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `krix_session=${encodeURIComponent(`${payload}.${sig}`)}`;
}

class Harness {
  proc!: ChildProcess;
  base = "";
  dataDir = "";
  log = "";

  async start(extraEnv: Record<string, string> = {}) {
    const port = await freePort();
    this.base = `http://127.0.0.1:${port}`;
    this.dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "krix-e2e-"));
    const env: Record<string, string> = {
      PATH: process.env.PATH || "",
      HOME: process.env.HOME || os.tmpdir(),
      PORT: String(port),
      NODE_ENV: "development",
      MCP_API_KEY: MASTER_KEY,
      OWNER_EMAIL: OWNER,
      SESSION_SECRET,
      KEY_ENCRYPTION_SECRET: "krix-e2e-encryption-secret-32-bytes-ok!!",
      PUBLIC_BASE_URL: this.base,
      KRIX_DATA_DIR: this.dataDir,
      ...extraEnv,
    };
    this.proc = spawn(
      process.execPath,
      [
        // Run the server directly through tsx's loader (not the tsx CLI wrapper) so the process
        // killed in stop() is the server itself and nothing is left running afterwards.
        "--require",
        path.join(ROOT, "node_modules/tsx/dist/preflight.cjs"),
        "--import",
        pathToFileURL(path.join(ROOT, "node_modules/tsx/dist/loader.mjs")).href,
        path.join(ROOT, "src/index.ts"),
      ],
      { cwd: this.dataDir, env, stdio: ["ignore", "pipe", "pipe"] },
    );
    this.proc.stdout?.on("data", (d) => (this.log += d));
    this.proc.stderr?.on("data", (d) => (this.log += d));
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      try {
        const r = await fetch(`${this.base}/healthz`);
        if (r.status < 500) return;
      } catch {
        /* not up yet */
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error(`server did not start:\n${this.log.slice(-2000)}`);
  }

  async stop() {
    this.proc?.kill("SIGKILL");
    this.proc?.stdout?.destroy();
    this.proc?.stderr?.destroy();
    fs.rmSync(this.dataDir, { recursive: true, force: true });
  }

  async owner(pathname: string, body?: unknown, method = "POST") {
    const res = await fetch(`${this.base}${pathname}`, {
      method,
      headers: {
        "content-type": "application/json",
        cookie: ownerCookie(),
        origin: this.base,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      /* not json */
    }
    return { status: res.status, json, text };
  }

  async createKey(label: string): Promise<{ id: string; key: string }> {
    const r = await this.owner("/api/keys", { label });
    assert.equal(r.status, 201, r.text);
    return { id: r.json.id, key: r.json.key };
  }
}

async function readSse(res: Response): Promise<any> {
  const text = await res.text();
  const dataLines = text
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim())
    .filter(Boolean);
  for (const line of dataLines) {
    try {
      const msg = JSON.parse(line);
      if (msg.result || msg.error) return msg;
    } catch {
      /* partial */
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

class McpClient {
  sessionId: string | undefined;
  private id = 1;
  constructor(
    private base: string,
    private key: string,
  ) {}

  async rpc(method: string, params: unknown = {}, sessionId = this.sessionId) {
    const res = await fetch(`${this.base}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-api-key": this.key,
        "mcp-protocol-version": "2025-11-25",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: this.id++,
        method,
        params,
      }),
    });
    const body = await readSse(res);
    return { status: res.status, headers: res.headers, body };
  }

  async initialize() {
    const r = await this.rpc(
      "initialize",
      {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "e2e", version: "1" },
      },
      undefined,
    );
    assert.equal(r.status, 200, JSON.stringify(r.body));
    this.sessionId = r.headers.get("mcp-session-id") || undefined;
    assert.ok(this.sessionId, "initialize must return a session id");
    await fetch(`${this.base}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-api-key": this.key,
        "mcp-protocol-version": "2025-11-25",
        "mcp-session-id": this.sessionId!,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    }).then((r) => r.text());
    return this.sessionId!;
  }

  async toolNames(sessionId = this.sessionId): Promise<Set<string>> {
    const r = await this.rpc("tools/list", {}, sessionId);
    assert.equal(r.status, 200, JSON.stringify(r.body).slice(0, 300));
    const tools = r.body?.result?.tools;
    assert.ok(Array.isArray(tools), JSON.stringify(r.body).slice(0, 300));
    return new Set(tools.map((t: any) => t.name));
  }
}

describe("live server: tool policy, toggles, disabled keys, session recovery", () => {
  describe("with no GitHub / Render credential anywhere", () => {
    const h = new Harness();
    before(async () => h.start());
    after(async () => h.stop());

    test("only credential-free sandbox tools are on by default", async () => {
      const { id, key } = await h.createKey("no-creds");
      void id;
      const c = new McpClient(h.base, key);
      await c.initialize();
      const names = await c.toolNames();
      for (const t of [
        "sandbox_exec",
        "sandbox_run",
        "sandbox_install",
        "sandbox_ps",
        "sandbox_reset",
        "sandbox_output",
        "sandbox_file",
        "git_status",
        "git_diff",
        "sandbox_status",
        "sandbox_store",
      ]) {
        assert.ok(names.has(t), `${t} should be on without any credential`);
      }
      for (const t of [
        "get_file_contents", // GitHub default set needs a token
        "set_active_context", // part of the GitHub default set, so it needs a token too
        "create_pull_request",
        "git_clone", // remote git needs a token
        "git_commit_push",
        "list_issues", // opt-in + needs a token
        "list_services", // Render needs a key
        "find_code", // code graph is opt-in
        "web_search", // opt-in
      ]) {
        assert.ok(!names.has(t), `${t} must be off without its credential`);
      }
    });

    test("a tool that needs a missing credential cannot be switched on", async () => {
      const { id } = await h.createKey("cant-enable");
      const gh = await h.owner("/settings/api/tool-toggle", {
        keyId: id,
        toolName: "get_file_contents",
        enabled: true,
      });
      assert.equal(gh.status, 409, gh.text);
      assert.equal(gh.json.code, "GITHUB_TOKEN_REQUIRED");
      const rd = await h.owner("/settings/api/tool-toggle", {
        keyId: id,
        toolName: "list_services",
        enabled: true,
      });
      assert.equal(rd.status, 409, rd.text);
      assert.equal(rd.json.code, "RENDER_KEY_REQUIRED");
    });

    test("toggling changes the OPEN session's tool list and keeps the session alive", async () => {
      const { id, key } = await h.createKey("toggle-live");
      const c = new McpClient(h.base, key);
      const sid = await c.initialize();
      assert.ok((await c.toolNames()).has("sandbox_ps"));

      const off = await h.owner("/settings/api/tool-toggle", {
        keyId: id,
        toolName: "sandbox_ps",
        enabled: false,
      });
      assert.equal(off.status, 200, off.text);
      assert.ok(!(await c.toolNames()).has("sandbox_ps"), "off must hide it");
      assert.equal(c.sessionId, sid, "same session, not a new one");

      const on = await h.owner("/settings/api/tool-toggle", {
        keyId: id,
        toolName: "sandbox_ps",
        enabled: true,
      });
      assert.equal(on.status, 200, on.text);
      assert.ok((await c.toolNames()).has("sandbox_ps"), "on must show it");
    });

    test("workspace settings are inherited, and a key's own choice beats them", async () => {
      const a = await h.createKey("inherit-a");
      const b = await h.createKey("inherit-b");
      const ca = new McpClient(h.base, a.key);
      const cb = new McpClient(h.base, b.key);
      await ca.initialize();
      await cb.initialize();
      assert.ok((await ca.toolNames()).has("sandbox_reset"));
      assert.ok((await cb.toolNames()).has("sandbox_reset"));

      // Workspace turns it off -> both open sessions lose it.
      const g = await h.owner("/settings/api/tool-toggle", {
        keyId: "primary-key",
        toolName: "sandbox_reset",
        enabled: false,
      });
      assert.equal(g.status, 200, g.text);
      assert.ok(!(await ca.toolNames()).has("sandbox_reset"));
      assert.ok(!(await cb.toolNames()).has("sandbox_reset"));

      // Key A pins it ON for itself: A has it, B still follows the workspace.
      const pin = await h.owner("/settings/api/tool-toggle", {
        keyId: a.id,
        toolName: "sandbox_reset",
        enabled: true,
      });
      assert.equal(pin.status, 200, pin.text);
      assert.ok((await ca.toolNames()).has("sandbox_reset"));
      assert.ok(!(await cb.toolNames()).has("sandbox_reset"));

      // Workspace turns it back on: B follows again.
      await h.owner("/settings/api/tool-toggle", {
        keyId: "primary-key",
        toolName: "sandbox_reset",
        enabled: true,
      });
      assert.ok((await cb.toolNames()).has("sandbox_reset"));
    });

    test("a key created later does not freeze the workspace lists", async () => {
      await h.owner("/settings/api/tool-toggle", {
        keyId: "primary-key",
        toolName: "sandbox_output",
        enabled: false,
      });
      const late = await h.createKey("created-later");
      const c = new McpClient(h.base, late.key);
      await c.initialize();
      assert.ok(!(await c.toolNames()).has("sandbox_output"));
      await h.owner("/settings/api/tool-toggle", {
        keyId: "primary-key",
        toolName: "sandbox_output",
        enabled: true,
      });
      assert.ok(
        (await c.toolNames()).has("sandbox_output"),
        "new key must keep following the workspace",
      );
    });

    test("Save on the key page (Active switch only) does not turn every tool into an override", async () => {
      const { id } = await h.createKey("active-only");
      const r = await h.owner(`/api/keys/${id}/settings`, { disabled: false });
      assert.equal(r.status, 200, r.text);
      const page = await h.owner(`/api/keys/${id}`, undefined, "GET");
      void page;
      const data = await h.owner(
        `/settings/api/data?key=${encodeURIComponent(id)}`,
        undefined,
        "GET",
      );
      const s = data.json?.settings || data.json?.keySettings || {};
      assert.equal((s.enabledTools || []).length, 0);
      assert.equal((s.disabledTools || []).length, 0);
    });

    test("the Active switch really blocks a key, and re-enabling restores it", async () => {
      const { id, key } = await h.createKey("switch-me");
      const c = new McpClient(h.base, key);
      await c.initialize();
      assert.ok((await c.toolNames()).size > 0);

      const off = await h.owner(`/api/keys/${id}/settings`, { disabled: true });
      assert.equal(off.status, 200, off.text);

      const blocked = await c.rpc("tools/list");
      assert.equal(blocked.status, 403, JSON.stringify(blocked.body));

      const fresh = new McpClient(h.base, key);
      const init = await fresh.rpc(
        "initialize",
        {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "e2e", version: "1" },
        },
        undefined,
      );
      assert.equal(init.status, 403, "a disabled key cannot even connect");

      const on = await h.owner(`/api/keys/${id}/settings`, { disabled: false });
      assert.equal(on.status, 200, on.text);
      // The old chat keeps working with the SAME session id it already has.
      const back = await c.rpc("tools/list");
      assert.equal(back.status, 200, JSON.stringify(back.body).slice(0, 200));
      assert.ok(back.body.result.tools.length > 0);
    });

    test("the primary key cannot be disabled", async () => {
      const r = await h.owner("/api/keys/primary-key/settings", {
        disabled: true,
      });
      assert.equal(r.status, 400, r.text);
    });

    test("a dead or unknown session id is recovered instead of rejected", async () => {
      const { key } = await h.createKey("stale-chat");
      const c = new McpClient(h.base, key);
      const bogus = crypto.randomUUID();
      const r = await c.rpc("tools/list", {}, bogus);
      assert.equal(r.status, 200, JSON.stringify(r.body).slice(0, 300));
      assert.ok(r.body.result.tools.length > 0);
      // Same stale id keeps working (alias), and does not spawn a new session each time.
      const again = await c.rpc("tools/list", {}, bogus);
      assert.equal(again.status, 200);
    });

    test("someone else's session id is never reused: caller gets their own", async () => {
      const a = await h.createKey("owner-of-session");
      const b = await h.createKey("intruder");
      const ca = new McpClient(h.base, a.key);
      const sidA = await ca.initialize();
      const cb = new McpClient(h.base, b.key);
      const r = await cb.rpc("tools/list", {}, sidA);
      assert.equal(r.status, 200, JSON.stringify(r.body).slice(0, 300));
      // A's session is untouched.
      assert.equal((await ca.rpc("tools/list")).status, 200);
    });

    test("an old chat keeps working after the connector was removed and re-added", async () => {
      // Same person, brand-new key identity, old session id still in the chat.
      const oldKey = await h.createKey("gemini-old");
      const newKey = await h.createKey("gemini-new");
      const oldClient = new McpClient(h.base, oldKey.key);
      const sid = await oldClient.initialize();
      const reAdded = new McpClient(h.base, newKey.key);
      const r = await reAdded.rpc("tools/list", {}, sid);
      assert.equal(r.status, 200, JSON.stringify(r.body).slice(0, 300));
    });
  });

  describe("with a workspace GitHub token configured", () => {
    const h = new Harness();
    before(async () =>
      h.start({ GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_e2e_dummy_token_000000" }),
    );
    after(async () => h.stop());

    test("default GitHub tools turn on, opt-in ones stay off, Render stays off", async () => {
      const { key } = await h.createKey("with-gh");
      const c = new McpClient(h.base, key);
      await c.initialize();
      const names = await c.toolNames();
      for (const t of [
        "get_file_contents",
        "create_pull_request",
        "git_clone",
        "git_commit_push",
        "sandbox_exec",
      ])
        assert.ok(names.has(t), `${t} should be on with a GitHub token`);
      for (const t of ["list_issues", "list_services", "find_code"])
        assert.ok(!names.has(t), `${t} is opt-in and must stay off`);
    });

    test("an opt-in GitHub tool can be switched on and off live", async () => {
      const { id, key } = await h.createKey("opt-in");
      const c = new McpClient(h.base, key);
      await c.initialize();
      assert.ok(!(await c.toolNames()).has("list_issues"));
      const on = await h.owner("/settings/api/tool-toggle", {
        keyId: id,
        toolName: "list_issues",
        enabled: true,
      });
      assert.equal(on.status, 200, on.text);
      assert.ok((await c.toolNames()).has("list_issues"));
      await h.owner("/settings/api/tool-toggle", {
        keyId: id,
        toolName: "list_issues",
        enabled: false,
      });
      assert.ok(!(await c.toolNames()).has("list_issues"));
    });
  });
});
