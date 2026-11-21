import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";
import { dataPath } from "./dataDir.js";
import { ensureMongoAuth, getMongoDb } from "./googleAuth.js";
import { registerSecret } from "./security.js";

export interface StoredPushSubscription {
  email: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: number;
  updatedAt: number;
}

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

const VAPID_FILE = dataPath(".krix_vapid_keys.json");
const SUBS_FILE = dataPath(".krix_push_subs.json");
const COLLECTION = "push_subscriptions";
const MAX_DEVICES_PER_USER = 15;

let cachedVapid: VapidKeys | null = null;
let vapidConfigured = false;
let diskLoaded = false;
const subsByEmail = new Map<string, Map<string, StoredPushSubscription>>();

function normalizeEmail(email?: string | null): string {
  const clean = String(email || "").trim().toLowerCase();
  return clean && clean !== "anonymous" ? clean : "";
}

function resolveVapidSubject(): string {
  const explicit = process.env.VAPID_SUBJECT?.trim();
  if (explicit) return explicit;
  const owner = (
    process.env.OWNER_EMAIL ||
    process.env.GOOGLE_ALLOWED_EMAIL ||
    ""
  ).trim();
  if (owner && owner.includes("@")) return `mailto:${owner}`;
  const base = process.env.PUBLIC_BASE_URL?.trim();
  if (base && /^https?:\/\//i.test(base)) return base.replace(/\/+$/, "");
  return "https://krix.onrender.com";
}

export function getVapidKeys(): VapidKeys {
  if (cachedVapid) return cachedVapid;

  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPub && envPriv) {
    cachedVapid = { publicKey: envPub, privateKey: envPriv };
    registerSecret(envPriv);
    return cachedVapid;
  }

  try {
    if (fs.existsSync(VAPID_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VAPID_FILE, "utf-8"));
      if (parsed?.publicKey && parsed?.privateKey) {
        cachedVapid = {
          publicKey: String(parsed.publicKey),
          privateKey: String(parsed.privateKey),
        };
        registerSecret(cachedVapid.privateKey);
        return cachedVapid;
      }
    }
  } catch {}

  const generated = webpush.generateVAPIDKeys();
  cachedVapid = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
  };
  registerSecret(cachedVapid.privateKey);

  try {
    fs.mkdirSync(path.dirname(VAPID_FILE), { recursive: true });
    fs.writeFileSync(VAPID_FILE, JSON.stringify(cachedVapid, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });
  } catch {}

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[web-push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — generated ephemeral keys. Set both env vars in Render so push subscriptions persist across redeploys.",
    );
  }
  return cachedVapid;
}

function ensureVapidConfigured(): VapidKeys {
  const keys = getVapidKeys();
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      resolveVapidSubject(),
      keys.publicKey,
      keys.privateKey,
    );
    vapidConfigured = true;
  }
  return keys;
}

export function getVapidPublicKey(): string {
  return ensureVapidConfigured().publicKey;
}

function loadSubsFromDiskOnce(): void {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    if (!fs.existsSync(SUBS_FILE)) return;
    const data = JSON.parse(fs.readFileSync(SUBS_FILE, "utf-8"));
    const items: StoredPushSubscription[] = Array.isArray(data?.subscriptions)
      ? data.subscriptions
      : [];
    for (const item of items) {
      const email = normalizeEmail(item?.email);
      if (!email || !item?.endpoint || !item?.keys?.p256dh || !item?.keys?.auth) {
        continue;
      }
      let bucket = subsByEmail.get(email);
      if (!bucket) {
        bucket = new Map();
        subsByEmail.set(email, bucket);
      }
      bucket.set(item.endpoint, { ...item, email });
    }
  } catch {}
}

function saveSubsToDisk(): void {
  try {
    const all: StoredPushSubscription[] = [];
    for (const bucket of subsByEmail.values()) {
      for (const sub of bucket.values()) all.push(sub);
    }
    fs.mkdirSync(path.dirname(SUBS_FILE), { recursive: true });
    fs.writeFileSync(
      SUBS_FILE,
      JSON.stringify({ version: 1, subscriptions: all }, null, 2),
      { encoding: "utf-8", mode: 0o600 },
    );
  } catch {}
}

export async function loadPushSubscriptionsFromMongo(): Promise<void> {
  loadSubsFromDiskOnce();
  await ensureMongoAuth().catch(() => {});
  const db = getMongoDb();
  if (!db) return;
  try {
    const docs = await db.collection(COLLECTION).find({}).toArray();
    for (const d of docs) {
      const email = normalizeEmail(d.email);
      const endpoint = typeof d.endpoint === "string" ? d.endpoint : "";
      const p256dh = typeof d.keys?.p256dh === "string" ? d.keys.p256dh : "";
      const auth = typeof d.keys?.auth === "string" ? d.keys.auth : "";
      if (!email || !endpoint || !p256dh || !auth) continue;
      let bucket = subsByEmail.get(email);
      if (!bucket) {
        bucket = new Map();
        subsByEmail.set(email, bucket);
      }
      bucket.set(endpoint, {
        email,
        endpoint,
        keys: { p256dh, auth },
        userAgent: typeof d.userAgent === "string" ? d.userAgent : undefined,
        createdAt: Number(d.createdAt) || Date.now(),
        updatedAt: Number(d.updatedAt) || Date.now(),
      });
    }
    saveSubsToDisk();
  } catch (err: any) {
    console.error("[web-push] mongo load failed:", err?.message);
  }
}

export async function savePushSubscription(
  email: string,
  input: {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  },
  userAgent?: string,
): Promise<StoredPushSubscription> {
  loadSubsFromDiskOnce();
  const normEmail = normalizeEmail(email);
  if (!normEmail) throw new Error("Authenticated user email is required.");

  const endpoint = typeof input?.endpoint === "string" ? input.endpoint.trim() : "";
  const p256dh =
    typeof input?.keys?.p256dh === "string" ? input.keys.p256dh.trim() : "";
  const auth =
    typeof input?.keys?.auth === "string" ? input.keys.auth.trim() : "";

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(endpoint);
  } catch {
    throw new Error("Invalid push subscription endpoint.");
  }
  if (parsedUrl.protocol !== "https:") {
    throw new Error("Push subscription endpoint must use HTTPS.");
  }
  if (!p256dh || !auth || endpoint.length > 2048) {
    throw new Error("Push subscription keys are required.");
  }

  let bucket = subsByEmail.get(normEmail);
  if (!bucket) {
    bucket = new Map();
    subsByEmail.set(normEmail, bucket);
  }
  const existing = bucket.get(endpoint);
  const now = Date.now();
  const record: StoredPushSubscription = {
    email: normEmail,
    endpoint,
    keys: { p256dh, auth },
    userAgent: userAgent ? String(userAgent).slice(0, 200) : existing?.userAgent,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  bucket.set(endpoint, record);

  if (bucket.size > MAX_DEVICES_PER_USER) {
    const oldest = Array.from(bucket.values()).sort(
      (a, b) => a.updatedAt - b.updatedAt,
    );
    while (bucket.size > MAX_DEVICES_PER_USER && oldest.length > 0) {
      const drop = oldest.shift()!;
      bucket.delete(drop.endpoint);
      void removePushSubscriptionFromMongo(normEmail, drop.endpoint);
    }
  }

  saveSubsToDisk();
  await ensureMongoAuth().catch(() => {});
  const db = getMongoDb();
  if (db) {
    await db
      .collection(COLLECTION)
      .updateOne(
        { email: normEmail, endpoint },
        { $set: record },
        { upsert: true },
      )
      .catch((err: any) =>
        console.error("[web-push] mongo save failed:", err?.message),
      );
  }
  return record;
}

async function removePushSubscriptionFromMongo(
  email: string,
  endpoint: string,
): Promise<void> {
  try {
    await ensureMongoAuth().catch(() => {});
    const db = getMongoDb();
    if (!db) return;
    await db.collection(COLLECTION).deleteOne({ email, endpoint });
  } catch (err: any) {
    console.error("[web-push] mongo delete failed:", err?.message);
  }
}

export async function removePushSubscription(
  email: string,
  endpoint?: string,
): Promise<boolean> {
  loadSubsFromDiskOnce();
  const normEmail = normalizeEmail(email);
  if (!normEmail) return false;
  const bucket = subsByEmail.get(normEmail);
  if (!bucket) return false;

  if (endpoint) {
    const removed = bucket.delete(endpoint);
    if (bucket.size === 0) subsByEmail.delete(normEmail);
    if (removed) saveSubsToDisk();
    await removePushSubscriptionFromMongo(normEmail, endpoint);
    return removed;
  }

  const hadAny = bucket.size > 0;
  subsByEmail.delete(normEmail);
  if (hadAny) saveSubsToDisk();
  try {
    await ensureMongoAuth().catch(() => {});
    const db = getMongoDb();
    if (db) await db.collection(COLLECTION).deleteMany({ email: normEmail });
  } catch {}
  return hadAny;
}

export async function sendWebPushToUser(
  email: string,
  payload: {
    id?: string;
    title: string;
    body: string;
    url?: string;
    tag?: string;
  },
): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  loadSubsFromDiskOnce();
  const normEmail = normalizeEmail(email);
  if (!normEmail) return;
  const bucket = subsByEmail.get(normEmail);
  if (!bucket || bucket.size === 0) return;

  ensureVapidConfigured();
  const message = JSON.stringify({
    id: payload.id,
    title: payload.title || "Krix",
    body: payload.body || "",
    url: payload.url || "/",
    tag: payload.tag || payload.id,
    icon: "/icon-192.png",
    badge: "/icon-64.png",
  });

  await Promise.allSettled(
    Array.from(bucket.values()).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          message,
          { TTL: 86400 },
        );
      } catch (err: any) {
        const status = Number(err?.statusCode || err?.status || 0);
        if (status === 404 || status === 410) {
          await removePushSubscription(normEmail, sub.endpoint);
        } else {
          console.error(
            "[web-push] sendNotification failed:",
            err?.message || status,
          );
        }
      }
    }),
  );
}

export function getServiceWorkerScript(): string {
  return `// Krix Web Push Service Worker
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Krix", body: event.data ? event.data.text() : "" };
  }
  var title = data.title || "Krix";
  var options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-64.png",
    tag: data.tag || data.id || undefined,
    data: { url: data.url || "/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var targetUrl = (event.notification && event.notification.data && event.notification.data.url) || "/";
  if (typeof targetUrl !== "string" || targetUrl.charAt(0) !== "/") targetUrl = "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url && client.url.indexOf(self.location.origin) === 0 && "focus" in client) {
          if ("navigate" in client) {
            try { client.navigate(targetUrl); } catch (e) {}
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
`;
}
