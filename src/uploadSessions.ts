import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import express, {
  Router,
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  computeAuthKey,
  safeEqual,
  sandboxRootForAuthKey,
} from "./security.js";
import { createLimiter, clientIp, rateLimitMiddleware } from "./rateLimit.js";
import {
  assertSandboxAllowed,
  ensureSandboxRoot,
  sbxMkdirp,
  sbxRemoveFile,
  sbxStat,
  sbxWriteText,
  assertInsideRealRoot,
} from "./sandboxProc.js";
import { safeFileName } from "./fileShare.js";
import {
  parseOwnerCookie,
  isAuthorizedApiKey,
  type OwnerProfile,
} from "./googleAuth.js";

/**
 * Temporary web upload sessions.
 *
 *  1. The user opens GET /upload. If signed in with Google as the owner, their session is
 *     authenticated automatically. Otherwise they can sign in with Google or use their MCP API key.
 *  2. Files are written into <sandbox root>/upload/ as the unprivileged sandbox user, where the
 *     AI's sandbox tools can read and execute them directly.
 *  3. When an upload session ends (via "End session" button or tab closure), the session token is
 *     invalidated to close upload access, but the uploaded files are PRESERVED in the sandbox.
 *  4. Uploaded files are automatically deleted after the configured retention period
 *     (UPLOAD_FILE_RETENTION_MINUTES, default: 60 minutes).
 */

export const UPLOAD_DIR = "upload";

function num(name: string, fallback: number, min: number, max: number): number {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(max, Math.max(min, raw));
}

export const uploadConfig = {
  get enabled() {
    return process.env.ENABLE_WEB_UPLOAD !== "false";
  },
  get ttlMs() {
    return Math.floor(num("UPLOAD_SESSION_MINUTES", 10, 0.02, 60) * 60_000);
  },
  get retentionMs() {
    return Math.floor(
      num("UPLOAD_FILE_RETENTION_MINUTES", 60, 0.02, 1440) * 60_000,
    );
  },
  get maxFileBytes() {
    return Math.floor(num("UPLOAD_MAX_FILE_MB", 25, 0.1, 100) * 1024 * 1024);
  },
  get maxTotalBytes() {
    return Math.floor(num("UPLOAD_MAX_TOTAL_MB", 100, 1, 500) * 1024 * 1024);
  },
  get maxFiles() {
    return Math.floor(num("UPLOAD_MAX_FILES", 20, 1, 200));
  },
  get maxSessions() {
    return Math.floor(num("UPLOAD_MAX_SESSIONS", 5, 1, 50));
  },
};

interface UploadedFile {
  name: string;
  size: number;
  abs: string;
}

interface UploadSession {
  root: string;
  expiresAt: number;
  files: UploadedFile[];
  bytes: number;
  timer: NodeJS.Timeout;
  /** Serialises writes so name de-duplication and quota checks cannot race. */
  lock: Promise<unknown>;
  ended: boolean;
}

interface RetentionEntry {
  root: string;
  abs: string;
  deleteAt: number;
}

const sessions = new Map<string, UploadSession>(); // key = sha256(token)
const retentionTracker: RetentionEntry[] = [];

export async function sweepExpiredFiles(): Promise<number> {
  const now = Date.now();
  let count = 0;
  for (let i = retentionTracker.length - 1; i >= 0; i--) {
    const item = retentionTracker[i];
    if (now >= item.deleteAt) {
      retentionTracker.splice(i, 1);
      try {
        await sbxRemoveFile(item.root, item.abs);
        count++;
      } catch {
        /* file or sandbox may already be gone */
      }
    }
  }
  return count;
}

// Periodic sweeper: automatically deletes files whose retention time has passed
const retentionSweeper = setInterval(() => {
  sweepExpiredFiles().catch(() => {});
}, 1000);
retentionSweeper.unref();

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

/**
 * Ends an active upload session. Note that terminating the upload session invalidates
 * the token so no new files can be uploaded, but DOES NOT delete existing files immediately.
 * Files are preserved in the sandbox until their retention schedule expires.
 */
async function endSession(hash: string): Promise<number> {
  const s = sessions.get(hash);
  if (!s || s.ended) return 0;
  s.ended = true;
  clearTimeout(s.timer);
  sessions.delete(hash);
  await s.lock.catch(() => {});
  // Files remain in the sandbox under retention schedule
  return s.files.length;
}

/** Server shutdown: clears timers and closes live sessions. */
export async function shutdownUploadSessions(): Promise<void> {
  clearInterval(retentionSweeper);
  await Promise.allSettled([...sessions.keys()].map((h) => endSession(h)));
}

/** Test hook: active live upload sessions. */
export function activeUploadSessionCount(): number {
  return sessions.size;
}

function isExpired(s: UploadSession): boolean {
  return Date.now() >= s.expiresAt;
}

async function uniqueTarget(
  root: string,
  dir: string,
  wanted: string,
): Promise<{ name: string; abs: string }> {
  const ext = path.extname(wanted);
  const stem = ext ? wanted.slice(0, -ext.length) : wanted;
  for (let i = 0; i < 200; i++) {
    const name = i === 0 ? wanted : `${stem} (${i})${ext}`;
    const abs = path.join(dir, name);
    if ((await sbxStat(root, abs)).kind === "missing") return { name, abs };
  }
  throw new Error("Too many files with the same name.");
}

export async function listUploadedFiles(
  root: string,
): Promise<Array<{ name: string; size: number; mtime: number }>> {
  const dir = path.join(root, UPLOAD_DIR);
  try {
    const st = await sbxStat(root, dir);
    if (st.kind !== "directory") return [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const result: Array<{ name: string; size: number; mtime: number }> = [];
    for (const ent of entries) {
      if (ent.isFile()) {
        try {
          const fileStat = await fs.promises.stat(path.join(dir, ent.name));
          result.push({
            name: ent.name,
            size: fileStat.size,
            mtime: fileStat.mtimeMs,
          });
        } catch {}
      }
    }
    return result;
  } catch {
    return [];
  }
}

export interface UploadRouteOptions {
  /** The API key the user can present if not logged in via Google. */
  apiKey: string;
  /** Server-side default GitHub token (what /mcp falls back to when the client sends none). */
  defaultGithubToken?: string;
  /** Extra origin host allowed to call the API (e.g. from PUBLIC_BASE_URL). */
  publicBaseUrl?: string;
}

function json(
  res: Response,
  status: number,
  body: Record<string, unknown>,
): void {
  res.status(status).json(body);
}

export function createUploadRouter(opts: UploadRouteOptions): Router {
  const router = Router();
  const apiLimiter = createLimiter({ windowMs: 60_000, max: 240 });
  const failedKeyLimiter = createLimiter({ windowMs: 15 * 60_000, max: 10 });

  let publicHost = "";
  try {
    if (opts.publicBaseUrl) publicHost = new URL(opts.publicBaseUrl).host;
  } catch {
    /* ignore */
  }

  router.use((_req, res, next) => {
    if (!uploadConfig.enabled) {
      json(res, 404, { error: "Web upload is disabled on this server." });
      return;
    }
    next();
  });

  // The page is same-origin only: refuse API calls that carry a foreign Origin.
  const sameOrigin = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const origin = req.headers.origin;
    if (typeof origin === "string") {
      let host = "";
      try {
        host = new URL(origin).host;
      } catch {
        /* invalid */
      }
      if (!host || (host !== req.get("host") && host !== publicHost)) {
        json(res, 403, { error: "Origin not allowed." });
        return;
      }
    }
    next();
  };

  const noStore = (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader("Cache-Control", "no-store");
    next();
  };

  // ---- Page -----------------------------------------------------------------------------------
  router.get("/", (req, res) => {
    const nonce = crypto.randomBytes(16).toString("base64");
    const owner = parseOwnerCookie(req);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; img-src 'self' https: data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
    );
    res.send(
      renderUploadPage(nonce, {
        ttlMinutes: Math.round(uploadConfig.ttlMs / 60_000),
        retentionMinutes: Math.round(uploadConfig.retentionMs / 60_000),
        maxFileMb:
          Math.round((uploadConfig.maxFileBytes / 1024 / 1024) * 10) / 10,
        maxTotalMb: Math.round(uploadConfig.maxTotalBytes / 1024 / 1024),
        maxFiles: uploadConfig.maxFiles,
        folder: UPLOAD_DIR,
        owner,
      }),
    );
  });

  const api = Router();
  api.use(
    noStore,
    sameOrigin,
    rateLimitMiddleware(apiLimiter, "Too many requests."),
  );

  // ---- Open a session -------------------------------------------------------------------------
  api.post(
    "/session",
    express.json({ limit: "8kb" }),
    async (req: Request, res: Response) => {
      const ip = clientIp(req);
      const owner = parseOwnerCookie(req);
      const body =
        req.body && typeof req.body === "object"
          ? (req.body as Record<string, unknown>)
          : {};
      const key = typeof body.apiKey === "string" ? body.apiKey : "";

      const isOwner = Boolean(owner);
      const isKeyAuthorized =
        isAuthorizedApiKey(key) || safeEqual(key, opts.apiKey);

      if (!isOwner && !isKeyAuthorized) {
        if (!failedKeyLimiter.hit(ip, 0)) {
          res.setHeader(
            "Retry-After",
            String(failedKeyLimiter.retryAfterSec(ip) || 900),
          );
          json(res, 429, {
            error: "Too many failed attempts. Try again later.",
          });
          return;
        }
        failedKeyLimiter.hit(ip);
        json(res, 401, {
          error:
            "Authentication required. Sign in with Google or provide a valid MCP API key.",
        });
        return;
      }
      failedKeyLimiter.reset(ip);

      try {
        assertSandboxAllowed();
      } catch (e: any) {
        json(res, 503, {
          error: String(e?.message || "Sandbox is not available.").slice(
            0,
            300,
          ),
        });
        return;
      }
      if (sessions.size >= uploadConfig.maxSessions) {
        res.setHeader("Retry-After", "60");
        json(res, 503, {
          error: "Too many active upload sessions. Try again shortly.",
        });
        return;
      }

      const clientToken =
        typeof body.githubToken === "string"
          ? body.githubToken.trim().slice(0, 512)
          : "";
      const authKey = computeAuthKey(
        clientToken ||
          opts.defaultGithubToken ||
          (owner ? `owner_${owner.email}` : ""),
      );
      const root = sandboxRootForAuthKey(authKey);
      try {
        await ensureSandboxRoot(root);
        await sbxMkdirp(root, path.join(root, UPLOAD_DIR));
      } catch (e: any) {
        console.error(
          "[upload] could not prepare sandbox:",
          String(e?.message || e).slice(0, 300),
        );
        json(res, 503, { error: "Could not prepare the sandbox." });
        return;
      }

      const token = crypto.randomBytes(32).toString("base64url");
      const hash = sha256Hex(token);
      const ttlMs = uploadConfig.ttlMs;
      const session: UploadSession = {
        root,
        expiresAt: Date.now() + ttlMs,
        files: [],
        bytes: 0,
        lock: Promise.resolve(),
        ended: false,
        timer: setTimeout(() => {
          endSession(hash).catch(() => {});
        }, ttlMs),
      };
      session.timer.unref();
      sessions.set(hash, session);

      json(res, 201, {
        token,
        remainingMs: ttlMs,
        folder: UPLOAD_DIR,
        retentionMinutes: Math.round(uploadConfig.retentionMs / 60_000),
        limits: {
          maxFileBytes: uploadConfig.maxFileBytes,
          maxTotalBytes: uploadConfig.maxTotalBytes,
          maxFiles: uploadConfig.maxFiles,
        },
      });
    },
  );

  // ---- Everything below needs a live session token -------------------------------------------
  function requireSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const token = req.headers["x-upload-token"];
    if (typeof token !== "string" || !TOKEN_RE.test(token)) {
      json(res, 401, { error: "Upload session required." });
      return;
    }
    const hash = sha256Hex(token);
    const s = sessions.get(hash);
    if (!s || s.ended) {
      json(res, 401, { error: "Upload session expired." });
      return;
    }
    if (isExpired(s)) {
      endSession(hash).catch(() => {});
      json(res, 401, { error: "Upload session expired." });
      return;
    }
    res.locals.hash = hash;
    res.locals.session = s;
    next();
  }

  const statusOf = (s: UploadSession) => ({
    remainingMs: Math.max(0, s.expiresAt - Date.now()),
    folder: UPLOAD_DIR,
    bytes: s.bytes,
    files: s.files.map((f) => ({
      name: f.name,
      size: f.size,
      path: `${UPLOAD_DIR}/${f.name}`,
    })),
  });

  api.get("/session", requireSession, (_req, res) => {
    json(res, 200, statusOf(res.locals.session as UploadSession));
  });

  api.post(
    "/files",
    requireSession,
    (req, res, next) => {
      const s = res.locals.session as UploadSession;
      const len = Number(req.headers["content-length"]);
      if (Number.isFinite(len) && len > uploadConfig.maxFileBytes) {
        json(res, 413, {
          error: `File exceeds the ${Math.round(uploadConfig.maxFileBytes / 1024 / 1024)}MB per-file limit.`,
        });
        return;
      }
      if (Number.isFinite(len) && s.bytes + len > uploadConfig.maxTotalBytes) {
        json(res, 413, { error: "Session storage limit reached." });
        return;
      }
      next();
    },
    express.raw({ type: () => true, limit: uploadConfig.maxFileBytes }),
    async (req: Request, res: Response) => {
      const s = res.locals.session as UploadSession;
      const data = req.body;
      if (!Buffer.isBuffer(data) || data.length === 0) {
        json(res, 400, { error: "Empty file." });
        return;
      }

      let rawName = "";
      try {
        rawName = decodeURIComponent(String(req.headers["x-filename"] || ""));
      } catch {
        rawName = "";
      }
      const wanted = safeFileName(rawName);

      const result = s.lock.then(async () => {
        if (s.ended || isExpired(s))
          throw Object.assign(new Error("Upload session expired."), {
            status: 401,
          });
        if (s.files.length >= uploadConfig.maxFiles)
          throw Object.assign(
            new Error(`File count limit reached (${uploadConfig.maxFiles}).`),
            { status: 413 },
          );
        if (s.bytes + data.length > uploadConfig.maxTotalBytes)
          throw Object.assign(new Error("Session storage limit reached."), {
            status: 413,
          });

        const dir = path.join(s.root, UPLOAD_DIR);
        await sbxMkdirp(s.root, dir);
        const { name, abs } = await uniqueTarget(s.root, dir, wanted);
        await assertInsideRealRoot(s.root, abs);
        await sbxWriteText(s.root, abs, data, false);
        s.files.push({ name, size: data.length, abs });
        s.bytes += data.length;

        // Schedule for automatic retention cleanup
        retentionTracker.push({
          root: s.root,
          abs,
          deleteAt: Date.now() + uploadConfig.retentionMs,
        });

        return { name, size: data.length, path: `${UPLOAD_DIR}/${name}` };
      });
      s.lock = result.catch(() => {});

      try {
        json(res, 201, { file: await result, ...statusOf(s) });
      } catch (e: any) {
        const status = Number(e?.status) || 500;
        if (status === 500)
          console.error(
            "[upload] write failed:",
            String(e?.message || e).slice(0, 300),
          );
        json(res, status, {
          error:
            status === 500 ? "Could not store the file." : String(e.message),
        });
      }
    },
  );

  // Explicit end (button) and tab-close beacon: ends the upload session without wiping files
  api.post(
    "/end",
    express.json({ limit: "2kb", type: () => true }),
    async (req: Request, res: Response) => {
      const headerToken = req.headers["x-upload-token"];
      const bodyToken =
        req.body && typeof req.body === "object"
          ? (req.body as Record<string, unknown>).token
          : undefined;
      const token =
        typeof headerToken === "string"
          ? headerToken
          : typeof bodyToken === "string"
            ? bodyToken
            : "";
      if (!TOKEN_RE.test(token)) {
        json(res, 400, { error: "Bad token." });
        return;
      }
      const activeCount = await endSession(sha256Hex(token));
      json(res, 200, {
        ended: true,
        activeFiles: activeCount,
        message:
          "Upload session ended. Uploaded files remain active in your sandbox and will expire per schedule.",
      });
    },
  );

  api.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    if (err?.type === "entity.too.large") {
      json(res, 413, {
        error: `File exceeds the ${Math.round(uploadConfig.maxFileBytes / 1024 / 1024)}MB per-file limit.`,
      });
      return;
    }
    if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
      json(res, 400, { error: "Bad request." });
      return;
    }
    console.error("[upload] error:", String(err?.message || err).slice(0, 300));
    json(res, 500, { error: "Internal server error." });
  });

  router.use("/api", api);
  return router;
}

export function registerUploadRoutes(
  app: Express,
  opts: UploadRouteOptions,
): void {
  app.use("/upload", createUploadRouter(opts));
}

// -------------------------------------------------------------------------------------------------
// UI Render Function
// -------------------------------------------------------------------------------------------------

interface PageInfo {
  ttlMinutes: number;
  retentionMinutes: number;
  maxFileMb: number;
  maxTotalMb: number;
  maxFiles: number;
  folder: string;
  owner?: OwnerProfile | null;
}

function renderUploadPage(nonce: string, info: PageInfo): string {
  const isOwner = Boolean(info.owner);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Krix Upload Portal</title>
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png">
<style nonce="${nonce}">
  :root {
    color-scheme: light dark;
    --bg: #ffffff;
    --fg: #000000;
    --accents-1: #fafafa;
    --accents-2: #eaeaea;
    --accents-3: #999999;
    --accents-4: #888888;
    --accents-5: #666666;
    --accents-6: #444444;
    --accents-7: #333333;
    --accents-8: #111111;
    --card: #ffffff;
    --line: var(--accents-2);
    --dim: var(--accents-5);
    --hi: var(--fg);
    --ok: #0070f3;
    --bad: #e00;
    --accent: #0070f3;
  }
  .dark {
    --bg: #000000;
    --fg: #ffffff;
    --accents-1: #111111;
    --accents-2: #222222;
    --accents-3: #333333;
    --accents-4: #555555;
    --accents-5: #777777;
    --accents-6: #999999;
    --accents-7: #eaeaea;
    --accents-8: #fafafa;
    --card: #0a0a0a;
    --line: var(--accents-2);
    --dim: var(--accents-5);
    --hi: var(--fg);
    --ok: #0070f3;
    --bad: #f85149;
    --accent: #0070f3;
  }
  * { box-sizing: border-box; margin:0; padding:0; }
  body { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; background:var(--bg); color:var(--fg); background-image:radial-gradient(var(--accents-2) 1px, transparent 1px); background-size:24px 24px; font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; transition:background-color .25s ease, color .25s ease; }
  .card { width:100%; max-width:540px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:32px; box-shadow:0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04); }
  header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand-logo { width:38px; height:38px; border-radius:9px; overflow:hidden; border:1px solid var(--line); display:flex; align-items:center; justify-content:center; }
  .brand-logo img { width:100%; height:100%; object-fit:cover; }
  h1 { font-size:20px; color:var(--hi); font-weight:600; }
  p.sub { margin:6px 0 20px; color:var(--dim); font-size:13px; line-height:1.5; }
  .owner-pill { display:flex; align-items:center; gap:8px; background:var(--accents-1); border:1px solid var(--line); border-radius:20px; padding:4px 12px; font-size:12px; color:var(--hi); }
  .owner-pill img { width:20px; height:20px; border-radius:50%; }
  label { display:block; font-size:13px; color:var(--dim); margin:14px 0 6px; }
  input[type=password], input[type=text] { width:100%; padding:10px 12px; border-radius:8px; border:1px solid var(--line); background:var(--accents-1); color:var(--hi); font:inherit; }
  input:focus { outline:2px solid var(--accent); outline-offset:-1px; }
  details { margin-top:16px; font-size:13px; color:var(--dim); }
  details summary { cursor:pointer; user-select:none; }
  button { font:inherit; cursor:pointer; border-radius:8px; border:1px solid var(--line); padding:10px 16px; background:var(--accents-1); color:var(--hi); transition:all .15s cubic-bezier(0.16,1,0.3,1); }
  button:hover { border-color:var(--accents-4); }
  button.primary { background:var(--fg); border-color:var(--fg); font-weight:600; width:100%; margin-top:16px; color:var(--bg); }
  button.primary:hover { opacity:0.9; }
  button.google-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; background:var(--accents-1); color:var(--hi); font-weight:600; border:1px solid var(--line); padding:11px 16px; margin-top:10px; }
  button.google-btn:hover { border-color:var(--accents-4); background:var(--accents-2); }
  button:disabled { opacity:.5; cursor:not-allowed; }
  .err { color:var(--bad); font-size:13px; margin-top:12px; min-height:1.2em; }
  .bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
  .timer { font-variant-numeric:tabular-nums; font-weight:600; color:var(--hi); }
  .drop { border:2px dashed var(--line); border-radius:10px; padding:32px 16px; text-align:center; color:var(--dim); cursor:pointer; transition:all .15s; background:var(--accents-1); }
  .drop.over, .drop:focus-visible { border-color:var(--accent); background:var(--accents-2); outline:none; }
  ul { list-style:none; margin:16px 0 0; padding:0; max-height:220px; overflow-y:auto; }
  li { display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-top:1px solid var(--line); font-size:13px; }
  li .n { overflow-wrap:anywhere; color:var(--hi); }
  li .m { color:var(--dim); white-space:nowrap; }
  li.fail .m { color:var(--bad); }
  .note { margin-top:18px; font-size:12px; color:var(--dim); line-height:1.5; }
  code { background:var(--accents-1); border:1px solid var(--line); border-radius:4px; padding:2px 6px; color:var(--hi); font-family:monospace; }
  .row { display:flex; gap:10px; margin-top:18px; }
  .row button { flex:1; }
  [hidden] { display:none !important; }
  .links { margin-top:20px; font-size:13px; text-align:center; color:var(--dim); }
  .links a { color:var(--dim); text-decoration:none; }
  .links a:hover { color:var(--hi); }
  @media (max-width: 640px) {
    body { padding:16px 12px; }
    .card { padding:20px 16px; border-radius:12px; }
    header { flex-direction:column; align-items:flex-start; gap:12px; }
    .owner-pill { width:100%; justify-content:space-between; }
    .row { flex-direction:column; }
  }
</style>
<script nonce="${nonce}">
  const t = localStorage.getItem('qw-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (t === 'dark') document.documentElement.classList.add('dark');
</script>
</head>
<body>
<main class="card">
  <header>
    <div class="brand">
      <div class="brand-logo">
        <img src="/icon-48.png" alt="Krix">
      </div>
      <h1>Krix Upload</h1>
    </div>
    ${
      isOwner
        ? `
      <div class="owner-pill">
        ${info.owner?.picture ? `<img src="${encodeURI(info.owner.picture)}" alt="">` : ""}
        <span>${encodeURIComponent(info.owner?.email || "Owner")}</span>
      </div>
    `
        : ""
    }
  </header>

  <section id="login" ${isOwner ? "hidden" : ""}>
    <p class="sub">Upload files directly into your sandboxed execution environment. Files are saved in <code>${info.folder}/</code> and are instantly accessible to your AI.</p>

    <a href="/auth/google?returnTo=/upload" style="text-decoration:none;">
      <button class="google-btn" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Sign in with Google (Owner)
      </button>
    </a>

    <details>
      <summary style="margin-top:20px; font-size:12px;">Alternative: authenticate with MCP API key</summary>
      <form id="loginForm" autocomplete="off" style="margin-top:10px;">
        <label for="key">MCP API key</label>
        <input id="key" type="password" autocomplete="off" spellcheck="false" placeholder="Enter API key">
        <button class="primary" id="start" type="submit">Open Upload Session</button>
      </form>
    </details>
    <div class="err" id="loginErr" role="alert"></div>
  </section>

  <section id="session" ${isOwner ? "" : "hidden"}>
    <div class="bar">
      <span>Upload window: <span class="timer" id="timer">--:--</span></span>
      <span id="usage" class="note" style="margin:0;"></span>
    </div>
    <div class="drop" id="drop" tabindex="0" role="button" aria-label="Drop files to upload">
      <div style="font-weight:600; color:var(--hi); margin-bottom:4px;">Drag &amp; drop files here, or click to browse</div>
      <small>Up to ${info.maxFiles} files &middot; ${info.maxFileMb} MB each &middot; ${info.maxTotalMb} MB total</small>
    </div>
    <input id="picker" type="file" multiple hidden>
    <ul id="list"></ul>
    <div class="err" id="upErr" role="alert"></div>
    <p class="note">Files are saved in your sandbox at <code>${info.folder}/&lt;filename&gt;</code>. They are automatically accessible to your AI from both the sandbox root and cloned repository directories, and will be retained for ${info.retentionMinutes} minutes.</p>
    <div class="row">
      <button id="end" type="button">End upload session</button>
    </div>
  </section>
</main>

<div class="links">
  <a href="/home">Home</a> &bull; <a href="/stats">Stats</a> &bull; <a href="https://quickwitty.onrender.com" target="_blank" rel="noopener">Contact (quickwitty.onrender.com)</a>
</div>

<script nonce="${nonce}">
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const isOwner = ${isOwner};
  let token = null, endsAt = 0, tick = null, limits = null;

  const fmt = (n) => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';

  function show(loggedIn) {
    $('login').hidden = loggedIn;
    $('session').hidden = !loggedIn;
  }

  function reset(msg) {
    token = null; clearInterval(tick); tick = null;
    $('list').textContent = ''; $('upErr').textContent = ''; $('usage').textContent = '';
    show(false);
    $('loginErr').textContent = msg || '';
  }

  function startTimer(remainingMs) {
    endsAt = performance.now() + remainingMs;
    clearInterval(tick);
    const render = () => {
      const left = Math.max(0, endsAt - performance.now());
      const s = Math.ceil(left / 1000);
      const el = $('timer');
      el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      if (left <= 0) {
        token = null;
        $('timer').textContent = 'Closed';
        $('upErr').textContent = 'Upload session closed. Uploaded files remain active in your sandbox.';
      }
    };
    render();
    tick = setInterval(render, 500);
  }

  async function api(path, opts) {
    const res = await fetch('/upload/api' + path, opts);
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) { const e = new Error(data.error || 'Request failed (' + res.status + ').'); e.status = res.status; throw e; }
    return data;
  }

  async function initSession(apiKey) {
    const data = await api('/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey || '' })
    });
    token = data.token; limits = data.limits;
    show(true);
    startTimer(data.remainingMs);
  }

  if (isOwner) {
    initSession().catch((e) => {
      $('loginErr').textContent = e.message;
      show(false);
    });
  }

  $('loginForm')?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    $('loginErr').textContent = '';
    $('start').disabled = true;
    try {
      await initSession($('key').value);
      $('key').value = '';
    } catch (e) {
      $('loginErr').textContent = e.message;
    } finally {
      $('start').disabled = false;
    }
  });

  function addRow(name) {
    const li = document.createElement('li');
    const n = document.createElement('span'); n.className = 'n'; n.textContent = name;
    const m = document.createElement('span'); m.className = 'm'; m.textContent = 'uploading…';
    li.append(n, m);
    $('list').prepend(li);
    return { li, n, m };
  }

  function sendOne(file, row) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload/api/files');
      xhr.setRequestHeader('x-upload-token', token);
      xhr.setRequestHeader('x-filename', encodeURIComponent(file.name));
      xhr.setRequestHeader('content-type', 'application/octet-stream');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) row.m.textContent = Math.round(e.loaded / e.total * 100) + '%'; };
      xhr.onload = () => {
        let d = {}; try { d = JSON.parse(xhr.responseText); } catch (_) {}
        if (xhr.status === 201) {
          row.n.textContent = d.file.path; row.m.textContent = fmt(d.file.size);
          $('usage').textContent = d.files.length + ' file(s), ' + fmt(d.bytes);
        } else {
          row.li.className = 'fail'; row.m.textContent = d.error || 'failed';
          if (xhr.status === 401) reset('Upload session closed. Uploaded files remain active in your sandbox.');
        }
        resolve();
      };
      xhr.onerror = () => { row.li.className = 'fail'; row.m.textContent = 'network error'; resolve(); };
      xhr.send(file);
    });
  }

  async function upload(files) {
    $('upErr').textContent = '';
    for (const f of files) {
      if (!token) return;
      const row = addRow(f.name);
      if (f.size === 0) { row.li.className = 'fail'; row.m.textContent = 'empty file'; continue; }
      if (limits && f.size > limits.maxFileBytes) { row.li.className = 'fail'; row.m.textContent = 'too large'; continue; }
      await sendOne(f, row);
    }
  }

  const drop = $('drop'), picker = $('picker');
  drop.addEventListener('click', () => picker.click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.click(); } });
  picker.addEventListener('change', () => { const f = [...picker.files]; picker.value = ''; upload(f); });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => upload([...e.dataTransfer.files]));
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  $('end').addEventListener('click', async () => {
    const t = token;
    token = null;
    $('timer').textContent = 'Closed';
    $('upErr').textContent = 'Upload session ended. Uploaded files remain active in your sandbox.';
    if (t) { try { await api('/end', { method: 'POST', headers: { 'x-upload-token': t, 'content-type': 'application/json' }, body: '{}' }); } catch (_) {} }
  });

  // Closing or leaving the page closes the upload token (does NOT delete files)
  window.addEventListener('pagehide', () => {
    if (token) navigator.sendBeacon('/upload/api/end', new Blob([JSON.stringify({ token })], { type: 'application/json' }));
  });
})();
</script>
</body>
</html>`;
}
