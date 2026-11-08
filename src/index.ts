import express, { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  isInitializeRequest,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

import {
  SERVER_ICONS,
  getServerIcons,
  getServerInfoIcons,
  ICON_48_DATA_URI,
  ICON_48_BUFFER,
  ICON_24_BUFFER,
  GITHUB_ICON_48_URL,
  GITHUB_ICON_128_URL,
  GITHUB_LOGO_URL,
  RENDER_PUBLIC_URL,
  RENDER_ICON_48_URL,
  RENDER_ICON_128_URL,
  RENDER_LOGO_URL,
} from "./icons.js";
import { registerGitHubTools } from "./githubTools.js";
import { registerRenderTools } from "./renderTools.js";
import { registerSandboxTools, destroySandbox } from "./sandboxTools.js";
import {
  registerFileTools,
  registerFileRoutes,
  startFileSweeper,
  stopFileStore,
  getFileStore,
} from "./fileShare.js";
import {
  registerUploadRoutes,
  shutdownUploadSessions,
  listUploadedFiles,
  UPLOAD_DIR,
} from "./uploadSessions.js";
import {
  createGoogleAuthRouter,
  isAuthorizedApiKey,
  findAuthorizedApiKey,
  parseOwnerCookie,
  listDynamicKeys,
  createDynamicKey,
  revokeDynamicKey,
  renameDynamicKey,
  ensureMongoAuth,
  syncKeyToMongo,
  revokeKeyInMongo,
  getMongoDb,
} from "./googleAuth.js";
import { fileShareRegistry } from "./fileShareRegistry.js";
import {
  createMcpOAuthRouter,
  verifyAccessToken,
  getOAuthClient,
  listActiveOAuthAuthorizations,
  loadOAuthFromMongo,
  renameOAuthClient,
} from "./mcpOAuth.js";
import { statsTracker } from "./stats.js";
import {
  renderHomePage,
  renderStatsPage,
  renderApiKeysPage,
  renderToolsPage,
  renderStorePage,
  renderNotFoundPage,
  renderSettingsPage,
  type StoredFileInfo,
} from "./views.js";
import { logIsolationStatus } from "./sandboxProc.js";
import { createLimiter, rateLimitMiddleware, clientIp } from "./rateLimit.js";
import {
  TOOL_CATEGORY,
  ToolCategory,
  getSessionContext,
  registerSessionAuth,
  registerSessionSandboxId,
  getSandboxIdForSession,
  getAuthKeyForSession,
  computeAuthKey,
  safeEqual,
  registerSecret,
  sanitizeOutput,
  sandboxRootForAuthKey,
} from "./security.js";
import { registerCodeGraphTools } from "./codeGraphTools.js";
import {
  getKeySettings,
  getUserQuota,
  updateKeyCredentials,
  updateKeyTools,
  toggleKeyTool,
  getUserRole,
  isOwnerEmail,
  maskSecret,
  generateSandboxId,
  type KeySettings,
} from "./userSettings.js";

const DEFAULT_GITHUB_PAT =
  process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_PAT;
const DEFAULT_RENDER_API_KEY =
  process.env.RENDER_API_KEY || process.env.RENDER_PAT;
const MCP_API_KEY = process.env.MCP_API_KEY;

if (!MCP_API_KEY) {
  console.error(
    "FATAL: MCP_API_KEY is not set. Refusing to start without authentication.",
  );
  process.exit(1);
}
if (MCP_API_KEY.length < 24) {
  console.warn(
    "⚠️  MCP_API_KEY is shorter than 24 characters. Use a long random value, e.g. `openssl rand -hex 32`.",
  );
}
registerSecret(DEFAULT_GITHUB_PAT);
registerSecret(DEFAULT_RENDER_API_KEY);

const ALLOW_QUERY_API_KEY = process.env.ALLOW_QUERY_API_KEY === "true";

const MAX_SESSIONS = Math.max(1, Number(process.env.MAX_SESSIONS) || 50);
const MAX_BODY_MB = Math.min(
  64,
  Math.max(1, Number(process.env.MAX_BODY_MB) || 16),
);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  lastActive: number;
}
const transports = new Map<string, SessionEntry>();

function tagCategory(
  registry: Record<string, any>,
  categoryOf: Record<string, ToolCategory>,
  fallbackCategory: ToolCategory,
) {
  for (const name of Object.keys(registry)) {
    if (!categoryOf[name])
      categoryOf[name] = TOOL_CATEGORY[name] || fallbackCategory;
  }
}

function baseUrl(req: Request): string {
  const protoRaw = (req.headers["x-forwarded-proto"] as string)
    ?.split(",")[0]
    .trim()
    .toLowerCase();
  const proto =
    protoRaw === "http" || protoRaw === "https"
      ? protoRaw
      : req.protocol === "http"
        ? "http"
        : "https";
  const hostRaw = req.get("host") || "localhost:3000";
  const host = /^[A-Za-z0-9.\-:\[\]]{1,255}$/.test(hostRaw)
    ? hostRaw
    : "localhost:3000";
  return `${proto}://${host}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-load icon assets into memory for instant base64 Data URI serving
let icon48DataUri = "";
let icon128DataUri = "";

function loadAsset(fileName: string): Buffer | null {
  for (const candidate of [
    path.resolve(process.cwd(), "assets", fileName),
    path.resolve(__dirname, "../assets", fileName),
    path.resolve(__dirname, "assets", fileName),
    path.resolve("assets", fileName),
  ]) {
    try {
      if (fs.existsSync(candidate)) return fs.readFileSync(candidate);
    } catch {}
  }
  return null;
}

function createMasterServer(
  githubToken: string,
  renderToken: string | undefined,
  sessionId: string,
  req: Request,
  keySettings?: KeySettings,
) {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const serverIcons = getServerIcons(base);
  const serverInfoIcons = getServerInfoIcons(base);
  const server = new McpServer(
    {
      name: "krix",
      title: "Krix",
      version: "1.1.0",
      description:
        "Remote GitHub discovery, Render management, and sandboxed execution.",
      websiteUrl: "https://github.com/imunmuted/Krix",
      icons: serverInfoIcons,
    },
    {
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
    },
  );

  const primaryIconUrl = ICON_48_DATA_URI;
  const primaryLogoUrl = ICON_48_DATA_URI;
  (server.server as any)._serverInfo.icon = primaryIconUrl;
  (server.server as any)._serverInfo.iconUrl = primaryIconUrl;
  (server.server as any)._serverInfo.logo = primaryLogoUrl;
  (server.server as any)._serverInfo.logoUrl = primaryLogoUrl;
  (server.server as any)._serverInfo.icons = serverInfoIcons;

  const octokit = new Octokit({ auth: githubToken || "" });

  const registry: Record<string, any> = {};
  const categoryOf: Record<string, ToolCategory> = {};

  registerGitHubTools(server, octokit, sessionId, registry);
  tagCategory(registry, categoryOf, "github_admin");

  registerRenderTools(server, () => renderToken, registry);
  tagCategory(registry, categoryOf, "render");

  registerSandboxTools(server, sessionId, githubToken, registry);
  tagCategory(registry, categoryOf, "sandbox");

  const publicBase = baseUrl(req);
  registerFileTools(server, sessionId, registry, () => publicBase);
  tagCategory(registry, categoryOf, "files");

  registerCodeGraphTools(server, sessionId, registry);
  tagCategory(registry, categoryOf, "codegraph");

  const ctx = getSessionContext(sessionId);
  for (const [name, handle] of Object.entries(registry)) {
    const cat = categoryOf[name];
    const isCustomDisabled = keySettings?.disabledTools?.includes(name);
    const isCustomEnabled = keySettings?.enabledTools?.includes(name);

    if (isCustomDisabled) {
      handle.disable();
    } else if (isCustomEnabled) {
      handle.enable();
    } else if (cat === "codegraph" || cat === "search") {
      // Code Graph and Search tools remain disabled by default unless explicitly enabled
      handle.disable();
    } else if (ctx.enabledCategories.has(cat)) {
      handle.enable();
    } else {
      handle.disable();
    }
  }

  // Ensure every tool returned to MCP clients (like Gemini) includes icons metadata (matching GitHub MCP Server)
  const rawServer = server.server as any;
  const originalListTools = rawServer._requestHandlers?.get("tools/list");
  if (originalListTools) {
    server.server.setRequestHandler(
      ListToolsRequestSchema,
      async (request, extra) => {
        const result = await originalListTools(request, extra);
        return {
          ...result,
          tools: (result.tools || []).map((t: any) => ({
            ...t,
            icons: serverIcons,
          })),
        };
      },
    );
  }

  return server;
}

// ---------------------------------------------------------------------------------------------
// HTTP layer
// ---------------------------------------------------------------------------------------------

const app = express();
app.disable("x-powered-by");
app.disable("etag");
{
  const hops = process.env.TRUST_PROXY;
  app.set(
    "trust proxy",
    hops === undefined || hops === ""
      ? 1
      : hops === "false"
        ? false
        : Number.isFinite(Number(hops))
          ? Number(hops)
          : hops,
  );
}

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (req.secure)
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  next();
});

// Coarse global limiter (cheap protection for every route, including unauthenticated ones).
app.use(
  rateLimitMiddleware(
    createLimiter({
      windowMs: 60_000,
      max: Number(process.env.RATE_LIMIT_PER_MIN) || 600,
    }),
    "Rate limit exceeded.",
  ),
);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

registerFileRoutes(app);

// Mount OAuth 2.1 discovery and authorization server router
app.use(createMcpOAuthRouter());

// Mount single-user Google OAuth and API key management router
app.use("/auth", createGoogleAuthRouter());

// Temporary web upload page: MCP key -> short-lived session -> files land in the caller's sandbox.
registerUploadRoutes(app, {
  apiKey: MCP_API_KEY,
  defaultGithubToken: DEFAULT_GITHUB_PAT,
  publicBaseUrl: process.env.PUBLIC_BASE_URL,
});

const failedAuthLimiter = createLimiter({ windowMs: 15 * 60_000, max: 10 });

function jsonRpcError(
  res: Response,
  status: number,
  code: number,
  message: string,
  id: unknown = null,
): void {
  if (!res.headersSent)
    res.status(status).json({ jsonrpc: "2.0", error: { code, message }, id });
}

function extractClientKey(req: Request): string | undefined {
  const header = req.headers["x-api-key"];
  if (typeof header === "string" && header) return header;
  const auth = req.headers["authorization"];
  if (typeof auth === "string") {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return m[1].trim();
  }
  if (ALLOW_QUERY_API_KEY && typeof req.query.api_key === "string")
    return req.query.api_key;
  return undefined;
}

async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = clientIp(req);
  if (!failedAuthLimiter.hit(ip, 0)) {
    res.setHeader(
      "Retry-After",
      String(failedAuthLimiter.retryAfterSec(ip) || 900),
    );
    jsonRpcError(res, 429, -32000, "Too many failed authentication attempts.");
    return;
  }

  const clientKey = extractClientKey(req);
  if (clientKey) {
    // 1. Check OAuth 2.1 access token
    const tokenCheck = await verifyAccessToken(clientKey);
    if (tokenCheck.valid && tokenCheck.payload) {
      failedAuthLimiter.reset(ip);
      const payload = tokenCheck.payload;
      (req as any).oauthUser = payload;
      const clientId = payload.client_id;
      const registeredClient = clientId ? getOAuthClient(clientId) : undefined;
      const keyId =
        clientId || (payload.sub ? `oauth:${payload.sub}` : "oauth:client");
      let label = registeredClient?.clientName;
      if (!label) {
        if (clientId && clientId.toLowerCase().includes("gemini")) {
          label = "Google Gemini";
        } else if (clientId) {
          label = `OAuth (${clientId})`;
        } else if (payload.sub) {
          label = `OAuth (${payload.sub})`;
        } else {
          label = "OAuth Client";
        }
      }
      (req as any).clientAuth = {
        keyId,
        label,
        type: "oauth",
      };
      next();
      return;
    }

    // 2. Check dynamic API keys (registered in-memory / MongoDB)
    const dynEntry = findAuthorizedApiKey(clientKey);
    if (dynEntry) {
      failedAuthLimiter.reset(ip);
      (req as any).clientAuth = {
        keyId: dynEntry.id,
        label: dynEntry.label,
        type: "api_key",
      };
      next();
      return;
    }

    // 3. Check Primary master key from environment
    if (MCP_API_KEY && safeEqual(clientKey, MCP_API_KEY)) {
      failedAuthLimiter.reset(ip);
      (req as any).clientAuth = {
        keyId: "primary-key",
        label: "Primary Key",
        type: "master_key",
      };
      next();
      return;
    }
  }

  failedAuthLimiter.hit(ip);
  const base = baseUrl(req);
  res.setHeader(
    "WWW-Authenticate",
    `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"`,
  );
  jsonRpcError(
    res,
    401,
    -32000,
    "Unauthorized. Connect using OAuth 2.1 or supply a valid API key.",
  );
}

function checkOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (
    ALLOWED_ORIGINS.length &&
    typeof origin === "string" &&
    !ALLOWED_ORIGINS.includes(origin)
  ) {
    jsonRpcError(res, 403, -32000, "Origin not allowed.");
    return;
  }
  next();
}

app.all(
  "/mcp",
  checkOrigin,
  authenticate, // authenticate BEFORE parsing a (potentially huge) body
  (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  },
  express.json({ limit: `${MAX_BODY_MB}mb` }),
  async (req: Request, res: Response): Promise<void> => {
    await statsTracker.ensureMongo().catch((error) => {
      console.error("[stats] startup restore before MCP request failed:", error?.message || error);
    });
    const startTime = Date.now();
    const clientAuth = (req as any).clientAuth || {
      keyId: "primary-key",
      label: "Primary Key",
      type: "master_key",
    };
    const keyId = clientAuth.keyId || "primary-key";
    const keySettings = getKeySettings(keyId);

    const githubToken =
      (typeof req.headers["x-github-token"] === "string"
        ? req.headers["x-github-token"]
        : "") ||
      keySettings.customGitHubToken ||
      DEFAULT_GITHUB_PAT ||
      "";
    const renderToken =
      (typeof req.headers["x-render-token"] === "string"
        ? req.headers["x-render-token"]
        : "") ||
      keySettings.customRenderToken ||
      DEFAULT_RENDER_API_KEY;
    registerSecret(githubToken);
    registerSecret(renderToken);
    const sessionId =
      typeof req.headers["mcp-session-id"] === "string"
        ? req.headers["mcp-session-id"]
        : undefined;
    const body = req.body;

    const rawLen = req.headers["content-length"];
    const bytesIn = rawLen
      ? Number(rawLen) || 0
      : body
        ? Buffer.byteLength(JSON.stringify(body))
        : 0;
    let bytesOut = 0;
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    let recorded = false;
    let responseText = "";
    const appendResponse = (chunk: any) => {
      if (chunk && responseText.length < 2_000_000) {
        responseText += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      }
    };
    const recordMetrics = () => {
      if (recorded) return;
      recorded = true;
      const requests = Array.isArray(body) ? body : [body];
      const requestItems = requests.filter((item: any) => item && typeof item.method === "string");
      const responseErrors = new Map<string, boolean>();
      let responseFailed = res.statusCode >= 400;
      try {
        const parsed = JSON.parse(responseText);
        const responses = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of responses) {
          const failed = Boolean(item?.error || item?.result?.isError);
          if (item?.id !== undefined && item?.id !== null) {
            responseErrors.set(String(item.id), failed);
          }
          responseFailed = responseFailed || failed;
        }
      } catch {
        // Non-JSON/empty responses retain HTTP status as the success signal.
      }
      const clientAuth = (req as any).clientAuth || {
        keyId: "unknown", label: "Unknown Client", type: "api_key",
      };
      const authType: "api_key" | "master" | "oauth" =
        clientAuth.type === "master_key" ? "master" :
        clientAuth.type === "oauth" ? "oauth" : "api_key";
      statsTracker.setActiveSessions(transports.size);

      // Count every JSON-RPC item in a batch, not only the first item.
      const items = requestItems.length ? requestItems : [null];
      items.forEach((item: any, index: number) => {
        const isToolCall = item?.method === "tools/call" && typeof item?.params?.name === "string";
        const toolName = isToolCall ? String(item.params.name) : String(item?.method || "mcp_request");
        statsTracker.recordRequest({
          keyId: clientAuth.keyId,
          label: clientAuth.label,
          type: authType,
          toolName,
          isActualTool: isToolCall,
          durationMs: Date.now() - startTime,
          bytesIn: index === 0 ? bytesIn : 0,
          bytesOut: index === 0 ? bytesOut : 0,
          isError: res.statusCode >= 400 ||
            (item?.id !== undefined && responseErrors.has(String(item.id))
              ? Boolean(responseErrors.get(String(item.id)))
              : items.length === 1 && responseFailed),
          statusCode: res.statusCode,
          ip: clientIp(req),
          userAgent: (req.headers["user-agent"] as string) || "",
        });
      });
    };

    (res as any).write = function (chunk: any, ...args: any[]) {
      if (chunk) {
        bytesOut += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
        appendResponse(chunk);
      }
      return (origWrite as any)(chunk, ...args);
    };

    (res as any).end = function (chunk: any, ...args: any[]) {
      if (chunk) {
        bytesOut += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
        appendResponse(chunk);
      }
      recordMetrics();
      return (origEnd as any)(chunk, ...args);
    };

    try {
      if (sessionId) {
        const entry = transports.get(sessionId);
        if (!entry) {
          jsonRpcError(
            res,
            404,
            -32001,
            "Session not found. Re-initialize.",
            body?.id ?? null,
          );
          return;
        }
        // A session is bound to the identity that created it.
        if (getAuthKeyForSession(sessionId) !== computeAuthKey(githubToken)) {
          jsonRpcError(
            res,
            403,
            -32000,
            "Session identity mismatch.",
            body?.id ?? null,
          );
          return;
        }
        entry.lastActive = Date.now();
        await entry.transport.handleRequest(req, res, body);
        return;
      }

      const isInit = Array.isArray(body)
        ? body.some((m) => isInitializeRequest(m))
        : isInitializeRequest(body);
      if (req.method !== "POST" || !isInit) {
        jsonRpcError(
          res,
          400,
          -32000,
          "Bad Request: no valid session. Send an initialize request first.",
          body?.id ?? null,
        );
        return;
      }
      if (transports.size >= MAX_SESSIONS) {
        res.setHeader("Retry-After", "30");
        jsonRpcError(
          res,
          503,
          -32000,
          "Server is at capacity. Try again shortly.",
          body?.id ?? null,
        );
        return;
      }

      const newSessionId = crypto.randomUUID();
      registerSessionAuth(newSessionId, githubToken);

      const effectiveSandboxId =
        keySettings.sandboxId ||
        (keyId === "primary-key" ? "owner" : `sbx_${keyId}`);
      registerSessionSandboxId(newSessionId, effectiveSandboxId);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (id) => {
          transports.set(id, { transport, lastActive: Date.now() });
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          destroySandbox(transport.sessionId).catch(() => {});
          transports.delete(transport.sessionId);
        }
      };

      const masterServer = createMasterServer(
        githubToken,
        renderToken,
        newSessionId,
        req,
        keySettings,
      );
      await masterServer.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error: any) {
      console.error(
        "[mcp] request failed:",
        sanitizeOutput(String(error?.stack || error?.message || error)).slice(
          0,
          2000,
        ),
      );
      jsonRpcError(
        res,
        500,
        -32603,
        "Internal server error.",
        body?.id ?? null,
      );
    }
  },
);

// Static assets and discovery manifests (for Gemini, browser tabs, and MCP discovery)
const staticAssetPaths = [
  "/logo.png",
  "/icon-512.png",
  "/icon-192.png",
  "/icon-128.png",
  "/icon-64.png",
  "/icon-48.png",
  "/icon-24.png",
  "/apple-touch-icon.png",
  "/logo.jpg",
  "/logo.jpeg",
  "/favicon.ico",
  "/manifest.json",
  "/manifest.webmanifest",
  "/server.json",
  "/.well-known/mcp.json",
  "/gemini-extension.json",
  "/mcp/server-card",
  "/server-card",
];

app.options(staticAssetPaths, (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.status(204).end();
});

app.get(
  [
    "/logo.png",
    "/icon-512.png",
    "/icon-192.png",
    "/icon-128.png",
    "/icon-64.png",
    "/icon-48.png",
    "/icon-24.png",
    "/apple-touch-icon.png",
  ],
  (req, res) => {
    const reqName = path.basename(req.path);
    const targetFile =
      reqName === "apple-touch-icon.png" ? "icon-128.png" : reqName;
    const buf =
      loadAsset(targetFile) ||
      (targetFile.includes("24") ? ICON_24_BUFFER : ICON_48_BUFFER);
    if (buf) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", String(buf.length));
      res.setHeader("Content-Disposition", `inline; filename="${targetFile}"`);
      res.setHeader(
        "Cache-Control",
        "public, max-age=3600, stale-while-revalidate=86400",
      );
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
      res.setHeader("Timing-Allow-Origin", "*");
      res.send(buf);
    } else {
      res.status(404).send("Icon not found");
    }
  },
);

app.get(["/logo.jpg", "/logo.jpeg"], (_req, res) => {
  const buf = loadAsset("logo.jpg") || ICON_48_BUFFER;
  if (buf) {
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Length", String(buf.length));
    res.setHeader("Content-Disposition", 'inline; filename="logo.jpg"');
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400",
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader("Timing-Allow-Origin", "*");
    res.send(buf);
  } else {
    res.status(404).send("Logo not found");
  }
});

app.get("/favicon.ico", (_req, res) => {
  const buf = loadAsset("favicon.ico") || ICON_48_BUFFER;
  if (buf) {
    res.setHeader("Content-Type", "image/x-icon");
    res.setHeader("Content-Length", String(buf.length));
    res.setHeader("Content-Disposition", 'inline; filename="favicon.ico"');
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400",
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader("Timing-Allow-Origin", "*");
    res.send(buf);
  } else {
    res.status(404).send("Favicon not found");
  }
});

app.get(["/manifest.json", "/manifest.webmanifest"], (req, res) => {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  res.setHeader("Content-Type", "application/manifest+json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.json({
    name: "Krix",
    short_name: "Krix",
    description:
      "Remote GitHub discovery, Render management, and sandboxed execution.",
    start_url: "/",
    display: "standalone",
    icons: getServerIcons(base).map((icon) => ({
      ...icon,
      type: icon.mimeType,
    })),
  });
});

app.get(["/server.json", "/.well-known/mcp.json"], (req, res) => {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.json({
    $schema:
      "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    name: "io.github.imunmuted/krix",
    description:
      "Remote GitHub discovery, Render management, and sandboxed execution.",
    title: "Krix",
    repository: {
      url: "https://github.com/imunmuted/Krix",
      source: "github",
    },
    version: "1.1.0",
    icons: getServerIcons(base),
    remotes: [
      {
        type: "streamable-http",
        url: `${base}/mcp`,
        headers: [
          {
            name: "x-api-key",
            description: "Krix MCP API key",
            isSecret: true,
          },
        ],
      },
    ],
  });
});

app.get("/gemini-extension.json", (req, res) => {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.json({
    name: "krix",
    title: "Krix",
    version: "1.1.0",
    description:
      "Remote GitHub discovery, Render management, and sandboxed execution.",
    icon: ICON_48_DATA_URI,
    iconUrl: ICON_48_DATA_URI,
    logo: ICON_48_DATA_URI,
    logoUrl: ICON_48_DATA_URI,
    icons: getServerIcons(base),
    mcpServers: {
      krix: {
        description:
          "Remote GitHub discovery, Render management, and sandboxed execution.",
        httpUrl: `${base}/mcp`,
        url: `${base}/mcp`,
        headers: {
          "x-api-key": "$MCP_API_KEY",
        },
      },
    },
  });
});

app.get(["/mcp/server-card", "/server-card"], (req, res) => {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.json({
    $schema:
      "https://raw.githubusercontent.com/modelcontextprotocol/specification/main/schema/server-card.json",
    name: "krix",
    title: "Krix",
    version: "1.1.0",
    description:
      "Remote GitHub discovery, Render management, and sandboxed execution.",
    websiteUrl: "https://github.com/imunmuted/Krix",
    icons: getServerIcons(base),
    remotes: [
      {
        type: "sse",
        url: `${base}/sse`,
      },
      {
        type: "streamable-http",
        url: `${base}/mcp`,
      },
    ],
  });
});

app.get(["/", "/home"], async (req, res) => {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  const authKey = computeAuthKey(
    DEFAULT_GITHUB_PAT || (owner ? `owner_${owner.email}` : ""),
  );
  const root = sandboxRootForAuthKey(authKey);
  const uploads = await listUploadedFiles(root);
  const dynamicKeys = listDynamicKeys();
  const isOwner = Boolean(owner);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    renderHomePage({
      base,
      isOwner,
      owner,
      uploads,
      dynamicKeys,
    }),
  );
});

app.get(["/api", "/keys"], async (req, res) => {
  await Promise.all([
    ensureMongoAuth().catch(() => {}),
    loadOAuthFromMongo().catch(() => {}),
    statsTracker.ensureMongo().catch(() => {}),
  ]);
  const db = getMongoDb();
  if (db) fileShareRegistry.setMongoDb(db);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  const isOwner = Boolean(owner);
  const dynamicKeys = listDynamicKeys();
  const oauthAuthorizations = listActiveOAuthAuthorizations();

  if (
    req.headers.accept?.includes("application/json") &&
    !req.headers.accept?.includes("text/html")
  ) {
    if (!isOwner) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    res.json({ keys: dynamicKeys, oauthAuthorizations });
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    renderApiKeysPage({
      base,
      isOwner,
      owner,
      keys: dynamicKeys,
      oauthAuthorizations,
    }),
  );
});

app.get("/api/keys", async (req, res) => {
  await Promise.all([
    ensureMongoAuth().catch(() => {}),
    loadOAuthFromMongo().catch(() => {}),
    statsTracker.ensureMongo().catch(() => {}),
  ]);
  const dbTools = getMongoDb();
  if (dbTools) fileShareRegistry.setMongoDb(dbTools);
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res
      .status(401)
      .json({ error: "Unauthorized. Sign in as owner to list keys." });
    return;
  }
  res.json({ keys: listDynamicKeys() });
});

app.post("/api/keys", express.json(), async (req, res) => {
  await Promise.all([
    ensureMongoAuth().catch(() => {}),
    loadOAuthFromMongo().catch(() => {}),
    statsTracker.ensureMongo().catch(() => {}),
  ]);
  const dbTools = getMongoDb();
  if (dbTools) fileShareRegistry.setMongoDb(dbTools);
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res
      .status(401)
      .json({ error: "Unauthorized. Sign in as owner to create keys." });
    return;
  }
  if (listDynamicKeys().length >= 30) {
    res.status(400).json({
      error:
        "Maximum limit of 30 API keys reached. Delete an unused key to create a new one.",
    });
    return;
  }
  const label =
    typeof req.body?.label === "string" ? req.body.label.trim() : "";
  if (!label || label.length < 4) {
    res
      .status(400)
      .json({ error: "Key name must be at least 4 characters long." });
    return;
  }
  try {
    const entry = createDynamicKey(label);
    await syncKeyToMongo(entry);
    statsTracker.syncKnownKeys(
      listDynamicKeys(),
      listActiveOAuthAuthorizations(),
    );
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create API key." });
  }
});

app.patch("/api/keys/:id", express.json(), async (req, res) => {
  await ensureMongoAuth().catch(() => {});
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id as string;
  const label =
    typeof req.body?.label === "string" ? req.body.label.trim() : "";
  if (!label || label.length < 4) {
    res
      .status(400)
      .json({ error: "Key name must be at least 4 characters long." });
    return;
  }
  try {
    const entry = renameDynamicKey(id, label);
    statsTracker.syncKnownKeys(
      listDynamicKeys(),
      listActiveOAuthAuthorizations(),
    );
    res.json({ success: true, key: entry });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to rename API key." });
  }
});

app.delete("/api/keys/:id", async (req, res) => {
  await ensureMongoAuth().catch(() => {});
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id as string;
  const revoked = revokeDynamicKey(id);
  await revokeKeyInMongo(id);
  statsTracker.syncKnownKeys(
    listDynamicKeys(),
    listActiveOAuthAuthorizations(),
  );
  res.json({ success: revoked });
});

app.get("/tools", async (req, res) => {
  await Promise.all([
    ensureMongoAuth().catch(() => {}),
    loadOAuthFromMongo().catch(() => {}),
    statsTracker.ensureMongo().catch(() => {}),
  ]);
  const dbTools = getMongoDb();
  if (dbTools) fileShareRegistry.setMongoDb(dbTools);
  statsTracker.syncKnownKeys(
    listDynamicKeys(),
    listActiveOAuthAuthorizations(),
  );
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  const isOwner = Boolean(owner);
  const selectedKeyId =
    typeof req.query.key === "string" ? req.query.key.trim() : undefined;
  const authKey = computeAuthKey(
    DEFAULT_GITHUB_PAT || (owner ? `owner_${owner.email}` : ""),
  );
  const root = sandboxRootForAuthKey(authKey);
  statsTracker.setActiveSessions(transports.size);
  const summary = statsTracker.getSummary(root, selectedKeyId);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    renderToolsPage({
      base,
      isOwner,
      owner,
      tools: summary.toolsCatalog,
      summary,
    }),
  );
});

app.get("/stats/api", async (req, res) => {
  const owner = parseOwnerCookie(req);
  const clientKey = extractClientKey(req);
  const isAuth =
    Boolean(owner) ||
    Boolean(
      clientKey &&
      (isAuthorizedApiKey(clientKey) || (await verifyAccessToken(clientKey)).valid),
    );

  if (!isAuth) {
    res.status(401).json({
      error: "Unauthorized. Sign in as owner or supply a valid API key.",
    });
    return;
  }

  await Promise.all([
    ensureMongoAuth().catch(() => {}),
    loadOAuthFromMongo().catch(() => {}),
    statsTracker.ensureMongo().catch(() => {}),
  ]);
  const dbTools = getMongoDb();
  if (dbTools) fileShareRegistry.setMongoDb(dbTools);
  statsTracker.syncKnownKeys(
    listDynamicKeys(),
    listActiveOAuthAuthorizations(),
  );
  const selectedKeyId =
    typeof req.query.key === "string" ? req.query.key.trim() : undefined;
  const authKey = computeAuthKey(
    DEFAULT_GITHUB_PAT || (owner ? `owner_${owner.email}` : ""),
  );
  const root = sandboxRootForAuthKey(authKey);
  statsTracker.setActiveSessions(transports.size);
  const summary = statsTracker.getSummary(root, selectedKeyId);
  res.setHeader("Cache-Control", "no-store");
  res.json(summary);
});

app.get("/stats", async (req, res) => {
  await Promise.all([
    ensureMongoAuth().catch(() => {}),
    loadOAuthFromMongo().catch(() => {}),
    statsTracker.ensureMongo().catch(() => {}),
  ]);
  const dbTools = getMongoDb();
  if (dbTools) fileShareRegistry.setMongoDb(dbTools);
  statsTracker.syncKnownKeys(
    listDynamicKeys(),
    listActiveOAuthAuthorizations(),
  );
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  const isOwner = Boolean(owner);
  const selectedKeyId =
    typeof req.query.key === "string" ? req.query.key.trim() : undefined;

  const authKey = computeAuthKey(
    DEFAULT_GITHUB_PAT || (owner ? `owner_${owner.email}` : ""),
  );
  const root = sandboxRootForAuthKey(authKey);
  statsTracker.setActiveSessions(transports.size);
  const summary = statsTracker.getSummary(root, selectedKeyId);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    renderStatsPage({
      base,
      isOwner,
      owner,
      summary,
    }),
  );
});

// Dedicated Settings Page & Management Endpoints
function userOwnsKey(email: string, keyId: string): boolean {
  if (isOwnerEmail(email)) return true;
  if (keyId === "primary-key") return false;
  const userKeys = listDynamicKeys(email);
  if (userKeys.some((k) => k.id === keyId)) return true;
  const activeOAuths = listActiveOAuthAuthorizations();
  if (
    activeOAuths.some(
      (oa) =>
        oa.clientId === keyId &&
        oa.ownerEmail?.toLowerCase() === email.toLowerCase(),
    )
  ) {
    return true;
  }
  return false;
}

app.get("/settings", async (req, res) => {
  await Promise.all([
    ensureMongoAuth().catch(() => {}),
    loadOAuthFromMongo().catch(() => {}),
    statsTracker.ensureMongo().catch(() => {}),
  ]);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  const isOwner = Boolean(owner && isOwnerEmail(owner.email));

  if (!owner) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(
      renderSettingsPage({
        base,
        isOwner: false,
        owner: null,
        keys: [],
        selectedKeyId: "primary-key",
        keySettings: getKeySettings("primary-key"),
        toolsCatalog: statsTracker.getSummary("/tmp").toolsCatalog,
        userQuota: getUserQuota("user"),
      }),
    );
    return;
  }

  const keys: Array<{
    id: string;
    label?: string;
    prefix?: string;
    role?: string;
    email?: string;
  }> = [];

  if (isOwner) {
    keys.push({
      id: "primary-key",
      label: "Primary Master Key (Owner)",
      prefix: "MCP_API_KEY",
      role: "owner",
      email: owner.email,
    });
    for (const k of listDynamicKeys()) {
      keys.push({
        id: k.id,
        label: k.label,
        prefix: k.prefix,
        role: k.role || (isOwnerEmail(k.email) ? "owner" : "user"),
        email: k.email,
      });
    }
    for (const oa of listActiveOAuthAuthorizations()) {
      keys.push({
        id: oa.clientId,
        label: `OAuth: ${oa.clientName}`,
        prefix: oa.clientId.slice(0, 16),
        role: "owner",
        email: oa.ownerEmail,
      });
    }
  } else {
    let userKeys = listDynamicKeys(owner.email);
    if (userKeys.length === 0) {
      const newKey = createDynamicKey("Personal Key", owner.email);
      userKeys = [newKey];
    }
    for (const k of userKeys) {
      keys.push({
        id: k.id,
        label: k.label,
        prefix: k.prefix,
        role: "user",
        email: owner.email,
      });
    }
    for (const oa of listActiveOAuthAuthorizations()) {
      if (oa.ownerEmail?.toLowerCase() === owner.email.toLowerCase()) {
        keys.push({
          id: oa.clientId,
          label: `OAuth: ${oa.clientName}`,
          prefix: oa.clientId.slice(0, 16),
          role: "user",
          email: owner.email,
        });
      }
    }
  }

  let selectedKeyId =
    typeof req.query.key === "string" ? req.query.key.trim() : "";
  const validKey = keys.find((k) => k.id === selectedKeyId);
  if (!validKey) {
    selectedKeyId = keys[0]?.id || (isOwner ? "primary-key" : "default-key");
  }

  const keySettings = getKeySettings(selectedKeyId);
  if (!keySettings.sandboxId) {
    keySettings.sandboxId = generateSandboxId(
      selectedKeyId,
      isOwner && selectedKeyId === "primary-key",
    );
  }

  const userRole = isOwner ? "owner" : "user";
  const userQuota = getUserQuota(keySettings.role || userRole);
  const authKey = computeAuthKey(DEFAULT_GITHUB_PAT || `owner_${owner.email}`);
  const root = sandboxRootForAuthKey(authKey);
  const summary = statsTracker.getSummary(root, selectedKeyId);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    renderSettingsPage({
      base,
      isOwner,
      owner,
      keys,
      selectedKeyId,
      keySettings,
      toolsCatalog: summary.toolsCatalog,
      userQuota,
    }),
  );
});

app.post("/settings/api/credentials", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Unauthorized. Please sign in." });
    return;
  }
  const { keyId, githubToken, renderToken } = req.body || {};

  if (!keyId || typeof keyId !== "string") {
    res.status(400).json({ ok: false, error: "Invalid keyId." });
    return;
  }

  if (!userOwnsKey(owner.email, keyId)) {
    res
      .status(403)
      .json({ ok: false, error: "Forbidden: You do not have permission to manage this key." });
    return;
  }

  try {
    const updated = updateKeyCredentials(
      keyId,
      owner.email,
      typeof githubToken === "string" ? githubToken : undefined,
      typeof renderToken === "string" ? renderToken : undefined,
    );

    res.json({
      ok: true,
      maskedGitHub: maskSecret(updated.customGitHubToken),
      maskedRender: maskSecret(updated.customRenderToken),
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ ok: false, error: err?.message || "Failed to save credentials." });
  }
});

app.post("/settings/api/tool-toggle", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Unauthorized. Please sign in." });
    return;
  }
  const { keyId, toolName, enabled } = req.body || {};

  if (
    !keyId ||
    typeof keyId !== "string" ||
    !toolName ||
    typeof toolName !== "string"
  ) {
    res.status(400).json({ ok: false, error: "Invalid parameters." });
    return;
  }

  if (!userOwnsKey(owner.email, keyId)) {
    res
      .status(403)
      .json({ ok: false, error: "Forbidden: You do not have permission to manage this key." });
    return;
  }

  try {
    const updated = toggleKeyTool(keyId, toolName, Boolean(enabled));
    res.json({
      ok: true,
      enabledTools: updated.enabledTools,
      disabledTools: updated.disabledTools,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ ok: false, error: err?.message || "Failed to toggle tool." });
  }
});

app.post("/settings/api/tools", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Unauthorized. Please sign in." });
    return;
  }
  const { keyId, enabledTools, disabledTools } = req.body || {};

  if (!keyId || typeof keyId !== "string") {
    res.status(400).json({ ok: false, error: "Invalid keyId." });
    return;
  }

  if (!userOwnsKey(owner.email, keyId)) {
    res
      .status(403)
      .json({ ok: false, error: "Forbidden: You do not have permission to manage this key." });
    return;
  }

  try {
    const updated = updateKeyTools(
      keyId,
      Array.isArray(enabledTools) ? enabledTools : [],
      Array.isArray(disabledTools) ? disabledTools : [],
    );
    res.json({
      ok: true,
      enabledTools: updated.enabledTools,
      disabledTools: updated.disabledTools,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ ok: false, error: err?.message || "Failed to update tools." });
  }
});

app.get("/settings/api/data", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Unauthorized. Please sign in." });
    return;
  }
  const isOwner = isOwnerEmail(owner.email);
  const keyId =
    typeof req.query.key === "string" ? req.query.key.trim() : "primary-key";

  if (!userOwnsKey(owner.email, keyId)) {
    res.status(403).json({ ok: false, error: "Forbidden." });
    return;
  }

  const keySettings = getKeySettings(keyId);
  const userQuota = getUserQuota(
    keySettings.role || (isOwner ? "owner" : "user"),
  );

  res.json({
    ok: true,
    keySettings: {
      ...keySettings,
      customGitHubToken: maskSecret(keySettings.customGitHubToken),
      customRenderToken: maskSecret(keySettings.customRenderToken),
    },
    userQuota,
  });
});

// Dedicated Store Page & Download Endpoints
app.get("/store", async (req, res) => {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  const isOwner = Boolean(owner);

  if (!owner) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(
      renderStorePage({
        base,
        isOwner: false,
        owner: null,
        files: [],
      }),
    );
    return;
  }

  await ensureMongoAuth().catch(() => {});
  const dbStore = getMongoDb();
  if (dbStore) fileShareRegistry.setMongoDb(dbStore);

  try {
    const authKey = computeAuthKey(
      DEFAULT_GITHUB_PAT || `owner_${owner.email}`,
    );
    const root = sandboxRootForAuthKey(authKey);
    const fileStore = getFileStore();

    const [storeResult, usage] = await Promise.all([
      fileStore
        .listByOwner("*", { limit: 100, status: "all" })
        .catch(() => ({ files: [], totalCount: 0 })),
      fileStore.usage("*").catch(() => undefined),
    ]);

    const files: StoredFileInfo[] = storeResult.files.map((f) => {
      const share = fileShareRegistry.ensureFileShare({
        fileId: f.id,
        name: f.name,
        source: "store",
        contentType: f.contentType,
      });
      return {
        id: f.id,
        name: f.name,
        size: f.size,
        contentType: f.contentType,
        createdAt: f.createdAt,
        expiresAt: f.expiresAt,
        source: "store" as const,
        downloadUrl: `${base}/store/share/${share.shareToken}`,
        shareUrl: `${base}/store/share/${share.shareToken}`,
        isPublic: share.isPublic,
        permanent: !f.expiresAt,
      };
    });

    const uploadDir = path.join(root, UPLOAD_DIR);
    if (fs.existsSync(uploadDir)) {
      try {
        const entries = fs.readdirSync(uploadDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) {
            const filePath = path.join(uploadDir, entry.name);
            const stat = fs.statSync(filePath);
            const sbxId = `sbx_${Buffer.from(entry.name).toString("hex").slice(0, 16)}`;
            const share = fileShareRegistry.ensureFileShare({
              fileId: sbxId,
              name: entry.name,
              source: "sandbox",
              sandboxPath: filePath,
            });
            files.push({
              id: sbxId,
              name: entry.name,
              size: stat.size,
              contentType: "application/octet-stream",
              createdAt: stat.birthtime || stat.mtime,
              expiresAt: null,
              source: "sandbox" as const,
              downloadUrl: `${base}/store/share/${share.shareToken}`,
              shareUrl: `${base}/store/share/${share.shareToken}`,
              isPublic: share.isPublic,
              permanent: false,
            });
          }
        }
      } catch {}
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(
      renderStorePage({
        base,
        isOwner: true,
        owner,
        files,
        usage,
      }),
    );
  } catch (err: any) {
    res.status(500).send("Error loading store: " + err.message);
  }
});

app.get("/store/api/files", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  await ensureMongoAuth().catch(() => {});
  const dbFiles = getMongoDb();
  if (dbFiles) fileShareRegistry.setMongoDb(dbFiles);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const authKey = computeAuthKey(DEFAULT_GITHUB_PAT || `owner_${owner.email}`);
  const root = sandboxRootForAuthKey(authKey);
  const fileStore = getFileStore();

  const [storeResult, usage] = await Promise.all([
    fileStore
      .listByOwner("*", { limit: 100, status: "all" })
      .catch(() => ({ files: [], totalCount: 0 })),
    fileStore.usage("*").catch(() => undefined),
  ]);

  const files: StoredFileInfo[] = storeResult.files.map((f) => {
    const share = fileShareRegistry.ensureFileShare({
      fileId: f.id,
      name: f.name,
      source: "store",
      contentType: f.contentType,
    });
    return {
      id: f.id,
      name: f.name,
      size: f.size,
      contentType: f.contentType,
      createdAt: f.createdAt,
      expiresAt: f.expiresAt,
      source: "store" as const,
      downloadUrl: `${base}/store/share/${share.shareToken}`,
      shareUrl: `${base}/store/share/${share.shareToken}`,
      isPublic: share.isPublic,
      permanent: !f.expiresAt,
    };
  });

  const uploadDir = path.join(root, UPLOAD_DIR);
  if (fs.existsSync(uploadDir)) {
    try {
      const entries = fs.readdirSync(uploadDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(uploadDir, entry.name);
          const stat = fs.statSync(filePath);
          const sbxId = `sbx_${Buffer.from(entry.name).toString("hex").slice(0, 16)}`;
          const share = fileShareRegistry.ensureFileShare({
            fileId: sbxId,
            name: entry.name,
            source: "sandbox",
            sandboxPath: filePath,
          });
          files.push({
            id: sbxId,
            name: entry.name,
            size: stat.size,
            contentType: "application/octet-stream",
            createdAt: stat.birthtime || stat.mtime,
            expiresAt: null,
            source: "sandbox" as const,
            downloadUrl: `${base}/store/share/${share.shareToken}`,
            shareUrl: `${base}/store/share/${share.shareToken}`,
            isPublic: share.isPublic,
            permanent: false,
          });
        }
      }
    } catch {}
  }

  res.json({ files, usage });
});

app.post("/store/files/:id/privacy", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id;
  const explicitIsPublic =
    typeof req.body?.isPublic === "boolean" ? req.body.isPublic : undefined;
  const isPublic = fileShareRegistry.togglePrivacy(id, explicitIsPublic);
  res.json({ success: true, id, isPublic });
});

app.get(["/store/share/:token", "/store/download/:token"], async (req, res) => {
  const token =
    (Array.isArray(req.params.token) ? req.params.token[0] : req.params.token) ||
    "";
  const share =
    fileShareRegistry.getByToken(token) || fileShareRegistry.getById(token);

  if (share) {
    if (!share.isPublic) {
      const owner = parseOwnerCookie(req);
      const clientKey = extractClientKey(req);
      const isAuth =
        Boolean(owner) ||
        Boolean(
          clientKey &&
            (isAuthorizedApiKey(clientKey) ||
              (await verifyAccessToken(clientKey)).valid),
        );
      if (!isAuth) {
        res
          .status(401)
          .type("text/plain")
          .send("Access denied. This file is private and requires authentication.");
        return;
      }
    }

    try {
      if (share.source === "store") {
        const file = await getFileStore().openById("*", share.fileId);
        if (!file) {
          res.status(404).type("text/plain").send("File not found or expired.");
          return;
        }
        res.setHeader(
          "Content-Type",
          file.contentType || share.contentType || "application/octet-stream",
        );
        res.setHeader("Content-Length", String(file.size));
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(file.name)}"`,
        );
        res.setHeader("Access-Control-Allow-Origin", "*");
        await pipeline(file.stream, res);
        return;
      } else {
        let targetPath = share.sandboxPath;
        if (!targetPath || !fs.existsSync(targetPath)) {
          const authKey = computeAuthKey(DEFAULT_GITHUB_PAT || "");
          const root = sandboxRootForAuthKey(authKey);
          const candidate = path.join(root, UPLOAD_DIR, share.name);
          if (fs.existsSync(candidate)) targetPath = candidate;
        }
        if (!targetPath || !fs.existsSync(targetPath)) {
          res
            .status(404)
            .type("text/plain")
            .send("Sandbox file not found on disk.");
          return;
        }
        const stat = fs.statSync(targetPath);
        res.setHeader(
          "Content-Type",
          share.contentType || "application/octet-stream",
        );
        res.setHeader("Content-Length", String(stat.size));
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(share.name)}"`,
        );
        res.setHeader("Access-Control-Allow-Origin", "*");
        const stream = fs.createReadStream(targetPath);
        await pipeline(stream, res);
        return;
      }
    } catch (e: any) {
      if (!res.headersSent) {
        res.status(500).type("text/plain").send("Download error: " + e.message);
      }
      return;
    }
  }

  // Fallback: direct ID download from getFileStore()
  try {
    const file = await getFileStore().openById("*", token);
    if (!file) {
      res.status(404).type("text/plain").send("File not found or expired.");
      return;
    }
    res.setHeader(
      "Content-Type",
      file.contentType || "application/octet-stream",
    );
    res.setHeader("Content-Length", String(file.size));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(file.name)}"`,
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    await pipeline(file.stream, res);
  } catch (e: any) {
    if (!res.headersSent)
      res
        .status(500)
        .type("text/plain")
        .send("Download error: " + e.message);
  }
});

app.get("/store/download", async (req, res) => {
  const owner = parseOwnerCookie(req);
  const clientKey = extractClientKey(req);
  const isAuth =
    Boolean(owner) ||
    Boolean(
      clientKey &&
      (isAuthorizedApiKey(clientKey) || (await verifyAccessToken(clientKey)).valid),
    );
  if (!isAuth) {
    res.status(401).type("text/plain").send("Unauthorized.");
    return;
  }

  const filename = typeof req.query.file === "string" ? req.query.file : "";
  if (
    !filename ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    res.status(400).type("text/plain").send("Invalid filename.");
    return;
  }

  const authKey = computeAuthKey(
    DEFAULT_GITHUB_PAT || (owner ? `owner_${owner.email}` : ""),
  );
  const root = sandboxRootForAuthKey(authKey);
  const filePath = path.join(root, UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).type("text/plain").send("File not found.");
    return;
  }
  res.download(filePath, filename);
});

app.post("/store/permanent/:id", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id;
  const ok = await getFileStore().makePermanent("*", id);
  if (ok) res.json({ success: true, permanent: true });
  else res.status(404).json({ error: "File not found." });
});

app.post("/store/revert-permanent/:id", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id;
  const ok = await getFileStore().revertPermanent("*", id);
  if (ok) res.json({ success: true, permanent: false });
  else res.status(404).json({ error: "File not found." });
});

app.delete("/store/files/:id", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id;
  const ok = await getFileStore().deleteOwned("*", id);
  if (ok) {
    fileShareRegistry.removeFile(id);
    res.json({ success: true, deleted: id });
  } else {
    res.status(404).json({ error: "File not found." });
  }
});

app.patch("/store/files/:id/rename", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id;
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "File name is required." });
    return;
  }
  const ok = await getFileStore().rename("*", id, name);
  if (ok) {
    fileShareRegistry.renameFile(id, name);
    res.json({ success: true, id, name });
  } else {
    res.status(404).json({ error: "File not found or failed to rename." });
  }
});

app.delete("/store/sandbox-file", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const name = typeof req.query.name === "string" ? req.query.name : "";
  if (
    !name ||
    name.includes("..") ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    res.status(400).json({ error: "Invalid filename." });
    return;
  }
  const authKey = computeAuthKey(DEFAULT_GITHUB_PAT || `owner_${owner.email}`);
  const root = sandboxRootForAuthKey(authKey);
  const filePath = path.join(root, UPLOAD_DIR, name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    const sbxId = `sbx_${Buffer.from(name).toString("hex").slice(0, 16)}`;
    fileShareRegistry.removeFile(sbxId);
    res.json({ success: true, deleted: name });
  } else {
    res.status(404).json({ error: "File not found." });
  }
});

app.post("/upload/rename", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const oldName =
    typeof req.body?.oldName === "string" ? req.body.oldName.trim() : "";
  const newName =
    typeof req.body?.newName === "string" ? req.body.newName.trim() : "";
  if (
    !oldName ||
    !newName ||
    oldName.includes("..") ||
    newName.includes("..") ||
    oldName.includes("/") ||
    newName.includes("/") ||
    oldName.includes("\\") ||
    newName.includes("\\")
  ) {
    res.status(400).json({ error: "Invalid filename." });
    return;
  }
  const authKey = computeAuthKey(DEFAULT_GITHUB_PAT || `owner_${owner.email}`);
  const root = sandboxRootForAuthKey(authKey);
  const oldPath = path.join(root, UPLOAD_DIR, oldName);
  const newPath = path.join(root, UPLOAD_DIR, newName);
  if (!fs.existsSync(oldPath)) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  try {
    fs.renameSync(oldPath, newPath);
    res.json({ success: true, oldName, newName });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to rename file." });
  }
});

// Body-parser and other middleware errors: never leak internals.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  if (err?.type === "entity.too.large") {
    jsonRpcError(res, 413, -32000, "Request body too large.");
    return;
  }
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    jsonRpcError(res, 400, -32700, "Parse error.");
    return;
  }
  console.error(
    "[http] error:",
    sanitizeOutput(String(err?.message || err)).slice(0, 500),
  );
  jsonRpcError(res, 500, -32603, "Internal server error.");
});

const cleanupTimer = setInterval(
  () => {
    const now = Date.now();
    const maxIdle = 10 * 60 * 1000;
    for (const [id, entry] of transports.entries()) {
      if (now - entry.lastActive > maxIdle) {
        transports.delete(id);
        destroySandbox(id).catch(() => {});
        try {
          entry.transport.close();
        } catch {}
      }
    }
  },
  3 * 60 * 1000,
);
cleanupTimer.unref();

// 404 Catch-All Handler: returns modern branded 404 page for browsers, JSON for APIs
app.use((req: Request, res: Response): void => {
  res.status(404);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  if (req.accepts("html")) {
    const owner = parseOwnerCookie(req);
    const isOwner = Boolean(owner);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(
      renderNotFoundPage({
        base,
        isOwner,
        owner,
        pathname: req.originalUrl || req.url,
      }),
    );
    return;
  }
  res.json({
    error: "Not Found",
    status: 404,
    path: req.originalUrl || req.url,
  });
});

const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Krix Active on Port ${PORT}`);
  logIsolationStatus();
  if (process.env.MONGODB_URI) startFileSweeper();
  else
    console.warn(
      "ℹ️  MONGODB_URI is not set: sandbox_store share/list/delete will report that file storage is not configured (download still works).",
    );
});
server.requestTimeout = 120_000;
server.headersTimeout = 30_000;
server.keepAliveTimeout = 65_000;

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(cleanupTimer);
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  await Promise.allSettled(
    [...transports.keys()].map((id) => destroySandbox(id)),
  );
  await shutdownUploadSessions().catch(() => {});
  await stopFileStore().catch(() => {});
  await statsTracker.flush().catch(() => {});
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("unhandledRejection", (reason) => {
  console.error(
    "[process] unhandledRejection:",
    sanitizeOutput(String((reason as any)?.stack || reason)).slice(0, 1000),
  );
});
process.on("uncaughtException", (err) => {
  console.error(
    "[process] uncaughtException:",
    sanitizeOutput(String(err?.stack || err)).slice(0, 1000),
  );
  shutdown();
});
