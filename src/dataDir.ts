import path from "node:path";

/**
 * Where Krix keeps its small state files (keys, settings, OAuth, stats, ...).
 * Defaults to ./data. KRIX_DATA_DIR overrides it; `npm test` points it at a throwaway
 * folder so test runs never touch (or pile up in) the real ./data.
 */
export function dataPath(...parts: string[]): string {
  const base = process.env.KRIX_DATA_DIR
    ? path.resolve(process.env.KRIX_DATA_DIR)
    : path.resolve(process.cwd(), "data");
  return path.join(base, ...parts);
}
