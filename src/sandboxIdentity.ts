// Per-sandbox unix identities.
//
// Every sandbox (one per user / API key, rooted at <tmp>/krix_sbx_<id>) runs its code as its OWN
// unprivileged uid/gid instead of one uid shared by everybody. The kernel then stops user A's
// code from reading or modifying user B's sandbox: the directories are mode 0700 and owned by
// different uids. A shared uid would leave that boundary to application path checks alone.
//
// How a uid is chosen
//   uid = BASE + (sha256(sandboxId) mod RANGE), probing forward when that slot already belongs
//   to a different sandbox. The choice is deterministic, so even if the saved map is lost the
//   same sandbox gets the same uid back; the saved map only matters for the rare collisions.
//
// Persistence follows the same pattern as the user/key settings: a JSON file under ./data plus
// a MongoDB collection (`sandbox_uids`) so a Render redeploy (ephemeral disk) keeps the mapping.
//
// Environment (all optional)
//   SANDBOX_UID_BASE   first uid handed out            (default 20000)
//   SANDBOX_UID_RANGE  how many uids may be handed out (default 40000, i.e. 20000..59999;
//                      kept below 65536 because user-namespaced container runtimes often map
//                      no more than that)
//   SANDBOX_PER_USER_UID=false  fall back to the single SANDBOX_UID for everyone
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MAP_FILE = path.resolve(process.cwd(), "data", ".krix_sandbox_uids.json");
const COLLECTION = "sandbox_uids";

const byId = new Map<string, number>();
const byUid = new Map<number, string>();
let diskLoaded = false;
let mongoLoadPromise: Promise<void> | null = null;

/** True unless the operator opted out with SANDBOX_PER_USER_UID=false. */
export function perUserUidEnabled(): boolean {
  return process.env.SANDBOX_PER_USER_UID !== "false";
}

function intEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isInteger(raw) && raw > 0 ? raw : fallback;
}

export function uidBase(): number {
  return Math.max(1000, intEnv("SANDBOX_UID_BASE", 20000));
}

export function uidRange(): number {
  return Math.min(intEnv("SANDBOX_UID_RANGE", 40000), 2_000_000_000);
}

/** The shared legacy uid is reserved: it stays "owns no sandbox", the fallback for unknown paths. */
function reservedUid(): number | undefined {
  const n = Number(process.env.SANDBOX_UID);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * Which sandbox a filesystem path belongs to, from the `krix_sbx_<id>` directory name in it.
 * The first argument that contains one wins, so callers can pass cwd, HOME and TMPDIR.
 * `root` is the sandbox's top directory (what ownership and permissions are applied to).
 */
export function sandboxFromPath(
  ...paths: Array<string | undefined>
): { id: string; root: string } | undefined {
  for (const p of paths) {
    if (!p) continue;
    const m = /^(.*?[\\/]krix_sbx_([A-Za-z0-9_-]+))(?:[\\/]|$)/.exec(p);
    if (m) return { root: m[1], id: m[2] };
  }
  return undefined;
}

export function sandboxIdFromPath(
  ...paths: Array<string | undefined>
): string | undefined {
  return sandboxFromPath(...paths)?.id;
}

function loadDiskOnce(): void {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    if (!fs.existsSync(MAP_FILE)) return;
    const data = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"));
    for (const [id, uid] of Object.entries<any>(data?.map || {})) {
      adopt(id, Number(uid));
    }
  } catch (err: any) {
    console.error("[sandbox-uid] could not read the saved uid map:", err?.message);
  }
}

/** Accept a saved id -> uid pair unless it would give one uid to two sandboxes. */
function adopt(id: string, uid: number): boolean {
  if (!id || !Number.isInteger(uid) || uid <= 0) return false;
  if (byId.has(id)) return byId.get(id) === uid;
  const holder = byUid.get(uid);
  if (holder && holder !== id) return false;
  byId.set(id, uid);
  byUid.set(uid, id);
  return true;
}

function persistDisk(): void {
  try {
    fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
    fs.writeFileSync(
      MAP_FILE,
      JSON.stringify({ version: 1, map: Object.fromEntries(byId) }, null, 2),
      { encoding: "utf-8", mode: 0o600 },
    );
  } catch (err: any) {
    console.error("[sandbox-uid] could not save the uid map:", err?.message);
  }
}

async function mongoDb(): Promise<any | null> {
  if (
    !(process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL)
  )
    return null;
  // Imported lazily so merely importing the sandbox runner never opens a database connection.
  const mod = await import("./googleAuth.js");
  await mod.ensureMongoAuth();
  return mod.getMongoDb();
}

async function persistMongo(id: string, uid: number): Promise<void> {
  try {
    const db = await mongoDb();
    if (!db) return;
    await db
      .collection(COLLECTION)
      .updateOne(
        { sandboxId: id },
        { $set: { sandboxId: id, uid, updatedAt: Date.now() } },
        { upsert: true },
      );
  } catch (err: any) {
    console.error("[sandbox-uid] mongo save failed:", err?.message);
  }
}

/**
 * Load the saved map from MongoDB (once). Call before the first allocation of a process so a
 * uid that was handed out before a restart is never given to a second sandbox. A failure is
 * logged and retried on the next call; allocation still works from disk + the deterministic hash.
 */
export function ensureSandboxIdentitiesLoaded(): Promise<void> {
  loadDiskOnce();
  if (!mongoLoadPromise) {
    mongoLoadPromise = (async () => {
      const db = await mongoDb();
      if (!db) return;
      const docs = await db.collection(COLLECTION).find({}).toArray();
      for (const d of docs) {
        if (!adopt(String(d.sandboxId), Number(d.uid))) {
          // Disk disagreed with Mongo, or two ids claimed one uid: keep what we hold in
          // memory and push it back so the stores converge.
          const mine = byId.get(String(d.sandboxId));
          if (mine) void persistMongo(String(d.sandboxId), mine);
        }
      }
      persistDisk();
    })().catch((err) => {
      mongoLoadPromise = null;
      console.error("[sandbox-uid] mongo load failed (will retry):", err?.message);
    });
  }
  return mongoLoadPromise;
}

function hashSlot(id: string): number {
  const h = crypto.createHash("sha256").update(id).digest();
  return h.readUInt32BE(0);
}

/**
 * The uid (and gid) for a sandbox, allocating and saving one the first time it is seen.
 * Synchronous on purpose: process spawners are synchronous. Throws when the range is full.
 */
export function allocateSandboxUid(id: string): { uid: number; gid: number } {
  loadDiskOnce();
  const existing = byId.get(id);
  if (existing !== undefined) return { uid: existing, gid: existing };

  const base = uidBase();
  const range = uidRange();
  const reserved = reservedUid();
  const start = hashSlot(id) % range;
  for (let i = 0; i < range; i++) {
    const uid = base + ((start + i) % range);
    if (uid === reserved) continue;
    const holder = byUid.get(uid);
    if (holder && holder !== id) continue;
    byId.set(id, uid);
    byUid.set(uid, id);
    persistDisk();
    void persistMongo(id, uid);
    return { uid, gid: uid };
  }
  throw new Error(
    "No free sandbox user id left. Raise SANDBOX_UID_RANGE or delete unused sandboxes.",
  );
}

/**
 * Forget a sandbox's uid (when its sandbox is destroyed) so the slot can be reused. Returns the
 * released uid so the caller can purge anything that uid left in shared temp directories before
 * a different sandbox is ever given the same number.
 */
export function releaseSandboxUid(id: string): number | undefined {
  loadDiskOnce();
  const uid = byId.get(id);
  if (uid === undefined) return undefined;
  byId.delete(id);
  byUid.delete(uid);
  persistDisk();
  void (async () => {
    try {
      const db = await mongoDb();
      await db?.collection(COLLECTION).deleteOne({ sandboxId: id });
    } catch (err: any) {
      console.error("[sandbox-uid] mongo release failed:", err?.message);
    }
  })();
  return uid;
}

/**
 * Test helper: forget everything held in memory. With `reload` the saved file is read again on
 * next use, which simulates a server restart; otherwise the file is ignored.
 */
export function _resetSandboxIdentitiesForTests(opts: { reload?: boolean } = {}): void {
  byId.clear();
  byUid.clear();
  diskLoaded = !opts.reload;
  mongoLoadPromise = null;
}
