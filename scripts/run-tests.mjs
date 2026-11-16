// Runs the test suite with KRIX_DATA_DIR pointed at a throwaway folder so tests never read or
// write the real ./data (which used to pile up keys/settings and break later runs).
// Usage: npm test            -> every test/*.test.ts
//        npm test -- test/x.test.ts   -> just those files
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const args = process.argv.slice(2);
const files = args.length
  ? args
  : fs
      .readdirSync(path.join(root, "test"))
      .filter((f) => f.endsWith(".test.ts"))
      .sort()
      .map((f) => path.join("test", f));

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "krix-test-data-"));
const cleanup = () => fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

const child = spawn(process.execPath, [tsxCli, "--test", ...files], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, KRIX_DATA_DIR: dataDir },
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code, signal) => {
  cleanup();
  process.exit(code ?? (signal ? 1 : 0));
});
