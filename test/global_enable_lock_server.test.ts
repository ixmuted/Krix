// End-to-end check of the global enable lock against a real server process: the lock endpoint
// records what each existing key already has, keys created afterwards do not pick up global
// enables, the per-key choice overrides the workspace, and a global DISABLE still reaches a
// locked key. (A fake workspace GitHub token is provided through the environment because the
// "add credential" endpoint validates tokens against GitHub, which tests cannot reach.)
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
const SESSION_SECRET = "krix-lock-session-secret-0123456789abcdefghij";
const MASTER_KEY = "krix-lock-master-key-0123456789abcdef0123456789";

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
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "krix-lock-"));
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
        KEY_ENCRYPTION_SECRET: "krix-lock-encryption-secret-32-bytes!!!!!",
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

describe("global enable lock on a real server", () => {
  let b: Booted;
  before(async () => {
    b = await bootServer({ GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_fakeWorkspaceTokenForTests0123456789" });
  });
  after(async () => b?.stop());

  const post = (p: string, body: unknown) =>
    fetch(`${b.base}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: b.cookie, Origin: b.base },
      body: JSON.stringify(body),
    });
  const createKey = async (label: string): Promise<string> => {
    const res = await post("/api/keys", { label });
    assert.equal(res.status, 201, await res.clone().text());
    return ((await res.json()) as any).id;
  };
  // Reads one tool row off a key's settings page.
  const keyRow = async (keyId: string, tool: string) => {
    const html = await (
      await fetch(`${b.base}/api/settings?key=${encodeURIComponent(keyId)}`, {
        headers: { Cookie: b.cookie },
      })
    ).text();
    const row = html.split(`value="${tool}"`)[1]?.split("</label>")[0] || "";
    const meta = html.split(`value="${tool}"`)[0].split('class="list-meta"').pop() || "";
    return {
      checked: /^\s*checked/.test(row),
      disabled: /\sdisabled/.test(row.split("onchange")[0]),
      skipped: meta.includes("On globally, not applied to this key"),
    };
  };

  test("existing key keeps its tools when the lock goes on; keys made afterwards do not get them", async () => {
    const before = await createKey("Before lock");
    assert.equal((await keyRow(before, "get_me")).checked, true, "default GitHub tool is on");

    const lock = await post("/settings/api/global-lock", { locked: true });
    assert.equal(lock.status, 200);
    const lockData = (await lock.json()) as any;
    assert.equal(lockData.locked, true);
    assert.ok(lockData.updatedKeys >= 1);
    assert.equal((await keyRow(before, "get_me")).checked, true, "kept what it already had");

    const afterLock = await createKey("After lock");
    const row = await keyRow(afterLock, "get_me");
    assert.equal(row.checked, false, "a new key does not inherit the GitHub defaults");
    assert.equal(row.skipped, true, "and says why");
    assert.equal((await keyRow(afterLock, "sandbox_status")).checked, true, "credential-free defaults stay");

    // The page reports the lock and offers the per-key choice.
    const settings = await (await fetch(`${b.base}/settings`, { headers: { Cookie: b.cookie } })).text();
    assert.ok(settings.includes('data-locked="true"'));
    const keyPage = await (
      await fetch(`${b.base}/api/settings?key=${encodeURIComponent(afterLock)}`, { headers: { Cookie: b.cookie } })
    ).text();
    assert.ok(keyPage.includes('id="globalModeBtn"'));
    assert.ok(keyPage.includes("Locked by workspace"));
  });

  test("a key can opt in or out on its own, and 'follow' goes back to the workspace", async () => {
    const k = await createKey("Opt in key");
    assert.equal((await keyRow(k, "get_me")).checked, false);
    assert.equal((await post("/settings/api/key-global-mode", { keyId: k, mode: "accept" })).status, 200);
    assert.equal((await keyRow(k, "get_me")).checked, true, "accepting brings the global defaults in");
    assert.equal((await post("/settings/api/key-global-mode", { keyId: k, mode: "follow" })).status, 200);
    // Going back to a locked workspace freezes the key as it is: it keeps what it has now.
    assert.equal((await keyRow(k, "get_me")).checked, true, "keeps what it had when it stopped accepting");
    assert.equal((await keyRow(k, "list_issues")).checked, false, "opt-in tools were never on");

    const bad = await post("/settings/api/key-global-mode", { keyId: k, mode: "nonsense" });
    assert.equal(bad.status, 400);
    const ws = await post("/settings/api/key-global-mode", { keyId: "primary-key", mode: "block" });
    assert.equal(ws.status, 400, "the workspace key has no per-key choice");
    const stranger = await post("/settings/api/key-global-mode", { keyId: "not-my-key", mode: "block" });
    assert.equal(stranger.status, 403);
  });

  test("a global DISABLE does not turn off a tool on a protected key", async () => {
    const survivor = await createKey("Survivor key");
    // Make it a key that had the tool through inheritance, then stop accepting.
    await post("/settings/api/key-global-mode", { keyId: survivor, mode: "accept" });
    assert.equal((await keyRow(survivor, "get_me")).checked, true);
    await post("/settings/api/key-global-mode", { keyId: survivor, mode: "block" });
    assert.equal((await keyRow(survivor, "get_me")).checked, true, "baseline kept");

    const off = await post("/settings/api/tool-toggle", { keyId: "primary-key", toolName: "get_me", enabled: false });
    assert.equal(off.status, 200);
    assert.equal((await keyRow(survivor, "get_me")).checked, true, "global off is blocked on protected key");
    await post("/settings/api/tool-toggle", { keyId: "primary-key", toolName: "get_me", enabled: true });
  });

  test("unlocking makes keys follow the workspace again", async () => {
    const res = await post("/settings/api/global-lock", { locked: false });
    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as any).locked, false);
    const k = await createKey("Unlocked key");
    assert.equal((await keyRow(k, "get_me")).checked, true);
    const bad = await post("/settings/api/global-lock", { locked: "yes" });
    assert.equal(bad.status, 400);
  });
});
