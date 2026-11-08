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
  if (isOwner || keyId === "primary-key") {
    return "owner";
  }
  const cleanKey = keyId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `sbx_${cleanKey}`;
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
            "render",
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
    if (token) {
      settings.customGitHubToken = token;
      registerSecret(token);
    } else {
      delete settings.customGitHubToken;
    }
  }

  if (customRenderToken !== undefined) {
    const token = customRenderToken.trim();
    if (token) {
      settings.customRenderToken = token;
      registerSecret(token);
    } else {
      delete settings.customRenderToken;
    }
  }

  saveSettingsToDisk();
  syncKeySettingsToMongo(settings).catch(() => {});
  return settings;
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

export function isToolEnabledForKey(
  keyId: string,
  toolName: string,
  category: string,
  sessionEnabledCategories: Set<string>,
): boolean {
  const settings = getKeySettings(keyId);

  // 1. Explicit tool disable takes absolute precedence
  if (settings.disabledTools && settings.disabledTools.includes(toolName)) {
    return false;
  }

  // 2. Explicit tool enable takes precedence
  if (settings.enabledTools && settings.enabledTools.includes(toolName)) {
    return true;
  }

  // 3. Code Graph tools (and web_search) remain disabled by default unless explicitly enabled
  if (category === "codegraph" || category === "search") {
    return false;
  }

  // 4. Default to session-enabled categories
  return sessionEnabledCategories.has(category);
}

// ---------------------------------------------------------------------------------------------
// Persistence: Disk & MongoDB
// ---------------------------------------------------------------------------------------------

function saveSettingsToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    const payload = {
      users: Array.from(userAccountsMap.entries()),
      keySettings: Array.from(keySettingsMap.entries()),
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
        for (const [keyId, settings] of data.keySettings) {
          keySettingsMap.set(keyId, settings);
          if (settings.customGitHubToken) {
            registerSecret(settings.customGitHubToken);
          }
          if (settings.customRenderToken) {
            registerSecret(settings.customRenderToken);
          }
        }
      }
    }
  } catch (err: any) {
    console.error("[settings] loadSettingsFromDisk error:", err?.message);
  }
}
loadSettingsFromDisk();

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
    const col = db.collection("key_settings");
    await col.updateOne(
      { keyId: settings.keyId },
      { $set: { ...settings, updatedAt: Date.now() } },
      { upsert: true },
    );
  } catch (err: any) {
    console.error("[settings] syncKeySettingsToMongo error:", err?.message);
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
          customGitHubToken: d.customGitHubToken,
          customRenderToken: d.customRenderToken,
          sandboxId:
            d.sandboxId || generateSandboxId(d.keyId, d.role === "owner"),
          enabledTools: Array.isArray(d.enabledTools) ? d.enabledTools : [],
          disabledTools: Array.isArray(d.disabledTools) ? d.disabledTools : [],
          enabledCategories: Array.isArray(d.enabledCategories)
            ? d.enabledCategories
            : ["core", "sandbox", "files"],
          createdAt: d.createdAt || Date.now(),
          updatedAt: d.updatedAt || Date.now(),
        };
        keySettingsMap.set(d.keyId, s);
        if (s.customGitHubToken) registerSecret(s.customGitHubToken);
        if (s.customRenderToken) registerSecret(s.customRenderToken);
      }
    }
  } catch (err: any) {
    console.error("[settings] loadSettingsFromMongo error:", err?.message);
  }
}

// Background sync on startup
loadSettingsFromMongo().catch(() => {});
