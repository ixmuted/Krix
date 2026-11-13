import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { type Db } from "mongodb";
import { getMongoDb, ensureMongoAuth } from "./googleAuth.js";
import { registerSecret } from "./security.js";

export type UserRole = "owner" | "user";

export interface UserAccount {
  email: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export interface UserQuotaConfig {
  role: UserRole;
  storageMb: number;
  maxFileMb: number;
  maxTotalMb: number;
  downloadMaxMb: number;
  maxOutputBytes: number;
  ulimitProc: number;
  ulimitFile: number;
  rateLimitPerMin: number;
}

export type ToolRiskLevel = "safe" | "low" | "moderate" | "high" | "critical";

export interface KeySettings {
  keyId: string;
  email: string;
  role: UserRole;
  customGitHubToken?: string;
  customRenderToken?: string;
  sandboxId: string;
  enabledTools?: string[];
  disabledTools?: string[];
  enabledCategories?: string[];
  toolRiskLevels?: Record<string, ToolRiskLevel>;
  riskAcknowledgedTools?: string[];
  disabled?: boolean;
  createdAt: number;
  updatedAt: number;
}

// In-memory registry for zero-latency MCP request execution
const keySettingsMap = new Map<string, KeySettings>();
const userAccountsMap = new Map<string, UserAccount>();

const SETTINGS_FILE = path.resolve(
  process.cwd(),
  "data",
  ".krix_user_settings.json",
);

export const OWNER_STORAGE_MB = Number(process.env.SANDBOX_MAX_TOTAL_MB) || 300;
export const USER_STORAGE_MB = 50; // 50MB distributed storage limit for non-owners

function settingsCipherKey(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET || "";
  if (Buffer.byteLength(secret) < 32) {
    throw new Error(
      "KEY_ENCRYPTION_SECRET must contain at least 32 bytes to store credentials securely.",
    );
  }
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

function encryptStoredSecret(secret?: string): string | undefined {
  if (!secret) return undefined;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", settingsCipherKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptStoredSecret(envelope?: string): string | undefined {
  if (!envelope || !envelope.startsWith("v1.")) return undefined;
  try {
    const [, iv, tag, payload] = envelope.split(".");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      settingsCipherKey(),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(payload, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return undefined;
  }
}

/**
 * Distribute quotas: Owner receives standard/full limits;
 * all other users receive 50MB storage and 1/10th of compute/RAM/process limits.
 */
export function getUserQuota(role: UserRole): UserQuotaConfig {
  if (role === "owner") {
    return {
      role: "owner",
      storageMb: OWNER_STORAGE_MB,
      maxFileMb: 25,
      maxTotalMb: 100,
      downloadMaxMb: 50,
      maxOutputBytes: 4 * 1024 * 1024, // 4MB
      ulimitProc: 2048,
      ulimitFile: 1048576,
      rateLimitPerMin: 600,
    };
  }

  return {
    role: "user",
    storageMb: USER_STORAGE_MB,
    maxFileMb: 2.5, // 1/10th of 25MB
    maxTotalMb: 10, // 1/10th of 100MB
    downloadMaxMb: 5, // 1/10th of 50MB
    maxOutputBytes: 400 * 1024, // 1/10th of 4MB (400KB)
    ulimitProc: 204, // 1/10th of 2048
    ulimitFile: 104857, // 1/10th of 1048576
    rateLimitPerMin: 60, // 1/10th of 600
  };
}

export function getOwnerEmail(): string {
  return (process.env.OWNER_EMAIL || process.env.GOOGLE_ALLOWED_EMAIL || "")
    .trim()
    .toLowerCase();
}

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const owner = getOwnerEmail();
  return owner !== "" && email.trim().toLowerCase() === owner;
}

export function getUserRole(email?: string | null): UserRole {
  return isOwnerEmail(email) ? "owner" : "user";
}

/**
 * Mask secret tokens for safe presentation in the UI.
 * e.g., "ghp_1234567890abcdef" -> "ghp_••••••••cdef"
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return "";
  const s = secret.trim();
  if (s.length <= 8) return "••••••••";
  const prefix = s.slice(0, 4);
  const suffix = s.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Generate a unique, isolated sandbox ID per user or key.
 * The owner receives their default master sandbox ("owner").
 */
export function generateSandboxId(keyId: string, isOwner: boolean): string {
  // The primary owner key keeps its stable legacy ID. Every other key,
  // including keys owned by the server owner, receives a separate sandbox.
  if (keyId === "primary-key") return "owner";
  const cleanKey = keyId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${isOwner ? "owner" : "sbx"}_${cleanKey}`;
}

export function getOrCreateUser(email: string): UserAccount {
  const normEmail = email.trim().toLowerCase();
  let user = userAccountsMap.get(normEmail);
  const role = getUserRole(normEmail);
  const now = Date.now();

  if (!user) {
    user = {
      email: normEmail,
      role,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };
    userAccountsMap.set(normEmail, user);
    saveSettingsToDisk();
    syncUserToMongo(user).catch(() => {});
  } else {
    user.role = role;
    user.lastLoginAt = now;
    user.updatedAt = now;
  }

  return user;
}

export function getKeySettings(keyId: string): KeySettings {
  let settings = keySettingsMap.get(keyId);
  if (!settings) {
    const isOwnerKey = keyId === "primary-key";
    const ownerEmail = getOwnerEmail() || "owner@localhost";
    const sandboxId = generateSandboxId(keyId, isOwnerKey);

    settings = {
      keyId,
      email: isOwnerKey ? ownerEmail : "anonymous",
      role: isOwnerKey ? "owner" : "user",
      sandboxId,
      enabledTools: [],
      disabledTools: [],
      enabledCategories: isOwnerKey
        ? [
            "core",
            "github_issues_prs",
            "github_admin",
            "sandbox",
            "files",
          ]
        : ["core", "sandbox", "files"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    keySettingsMap.set(keyId, settings);
  }
  return settings;
}

export function updateKeyCredentials(
  keyId: string,
  email: string,
  customGitHubToken?: string,
  customRenderToken?: string,
): KeySettings {
  const settings = getKeySettings(keyId);
  const isOwner = isOwnerEmail(email);

  settings.email = email;
  settings.role = isOwner ? "owner" : "user";
  settings.updatedAt = Date.now();

  if (customGitHubToken !== undefined) {
    const token = customGitHubToken.trim();
    if (
      token &&
      Buffer.byteLength(process.env.KEY_ENCRYPTION_SECRET || "") < 32
    )
      throw new Error(
        "Configure KEY_ENCRYPTION_SECRET (32+ bytes) before saving credentials.",
      );
    if (token) {
      settings.customGitHubToken = token;
      registerSecret(token);
    }
  }

  if (customRenderToken !== undefined) {
    const token = customRenderToken.trim();
    if (
      token &&
      Buffer.byteLength(process.env.KEY_ENCRYPTION_SECRET || "") < 32
    )
      throw new Error(
        "Configure KEY_ENCRYPTION_SECRET (32+ bytes) before saving credentials.",
      );
    if (token) {
      settings.customRenderToken = token;
      registerSecret(token);
    }
  }

  saveSettingsToDisk();
  syncKeySettingsToMongo(settings).catch(() => {});
  return settings;
}

export function removeKeyCredential(
  keyId: string,
  provider: "github" | "render",
): KeySettings {
  const settings = getKeySettings(keyId);
  if (provider === "github") delete settings.customGitHubToken;
  else delete settings.customRenderToken;
  settings.updatedAt = Date.now();
  saveSettingsToDisk();
  syncKeySettingsToMongo(settings).catch(() => {});
  return settings;
}

export function removeKeySettings(keyId: string): boolean {
  const deleted = keySettingsMap.delete(keyId);
  if (deleted) {
    saveSettingsToDisk();
  }
  return deleted;
}

export function updateKeyTools(
  keyId: string,
  enabledTools: string[],
  disabledTools: string[],
): KeySettings {
  const settings = getKeySettings(keyId);
  settings.enabledTools = Array.from(new Set(enabledTools));
  settings.disabledTools = Array.from(new Set(disabledTools));
  settings.updatedAt = Date.now();

  saveSettingsToDisk();
  syncKeySettingsToMongo(settings).catch(() => {});
  return settings;
}

export function toggleKeyTool(
  keyId: string,
  toolName: string,
  enable: boolean,
): KeySettings {
  const settings = getKeySettings(keyId);
  const enabledSet = new Set(settings.enabledTools || []);
  const disabledSet = new Set(settings.disabledTools || []);

  if (enable) {
    enabledSet.add(toolName);
    disabledSet.delete(toolName);
  } else {
    disabledSet.add(toolName);
    enabledSet.delete(toolName);
  }

  settings.enabledTools = Array.from(enabledSet);
  settings.disabledTools = Array.from(disabledSet);
  settings.updatedAt = Date.now();

  saveSettingsToDisk();
  syncKeySettingsToMongo(settings).catch(() => {});
  return settings;
}

export function getDefaultToolRiskLevel(
  toolName: string,
  category = "",
): ToolRiskLevel {
  const name = toolName.toLowerCase();
  if (
    /(delete|destroy|terminate|revoke|execute|shell|command|run_code|run_command|stop_service|restart_service)/.test(
      name,
    )
  )
    return "critical";
  if (
    /(deploy|create|update|edit|write|upload|rename|remove|publish|scale|start|restart|configure|permission|token|secret)/.test(
      name,
    )
  )
    return "high";
  if (
    /(read|list|search|fetch|get_|inspect|status|info|describe|view|query)/.test(
      name,
    )
  )
    return "low";
  if (/codegraph|search/.test(category.toLowerCase())) return "low";
  return "moderate";
}

export function getToolRiskLevel(
  keyId: string,
  toolName: string,
  category = "",
): ToolRiskLevel {
  const settings = getKeySettings(keyId);
  return (
    settings.toolRiskLevels?.[toolName] ||
    getDefaultToolRiskLevel(toolName, category)
  );
}

export function updateKeyToolRiskLevel(
  keyId: string,
  toolName: string,
  riskLevel: ToolRiskLevel,
  acknowledgeHighRisk = false,
): KeySettings {
  const allowed: ToolRiskLevel[] = [
    "safe",
    "low",
    "moderate",
    "high",
    "critical",
  ];
  if (!allowed.includes(riskLevel)) throw new Error("Invalid tool risk level.");
  const settings = getKeySettings(keyId);
  settings.toolRiskLevels = {
    ...(settings.toolRiskLevels || {}),
    [toolName]: riskLevel,
  };
  const acknowledged = new Set(settings.riskAcknowledgedTools || []);
  if ((riskLevel === "high" || riskLevel === "critical") && acknowledgeHighRisk)
    acknowledged.add(toolName);
  else acknowledged.delete(toolName);
  settings.riskAcknowledgedTools = Array.from(acknowledged);
  settings.updatedAt = Date.now();
  saveSettingsToDisk();
  syncKeySettingsToMongo(settings).catch(() => {});
  return settings;
}

export function isToolEnabledForKey(
  keyId: string,
  toolName: string,
  category: string,
  sessionEnabledCategories: Set<string>,
): boolean {
  const settings = getKeySettings(keyId);
  if (settings.disabledTools?.includes(toolName)) return false;

  const explicitlyEnabled = Boolean(settings.enabledTools?.includes(toolName));
  // Search is grouped under Sandbox in the catalog, but is deliberately opt-in.
  if (toolName === "web_search") return explicitlyEnabled;
  const categoryEnabled =
    category !== "codegraph" &&
    category !== "search" &&
    category !== "render" &&
    sessionEnabledCategories.has(category);
  const enabled = explicitlyEnabled || categoryEnabled;
  if (!enabled) return false;

  const riskLevel = getToolRiskLevel(keyId, toolName, category);
  if (
    (riskLevel === "high" || riskLevel === "critical") &&
    !settings.riskAcknowledgedTools?.includes(toolName)
  ) {
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------------------------
// Persistence: Disk & MongoDB
// ---------------------------------------------------------------------------------------------

export function saveSettingsToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    const keySettings = Array.from(keySettingsMap.entries()).map(
      ([keyId, settings]) => {
        const persisted: Record<string, any> = { ...settings };
        delete persisted.customGitHubToken;
        delete persisted.customRenderToken;
        const githubEncrypted = encryptStoredSecret(settings.customGitHubToken);
        const renderEncrypted = encryptStoredSecret(settings.customRenderToken);
        if (githubEncrypted)
          persisted.customGitHubTokenEncrypted = githubEncrypted;
        else delete persisted.customGitHubTokenEncrypted;
        if (renderEncrypted)
          persisted.customRenderTokenEncrypted = renderEncrypted;
        else delete persisted.customRenderTokenEncrypted;
        return [keyId, persisted];
      },
    );
    const payload = {
      users: Array.from(userAccountsMap.entries()),
      keySettings,
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(payload, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });
  } catch (err: any) {
    console.error("[settings] saveSettingsToDisk error:", err?.message);
  }
}

function loadSettingsFromDisk(): void {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      if (Array.isArray(data.users)) {
        for (const [email, user] of data.users) {
          userAccountsMap.set(email, user);
        }
      }
      if (Array.isArray(data.keySettings)) {
        for (const [keyId, rawSettings] of data.keySettings) {
          const settings = { ...rawSettings };
          settings.customGitHubToken =
            settings.customGitHubToken ||
            decryptStoredSecret(settings.customGitHubTokenEncrypted);
          settings.customRenderToken =
            settings.customRenderToken ||
            decryptStoredSecret(settings.customRenderTokenEncrypted);
          delete settings.customGitHubTokenEncrypted;
          delete settings.customRenderTokenEncrypted;
          keySettingsMap.set(keyId, settings);
          if (settings.customGitHubToken)
            registerSecret(settings.customGitHubToken);
          if (settings.customRenderToken)
            registerSecret(settings.customRenderToken);
        }
      }
    }
  } catch (err: any) {
    console.error("[settings] loadSettingsFromDisk error:", err?.message);
  }
}
loadSettingsFromDisk();
if (Buffer.byteLength(process.env.KEY_ENCRYPTION_SECRET || "") >= 32)
  saveSettingsToDisk();

export async function syncUserToMongo(user: UserAccount): Promise<void> {
  await ensureMongoAuth();
  const db = getMongoDb();
  if (!db) return;
  try {
    const col = db.collection("users");
    await col.updateOne(
      { email: user.email },
      { $set: { ...user, updatedAt: Date.now() } },
      { upsert: true },
    );
  } catch (err: any) {
    console.error("[settings] syncUserToMongo error:", err?.message);
  }
}

export async function syncKeySettingsToMongo(
  settings: KeySettings,
): Promise<void> {
  await ensureMongoAuth();
  const db = getMongoDb();
  if (!db) return;
  try {
    const persisted: Record<string, any> = {
      ...settings,
      updatedAt: Date.now(),
    };
    delete persisted.customGitHubToken;
    delete persisted.customRenderToken;
    const githubEncrypted = encryptStoredSecret(settings.customGitHubToken);
    const renderEncrypted = encryptStoredSecret(settings.customRenderToken);
    if (githubEncrypted) persisted.customGitHubTokenEncrypted = githubEncrypted;
    else delete persisted.customGitHubTokenEncrypted;
    if (renderEncrypted) persisted.customRenderTokenEncrypted = renderEncrypted;
    else delete persisted.customRenderTokenEncrypted;
    const col = db.collection("key_settings");
    await col.updateOne(
      { keyId: settings.keyId },
      {
        $set: persisted,
        $unset: {
          customGitHubToken: "",
          customRenderToken: "",
          ...(githubEncrypted ? {} : { customGitHubTokenEncrypted: "" }),
          ...(renderEncrypted ? {} : { customRenderTokenEncrypted: "" }),
        },
      },
      { upsert: true },
    );
  } catch (err: any) {
    console.error("[settings] syncKeySettingsToMongo error:", err?.message);
    throw err;
  }
}

export async function loadSettingsFromMongo(): Promise<void> {
  await ensureMongoAuth();
  const db = getMongoDb();
  if (!db) return;
  try {
    const usersCol = db.collection("users");
    const userDocs = await usersCol.find({}).toArray();
    for (const d of userDocs) {
      if (d.email) {
        userAccountsMap.set(d.email, {
          email: d.email,
          role: d.role || getUserRole(d.email),
          createdAt: d.createdAt || Date.now(),
          updatedAt: d.updatedAt || Date.now(),
          lastLoginAt: d.lastLoginAt,
        });
      }
    }

    const settingsCol = db.collection("key_settings");
    const settingsDocs = await settingsCol.find({}).toArray();
    for (const d of settingsDocs) {
      if (d.keyId) {
        const s: KeySettings = {
          keyId: d.keyId,
          email: d.email || "anonymous",
          role: d.role || "user",
          customGitHubToken:
            d.customGitHubToken ||
            decryptStoredSecret(d.customGitHubTokenEncrypted),
          customRenderToken:
            d.customRenderToken ||
            decryptStoredSecret(d.customRenderTokenEncrypted),
          sandboxId:
            d.sandboxId || generateSandboxId(d.keyId, d.role === "owner"),
          enabledTools: Array.isArray(d.enabledTools) ? d.enabledTools : [],
          disabledTools: Array.isArray(d.disabledTools) ? d.disabledTools : [],
          toolRiskLevels:
            d.toolRiskLevels && typeof d.toolRiskLevels === "object"
              ? d.toolRiskLevels
              : {},
          riskAcknowledgedTools: Array.isArray(d.riskAcknowledgedTools)
            ? d.riskAcknowledgedTools
            : [],
          enabledCategories: Array.isArray(d.enabledCategories)
            ? d.enabledCategories
            : ["core", "sandbox", "files"],
          createdAt: d.createdAt || Date.now(),
          updatedAt: d.updatedAt || Date.now(),
        };
        keySettingsMap.set(d.keyId, s);
        if (s.customGitHubToken) registerSecret(s.customGitHubToken);
        if (s.customRenderToken) registerSecret(s.customRenderToken);
        if (d.customGitHubToken || d.customRenderToken)
          await syncKeySettingsToMongo(s);
      }
    }
  } catch (err: any) {
    console.error("[settings] loadSettingsFromMongo error:", err?.message);
  }
}

// Background sync on startup
loadSettingsFromMongo().catch(() => {});
