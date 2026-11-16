import { execFile, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { scrubbedBaseEnv } from "./security.js";
import {
  allocateSandboxUid,
  ensureSandboxIdentitiesLoaded,
  perUserUidEnabled,
  releaseSandboxUid,
  sandboxFromPath,
} from "./sandboxIdentity.js";

/**
 * Process runner for the sandbox. Design rules:
 *  1. Never build shell strings from untrusted values — callers pass argv arrays.
 *  2. Children get a scrubbed environment (no server secrets).
 *  3. When SANDBOX_UID/SANDBOX_GID are set and the server runs as root, every child (and every file
 *     operation, which is done by a child too) runs as an unprivileged user, so sandboxed code can
 *     neither read the server's memory/environment (/proc/<pid>/environ) nor plant symlinks that a
 *     privileged server process would follow. Each sandbox gets its OWN uid/gid (see
 *     sandboxIdentity.ts), so one user's code also cannot touch another user's sandbox.
 *  4. Timeouts kill the whole process group, not just the direct child.
 */

export interface Isolation {
  enforced: boolean;
  uid?: number;
  gid?: number;
  reason?: string;
}

let cachedIsolation: Isolation | undefined;

export function getIsolation(): Isolation {
  if (cachedIsolation) return cachedIsolation;
  const isRoot = typeof process.getuid === "function" && process.getuid() === 0;
  const uidRaw = process.env.SANDBOX_UID;
  const gidRaw = process.env.SANDBOX_GID ?? uidRaw;
  const uid = Number(uidRaw);
  const gid = Number(gidRaw);
  if (
    uidRaw &&
    Number.isInteger(uid) &&
    uid > 0 &&
    Number.isInteger(gid) &&
    gid > 0
  ) {
    cachedIsolation = isRoot
      ? { enforced: true, uid, gid }
      : {
          enforced: false,
          reason:
            "SANDBOX_UID is set but the server is not running as root, so it cannot switch users.",
        };
  } else {
    cachedIsolation = {
      enforced: false,
      reason: "SANDBOX_UID/SANDBOX_GID are not set.",
    };
  }
  return cachedIsolation;
}

function isolationRequired(): boolean {
  const flag = process.env.SANDBOX_REQUIRE_ISOLATION;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "production";
}

export interface SandboxPolicy {
  allowed: boolean;
  /** Why it is not allowed (shown to the operator / in tool errors). */
  reason?: string;
  /**
   * "isolated": code runs as unprivileged per-sandbox users, safe for many users.
   * "owner-only": the legacy Render opt-in with NO isolation; code can read server secrets.
   */
  mode?: "isolated" | "owner-only" | "unisolated-dev";
}

function onRender(): boolean {
  return process.env.RENDER === "true" || !!process.env.RENDER_SERVICE_ID;
}

/**
 * The single decision about whether sandbox tools may run in this deployment. The server's
 * Settings pages and every sandbox tool use it, so the UI can never offer a switch the runtime
 * would refuse (that used to look like "toggle succeeds, then turns off after a refresh").
 */
export function sandboxPolicy(): SandboxPolicy {
  const env = process.env;
  if (
    env.DISABLE_SANDBOX === "true" ||
    env.DISABLE_SANDBOX === "1" ||
    env.DISABLE_SANDBOX_TOOLS === "true" ||
    env.ENABLE_SANDBOX_TOOLS === "false"
  ) {
    return {
      allowed: false,
      reason:
        "Sandbox tools are switched off by the operator (DISABLE_SANDBOX / DISABLE_SANDBOX_TOOLS / ENABLE_SANDBOX_TOOLS=false).",
    };
  }
  const iso = getIsolation();

  if (onRender()) {
    // Preferred: the Docker image runs as root with SANDBOX_UID/GID set, so every sandbox runs as
    // its own unprivileged user. Still needs an explicit ENABLE_SANDBOX=true from the operator.
    if (
      env.ENABLE_SANDBOX === "true" &&
      iso.enforced &&
      env.SANDBOX_REQUIRE_ISOLATION !== "false"
    ) {
      return { allowed: true, mode: "isolated" };
    }
    // Legacy: explicitly acknowledged, owner-only, NO isolation.
    if (
      env.ENABLE_SANDBOX === "true" &&
      env.SANDBOX_RENDER_OWNER_ONLY_ACK === "true" &&
      env.SANDBOX_REQUIRE_ISOLATION === "false"
    ) {
      return { allowed: true, mode: "owner-only" };
    }
    return {
      allowed: false,
      reason:
        "Sandbox execution on Render is off. To allow it for all users with per-user isolation, deploy the Docker image (it runs as root and sets SANDBOX_UID/SANDBOX_GID) and set ENABLE_SANDBOX=true. For unisolated owner-only use you must set ENABLE_SANDBOX=true, SANDBOX_RENDER_OWNER_ONLY_ACK=true and SANDBOX_REQUIRE_ISOLATION=false.",
    };
  }

  if (iso.enforced) return { allowed: true, mode: "isolated" };
  if (!isolationRequired()) return { allowed: true, mode: "unisolated-dev" };
  return {
    allowed: false,
    reason:
      `Sandbox disabled: OS-level isolation is not active (${iso.reason}). ` +
      "Run the server as root with SANDBOX_UID/SANDBOX_GID set to an unprivileged user (the provided Dockerfile does this), " +
      "or explicitly accept the risk with SANDBOX_REQUIRE_ISOLATION=false.",
  };
}

/** Throws unless the sandbox may run in the current deployment (fail closed in production). */
export function assertSandboxAllowed(): void {
  const policy = sandboxPolicy();
  if (!policy.allowed) throw new Error(policy.reason);
}

export function logIsolationStatus(): void {
  const iso = getIsolation();
  const policy = sandboxPolicy();
  if (iso.enforced) {
    console.log(
      perUserUidEnabled()
        ? `🔒 Sandbox isolation active: every sandbox runs as its own user (uid pool from SANDBOX_UID_BASE; ${iso.uid} is the unscoped fallback).`
        : `🔒 Sandbox isolation active (shared uid=${iso.uid}, gid=${iso.gid}; SANDBOX_PER_USER_UID=false so users are NOT separated from each other).`,
    );
  } else {
    console.warn(
      `⚠️  Sandbox isolation NOT active: ${iso.reason} ${isolationRequired() ? "Sandbox tools are disabled (fail-closed)." : "Sandboxed code can read this server's secrets via /proc. Set SANDBOX_UID/SANDBOX_GID and run as root in a container."}`,
    );
  }
  if (policy.allowed && policy.mode === "owner-only") {
    console.warn(
      "⚠️  Sandbox is in the legacy Render owner-only mode: NO isolation, and nothing stops other key holders from running code. Use the isolated mode (root + SANDBOX_UID/GID + ENABLE_SANDBOX=true) instead.",
    );
  }
}

/** Test helper: forget the cached isolation decision after changing process.env. */
export function _resetIsolationForTests(): void {
  cachedIsolation = undefined;
  verifiedOwner.clear();
}

type Ident = { uid?: number; gid?: number };

/**
 * The unix identity a child should run as. With per-user ids this is derived from the sandbox
 * the child works in (its cwd / HOME / TMPDIR sit inside `<tmp>/krix_sbx_<id>`); anything that is
 * not inside a sandbox runs as the shared fallback uid, which owns no sandbox directory.
 */
function identityOpts(...paths: Array<string | undefined>): Ident {
  const iso = getIsolation();
  if (!iso.enforced) return {};
  if (!perUserUidEnabled()) return { uid: iso.uid, gid: iso.gid };
  const sbx = sandboxFromPath(...paths);
  if (!sbx) return { uid: iso.uid, gid: iso.gid };
  return allocateSandboxUid(sbx.id);
}

// Sandbox roots whose ownership was already verified for a given uid (cleared on destroy).
const verifiedOwner = new Map<string, number>();

function execAsServer(file: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout: 120000 }, (err, _out, stderr) =>
      err ? reject(new Error((stderr || err.message).trim().slice(0, 300))) : resolve(),
    );
  });
}

/**
 * Hand a whole sandbox tree to its user. Used once when a sandbox that already exists (created
 * before per-user ids, or under a different uid) is first used. `-h` changes symlinks themselves
 * and `-R` does not follow them, so a symlink planted inside a sandbox cannot redirect it.
 */
async function chownTree(root: string, uid: number, gid: number): Promise<void> {
  await execAsServer("chown", ["-R", "-h", "--", `${uid}:${gid}`, root]);
  await fs.chmod(root, 0o700).catch(() => {});
}

/** Make sure an existing sandbox root belongs to its own user. No-op if it does not exist yet. */
async function ensureOwnership(root: string, uid: number, gid: number): Promise<void> {
  if (verifiedOwner.get(root) === uid) return;
  let st;
  try {
    st = await fs.lstat(root);
  } catch {
    return; // ensureSandboxRoot creates it with the right owner
  }
  if (st.isSymbolicLink() || !st.isDirectory())
    throw new Error("Security Violation: the sandbox root is not a real directory.");
  if (st.uid !== uid || st.gid !== gid) await chownTree(root, uid, gid);
  verifiedOwner.set(root, uid);
}

/** Resolve (and if needed migrate) the identity a sandbox must run as, before spawning in it. */
async function prepareIdentity(...paths: Array<string | undefined>): Promise<void> {
  const iso = getIsolation();
  if (!iso.enforced || !perUserUidEnabled()) return;
  const sbx = sandboxFromPath(...paths);
  if (!sbx) return;
  await ensureSandboxIdentitiesLoaded();
  const { uid, gid } = allocateSandboxUid(sbx.id);
  await ensureOwnership(sbx.root, uid, gid);
}

/**
 * Called when a sandbox is destroyed: free its uid for reuse, after deleting anything that uid
 * left behind in shared temp directories so the next sandbox to get the number inherits nothing.
 */
export async function releaseSandboxIdentity(root: string): Promise<void> {
  verifiedOwner.delete(root);
  const sbx = sandboxFromPath(root);
  if (!sbx) return;
  const uid = releaseSandboxUid(sbx.id);
  if (uid === undefined || !getIsolation().enforced) return;
  await execAsServer("find", [
    "/tmp",
    "/var/tmp",
    "/dev/shm",
    "-xdev",
    "-uid",
    String(uid),
    "-delete",
  ]).catch(() => {});
}

const DEFAULT_MAX_OUTPUT = 4 * 1024 * 1024;

// Shell resource limits (soft caps; failures to lower limits are ignored).
const LIMITS_PREFIX =
  "ulimit -c 0 2>/dev/null; ulimit -f 1048576 2>/dev/null; ulimit -n 4096 2>/dev/null; ulimit -u 2048 2>/dev/null\n";

export function buildLimitsPrefix(
  ulimitFile = 1048576,
  ulimitProc = 2048,
): string {
  return `ulimit -c 0 2>/dev/null; ulimit -f ${ulimitFile} 2>/dev/null; ulimit -n 4096 2>/dev/null; ulimit -u ${ulimitProc} 2>/dev/null\n`;
}

export interface RunOptions {
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  input?: string | Buffer;
  maxOutputBytes?: number;
  ulimitPrefix?: string;
}

export interface RunResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  /** Raw stdout bytes (use for binary-safe reads). */
  stdoutBuffer: Buffer;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  truncated: boolean;
  spawnError?: string;
}

export function killTree(child: ChildProcess | number | undefined): void {
  const pid = typeof child === "number" ? child : child?.pid;
  if (!pid) return;
  try {
    process.kill(-pid, "SIGKILL");
    return;
  } catch {}
  try {
    process.kill(pid, "SIGKILL");
  } catch {}
}

export async function runProc(
  file: string,
  args: string[],
  opts: RunOptions,
): Promise<RunResult> {
  try {
    await prepareIdentity(opts.cwd, opts.env?.HOME, opts.env?.TMPDIR);
  } catch (e: any) {
    return {
      code: null,
      signal: null,
      stdoutBuffer: Buffer.alloc(0),
      stdout: "",
      stderr: "",
      timedOut: false,
      truncated: false,
      spawnError: e?.message || String(e),
    };
  }
  return runProcNow(file, args, opts);
}

function runProcNow(
  file: string,
  args: string[],
  opts: RunOptions,
): Promise<RunResult> {
  return new Promise((resolve) => {
    const cap = opts.maxOutputBytes ?? DEFAULT_MAX_OUTPUT;
    let child: ChildProcess;
    try {
      child = spawn(file, args, {
        cwd: opts.cwd,
        env: opts.env,
        detached: true,
        stdio: [opts.input !== undefined ? "pipe" : "ignore", "pipe", "pipe"],
        ...identityOpts(opts.cwd, opts.env?.HOME, opts.env?.TMPDIR),
      });
    } catch (e: any) {
      resolve({
        code: null,
        signal: null,
        stdoutBuffer: Buffer.alloc(0),
        stdout: "",
        stderr: "",
        timedOut: false,
        truncated: false,
        spawnError: e?.message || String(e),
      });
      return;
    }

    const out: Buffer[] = [];
    const err: Buffer[] = [];
    let outBytes = 0;
    let errBytes = 0;
    let timedOut = false;
    let truncated = false;
    let settled = false;

    const timer = setTimeout(
      () => {
        timedOut = true;
        killTree(child);
      },
      Math.max(1, opts.timeoutMs),
    );

    const take = (list: Buffer[], size: number, chunk: Buffer): number => {
      if (size >= cap) {
        truncated = true;
        killTree(child);
        return size;
      }
      const room = cap - size;
      list.push(chunk.length > room ? chunk.subarray(0, room) : chunk);
      if (chunk.length > room) {
        truncated = true;
        killTree(child);
      }
      return size + Math.min(chunk.length, room);
    };
    child.stdout?.on("data", (c: Buffer) => {
      outBytes = take(out, outBytes, c);
    });
    child.stderr?.on("data", (c: Buffer) => {
      errBytes = take(err, errBytes, c);
    });

    const finish = (
      code: number | null,
      signal: NodeJS.Signals | null,
      spawnError?: string,
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Reap any stragglers left in the process group.
      if (child.pid) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {}
      }
      const stdoutBuffer = Buffer.concat(out);
      resolve({
        code,
        signal,
        stdoutBuffer,
        stdout: stdoutBuffer.toString("utf8"),
        stderr: Buffer.concat(err).toString("utf8"),
        timedOut,
        truncated,
        spawnError,
      });
    };
    child.on("error", (e) => finish(null, null, e.message));
    child.on("close", (code, signal) => finish(code, signal));

    if (opts.input !== undefined && child.stdin) {
      child.stdin.on("error", () => {});
      child.stdin.end(opts.input);
    }
  });
}

/** Run a shell snippet (the *only* place a shell is used) with resource limits applied. */
export function runShell(cmd: string, opts: RunOptions): Promise<RunResult> {
  const prefix = opts.ulimitPrefix || LIMITS_PREFIX;
  return runProc(
    "/bin/bash",
    ["--noprofile", "--norc", "-c", prefix + cmd],
    opts,
  );
}

/** Spawn a detached background shell command; the caller owns the ChildProcess. */
export function spawnShell(
  cmd: string,
  opts: { cwd: string; env: NodeJS.ProcessEnv },
): ChildProcess {
  return spawn(
    "/bin/bash",
    ["--noprofile", "--norc", "-c", LIMITS_PREFIX + cmd],
    {
      cwd: opts.cwd,
      env: opts.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      ...identityOpts(opts.cwd, opts.env?.HOME, opts.env?.TMPDIR),
    },
  );
}

/** Spawn the long-lived interactive shell used by sandbox_exec(persistent:true). */
export function spawnPersistentShell(opts: {
  cwd: string;
  env: NodeJS.ProcessEnv;
}): ChildProcess {
  const proc = spawn("/bin/bash", ["--noprofile", "--norc"], {
    cwd: opts.cwd,
    env: opts.env,
    detached: true,
    stdio: ["pipe", "pipe", "pipe"],
    ...identityOpts(opts.cwd, opts.env?.HOME, opts.env?.TMPDIR),
  });
  proc.stdin?.on("error", () => {});
  proc.stderr?.resume();
  proc.stdin?.write(LIMITS_PREFIX);
  return proc;
}

// ---------------------------------------------------------------------------------------------
// Environment for sandboxed code
// ---------------------------------------------------------------------------------------------

export function sandboxHome(root: string): string {
  return path.join(root, ".home");
}
export function sandboxTmp(root: string): string {
  return path.join(root, ".tmp");
}

export function buildSandboxEnv(
  root: string,
  userEnv?: Record<string, string>,
): NodeJS.ProcessEnv {
  const home = sandboxHome(root);
  return {
    ...scrubbedBaseEnv(),
    HOME: home,
    TMPDIR: sandboxTmp(root),
    npm_config_cache: path.join(home, ".npm"),
    XDG_CACHE_HOME: path.join(home, ".cache"),
    PIP_CACHE_DIR: path.join(home, ".cache", "pip"),
    UV_CACHE_DIR: path.join(home, ".cache", "uv"),
    GOCACHE: path.join(home, ".cache", "go-build"),
    BUN_INSTALL_CACHE_DIR: path.join(home, ".cache", "bun"),
    PIP_DISABLE_PIP_VERSION_CHECK: "1",
    PYTHONDONTWRITEBYTECODE: "1",
    NODE_OPTIONS: userEnv?.NODE_OPTIONS || "--max-old-space-size=400",
    ...(userEnv || {}),
  };
}

/**
 * Environment for git child processes. The GitHub credential is passed as an in-memory config entry
 * scoped to https://github.com/ only — it never appears on a command line or in .git/config, and is
 * never sent to any other host even if a repo's config is tampered with.
 */
export function scrubbedEnvForGit(
  root: string,
  token?: string,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...scrubbedBaseEnv(),
    HOME: sandboxHome(root),
    TMPDIR: sandboxTmp(root),
    GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_ALLOW_PROTOCOL: "https",
    GIT_OPTIONAL_LOCKS: "0",
  };
  if (token) {
    env.GIT_CONFIG_COUNT = "1";
    env.GIT_CONFIG_KEY_0 = "http.https://github.com/.extraHeader";
    env.GIT_CONFIG_VALUE_0 = `Authorization: Basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`;
  }
  return env;
}

/** Create (once) a sandbox root owned by its own sandbox user, with private home and tmp dirs. */
export async function ensureSandboxRoot(root: string): Promise<void> {
  const iso = getIsolation();
  let ident: { uid: number; gid: number } | undefined;
  if (iso.enforced) {
    const sbx = perUserUidEnabled() ? sandboxFromPath(root) : undefined;
    if (sbx) {
      await ensureSandboxIdentitiesLoaded();
      ident = allocateSandboxUid(sbx.id);
    } else {
      ident = { uid: iso.uid!, gid: iso.gid! };
    }
  }
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  for (const sub of [sandboxHome(root), sandboxTmp(root)]) {
    await fs.mkdir(sub, { recursive: true, mode: 0o700 });
  }
  if (ident) {
    // lstat/lchown, never chown: a symlink swapped in for the root must not make the privileged
    // server re-own whatever it points at.
    const st = await fs.lstat(root);
    if (st.isSymbolicLink() || !st.isDirectory())
      throw new Error("Security Violation: the sandbox root is not a real directory.");
    if (st.uid !== ident.uid || st.gid !== ident.gid) {
      await chownTree(root, ident.uid, ident.gid); // existing sandbox from an older uid scheme
    }
    for (const p of [root, sandboxHome(root), sandboxTmp(root)]) {
      await fs.lchown(p, ident.uid, ident.gid);
      await fs.chmod(p, 0o700);
    }
    verifiedOwner.set(root, ident.uid);
  }
}

// ---------------------------------------------------------------------------------------------
// File operations performed *as the sandbox user* (never by the privileged server process)
// ---------------------------------------------------------------------------------------------

function fsEnv(root: string): NodeJS.ProcessEnv {
  return { ...scrubbedBaseEnv(), HOME: sandboxHome(root) };
}

export interface SbxStat {
  kind: "file" | "directory" | "other" | "missing";
  size: number;
}

export async function sbxStat(root: string, abs: string): Promise<SbxStat> {
  const r = await runProc("stat", ["-L", "-c", "%F|%s", "--", abs], {
    cwd: root,
    env: fsEnv(root),
    timeoutMs: 10000,
    maxOutputBytes: 4096,
  });
  if (r.code !== 0) return { kind: "missing", size: 0 };
  const [type, size] = r.stdout.trim().split("|");
  const n = Number(size) || 0;
  if (/regular/.test(type)) return { kind: "file", size: n };
  if (/directory/.test(type)) return { kind: "directory", size: n };
  return { kind: "other", size: n };
}

export async function sbxReadText(
  root: string,
  abs: string,
  maxBytes: number,
): Promise<string> {
  const r = await runProc("cat", ["--", abs], {
    cwd: root,
    env: fsEnv(root),
    timeoutMs: 20000,
    maxOutputBytes: maxBytes,
  });
  if (r.truncated)
    throw new Error(
      `File is larger than ${Math.round(maxBytes / 1024 / 1024)}MB; read it with sandbox_exec (head/tail/sed) instead.`,
    );
  if (r.code !== 0)
    throw new Error((r.stderr || "Could not read file.").trim().slice(0, 300));
  return r.stdout;
}

export async function sbxWriteText(
  root: string,
  abs: string,
  data: string | Buffer,
  append: boolean,
): Promise<void> {
  const script = append ? 'cat >> "$1"' : 'cat > "$1"';
  const r = await runProc("/bin/sh", ["-c", script, "sh", abs], {
    cwd: root,
    env: fsEnv(root),
    timeoutMs: 20000,
    input: data,
    maxOutputBytes: 8192,
  });
  if (r.code !== 0)
    throw new Error((r.stderr || "Could not write file.").trim().slice(0, 300));
}

export async function sbxMkdirp(root: string, abs: string): Promise<void> {
  const r = await runProc("mkdir", ["-p", "--", abs], {
    cwd: root,
    env: fsEnv(root),
    timeoutMs: 10000,
    maxOutputBytes: 8192,
  });
  if (r.code !== 0)
    throw new Error(
      (r.stderr || "Could not create directory.").trim().slice(0, 300),
    );
}

export async function sbxRemoveFile(root: string, abs: string): Promise<void> {
  const r = await runProc("rm", ["-f", "--", abs], {
    cwd: root,
    env: fsEnv(root),
    timeoutMs: 10000,
    maxOutputBytes: 8192,
  });
  if (r.code !== 0)
    throw new Error(
      (r.stderr || "Could not delete file.").trim().slice(0, 300),
    );
}

export async function sbxRemoveTree(root: string, abs: string): Promise<void> {
  await runProc("rm", ["-rf", "--", abs], {
    cwd: "/",
    env: fsEnv(root),
    timeoutMs: 60000,
    maxOutputBytes: 8192,
  });
}

/** Read a file's raw bytes as the sandbox user, refusing anything larger than `maxBytes`. */
export async function sbxReadBytes(
  root: string,
  abs: string,
  maxBytes: number,
): Promise<Buffer> {
  const r = await runProc("cat", ["--", abs], {
    cwd: root,
    env: fsEnv(root),
    timeoutMs: 60000,
    maxOutputBytes: maxBytes,
  });
  if (r.truncated)
    throw new Error(
      `File is larger than the ${Math.round(maxBytes / 1024 / 1024)}MB limit.`,
    );
  if (r.code !== 0)
    throw new Error((r.stderr || "Could not read file.").trim().slice(0, 300));
  return r.stdoutBuffer;
}

/**
 * Follow symlinks on the deepest existing ancestor and confirm the final location is still inside
 * the sandbox root. Defence in depth: the real boundary is that file operations run as the sandbox user.
 */
export async function assertInsideRealRoot(
  root: string,
  target: string,
): Promise<void> {
  const realRoot = await fs.realpath(root);
  let probe = target;
  for (let i = 0; i < 64; i++) {
    try {
      const real = await fs.realpath(probe);
      const rel = path.relative(realRoot, real);
      if (
        rel === ".." ||
        rel.startsWith(".." + path.sep) ||
        path.isAbsolute(rel)
      ) {
        throw new Error(
          "Security Violation: path resolves outside the sandbox (symlink escape).",
        );
      }
      return;
    } catch (e: any) {
      if (e?.code === "ENOENT" || e?.code === "ENOTDIR") {
        const parent = path.dirname(probe);
        if (parent === probe)
          throw new Error("Security Violation: invalid path.");
        probe = parent;
        continue;
      }
      throw e;
    }
  }
  throw new Error("Security Violation: path too deep.");
}
