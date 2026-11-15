// Each sandbox runs as its own unix user. These tests cover:
//  - the uid allocator (stable, collision-free, saved across a restart, bounded, reusable),
//  - the single sandbox policy shared by the UI and the runtime (including Render),
//  - REAL isolation between two users' code, run as root so uid switching actually happens
//    (skipped automatically when the test process is not root).
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const IS_ROOT = typeof process.getuid === "function" && process.getuid() === 0;

// The uid map is saved relative to the working directory: use a throwaway one, never ./data.
const work = fs.mkdtempSync(path.join(os.tmpdir(), "krix-uidtest-"));
// mkdtemp makes it 0700 root-only. Real sandboxes live directly under /tmp, which anyone can
// traverse; without this, an unprivileged sandbox user could not even reach its own absolute path
// and the "permission denied" checks below would pass for the wrong reason.
fs.chmodSync(work, 0o755);
process.chdir(work);
const tmpRoot = path.join(work, "tmp");
fs.mkdirSync(tmpRoot, { mode: 0o755 });
fs.chmodSync(tmpRoot, 0o755);
process.env.TMPDIR = tmpRoot;

const ENV_KEYS = [
  "RENDER",
  "RENDER_SERVICE_ID",
  "ENABLE_SANDBOX",
  "SANDBOX_RENDER_OWNER_ONLY_ACK",
  "SANDBOX_REQUIRE_ISOLATION",
  "SANDBOX_UID",
  "SANDBOX_GID",
  "SANDBOX_UID_BASE",
  "SANDBOX_UID_RANGE",
  "SANDBOX_PER_USER_UID",
  "DISABLE_SANDBOX",
  "DISABLE_SANDBOX_TOOLS",
  "ENABLE_SANDBOX_TOOLS",
  "NODE_ENV",
  "MONGODB_URI",
  "MONGO_URL",
  "DATABASE_URL",
];
const saved: Record<string, string | undefined> = {};
function setEnv(vars: Record<string, string | undefined>): void {
  for (const k of ENV_KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(vars)) if (v !== undefined) process.env[k] = v;
}

const identity = await import("../src/sandboxIdentity.js");
const proc = await import("../src/sandboxProc.js");
const security = await import("../src/security.js");

before(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
});
after(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  process.chdir(os.tmpdir());
  fs.rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe("sandbox uid allocator", () => {
  test("finds the sandbox inside a path, from any of several paths", () => {
    assert.deepEqual(identity.sandboxFromPath("/tmp/krix_sbx_abc123/proj/x"), {
      root: "/tmp/krix_sbx_abc123",
      id: "abc123",
    });
    assert.equal(identity.sandboxIdFromPath("/", "/tmp/krix_sbx_owner/.home"), "owner");
    assert.equal(identity.sandboxIdFromPath("/usr/bin", undefined), undefined);
    assert.equal(identity.sandboxIdFromPath("/tmp/krix_sbx_"), undefined);
  });

  test("is stable, distinct per sandbox, and inside the configured pool", () => {
    setEnv({ SANDBOX_UID_BASE: "30000", SANDBOX_UID_RANGE: "1000" });
    identity._resetSandboxIdentitiesForTests();
    const a1 = identity.allocateSandboxUid("alice");
    const b = identity.allocateSandboxUid("bob");
    const a2 = identity.allocateSandboxUid("alice");
    assert.equal(a1.uid, a2.uid, "same sandbox keeps the same uid");
    assert.notEqual(a1.uid, b.uid, "different sandboxes never share a uid");
    assert.equal(a1.gid, a1.uid, "group is private to the user too");
    for (const u of [a1.uid, b.uid]) assert.ok(u >= 30000 && u < 31000, String(u));
  });

  test("never hands one uid to two sandboxes, even when the pool is nearly full", () => {
    setEnv({ SANDBOX_UID_BASE: "40000", SANDBOX_UID_RANGE: "7" });
    identity._resetSandboxIdentitiesForTests();
    const seen = new Set<number>();
    for (let i = 0; i < 7; i++) seen.add(identity.allocateSandboxUid(`user-${i}`).uid);
    assert.equal(seen.size, 7, "7 sandboxes, 7 different uids, every slot used");
    assert.throws(() => identity.allocateSandboxUid("one-too-many"), /No free sandbox user id/);
  });

  test("a released slot can be reused", () => {
    setEnv({ SANDBOX_UID_BASE: "40000", SANDBOX_UID_RANGE: "2" });
    identity._resetSandboxIdentitiesForTests();
    identity.allocateSandboxUid("x");
    identity.allocateSandboxUid("y");
    assert.throws(() => identity.allocateSandboxUid("z"));
    assert.ok(identity.releaseSandboxUid("x") !== undefined);
    assert.doesNotThrow(() => identity.allocateSandboxUid("z"));
  });

  test("the shared fallback uid (SANDBOX_UID) is never given to a sandbox", () => {
    setEnv({ SANDBOX_UID_BASE: "50000", SANDBOX_UID_RANGE: "3", SANDBOX_UID: "50001" });
    identity._resetSandboxIdentitiesForTests();
    const uids = ["p", "q"].map((n) => identity.allocateSandboxUid(n).uid);
    assert.ok(!uids.includes(50001));
  });

  test("the mapping is saved and survives a restart", () => {
    setEnv({ SANDBOX_UID_BASE: "20000", SANDBOX_UID_RANGE: "40000" });
    identity._resetSandboxIdentitiesForTests();
    const before = identity.allocateSandboxUid("survivor").uid;
    const file = path.join(work, "data", ".krix_sandbox_uids.json");
    assert.ok(fs.existsSync(file), "map file written");
    assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).map.survivor, before);
    identity._resetSandboxIdentitiesForTests({ reload: true }); // "restart"
    assert.equal(identity.allocateSandboxUid("survivor").uid, before);
  });
});

describe("sandbox policy (shared by the Settings UI and the runtime)", () => {
  const policy = (vars: Record<string, string | undefined>) => {
    setEnv(vars);
    proc._resetIsolationForTests();
    return proc.sandboxPolicy();
  };

  test("Render with nothing set: off, and the reason says how to turn it on", () => {
    const p = policy({ RENDER: "true" });
    assert.equal(p.allowed, false);
    assert.match(p.reason!, /ENABLE_SANDBOX/);
  });

  test("Render with ENABLE_SANDBOX but no real isolation: still off", () => {
    const p = policy({ RENDER: "true", ENABLE_SANDBOX: "true" });
    assert.equal(p.allowed, false);
  });

  test("Render legacy owner-only opt-in is still honoured and labelled as unisolated", () => {
    const p = policy({
      RENDER: "true",
      ENABLE_SANDBOX: "true",
      SANDBOX_RENDER_OWNER_ONLY_ACK: "true",
      SANDBOX_REQUIRE_ISOLATION: "false",
    });
    assert.equal(p.allowed, true);
    assert.equal(p.mode, "owner-only");
  });

  test("an operator kill-switch always wins", () => {
    for (const v of [
      { DISABLE_SANDBOX: "true" },
      { DISABLE_SANDBOX_TOOLS: "true" },
      { ENABLE_SANDBOX_TOOLS: "false" },
    ]) {
      const p = policy({
        RENDER: "true",
        ENABLE_SANDBOX: "true",
        SANDBOX_RENDER_OWNER_ONLY_ACK: "true",
        SANDBOX_REQUIRE_ISOLATION: "false",
        ...v,
      });
      assert.equal(p.allowed, false, JSON.stringify(v));
    }
  });

  test("production off Render without isolation fails closed, dev does not", () => {
    assert.equal(policy({ NODE_ENV: "production" }).allowed, false);
    assert.equal(policy({ NODE_ENV: "production", SANDBOX_REQUIRE_ISOLATION: "false" }).allowed, true);
    assert.equal(policy({}).allowed, true);
  });

  test("assertSandboxAllowed throws the policy's reason", () => {
    policy({ RENDER: "true" });
    assert.throws(() => proc.assertSandboxAllowed(), /Render/);
  });

  test(
    "Render + ENABLE_SANDBOX + root with SANDBOX_UID: allowed, isolated, for everyone",
    { skip: !IS_ROOT && "needs root to enforce isolation" },
    () => {
      const p = policy({
        RENDER: "true",
        ENABLE_SANDBOX: "true",
        SANDBOX_UID: "10001",
        SANDBOX_GID: "10001",
        SANDBOX_REQUIRE_ISOLATION: "true",
      });
      assert.equal(p.allowed, true);
      assert.equal(p.mode, "isolated");
    },
  );

  test(
    "Render + root + SANDBOX_UID but ENABLE_SANDBOX unset: still off (operator must opt in)",
    { skip: !IS_ROOT && "needs root to enforce isolation" },
    () => {
      const p = policy({ RENDER: "true", SANDBOX_UID: "10001", SANDBOX_GID: "10001" });
      assert.equal(p.allowed, false);
    },
  );
});

describe(
  "two users' code really cannot reach each other (real uid switching)",
  { skip: !IS_ROOT && "needs root to switch users" },
  () => {
    const rootOf = (id: string) => security.sandboxRootForAuthKey(id);
    const run = (root: string, cmd: string) =>
      proc.runShell(cmd, {
        cwd: root,
        env: proc.buildSandboxEnv(root),
        timeoutMs: 15000,
      });
    let alice = "";
    let bob = "";

    before(async () => {
      setEnv({ SANDBOX_UID: "10001", SANDBOX_GID: "10001", NODE_ENV: "production" });
      proc._resetIsolationForTests();
      identity._resetSandboxIdentitiesForTests();
      alice = rootOf("alice00000000001");
      bob = rootOf("bob0000000000002");
      await proc.ensureSandboxRoot(alice);
      await proc.ensureSandboxRoot(bob);
    });

    test("each sandbox runs as its own user and group, with no extra groups", async () => {
      const a = (await run(alice, "id -u; id -G")).stdout.trim().split("\n");
      const b = (await run(bob, "id -u; id -G")).stdout.trim().split("\n");
      assert.notEqual(a[0], b[0], "different uids");
      assert.notEqual(a[0], "0");
      assert.equal(a[1], a[0], "only its own private group");
      assert.equal(fs.statSync(alice).uid, Number(a[0]), "folder owned by that user");
      assert.equal(fs.statSync(alice).mode & 0o777, 0o700);
    });

    test("user B cannot list, read or write user A's sandbox", async () => {
      await run(alice, "echo ALICE-PRIVATE > secret.txt");
      assert.equal((await run(alice, "cat secret.txt")).stdout.trim(), "ALICE-PRIVATE");
      // The path itself is reachable (A uses it), so B's denial comes from ownership, not routing.
      assert.equal((await run(alice, `cat ${alice}/secret.txt`)).stdout.trim(), "ALICE-PRIVATE");
      const read = await run(bob, `cat ${alice}/secret.txt 2>&1`);
      assert.match(read.stdout, /Permission denied/);
      assert.ok(!read.stdout.includes("ALICE-PRIVATE"));
      const list = await run(bob, `ls ${alice} 2>&1`);
      assert.match(list.stdout, /Permission denied/);
      await run(bob, `echo pwned > ${alice}/pwn.txt 2>&1`);
      assert.ok(!fs.existsSync(path.join(alice, "pwn.txt")));
    });

    test("sandbox code cannot read the server's environment through /proc", async () => {
      process.env.KRIX_TEST_SERVER_SECRET = "do-not-leak";
      const r = await run(alice, `cat /proc/${process.pid}/environ 2>&1 | head -c 200`);
      assert.ok(!r.stdout.includes("do-not-leak"));
      assert.match(r.stdout, /Permission denied/);
      delete process.env.KRIX_TEST_SERVER_SECRET;
    });

    test("user B cannot signal user A's processes", async () => {
      const bg = proc.spawnShell("sleep 30 && echo alice-bg", {
        cwd: alice,
        env: proc.buildSandboxEnv(alice),
      });
      await new Promise((r) => setTimeout(r, 300));
      const r = await run(bob, `pkill -f 'sleep 30' 2>&1; echo $?`);
      assert.match(r.stdout, /not permitted|1/);
      assert.equal(bg.exitCode, null, "A's process is still alive");
      proc.killTree(bg);
    });

    test("the server's own file helpers act as the owning user", async () => {
      await proc.sbxWriteText(bob, path.join(bob, "note.txt"), "hello bob", false);
      assert.equal(fs.statSync(path.join(bob, "note.txt")).uid, fs.statSync(bob).uid);
      assert.equal(await proc.sbxReadText(bob, path.join(bob, "note.txt"), 1000), "hello bob");
      // alice's helper cannot be pointed at bob's file
      await assert.rejects(proc.sbxReadText(alice, path.join(bob, "note.txt"), 1000));
    });

    test("an existing sandbox owned by the old shared uid is handed to its own user on first use", async () => {
      const legacy = rootOf("legacy000000000003");
      fs.mkdirSync(path.join(legacy, "proj"), { recursive: true });
      fs.writeFileSync(path.join(legacy, "proj", "f.txt"), "old data");
      for (const p of [legacy, path.join(legacy, "proj"), path.join(legacy, "proj", "f.txt")])
        fs.chownSync(p, 10001, 10001);
      const r = await run(legacy, "cat proj/f.txt");
      assert.equal(r.stdout, "old data");
      assert.notEqual(fs.statSync(path.join(legacy, "proj", "f.txt")).uid, 10001);
    });

    test("destroying a sandbox frees its uid and purges what it left in /tmp", async () => {
      const gone = rootOf("gone0000000000004");
      await proc.ensureSandboxRoot(gone);
      const uid = identity.allocateSandboxUid("gone0000000000004").uid;
      const stray = path.join("/tmp", `krix_uidtest_stray_${process.pid}`);
      fs.writeFileSync(stray, "x");
      fs.chownSync(stray, uid, uid);
      await proc.releaseSandboxIdentity(gone);
      assert.ok(!fs.existsSync(stray), "leftover file owned by the released uid is gone");
      fs.rmSync(stray, { force: true });
    });
  },
);
