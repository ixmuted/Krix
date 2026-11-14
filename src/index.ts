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
  getToolIcons,
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
  getDynamicKeySecret,
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
  clearToolRegistrations,
  executeRegisteredTool,
  setToolRegistrationEnabled,
} from "./toolSchemas.js";
import {
  renderHomePage,
  renderStatsPage,
  renderApiKeysPage,
  renderApiKeySettingsPage,
  renderToolsPage,
  renderStorePage,
  renderNotFoundPage,
  renderSettingsPage,
  renderPrivacyPage,
  renderTermsPage,
  renderHelpPage,
  type StoredFileInfo,
} from "./views.js";
import { logIsolationStatus, assertInsideRealRoot } from "./sandboxProc.js";
import {
  browserOriginGuard,
  createSecurityAuditMiddleware,
  validateProductionSecurityConfig,
} from "./securityControls.js";
import { createLimiter, rateLimitMiddleware, clientIp } from "./rateLimit.js";
import {
  TOOL_CATEGORY,
  ToolCategory,
  getSessionContext,
  registerSessionAuth,
  unregisterSessionAuth,
  registerSessionSandboxId,
  getSandboxIdForSession,
  getAuthKeyForSession,
  computeAuthKey,
  computeUserAuthKey,
  canonicalUserIdentity,
  safeEqual,
  registerSecret,
  sanitizeOutput,
  sandboxRootForAuthKey,
  getToolCredentialRequirement,
  getMissingToolCredential,
} from "./security.js";
import { registerCodeGraphTools } from "./codeGraphTools.js";
import {
  getKeySettings,
  getUserQuota,
  updateKeyCredentials,
  removeKeyCredential,
  updateKeyTools,
  toggleKeyTool,
  updateKeyToolRiskLevel,
  isToolEnabledForKey,
  syncKeySettingsToMongo,
  saveSettingsToDisk,
  getUserRole,
  isOwnerEmail,
  getOwnerEmail,
  maskSecret,
  generateSandboxId,
  type KeySettings,
} from "./userSettings.js";
import {
  credentialRequiredMessage,
  type CredentialProvider,
} from "./toolDefaults.js";

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

/**
 * Returns the workspace-level default credential for GitHub or Render.
 * Evaluates environment variables first, then primary key workspace settings.
 */
export function getWorkspaceCredential(provider: "github" | "render"): string {
  if (provider === "github") {
    return (
      process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
      process.env.GITHUB_PAT ||
      getKeySettings("primary-key")?.customGitHubToken ||
      ""
    );
  }
  return (
    process.env.RENDER_API_KEY ||
    process.env.RENDER_PAT ||
    getKeySettings("primary-key")?.customRenderToken ||
    ""
  );
}

/**
 * Returns the effective credential for a specific key (API key or OAuth client).
 * Checks key-level override first; if unset or empty, inherits workspace credential.
 */
export function getEffectiveCredential(
  keyId: string,
  provider: "github" | "render",
  keySettings?: KeySettings,
): string {
  const settings = keySettings || getKeySettings(keyId);
  const override =
    provider === "github"
      ? settings.customGitHubToken
      : settings.customRenderToken;
  if (override && override.trim()) {
    return override.trim();
  }
  return getWorkspaceCredential(provider);
}

/** Which provider credentials a key can actually use (own override, or workspace default). */
function keyCredentialsReady(keyId: string, settings?: KeySettings) {
  return {
    github: Boolean(getEffectiveCredential(keyId, "github", settings)),
    render: Boolean(getEffectiveCredential(keyId, "render", settings)),
  };
}

/** Returns the first tool in `names` that needs a credential the key lacks, or null. */
function findToolMissingCredential(
  names: unknown,
  ready: { github?: boolean; render?: boolean },
): { toolName: string; provider: CredentialProvider } | null {
  if (!Array.isArray(names)) return null;
  for (const raw of names) {
    const toolName = String(raw);
    const provider = getMissingToolCredential(toolName, ready);
    if (provider) return { toolName, provider };
  }
  return null;
}

/**
 * Scopes an OAuth client effectively has right now, derived from which tool groups are
 * actually enabled for it. A scope disappears when none of its tools are enabled.
 *   mcp:sandbox -> sandbox tools        mcp:admin -> GitHub admin + Render tools
 *   mcp:tools   -> core GitHub, issue/PR, file and code-graph tools
 */
function effectiveOAuthScopes(clientId: string): string[] {
  const ready = keyCredentialsReady(clientId);
  const sessionCategories = new Set<string>(["core", "files"]);
  if (process.env.ENABLE_SANDBOX === "true" || ready.github)
    sessionCategories.add("sandbox");
  const scopes = new Set<string>();
  for (const [toolName, category] of Object.entries(TOOL_CATEGORY)) {
    if (getMissingToolCredential(toolName, ready, category)) continue;
    if (!isToolEnabledForKey(clientId, toolName, category, sessionCategories))
      continue;
    if (category === "sandbox") scopes.add("mcp:sandbox");
    else if (category === "github_admin" || category === "render")
      scopes.add("mcp:admin");
    else scopes.add("mcp:tools");
  }
  return ["mcp:tools", "mcp:sandbox", "mcp:admin"].filter((s) => scopes.has(s));
}

/** After a credential is removed, switch off any explicitly-enabled tool that now lacks it. */
function pruneToolsMissingCredentials(keyId: string): string[] {
  const settings = getKeySettings(keyId);
  const ready = keyCredentialsReady(keyId, settings);
  const enabled = settings.enabledTools || [];
  const removed = enabled.filter((t) => getMissingToolCredential(t, ready));
  if (removed.length) {
    updateKeyTools(
      keyId,
      enabled.filter((t) => !removed.includes(t)),
      settings.disabledTools || [],
    );
  }
  return removed;
}

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
  keyId: string;
}
const transports = new Map<string, SessionEntry>();

/** Close every live MCP session for a key so credential changes take effect immediately. */
function closeSessionsForKey(keyId: string): number {
  let closed = 0;
  for (const [sessionId, entry] of transports) {
    if (entry.keyId !== keyId) continue;
    transports.delete(sessionId);
    closed += 1;
    try {
      void Promise.resolve(entry.transport.close()).catch((closeError) => {
        console.warn(
          `[mcp] Session close failed: ${String((closeError as any)?.message || closeError)}`,
        );
      });
    } catch (err) {
      console.warn(
        `[mcp] Could not close session after credential change: ${String((err as any)?.message || err)}`,
      );
    }
  }
  return closed;
}

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
  const toolIcons = getToolIcons();
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

  registerRenderTools(server, () => renderToken, registry, sessionId);
  tagCategory(registry, categoryOf, "render");

  registerSandboxTools(server, sessionId, githubToken, registry);
  tagCategory(registry, categoryOf, "sandbox");

  const publicBase = baseUrl(req);
  registerFileTools(server, sessionId, registry, () => publicBase);
  tagCategory(registry, categoryOf, "files");

  registerCodeGraphTools(server, sessionId, registry);
  tagCategory(registry, categoryOf, "codegraph");

  const ctx = getSessionContext(sessionId);
  const policyKeyId = keySettings?.keyId || "primary-key";
  // A GitHub PAT enables only the default GitHub tool set (the "core" group, see
  // toolDefaults.ts). Issue/PR/admin tools stay opt-in per key, even with a PAT.
  const activeCategories = new Set(ctx.enabledCategories);
  if (githubToken?.trim()) {
    // A valid GitHub PAT unlocks the complete sandbox tool group, including remote Git helpers.
    activeCategories.add("sandbox");
  }
  // Render credentials are available to the user, but Render tools remain opt-in per key.

  const credentials = {
    github: Boolean(githubToken?.trim()),
    render: Boolean(renderToken?.trim()),
  };
  const onRenderService =
    process.env.RENDER === "true" || Boolean(process.env.RENDER_SERVICE_ID);
  const renderSandboxOwnerOptIn =
    process.env.ENABLE_SANDBOX === "true" &&
    process.env.SANDBOX_RENDER_OWNER_ONLY_ACK === "true" &&
    process.env.SANDBOX_REQUIRE_ISOLATION === "false" &&
    keySettings?.role === "owner" &&
    isOwnerEmail(keySettings?.email);
  for (const [name, handle] of Object.entries(registry)) {
    const cat = categoryOf[name];
    const sandboxAllowedHere =
      cat !== "sandbox" || !onRenderService || renderSandboxOwnerOptIn;
    const missingCredential = getMissingToolCredential(name, credentials, cat);
    const policyEnabled = isToolEnabledForKey(
      policyKeyId,
      name,
      cat,
      activeCategories,
    );
    if (sandboxAllowedHere && !missingCredential && policyEnabled) {
      handle.enable();
      setToolRegistrationEnabled(sessionId, name, true);
    } else {
      handle.disable();
      setToolRegistrationEnabled(
        sessionId,
        name,
        false,
        missingCredential
          ? credentialRequiredMessage(missingCredential, name, "runtime")
          : undefined,
      );
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
            icons: toolIcons,
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

export const app = express();
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

// Fail closed on insecure production configuration before serving requests.
validateProductionSecurityConfig();

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

// Browser CSRF/origin protection and metadata-only security audit trail.
app.use(browserOriginGuard);
app.use(createSecurityAuditMiddleware(getMongoDb));

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
  defaultGithubToken: getWorkspaceCredential("github") || undefined,
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

async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
        email: dynEntry.email,
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
        email:
          process.env.OWNER_EMAIL ||
          process.env.GOOGLE_ALLOWED_EMAIL ||
          "owner@localhost",
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
      console.error(
        "[stats] startup restore before MCP request failed:",
        error?.message || error,
      );
    });
    const startTime = Date.now();
    const clientAuth = (req as any).clientAuth || {
      keyId: "primary-key",
      label: "Primary Key",
      type: "master_key",
    };
    const keyId = clientAuth.keyId || "primary-key";
    const keySettings = getKeySettings(keyId);
    const clientEmail = String(clientAuth.email || "")
      .trim()
      .toLowerCase();
    if (
      clientEmail &&
      (!keySettings.email || keySettings.email === "anonymous")
    ) {
      keySettings.email = clientEmail;
      keySettings.role = isOwnerEmail(clientEmail) ? "owner" : "user";
    }

    const githubToken =
      (typeof req.headers["x-github-token"] === "string"
        ? req.headers["x-github-token"]
        : "") ||
      getEffectiveCredential(keySettings.keyId, "github", keySettings);
    const renderToken =
      (typeof req.headers["x-render-token"] === "string"
        ? req.headers["x-render-token"]
        : "") ||
      getEffectiveCredential(keySettings.keyId, "render", keySettings) ||
      undefined;
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
        responseText += Buffer.isBuffer(chunk)
          ? chunk.toString("utf8")
          : String(chunk);
      }
    };
    const recordMetrics = () => {
      if (recorded) return;
      recorded = true;
      const requests = Array.isArray(body) ? body : [body];
      const requestItems = requests.filter(
        (item: any) => item && typeof item.method === "string",
      );
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
        keyId: "unknown",
        label: "Unknown Client",
        type: "api_key",
      };
      const authType: "api_key" | "master" | "oauth" =
        clientAuth.type === "master_key"
          ? "master"
          : clientAuth.type === "oauth"
            ? "oauth"
            : "api_key";
      statsTracker.setActiveSessions(transports.size);

      // Count every JSON-RPC item in a batch, not only the first item.
      const items = requestItems.length ? requestItems : [null];
      items.forEach((item: any, index: number) => {
        const isToolCall =
          item?.method === "tools/call" &&
          typeof item?.params?.name === "string";
        const toolName = isToolCall
          ? String(item.params.name)
          : String(item?.method || "mcp_request");
        statsTracker.recordRequest({
          keyId: clientAuth.keyId,
          label: clientAuth.label,
          type: authType,
          toolName,
          isActualTool: isToolCall,
          durationMs: Date.now() - startTime,
          bytesIn: index === 0 ? bytesIn : 0,
          bytesOut: index === 0 ? bytesOut : 0,
          isError:
            res.statusCode >= 400 ||
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
        bytesOut += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(String(chunk));
        appendResponse(chunk);
      }
      return (origWrite as any)(chunk, ...args);
    };

    (res as any).end = function (chunk: any, ...args: any[]) {
      if (chunk) {
        bytesOut += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(String(chunk));
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
        const sessionEmail =
          keySettings.email ||
          (keyId === "primary-key"
            ? getOwnerEmail() || "owner@localhost"
            : undefined);
        const sessionIdentity = canonicalUserIdentity({
          email: sessionEmail,
          keyId,
        });
        const expectedAuthKey = computeAuthKey(sessionIdentity);
        if (
          entry.keyId !== keyId ||
          getAuthKeyForSession(sessionId) !== expectedAuthKey
        ) {
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
      const sessionEmail =
        keySettings.email ||
        (keyId === "primary-key"
          ? getOwnerEmail() || "owner@localhost"
          : undefined);
      const sessionIdentity = canonicalUserIdentity({
        email: sessionEmail,
        keyId,
      });
      registerSessionAuth(newSessionId, sessionIdentity);

      const authKey = computeAuthKey(sessionIdentity);
      registerSessionSandboxId(newSessionId, authKey);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (id) => {
          transports.set(id, { transport, lastActive: Date.now(), keyId });
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
  "/.well-known/mcp/server-card.json",
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
    icons: getServerInfoIcons(base),
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

app.get(
  ["/mcp/server-card", "/server-card", "/.well-known/mcp/server-card.json"],
  (req, res) => {
    const base =
      process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
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
      icons: getServerInfoIcons(base),
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
  },
);

app.get(["/", "/home"], async (req, res) => {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  const authKey = computeAuthKey(
    owner ? `user_${owner.email.toLowerCase()}` : "anonymous",
  );
  const root = sandboxRootForAuthKey(authKey);
  const uploads = await listUploadedFiles(root);
  const dynamicKeys = owner ? listDynamicKeys(owner.email) : [];
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
  const statsMongoConfigured = Boolean(
    getMongoDb() ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL,
  );
  try {
    await Promise.all([
      ensureMongoAuth().catch(() => {}),
      loadOAuthFromMongo().catch(() => {}),
      statsTracker.ensureMongo(),
    ]);
  } catch (error: any) {
    console.error(
      "[stats] MongoDB restore failed before API response:",
      error?.message || error,
    );
    if (statsMongoConfigured) {
      res.status(503).json({
        error:
          "Statistics are temporarily unavailable because MongoDB could not be reached. No stale local snapshot was served.",
      });
      return;
    }
  }
  const db = getMongoDb();
  if (db) fileShareRegistry.setMongoDb(db);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  // A signed-in account is not automatically the instance owner. Keep the
  // administrative view strictly tied to the configured owner identity.
  const isAdminOwner = Boolean(owner && isOwnerEmail(owner.email));
  const canManageKeys = Boolean(owner);
  const dynamicKeys = owner
    ? isAdminOwner
      ? listDynamicKeys()
      : listDynamicKeys(owner.email)
    : [];
  const oauthAuthorizations = owner
    ? listActiveOAuthAuthorizations().filter((item: any) =>
        isAdminOwner
          ? true
          : item.ownerEmail?.toLowerCase() === owner.email.toLowerCase(),
      )
    : [];

  if (
    req.headers.accept?.includes("application/json") &&
    !req.headers.accept?.includes("text/html")
  ) {
    if (!owner) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    res.json({
      keys: dynamicKeys.map(({ key: _secret, ...metadata }) => metadata),
      oauthAuthorizations: oauthAuthorizations.map((item: any) => ({
        clientId: item.clientId,
        clientName: item.clientName,
        ownerEmail: item.ownerEmail,
        createdAt: item.createdAt,
        lastUsedAt: item.lastUsedAt,
      })),
    });
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(
    renderApiKeysPage({
      base,
      isOwner: canManageKeys,
      owner,
      // Key secrets are never embedded in server-rendered markup.
      keys: dynamicKeys.map((entry) => ({ ...entry, key: "" })),
      oauthAuthorizations: oauthAuthorizations.map((item: any) => ({
        ...item,
        scopes: effectiveOAuthScopes(String(item.clientId || "")),
      })),
    }),
  );
});

app.get("/api/keys", async (req, res) => {
  const statsMongoConfigured = Boolean(
    getMongoDb() ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL,
  );
  try {
    await Promise.all([
      ensureMongoAuth().catch(() => {}),
      loadOAuthFromMongo().catch(() => {}),
      statsTracker.ensureMongo(),
    ]);
  } catch (error: any) {
    console.error(
      "[stats] MongoDB restore failed before page response:",
      error?.message || error,
    );
    if (statsMongoConfigured) {
      res
        .status(503)
        .send(
          "Statistics are temporarily unavailable because MongoDB could not be reached. No stale local snapshot was served.",
        );
      return;
    }
  }
  const dbTools = getMongoDb();
  if (dbTools) fileShareRegistry.setMongoDb(dbTools);
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res
      .status(401)
      .json({ error: "Unauthorized. Sign in as owner to list keys." });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.json({
    keys: listDynamicKeys(owner.email).map(
      ({ key: _secret, ...metadata }) => metadata,
    ),
  });
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
  if (listDynamicKeys(owner.email).length >= 30) {
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
  let createdKeyId = "";
  try {
    // Bind every newly created key to the authenticated Google account.
    // Omitting this email previously caused multi-user accounts to inherit
    // the configured owner identity.
    const entry = createDynamicKey(label, owner.email);
    createdKeyId = entry.id;
    await syncKeyToMongo(entry);
    statsTracker.syncKnownKeys(
      listDynamicKeys(),
      listActiveOAuthAuthorizations(),
    );
    res.status(201).json({
      id: entry.id,
      clientId: entry.clientId,
      key: entry.key,
      prefix: entry.prefix,
      label: entry.label,
      createdAt: entry.createdAt,
      revealable: Boolean(entry.keyEncrypted),
    });
  } catch (err: any) {
    // A key that could not be durably recorded must never be handed to the client.
    if (createdKeyId) revokeDynamicKey(createdKeyId);
    res.status(503).json({
      error:
        "API key creation could not be persisted. Try again after storage is healthy.",
    });
  }
});

const keyRevealLimiter = createLimiter({ windowMs: 60_000, max: 8 });
app.get("/api/keys/:id/secret", async (req, res) => {
  await ensureMongoAuth().catch(() => {});
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Sign in to reveal your API key." });
    return;
  }
  const id = String(req.params.id || "");
  const limiterId = `${owner.email.toLowerCase()}:${clientIp(req)}`;
  if (!keyRevealLimiter.hit(limiterId, 0)) {
    res.setHeader(
      "Retry-After",
      String(keyRevealLimiter.retryAfterSec(limiterId) || 60),
    );
    res
      .status(429)
      .json({ error: "Too many key reveal attempts. Try again shortly." });
    return;
  }
  if (!userOwnsKey(owner.email, id)) {
    res
      .status(403)
      .json({ error: "You can only reveal keys assigned to your account." });
    return;
  }
  const secret = getDynamicKeySecret(id, owner.email);
  if (!secret) {
    res.status(409).json({
      error:
        "This key was created before encrypted recovery was enabled. Create a replacement key to enable reveal and copy.",
    });
    return;
  }
  res.setHeader("Cache-Control", "no-store, no-cache, private, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.json({ key: secret });
});

app.get("/api/keys/:id/credentials/secret", async (req, res) => {
  await ensureMongoAuth().catch(() => {});
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Sign in to reveal your credentials." });
    return;
  }
  const id = String(req.params.id || "");
  const provider = String(req.query.provider || "").toLowerCase();
  if (provider !== "github" && provider !== "render") {
    res.status(400).json({
      error: "Invalid provider. Supported providers: github, render.",
    });
    return;
  }
  const limiterId = `${owner.email.toLowerCase()}:${clientIp(req)}`;
  if (!keyRevealLimiter.hit(limiterId, 0)) {
    res.setHeader(
      "Retry-After",
      String(keyRevealLimiter.retryAfterSec(limiterId) || 60),
    );
    res.status(429).json({
      error: "Too many credential reveal attempts. Try again shortly.",
    });
    return;
  }
  if (!userOwnsKey(owner.email, id)) {
    res.status(403).json({
      error:
        "You can only reveal credentials for keys assigned to your account.",
    });
    return;
  }
  const settings = getKeySettings(id);
  const token =
    provider === "github"
      ? settings.customGitHubToken
      : settings.customRenderToken;
  if (!token) {
    res.status(404).json({
      error: `No custom ${provider} credential is saved for this key.`,
    });
    return;
  }
  res.setHeader("Cache-Control", "no-store, no-cache, private, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.json({ provider, token });
});

app.get("/api/keys/:id/credentials/status", async (req, res) => {
  await ensureMongoAuth().catch(() => {});
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = String(req.params.id || "");
  if (!userOwnsKey(owner.email, id)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }
  const settings = getKeySettings(id);
  res.setHeader("Cache-Control", "no-store, no-cache, private, max-age=0");
  res.json({
    keyId: id,
    hasGitHub: Boolean(settings.customGitHubToken),
    hasRender: Boolean(settings.customRenderToken),
    maskedGitHub: maskSecret(settings.customGitHubToken),
    maskedRender: maskSecret(settings.customRenderToken),
  });
});

app.patch("/api/keys/:id", express.json(), async (req, res) => {
  await ensureMongoAuth().catch(() => {});
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id as string;
  if (!userOwnsKey(owner.email, id)) {
    res.status(403).json({ error: "Forbidden." });
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
    const entry = renameDynamicKey(id, label);
    await syncKeyToMongo(entry);
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
  if (!isOwnerEmail(owner.email) && !userOwnsKey(owner.email, id)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }
  await revokeKeyInMongo(id);
  const closedSessions = closeSessionsForKey(id);
  const revoked = revokeDynamicKey(id);
  statsTracker.removeKey(id);
  statsTracker.syncKnownKeys(
    listDynamicKeys(),
    listActiveOAuthAuthorizations(),
  );
  res.json({ success: revoked, closedSessions });
});

app.get("/api/settings", async (req, res) => {
  await Promise.all([
    ensureMongoAuth().catch(() => {}),
    loadOAuthFromMongo().catch(() => {}),
    statsTracker.ensureMongo().catch(() => {}),
  ]);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.redirect(
      "/auth/google?returnTo=" + encodeURIComponent(req.originalUrl),
    );
    return;
  }
  const keyId = typeof req.query.key === "string" ? req.query.key.trim() : "";
  const dynamicKeys = listDynamicKeys(owner.email);
  const activeOAuths = listActiveOAuthAuthorizations().filter(
    (oa) =>
      isOwnerEmail(owner.email) ||
      oa.ownerEmail?.toLowerCase() === owner.email.toLowerCase(),
  );

  let targetKey: any = dynamicKeys.find((k) => k.id === keyId);
  if (!targetKey) {
    const oauthTarget = activeOAuths.find((oa) => oa.clientId === keyId);
    if (oauthTarget) {
      targetKey = {
        id: oauthTarget.clientId,
        clientId: oauthTarget.clientId,
        label: oauthTarget.clientName || "OAuth Client",
        type: "oauth",
        createdAt: oauthTarget.createdAt || Date.now(),
      };
    }
  }
  if (!targetKey && isOwnerEmail(owner.email) && keyId === "primary-key") {
    targetKey = {
      id: "primary-key",
      label: "Primary Key",
      type: "master",
      createdAt: Date.now(),
    };
  }
  if (!targetKey) {
    targetKey = dynamicKeys[0] || {
      id: keyId || "primary-key",
      label: "API Key",
      createdAt: Date.now(),
    };
  }

  const effectiveKeyId = targetKey.id || targetKey.clientId || "primary-key";
  const keySettings = getKeySettings(effectiveKeyId);
  const summary = statsTracker.getSummary(
    process.cwd(),
    effectiveKeyId,
    isOwnerEmail(owner.email),
  );

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(
    renderApiKeySettingsPage({
      base,
      isOwner: isOwnerEmail(owner.email),
      owner,
      key: targetKey,
      toolsCatalog: summary.toolsCatalog,
      keySettings,
      apiKeyToken: getDynamicKeySecret(effectiveKeyId, owner.email) || "",
      credentialAvailability: {
        github: Boolean(
          getEffectiveCredential(effectiveKeyId, "github", keySettings),
        ),
        render: Boolean(
          getEffectiveCredential(effectiveKeyId, "render", keySettings),
        ),
        workspaceGithub: Boolean(getWorkspaceCredential("github")),
        workspaceRender: Boolean(getWorkspaceCredential("render")),
      },
    }),
  );
});

app.post("/api/keys/:id/settings", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id as string;
  if (!isOwnerEmail(owner.email) && !userOwnsKey(owner.email, id)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }
  const { githubToken, renderApiKey, enabledTools, disabledTools, disabled } =
    req.body || {};
  const settings = getKeySettings(id);

  const effectiveGitHubToken =
    githubToken !== undefined && String(githubToken).trim() !== ""
      ? String(githubToken).trim()
      : settings.customGitHubToken || getWorkspaceCredential("github");
  const effectiveRenderToken =
    renderApiKey !== undefined && String(renderApiKey).trim() !== ""
      ? String(renderApiKey).trim()
      : settings.customRenderToken || getWorkspaceCredential("render");
  if (Array.isArray(enabledTools)) {
    const blocked = findToolMissingCredential(enabledTools, {
      github: Boolean(effectiveGitHubToken),
      render: Boolean(effectiveRenderToken),
    });
    if (blocked) {
      res.status(409).json({
        success: false,
        code:
          blocked.provider === "github"
            ? "GITHUB_TOKEN_REQUIRED"
            : "RENDER_KEY_REQUIRED",
        tool: blocked.toolName,
        error: credentialRequiredMessage(
          blocked.provider,
          blocked.toolName,
          "key",
        ),
      });
      return;
    }
  }

  if (githubToken !== undefined) {
    settings.customGitHubToken = githubToken
      ? String(githubToken).trim()
      : undefined;
    if (settings.customGitHubToken) registerSecret(settings.customGitHubToken);
  }
  if (renderApiKey !== undefined) {
    settings.customRenderToken = renderApiKey
      ? String(renderApiKey).trim()
      : undefined;
    if (settings.customRenderToken) registerSecret(settings.customRenderToken);
  }
  if (Array.isArray(enabledTools)) {
    settings.enabledTools = enabledTools.map(String);
  }
  if (Array.isArray(disabledTools)) {
    settings.disabledTools = disabledTools.map(String);
  }
  if (typeof disabled === "boolean") {
    settings.disabled = disabled;
  }
  // If a credential was just cleared, drop any explicitly-enabled tool that now lacks it.
  {
    const ready = keyCredentialsReady(id, settings);
    settings.enabledTools = (settings.enabledTools || []).filter(
      (t) => !getMissingToolCredential(t, ready),
    );
  }
  settings.updatedAt = Date.now();
  saveSettingsToDisk();
  syncKeySettingsToMongo(settings).catch(() => {});
  const closedSessions = closeSessionsForKey(id);

  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, settings, closedSessions });
});

app.post("/api/account/delete", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const email = owner.email.toLowerCase();
  const userKeys = listDynamicKeys(email);
  for (const k of userKeys) {
    closeSessionsForKey(k.id);
    revokeDynamicKey(k.id);
    statsTracker.removeKey(k.id);
  }
  statsTracker.syncKnownKeys(
    listDynamicKeys(),
    listActiveOAuthAuthorizations(),
  );

  res.clearCookie("krix_owner");
  res.json({
    success: true,
    message: "Account and associated tokens deleted.",
  });
});

app.get("/privacy", (req, res) => {
  const owner = parseOwnerCookie(req);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderPrivacyPage({ owner }));
});

app.get("/terms", (req, res) => {
  const owner = parseOwnerCookie(req);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderTermsPage({ owner }));
});

app.get("/help", (req, res) => {
  const owner = parseOwnerCookie(req);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderHelpPage({ owner, base }));
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
  if (!owner) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(
      renderToolsPage({
        base,
        isOwner: false,
        owner: null,
        tools: statsTracker.getSummary("/tmp").toolsCatalog,
      }),
    );
    return;
  }
  const isOwner = isOwnerEmail(owner.email);
  let selectedKeyId =
    typeof req.query.key === "string" ? req.query.key.trim() : undefined;
  if (selectedKeyId && (!owner || !userOwnsKey(owner.email, selectedKeyId))) {
    res.status(403).send("Forbidden");
    return;
  }
  if (!selectedKeyId) {
    selectedKeyId =
      listDynamicKeys(owner.email)[0]?.id ||
      listActiveOAuthAuthorizations().find(
        (authorization) =>
          authorization.ownerEmail?.toLowerCase() === owner.email.toLowerCase(),
      )?.clientId ||
      (isOwnerEmail(owner.email) ? "primary-key" : "no-keys");
  }
  // Build the tool catalog from the real MCP registrations. The probe has a
  // throwaway identity and is never connected to a transport or executed.
  const probeSessionId = crypto.randomUUID();
  const probeSettings: KeySettings = {
    ...getKeySettings(selectedKeyId),
    keyId: selectedKeyId,
    email: owner.email,
    role: isOwnerEmail(owner.email) ? "owner" : "user",
  };
  const probeGithubToken = getEffectiveCredential(
    probeSettings.keyId,
    "github",
    probeSettings,
  );
  const probeRenderToken =
    getEffectiveCredential(probeSettings.keyId, "render", probeSettings) ||
    undefined;
  registerSessionAuth(
    probeSessionId,
    `krix_tool_catalog_${owner.email.toLowerCase()}_${probeSessionId}`,
  );
  try {
    createMasterServer(
      probeGithubToken,
      probeRenderToken,
      probeSessionId,
      req,
      probeSettings,
    );
  } finally {
    clearToolRegistrations(probeSessionId);
    unregisterSessionAuth(probeSessionId);
  }
  const authKey = computeAuthKey(
    owner ? `user_${owner.email.toLowerCase()}` : "anonymous",
  );
  const root = sandboxRootForAuthKey(authKey);
  statsTracker.setActiveSessions(transports.size);
  const summary = statsTracker.getSummary(root, selectedKeyId, isOwner);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(
    renderToolsPage({
      base,
      isOwner,
      owner,
      tools: summary.toolsCatalog,
      summary,
      selectedKeyId,
    }),
  );
});

app.post("/tools/execute", express.json({ limit: "1mb" }), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Sign in is required." });
    return;
  }

  const toolName =
    typeof req.body?.toolName === "string" ? req.body.toolName : "";
  const keyId = typeof req.body?.keyId === "string" ? req.body.keyId : "";
  const args = req.body?.arguments;
  if (
    !keyId ||
    !toolName ||
    !["sandbox_exec", "sandbox_run"].includes(toolName)
  ) {
    res.status(400).json({
      ok: false,
      error:
        "Only sandbox_exec and sandbox_run can be run from the web inspector.",
    });
    return;
  }
  if (!userOwnsKey(owner.email, keyId)) {
    res
      .status(403)
      .json({ ok: false, error: "You do not own the selected key." });
    return;
  }
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    res
      .status(400)
      .json({ ok: false, error: "Arguments must be a JSON object." });
    return;
  }

  const sessionId = crypto.randomUUID();
  const settings: KeySettings = {
    ...getKeySettings(keyId),
    keyId,
    email: owner.email,
    role: isOwnerEmail(owner.email) ? "owner" : "user",
  };
  const githubToken = getEffectiveCredential(keyId, "github", settings);
  const renderToken =
    getEffectiveCredential(keyId, "render", settings) || undefined;

  // A unique authenticated sandbox identity ensures every web execution gets
  // a disposable workspace and cannot read another key's persistent files.
  registerSessionAuth(
    sessionId,
    `krix_web_runner_${owner.email.toLowerCase()}_${sessionId}`,
  );
  try {
    createMasterServer(githubToken, renderToken, sessionId, req, settings);
    const result = await executeRegisteredTool(sessionId, toolName, args);
    const serialized = JSON.stringify(result ?? null);
    const output = sanitizeOutput(
      serialized.length > 180_000
        ? `${serialized.slice(0, 180_000)}\n[Output truncated]`
        : serialized,
    );
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, result: output });
  } catch (error: any) {
    res.status(400).json({
      ok: false,
      error: sanitizeOutput(String(error?.message || "Tool execution failed.")),
    });
  } finally {
    clearToolRegistrations(sessionId);
    await destroySandbox(sessionId).catch(() => {});
    unregisterSessionAuth(sessionId);
  }
});

app.get("/stats/api", async (req, res) => {
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
  const apiEntry = clientKey ? findAuthorizedApiKey(clientKey) : null;
  if (
    selectedKeyId &&
    (owner
      ? !userOwnsKey(owner.email, selectedKeyId)
      : !apiEntry || apiEntry.id !== selectedKeyId)
  ) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }
  const authKey = computeAuthKey(
    owner
      ? `user_${owner.email.toLowerCase()}`
      : `key_${apiEntry?.id || "anonymous"}`,
  );
  const root = sandboxRootForAuthKey(authKey);
  statsTracker.setActiveSessions(transports.size);
  const scopedKeyId =
    selectedKeyId ||
    apiEntry?.id ||
    (owner
      ? listDynamicKeys(owner.email)[0]?.id ||
        listActiveOAuthAuthorizations().find(
          (authorization) =>
            authorization.ownerEmail?.toLowerCase() ===
            owner.email.toLowerCase(),
        )?.clientId ||
        (isOwnerEmail(owner.email) ? "primary-key" : "no-keys")
      : clientKey === MCP_API_KEY
        ? "primary-key"
        : undefined);
  if (!scopedKeyId) {
    res
      .status(403)
      .json({ error: "Unable to resolve the API key's usage scope." });
    return;
  }
  const summary = statsTracker.getSummary(
    root,
    scopedKeyId,
    owner ? isOwnerEmail(owner.email) : clientKey === MCP_API_KEY,
  );
  res.setHeader("Cache-Control", "no-store");
  res.json(summary);
});

app.get("/stats/api/timeline", async (req, res) => {
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
      .json({ error: "Unauthorized access to telemetry timeline." });
    return;
  }

  const month =
    typeof req.query.month === "string" ? req.query.month.trim() : "";
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({
      error: "Query parameter 'month' in YYYY-MM format is required.",
    });
    return;
  }

  const chunk = await statsTracker.loadHistoricalChunk(month);
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true, month, chunk });
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
  if (!owner) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(
      renderStatsPage({
        base,
        isOwner: false,
        owner: null,
        summary: statsTracker.getSummary(process.cwd(), "no-keys", false),
      }),
    );
    return;
  }
  const isOwner = isOwnerEmail(owner.email);
  const selectedKeyId =
    typeof req.query.key === "string" ? req.query.key.trim() : undefined;
  if (selectedKeyId && !userOwnsKey(owner.email, selectedKeyId)) {
    res.status(403).send("Forbidden");
    return;
  }
  const scopedKeyId =
    selectedKeyId ||
    listDynamicKeys(owner.email)[0]?.id ||
    listActiveOAuthAuthorizations().find(
      (authorization) =>
        authorization.ownerEmail?.toLowerCase() === owner.email.toLowerCase(),
    )?.clientId ||
    (isOwner ? "primary-key" : "no-keys");

  const authKey = computeAuthKey(
    owner ? `user_${owner.email.toLowerCase()}` : "anonymous",
  );
  const root = sandboxRootForAuthKey(authKey);
  statsTracker.setActiveSessions(transports.size);
  const summary = statsTracker.getSummary(root, scopedKeyId, isOwner);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
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
  if (keyId === "primary-key") return isOwnerEmail(email);
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
        credentialAvailability: {
          github: Boolean(getWorkspaceCredential("github")),
          render: Boolean(getWorkspaceCredential("render")),
          workspaceGithub: Boolean(getWorkspaceCredential("github")),
          workspaceRender: Boolean(getWorkspaceCredential("render")),
        },
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
      label: "Primary API Key",
      prefix: "MCP_API_KEY",
      role: "owner",
      email: owner.email,
    });
    for (const k of listDynamicKeys(owner.email)) {
      keys.push({
        id: k.id,
        label: k.label,
        prefix: k.prefix,
        role: k.role || (isOwnerEmail(k.email) ? "owner" : "user"),
        email: k.email,
      });
    }
    for (const oa of listActiveOAuthAuthorizations()) {
      if (oa.ownerEmail?.toLowerCase() !== owner.email.toLowerCase()) continue;
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
  const userQuota = getUserQuota(userRole);
  const authKey = computeAuthKey(`user_${owner.email.toLowerCase()}`);
  const root = sandboxRootForAuthKey(authKey);
  const summary = statsTracker.getSummary(root, selectedKeyId, isOwner);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(
    renderSettingsPage({
      base,
      isOwner,
      owner,
      keys,
      selectedKeyId,
      keySettings,
      credentialAvailability: {
        github: Boolean(
          getEffectiveCredential(selectedKeyId, "github", keySettings),
        ),
        render: Boolean(
          getEffectiveCredential(selectedKeyId, "render", keySettings),
        ),
        workspaceGithub: Boolean(getWorkspaceCredential("github")),
        workspaceRender: Boolean(getWorkspaceCredential("render")),
      },
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
    res.status(403).json({
      ok: false,
      error: "Forbidden: You do not have permission to manage this key.",
    });
    return;
  }

  try {
    // Validate newly supplied provider credentials before persisting them.
    if (typeof githubToken === "string" && githubToken.trim()) {
      const validation = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${githubToken.trim()}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!validation.ok) {
        res.status(422).json({
          ok: false,
          code: "INVALID_GITHUB_TOKEN",
          error:
            validation.status === 401
              ? "GitHub rejected this token. Check that it is valid and has not expired."
              : `GitHub credential validation failed (${validation.status}).`,
        });
        return;
      }
    }
    if (typeof renderToken === "string" && renderToken.trim()) {
      const validation = await fetch(
        "https://api.render.com/v1/owners?limit=1",
        {
          headers: {
            Authorization: `Bearer ${renderToken.trim()}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!validation.ok) {
        res.status(422).json({
          ok: false,
          code: "INVALID_RENDER_TOKEN",
          error:
            validation.status === 401 || validation.status === 403
              ? "Render rejected this API key. Check that it is valid and has not been revoked."
              : `Render credential validation failed (${validation.status}).`,
        });
        return;
      }
    }
    const updated = updateKeyCredentials(
      keyId,
      owner.email,
      typeof githubToken === "string" ? githubToken : undefined,
      typeof renderToken === "string" ? renderToken : undefined,
    );
    await syncKeySettingsToMongo(updated);
    const closedSessions = closeSessionsForKey(keyId);
    res.setHeader("Cache-Control", "no-store");

    res.json({
      ok: true,
      closedSessions,
      maskedGitHub: maskSecret(updated.customGitHubToken),
      maskedRender: maskSecret(updated.customRenderToken),
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || "Failed to save credentials.",
    });
  }
});

app.post(
  "/settings/api/credentials/delete",
  express.json(),
  async (req, res) => {
    const owner = parseOwnerCookie(req);
    if (!owner) {
      res
        .status(401)
        .json({ ok: false, error: "Unauthorized. Please sign in." });
      return;
    }
    const { keyId, provider } = req.body || {};
    if (typeof keyId !== "string" || !["github", "render"].includes(provider)) {
      res
        .status(400)
        .json({ ok: false, error: "Invalid credential deletion request." });
      return;
    }
    if (!userOwnsKey(owner.email, keyId)) {
      res.status(403).json({
        ok: false,
        error: "You cannot manage credentials for this key.",
      });
      return;
    }
    try {
      removeKeyCredential(keyId, provider);
      pruneToolsMissingCredentials(keyId);
      const updated = getKeySettings(keyId);
      await syncKeySettingsToMongo(updated);
      const closedSessions = closeSessionsForKey(keyId);
      res.setHeader("Cache-Control", "no-store");
      res.json({ ok: true, provider, deleted: true, closedSessions });
    } catch {
      res.status(503).json({
        ok: false,
        error: "Credential deletion could not be persisted.",
      });
    }
  },
);

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
    res.status(403).json({
      ok: false,
      error: "Forbidden: You do not have permission to manage this key.",
    });
    return;
  }

  try {
    const credentialRequirement = getToolCredentialRequirement(toolName);
    const missingCredential = getMissingToolCredential(
      toolName,
      keyCredentialsReady(keyId),
    );
    if (enabled && missingCredential) {
      res.status(409).json({
        ok: false,
        code:
          missingCredential === "github"
            ? "GITHUB_TOKEN_REQUIRED"
            : "RENDER_KEY_REQUIRED",
        tool: toolName,
        error: credentialRequiredMessage(missingCredential, toolName, "global"),
      });
      return;
    }
    const updated = toggleKeyTool(keyId, toolName, Boolean(enabled));
    const closedSessions = closeSessionsForKey(keyId);
    res.json({
      ok: true,
      credentialRequirement,
      closedSessions,
      enabledTools: updated.enabledTools,
      disabledTools: updated.disabledTools,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ ok: false, error: err?.message || "Failed to toggle tool." });
  }
});

app.post("/settings/api/tool-risk", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Unauthorized. Please sign in." });
    return;
  }
  const { keyId, toolName, riskLevel, acknowledgeHighRisk } = req.body || {};
  if (
    typeof keyId !== "string" ||
    typeof toolName !== "string" ||
    !toolName.trim()
  ) {
    res.status(400).json({ ok: false, error: "Invalid tool risk request." });
    return;
  }
  if (!userOwnsKey(owner.email, keyId)) {
    res
      .status(403)
      .json({ ok: false, error: "You cannot change policies for this key." });
    return;
  }
  try {
    const updated = updateKeyToolRiskLevel(
      keyId,
      toolName,
      riskLevel,
      acknowledgeHighRisk === true,
    );
    await syncKeySettingsToMongo(updated);
    const closedSessions = closeSessionsForKey(keyId);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ok: true,
      closedSessions,
      riskLevel: updated.toolRiskLevels?.[toolName],
      acknowledged: updated.riskAcknowledgedTools?.includes(toolName) || false,
    });
  } catch (err: any) {
    res.status(400).json({
      ok: false,
      error: err?.message || "Could not update tool risk.",
    });
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
    res.status(403).json({
      ok: false,
      error: "Forbidden: You do not have permission to manage this key.",
    });
    return;
  }

  try {
    // The bulk endpoint must enforce the same credential rules as the single-tool toggle.
    const blocked = findToolMissingCredential(
      enabledTools,
      keyCredentialsReady(keyId),
    );
    if (blocked) {
      res.status(409).json({
        ok: false,
        code:
          blocked.provider === "github"
            ? "GITHUB_TOKEN_REQUIRED"
            : "RENDER_KEY_REQUIRED",
        tool: blocked.toolName,
        error: credentialRequiredMessage(
          blocked.provider,
          blocked.toolName,
          "global",
        ),
      });
      return;
    }
    const updated = updateKeyTools(
      keyId,
      Array.isArray(enabledTools) ? enabledTools : [],
      Array.isArray(disabledTools) ? disabledTools : [],
    );
    const closedSessions = closeSessionsForKey(keyId);
    res.json({
      ok: true,
      closedSessions,
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
  const userQuota = getUserQuota(isOwner ? "owner" : "user");

  res.setHeader("Cache-Control", "no-store");
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
function extractCallerAuthKey(req: Request): string | null {
  const owner = parseOwnerCookie(req);
  if (owner && owner.email) {
    return computeUserAuthKey({ email: owner.email });
  }
  const clientKey = extractClientKey(req);
  if (clientKey) {
    const dyn = findAuthorizedApiKey(clientKey);
    if (dyn?.email) return computeUserAuthKey({ email: dyn.email });
    if (dyn?.id) return computeUserAuthKey({ keyId: dyn.id });
    if (MCP_API_KEY && safeEqual(clientKey, MCP_API_KEY)) {
      return computeUserAuthKey({
        email: getOwnerEmail() || "owner@localhost",
      });
    }
  }
  return null;
}

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
    const authKey = computeUserAuthKey({ email: owner.email });
    const root = sandboxRootForAuthKey(authKey);
    const fileStore = getFileStore();

    const [storeResult, usage] = await Promise.all([
      fileStore
        .listByOwner(authKey, { limit: 100, status: "all" })
        .catch(() => ({ files: [], totalCount: 0 })),
      fileStore.usage(authKey).catch(() => undefined),
    ]);

    const files: StoredFileInfo[] = storeResult.files.map((f) => {
      const share = fileShareRegistry.ensureFileShare({
        fileId: f.id,
        name: f.name,
        source: "store",
        contentType: f.contentType,
        ownerKey: authKey,
        isPublic: f.isPublic,
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
        isOwned: true,
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
              ownerKey: authKey,
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
              isOwned: true,
            });
          }
        }
      } catch {}
    }

    // Include public files from other users so they can be viewed and downloaded by anyone
    const knownIds = new Set(files.map((f) => f.id));
    const publicShares = fileShareRegistry.listPublicShares();
    for (const p of publicShares) {
      if (knownIds.has(p.fileId)) continue;
      if (p.ownerKey && p.ownerKey !== authKey) {
        files.push({
          id: p.fileId,
          name: p.name,
          size: 0,
          contentType: p.contentType || "application/octet-stream",
          createdAt: p.updatedAt,
          expiresAt: null,
          source: p.source,
          downloadUrl: `${base}/store/share/${p.shareToken}`,
          shareUrl: `${base}/store/share/${p.shareToken}`,
          isPublic: true,
          permanent: false,
          isOwned: false,
        });
        knownIds.add(p.fileId);
      }
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
  const authKey = computeUserAuthKey({ email: owner.email });
  const root = sandboxRootForAuthKey(authKey);
  const fileStore = getFileStore();

  const [storeResult, usage] = await Promise.all([
    fileStore
      .listByOwner(authKey, { limit: 100, status: "all" })
      .catch(() => ({ files: [], totalCount: 0 })),
    fileStore.usage(authKey).catch(() => undefined),
  ]);

  const files: StoredFileInfo[] = storeResult.files.map((f) => {
    const share = fileShareRegistry.ensureFileShare({
      fileId: f.id,
      name: f.name,
      source: "store",
      contentType: f.contentType,
      ownerKey: authKey,
      isPublic: f.isPublic,
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
      isOwned: true,
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
            ownerKey: authKey,
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
            isOwned: true,
          });
        }
      }
    } catch {}
  }

  // Include public files from other users
  const knownIds = new Set(files.map((f) => f.id));
  const publicShares = fileShareRegistry.listPublicShares();
  for (const p of publicShares) {
    if (knownIds.has(p.fileId)) continue;
    if (p.ownerKey && p.ownerKey !== authKey) {
      files.push({
        id: p.fileId,
        name: p.name,
        size: 0,
        contentType: p.contentType || "application/octet-stream",
        createdAt: p.updatedAt,
        expiresAt: null,
        source: p.source,
        downloadUrl: `${base}/store/share/${p.shareToken}`,
        shareUrl: `${base}/store/share/${p.shareToken}`,
        isPublic: true,
        permanent: false,
        isOwned: false,
      });
      knownIds.add(p.fileId);
    }
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
  const authKey = computeUserAuthKey({ email: owner.email });
  const share = fileShareRegistry.getById(id);

  if (share && share.ownerKey && share.ownerKey !== authKey) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }

  if (id.startsWith("sbx_")) {
    const root = sandboxRootForAuthKey(authKey);
    const fileName = share
      ? share.name
      : Buffer.from(id.slice(4), "hex").toString("utf-8");
    const filePath = path.join(root, UPLOAD_DIR, fileName);
    if (!share && !fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found." });
      return;
    }
  } else {
    const file = await getFileStore().openById(authKey, id);
    if (!file) {
      res.status(403).json({
        error: "Forbidden: You do not own this file or it does not exist.",
      });
      return;
    }
  }

  const explicitIsPublic =
    typeof req.body?.isPublic === "boolean" ? req.body.isPublic : undefined;
  const isPublic = fileShareRegistry.togglePrivacy(
    id,
    explicitIsPublic,
    authKey,
  );
  res.json({ success: true, id, isPublic });
});

app.get(["/store/share/:token", "/store/download/:token"], async (req, res) => {
  const token =
    (Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token) || "";
  const share =
    fileShareRegistry.getByToken(token) || fileShareRegistry.getById(token);

  const callerAuthKey = extractCallerAuthKey(req);

  if (share) {
    if (!share.isPublic) {
      if (!callerAuthKey) {
        res
          .status(401)
          .type("text/plain")
          .send(
            "Access denied. This file is private and requires authentication.",
          );
        return;
      }
      if (share.ownerKey && callerAuthKey !== share.ownerKey) {
        res
          .status(403)
          .type("text/plain")
          .send(
            "Forbidden: You do not have permission to access this private file.",
          );
        return;
      }
    }

    try {
      if (share.source === "store") {
        const file = await getFileStore().openById(
          share.isPublic ? "*" : callerAuthKey || "*",
          share.fileId,
        );
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
          if (share.ownerKey) {
            const root = sandboxRootForAuthKey(share.ownerKey);
            const candidate = path.join(root, UPLOAD_DIR, share.name);
            if (fs.existsSync(candidate)) targetPath = candidate;
          }
        }
        if (!targetPath || !fs.existsSync(targetPath)) {
          res
            .status(404)
            .type("text/plain")
            .send("Sandbox file not found on disk.");
          return;
        }
        if (share.ownerKey) {
          await assertInsideRealRoot(
            sandboxRootForAuthKey(share.ownerKey),
            targetPath,
          );
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
        res
          .status(500)
          .type("text/plain")
          .send("Download error: " + e.message);
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
    if (file.isPublic === false) {
      if (!callerAuthKey) {
        res
          .status(401)
          .type("text/plain")
          .send(
            "Access denied. This file is private and requires authentication.",
          );
        return;
      }
      if (file.ownerKey && callerAuthKey !== file.ownerKey) {
        res
          .status(403)
          .type("text/plain")
          .send(
            "Forbidden: You do not have permission to access this private file.",
          );
        return;
      }
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
  const callerAuthKey = extractCallerAuthKey(req);
  if (!callerAuthKey) {
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

  const root = sandboxRootForAuthKey(callerAuthKey);
  const filePath = path.join(root, UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).type("text/plain").send("File not found.");
    return;
  }
  try {
    await assertInsideRealRoot(root, filePath);
  } catch {
    res.status(400).type("text/plain").send("Invalid path.");
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
  const authKey = computeUserAuthKey({ email: owner.email });
  const ok = await getFileStore().makePermanent(authKey, id);
  if (ok) res.json({ success: true, permanent: true });
  else
    res.status(404).json({ error: "File not found or not owned by caller." });
});

app.post("/store/revert-permanent/:id", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id;
  const authKey = computeUserAuthKey({ email: owner.email });
  const ok = await getFileStore().revertPermanent(authKey, id);
  if (ok) res.json({ success: true, permanent: false });
  else
    res.status(404).json({ error: "File not found or not owned by caller." });
});

app.delete("/store/files/:id", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id;
  const authKey = computeUserAuthKey({ email: owner.email });
  const share = fileShareRegistry.getById(id);
  if (share && share.ownerKey && share.ownerKey !== authKey) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }
  const ok = await getFileStore().deleteOwned(authKey, id);
  if (ok) {
    fileShareRegistry.removeFile(id);
    res.json({ success: true, deleted: id });
  } else {
    res.status(404).json({ error: "File not found or not owned by caller." });
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
  const authKey = computeUserAuthKey({ email: owner.email });
  const share = fileShareRegistry.getById(id);
  if (share && share.ownerKey && share.ownerKey !== authKey) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }
  const ok = await getFileStore().rename(authKey, id, name);
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
  const name = (
    typeof req.query.name === "string"
      ? req.query.name
      : typeof req.query.file === "string"
        ? req.query.file
        : ""
  ).trim();
  if (
    !name ||
    name.includes("..") ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    res.status(400).json({ error: "Invalid filename." });
    return;
  }
  const authKey = computeUserAuthKey({ email: owner.email });
  const root = sandboxRootForAuthKey(authKey);
  const filePath = path.join(root, UPLOAD_DIR, name);
  const sbxId = `sbx_${Buffer.from(name).toString("hex").slice(0, 16)}`;
  const share = fileShareRegistry.getById(sbxId);
  if (share && share.ownerKey && share.ownerKey !== authKey) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  try {
    await assertInsideRealRoot(root, filePath);
  } catch {
    res.status(400).json({ error: "Invalid filename." });
    return;
  }
  fs.unlinkSync(filePath);
  fileShareRegistry.removeFile(sbxId);
  res.json({ success: true, deleted: name });
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
  const authKey = computeUserAuthKey({ email: owner.email });
  const root = sandboxRootForAuthKey(authKey);
  const oldPath = path.join(root, UPLOAD_DIR, oldName);
  const newPath = path.join(root, UPLOAD_DIR, newName);
  const oldSbxId = `sbx_${Buffer.from(oldName).toString("hex").slice(0, 16)}`;
  const share = fileShareRegistry.getById(oldSbxId);
  if (share && share.ownerKey && share.ownerKey !== authKey) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }
  if (!fs.existsSync(oldPath)) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  try {
    await assertInsideRealRoot(root, oldPath);
    await assertInsideRealRoot(root, newPath);
  } catch {
    res.status(400).json({ error: "Invalid filename." });
    return;
  }
  try {
    fs.renameSync(oldPath, newPath);
    if (share) {
      fileShareRegistry.renameFile(oldSbxId, newName);
    }
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
let server: ReturnType<typeof app.listen> | undefined;

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    await ensureMongoAuth();
    if (!getMongoDb()) {
      throw new Error(
        "MongoDB must be reachable before Krix can accept production traffic.",
      );
    }
  }
  server = app.listen(PORT, () => {
    console.log(`Krix active on port ${PORT}`);
    logIsolationStatus();
    if (getMongoDb()) startFileSweeper();
    else
      console.warn(
        "MongoDB is not configured: durable file sharing is unavailable.",
      );
  });
  server.requestTimeout = 120_000;
  server.headersTimeout = 30_000;
  server.keepAliveTimeout = 65_000;
}

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
  if (server) server.close(() => process.exit(0));
  else process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
if (process.env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    console.error(
      "[startup] refusing to serve with unsafe or unavailable production dependencies:",
      sanitizeOutput(String(err?.message || err)).slice(0, 500),
    );
    process.exit(1);
  });
}

export { startServer, shutdown };
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
