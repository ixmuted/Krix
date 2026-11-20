import { validateDisplayName } from "./nameRules.js";
import express, { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import {
  createMcpHandler,
  isInitializeRequest,
  LATEST_PROTOCOL_VERSION,
  McpServer,
} from "@modelcontextprotocol/server";
import {
  SkillsExtension,
  type SkillCatalog,
  type SkillFiles,
} from "@modelcontextprotocol/server/ext/skills";
import {
  NodeStreamableHTTPServerTransport,
  toNodeHandler,
} from "@modelcontextprotocol/node";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

import {
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
import { registerSandboxTools, destroySandbox, cleanupStaleWorkDirs } from "./sandboxTools.js";
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
import {
  logIsolationStatus,
  assertInsideRealRoot,
  sandboxPolicy,
} from "./sandboxProc.js";
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
  registerSessionRole,
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
  reconcileRiskAcknowledgements,
  updateKeyToolRiskLevel,
  isToolEnabledForKey,
  isKeyDisabled,
  resetKeyToolOverrides,
  syncKeySettingsToMongo,
  ensureSettingsFromMongo,
  saveSettingsToDisk,
  getUserRole,
  isOwnerEmail,
  getOwnerEmail,
  maskSecret,
  generateSandboxId,
  deleteUserAccount,
  scheduleAccountDeletion,
  cancelAccountDeletion,
  isAccountScheduledForDeletion,
  resolveAcceptGlobalEnables,
  setKeyGlobalEnableMode,
  setWorkspaceGlobalLock,
  type GlobalEnableMode,
  type KeySettings,
} from "./userSettings.js";
import {
  getClientIp,
  getUserAgent,
  sendAccountDeletedEmail,
} from "./emailService.js";
import {
  credentialRequiredMessage,
  resolveToolState,
  categoryUnavailableMessage,
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
export function getWorkspaceKeyIdForEmail(email?: string): string {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || normalized === "anonymous" || isOwnerEmail(normalized)) {
    return "primary-key";
  }
  return `workspace:${normalized}`;
}

export function getWorkspaceCredential(
  provider: "github" | "render",
  email?: string,
  allowPrimaryFallback: boolean = true,
): string {
  const normalized = String(email || "").trim().toLowerCase();
  if (normalized && normalized !== "anonymous" && !isOwnerEmail(normalized)) {
    const wsKeyId = getWorkspaceKeyIdForEmail(normalized);
    if (!wsKeyId) return "";
    const wsSettings = getKeySettings(wsKeyId);
    const token =
      provider === "github"
        ? wsSettings?.customGitHubToken
        : wsSettings?.customRenderToken;
    return token ? token.trim() : "";
  }
  if (!isOwnerEmail(normalized) && !allowPrimaryFallback) {
    return "";
  }
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
 * Checks key-level override first; if unset or empty, inherits that account's workspace credential.
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
  return getWorkspaceCredential(provider, settings.email, keyId === "primary-key");
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
  const scopes = new Set<string>();
  for (const [toolName, category] of Object.entries(TOOL_CATEGORY)) {
    if (getMissingToolCredential(toolName, ready, category)) continue;
    if (
      !isToolEnabledForKey(
        clientId,
        toolName,
        category,
        undefined,
        ready,
        isCategoryAllowedOnServer(category),
      )
    )
      continue;
    if (category === "sandbox") scopes.add("mcp:sandbox");
    else if (category === "github_admin" || category === "render")
      scopes.add("mcp:admin");
    else scopes.add("mcp:tools");
  }
  return ["mcp:tools", "mcp:sandbox", "mcp:admin"].filter((s) => scopes.has(s));
}

async function pruneAffectedKeysForCredentialRemoval(
  email: string,
  keyId: string,
): Promise<number> {
  const wsKeyId = getWorkspaceKeyIdForEmail(email);
  const targets =
    keyId === wsKeyId
      ? Array.from(new Set([keyId, ...ownedStatsKeyIds(email)]))
      : [keyId];
  let closedSessions = 0;
  // A removed credential must NOT erase anyone's on/off choices: the tools simply show as
  // unavailable (greyed out) until a credential is added again, then come back as they were.
  // Only the live sessions are closed so clients reconnect with the new tool list.
  for (const targetId of targets) {
    await syncKeySettingsToMongo(getKeySettings(targetId));
    closedSessions += closeSessionsForKey(targetId);
  }
  return closedSessions;
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
  transport: NodeStreamableHTTPServerTransport;
  lastActive: number;
  keyId: string;
  /** Live MCP server so tool policy changes can be applied without dropping the session. */
  server?: McpServer;
}
const transports = new Map<string, SessionEntry>();

/** Close every live MCP session for a key so credential changes take effect immediately. */
function closeSessionsForKey(keyId: string): number {
  let closed = 0;
  // Every API key / OAuth client inherits the workspace (primary-key) credentials, so a
  // workspace credential change must invalidate all sessions, not just the primary key's.
  for (const [sessionId, entry] of Array.from(transports)) {
    if (keyId !== "primary-key" && entry.keyId !== keyId) continue;
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


/**
 * Deployment-level limit for sandbox (code execution) tools. This is the same decision the
 * sandbox runtime enforces (sandboxPolicy), so the Settings pages never offer a switch that the
 * runtime would refuse.
 */
function isSandboxAllowedOnServer(): boolean {
  return sandboxPolicy().allowed;
}

/** Whether the deployment permits a whole tool category at all. */
function isCategoryAllowedOnServer(category: string): boolean {
  if (category === "sandbox") return isSandboxAllowedOnServer();
  if (category === "files") return process.env.ENABLE_FILE_SHARING !== "false";
  return true;
}

/**
 * The first tool in `names` whose whole category this deployment forbids, or null. Saving such a
 * tool as "on" used to succeed and then show as off after a refresh, so every endpoint that turns
 * tools on refuses it up front instead.
 */
function findToolBlockedByServer(
  names: unknown,
): { toolName: string; message: string } | null {
  if (!Array.isArray(names)) return null;
  for (const raw of names) {
    const toolName = String(raw);
    const category = TOOL_CATEGORY[toolName];
    if (category && !isCategoryAllowedOnServer(category)) {
      return {
        toolName,
        message: categoryUnavailableMessage(
          toolName,
          category,
          category === "sandbox" ? sandboxPolicy().reason : undefined,
        ),
      };
    }
  }
  return null;
}

/**
 * What the Settings pages show for every tool, computed with the same rules the MCP server
 * uses on tools/list, so a switch on the page always matches what a client actually sees.
 */
function buildToolStates(
  keyId: string,
  credentials: { github: boolean; render: boolean },
): Record<
  string,
  { enabled: boolean; reason: string; remembered: boolean }
> {
  const settings = getKeySettings(keyId);
  const btsEmail = String(settings.email || "").trim().toLowerCase();
  const wsKeyId =
    btsEmail && btsEmail !== "anonymous"
      ? getWorkspaceKeyIdForEmail(btsEmail)
      : keyId === "primary-key"
        ? "primary-key"
        : "";
  const primary =
    wsKeyId && keyId !== wsKeyId ? getKeySettings(wsKeyId) : undefined;
  const states: Record<
    string,
    { enabled: boolean; reason: string; remembered: boolean }
  > = {};
  for (const [toolName, category] of Object.entries(TOOL_CATEGORY)) {
    const categoryAllowed = isCategoryAllowedOnServer(category);
    const { reason } = resolveToolState({
      toolName,
      category,
      requires: getToolCredentialRequirement(toolName, category),
      credentials,
      categoryAllowed,
      keyEnabled: settings.enabledTools,
      keyDisabled: settings.disabledTools,
      globalEnabled: primary?.enabledTools,
      globalDisabled: primary?.disabledTools,
      acceptGlobalEnables: resolveAcceptGlobalEnables(settings, primary),
      globalBaseline: settings.globalEnableBaseline,
    });
    const enabled = isToolEnabledForKey(
      keyId,
      toolName,
      category,
      undefined,
      credentials,
      categoryAllowed,
      wsKeyId,
    );
    // What the switch would show if the missing provider credential were present. Tools that
    // are greyed out only because a credential is missing keep this, so re-adding the
    // credential brings them back without anyone switching them on again.
    const credentialBlocked = reason === "needs-github" || reason === "needs-render";
    const remembered = credentialBlocked
      ? isToolEnabledForKey(
          keyId,
          toolName,
          category,
          undefined,
          { github: true, render: true },
          categoryAllowed,
          wsKeyId,
        )
      : enabled;
    states[toolName] = { enabled, reason, remembered };
  }
  return states;
}

/**
 * Tools that are on for this key right now through global inheritance or defaults. Recorded
 * when a key stops inheriting global changes, so it keeps what it has (even if turned off
 * globally later) and ignores anything switched on globally afterwards.
 */
function computeInheritedBaseline(keyId: string): string[] {
  const settings = getKeySettings(keyId);
  const credentials = keyCredentialsReady(keyId, settings);
  const email = String(settings.email || "").trim().toLowerCase();
  const wsKeyId =
    email && email !== "anonymous"
      ? getWorkspaceKeyIdForEmail(email)
      : keyId === "primary-key"
        ? "primary-key"
        : "";
  const primary =
    wsKeyId && keyId !== wsKeyId ? getKeySettings(wsKeyId) : undefined;
  const baseline: string[] = [];
  for (const [toolName, category] of Object.entries(TOOL_CATEGORY)) {
    const requires = getToolCredentialRequirement(toolName, category);
    const { enabled, reason } = resolveToolState({
      toolName,
      category,
      requires,
      credentials,
      categoryAllowed: isCategoryAllowedOnServer(category),
      keyEnabled: settings.enabledTools,
      keyDisabled: settings.disabledTools,
      globalEnabled: primary?.enabledTools,
      globalDisabled: primary?.disabledTools,
      acceptGlobalEnables: true,
    });
    if (enabled && (reason === "global-on" || reason === "default-on"))
      baseline.push(toolName);
  }
  return baseline;
}

/**
 * Re-apply the current tool policy to every live session affected by `keyId`.
 * When `keyId === "primary-key"` (global settings), all API keys and OAuth clients
 * inherit from it, so every active session is refreshed.
 */
function refreshSessionsForKey(keyId: string): number {
  let refreshed = 0;
  for (const entry of Array.from(transports.values())) {
    if (keyId !== "primary-key" && entry.keyId !== keyId) continue;
    if (!entry.server) continue;
    try {
      (entry.server as any).applyToolPolicy?.();
      // SDK >=1.3x wraps the real transport in `_webStandardTransport`; the SSE stream
      // bookkeeping lives there, not on the outer Node wrapper. Reading it from the wrapper
      // always reported "no stream", which tore down the session on every toggle.
      const t = ((entry.transport as any)?._webStandardTransport ??
        entry.transport) as any;
      const standaloneId = t?._standaloneSseStreamId;
      const hasLiveSseStream = Boolean(
        standaloneId && t?._streamMapping?.get(standaloneId),
      );
      // Never tear the session down here. tools/list re-evaluates the policy on every call and
      // a disabled tool refuses to run, so a client without an open event stream simply sees
      // the new list the next time it asks. Closing the session made clients such as Gemini
      // show "session terminated" after every toggle.
      if (hasLiveSseStream) {
        Promise.resolve(entry.server.sendToolListChanged()).catch(() => {});
      }
      refreshed += 1;
    } catch (err) {
      console.warn(
        `[mcp] Tool policy refresh failed: ${String((err as any)?.message || err)}`,
      );
    }
  }
  return refreshed;
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

let krixSkillsCatalog: SkillCatalog | null = null;
const krixSkillsReady: Promise<void> = (async () => {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const candidateA = path.resolve(here, "..", "skills");
    const candidateB = path.resolve(process.cwd(), "skills");
    const skillsRoot = fs.existsSync(path.join(candidateA, "SKILL.md"))
      ? candidateA
      : candidateB;
    if (!fs.existsSync(path.join(skillsRoot, "SKILL.md"))) return;

    const krixSkillFiles: SkillFiles = {
      async list(dir: string) {
        const clean = dir.replace(/^\/+|\/+$/g, "");
        if (clean === "") return [{ name: "krix", kind: "directory" }];
        if (clean !== "krix" && !clean.startsWith("krix/")) return [];
        const rel = clean === "krix" ? "" : clean.slice("krix/".length);
        const target = path.resolve(skillsRoot, rel);
        if (target !== skillsRoot && !target.startsWith(skillsRoot + path.sep)) {
          return [];
        }
        const entries = await fs.promises.readdir(target, { withFileTypes: true });
        return entries
          .filter((e) => !e.name.startsWith(".") && (e.isDirectory() || e.isFile()))
          .map((e) => ({
            name: e.name,
            kind: e.isDirectory() ? ("directory" as const) : ("file" as const),
          }));
      },
      async read(filePath: string) {
        const clean = filePath.replace(/^\/+/, "");
        if (!clean.startsWith("krix/")) {
          throw new Error(`Unknown skill path: ${filePath}`);
        }
        const rel = clean.slice("krix/".length);
        const target = path.resolve(skillsRoot, rel);
        if (target !== skillsRoot && !target.startsWith(skillsRoot + path.sep)) {
          throw new Error(`Invalid skill path: ${filePath}`);
        }
        return new Uint8Array(await fs.promises.readFile(target));
      },
    };
    krixSkillsCatalog = await SkillsExtension.load(krixSkillFiles, {
      onWarning: ({ path: warnPath, message }) => {
        console.warn(`[skills] ${warnPath}: ${message}`);
      },
    });
  } catch (err: any) {
    console.warn(`[skills] Failed to load Krix MCP skills: ${err?.message || err}`);
  }
})();

function isModernStatelessRequest(body: unknown): boolean {
  const check = (msg: any): boolean =>
    Boolean(
      msg &&
        typeof msg === "object" &&
        (msg.method === "server/discover" ||
          typeof msg?.params?._meta?.["io.modelcontextprotocol/protocolVersion"] ===
            "string"),
    );
  return Array.isArray(body) ? body.some(check) : check(body);
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
      websiteUrl: "https://github.com/ixmuted/Krix",
      icons: serverInfoIcons,
    },
    {
      capabilities: {
        tools: {
          listChanged: true,
        },
        resources: {
          listChanged: true,
        },
      },
      instructions:
        "Krix MCP gateway for GitHub, Render, Code Graph, and an isolated per-user sandbox. " +
        "Treat your active tool list as truth (disabled or unconfigured tools will not appear). " +
        "Call set_active_context first for GitHub work, prefer surgical edits (str_replace_editor, patch_contents), " +
        "use sandbox_exec/sandbox_run to verify builds/tests, and use sandbox_store(action:share) to share files with the user. " +
        "Always ask for user confirmation before destructive actions (deleting repos, services, branches, files, env vars, or merging PRs).",
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

  const policyKeyId = keySettings?.keyId || "primary-key";
  const policyEmail = String(keySettings?.email || "").trim().toLowerCase();
  const policyWsKeyId =
    policyEmail && policyEmail !== "anonymous"
      ? getWorkspaceKeyIdForEmail(policyEmail)
      : policyKeyId === "primary-key"
        ? "primary-key"
        : "";
  const credentials = {
    github: Boolean(githubToken?.trim()),
    render: Boolean(renderToken?.trim()),
  };

  // Evaluated at session start, on tools/list, and whenever the user changes tool settings.
  const applyToolPolicy = () => {
    // Decisions come from isToolEnabledForKey (defaults, workspace + per-key settings,
    // credentials). Session categories and environment flags are no longer consulted.
    // Suppress per-tool notifications inside the loop; refreshSessionsForKey sends a single
    // batched notifications/tools/list_changed once the full policy pass finishes.
    const origSendToolListChanged = server.sendToolListChanged.bind(server);
    (server as any).sendToolListChanged = async () => {};
    try {
      for (const [name, handle] of Object.entries(registry)) {
        const cat = categoryOf[name];
        const catAllowed = isCategoryAllowedOnServer(cat);
        const missingCredential = getMissingToolCredential(
          name,
          credentials,
          cat,
        );
        const policyEnabled = isToolEnabledForKey(
          policyKeyId,
          name,
          cat,
          undefined,
          credentials,
          catAllowed,
          policyWsKeyId,
        );
        const shouldEnable = catAllowed && !missingCredential && policyEnabled;
        if (shouldEnable) {
          if (!handle.enabled) handle.enable();
          setToolRegistrationEnabled(sessionId, name, true);
        } else {
          if (handle.enabled !== false) handle.disable();
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
    } finally {
      (server as any).sendToolListChanged = origSendToolListChanged;
    }
  };
  applyToolPolicy();
  (server as any).applyToolPolicy = applyToolPolicy;

  if (krixSkillsCatalog) {
    krixSkillsCatalog.attach(server);
  }

  // Ensure every tool returned to MCP clients (like Gemini) includes icons metadata (matching GitHub MCP Server)
  const rawServer = server.server as any;
  const originalListTools = rawServer._requestHandlers?.get("tools/list");
  if (originalListTools) {
    server.server.setRequestHandler("tools/list", async (request, ctx) => {
      applyToolPolicy();
      const result = await originalListTools(request, ctx);
      return {
        ...result,
        tools: (result.tools || []).map((t: any) => ({
          ...t,
          icons: toolIcons,
        })),
      };
    });
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

// Return the 404 page when a human browser directly navigates (GET Accept: text/html)
// to machine-only MCP, OAuth, discovery, or internal JSON API endpoints.
const MACHINE_ONLY_EXACT = new Set([
  "/mcp",
  "/sse",
  "/mcp/server-card",
  "/server-card",
  "/server.json",
  "/gemini-extension.json",
  "/healthz",
  "/oauth/register",
  "/oauth/token",
  "/oauth/revoke",
  "/oauth/authorizations",
  "/api/keys",
  "/tools/execute",
  "/stats/api",
  "/upload/rename",
  "/store/sandbox-file",
]);

const MACHINE_ONLY_PREFIXES = [
  "/.well-known/",
  "/oauth/authorizations/",
  "/api/keys/",
  "/api/account/",
  "/stats/api/",
  "/settings/api/",
  "/store/api/",
  "/store/files/",
  "/store/permanent/",
  "/store/revert-permanent/",
  "/upload/api/",
];

app.use((req: Request, res: Response, next: NextFunction): void => {
  if (req.method !== "GET") {
    next();
    return;
  }
  const accept = String(req.headers.accept || "");
  const isBrowserHtmlNav =
    accept.includes("text/html") &&
    !req.headers.authorization &&
    !req.headers["mcp-session-id"] &&
    !req.headers["x-upload-token"];
  if (!isBrowserHtmlNav) {
    next();
    return;
  }
  const p = req.path;
  const isMachineOnly =
    MACHINE_ONLY_EXACT.has(p) ||
    MACHINE_ONLY_PREFIXES.some((prefix) => p.startsWith(prefix));
  if (!isMachineOnly) {
    next();
    return;
  }
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  res.status(404);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    renderNotFoundPage({
      base,
      isOwner: Boolean(owner),
      owner,
      pathname: req.originalUrl || req.url,
    }),
  );
});

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

/**
 * 403 (not 401): a 401 would make OAuth clients like Gemini restart the whole sign-in flow
 * instead of telling the person the connection was switched off.
 */
function rejectDisabledKey(res: Response): void {
  jsonRpcError(
    res,
    403,
    -32000,
    "This key or connection has been disabled by its owner. Re-enable it in Krix API Keys.",
  );
}

function rejectScheduledDeletion(res: Response): void {
  jsonRpcError(
    res,
    403,
    -32000,
    "This account is scheduled for deletion. Sign back in to Krix to restore your account and re-enable your keys.",
  );
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
      if (isKeyDisabled(keyId)) {
        rejectDisabledKey(res);
        return;
      }
      const tokenEmail =
        payload.email ||
        (typeof payload.sub === "string" && payload.sub.includes("@")
          ? payload.sub
          : undefined);
      let resolvedOAuthEmail = tokenEmail;
      if (!resolvedOAuthEmail && clientId) {
        const matches = listActiveOAuthAuthorizations().filter(
          (oa) => oa.clientId === clientId && oa.ownerEmail,
        );
        if (matches.length === 1) {
          resolvedOAuthEmail = matches[0].ownerEmail;
        }
      }
      const oauthAccountEmail = resolvedOAuthEmail || getKeySettings(keyId)?.email;
      if (oauthAccountEmail && isAccountScheduledForDeletion(oauthAccountEmail)) {
        rejectScheduledDeletion(res);
        return;
      }
      (req as any).clientAuth = {
        keyId,
        label,
        email: resolvedOAuthEmail,
        type: "oauth",
      };
      next();
      return;
    }

    // 2. Check dynamic API keys (registered in-memory / MongoDB)
    const dynEntry = findAuthorizedApiKey(clientKey);
    if (dynEntry) {
      failedAuthLimiter.reset(ip);
      if (isKeyDisabled(dynEntry.id)) {
        rejectDisabledKey(res);
        return;
      }
      if (dynEntry.email && isAccountScheduledForDeletion(dynEntry.email)) {
        rejectScheduledDeletion(res);
        return;
      }
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
      const primaryEmail =
        process.env.OWNER_EMAIL ||
        process.env.GOOGLE_ALLOWED_EMAIL ||
        "owner@localhost";
      if (isAccountScheduledForDeletion(primaryEmail)) {
        rejectScheduledDeletion(res);
        return;
      }
      (req as any).clientAuth = {
        keyId: "primary-key",
        label: "Primary Key",
        email: primaryEmail,
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

/**
 * Rewrites (or removes, when `value` is null) the Mcp-Session-Id header of an incoming request.
 * The SDK's Node adapter rebuilds the request from `rawHeaders`, so changing only
 * `req.headers` has no effect.
 */
function setRequestSessionHeader(req: Request, value: string | null): void {
  const name = "mcp-session-id";
  if (value === null) delete req.headers[name];
  else req.headers[name] = value;
  const raw = req.rawHeaders;
  if (!Array.isArray(raw)) return;
  let found = false;
  for (let i = 0; i < raw.length; i += 2) {
    if (String(raw[i]).toLowerCase() !== name) continue;
    if (value === null) {
      raw.splice(i, 2);
      i -= 2;
    } else {
      raw[i + 1] = value;
      found = true;
    }
  }
  if (value !== null && !found) raw.push("Mcp-Session-Id", value);
}

/** Old session ID a client still sends -> the fresh session that replaced it. */
interface SessionAlias {
  targetId: string;
  keyId: string;
  authKey: string;
  createdAt: number;
}
const sessionAliases = new Map<string, SessionAlias>();
const recoveriesInFlight = new Map<string, Promise<string | null>>();
const MAX_SESSION_ALIASES = 1000;

function rememberSessionAlias(oldId: string, alias: SessionAlias): void {
  // Only short opaque IDs are remembered, so a caller cannot bloat memory with junk.
  if (oldId.length > 128 || !/^[\x21-\x7e]+$/.test(oldId)) return;
  if (sessionAliases.size >= MAX_SESSION_ALIASES) {
    for (const [id, a] of sessionAliases) {
      if (!transports.has(a.targetId)) sessionAliases.delete(id);
    }
    while (sessionAliases.size >= MAX_SESSION_ALIASES) {
      const oldest = sessionAliases.keys().next().value;
      if (oldest === undefined) break;
      sessionAliases.delete(oldest);
    }
  }
  sessionAliases.set(oldId, alias);
}

interface StartSessionOptions {
  req: Request;
  keyId: string;
  keySettings: KeySettings;
  githubToken: string;
  renderToken: string | undefined;
  identity: string;
}

/** Creates a session bound to `identity` (the authenticated caller). Does not handle a request. */
async function startSession(opts: StartSessionOptions) {
  const { req, keyId, keySettings, githubToken, renderToken, identity } = opts;
  const newSessionId = crypto.randomUUID();
  registerSessionAuth(newSessionId, identity);
  registerSessionSandboxId(newSessionId, computeUserAuthKey(identity));
  registerSessionRole(
    newSessionId,
    keyId === "primary-key" || isOwnerEmail(keySettings.email) ? "owner" : "user",
  );

  let masterServer: McpServer | undefined;
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: () => newSessionId,
    onsessioninitialized: (id) => {
      transports.set(id, {
        transport,
        lastActive: Date.now(),
        keyId,
        server: masterServer,
      });
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      destroySandbox(transport.sessionId).catch(() => {});
      transports.delete(transport.sessionId);
    }
  };

  masterServer = createMasterServer(
    githubToken,
    renderToken,
    newSessionId,
    req,
    keySettings,
  );
  await masterServer.connect(transport);
  return { newSessionId, transport, masterServer };
}

/**
 * Starts a fresh session for an already-authenticated caller and runs the MCP handshake
 * on their behalf, so a request that arrived with a dead session ID can still be served.
 * Returns the new session ID, or null if the handshake could not be completed.
 */
async function recoverSession(
  opts: StartSessionOptions,
): Promise<string | null> {
  const started = await startSession(opts);
  try {
    const inner = (started.transport as any)._webStandardTransport;
    if (!inner || typeof inner.handleRequest !== "function") {
      throw new Error("SDK transport internals not available");
    }
    const initMessage = {
      jsonrpc: "2.0",
      id: `krix-resume-${crypto.randomUUID()}`,
      method: "initialize",
      params: {
        protocolVersion: LATEST_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "krix-session-recovery", version: "1.0.0" },
      },
    };
    const response: globalThis.Response = await inner.handleRequest(
      new globalThis.Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(initMessage),
      }),
      { parsedBody: initMessage },
    );
    if (!response.ok) throw new Error(`handshake status ${response.status}`);
    // The reply is an SSE stream that closes once the initialize response is sent.
    await Promise.race([
      response.text(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("handshake timed out")), 5000),
      ),
    ]);
    return started.newSessionId;
  } catch (err: any) {
    console.warn(
      `[mcp] Session recovery failed: ${String(err?.message || err)}`,
    );
    transports.delete(started.newSessionId);
    void Promise.resolve(started.transport.close()).catch(() => {});
    return null;
  }
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
    await Promise.all([
      krixSkillsReady,
      statsTracker.ensureMongo().catch((error) => {
        console.error(
          "[stats] startup restore before MCP request failed:",
          error?.message || error,
        );
      }),
      ensureSettingsFromMongo().catch((error) => {
        console.error(
          "[settings] startup restore before MCP request failed:",
          error?.message || error,
        );
      }),
    ]);
    const startTime = Date.now();
    const clientAuth = (req as any).clientAuth;
    if (!clientAuth || !clientAuth.keyId) {
      jsonRpcError(
        res,
        401,
        -32000,
        "Unauthorized. Connect using OAuth 2.1 or supply a valid API key.",
      );
      return;
    }
    const keyId = clientAuth.keyId;
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
      const isInit = Array.isArray(body)
        ? body.some((m) => isInitializeRequest(m))
        : isInitializeRequest(body);

      // A session is bound to the identity that created it.
      const storedEmail =
        keySettings.email && keySettings.email !== "anonymous"
          ? keySettings.email
          : undefined;
      const sessionEmail =
        clientEmail ||
        storedEmail ||
        (keyId === "primary-key"
          ? getOwnerEmail() || "owner@localhost"
          : undefined);
      const sessionIdentity = canonicalUserIdentity({
        email: sessionEmail,
        keyId,
      });
      const expectedAuthKey = computeAuthKey(sessionIdentity);
      const ownsSession = (id: string, e?: SessionEntry): e is SessionEntry =>
        Boolean(e) &&
        e!.keyId === keyId &&
        getAuthKeyForSession(id) === expectedAuthKey;

      // A client that re-initializes may still send its old session header; ignore it.
      if (isInit && sessionId) setRequestSessionHeader(req, null);

      if (sessionId && !isInit) {
        // 1) The caller's own live session, directly or through a recovery alias.
        let liveId: string | undefined;
        let liveEntry: SessionEntry | undefined;
        const direct = transports.get(sessionId);
        if (ownsSession(sessionId, direct)) {
          liveId = sessionId;
          liveEntry = direct;
        } else {
          const alias = sessionAliases.get(sessionId);
          if (alias) {
            const target = transports.get(alias.targetId);
            if (
              alias.keyId === keyId &&
              alias.authKey === expectedAuthKey &&
              ownsSession(alias.targetId, target)
            ) {
              liveId = alias.targetId;
              liveEntry = target;
            } else {
              sessionAliases.delete(sessionId);
            }
          }
        }

        // 2) Unknown, expired, or someone else's session ID: never touch it. A signed-in
        //    caller gets a fresh session of their own, so a stale chat keeps working
        //    after a server restart, a disconnect, or removing and re-adding the connector.
        if (!liveId || !liveEntry) {
          if (req.method === "DELETE") {
            jsonRpcError(
              res,
              404,
              -32001,
              "Session not found. Re-initialize.",
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
          const recoveryKey = `${keyId}|${expectedAuthKey}|${sessionId}`;
          let pending = recoveriesInFlight.get(recoveryKey);
          if (!pending) {
            pending = recoverSession({
              req,
              keyId,
              keySettings,
              githubToken,
              renderToken,
              identity: sessionIdentity,
            }).finally(() => recoveriesInFlight.delete(recoveryKey));
            recoveriesInFlight.set(recoveryKey, pending);
          }
          const recoveredId = await pending;
          const recoveredEntry = recoveredId
            ? transports.get(recoveredId)
            : undefined;
          if (!recoveredId || !ownsSession(recoveredId, recoveredEntry)) {
            jsonRpcError(
              res,
              404,
              -32001,
              "Session not found. Re-initialize.",
              body?.id ?? null,
            );
            return;
          }
          rememberSessionAlias(sessionId, {
            targetId: recoveredId,
            keyId,
            authKey: expectedAuthKey,
            createdAt: Date.now(),
          });
          liveId = recoveredId;
          liveEntry = recoveredEntry;
        }

        setRequestSessionHeader(req, liveId);
        liveEntry.lastActive = Date.now();
        await liveEntry.transport.handleRequest(req, res, body);
        return;
      }

      if (req.method === "POST" && !isInit && isModernStatelessRequest(body)) {
        const statelessSessionId = `stateless-${crypto.randomUUID()}`;
        registerSessionAuth(statelessSessionId, sessionIdentity);
        registerSessionSandboxId(
          statelessSessionId,
          computeUserAuthKey(sessionIdentity),
        );
        registerSessionRole(
          statelessSessionId,
          keyId === "primary-key" || isOwnerEmail(keySettings.email)
            ? "owner"
            : "user",
        );
        const statelessHandler = createMcpHandler(
          () =>
            createMasterServer(
              githubToken,
              renderToken,
              statelessSessionId,
              req,
              keySettings,
            ),
          { legacy: "reject" },
        );
        const nodeHandler = toNodeHandler(statelessHandler);
        await nodeHandler(req, res, body);
        return;
      }

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

      const started = await startSession({
        req,
        keyId,
        keySettings,
        githubToken,
        renderToken,
        identity: sessionIdentity,
      });
      await started.transport.handleRequest(req, res, body);
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
  "/logo.svg",
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

app.get("/logo.svg", (_req, res) => {
  const buf = loadAsset("logo.svg");
  if (buf) {
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Content-Length", String(buf.length));
    res.setHeader("Content-Disposition", 'inline; filename="logo.svg"');
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader("Timing-Allow-Origin", "*");
    res.send(buf);
  } else {
    res.status(404).send("Logo SVG not found");
  }
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
    name: "io.github.ixmuted/krix",
    description:
      "Remote GitHub discovery, Render management, and sandboxed execution.",
    title: "Krix",
    repository: {
      url: "https://github.com/ixmuted/Krix",
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
      websiteUrl: "https://github.com/ixmuted/Krix",
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
  const authKey = owner
    ? computeUserAuthKey({ email: owner.email })
    : computeAuthKey("anonymous");
  const root = sandboxRootForAuthKey(authKey);
  const uploads = await listUploadedFiles(root);
  const dynamicKeys = owner ? listDynamicKeys(owner.email) : [];
  const isOwner = Boolean(owner && isOwnerEmail(owner.email));

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
  const canManageKeys = Boolean(owner);
  const dynamicKeys = owner ? listDynamicKeys(owner.email) : [];
  const oauthAuthorizations = owner
    ? listActiveOAuthAuthorizations().filter(
        (item: any) =>
          item.ownerEmail?.toLowerCase() === owner.email.toLowerCase(),
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
  let label: string;
  try {
    label = validateDisplayName(req.body?.label, "Key name");
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }
  let createdKeyId = "";
  let entry: ReturnType<typeof createDynamicKey>;
  try {
    // Bind every newly created key to the authenticated Google account.
    // Omitting this email previously caused multi-user accounts to inherit
    // the configured owner identity.
    entry = createDynamicKey(label, owner.email);
  } catch (err: any) {
    // Validation problems (duplicate name, limits) are the user's to fix, not a storage failure.
    res.status(400).json({ error: err?.message || "Invalid key request." });
    return;
  }
  try {
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
    console.error("[keys] create persist failed:", err?.message || err);
    if (err?.code === 11000) {
      res.status(409).json({
        error:
          "That key name is already recorded in storage (possibly from a deleted key). Choose a different name.",
      });
      return;
    }
    const detail = String(err?.message || "").slice(0, 160);
    res.status(503).json({
      error:
        "API key creation could not be persisted. Try again after storage is healthy." +
        (detail ? ` (${detail})` : ""),
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
  let label: string;
  try {
    label = validateDisplayName(req.body?.label, "Key name");
  } catch (err: any) {
    res.status(400).json({ error: err.message });
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
  if (!userOwnsKey(owner.email, id)) {
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
    ensureSettingsFromMongo().catch(() => {}),
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
    (oa) => oa.ownerEmail?.toLowerCase() === owner.email.toLowerCase(),
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
  if (!targetKey && keyId) {
    // A specific key was requested but does not exist (revoked or stale link):
    // never fall back to another key's settings page.
    res.redirect(302, "/api");
    return;
  }
  if (!targetKey) {
    if (isOwnerEmail(owner.email)) {
      targetKey = dynamicKeys[0] || {
        id: "primary-key",
        label: "Primary Key",
        type: "master",
        createdAt: Date.now(),
      };
    } else if (dynamicKeys[0]) {
      targetKey = dynamicKeys[0];
    } else if (activeOAuths[0]) {
      targetKey = {
        id: activeOAuths[0].clientId,
        clientId: activeOAuths[0].clientId,
        label: activeOAuths[0].clientName || "OAuth Client",
        type: "oauth",
        createdAt: activeOAuths[0].createdAt || Date.now(),
      };
    } else {
      res.redirect(302, "/api");
      return;
    }
  }

  const effectiveKeyId = targetKey.id || targetKey.clientId || "primary-key";
  const keySettings = getKeySettings(effectiveKeyId);
  const allowedSettingsKeys = ownedStatsKeyIds(owner.email);
  const summary = statsTracker.getSummary(
    process.cwd(),
    effectiveKeyId,
    isOwnerEmail(owner.email),
    undefined,
    allowedSettingsKeys,
    countActiveSessionsForKeys(allowedSettingsKeys, effectiveKeyId),
  );
  // The key record only holds identity (label, createdAt). Usage lives in the stats tracker,
  // keyed by the same id the auth middleware records (dynamic key id, OAuth client id or
  // "primary-key"), so merge it in or the page shows 0 calls / "No recent activity".
  const keyUsage = summary.keys.find(
    (k) => k.keyId.toLowerCase() === String(effectiveKeyId).toLowerCase(),
  );
  const keyForPage = keyUsage
    ? {
        ...targetKey,
        totalRequests: keyUsage.totalRequests,
        lastActiveAt: keyUsage.lastActiveAt,
        successCount: keyUsage.successCount,
        errorCount: keyUsage.errorCount,
      }
    : targetKey;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const sandboxAllowed = isSandboxAllowedOnServer();
  res.send(
    renderApiKeySettingsPage({
      base,
      isOwner: isOwnerEmail(owner.email),
      owner,
      key: keyForPage,
      toolsCatalog: summary.toolsCatalog,
      keySettings,
      globalKeySettings: (() => {
        const wsId = getWorkspaceKeyIdForEmail(owner.email);
        return wsId ? getKeySettings(wsId) : undefined;
      })(),
      apiKeyToken: getDynamicKeySecret(effectiveKeyId, owner.email) || "",
      sandboxAllowed,
      credentialAvailability: {
        github: Boolean(
          getEffectiveCredential(effectiveKeyId, "github", keySettings),
        ),
        render: Boolean(
          getEffectiveCredential(effectiveKeyId, "render", keySettings),
        ),
        workspaceGithub: Boolean(getWorkspaceCredential("github", owner.email)),
        workspaceRender: Boolean(getWorkspaceCredential("render", owner.email)),
        sandboxEnabled: sandboxAllowed,
      },
      toolStates: buildToolStates(
        effectiveKeyId,
        keyCredentialsReady(effectiveKeyId, keySettings),
      ),
      globalLocked:
        getKeySettings(getWorkspaceKeyIdForEmail(owner.email))
          .lockGlobalEnables === true,
      isWorkspaceKey:
        effectiveKeyId === getWorkspaceKeyIdForEmail(owner.email),
    }),
  );
});

async function validateProviderCredentials(
  githubToken?: string,
  renderToken?: string,
): Promise<{ status: number; code: string; error: string } | null> {
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
      return {
        status: 422,
        code: "INVALID_GITHUB_TOKEN",
        error:
          validation.status === 401
            ? "GitHub rejected this token. Check that it is valid and has not expired."
            : `GitHub credential validation failed (${validation.status}).`,
      };
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
      return {
        status: 422,
        code: "INVALID_RENDER_TOKEN",
        error:
          validation.status === 401 || validation.status === 403
            ? "Render rejected this API key. Check that it is valid and has not been revoked."
            : `Render credential validation failed (${validation.status}).`,
      };
    }
  }
  return null;
}

app.post("/api/keys/:id/settings", express.json(), async (req, res) => {
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
  const { githubToken, renderApiKey, enabledTools, disabledTools, disabled } =
    req.body || {};
  if (id === "primary-key" && disabled === true) {
    res.status(400).json({
      success: false,
      error: "The primary key cannot be disabled.",
    });
    return;
  }
  try {
    const invalidCred = await validateProviderCredentials(
      typeof githubToken === "string" ? githubToken : undefined,
      typeof renderApiKey === "string" ? renderApiKey : undefined,
    );
    if (invalidCred) {
      res.status(invalidCred.status).json({
        success: false,
        code: invalidCred.code,
        error: invalidCred.error,
      });
      return;
    }
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: err?.message || "Failed to verify provider credential.",
    });
    return;
  }
  const settings = getKeySettings(id);

  const effectiveGitHubToken =
    githubToken !== undefined && String(githubToken).trim() !== ""
      ? String(githubToken).trim()
      : settings.customGitHubToken ||
        getWorkspaceCredential("github", owner.email);
  const effectiveRenderToken =
    renderApiKey !== undefined && String(renderApiKey).trim() !== ""
      ? String(renderApiKey).trim()
      : settings.customRenderToken ||
        getWorkspaceCredential("render", owner.email);
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

  if (Array.isArray(enabledTools)) {
    const serverBlocked = findToolBlockedByServer(enabledTools);
    if (serverBlocked) {
      res.status(409).json({
        success: false,
        code: "TOOL_UNAVAILABLE_ON_SERVER",
        tool: serverBlocked.toolName,
        error: serverBlocked.message,
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
  const previouslyEnabled = new Set(settings.enabledTools || []);
  if (Array.isArray(enabledTools)) {
    settings.enabledTools = enabledTools.map(String);
  }
  if (Array.isArray(disabledTools)) {
    settings.disabledTools = disabledTools.map(String);
  }
  if (Array.isArray(enabledTools) || Array.isArray(disabledTools)) {
    settings.riskAcknowledgedTools = reconcileRiskAcknowledgements(
      settings.riskAcknowledgedTools,
      (settings.enabledTools || []).filter((t) => !previouslyEnabled.has(t)),
      settings.disabledTools || [],
    );
  }
  const wasDisabled = settings.disabled === true;
  if (typeof disabled === "boolean") {
    settings.disabled = disabled;
  }
  const justDisabled = settings.disabled === true && !wasDisabled;
  // Clearing a credential keeps the key's tool choices (they show greyed out until it is back).
  settings.updatedAt = Date.now();
  saveSettingsToDisk();
  await syncKeySettingsToMongo(settings);
  // Credential changes need a fresh session; tool-only changes apply live.
  const credentialsChanged =
    githubToken !== undefined || renderApiKey !== undefined;
  // Credential changes and switching a key off both end its live sessions.
  const mustClose = credentialsChanged || justDisabled;
  const closedSessions = mustClose
    ? await pruneAffectedKeysForCredentialRemoval(owner.email, id)
    : 0;
  const refreshedSessions = mustClose ? 0 : refreshSessionsForKey(id);

  res.setHeader("Cache-Control", "no-store");
  res.json({ success: true, settings, closedSessions, refreshedSessions });
});

app.post("/api/account/delete", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const email = owner.email.toLowerCase();
  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Schedule account deletion with an asynchronous 30-day grace period
  const gracePeriodDays = 30;
  const schedule = scheduleAccountDeletion(email, gracePeriodDays);

  // Immediately terminate active MCP sessions for all keys owned by this account
  for (const keyId of ownedStatsKeyIds(email)) {
    refreshSessionsForKey(keyId);
  }

  // Send security email notifying of scheduled deletion with 30-day countdown
  sendAccountDeletedEmail({
    email,
    name: owner.name,
    ip: clientIp,
    userAgent,
    deletionDeadline: schedule.deletionDeadline,
    gracePeriodDays,
  }).catch((err) =>
    console.error("[email] sendAccountDeletedEmail error:", err?.message),
  );

  res.clearCookie("krix_owner");
  res.clearCookie("krix_session", { path: "/" });
  res.json({
    success: true,
    scheduled: true,
    gracePeriodDays,
    deletionDeadline: schedule.deletionDeadline,
    message: `Account scheduled for permanent deletion in ${gracePeriodDays} days. Sign back in before then to restore your account.`,
  });
});

app.post("/api/account/cancel-deletion", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const email = owner.email.toLowerCase();
  const cancelled = cancelAccountDeletion(email);
  res.json({
    success: true,
    cancelled,
    message: cancelled
      ? "Scheduled account deletion was cancelled. Your account remains active."
      : "No scheduled account deletion found.",
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
  // Missing `?key=`, empty `?key=`, or `?key=all` all default to "All keys".
  const allKeysRequested =
    req.query.key === undefined || req.query.key === "" || req.query.key === "all";
  if (
    selectedKeyId &&
    !allKeysRequested &&
    (!owner || !userOwnsKey(owner.email, selectedKeyId))
  ) {
    res.status(403).send("Forbidden");
    return;
  }
  if (!selectedKeyId || allKeysRequested) {
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
  const authKey = computeUserAuthKey({ email: owner.email });
  const root = sandboxRootForAuthKey(authKey);
  const allowedToolKeys = ownedStatsKeyIds(owner.email);
  const targetToolKey = allKeysRequested ? undefined : selectedKeyId;
  const summary = statsTracker.getSummary(
    root,
    targetToolKey,
    isOwner,
    undefined,
    allowedToolKeys,
    countActiveSessionsForKeys(allowedToolKeys, targetToolKey),
  );

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(
    renderToolsPage({
      base,
      isOwner,
      owner,
      tools: summary.toolsCatalog,
      summary,
      selectedKeyId: allKeysRequested ? "" : selectedKeyId,
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
    typeof req.body?.toolName === "string" ? req.body.toolName.trim() : "";
  const rawKeyId =
    typeof req.body?.keyId === "string" ? req.body.keyId.trim() : "";
  const args = req.body?.arguments;
  if (!toolName || !["sandbox_exec", "sandbox_run"].includes(toolName)) {
    res.status(400).json({
      ok: false,
      error:
        "Only sandbox_exec and sandbox_run can be run from the web inspector.",
    });
    return;
  }

  let effectiveKeyId = rawKeyId;
  if (
    !effectiveKeyId ||
    effectiveKeyId === "all" ||
    effectiveKeyId === "no-keys" ||
    !userOwnsKey(owner.email, effectiveKeyId)
  ) {
    if (isOwnerEmail(owner.email)) {
      effectiveKeyId = "primary-key";
    } else {
      const userKeys = listDynamicKeys(owner.email);
      if (userKeys.length > 0) {
        effectiveKeyId = userKeys[0].id;
      } else {
        effectiveKeyId = `user_${owner.email.toLowerCase()}`;
      }
    }
  }

  if (!args || typeof args !== "object" || Array.isArray(args)) {
    res
      .status(400)
      .json({ ok: false, error: "Arguments must be a JSON object." });
    return;
  }

  const sessionId = crypto.randomUUID();
  const baseSettings = getKeySettings(effectiveKeyId);
  const settings: KeySettings = {
    ...baseSettings,
    keyId: effectiveKeyId,
    email: owner.email,
    role: isOwnerEmail(owner.email) ? "owner" : "user",
    enabledTools: Array.from(
      new Set([...(baseSettings.enabledTools || []), toolName]),
    ),
    riskAcknowledgedTools: Array.from(
      new Set([...(baseSettings.riskAcknowledgedTools || []), toolName]),
    ),
  };
  const githubToken = getEffectiveCredential(
    effectiveKeyId,
    "github",
    settings,
  );
  const renderToken =
    getEffectiveCredential(effectiveKeyId, "render", settings) || undefined;

  // A unique authenticated sandbox identity ensures every web execution gets
  // a disposable workspace and cannot read another key's persistent files.
  registerSessionAuth(
    sessionId,
    `krix_web_runner_${owner.email.toLowerCase()}_${sessionId}`,
  );
  try {
    const ctx = getSessionContext(sessionId);
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
  const ownerKeys = owner
    ? resolveUserOwnerKeys(owner.email)
    : Array.from(extractCallerAuthKeys(req));
  const effectiveIsOwner = owner
    ? isOwnerEmail(owner.email)
    : clientKey === MCP_API_KEY;
  const sharedSandbox = await statsTracker.computeSharedSandboxStats(
    ownerKeys,
    effectiveIsOwner,
  );
  const authKey = owner
    ? computeUserAuthKey({ email: owner.email })
    : ownerKeys[0] || computeAuthKey(`key_${apiEntry?.id || "anonymous"}`);
  const root = sandboxRootForAuthKey(authKey);
  const scopedKeyId = owner
    ? selectedKeyId !== undefined
      ? selectedKeyId
      : ""
    : selectedKeyId ||
      apiEntry?.id ||
      (clientKey === MCP_API_KEY ? "primary-key" : undefined);
  if (scopedKeyId === undefined) {
    res
      .status(403)
      .json({ error: "Unable to resolve the API key's usage scope." });
    return;
  }
  const allowedStatsKeys = ownedStatsKeyIds(
    owner?.email,
    apiEntry?.id || (clientKey === MCP_API_KEY ? "primary-key" : undefined),
  );
  const summary = statsTracker.getSummary(
    root,
    scopedKeyId,
    effectiveIsOwner,
    sharedSandbox,
    allowedStatsKeys,
    countActiveSessionsForKeys(allowedStatsKeys, scopedKeyId),
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

  const selectedKeyId =
    typeof req.query.key === "string" ? req.query.key.trim() : undefined;
  const apiEntry = clientKey ? findAuthorizedApiKey(clientKey) : null;
  if (
    selectedKeyId &&
    selectedKeyId !== "all" &&
    (owner
      ? !userOwnsKey(owner.email, selectedKeyId)
      : !apiEntry || apiEntry.id !== selectedKeyId)
  ) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }
  const allowedTimelineKeys = ownedStatsKeyIds(
    owner?.email,
    apiEntry?.id || (clientKey === MCP_API_KEY ? "primary-key" : undefined),
  );
  const chunk = await statsTracker.loadHistoricalChunk(
    month,
    allowedTimelineKeys,
    selectedKeyId,
  );
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
  const scopedKeyId = selectedKeyId !== undefined ? selectedKeyId : "";

  const ownerKeys = resolveUserOwnerKeys(owner.email);
  const sharedSandbox = await statsTracker.computeSharedSandboxStats(
    ownerKeys,
    isOwner,
  );
  const authKey = computeUserAuthKey({ email: owner.email });
  const root = sandboxRootForAuthKey(authKey);
  const allowedStatsKeys = ownedStatsKeyIds(owner.email);
  const summary = statsTracker.getSummary(
    root,
    scopedKeyId,
    isOwner,
    sharedSandbox,
    allowedStatsKeys,
    countActiveSessionsForKeys(allowedStatsKeys, scopedKeyId),
  );

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

function sandboxFileId(ownerKey: string, name: string): string {
  return `sbx_${crypto.createHash("sha256").update(`${ownerKey}:${name}`).digest("hex").slice(0, 16)}`;
}

function countActiveSessionsForKeys(
  allowedKeyIds?: Set<string>,
  selectedKeyId?: string,
): number {
  let count = 0;
  for (const entry of transports.values()) {
    if (allowedKeyIds && !allowedKeyIds.has(entry.keyId)) continue;
    if (
      selectedKeyId &&
      selectedKeyId !== "all" &&
      entry.keyId !== selectedKeyId
    ) {
      continue;
    }
    count++;
  }
  return count;
}

/** Key ids an account may see in stats: only their own present keys and OAuth clients. */
function ownedStatsKeyIds(email?: string, singleKeyId?: string): Set<string> {
  const ids = new Set<string>();
  if (singleKeyId) ids.add(singleKeyId);
  if (!email) return ids;
  if (isOwnerEmail(email)) ids.add("primary-key");
  for (const k of listDynamicKeys(email)) ids.add(k.id);
  for (const oa of listActiveOAuthAuthorizations()) {
    if (oa.ownerEmail?.toLowerCase() === email.toLowerCase())
      ids.add(oa.clientId);
  }
  return ids;
}

// Dedicated Settings Page & Management Endpoints
function userOwnsKey(email: string, keyId: string): boolean {
  if (keyId === "primary-key") return isOwnerEmail(email);
  if (keyId === getWorkspaceKeyIdForEmail(email)) return true;
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
    ensureSettingsFromMongo().catch(() => {}),
  ]);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);
  const isOwner = Boolean(owner && isOwnerEmail(owner.email));
  const sandboxAllowed = isSandboxAllowedOnServer();

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
        sandboxAllowed,
        credentialAvailability: {
          github: false,
          render: false,
          workspaceGithub: false,
          workspaceRender: false,
          sandboxEnabled: sandboxAllowed,
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
    const userWsKeyId = getWorkspaceKeyIdForEmail(owner.email);
    keys.push({
      id: userWsKeyId,
      label: "Workspace Default (Global)",
      prefix: "GLOBAL",
      role: "user",
      email: owner.email,
    });
    const userKeys = listDynamicKeys(owner.email);
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
  const authKey = computeUserAuthKey({ email: owner.email });
  const root = sandboxRootForAuthKey(authKey);
  const allowedSettingsKeys = ownedStatsKeyIds(owner.email);
  const summary = statsTracker.getSummary(
    root,
    selectedKeyId,
    isOwner,
    undefined,
    allowedSettingsKeys,
    countActiveSessionsForKeys(allowedSettingsKeys, selectedKeyId),
  );

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
      sandboxAllowed,
      credentialAvailability: {
        github: Boolean(
          getEffectiveCredential(selectedKeyId, "github", keySettings),
        ),
        render: Boolean(
          getEffectiveCredential(selectedKeyId, "render", keySettings),
        ),
        workspaceGithub: Boolean(getWorkspaceCredential("github", owner.email)),
        workspaceRender: Boolean(getWorkspaceCredential("render", owner.email)),
        sandboxEnabled: sandboxAllowed,
      },
      toolsCatalog: summary.toolsCatalog,
      toolStates: buildToolStates(
        selectedKeyId,
        keyCredentialsReady(selectedKeyId, keySettings),
      ),
      globalLocked:
        getKeySettings(getWorkspaceKeyIdForEmail(owner.email))
          .lockGlobalEnables === true,
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
    const invalidCred = await validateProviderCredentials(
      typeof githubToken === "string" ? githubToken : undefined,
      typeof renderToken === "string" ? renderToken : undefined,
    );
    if (invalidCred) {
      res.status(invalidCred.status).json({
        ok: false,
        code: invalidCred.code,
        error: invalidCred.error,
      });
      return;
    }
    const updated = updateKeyCredentials(
      keyId,
      owner.email,
      typeof githubToken === "string" ? githubToken : undefined,
      typeof renderToken === "string" ? renderToken : undefined,
    );
    const clearedAny =
      (typeof githubToken === "string" && !githubToken.trim()) ||
      (typeof renderToken === "string" && !renderToken.trim());
    let closedSessions = 0;
    if (clearedAny) {
      closedSessions = await pruneAffectedKeysForCredentialRemoval(
        owner.email,
        keyId,
      );
    } else {
      await syncKeySettingsToMongo(updated);
      closedSessions = closeSessionsForKey(keyId);
    }
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
      const closedSessions = await pruneAffectedKeysForCredentialRemoval(
        owner.email,
        keyId,
      );
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
        error: credentialRequiredMessage(
          missingCredential,
          toolName,
          keyId === getWorkspaceKeyIdForEmail(owner.email) ? "global" : "key",
        ),
      });
      return;
    }
    // Refuse tools the deployment forbids (e.g. sandbox on a Render host): saving them as "on"
    // used to report success and then show as off after a refresh.
    const serverBlocked = enabled ? findToolBlockedByServer([toolName]) : null;
    if (serverBlocked) {
      res.status(409).json({
        ok: false,
        code: "TOOL_UNAVAILABLE_ON_SERVER",
        tool: serverBlocked.toolName,
        error: serverBlocked.message,
      });
      return;
    }
    const updated = toggleKeyTool(keyId, toolName, Boolean(enabled));
    await syncKeySettingsToMongo(updated);
    const refreshedSessions = refreshSessionsForKey(keyId);
    res.json({
      ok: true,
      credentialRequirement,
      refreshedSessions,
      enabledTools: updated.enabledTools,
      disabledTools: updated.disabledTools,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ ok: false, error: err?.message || "Failed to toggle tool." });
  }
});

/**
 * Keys owned by this account get their owner email recorded on first touch. Keys that never
 * connected still say "anonymous", which would make them look unrelated to the workspace when
 * their inherited tools are worked out.
 */
function claimOwnedKeySettings(email: string, keyId: string): void {
  const k = getKeySettings(keyId);
  const current = String(k.email || "").trim().toLowerCase();
  if (!current || current === "anonymous") k.email = email;
}

app.post("/settings/api/global-lock", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Unauthorized. Please sign in." });
    return;
  }
  const { locked } = req.body || {};
  if (typeof locked !== "boolean") {
    res.status(400).json({ ok: false, error: "Invalid parameters." });
    return;
  }
  try {
    const wsKeyId = getWorkspaceKeyIdForEmail(owner.email);
    const followers = Array.from(ownedStatsKeyIds(owner.email));
    for (const id of followers) if (id !== wsKeyId) claimOwnedKeySettings(owner.email, id);
    const { workspace, changedKeyIds } = setWorkspaceGlobalLock(
      wsKeyId,
      locked,
      followers,
      computeInheritedBaseline,
    );
    await syncKeySettingsToMongo(workspace);
    // Turning the lock on changes nothing a key can do today (each key keeps what it has),
    // but sessions are refreshed anyway so they re-read the policy.
    let refreshedSessions = refreshSessionsForKey(wsKeyId);
    for (const id of changedKeyIds) refreshedSessions += refreshSessionsForKey(id);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ok: true,
      locked: workspace.lockGlobalEnables === true,
      updatedKeys: changedKeyIds.length,
      refreshedSessions,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || "Failed to update the global tool lock.",
    });
  }
});

app.post("/settings/api/key-global-mode", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Unauthorized. Please sign in." });
    return;
  }
  const { keyId, mode } = req.body || {};
  if (
    !keyId ||
    typeof keyId !== "string" ||
    !["follow", "accept", "block"].includes(mode)
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
  const wsKeyId = getWorkspaceKeyIdForEmail(owner.email);
  if (keyId === wsKeyId) {
    res.status(400).json({
      ok: false,
      error:
        "This is the workspace key itself. Use the global tool lock in Settings instead.",
    });
    return;
  }
  try {
    claimOwnedKeySettings(owner.email, keyId);
    const updated = setKeyGlobalEnableMode(
      keyId,
      mode as GlobalEnableMode,
      wsKeyId,
      () => computeInheritedBaseline(keyId),
    );
    await syncKeySettingsToMongo(updated);
    const refreshedSessions = refreshSessionsForKey(keyId);
    const accepts = resolveAcceptGlobalEnables(
      updated,
      getKeySettings(wsKeyId),
    );
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, mode, accepts, refreshedSessions });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || "Failed to update this key.",
    });
  }
});

app.post("/settings/api/tools/reset", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ ok: false, error: "Unauthorized. Please sign in." });
    return;
  }
  const { keyId } = req.body || {};
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
    const updated = resetKeyToolOverrides(keyId);
    await syncKeySettingsToMongo(updated);
    const refreshedSessions = refreshSessionsForKey(keyId);
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, refreshedSessions });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || "Failed to reset tool permissions.",
    });
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
    const refreshedSessions = refreshSessionsForKey(keyId);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ok: true,
      refreshedSessions,
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
          keyId === getWorkspaceKeyIdForEmail(owner.email) ? "global" : "key",
        ),
      });
      return;
    }
    const serverBlocked = findToolBlockedByServer(enabledTools);
    if (serverBlocked) {
      res.status(409).json({
        ok: false,
        code: "TOOL_UNAVAILABLE_ON_SERVER",
        tool: serverBlocked.toolName,
        error: serverBlocked.message,
      });
      return;
    }
    const updated = updateKeyTools(
      keyId,
      Array.isArray(enabledTools) ? enabledTools : [],
      Array.isArray(disabledTools) ? disabledTools : [],
    );
    await syncKeySettingsToMongo(updated);
    const refreshedSessions = refreshSessionsForKey(keyId);
    res.json({
      ok: true,
      refreshedSessions,
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
  const userKeys = listDynamicKeys(owner.email);
  const defaultKeyId = isOwner ? "primary-key" : userKeys[0]?.id || "no-keys";
  const keyId =
    typeof req.query.key === "string" && req.query.key.trim()
      ? req.query.key.trim()
      : defaultKeyId;

  if (keyId !== "no-keys" && !userOwnsKey(owner.email, keyId)) {
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
function resolveUserOwnerKeys(email: string): string[] {
  const normEmail = email.trim().toLowerCase();
  const keys = new Set<string>();
  keys.add(computeUserAuthKey({ email: normEmail }));
  keys.add(computeAuthKey(canonicalUserIdentity({ email: normEmail })));
  for (const k of listDynamicKeys(normEmail)) {
    keys.add(computeUserAuthKey({ keyId: k.id }));
    keys.add(computeAuthKey(canonicalUserIdentity({ keyId: k.id })));
  }
  for (const oa of listActiveOAuthAuthorizations()) {
    if (oa.ownerEmail?.toLowerCase() === normEmail) {
      keys.add(computeUserAuthKey({ keyId: oa.clientId }));
      keys.add(computeAuthKey(canonicalUserIdentity({ keyId: oa.clientId })));
    }
  }
  return Array.from(keys);
}

function extractCallerAuthKeys(req: Request): Set<string> {
  const keys = new Set<string>();
  const owner = parseOwnerCookie(req);
  if (owner && owner.email) {
    for (const k of resolveUserOwnerKeys(owner.email)) keys.add(k);
    return keys;
  }
  const clientKey = extractClientKey(req);
  if (clientKey) {
    const dyn = findAuthorizedApiKey(clientKey);
    if (dyn?.email) {
      for (const k of resolveUserOwnerKeys(dyn.email)) keys.add(k);
      return keys;
    }
    if (dyn?.id) {
      keys.add(computeUserAuthKey({ keyId: dyn.id }));
      keys.add(computeAuthKey(canonicalUserIdentity({ keyId: dyn.id })));
      return keys;
    }
    if (MCP_API_KEY && safeEqual(clientKey, MCP_API_KEY)) {
      const ownerEmail = getOwnerEmail() || "owner@localhost";
      for (const k of resolveUserOwnerKeys(ownerEmail)) keys.add(k);
      return keys;
    }
  }
  return keys;
}

async function collectUserStoreFiles(
  email: string,
  base: string,
): Promise<StoredFileInfo[]> {
  const ownerKeys = resolveUserOwnerKeys(email);
  const ownerKeySet = new Set(ownerKeys);
  const primaryAuthKey = computeUserAuthKey({ email });
  const fileStore = getFileStore();

  const storeLists = await Promise.all(
    ownerKeys.map((k) =>
      fileStore
        .listByOwner(k, { limit: 100, status: "all" })
        .catch(() => ({ files: [], totalCount: 0 })),
    ),
  );

  const files: StoredFileInfo[] = [];
  const seenStoreIds = new Set<string>();
  for (const resItem of storeLists) {
    for (const f of resItem.files) {
      if (seenStoreIds.has(f.id)) continue;
      seenStoreIds.add(f.id);
      const effectiveOwnerKey = f.ownerKey || primaryAuthKey;
      const share = fileShareRegistry.ensureFileShare({
        fileId: f.id,
        name: f.name,
        source: "store",
        contentType: f.contentType,
        ownerKey: effectiveOwnerKey,
        isPublic: f.isPublic,
      });
      files.push({
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
      });
    }
  }

  const seenSbxPaths = new Set<string>();
  const seenStoreNames = new Set(files.map((f) => f.name));
  for (const k of ownerKeys) {
    const root = sandboxRootForAuthKey(k);
    const uploadDir = path.join(root, UPLOAD_DIR);
    if (!fs.existsSync(uploadDir)) continue;
    try {
      const entries = fs.readdirSync(uploadDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const filePath = path.join(uploadDir, entry.name);
        if (seenSbxPaths.has(filePath)) continue;
        seenSbxPaths.add(filePath);
        if (seenStoreNames.has(entry.name)) continue;
        const stat = fs.statSync(filePath);
        const sbxId = sandboxFileId(k, entry.name);
        if (seenStoreIds.has(sbxId)) continue;
        seenStoreIds.add(sbxId);
        const share = fileShareRegistry.ensureFileShare({
          fileId: sbxId,
          name: entry.name,
          source: "sandbox",
          sandboxPath: filePath,
          ownerKey: k,
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
    } catch {}
  }

  // Only files owned by the authenticated user are listed in their Stored Files.

  files.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );
  return files;
}

app.get("/store", async (req, res) => {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  const owner = parseOwnerCookie(req);

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
  await loadOAuthFromMongo().catch(() => {});
  const dbStore = getMongoDb();
  if (dbStore) await fileShareRegistry.setMongoDb(dbStore);

  try {
    const files = await collectUserStoreFiles(owner.email, base);
    const ownedFiles = files.filter((f) => f.isOwned !== false);
    const usage = {
      count: ownedFiles.length,
      bytes: ownedFiles.reduce((acc, f) => acc + (Number(f.size) || 0), 0),
      permanentCount: ownedFiles.filter((f) => !!f.permanent).length,
      expiredCount: ownedFiles.filter((f) => !f.permanent).length,
    };

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
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
  await loadOAuthFromMongo().catch(() => {});
  const dbFiles = getMongoDb();
  if (dbFiles) await fileShareRegistry.setMongoDb(dbFiles);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);

  const files = await collectUserStoreFiles(owner.email, base);
  const ownedFiles = files.filter((f) => f.isOwned !== false);
  const usage = {
    count: ownedFiles.length,
    bytes: ownedFiles.reduce((acc, f) => acc + (Number(f.size) || 0), 0),
    permanentCount: ownedFiles.filter((f) => !!f.permanent).length,
    expiredCount: ownedFiles.filter((f) => !f.permanent).length,
  };

  res.setHeader("Cache-Control", "no-store");
  res.json({ files, usage });
});

app.post("/store/files/:id/privacy", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  await ensureMongoAuth().catch(() => {});
  const dbPrivacy = getMongoDb();
  if (dbPrivacy) await fileShareRegistry.setMongoDb(dbPrivacy);

  const id = req.params.id;
  const ownerKeys = resolveUserOwnerKeys(owner.email);
  const ownerKeySet = new Set(ownerKeys);
  const primaryAuthKey = computeUserAuthKey({ email: owner.email });
  const share = fileShareRegistry.getById(id);

  if (share && share.ownerKey && !ownerKeySet.has(share.ownerKey)) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }

  let matchedOwnerKey = share?.ownerKey || primaryAuthKey;
  if (id.startsWith("sbx_")) {
    const fileName = share
      ? share.name
      : Buffer.from(id.slice(4), "hex").toString("utf-8");
    const existsInUserSandbox = ownerKeys.some((k) =>
      fs.existsSync(path.join(sandboxRootForAuthKey(k), UPLOAD_DIR, fileName)),
    );
    if (!share && !existsInUserSandbox) {
      res.status(404).json({ error: "File not found." });
      return;
    }
  } else {
    let foundFile = null;
    for (const k of ownerKeys) {
      foundFile = await getFileStore().openById(k, id);
      if (foundFile) {
        matchedOwnerKey = k;
        break;
      }
    }
    if (!foundFile) {
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
    matchedOwnerKey,
  );
  await fileShareRegistry.flushToMongo();
  res.json({ success: true, id, isPublic });
});

app.get(["/store/share/:token", "/store/download/:token"], async (req, res) => {
  const token =
    (Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token) || "";
  const share =
    fileShareRegistry.getByToken(token) || fileShareRegistry.getById(token);

  const callerAuthKeys = extractCallerAuthKeys(req);

  if (share) {
    if (!share.isPublic) {
      if (callerAuthKeys.size === 0) {
        res
          .status(401)
          .type("text/plain")
          .send(
            "Access denied. This file is private and requires authentication.",
          );
        return;
      }
      if (share.ownerKey && !callerAuthKeys.has(share.ownerKey)) {
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
        let file = null;
        if (share.isPublic) {
          file = await getFileStore().openById("*", share.fileId);
        } else {
          for (const k of callerAuthKeys) {
            file = await getFileStore().openById(k, share.fileId);
            if (file) break;
          }
          // Private files without a matching ownerKey must not be served via wildcard lookup.
        }
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
      if (callerAuthKeys.size === 0) {
        res
          .status(401)
          .type("text/plain")
          .send(
            "Access denied. This file is private and requires authentication.",
          );
        return;
      }
      if (file.ownerKey && !callerAuthKeys.has(file.ownerKey)) {
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
  const callerAuthKeys = extractCallerAuthKeys(req);
  if (callerAuthKeys.size === 0) {
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

  let matchedRoot: string | null = null;
  let matchedPath: string | null = null;
  for (const k of callerAuthKeys) {
    const root = sandboxRootForAuthKey(k);
    const candidate = path.join(root, UPLOAD_DIR, filename);
    if (fs.existsSync(candidate)) {
      matchedRoot = root;
      matchedPath = candidate;
      break;
    }
  }
  if (!matchedRoot || !matchedPath) {
    res.status(404).type("text/plain").send("File not found.");
    return;
  }
  try {
    await assertInsideRealRoot(matchedRoot, matchedPath);
  } catch {
    res.status(400).type("text/plain").send("Invalid path.");
    return;
  }
  res.download(matchedPath, filename);
});

app.post("/store/permanent/:id", async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const id = req.params.id;
  const ownerKeys = resolveUserOwnerKeys(owner.email);
  let ok = false;
  for (const k of ownerKeys) {
    if (await getFileStore().makePermanent(k, id)) {
      ok = true;
      break;
    }
  }
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
  const ownerKeys = resolveUserOwnerKeys(owner.email);
  let ok = false;
  for (const k of ownerKeys) {
    if (await getFileStore().revertPermanent(k, id)) {
      ok = true;
      break;
    }
  }
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
  const ownerKeys = resolveUserOwnerKeys(owner.email);
  const ownerKeySet = new Set(ownerKeys);
  const share = fileShareRegistry.getById(id);
  if (share && share.ownerKey && !ownerKeySet.has(share.ownerKey)) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }
  let targetName: string | undefined = share?.name;
  if (!targetName) {
    for (const k of ownerKeys) {
      const f = await getFileStore().openById(k, id);
      if (f) {
        targetName = f.name;
        break;
      }
    }
  }
  let ok = false;
  for (const k of ownerKeys) {
    if (await getFileStore().deleteOwned(k, id)) {
      ok = true;
      break;
    }
  }
  if (ok) {
    fileShareRegistry.removeFile(id);
    if (targetName) {
      for (const k of ownerKeys) {
        const diskPath = path.join(sandboxRootForAuthKey(k), UPLOAD_DIR, targetName);
        if (fs.existsSync(diskPath)) {
          try {
            fs.unlinkSync(diskPath);
          } catch {}
        }
        fileShareRegistry.removeFile(sandboxFileId(k, targetName));
      }
    }
    await fileShareRegistry.flushToMongo();
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
  const ownerKeys = resolveUserOwnerKeys(owner.email);
  const ownerKeySet = new Set(ownerKeys);
  const share = fileShareRegistry.getById(id);
  if (share && share.ownerKey && !ownerKeySet.has(share.ownerKey)) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }
  let prevName: string | undefined = share?.name;
  if (!prevName) {
    for (const k of ownerKeys) {
      const f = await getFileStore().openById(k, id);
      if (f) {
        prevName = f.name;
        break;
      }
    }
  }
  let ok = false;
  for (const k of ownerKeys) {
    if (await getFileStore().rename(k, id, name)) {
      ok = true;
      break;
    }
  }
  if (ok) {
    fileShareRegistry.renameFile(id, name);
    if (prevName && prevName !== name) {
      for (const k of ownerKeys) {
        const root = sandboxRootForAuthKey(k);
        const oldDisk = path.join(root, UPLOAD_DIR, prevName);
        const newDisk = path.join(root, UPLOAD_DIR, name);
        if (fs.existsSync(oldDisk)) {
          try {
            fs.renameSync(oldDisk, newDisk);
          } catch {}
        }
        fileShareRegistry.renameFile(sandboxFileId(k, prevName), name);
      }
    }
    await fileShareRegistry.flushToMongo();
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
  const ownerKeys = resolveUserOwnerKeys(owner.email);
  const ownerKeySet = new Set(ownerKeys);
  let matchedKey: string | null = null;
  let matchedRoot: string | null = null;
  let matchedPath: string | null = null;
  for (const k of ownerKeys) {
    const root = sandboxRootForAuthKey(k);
    const candidate = path.join(root, UPLOAD_DIR, name);
    if (fs.existsSync(candidate)) {
      matchedKey = k;
      matchedRoot = root;
      matchedPath = candidate;
      break;
    }
  }
  if (!matchedKey || !matchedRoot || !matchedPath) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  const sbxId = sandboxFileId(matchedKey, name);
  const share = fileShareRegistry.getById(sbxId);
  if (share && share.ownerKey && !ownerKeySet.has(share.ownerKey)) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }
  try {
    await assertInsideRealRoot(matchedRoot, matchedPath);
  } catch {
    res.status(400).json({ error: "Invalid filename." });
    return;
  }
  fs.unlinkSync(matchedPath);
  fileShareRegistry.removeFile(sbxId);
  await fileShareRegistry.flushToMongo();
  res.json({ success: true, deleted: name });
});

app.post("/upload/rename", express.json(), async (req, res) => {
  const owner = parseOwnerCookie(req);
  if (!owner) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const rawOldName =
    typeof req.body?.oldName === "string" ? req.body.oldName.trim() : "";
  const newName =
    typeof req.body?.newName === "string" ? req.body.newName.trim() : "";
  const shareById = rawOldName.startsWith("sbx_")
    ? fileShareRegistry.getById(rawOldName)
    : undefined;
  const oldName = shareById ? shareById.name : rawOldName;
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
  const ownerKeys = resolveUserOwnerKeys(owner.email);
  const ownerKeySet = new Set(ownerKeys);
  let matchedKey: string | null = null;
  let matchedRoot: string | null = null;
  let matchedOldPath: string | null = null;
  for (const k of ownerKeys) {
    const root = sandboxRootForAuthKey(k);
    const candidate = path.join(root, UPLOAD_DIR, oldName);
    if (fs.existsSync(candidate)) {
      matchedKey = k;
      matchedRoot = root;
      matchedOldPath = candidate;
      break;
    }
  }
  const oldSbxId = matchedKey ? sandboxFileId(matchedKey, oldName) : "";
  const share = shareById || (oldSbxId ? fileShareRegistry.getById(oldSbxId) : undefined);
  if (share && share.ownerKey && !ownerKeySet.has(share.ownerKey)) {
    res.status(403).json({ error: "Forbidden: You do not own this file." });
    return;
  }
  if (!matchedRoot || !matchedOldPath) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  const newPath = path.join(matchedRoot, UPLOAD_DIR, newName);
  try {
    await assertInsideRealRoot(matchedRoot, matchedOldPath);
    await assertInsideRealRoot(matchedRoot, newPath);
  } catch {
    res.status(400).json({ error: "Invalid filename." });
    return;
  }
  try {
    fs.renameSync(matchedOldPath, newPath);
    if (share) {
      fileShareRegistry.renameFile(share.fileId, newName);
      await fileShareRegistry.flushToMongo();
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
    cleanupStaleWorkDirs(30 * 60 * 1000).catch(() => {});
  },
  3 * 60 * 1000,
);
if (process.env.NODE_ENV === "test") {
  cleanupTimer.unref();
}

// 404 Catch-All Handler: returns modern branded 404 page for browsers, JSON for APIs
app.use((req: Request, res: Response): void => {
  res.status(404);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "") || baseUrl(req);
  if (req.accepts("html")) {
    const owner = parseOwnerCookie(req);
    const isOwner = Boolean(owner && isOwnerEmail(owner.email));
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
  try {
    await startServer();
  } catch (err: any) {
    console.error(
      "[startup] refusing to serve with unsafe or unavailable production dependencies:",
      sanitizeOutput(String(err?.message || err)).slice(0, 500),
    );
    process.exit(1);
  }
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
