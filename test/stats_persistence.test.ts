import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { StatsTracker } from "../src/stats.js";

test("per-key status codes and client ecosystems survive a restart and drop with deleted keys", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "krix-stats-persist-"));
  const file = path.join(dir, "stats.json");
  const a = new StatsTracker(file);
  a.recordRequest({ keyId: "k1", label: "Gemini key", durationMs: 5, statusCode: 200, userAgent: "gemini" });
  a.recordRequest({ keyId: "k1", label: "Gemini key", durationMs: 5, statusCode: 400, userAgent: "gemini" });
  a.recordRequest({ keyId: "k2", label: "ChatGPT key", durationMs: 5, statusCode: 200, userAgent: "openai" });
  await a.flush().catch(() => {});

  const b = new StatsTracker(file);
  const s = b.getSummary();
  assert.equal(s.totalRequests, 3);
  assert.equal(s.statusCodes["200"], 2);
  assert.equal(s.statusCodes["400"], 1);
  assert.equal(s.clientEcosystems["Google Gemini"], 2);
  assert.equal(s.clientEcosystems["ChatGPT"], 1);

  b.removeKey("k1");
  const after = b.getSummary();
  assert.equal(after.statusCodes["200"], 1);
  assert.equal(after.statusCodes["400"], 0);
  assert.equal(after.clientEcosystems["Google Gemini"], 0);
  await b.flush().catch(() => {});

  const c = new StatsTracker(file);
  assert.equal(c.getSummary().statusCodes["400"], 0);
  assert.equal(c.getSummary().totalRequests, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});
