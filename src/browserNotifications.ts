import crypto from "node:crypto";

export type BrowserNotificationType =
  | "account_created"
  | "account_deleted"
  | "account_deletion_cancelled"
  | "new_login_ip"
  | "api_key_created"
  | "api_key_revoked"
  | "oauth_created"
  | "oauth_revoked"
  | "credentials_updated"
  | "file_visibility_changed";

export interface BrowserNotification {
  id: string;
  type: BrowserNotificationType;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  createdAt: number;
}

const MAX_PER_USER = 50;
const TTL_MS = 24 * 60 * 60 * 1000;
const userQueues = new Map<string, BrowserNotification[]>();

function normalizeEmail(email?: string | null): string {
  const clean = String(email || "").trim().toLowerCase();
  return clean && clean !== "anonymous" ? clean : "";
}

function pruneQueue(email: string, now: number): BrowserNotification[] {
  const list = userQueues.get(email);
  if (!list || list.length === 0) return [];
  const fresh = list.filter((item) => now - item.createdAt <= TTL_MS);
  if (fresh.length === 0) {
    userQueues.delete(email);
    return [];
  }
  if (fresh.length !== list.length) {
    userQueues.set(email, fresh);
  }
  return fresh;
}

export function pushUserNotification(
  email: string | undefined | null,
  input: {
    type: BrowserNotificationType;
    title: string;
    body: string;
    url?: string;
    tag?: string;
  },
): BrowserNotification | null {
  const key = normalizeEmail(email);
  if (!key) return null;
  const now = Date.now();
  const list = pruneQueue(key, now);
  const item: BrowserNotification = {
    id: `ntf_${now.toString(36)}_${crypto.randomBytes(4).toString("hex")}`,
    type: input.type,
    title: String(input.title || "Krix").slice(0, 120),
    body: String(input.body || "").slice(0, 280),
    url: input.url,
    tag: input.tag,
    createdAt: now,
  };
  list.push(item);
  if (list.length > MAX_PER_USER) {
    list.splice(0, list.length - MAX_PER_USER);
  }
  userQueues.set(key, list);
  return item;
}

export function listUserNotifications(
  email: string | undefined | null,
  sinceTs: number = 0,
): BrowserNotification[] {
  const key = normalizeEmail(email);
  if (!key) return [];
  const list = pruneQueue(key, Date.now());
  const cutoff = Number.isFinite(sinceTs) && sinceTs > 0 ? sinceTs : 0;
  return list.filter((item) => item.createdAt > cutoff);
}

export function clearUserNotifications(email: string | undefined | null): void {
  const key = normalizeEmail(email);
  if (!key) return;
  userQueues.delete(key);
}
