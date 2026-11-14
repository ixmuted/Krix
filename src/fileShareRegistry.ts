import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Db } from "mongodb";

export interface FileShareMeta {
  fileId: string;
  shareToken: string;
  isPublic: boolean;
  name: string;
  contentType: string;
  source: "store" | "sandbox";
  sandboxPath?: string;
  ownerKey?: string;
  updatedAt: number;
}

class FileShareRegistry {
  private byToken = new Map<string, FileShareMeta>();
  private byId = new Map<string, FileShareMeta>();
  private filePath = path.resolve(
    process.cwd(),
    "data",
    ".krix_file_shares.json",
  );
  private mongoDb: Db | null = null;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromDisk();
  }

  public setMongoDb(db: Db): void {
    this.mongoDb = db;
    this.loadFromMongo().catch(() => {});
  }

  public ensureFileShare(params: {
    fileId: string;
    name: string;
    source: "store" | "sandbox";
    contentType?: string;
    sandboxPath?: string;
    ownerKey?: string;
    isPublic?: boolean;
  }): { shareToken: string; isPublic: boolean } {
    let existing = this.byId.get(params.fileId);
    if (!existing) {
      // 64-char unguessable cryptographic hex token (32 bytes entropy)
      const shareToken = crypto.randomBytes(32).toString("hex");
      existing = {
        fileId: params.fileId,
        shareToken,
        isPublic: params.isPublic !== undefined ? params.isPublic : false, // Default to private per specification
        name: params.name,
        contentType: params.contentType || "application/octet-stream",
        source: params.source,
        sandboxPath: params.sandboxPath,
        ownerKey: params.ownerKey,
        updatedAt: Date.now(),
      };
      this.byId.set(params.fileId, existing);
      this.byToken.set(shareToken, existing);
      this.scheduleSave();
    } else {
      let changed = false;
      if (params.ownerKey && existing.ownerKey !== params.ownerKey) {
        existing.ownerKey = params.ownerKey;
        changed = true;
      }
      if (params.name && existing.name !== params.name) {
        existing.name = params.name;
        changed = true;
      }
      if (params.sandboxPath && existing.sandboxPath !== params.sandboxPath) {
        existing.sandboxPath = params.sandboxPath;
        changed = true;
      }
      if (changed) {
        existing.updatedAt = Date.now();
        this.scheduleSave();
      }
    }
    return { shareToken: existing.shareToken, isPublic: existing.isPublic };
  }

  public getByToken(token: string): FileShareMeta | undefined {
    return this.byToken.get(token);
  }

  public getById(fileId: string): FileShareMeta | undefined {
    return this.byId.get(fileId);
  }

  public listPublicShares(): FileShareMeta[] {
    return Array.from(this.byId.values()).filter((f) => f.isPublic);
  }

  public togglePrivacy(
    fileId: string,
    explicitIsPublic?: boolean,
    ownerKey?: string,
  ): boolean {
    const entry = this.byId.get(fileId);
    if (!entry) {
      // Create if it didn't exist yet
      const shareToken = crypto.randomBytes(32).toString("hex");
      const isPublic = explicitIsPublic !== undefined ? explicitIsPublic : true; // toggling from default false -> true
      const newEntry: FileShareMeta = {
        fileId,
        shareToken,
        isPublic,
        name: fileId,
        contentType: "application/octet-stream",
        source: fileId.startsWith("sbx_") ? "sandbox" : "store",
        ownerKey,
        updatedAt: Date.now(),
      };
      this.byId.set(fileId, newEntry);
      this.byToken.set(shareToken, newEntry);
      this.scheduleSave();
      return isPublic;
    }

    if (ownerKey && !entry.ownerKey) {
      entry.ownerKey = ownerKey;
    }
    entry.isPublic =
      explicitIsPublic !== undefined ? explicitIsPublic : !entry.isPublic;
    entry.updatedAt = Date.now();
    this.scheduleSave();
    return entry.isPublic;
  }

  public renameFile(fileId: string, newName: string): void {
    const entry = this.byId.get(fileId);
    if (entry) {
      entry.name = newName;
      if (entry.sandboxPath) {
        entry.sandboxPath = path.join(path.dirname(entry.sandboxPath), newName);
      }
      entry.updatedAt = Date.now();
      this.scheduleSave();
    }
  }

  public removeFile(fileId: string): void {
    const entry = this.byId.get(fileId);
    if (entry) {
      this.byToken.delete(entry.shareToken);
      this.byId.delete(fileId);
      this.scheduleSave();
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveToDisk();
      this.saveToMongo().catch(() => {});
    }, 250);
    this.saveTimer.unref();
  }

  private saveToDisk(): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const data = Array.from(this.byId.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {}
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.fileId && item.shareToken) {
              const meta: FileShareMeta = {
                fileId: String(item.fileId),
                shareToken: String(item.shareToken),
                isPublic: Boolean(item.isPublic),
                name: item.name || "",
                contentType: item.contentType || "application/octet-stream",
                source: item.source || "store",
                sandboxPath: item.sandboxPath,
                ownerKey: item.ownerKey ? String(item.ownerKey) : undefined,
                updatedAt: item.updatedAt || Date.now(),
              };
              this.byId.set(meta.fileId, meta);
              this.byToken.set(meta.shareToken, meta);
            }
          }
        }
      }
    } catch {}
  }

  private async saveToMongo(): Promise<void> {
    if (!this.mongoDb) return;
    try {
      const coll = this.mongoDb.collection("file_shares");
      const docs = Array.from(this.byId.values()).map((d) => ({
        _id: d.fileId as any,
        ...d,
      }));
      if (docs.length === 0) return;
      for (const doc of docs) {
        await coll.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
      }
    } catch {}
  }

  private async loadFromMongo(): Promise<void> {
    if (!this.mongoDb) return;
    try {
      const coll = this.mongoDb.collection("file_shares");
      const docs = await coll.find({}).toArray();
      for (const d of docs) {
        if (d.fileId && d.shareToken) {
          const item: FileShareMeta = {
            fileId: String(d.fileId),
            shareToken: String(d.shareToken),
            isPublic: Boolean(d.isPublic),
            name: d.name || "",
            contentType: d.contentType || "application/octet-stream",
            source: d.source || "store",
            sandboxPath: d.sandboxPath,
            ownerKey: d.ownerKey ? String(d.ownerKey) : undefined,
            updatedAt: d.updatedAt || Date.now(),
          };
          this.byId.set(item.fileId, item);
          this.byToken.set(item.shareToken, item);
        }
      }
    } catch {}
  }
}

export const fileShareRegistry = new FileShareRegistry();
