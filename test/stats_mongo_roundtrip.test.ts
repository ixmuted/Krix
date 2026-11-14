import { test, describe } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { StatsTracker } from "../src/stats.js";

// Minimal in-memory stand-in for a MongoDB Db with one collection API surface used by stats.
function fakeDb() {
  const docs = new Map<string, any>();
  let writes = 0;
  const collection = () => ({
    findOne: async (q: any) => docs.get(String(q._id)) ?? null,
    updateOne: async (q: any, u: any) => {
      writes++;
      docs.set(String(q._id), { ...(docs.get(String(q._id)) || {}), ...structuredClone(u.$set) });
      return {};
    },
  });
  return { db: { collection } as any, docs, writes: () => writes };
}

function tmp(name: string) {
  return path.join(os.tmpdir(), `krix_stats_${name}_${process.pid}_${Date.now()}.json`);
}

describe("Stats survive a MongoDB save/restore cycle", () => {
  test("tool calls, errors and per-key data are restored by a fresh tracker", async () => {
    const m = fakeDb();
    const a: any = new StatsTracker(tmp("a"));
    a.mongoDb = m.db; a.mongoConnected = true; a.mongoLoaded = true;
    for (let i = 0; i < 3; i++) a.recordRequest({ keyId: "k1", label: "Key One", type: "api_key", toolName: "grep", isActualTool: true, durationMs: 12, statusCode: 200 });
    a.recordRequest({ keyId: "k1", label: "Key One", type: "api_key", toolName: "get_me", isActualTool: true, durationMs: 30, statusCode: 500, isError: true, errorMessage: "boom" });
    await a.flush();
    assert.ok(m.docs.get("global_stats"), "stats document must be written to MongoDB");

    const b: any = new StatsTracker(tmp("b"));
    b.mongoDb = m.db;
    await b.loadFromMongo();
    b.mongoConnected = true;
    assert.equal(b.mongoLoaded, true);
    assert.equal(b.globalTools.grep, 3);
    assert.equal(b.globalTools.get_me, 1);
    const k = b.keys.get("k1");
    assert.ok(k, "per-key metrics restored");
    assert.equal(k.toolCalls.grep, 3);
    assert.equal(k.errorCount, 1);
  });

  test("a tracker that has not read MongoDB yet never overwrites the stored stats", async () => {
    const m = fakeDb();
    m.docs.set("global_stats", { _id: "global_stats", keys: [], globalTools: { grep: 99 } });
    const prev = { u: process.env.MONGODB_URI };
    const t: any = new StatsTracker(tmp("c")); // built before MONGODB_URI is set: no real connection attempt
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/unreachable";
    try {
      t.mongoDb = m.db; t.mongoConnected = true; t.mongoLoaded = false; // connected but not loaded
      t.recordRequest({ keyId: "k2", toolName: "grep", isActualTool: true, durationMs: 5, statusCode: 200 });
      await t.persist().catch(() => {});
      assert.equal(m.docs.get("global_stats").globalTools.grep, 99, "stored stats must be untouched");
    } finally {
      if (prev.u === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = prev.u;
    }
  });
});
