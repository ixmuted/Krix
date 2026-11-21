import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { registerGitHubTools } from "../src/githubTools.js";

const FILES: Record<string, string> = {
  "README.md": "# Demo\nfile expiry is 72 hours\n",
  "src/fileShare.ts": "export const a = 1;\nfunction sweepExpired() {}\nsweeperTimer = setInterval(run, 600000);\nconst expiresAt = null;\n",
  "src/uploadSessions.ts": "const retentionMs = 60;\nsetInterval(() => {}, 1000);\nconst EXPIRESAT = 1;\n",
  "src/deep/nested.js": "// ttlHours here\nlet x = 1;\n",
  "assets/logo.png": "\u0000PNG",
  "data.bin": "a\u0000b",
  "big.txt": "needle in a large file\n",
};
const LARGE = new Set(["big.txt"]);
const b64 = (t: string) => Buffer.from(t, "utf-8").toString("base64");
const sha = (p: string) => `sha:${p}`;
const calls: string[] = [];

function fakeOctokit() {
  const notFound = () => Object.assign(new Error("Not Found"), { status: 404 });
  return {
    repos: {
      get: async ({ repo }: any) => (calls.push("repos.get"), { data: { default_branch: "live", name: repo } }),
      getContent: async ({ path, ref }: any) => {
        calls.push(`getContent:${path}@${ref}`);
        if (ref !== "live" && ref !== "dev") throw notFound();
        if (path in FILES) {
          const large = LARGE.has(path);
          return { data: { type: "file", path, sha: sha(path), size: FILES[path].length, encoding: large ? "none" : "base64", content: large ? "" : b64(FILES[path]) } };
        }
        const prefix = path ? path + "/" : "";
        const kids = new Map<string, any>();
        for (const f of Object.keys(FILES)) {
          if (!f.startsWith(prefix)) continue;
          const rest = f.slice(prefix.length);
          const name = rest.split("/")[0];
          kids.set(name, rest.includes("/") ? { type: "dir", name, path: prefix + name } : { type: "file", name, path: f, size: FILES[f].length });
        }
        if (!kids.size) throw notFound();
        return { data: [...kids.values()] };
      },
      listForAuthenticatedUser: async () => ({ data: [{ name: "Krix", full_name: "ixmuted/Krix", default_branch: "live" }] }),
      listBranches: async ({ per_page }: any) => ({ data: [{ name: "live", commit: { sha: "b9ec883aaaa" } }].slice(0, per_page) }),
    },
    git: {
      getTree: async ({ tree_sha }: any) => {
        if (tree_sha !== "live" && tree_sha !== "dev") throw notFound();
        return { data: { tree: Object.keys(FILES).map((p) => ({ type: "blob", path: p, sha: sha(p), size: FILES[p].length })) } };
      },
      getBlob: async ({ file_sha }: any) => {
        const p = file_sha.slice(4);
        return { data: { content: b64(FILES[p]), encoding: "base64" } };
      },
    },
    pulls: { create: async (a: any) => (calls.push(`pulls.create base=${a.base}`), { data: { number: 7 } }) },
    search: { repos: async () => (calls.push("search.repos"), { data: { items: [], total_count: 0 } }) },
  } as any;
}

function setup(sessionId: string) {
  const handlers: Record<string, any> = {};
  const server = { registerTool: (n: string, _c: any, h: any) => ((handlers[n] = h), {}) };
  registerGitHubTools(server as any, fakeOctokit(), sessionId, {});
  const run = async (name: string, args: any) => {
    const res = await handlers[name]({ owner: "ixmuted", repo: "Krix", ...args });
    return res.content.map((c: any) => c.text).join("\n") as string;
  };
  return { run };
}

describe("GitHub tool fixes", () => {
  test("grep: regex alternation works repo-wide on a branch that is not main", async () => {
    const { run } = setup("gh-fix-1");
    const out = await run("grep", { pattern: "sweepExpired|setInterval", ref: "live" });
    assert.match(out, /File: src\/fileShare\.ts/);
    assert.match(out, /File: src\/uploadSessions\.ts/);
    assert.match(out, /L3 \| sweeperTimer = setInterval/);
  });

  test("grep: no ref falls back to the repo default branch (live), not 'main'", async () => {
    const { run } = setup("gh-fix-2");
    const out = await run("grep", { pattern: "ttlHours" });
    assert.match(out, /src\/deep\/nested\.js/);
    assert.match(out, /@ live/);
  });

  test("grep: directory path, glob, type, case flag", async () => {
    const { run } = setup("gh-fix-3");
    const dir = await run("grep", { pattern: "expiresat", path: "src", output_mode: "files_with_matches" });
    assert.match(dir, /src\/fileShare\.ts/);
    assert.match(dir, /src\/uploadSessions\.ts/);
    const sens = await run("grep", { pattern: "expiresat", path: "src", case_insensitive: false });
    assert.match(sens, /No matches found/);
    const byType = await run("grep", { pattern: "ttlHours", type: "js", output_mode: "files_with_matches" });
    assert.match(byType, /nested\.js/);
    const byGlob = await run("grep", { pattern: "setInterval", glob: "src/*.ts", output_mode: "count" });
    assert.match(byGlob, /2 match\(es\) in 2 file\(s\)/);
    const globNone = await run("grep", { pattern: "setInterval", glob: "*.js", output_mode: "count" });
    assert.match(globNone, /No matches found/);
  });

  test("grep: context lines, pagination and single-file path", async () => {
    const { run } = setup("gh-fix-4");
    const ctx = await run("grep", { pattern: "sweepExpired", path: "src/fileShare.ts", context_before: 1, context_after: 1 });
    assert.match(ctx, /L1 \| export const a/);
    assert.match(ctx, />> L2 \| function sweepExpired/);
    assert.match(ctx, /L3 \| sweeperTimer/);
    const p1 = await run("grep", { pattern: "e", path: "src", limit: 2 });
    assert.match(p1, /use offset=2 for more/);
    const p2 = await run("grep", { pattern: "e", path: "src", limit: 2, offset: 2 });
    assert.doesNotMatch(p2, /use offset=2 for more/);
  });

  test("grep: skips binary files, reads >1MB-style blobs, invalid regex becomes literal", async () => {
    const { run } = setup("gh-fix-5");
    const all = await run("grep", { pattern: "PNG|a.b", output_mode: "files_with_matches" });
    assert.match(all, /No matches found/);
    const big = await run("grep", { pattern: "needle", path: "big.txt" });
    assert.match(big, /L1 \| needle in a large file/);
    const bad = await run("grep", { pattern: "foo(", output_mode: "count" });
    assert.match(bad, /searched as plain text/);
    const missing = await run("grep", { pattern: "x", path: "nope" });
    assert.match(missing, /No files found at path 'nope'/);
  });

  test("grep: catastrophic regex is cut off instead of hanging the server", async () => {
    const { run } = setup("gh-fix-6");
    FILES["evil.txt"] = "a".repeat(40) + "!\n";
    const t0 = Date.now();
    const out = await run("grep", { pattern: "^(a+)+$", path: "evil.txt" });
    delete FILES["evil.txt"];
    assert.ok(Date.now() - t0 < 5000, "must return quickly");
    assert.match(out, /regex too slow/);
  });

  test("get_file_contents: lists directories, works with no ref, reads empty-content (large) files", async () => {
    const { run } = setup("gh-fix-7");
    const dir = await run("get_file_contents", { path: "src" });
    assert.match(dir, /Directory 'src' @ live/);
    assert.match(dir, /\[D\] src\/deep/);
    assert.match(dir, /\[F\] src\/fileShare\.ts/);
    const root = await run("get_file_contents", { path: "" });
    assert.match(root, /\[F\] README\.md/);
    const big = await run("get_file_contents", { path: "big.txt" });
    assert.match(big, /needle in a large file/);
  });

  test("git_tree: defaults to the repo default branch", async () => {
    const { run } = setup("gh-fix-8");
    const out = await run("git_tree", { q: "src" });
    assert.match(out, /\[F\] src\/fileShare\.ts/);
  });

  test("create_pull_request: base defaults to the repo default branch", async () => {
    const { run } = setup("gh-fix-10");
    calls.length = 0;
    await run("create_pull_request", { title: "t", head: "dev" });
    assert.ok(calls.includes("pulls.create base=live"));
  });
});
