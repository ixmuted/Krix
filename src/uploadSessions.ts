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
  findAuthorizedApiKey,
  listDynamicKeys,
  type OwnerProfile,
} from "./googleAuth.js";
import { getKeySettings, isOwnerEmail } from "./userSettings.js";
import {
  renderHeader,
  renderFooter,
  getBaseStyles,
  renderSvg,
  renderGoogleLogoSvg,
  renderAuthRequiredCard,
  renderRecaptchaScript,
  escapeHtml,
} from "./views.js";

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
  permanent?: boolean;
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
        try {
          if (fs.existsSync(item.abs)) {
            fs.unlinkSync(item.abs);
            count++;
          }
        } catch {
          /* file or sandbox may already be gone */
        }
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
      `default-src 'none'; script-src 'nonce-${nonce}' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'nonce-${nonce}' 'unsafe-inline'; frame-src https://www.google.com/recaptcha/; connect-src 'self' https://www.google.com/recaptcha/; img-src 'self' https: data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
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

      const isOwner = Boolean(owner && isOwnerEmail(owner.email));
      const apiKeyEntry = findAuthorizedApiKey(key);
      const isPrimaryKey = Boolean(key && safeEqual(key, opts.apiKey));
      const isKeyAuthorized = isAuthorizedApiKey(key) || isPrimaryKey;
      const onRenderService = process.env.RENDER === "true" || Boolean(process.env.RENDER_SERVICE_ID);
      const renderSandboxOptIn = process.env.ENABLE_SANDBOX === "true" && process.env.SANDBOX_RENDER_OWNER_ONLY_ACK === "true" && process.env.SANDBOX_REQUIRE_ISOLATION === "false";
      const authenticatedOwnerKey = isOwner || apiKeyEntry?.role === "owner" || isPrimaryKey;

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

      if (onRenderService && (!renderSandboxOptIn || !authenticatedOwnerKey)) {
        json(res, 403, { error: "On Render, workspace uploads are available only to the configured owner after explicit owner-only sandbox opt-in." });
        return;
      }

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

      // Uploads must land in the same sandbox root used by the MCP session.
      // Never derive workspace ownership from a shared provider token.
      let sandboxKeyId = "primary-key";
      if (apiKeyEntry?.id) sandboxKeyId = apiKeyEntry.id;
      else if (owner && !isOwner) {
        const userKey = listDynamicKeys(owner.email)[0];
        if (!userKey) {
          json(res, 409, { error: "Create an API key for this account before opening a sandbox upload session." });
          return;
        }
        sandboxKeyId = userKey.id;
      }
      const sandboxId = getKeySettings(sandboxKeyId).sandboxId;
      const root = sandboxRootForAuthKey(sandboxId);
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

      const existingFiles: UploadedFile[] = [];
      let totalBytes = 0;
      try {
        const uploadDirPath = path.join(root, UPLOAD_DIR);
        if (fs.existsSync(uploadDirPath)) {
          const entries = fs.readdirSync(uploadDirPath, {
            withFileTypes: true,
          });
          for (const entry of entries) {
            if (entry.isFile()) {
              const abs = path.join(uploadDirPath, entry.name);
              const stat = fs.statSync(abs);
              const isPerm = !retentionTracker.some((r) => r.abs === abs);
              existingFiles.push({
                name: entry.name,
                size: stat.size,
                abs,
                permanent: isPerm,
              });
              totalBytes += stat.size;
            }
          }
        }
      } catch {}

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
        files: existingFiles.map((f) => ({
          name: f.name,
          size: f.size,
          path: `${UPLOAD_DIR}/${f.name}`,
          permanent: Boolean(f.permanent),
        })),
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

        const isPerm =
          String(req.headers["x-permanent"] || "").toLowerCase() === "true" ||
          req.query.permanent === "true" ||
          req.query.permanent === "1";

        const dir = path.join(s.root, UPLOAD_DIR);
        await sbxMkdirp(s.root, dir);
        const { name, abs } = await uniqueTarget(s.root, dir, wanted);
        await assertInsideRealRoot(s.root, abs);
        await sbxWriteText(s.root, abs, data, false);
        s.files.push({ name, size: data.length, abs, permanent: isPerm });
        s.bytes += data.length;

        // Schedule for automatic retention cleanup only if not permanent
        if (!isPerm) {
          retentionTracker.push({
            root: s.root,
            abs,
            deleteAt: Date.now() + uploadConfig.retentionMs,
          });
        }

        return {
          name,
          size: data.length,
          path: `${UPLOAD_DIR}/${name}`,
          permanent: isPerm,
        };
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

  // File download endpoint
  api.get("/download", requireSession, async (req: Request, res: Response) => {
    const s = res.locals.session as UploadSession;
    const name = safeFileName(String(req.query.name || ""));
    if (!name) {
      json(res, 400, { error: "Filename is required." });
      return;
    }
    const abs = path.join(s.root, UPLOAD_DIR, name);
    try {
      await assertInsideRealRoot(s.root, abs);
      if (!fs.existsSync(abs)) {
        json(res, 404, { error: "File not found." });
        return;
      }
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(name)}"`,
      );
      res.setHeader("Content-Type", "application/octet-stream");
      fs.createReadStream(abs).pipe(res);
    } catch {
      json(res, 500, { error: "Could not read file." });
    }
  });

  // File delete endpoint
  api.delete("/file", requireSession, async (req: Request, res: Response) => {
    const s = res.locals.session as UploadSession;
    const name = safeFileName(String(req.query.name || ""));
    if (!name) {
      json(res, 400, { error: "Filename is required." });
      return;
    }
    const abs = path.join(s.root, UPLOAD_DIR, name);
    try {
      await assertInsideRealRoot(s.root, abs);
      if (fs.existsSync(abs)) {
        await sbxRemoveFile(s.root, abs);
        s.files = s.files.filter((f) => f.name !== name);
        const idx = retentionTracker.findIndex((r) => r.abs === abs);
        if (idx !== -1) retentionTracker.splice(idx, 1);
        json(res, 200, { success: true, removed: name });
        return;
      }
      json(res, 404, { error: "File not found." });
    } catch {
      json(res, 500, { error: "Could not delete file." });
    }
  });

  // File permanent toggle endpoint
  api.post(
    "/file/permanent",
    requireSession,
    async (req: Request, res: Response) => {
      const s = res.locals.session as UploadSession;
      const name = safeFileName(String(req.query.name || ""));
      const makePerm = String(req.query.permanent || "true") === "true";
      if (!name) {
        json(res, 400, { error: "Filename is required." });
        return;
      }
      const abs = path.join(s.root, UPLOAD_DIR, name);
      try {
        await assertInsideRealRoot(s.root, abs);
        if (!fs.existsSync(abs)) {
          json(res, 404, { error: "File not found." });
          return;
        }
        const existing = s.files.find((f) => f.name === name);
        if (existing) {
          existing.permanent = makePerm;
        }
        const idx = retentionTracker.findIndex((r) => r.abs === abs);
        if (makePerm) {
          if (idx !== -1) retentionTracker.splice(idx, 1);
        } else {
          if (idx === -1) {
            retentionTracker.push({
              root: s.root,
              abs,
              deleteAt: Date.now() + uploadConfig.retentionMs,
            });
          }
        }
        json(res, 200, { success: true, permanent: makePerm, name });
      } catch {
        json(res, 500, { error: "Could not update file retention." });
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

export interface PageInfo {
  ttlMinutes: number;
  retentionMinutes: number;
  maxFileMb: number;
  maxTotalMb: number;
  maxFiles: number;
  folder: string;
  owner?: OwnerProfile | null;
}

export function renderUploadPage(nonce: string, info: PageInfo): string {
  const isOwner = Boolean(info.owner);

  if (!isOwner) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Upload</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <style nonce="${nonce}">
    ${getBaseStyles()}
  </style>
  ${renderRecaptchaScript(nonce)}
  <script nonce="${nonce}">
    (function() {
      const pref = localStorage.getItem('qw-theme') || 'system';
      const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    })();
  </script>
</head>
<body>
  ${renderHeader("upload", null, nonce)}
  <div class="wrapper">
    ${renderAuthRequiredCard("Upload", "/upload")}
  </div>
  ${renderFooter()}
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Upload</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png?v=2">
  <style nonce="${nonce}">
    ${getBaseStyles()}

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--card-bg);
      margin-bottom: 8px;
      transition: all 0.15s ease;
    }
    .file-item:hover {
      border-color: var(--accents-4);
    }
    .file-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }
    .file-name {
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 13px;
      color: var(--fg);
      overflow-wrap: anywhere;
    }
    .file-meta {
      font-size: 11px;
      color: var(--accents-5);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .file-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  </style>
  ${renderRecaptchaScript(nonce)}
  <script nonce="${nonce}">
    (function() {
      const pref = localStorage.getItem('qw-theme') || 'system';
      const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    })();
  </script>
</head>
<body>
  ${renderHeader("upload", info.owner || null, nonce)}

  <div class="wrapper">
    <div class="page-heading">
      <div>
        <span class="krix-eyebrow">Workspace storage</span>
        <h1>Sandbox uploads</h1>
        <p>Upload workspace files, datasets and scripts to the sandbox assigned to this account.</p>
      </div>
      <div class="page-actions">
        <a href="/store" class="btn">View Store</a>
        <a href="/home" class="btn primary">Home</a>
      </div>
    </div>

    <!-- Active Upload & File Management Grid -->
    <div id="session">
      <div class="grid-2">
        <!-- Left: Upload Dropzone Card -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Upload Workspace Files</h2>
            <span class="badge">${info.maxFileMb} MB per file</span>
          </div>

          <!-- Redesigned Keep Storage Toggle Switch (Permanent Storage) -->
          <div class="switch-wrap" data-feature="Permanent Storage">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="color:#0070f3; display:flex;">
                ${renderSvg("shield", 18)}
              </div>
              <div>
                <div style="font-weight:600; font-size:13px; color:var(--fg);">Keep</div>
              </div>
            </div>
            <label class="switch" title="Keep (Permanent Storage)">
              <input type="checkbox" id="permSave" aria-label="Permanent Storage">
              <span class="slider"></span>
            </label>
          </div>

          <!-- Redesigned Modern Drag & Drop Zone -->
          <div class="drop-zone" id="drop" tabindex="0" role="button" aria-label="Drop files to upload">
            <div style="color:var(--accents-4); margin-bottom:12px; display:flex; justify-content:center;">
              ${renderSvg("download", 32)}
            </div>
            <div style="font-size:14px; font-weight:600; color:var(--fg); margin-bottom:4px;">
              Drag and drop files here, or click to browse
            </div>
            <div style="font-size:12px; color:var(--accents-5);">
              Up to ${info.maxFiles} files &middot; ${info.maxFileMb} MB each &middot; ${info.maxTotalMb} MB total
            </div>
          </div>
          <input id="picker" type="file" multiple hidden>
        </div>

        <!-- Right: Uploaded Files Manager Card -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <h2 style="font-size:15px; font-weight:600; color:var(--fg);">Sandbox Files</h2>
              <span class="badge" id="filesCountBadge">0 files</span>
            </div>
            <span id="usage" style="font-size:12px; color:var(--accents-5);"></span>
          </div>

          <!-- Renamed Modern Search Input -->
          <div class="search-input-wrap" style="margin-bottom:14px;">
            ${renderSvg("search", 15)}
            <input
              type="text"
              id="fileFilter"
              placeholder="Search files"
              oninput="renderFileList()"
            >
          </div>

          <!-- Files List -->
          <ul id="list" style="list-style:none; padding:0; margin:0; max-height:420px; overflow-y:auto; padding-bottom:40px; margin-bottom:-40px;"></ul>
          <div id="emptyFilesMsg" style="text-align:center; padding:32px 16px; color:var(--accents-5); font-size:13px;">
            No files uploaded in this session yet. Drag and drop above to begin.
          </div>

          <!-- Upload Files Pagination Bar -->
          <div class="pagination-bar" id="uploadPaginationBar" style="display:none; margin-top:14px;">
            <span id="uploadPageIndicator">Showing files</span>
            <div class="pagination-controls">
              <button type="button" class="pagination-btn" id="uploadPrevBtn" onclick="changeUploadPage(-1)">Previous</button>
              <button type="button" class="pagination-btn" id="uploadNextBtn" onclick="changeUploadPage(1)">Next</button>
            </div>
          </div>

          <div class="err" id="upErr" role="alert" style="color:var(--error); font-size:12px; margin-top:8px;"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Unified Upload File Rename Modal -->
  <div id="uploadRenameModal" class="modal-backdrop" hidden role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--fg);">Rename File</h3>
      <p style="font-size:13px; color:var(--accents-5); margin-bottom:16px; line-height:1.5;">Enter a new filename for the sandbox file:</p>
      <input type="text" id="uploadRenameInput" style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid var(--border); background:var(--code-bg); color:var(--fg); font-size:13px; margin-bottom:20px;">
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn" onclick="closeUploadRenameModal()">Cancel</button>
        <button type="button" id="uploadRenameSaveBtn" class="btn primary">Save Changes</button>
      </div>
    </div>
  </div>

  <!-- Custom Geist Toast Container -->
  <div id="toastContainer" class="toast-container" aria-live="polite"></div>

  <!-- Custom Geist Confirmation Modal -->
  <div id="confirmModal" class="modal-backdrop" hidden role="dialog" aria-modal="true">
    <div class="modal-card">
      <h3 id="modalTitle" style="font-size:16px; font-weight:700; margin-bottom:8px; color:var(--fg);">Confirm Action</h3>
      <p id="modalDesc" style="font-size:13px; color:var(--accents-5); margin-bottom:20px; line-height:1.5;"></p>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn" onclick="closeConfirmModal()">Cancel</button>
        <button type="button" id="modalConfirmBtn" class="btn" style="background:#e00; color:#fff; border-color:#e00;">Delete</button>
      </div>
    </div>
  </div>

  ${renderFooter()}

  <script nonce="${nonce}">
  (() => {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const isOwner = ${isOwner};
    let token = null, limits = null;
    const uploadedFileList = [];

    const fmt = (n) => {
      if (!n || n <= 0 || isNaN(n)) return '0 B';
      if (n < 1024) return n + ' B';
      if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
      if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
      return (n / 1073741824).toFixed(1) + ' GB';
    };

    function showToast(message, type = 'success') {
      const container = $('toastContainer');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      const icon = type === 'error'
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0070f3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      toast.innerHTML = icon + '<span>' + message.replace(/</g, '&lt;') + '</span>';
      container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      }, 3500);
    }

    let activeConfirmAction = null;
    function openDeleteModal(fileName, action) {
      $('modalTitle').textContent = 'Delete File';
      $('modalDesc').textContent = 'Are you sure you want to delete file "' + fileName + '" from the sandbox? This cannot be undone.';
      activeConfirmAction = async () => {
        closeConfirmModal();
        await action();
      };
      $('modalConfirmBtn').onclick = activeConfirmAction;
      const m = $('confirmModal');
      if (m) {
        m.removeAttribute('hidden');
        m.classList.add('open');
      }
    }

    window.closeConfirmModal = function() {
      const modal = $('confirmModal');
      if (modal) {
        modal.setAttribute('hidden', '');
        modal.classList.remove('open');
      }
      activeConfirmAction = null;
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeConfirmModal();
    });

    function show(loggedIn) {
      $('login').hidden = loggedIn;
      $('session').hidden = !loggedIn;
    }

    function reset(msg) {
      token = null;
      $('list').textContent = ''; $('upErr').textContent = ''; $('usage').textContent = '';
      show(false);
      $('loginErr').textContent = msg || '';
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

      if (Array.isArray(data.files)) {
        uploadedFileList.length = 0;
        data.files.forEach(f => {
          uploadedFileList.push({
            name: f.name,
            size: f.size,
            path: f.path,
            permanent: Boolean(f.permanent),
            statusText: fmt(f.size),
            failed: false
          });
        });
        renderFileList();
      }
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

    let uploadCurrentPage = 1;
    const UPLOAD_PER_PAGE = 10;

    window.changeUploadPage = function(delta) {
      uploadCurrentPage += delta;
      renderFileList();
    };

    let activeRenameUploadTarget = null;
    window.openUploadRenameModal = function(file) {
      activeRenameUploadTarget = file;
      const input = $('uploadRenameInput');
      input.value = file.name;
      const saveBtn = $('uploadRenameSaveBtn');
      saveBtn.onclick = executeUploadRename;
      const modal = $('uploadRenameModal');
      modal.removeAttribute('hidden');
      modal.classList.add('open');
      setTimeout(() => { input.focus(); input.select(); }, 50);
    };

    window.closeUploadRenameModal = function() {
      const modal = $('uploadRenameModal');
      if (modal) {
        modal.setAttribute('hidden', '');
        modal.classList.remove('open');
      }
      activeRenameUploadTarget = null;
    };

    async function executeUploadRename() {
      if (!activeRenameUploadTarget) return;
      const input = $('uploadRenameInput');
      const newName = (input.value || '').trim();
      if (!newName || newName === activeRenameUploadTarget.name) {
        closeUploadRenameModal();
        return;
      }
      const saveBtn = $('uploadRenameSaveBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        const res = await fetch('/upload/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldName: activeRenameUploadTarget.name, newName })
        });
        const data = await res.json();
        if (res.ok) {
          activeRenameUploadTarget.name = newName;
          activeRenameUploadTarget.path = (activeRenameUploadTarget.path || '').replace(/[^/]+$/, newName);
          showToast('File renamed to "' + newName + '"', 'success');
          closeUploadRenameModal();
          renderFileList();
        } else {
          showToast(data.error || 'Failed to rename file', 'error');
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.kebab-btn');
      const allDropdowns = document.querySelectorAll('.kebab-dropdown.open');
      if (btn) {
        e.stopPropagation();
        const wrap = btn.closest('.kebab-wrap');
        const dropdown = wrap ? wrap.querySelector('.kebab-dropdown') : null;
        allDropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
        if (dropdown) {
          const isOpen = dropdown.classList.contains('open');
          if (!isOpen) {
            const rect = btn.getBoundingClientRect();
            if (window.innerHeight - rect.bottom < 180) {
              dropdown.classList.add('pop-up');
            } else {
              dropdown.classList.remove('pop-up');
            }
            dropdown.classList.add('open');
          } else {
            dropdown.classList.remove('open');
          }
        }
        return;
      }
      allDropdowns.forEach(d => d.classList.remove('open'));
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeConfirmModal();
        closeUploadRenameModal();
        document.querySelectorAll('.kebab-dropdown.open').forEach(d => d.classList.remove('open'));
      }
    });

    window.renderFileList = function() {
      const filter = ($('fileFilter').value || '').toLowerCase().trim();
      const container = $('list');
      container.innerHTML = '';
      const visible = uploadedFileList.filter(f => f.name.toLowerCase().includes(filter));

      $('filesCountBadge').textContent = uploadedFileList.length + ' file' + (uploadedFileList.length === 1 ? '' : 's');
      $('emptyFilesMsg').style.display = visible.length === 0 ? 'block' : 'none';

      const totalBytes = uploadedFileList.reduce((acc, x) => acc + (x.size || 0), 0);
      const usageEl = $('usage');
      if (usageEl) usageEl.textContent = fmt(totalBytes) + ' used';

      // Pagination
      const total = visible.length;
      const totalPages = Math.max(1, Math.ceil(total / UPLOAD_PER_PAGE));
      if (uploadCurrentPage > totalPages) uploadCurrentPage = totalPages;
      if (uploadCurrentPage < 1) uploadCurrentPage = 1;

      const start = (uploadCurrentPage - 1) * UPLOAD_PER_PAGE;
      const end = start + UPLOAD_PER_PAGE;
      const pageFiles = visible.slice(start, end);

      const indicator = $('uploadPageIndicator');
      if (indicator) {
        indicator.textContent = total > 0 ? ('Showing ' + (start + 1) + '–' + Math.min(end, total) + ' of ' + total + ' files') : 'No files';
      }
      const prevBtn = $('uploadPrevBtn');
      const nextBtn = $('uploadNextBtn');
      if (prevBtn) prevBtn.disabled = uploadCurrentPage <= 1;
      if (nextBtn) nextBtn.disabled = uploadCurrentPage >= totalPages;
      const bar = $('uploadPaginationBar');
      if (bar) bar.style.display = total > UPLOAD_PER_PAGE ? 'flex' : 'none';

      pageFiles.forEach(f => {
        const li = document.createElement('li');
        li.className = 'file-item' + (f.failed ? ' fail' : '');

        const info = document.createElement('div');
        info.className = 'file-info';

        const nameEl = document.createElement('span');
        nameEl.className = 'file-name';
        nameEl.textContent = f.path || f.name;

        const metaEl = document.createElement('div');
        metaEl.className = 'file-meta';
        metaEl.innerHTML = '<span>' + (f.statusText || fmt(f.size)) + '</span>';
        if (f.permanent) {
          metaEl.innerHTML += '<span class="badge success">Permanent</span>';
        } else if (!f.failed && f.path) {
          metaEl.innerHTML += '<span class="badge">60m TTL</span>';
        }
        info.append(nameEl, metaEl);

        const actions = document.createElement('div');
        actions.className = 'file-actions';

        if (!f.failed && f.path) {
          const kebabWrap = document.createElement('div');
          kebabWrap.className = 'kebab-wrap';

          const kebabBtn = document.createElement('button');
          kebabBtn.type = 'button';
          kebabBtn.className = 'kebab-btn';
          kebabBtn.setAttribute('aria-label', 'File Actions');
          kebabBtn.textContent = '⋮';

          const dropdown = document.createElement('div');
          dropdown.className = 'kebab-dropdown';

          const copyBtn = document.createElement('button');
          copyBtn.type = 'button';
          copyBtn.className = 'kebab-item';
          copyBtn.innerHTML = '${renderSvg("copy", 14)} <span>Copy Path</span>';
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(f.path);
            showToast('File path copied to clipboard', 'success');
          };

          const dlLink = document.createElement('a');
          dlLink.className = 'kebab-item';
          dlLink.href = '/upload/api/download?name=' + encodeURIComponent(f.name);
          dlLink.download = f.name;
          dlLink.innerHTML = '${renderSvg("download", 14)} <span>Download File</span>';

          const permBtn = document.createElement('button');
          permBtn.type = 'button';
          permBtn.className = 'kebab-item';
          permBtn.innerHTML = '${renderSvg("shield", 14)} <span>' + (f.permanent ? 'Revert' : 'Keep') + '</span>';
          permBtn.onclick = async () => {
            permBtn.disabled = true;
            try {
              const res = await api('/file/permanent?name=' + encodeURIComponent(f.name) + '&permanent=' + (!f.permanent), {
                method: 'POST',
                headers: { 'x-upload-token': token }
              });
              f.permanent = Boolean(res.permanent);
              showToast(f.permanent ? 'File marked as permanent' : 'Permanent retention reverted', 'success');
              renderFileList();
            } catch (e) {
              showToast('Error: ' + e.message, 'error');
            } finally {
              permBtn.disabled = false;
            }
          };

          const renameBtn = document.createElement('button');
          renameBtn.type = 'button';
          renameBtn.className = 'kebab-item';
          renameBtn.innerHTML = '${renderSvg("edit", 14)} <span>Rename</span>';
          renameBtn.onclick = () => {
            openUploadRenameModal(f);
          };

          const divider = document.createElement('div');
          divider.className = 'kebab-divider';

          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'kebab-item danger';
          delBtn.innerHTML = '${renderSvg("trash", 14)} <span>Delete File</span>';
          delBtn.onclick = () => {
            openDeleteModal(f.name, async () => {
              try {
                await api('/file?name=' + encodeURIComponent(f.name), {
                  method: 'DELETE',
                  headers: { 'x-upload-token': token }
                });
                const idx = uploadedFileList.indexOf(f);
                if (idx >= 0) uploadedFileList.splice(idx, 1);
                showToast('File "' + f.name + '" deleted successfully', 'success');
                renderFileList();
              } catch (e) {
                showToast('Could not delete: ' + e.message, 'error');
              }
            });
          };

          dropdown.append(copyBtn, dlLink, permBtn, renameBtn, divider, delBtn);
          kebabWrap.append(kebabBtn, dropdown);
          actions.appendChild(kebabWrap);
        }

        li.append(info, actions);
        container.appendChild(li);
      });
    };

    function sendOne(file) {
      const isPermanent = Boolean($('permSave')?.checked);
      const item = {
        name: file.name,
        size: file.size,
        statusText: 'uploading',
        permanent: isPermanent,
        failed: false
      };
      uploadedFileList.unshift(item);
      renderFileList();

      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload/api/files');
        xhr.setRequestHeader('x-upload-token', token);
        xhr.setRequestHeader('x-filename', encodeURIComponent(file.name));
        xhr.setRequestHeader('content-type', 'application/octet-stream');
        if (isPermanent) {
          xhr.setRequestHeader('x-permanent', 'true');
        }
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            item.statusText = Math.round(e.loaded / e.total * 100) + '%';
            renderFileList();
          }
        };
        xhr.onload = () => {
          let d = {}; try { d = JSON.parse(xhr.responseText); } catch (_) {}
          if (xhr.status === 201) {
            item.path = d.file.path;
            item.name = d.file.name;
            item.size = d.file.size;
            item.permanent = Boolean(d.file.permanent);
            item.statusText = fmt(d.file.size);
            $('usage').textContent = d.files.length + ' file(s), ' + fmt(d.bytes);
            showToast('Uploaded ' + item.name + ' successfully', 'success');
          } else {
            item.failed = true;
            item.statusText = d.error || 'failed';
            showToast('Upload failed: ' + item.statusText, 'error');
            if (xhr.status === 401) reset('Upload session closed. Uploaded files remain active in your sandbox.');
          }
          renderFileList();
          resolve();
        };
        xhr.onerror = () => {
          item.failed = true;
          item.statusText = 'network error';
          showToast('Network error during upload', 'error');
          renderFileList();
          resolve();
        };
        xhr.send(file);
      });
    }

    async function upload(files) {
      $('upErr').textContent = '';
      for (const f of files) {
        if (!token) return;
        if (f.size === 0) {
          uploadedFileList.unshift({ name: f.name, size: 0, statusText: 'empty file', failed: true });
          renderFileList();
          continue;
        }
        if (limits && f.size > limits.maxFileBytes) {
          uploadedFileList.unshift({ name: f.name, size: f.size, statusText: 'too large', failed: true });
          renderFileList();
          continue;
        }
        await sendOne(f);
      }
    }

    const drop = $('drop'), picker = $('picker');
    drop.addEventListener('click', () => picker.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.click(); } });
    picker.addEventListener('change', () => { const f = [...picker.files]; picker.value = ''; upload(f); });

    ['dragenter', 'dragover'].forEach((t) => {
      drop.addEventListener(t, (e) => {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.add('drag-over');
      });
      window.addEventListener(t, (e) => {
        e.preventDefault();
      });
    });

    ['dragleave', 'drop'].forEach((t) => {
      drop.addEventListener(t, (e) => {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.remove('drag-over');
      });
    });

    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      drop.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files) {
        upload([...e.dataTransfer.files]);
      }
    });

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());

    window.addEventListener('pagehide', () => {
      if (token) navigator.sendBeacon('/upload/api/end', new Blob([JSON.stringify({ token })], { type: 'application/json' }));
    });

    window.toggleTheme = function() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('qw-theme', isDark ? 'dark' : 'light');
      updateThemeIcon(isDark);
    };

    function updateThemeIcon(isDark) {
      const sun = $('themeIconSun');
      const moon = $('themeIconMoon');
      if (sun) sun.style.display = isDark ? 'block' : 'none';
      if (moon) moon.style.display = isDark ? 'none' : 'block';
    }

    const initialDark = document.documentElement.classList.contains('dark');
    updateThemeIcon(initialDark);
  })();
  </script>
</body>
</html>`;
}
