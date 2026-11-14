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
import { renderUploadPage, type PageInfo } from "./views.js";

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
      `default-src 'none'; script-src 'nonce-${nonce}' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; script-src-attr 'unsafe-inline'; style-src 'nonce-${nonce}' 'unsafe-inline'; style-src-attr 'unsafe-inline'; style-src-elem 'self' 'unsafe-inline' 'nonce-${nonce}'; font-src 'self' data: https:; frame-src https://www.google.com/recaptcha/; connect-src 'self' https://www.google.com/recaptcha/; img-src 'self' https: data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
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
      const onRenderService =
        process.env.RENDER === "true" || Boolean(process.env.RENDER_SERVICE_ID);
      const renderSandboxOptIn =
        process.env.ENABLE_SANDBOX === "true" &&
        process.env.SANDBOX_RENDER_OWNER_ONLY_ACK === "true" &&
        process.env.SANDBOX_REQUIRE_ISOLATION === "false";
      const authenticatedOwnerKey =
        isOwner || apiKeyEntry?.role === "owner" || isPrimaryKey;

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
        json(res, 403, {
          error:
            "On Render, workspace uploads are available only to the configured owner after explicit owner-only sandbox opt-in.",
        });
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
          json(res, 409, {
            error:
              "Create an API key for this account before opening a sandbox upload session.",
          });
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
// UI Render Re-exports
// -------------------------------------------------------------------------------------------------

export { renderUploadPage, type PageInfo };
