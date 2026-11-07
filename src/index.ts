import express, { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
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
  parseOwnerCookie,
  listDynamicKeys,
} from "./googleAuth.js";
import { createMcpOAuthRouter, verifyAccessToken } from "./mcpOAuth.js";
import { logIsolationStatus } from "./sandboxProc.js";
import { createLimiter, rateLimitMiddleware, clientIp } from "./rateLimit.js";
import {
  TOOL_CATEGORY,
  ToolCategory,
  getSessionContext,
  registerSessionAuth,
  getAuthKeyForSession,
  computeAuthKey,
  safeEqual,
  registerSecret,
  sanitizeOutput,
  sandboxRootForAuthKey,
} from "./security.js";

const DEFAULT_GITHUB_PAT =
  process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_PAT;
const DEFAULT_RENDER_API_KEY =
  process.env.RENDER_API_KEY || process.env.RENDER_PAT;
const MCP_API_KEY = process.env.MCP_API_KEY;

if (!MCP_API_KEY) {
  console.error(
    "FATAL: MCP_API_KEY is not set. Refusing to start an unauthenticated gateway.",
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

const ALLOW_QUERY_API_KEY = process.env.ALLOW_QUERY_API_KEY !== "false";
if (ALLOW_QUERY_API_KEY) {
  console.warn(
    "⚠️  ?api_key= query authentication is enabled (ALLOW_QUERY_API_KEY). URLs end up in proxy logs and browser history; prefer the x-api-key or Authorization header and set ALLOW_QUERY_API_KEY=false when your client supports it.",
  );
}

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
        "Advanced agentic gateway for remote GitHub discovery, Render management, and sandboxed execution.",
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

  const primaryIconUrl = serverIcons[0]?.src ?? GITHUB_ICON_48_URL;
  const primaryLogoUrl =
    serverIcons.find((i) => i.sizes?.includes("320x320"))?.src ??
    GITHUB_LOGO_URL;
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

  const ctx = getSessionContext(sessionId);
  for (const [name, handle] of Object.entries(registry)) {
    const cat = categoryOf[name];
    if (ctx.enabledCategories.has(cat)) {
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

function authenticate(req: Request, res: Response, next: NextFunction): void {
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
    const tokenCheck = verifyAccessToken(clientKey);
    if (tokenCheck.valid) {
      failedAuthLimiter.reset(ip);
      (req as any).oauthUser = tokenCheck.payload;
      next();
      return;
    }

    // 2. Check Gateway API keys (server environment key or owner-generated key)
    if (isAuthorizedApiKey(clientKey)) {
      failedAuthLimiter.reset(ip);
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
    "Unauthorized. Connect using OAuth 2.1 or supply a valid Gateway API key.",
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
    const githubToken =
      (typeof req.headers["x-github-token"] === "string"
        ? req.headers["x-github-token"]
        : "") ||
      DEFAULT_GITHUB_PAT ||
      "";
    const renderToken =
      (typeof req.headers["x-render-token"] === "string"
        ? req.headers["x-render-token"]
        : "") || DEFAULT_RENDER_API_KEY;
    registerSecret(githubToken);
    registerSecret(renderToken);
    const sessionId =
      typeof req.headers["mcp-session-id"] === "string"
        ? req.headers["mcp-session-id"]
        : undefined;
    const body = req.body;

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
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
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
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
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
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
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
      "Advanced agentic gateway for remote GitHub discovery, Render management, and sandboxed execution.",
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
      "Advanced agentic gateway for remote GitHub discovery, Render management, and sandboxed execution.",
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
            description: "Krix Gateway MCP API key",
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
      "Advanced agentic gateway for remote GitHub discovery, Render management, and sandboxed execution.",
    icon: getServerIcons(base)[0]?.src ?? GITHUB_ICON_48_URL,
    iconUrl: getServerIcons(base)[0]?.src ?? GITHUB_ICON_48_URL,
    logo:
      getServerIcons(base).find((i) => i.sizes?.includes("320x320"))?.src ??
      GITHUB_LOGO_URL,
    logoUrl:
      getServerIcons(base).find((i) => i.sizes?.includes("320x320"))?.src ??
      GITHUB_LOGO_URL,
    icons: getServerIcons(base),
    mcpServers: {
      krix: {
        description:
          "Advanced agentic gateway for remote GitHub discovery, Render management, and sandboxed execution.",
        httpUrl: `${base}/mcp`,
        url: `${base}/mcp`,
        headers: {
          "x-api-key": "$MCP_API_KEY",
        },
      },
    },
  });
});

app.get("/", async (req, res) => {
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
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Krix Agentic Gateway</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png">
  <link rel="icon" type="image/png" sizes="128x128" href="/icon-128.png">
  <style>
    :root {
      color-scheme: dark;
      --bg: #090d13;
      --card: #121820;
      --card-sub: #161f2b;
      --line: #242c38;
      --fg: #c9d1d9;
      --dim: #7d8590;
      --hi: #f0f6fc;
      --accent: #58a6ff;
      --cyan: #39c5bb;
      --ok: #238636;
      --code-bg: #070a0f;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: var(--bg);
      color: var(--fg);
      font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 32px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .wrapper { width: 100%; max-width: 960px; }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--line);
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #101721;
      border: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px rgba(57,197,187,0.15);
    }
    h1 { font-size: 22px; color: var(--hi); font-weight: 700; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; }
    .badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      background: rgba(57,197,187,0.12);
      color: var(--cyan);
      border: 1px solid rgba(57,197,187,0.3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.live {
      background: rgba(35,134,54,0.12);
      color: #3fb950;
      border-color: rgba(35,134,54,0.3);
    }
    .user-nav { display: flex; align-items: center; gap: 12px; }
    .owner-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      color: var(--hi);
    }
    .owner-tag img { width: 22px; height: 22px; border-radius: 50%; }
    .btn {
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #21262d;
      color: var(--hi);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all .15s ease;
    }
    .btn:hover { background: #30363d; border-color: #8b949e; }
    .btn.primary { background: var(--ok); border-color: var(--ok); color: #fff; }
    .btn.primary:hover { background: #2ea043; }
    .btn.google { background: #fff; color: #1f1f1f; border-color: #fff; }
    .btn.google:hover { background: #f0f0f0; }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    @media (max-width: 640px) {
      body { padding: 16px 12px; }
      header { flex-direction: column; align-items: flex-start; gap: 14px; }
      .brand { width: 100%; }
      .user-nav { width: 100%; justify-content: space-between; }
      .tab-bar { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
      .card { padding: 18px 14px; }
      .endpoint-row { flex-direction: column; }
      .key-disp { flex-direction: column; }
      footer { flex-direction: column; gap: 8px; text-align: center; }
    }

    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--hi);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    p.card-desc { font-size: 13px; color: var(--dim); margin-bottom: 16px; line-height: 1.5; }

    .endpoint-box {
      background: var(--card-sub);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .endpoint-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--dim);
      margin-bottom: 6px;
    }
    .endpoint-row {
      display: flex;
      gap: 8px;
    }
    .endpoint-row input {
      flex: 1;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: var(--code-bg);
      color: var(--accent);
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 12.5px;
    }

    .tree-box {
      background: var(--code-bg);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px 16px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
      font-size: 12.5px;
      color: #9cdcfe;
      line-height: 1.7;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .tree-item { display: flex; align-items: center; gap: 8px; }
    .tree-folder { color: #e5c07b; font-weight: 600; }
    .tree-file { color: #d19a66; }
    .tree-dim { color: var(--dim); font-size: 11px; margin-left: 6px; }

    .tab-bar { display: flex; gap: 6px; margin-bottom: 12px; }
    .tab {
      background: transparent;
      border: 1px solid var(--line);
      color: var(--dim);
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .tab.active { background: #21262d; color: var(--hi); border-color: var(--dim); }
    .code-view {
      position: relative;
      background: var(--code-bg);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      color: #79c0ff;
      white-space: pre;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      font-size: 11px;
      border-radius: 5px;
      background: #21262d;
      border: 1px solid var(--line);
      color: var(--dim);
      cursor: pointer;
    }
    .copy-btn:hover { color: var(--hi); background: #30363d; }

    .key-gen-box {
      margin-top: 16px;
      padding: 14px;
      background: var(--card-sub);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .key-disp {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .key-disp input {
      flex: 1;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: var(--code-bg);
      color: #3fb950;
      font-family: monospace;
      font-size: 12px;
    }

    footer {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      color: var(--dim);
      font-size: 12px;
    }
    footer a { color: var(--dim); text-decoration: none; }
    footer a:hover { color: var(--accent); }
  </style>
</head>
<body>
  <div class="wrapper">
    <header>
      <div class="brand">
        <div class="brand-logo">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="8" fill="#121820" stroke="#39c5bb" stroke-width="2"/>
            <path d="M10 8v16M22 8v16M10 16h12M16 8l6 8-6 8" stroke="#58a6ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <h1>KRIX <span class="badge">v1.1.0</span> <span class="badge live">OAuth 2.1 Ready</span></h1>
        </div>
      </div>
      <div class="user-nav">
        ${
          isOwner
            ? `
          <div class="owner-tag">
            ${owner?.picture ? `<img src="${encodeURI(owner.picture)}" alt="">` : ""}
            <span>${encodeURIComponent(owner?.name || owner?.email || "Owner")}</span>
          </div>
          <a href="/auth/logout" class="btn" style="padding:6px 10px; font-size:12px;">Sign out</a>
        `
            : `
          <a href="/auth/google" class="btn google">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign in with Google
          </a>
        `
        }
      </div>
    </header>

    <div class="grid">
      <section class="card">
        <div class="card-title">
          <span>Sandbox Workspace Explorer</span>
          <a href="/upload" class="btn primary" style="padding:4px 10px; font-size:12px;">+ Upload Files</a>
        </div>
        <p class="card-desc">Live tree structure of your sandboxed workspace. Uploaded files in <code>upload/</code> are automatically linked into all active and cloned repositories.</p>

        <div class="tree-box">
          <div><span class="tree-folder">📦 krix-sandbox/</span></div>
          <div>│   ├── <span class="tree-folder">📁 upload/</span> <span class="tree-dim">(user uploads folder)</span></div>
          ${
            uploads.length > 0
              ? uploads
                  .map(
                    (u) => `
          <div>│   │   ├── <span class="tree-file">📄 ${encodeURIComponent(u.name)}</span> <span class="tree-dim">(${Math.round(u.size / 1024)} KB)</span></div>
          `,
                  )
                  .join("")
              : `
          <div>│   │   └── <span class="tree-dim"><em>(no uploads yet &mdash; click Upload Files above)</em></span></div>
          `
          }
          <div>│   ├── <span class="tree-folder">📁 workspace/</span> <span class="tree-dim">(active git clone)</span></div>
          <div>│   │   ├── <span class="tree-folder">📁 upload/</span> <span class="tree-dim">&rarr; symlink to sandbox upload/</span></div>
          <div>│   │   ├── <span class="tree-file">📄 package.json</span></div>
          <div>│   │   └── <span class="tree-folder">📁 src/</span></div>
          <div>└── ⚙️ system/ <span class="tree-dim">(Node.js 22 LTS &middot; Python 3 &middot; Git)</span></div>
        </div>

        <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--dim);">
          <span>Active files: <strong>${uploads.length}</strong></span>
          <span>Transport: <strong>Streamable HTTP</strong></span>
        </div>
      </section>

      <section class="card">
        <div class="card-title">
          <span>MCP Client Setup</span>
          <span class="badge live">OAuth 2.1</span>
        </div>
        <p class="card-desc">Connect Claude Desktop, Cursor, Antigravity, ChatGPT, or any agent using native OAuth 2.1 or a Gateway API key.</p>

        <div class="endpoint-box">
          <div class="endpoint-label">Streamable HTTP MCP Endpoint URL</div>
          <div class="endpoint-row">
            <input type="text" id="mcpUrlInput" value="${base}/mcp" readonly>
            <button class="btn" onclick="copyMcpUrl()" id="copyUrlBtn">Copy URL</button>
          </div>
        </div>

        <div class="tab-bar">
          <button class="tab active" onclick="showTab('claude')">Claude Desktop</button>
          <button class="tab" onclick="showTab('cursor')">Cursor</button>
          <button class="tab" onclick="showTab('antigravity')">Antigravity</button>
          <button class="tab" onclick="showTab('chatgpt')">ChatGPT</button>
          <button class="tab" onclick="showTab('oauth')">OAuth 2.1</button>
        </div>

        <div class="code-view" id="codebox">
          <button class="copy-btn" onclick="copySnippet()">Copy</button>
          <code id="snippet"></code>
        </div>

        <div class="key-gen-box">
          <div style="font-size:13px; font-weight:600; color:var(--hi); margin-bottom:4px;">
            ${isOwner ? "Gateway Key Management" : "Owner Gateway Key"}
          </div>
          <div style="font-size:12px; color:var(--dim);">
            ${isOwner ? "Generate on-demand MCP API keys directly from your signed-in owner account." : "Sign in with Google above to generate, view, and rotate your Gateway API keys."}
          </div>

          ${
            isOwner
              ? `
            <div style="margin-top:10px;">
              <button class="btn" onclick="generateKey()" id="genBtn" style="font-size:12px; padding:6px 12px;">+ Generate New Gateway Key</button>
            </div>
            <div class="key-disp" id="keyDisp" style="display:none;">
              <input type="text" id="newKeyVal" readonly>
              <button class="btn" onclick="copyNewKey()" style="padding:6px 12px; font-size:12px;">Copy</button>
            </div>
            ${
              dynamicKeys.length > 0
                ? `
              <div style="margin-top:12px; font-size:12px; color:var(--dim);">
                Active Keys: <strong>${dynamicKeys.length}</strong>
              </div>
            `
                : ""
            }
          `
              : ""
          }
        </div>
      </section>
    </div>

    <footer>
      <div>Krix MCP Gateway &bull; Single-Tenant Secure Architecture</div>
      <div><a href="/upload">Upload Portal</a> &bull; <a href="/.well-known/oauth-protected-resource">RFC 9728 Discovery</a></div>
    </footer>
  </div>

  <script>
    const baseUrl = '${base}';
    let activeKey = '${dynamicKeys.length > 0 ? dynamicKeys[0].id : "$MCP_API_KEY"}';

    function getSnippets() {
      const keyDisp = activeKey || '$MCP_API_KEY';
      return {
        claude: JSON.stringify({
          mcpServers: {
            krix: {
              url: baseUrl + "/mcp",
              headers: {
                "Authorization": "Bearer " + keyDisp
              }
            }
          }
        }, null, 2),
        cursor: JSON.stringify({
          mcpServers: {
            krix: {
              url: baseUrl + "/mcp",
              headers: {
                "Authorization": "Bearer " + keyDisp
              }
            }
          }
        }, null, 2),
        antigravity: JSON.stringify({
          mcpServers: {
            krix: {
              url: baseUrl + "/mcp",
              headers: {
                "Authorization": "Bearer " + keyDisp
              }
            }
          }
        }, null, 2),
        chatgpt: "// ChatGPT Custom GPT -> Configure -> Add Actions -> Authentication:\\n" +
          "// 1. Auth Type: Bearer\\n" +
          "//    Token:     " + keyDisp + "\\n" +
          "// OR select OAuth:\\n" +
          "//    Auth URL:  " + baseUrl + "/oauth/authorize\\n" +
          "//    Token URL: " + baseUrl + "/oauth/token\\n" +
          "//    Scope:     mcp:tools",
        oauth: "// Modern MCP Clients auto-discover OAuth 2.1 via RFC 9728 & RFC 8414:\\n" +
          "// Endpoint:            " + baseUrl + "/mcp\\n" +
          "// Protected Resource:   " + baseUrl + "/.well-known/oauth-protected-resource\\n" +
          "// Authorization Server: " + baseUrl + "/oauth/authorize\\n" +
          "// Token Endpoint:       " + baseUrl + "/oauth/token\\n" +
          "// Dynamic Client Reg:   " + baseUrl + "/oauth/register"
      };
    }

    let curTab = 'claude';
    function showTab(name) {
      curTab = name;
      document.querySelectorAll('.tab').forEach(b => {
        b.classList.toggle('active', b.getAttribute('onclick').includes("'" + name + "'"));
      });
      document.getElementById('snippet').textContent = getSnippets()[name];
    }
    showTab('claude');

    function copySnippet() {
      navigator.clipboard.writeText(getSnippets()[curTab]);
      const btn = document.querySelector('.copy-btn');
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    }

    function copyMcpUrl() {
      const el = document.getElementById('mcpUrlInput');
      el.select();
      navigator.clipboard.writeText(el.value);
      const btn = document.getElementById('copyUrlBtn');
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy URL', 1500);
    }

    async function generateKey() {
      const btn = document.getElementById('genBtn');
      btn.disabled = true;
      btn.textContent = 'Generating…';
      try {
        const res = await fetch('/auth/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: 'Client Key ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })
        });
        const data = await res.json();
        if (data.key) {
          activeKey = data.key;
          document.getElementById('keyDisp').style.display = 'flex';
          document.getElementById('newKeyVal').value = data.key;
          showTab(curTab);
        }
      } catch (e) {
        alert('Failed to generate key: ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '+ Generate New Gateway Key';
      }
    }

    function copyNewKey() {
      const el = document.getElementById('newKeyVal');
      el.select();
      navigator.clipboard.writeText(el.value);
      alert('Gateway API Key copied to clipboard! The code snippets above have also been updated with this key.');
    }
  </script>
</body>
</html>`);
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
