import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import type { AddressInfo } from "node:net";
import {
  computeAuthKey,
  computeUserAuthKey,
  canonicalUserIdentity,
  sandboxRootForAuthKey,
  sandboxRootForUser,
} from "../src/security.js";
import {
  setFileStore,
  type FileStore,
  type StoredFileMeta,
  type ListOwnerOptions,
} from "../src/fileShare.js";
import { fileShareRegistry } from "../src/fileShareRegistry.js";
import { shutdownUploadSessions, UPLOAD_DIR } from "../src/uploadSessions.js";
import { createDynamicKey } from "../src/googleAuth.js";

// Ensure test environment is configured before importing app
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "krix-security-test-secret-32-chars-long-123456";
process.env.OWNER_EMAIL = "system_owner@krix.test";
process.env.MCP_API_KEY = "krix-master-api-key-0123456789-abcdef";

class InMemoryTestFileStore implements FileStore {
  private files = new Map<string, { meta: StoredFileMeta; data: Buffer }>();

  async put(
    meta: {
      name: string;
      contentType: string;
      ownerKey: string;
      tokenHash: string;
      expiresAt: Date | null;
      isPublic?: boolean;
    },
    data: Buffer,
  ): Promise<StoredFileMeta> {
    const id = crypto.randomBytes(12).toString("hex");
    const isPublic = meta.isPublic === true;
    const stored: StoredFileMeta = {
      id,
      name: meta.name,
      size: data.length,
      contentType: meta.contentType,
      createdAt: new Date(),
      expiresAt: meta.expiresAt,
      ownerKey: meta.ownerKey,
      isPublic,
    };
    this.files.set(id, { meta: stored, data });
    return stored;
  }

  async openByTokenHash(
    _tokenHash: string,
  ): Promise<(StoredFileMeta & { stream: Readable }) | null> {
    return null;
  }

  async openById(
    ownerKey: string,
    id: string,
  ): Promise<(StoredFileMeta & { stream: Readable }) | null> {
    const entry = this.files.get(id);
    if (!entry) return null;
    if (
      ownerKey !== "*" &&
      entry.meta.ownerKey &&
      entry.meta.ownerKey !== ownerKey
    ) {
      return null;
    }
    return {
      ...entry.meta,
      stream: Readable.from(entry.data),
    };
  }

  async listByOwner(
    ownerKey: string,
    _options?: ListOwnerOptions,
  ): Promise<{ files: StoredFileMeta[]; totalCount: number }> {
    const matches = Array.from(this.files.values())
      .filter((e) => e.meta.ownerKey === ownerKey)
      .map((e) => e.meta);
    return { files: matches, totalCount: matches.length };
  }

  async usage(ownerKey: string): Promise<{
    count: number;
    bytes: number;
    permanentCount: number;
    expiredCount: number;
  }> {
    const owned = Array.from(this.files.values()).filter(
      (e) => e.meta.ownerKey === ownerKey,
    );
    const count = owned.length;
    const bytes = owned.reduce((sum, e) => sum + e.data.length, 0);
    const permanentCount = owned.filter((e) => !e.meta.expiresAt).length;
    return { count, bytes, permanentCount, expiredCount: 0 };
  }

  async deleteOwned(ownerKey: string, id: string): Promise<boolean> {
    if (!ownerKey || ownerKey === "*") return false;
    const entry = this.files.get(id);
    if (!entry || entry.meta.ownerKey !== ownerKey) return false;
    this.files.delete(id);
    return true;
  }

  async deleteManyOwned(ownerKey: string, ids: string[]): Promise<number> {
    if (!ownerKey || ownerKey === "*") return 0;
    let count = 0;
    for (const id of ids) {
      if (await this.deleteOwned(ownerKey, id)) count++;
    }
    return count;
  }

  async deleteFilteredOwned(
    _ownerKey: string,
    _filter: { expiredOnly?: boolean; search?: string },
  ): Promise<number> {
    return 0;
  }

  async deleteAllOwned(ownerKey: string): Promise<number> {
    if (!ownerKey || ownerKey === "*") return 0;
    const toDelete = Array.from(this.files.entries())
      .filter(([_, e]) => e.meta.ownerKey === ownerKey)
      .map(([id]) => id);
    for (const id of toDelete) this.files.delete(id);
    return toDelete.length;
  }

  async makePermanent(ownerKey: string, id: string): Promise<boolean> {
    if (!ownerKey || ownerKey === "*") return false;
    const entry = this.files.get(id);
    if (!entry || entry.meta.ownerKey !== ownerKey) return false;
    entry.meta.expiresAt = null;
    return true;
  }

  async revertPermanent(
    ownerKey: string,
    id: string,
    ttlHours = 72,
  ): Promise<boolean> {
    if (!ownerKey || ownerKey === "*") return false;
    const entry = this.files.get(id);
    if (!entry || entry.meta.ownerKey !== ownerKey) return false;
    entry.meta.expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);
    return true;
  }

  async rename(
    ownerKey: string,
    id: string,
    newName: string,
  ): Promise<boolean> {
    if (!ownerKey || ownerKey === "*") return false;
    const entry = this.files.get(id);
    if (!entry || entry.meta.ownerKey !== ownerKey) return false;
    entry.meta.name = path.basename(newName.trim());
    return true;
  }

  async sweepExpired(): Promise<number> {
    return 0;
  }

  async close(): Promise<void> {}
}

function makeSessionCookie(
  email: string,
  role: "owner" | "user" = "user",
): string {
  const secret = process.env.SESSION_SECRET!;
  const payload = Buffer.from(
    JSON.stringify({
      email,
      name: email.split("@")[0],
      expiresAt: Date.now() + 3600_000,
      role,
    }),
  ).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `krix_session=${payload}.${hmac}`;
}

describe("Security, Isolation & Storage Hardening Verification", () => {
  let server: http.Server;
  let baseUrl = "";
  let memoryStore: InMemoryTestFileStore;

  const USER_A_EMAIL = "alice@krix.test";
  const USER_B_EMAIL = "bob@krix.test";
  const cookieUserA = makeSessionCookie(USER_A_EMAIL, "user");
  const cookieUserB = makeSessionCookie(USER_B_EMAIL, "user");

  const authKeyA = computeUserAuthKey({ email: USER_A_EMAIL });
  const authKeyB = computeUserAuthKey({ email: USER_B_EMAIL });
  const rootA = sandboxRootForAuthKey(authKeyA);
  const rootB = sandboxRootForAuthKey(authKeyB);

  before(async () => {
    // Clean up directories if pre-existing
    fs.rmSync(rootA, { recursive: true, force: true });
    fs.rmSync(rootB, { recursive: true, force: true });

    memoryStore = new InMemoryTestFileStore();
    setFileStore(memoryStore);

    const { app } = await import("../src/index.js");
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await shutdownUploadSessions().catch(() => {});
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(rootA, { recursive: true, force: true });
    fs.rmSync(rootB, { recursive: true, force: true });
  });

  describe("1. Render Workspace Upload Opt-in Gate Removal", () => {
    let originalRender: string | undefined;
    let originalRenderService: string | undefined;

    before(() => {
      originalRender = process.env.RENDER;
      originalRenderService = process.env.RENDER_SERVICE_ID;
      process.env.RENDER = "true";
      process.env.RENDER_SERVICE_ID = "srv-production-worker-12345";
      delete process.env.SANDBOX_RENDER_OWNER_ONLY_ACK;
    });

    after(() => {
      if (originalRender !== undefined) process.env.RENDER = originalRender;
      else delete process.env.RENDER;
      if (originalRenderService !== undefined)
        process.env.RENDER_SERVICE_ID = originalRenderService;
      else delete process.env.RENDER_SERVICE_ID;
    });

    test("Render workspace uploads succeed without owner-only sandbox opt-in gate", async () => {
      const userKey = createDynamicKey(
        "Render Key " + Date.now(),
        USER_A_EMAIL,
      );

      const sessionRes = await fetch(`${baseUrl}/upload/api/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: baseUrl,
          Cookie: cookieUserA,
        },
        body: JSON.stringify({ apiKey: userKey.key }),
      });

      assert.equal(sessionRes.status, 201);
      const sessionData = (await sessionRes.json()) as any;
      assert.ok(sessionData.token, "Must return upload token");
      assert.equal(sessionData.folder, UPLOAD_DIR);

      // Upload file to the session
      const uploadRes = await fetch(`${baseUrl}/upload/api/files`, {
        method: "POST",
        headers: {
          "x-upload-token": sessionData.token,
          "x-filename": encodeURIComponent("render_allowed.txt"),
        },
        body: "Render upload without opt-in gate verification",
      });

      assert.equal(uploadRes.status, 201);
      const uploadData = (await uploadRes.json()) as any;
      assert.ok(uploadData.file, "Upload response must include file metadata");
      assert.equal(uploadData.file.name, "render_allowed.txt");

      // Verify that the legacy error string was not emitted
      const text = JSON.stringify(uploadData);
      assert.ok(
        !text.includes(
          "On Render, workspace uploads are available only to the configured owner",
        ),
      );
    });
  });

  describe("2. True Per-User Workspace File Isolation", () => {
    test("User A and User B compute strictly distinct canonical authKeys and sandbox roots", () => {
      assert.notEqual(authKeyA, authKeyB);
      assert.notEqual(rootA, rootB);
      assert.equal(
        canonicalUserIdentity({ email: USER_A_EMAIL }),
        `user_${USER_A_EMAIL}`,
      );
      assert.equal(
        canonicalUserIdentity({ email: USER_B_EMAIL }),
        `user_${USER_B_EMAIL}`,
      );
      assert.equal(sandboxRootForUser({ email: USER_A_EMAIL }), rootA);
      assert.equal(sandboxRootForUser({ email: USER_B_EMAIL }), rootB);
    });

    test("User A uploads file; User B cannot list, download, rename, or delete User A's file", async () => {
      // 1. User A creates session and uploads private file
      const userAKey = createDynamicKey(
        "Alice Iso Key " + Date.now(),
        USER_A_EMAIL,
      );
      const sessionRes = await fetch(`${baseUrl}/upload/api/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: baseUrl,
        },
        body: JSON.stringify({ apiKey: userAKey.key }),
      });
      assert.equal(sessionRes.status, 201);
      const { token } = (await sessionRes.json()) as any;

      const uploadRes = await fetch(`${baseUrl}/upload/api/files`, {
        method: "POST",
        headers: {
          "x-upload-token": token,
          "x-filename": "alice_secret_financials.txt",
        },
        body: "CONFIDENTIAL_ALICE_DATA_3892719",
      });
      assert.equal(uploadRes.status, 201);

      // Verify file exists on disk inside User A's sandbox root and NOT User B's root
      const fileOnA = path.join(
        rootA,
        UPLOAD_DIR,
        "alice_secret_financials.txt",
      );
      const fileOnB = path.join(
        rootB,
        UPLOAD_DIR,
        "alice_secret_financials.txt",
      );
      assert.equal(fs.existsSync(fileOnA), true);
      assert.equal(fs.existsSync(fileOnB), false);

      // 2. User B lists /store/api/files: User A's file must NOT appear in User B's listing
      const listResB = await fetch(`${baseUrl}/store/api/files`, {
        headers: { Cookie: cookieUserB },
      });
      assert.equal(listResB.status, 200);
      const listB = (await listResB.json()) as any;
      const bFoundA = listB.files.some(
        (f: any) => f.name === "alice_secret_financials.txt",
      );
      assert.equal(
        bFoundA,
        false,
        "User B must not see User A's private sandbox file in /store/api/files",
      );

      // 3. User B attempts to download via direct sandbox file endpoint /store/download?file=...
      const downloadResB = await fetch(
        `${baseUrl}/store/download?file=alice_secret_financials.txt`,
        { headers: { Cookie: cookieUserB } },
      );
      assert.equal(
        downloadResB.status,
        404,
        "User B cannot download User A's sandbox file",
      );

      // 4. User B attempts path traversal to read User A's root
      const traversalResB = await fetch(
        `${baseUrl}/store/download?file=../../${path.basename(rootA)}/upload/alice_secret_financials.txt`,
        { headers: { Cookie: cookieUserB } },
      );
      assert.equal(
        traversalResB.status,
        400,
        "Path traversal attempt must be rejected with 400",
      );

      // 5. User B attempts to rename User A's file via /upload/rename
      const renameResB = await fetch(`${baseUrl}/upload/rename`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: baseUrl,
          Cookie: cookieUserB,
        },
        body: JSON.stringify({
          oldName: "alice_secret_financials.txt",
          newName: "hacked.txt",
        }),
      });
      assert.ok(
        renameResB.status === 403 || renameResB.status === 404,
        "Renaming another user's file must be rejected (403 or 404)",
      );
      assert.equal(
        fs.existsSync(fileOnA),
        true,
        "File on A must remain unchanged",
      );
      assert.equal(
        fs.existsSync(path.join(rootA, UPLOAD_DIR, "hacked.txt")),
        false,
      );

      // 6. User B attempts to delete User A's file via /store/sandbox-file
      const deleteResB = await fetch(
        `${baseUrl}/store/sandbox-file?name=alice_secret_financials.txt`,
        {
          method: "DELETE",
          headers: {
            Origin: baseUrl,
            Cookie: cookieUserB,
          },
        },
      );
      assert.ok(
        deleteResB.status === 403 || deleteResB.status === 404,
        "Deleting another user's file must be rejected (403 or 404)",
      );
      assert.equal(
        fs.existsSync(fileOnA),
        true,
        "File on A must survive deletion attempt by User B",
      );
    });
  });

  describe("3. Default Private Status for Uploaded Files", () => {
    test("Sandbox upload registers file as private by default in registry and store", async () => {
      const userAKey = createDynamicKey(
        "Alice Def Key " + Date.now(),
        USER_A_EMAIL,
      );
      const sessionRes = await fetch(`${baseUrl}/upload/api/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: baseUrl,
        },
        body: JSON.stringify({ apiKey: userAKey.key }),
      });
      const { token } = (await sessionRes.json()) as any;

      const fileName = "private_by_default.txt";
      const uploadRes = await fetch(`${baseUrl}/upload/api/files`, {
        method: "POST",
        headers: {
          "x-upload-token": token,
          "x-filename": fileName,
        },
        body: "Top secret default private payload",
      });
      assert.equal(uploadRes.status, 201);

      const sbxId = `sbx_${Buffer.from(fileName).toString("hex").slice(0, 16)}`;
      const regEntry = fileShareRegistry.getById(sbxId);
      assert.ok(regEntry, "File share registry must have an entry");
      assert.equal(
        regEntry.isPublic,
        false,
        "Registry entry must be private by default (isPublic: false)",
      );
      assert.equal(regEntry.ownerKey, authKeyA);

      // Verify in /store/api/files
      const listResA = await fetch(`${baseUrl}/store/api/files`, {
        headers: { Cookie: cookieUserA },
      });
      const listA = (await listResA.json()) as any;
      const fileMeta = listA.files.find((f: any) => f.name === fileName);
      assert.ok(fileMeta, "File must appear in User A's store list");
      assert.equal(
        fileMeta.isPublic,
        false,
        "Store API must report isPublic: false",
      );
    });

    test("Cloud file store put() creates private file by default with ownerKey", async () => {
      const stored = await memoryStore.put(
        {
          name: "cloud_file.bin",
          contentType: "application/octet-stream",
          ownerKey: authKeyA,
          tokenHash: "fake_token_hash",
          expiresAt: null,
          // omitted isPublic to test default
        },
        Buffer.from("cloud binary content"),
      );

      assert.equal(
        stored.isPublic,
        false,
        "FileStore put without isPublic must default to isPublic: false",
      );
      assert.equal(stored.ownerKey, authKeyA);
    });
  });

  describe("4. Private Files Access Control (401 / 403 / 200)", () => {
    let privateFileToken = "";
    let privateFileId = "";

    before(async () => {
      // Put a private file in the store for User A
      const stored = await memoryStore.put(
        {
          name: "alice_classified.pdf",
          contentType: "application/pdf",
          ownerKey: authKeyA,
          tokenHash: "hash_alice_classified",
          expiresAt: null,
          isPublic: false,
        },
        Buffer.from("%PDF-1.4 Alice Classified Document Content"),
      );
      privateFileId = stored.id;
      const share = fileShareRegistry.ensureFileShare({
        fileId: stored.id,
        name: stored.name,
        source: "store",
        ownerKey: authKeyA,
        isPublic: false,
      });
      privateFileToken = share.shareToken;
    });

    test("Unauthenticated access to private file returns 401 Unauthorized", async () => {
      const resShare = await fetch(
        `${baseUrl}/store/share/${privateFileToken}`,
      );
      assert.equal(resShare.status, 401);
      assert.match(await resShare.text(), /Access denied/);

      const resDownload = await fetch(
        `${baseUrl}/store/download/${privateFileToken}`,
      );
      assert.equal(resDownload.status, 401);
    });

    test("Different authenticated user (User B) accessing User A's private file returns 403 Forbidden", async () => {
      const resShare = await fetch(
        `${baseUrl}/store/share/${privateFileToken}`,
        {
          headers: { Cookie: cookieUserB },
        },
      );
      assert.equal(resShare.status, 403);
      assert.match(await resShare.text(), /Forbidden/);

      const resDownload = await fetch(
        `${baseUrl}/store/download/${privateFileToken}`,
        {
          headers: { Cookie: cookieUserB },
        },
      );
      assert.equal(resDownload.status, 403);
    });

    test("Owner (User A) accessing private file returns 200 OK with content", async () => {
      const resShare = await fetch(
        `${baseUrl}/store/share/${privateFileToken}`,
        {
          headers: { Cookie: cookieUserA },
        },
      );
      assert.equal(resShare.status, 200);
      assert.match(
        await resShare.text(),
        /%PDF-1.4 Alice Classified Document Content/,
      );

      const resDownload = await fetch(
        `${baseUrl}/store/download/${privateFileToken}`,
        {
          headers: { Cookie: cookieUserA },
        },
      );
      assert.equal(resDownload.status, 200);
      assert.equal(
        resDownload.headers.get("content-disposition")?.includes("attachment"),
        true,
      );
    });
  });

  describe("5. Public Files Access Verification (Anonymous & Multi-User 200)", () => {
    let publicFileToken = "";
    let publicFileId = "";

    before(async () => {
      const stored = await memoryStore.put(
        {
          name: "public_whitepaper.txt",
          contentType: "text/plain",
          ownerKey: authKeyA,
          tokenHash: "hash_whitepaper",
          expiresAt: null,
          isPublic: true,
        },
        Buffer.from("Public Krix Research Whitepaper 2026"),
      );
      publicFileId = stored.id;
      const share = fileShareRegistry.ensureFileShare({
        fileId: stored.id,
        name: stored.name,
        source: "store",
        ownerKey: authKeyA,
        isPublic: true,
      });
      publicFileToken = share.shareToken;
    });

    test("Anyone can view or download public file without authentication", async () => {
      const resShare = await fetch(`${baseUrl}/store/share/${publicFileToken}`);
      assert.equal(resShare.status, 200);
      assert.equal(
        await resShare.text(),
        "Public Krix Research Whitepaper 2026",
      );

      const resDownload = await fetch(
        `${baseUrl}/store/download/${publicFileToken}`,
      );
      assert.equal(resDownload.status, 200);
      assert.equal(
        await resDownload.text(),
        "Public Krix Research Whitepaper 2026",
      );
    });

    test("User B can also download the public file cleanly", async () => {
      const resDownload = await fetch(
        `${baseUrl}/store/download/${publicFileToken}`,
        {
          headers: { Cookie: cookieUserB },
        },
      );
      assert.equal(resDownload.status, 200);
      assert.equal(
        await resDownload.text(),
        "Public Krix Research Whitepaper 2026",
      );
    });
  });

  describe("6. Mutating Operations Strictly Reject Non-Owners with 403/404", () => {
    let targetStoreFileId = "";
    let targetSandboxFileName = "alice_protected_sandbox.txt";
    let targetSbxId = "";

    beforeEach(async () => {
      // Create a store file owned by Alice
      const stored = await memoryStore.put(
        {
          name: "alice_contract.txt",
          contentType: "text/plain",
          ownerKey: authKeyA,
          tokenHash: "hash_alice_contract_" + Date.now(),
          expiresAt: new Date(Date.now() + 86400_000),
          isPublic: false,
        },
        Buffer.from("Contract signed by Alice"),
      );
      targetStoreFileId = stored.id;
      fileShareRegistry.ensureFileShare({
        fileId: stored.id,
        name: stored.name,
        source: "store",
        ownerKey: authKeyA,
        isPublic: false,
      });

      // Create a sandbox file owned by Alice
      const sbxDir = path.join(rootA, UPLOAD_DIR);
      fs.mkdirSync(sbxDir, { recursive: true });
      fs.writeFileSync(
        path.join(sbxDir, targetSandboxFileName),
        "Alice Private Sandbox Bytes",
      );
      targetSbxId = `sbx_${Buffer.from(targetSandboxFileName).toString("hex").slice(0, 16)}`;
      fileShareRegistry.ensureFileShare({
        fileId: targetSbxId,
        name: targetSandboxFileName,
        source: "sandbox",
        sandboxPath: path.join(sbxDir, targetSandboxFileName),
        ownerKey: authKeyA,
        isPublic: false,
      });
    });

    test("Toggle Privacy: unauthenticated returns 401; non-owner returns 403; owner returns 200", async () => {
      // 1. Unauthenticated
      const resUnauth = await fetch(
        `${baseUrl}/store/files/${targetStoreFileId}/privacy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: baseUrl,
          },
          body: JSON.stringify({ isPublic: true }),
        },
      );
      assert.equal(resUnauth.status, 401);

      // 2. Non-owner (User B) on store file
      const resB = await fetch(
        `${baseUrl}/store/files/${targetStoreFileId}/privacy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: baseUrl,
            Cookie: cookieUserB,
          },
          body: JSON.stringify({ isPublic: true }),
        },
      );
      assert.equal(resB.status, 403);
      assert.match(await resB.text(), /Forbidden/);

      // 3. Non-owner (User B) on sandbox file
      const resB_sbx = await fetch(
        `${baseUrl}/store/files/${targetSbxId}/privacy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: baseUrl,
            Cookie: cookieUserB,
          },
          body: JSON.stringify({ isPublic: true }),
        },
      );
      assert.equal(resB_sbx.status, 403);

      // 4. Owner (User A) toggles privacy successfully
      const resA = await fetch(
        `${baseUrl}/store/files/${targetStoreFileId}/privacy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: baseUrl,
            Cookie: cookieUserA,
          },
          body: JSON.stringify({ isPublic: true }),
        },
      );
      assert.equal(resA.status, 200);
      const dataA = (await resA.json()) as any;
      assert.equal(dataA.success, true);
      assert.equal(dataA.isPublic, true);
    });

    test("Delete Store File: non-owner rejected; owner permitted", async () => {
      // Non-owner (User B) attempt to delete
      const resB = await fetch(`${baseUrl}/store/files/${targetStoreFileId}`, {
        method: "DELETE",
        headers: {
          Origin: baseUrl,
          Cookie: cookieUserB,
        },
      });
      assert.ok(
        resB.status === 403 || resB.status === 404,
        "Non-owner must receive 403 or 404 on delete attempt",
      );

      // File must still exist in memory store
      const fileStillThere = await memoryStore.openById(
        authKeyA,
        targetStoreFileId,
      );
      assert.ok(fileStillThere, "File must not be deleted by User B");

      // Owner (User A) deletes successfully
      const resA = await fetch(`${baseUrl}/store/files/${targetStoreFileId}`, {
        method: "DELETE",
        headers: {
          Origin: baseUrl,
          Cookie: cookieUserA,
        },
      });
      assert.equal(resA.status, 200);
      assert.equal(((await resA.json()) as any).success, true);

      // Verify file is gone
      const fileGone = await memoryStore.openById(authKeyA, targetStoreFileId);
      assert.equal(fileGone, null);
    });

    test("Rename Store File: non-owner rejected; owner permitted", async () => {
      // Non-owner (User B) attempt to rename
      const resB = await fetch(
        `${baseUrl}/store/files/${targetStoreFileId}/rename`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Origin: baseUrl,
            Cookie: cookieUserB,
          },
          body: JSON.stringify({ name: "malicious_rename.txt" }),
        },
      );
      assert.ok(
        resB.status === 403 || resB.status === 404,
        "Non-owner rename must be rejected with 403 or 404",
      );

      // Owner (User A) renames successfully
      const resA = await fetch(
        `${baseUrl}/store/files/${targetStoreFileId}/rename`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Origin: baseUrl,
            Cookie: cookieUserA,
          },
          body: JSON.stringify({ name: "alice_contract_v2.txt" }),
        },
      );
      assert.equal(resA.status, 200);
      const renamed = await memoryStore.openById(authKeyA, targetStoreFileId);
      assert.equal(renamed?.name, "alice_contract_v2.txt");
    });

    test("Make Permanent & Revert: non-owner rejected; owner permitted", async () => {
      // Non-owner (User B) attempt makePermanent
      const resB_perm = await fetch(
        `${baseUrl}/store/permanent/${targetStoreFileId}`,
        {
          method: "POST",
          headers: {
            Origin: baseUrl,
            Cookie: cookieUserB,
          },
        },
      );
      assert.equal(
        resB_perm.status,
        404,
        "Non-owner must be rejected with 404 on makePermanent",
      );

      // Non-owner (User B) attempt revertPermanent
      const resB_revert = await fetch(
        `${baseUrl}/store/revert-permanent/${targetStoreFileId}`,
        {
          method: "POST",
          headers: {
            Origin: baseUrl,
            Cookie: cookieUserB,
          },
        },
      );
      assert.equal(
        resB_revert.status,
        404,
        "Non-owner must be rejected with 404 on revertPermanent",
      );

      // Owner (User A) makePermanent succeeds
      const resA_perm = await fetch(
        `${baseUrl}/store/permanent/${targetStoreFileId}`,
        {
          method: "POST",
          headers: {
            Origin: baseUrl,
            Cookie: cookieUserA,
          },
        },
      );
      assert.equal(resA_perm.status, 200);
      assert.equal(((await resA_perm.json()) as any).permanent, true);

      // Owner (User A) revertPermanent succeeds
      const resA_revert = await fetch(
        `${baseUrl}/store/revert-permanent/${targetStoreFileId}`,
        {
          method: "POST",
          headers: {
            Origin: baseUrl,
            Cookie: cookieUserA,
          },
        },
      );
      assert.equal(resA_revert.status, 200);
      assert.equal(((await resA_revert.json()) as any).permanent, false);
    });

    test("FileStore rejects wildcard '*' caller on mutating operations", async () => {
      assert.equal(
        await memoryStore.makePermanent("*", targetStoreFileId),
        false,
        "makePermanent with '*' must be rejected",
      );
      assert.equal(
        await memoryStore.revertPermanent("*", targetStoreFileId),
        false,
        "revertPermanent with '*' must be rejected",
      );
      assert.equal(
        await memoryStore.rename("*", targetStoreFileId, "newName.txt"),
        false,
        "rename with '*' must be rejected",
      );
      assert.equal(
        await memoryStore.deleteOwned("*", targetStoreFileId),
        false,
        "deleteOwned with '*' must be rejected",
      );
      assert.equal(
        await memoryStore.deleteManyOwned("*", [targetStoreFileId]),
        0,
        "deleteManyOwned with '*' must be rejected",
      );
      assert.equal(
        await memoryStore.deleteAllOwned("*"),
        0,
        "deleteAllOwned with '*' must be rejected",
      );
    });
  });
});
