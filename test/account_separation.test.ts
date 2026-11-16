import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { StatsTracker } from "../src/stats.js";
import { fileShareRegistry } from "../src/fileShareRegistry.js";

test("StatsTracker.getSummary and loadHistoricalChunk strictly isolate per-user telemetry", async () => {
  const tmpFile = path.join(
    os.tmpdir(),
    `krix-stats-iso-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  const tracker = new StatsTracker(tmpFile);

  // User A activity
  tracker.recordRequest({
    keyId: "key-user-a",
    label: "User A Key",
    type: "api_key",
    toolName: "sandbox_exec",
    isActualTool: true,
    durationMs: 120,
    statusCode: 200,
    bytesIn: 100,
    bytesOut: 200,
    userAgent: "Cursor/1.0",
  });

  // User B activity (with error and different tool)
  tracker.recordRequest({
    keyId: "key-user-b",
    label: "User B Key",
    type: "api_key",
    toolName: "delete_file",
    isActualTool: true,
    durationMs: 950,
    isError: true,
    statusCode: 500,
    errorMessage: "Secret error from User B",
    bytesIn: 500,
    bytesOut: 50,
    userAgent: "Claude Desktop/1.0",
  });
  tracker.recordRequest({
    keyId: "key-user-b",
    label: "User B Key",
    type: "api_key",
    toolName: "tools/list",
    isActualTool: false,
    durationMs: 40,
    statusCode: 200,
  });

  const allowedA = new Set(["key-user-a"]);
  const summaryA = tracker.getSummary(
    undefined,
    "",
    false,
    undefined,
    allowedA,
    1,
  );

  // User A must only see their own requests, tools, throughput, streams, errors, and timelines
  assert.equal(summaryA.totalRequests, 1);
  assert.equal(summaryA.totalErrors, 0);
  assert.equal(summaryA.activeHttpSessions, 1);
  assert.deepEqual(summaryA.toolDistribution, { sandbox_exec: 1 });
  assert.equal(summaryA.toolDistribution["delete_file"], undefined);
  assert.equal(summaryA.recentErrors.length, 0);
  assert.deepEqual(summaryA.protocolDistribution, {});

  const totalDailyReqsA = summaryA.dailyTimeline.reduce(
    (sum, d) => sum + d.requests,
    0,
  );
  const totalDailyToolsA = summaryA.dailyTimeline.reduce(
    (sum, d) => sum + d.tools,
    0,
  );
  const totalDailyErrsA = summaryA.dailyTimeline.reduce(
    (sum, d) => sum + d.errors,
    0,
  );
  assert.equal(totalDailyReqsA, 1);
  assert.equal(totalDailyToolsA, 1);
  assert.equal(totalDailyErrsA, 0);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const chunkA = await tracker.loadHistoricalChunk(monthKey, allowedA);
  const chunkReqsA = Object.values(chunkA).reduce(
    (sum, d) => sum + (d.requests || 0),
    0,
  );
  assert.equal(chunkReqsA, 1);

  try {
    fs.unlinkSync(tmpFile);
  } catch {}
});

test("fileShareRegistry refuses cross-account ownerKey hijacking", () => {
  const fileId = `sbx_test_${Date.now()}`;
  fileShareRegistry.ensureFileShare({
    fileId,
    name: "shared-name.txt",
    source: "sandbox",
    ownerKey: "owner-key-a",
    isPublic: false,
  });

  assert.throws(() => {
    fileShareRegistry.ensureFileShare({
      fileId,
      name: "shared-name.txt",
      source: "sandbox",
      ownerKey: "owner-key-b",
      isPublic: false,
    });
  }, /Forbidden/);

  assert.throws(() => {
    fileShareRegistry.togglePrivacy(fileId, true, "owner-key-b");
  }, /Forbidden/);

  fileShareRegistry.removeFile(fileId);
});
