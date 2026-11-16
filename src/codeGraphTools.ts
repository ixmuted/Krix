import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  formatOptimizedResponse,
  formatError,
  getToolAnnotations,
  makeRegistrar,
  getAuthKeyForSession,
  sandboxRootForAuthKey,
  getSessionContext,
} from "./security.js";
import { assertInsideRealRoot, ensureSandboxRoot } from "./sandboxProc.js";

export interface CodeGraphToolMeta {
  name: string;
  category: "Code Graph" | "Search" | "Sandbox";
  description: string;
  readOnly: boolean;
}

export const CODE_GRAPH_TOOLS_CATALOG: CodeGraphToolMeta[] = [
  {
    name: "add_code_to_graph",
    category: "Code Graph",
    description:
      "Performs a one-time scan of a local folder to add its code to the graph. Returns a job ID for background processing.",
    readOnly: false,
  },
  {
    name: "check_job_status",
    category: "Code Graph",
    description:
      "Check the status and progress of a background CGC indexing job.",
    readOnly: true,
  },
  {
    name: "list_jobs",
    category: "Code Graph",
    description:
      "List recent indexing background jobs and their execution status.",
    readOnly: true,
  },
  {
    name: "find_code",
    category: "Code Graph",
    description:
      "Search for code elements by name, pattern, AST type, decorator, argument, or variable in the indexed graph.",
    readOnly: true,
  },
  {
    name: "analyze_code_relationships",
    category: "Code Graph",
    description:
      "Analyze code relationships like callers, callees, importers, class hierarchy, overrides, dead code, or call chains.",
    readOnly: true,
  },
  {
    name: "watch_directory",
    category: "Code Graph",
    description:
      "Continuously monitors a directory and keeps the code graph updated with live filesystem changes.",
    readOnly: false,
  },
  {
    name: "execute_cypher_query",
    category: "Code Graph",
    description: "Execute a custom Cypher query on the code graph database.",
    readOnly: false,
  },
  {
    name: "add_package_to_graph",
    category: "Code Graph",
    description:
      "Add a package to the code graph with specified programming language.",
    readOnly: false,
  },
  {
    name: "find_dead_code",
    category: "Code Graph",
    description:
      "Identify unused functions and unreachable code paths across the indexed repository.",
    readOnly: true,
  },
  {
    name: "calculate_cyclomatic_complexity",
    category: "Code Graph",
    description:
      "Calculate cyclomatic complexity and risk metrics for a specific function.",
    readOnly: true,
  },
  {
    name: "find_most_complex_functions",
    category: "Code Graph",
    description:
      "Find top functions with highest cyclomatic complexity to guide refactoring.",
    readOnly: true,
  },
  {
    name: "list_indexed_repositories",
    category: "Code Graph",
    description:
      "List all indexed repositories currently present in the graph database.",
    readOnly: true,
  },
  {
    name: "delete_repository",
    category: "Code Graph",
    description:
      "DESTRUCTIVE AND IRREVERSIBLE. Permanently deletes a repository and its nodes from the graph.",
    readOnly: false,
  },
  {
    name: "visualize_graph_query",
    category: "Code Graph",
    description:
      "Generate an interactive visualization URL for a Cypher query.",
    readOnly: true,
  },
  {
    name: "list_watched_paths",
    category: "Code Graph",
    description:
      "List all directories currently monitored for live graph updates.",
    readOnly: true,
  },
  {
    name: "unwatch_directory",
    category: "Code Graph",
    description: "Stop watching a directory for live graph updates.",
    readOnly: false,
  },
  {
    name: "load_bundle",
    category: "Code Graph",
    description: "Load a pre-indexed graph bundle (.cgc) into the database.",
    readOnly: false,
  },
  {
    name: "search_registry_bundles",
    category: "Code Graph",
    description: "Search available pre-indexed bundles in the CGC registry.",
    readOnly: true,
  },
  {
    name: "get_repository_stats",
    category: "Code Graph",
    description:
      "Get node and relationship statistics for an indexed repository.",
    readOnly: true,
  },
  {
    name: "discover_codegraph_contexts",
    category: "Code Graph",
    description: "Discover all available CodeGraphContext environments.",
    readOnly: true,
  },
  {
    name: "switch_context",
    category: "Code Graph",
    description: "Switch the active graph context.",
    readOnly: false,
  },
  {
    name: "list_graphs",
    category: "Code Graph",
    description: "List all graph names available in the backend database.",
    readOnly: true,
  },
  {
    name: "generate_report",
    category: "Code Graph",
    description:
      "Generate a CGC_REPORT.md with architectural metrics and god nodes.",
    readOnly: false,
  },
  {
    name: "find_java_spring_endpoints",
    category: "Code Graph",
    description: "Discover Java Spring REST endpoints and request mappings.",
    readOnly: true,
  },
  {
    name: "find_java_spring_beans",
    category: "Code Graph",
    description: "Find Java Spring beans and dependency relationships.",
    readOnly: true,
  },
  {
    name: "find_datasource_nodes",
    category: "Code Graph",
    description: "Find database nodes, Redis, Cassandra, and data sources.",
    readOnly: true,
  },
  {
    name: "simulate_metrics",
    category: "Code Graph",
    description:
      "Calculate repository architectural metrics (coupling, cohesion, complexity).",
    readOnly: true,
  },
  {
    name: "simulate_architectural_change",
    category: "Code Graph",
    description:
      "Simulate architectural modifications and compare against baseline metrics.",
    readOnly: true,
  },
  {
    name: "analyze_architectural_evolution",
    category: "Code Graph",
    description:
      "Analyze repository growth trend and identify Technical Debt Hotspots.",
    readOnly: true,
  },
  {
    name: "web_search",
    category: "Search",
    description:
      "Performs a fast, secure web search for a given query, returning titles, snippets, and source URLs.",
    readOnly: true,
  },
];

export const CODE_GRAPH_TOOL_NAMES = CODE_GRAPH_TOOLS_CATALOG.map(
  (t) => t.name,
);

// -----------------------------------------------------------------------------
// Per-User Isolated Code Graph Engine (Zero External CLI/DB Dependency)
// -----------------------------------------------------------------------------

type NodeLabel =
  | "Repository"
  | "File"
  | "Function"
  | "Class"
  | "Variable"
  | "Package"
  | "Endpoint"
  | "Bean"
  | "Datasource";

type EdgeType =
  | "CONTAINS"
  | "IMPORTS"
  | "CALLS"
  | "EXTENDS"
  | "DEFINES"
  | "USES_DATASOURCE"
  | "EXPOSES"
  | "INJECTS";

interface GraphNode {
  id: string;
  label: NodeLabel;
  name: string;
  repo: string;
  file?: string;
  line?: number;
  endLine?: number;
  language?: string;
  complexity?: number;
  params?: string[];
  decorators?: string[];
  exported?: boolean;
  isDependency?: boolean;
  loc?: number;
  // Endpoint / Bean / Datasource metadata
  httpMethod?: string;
  routePath?: string;
  handler?: string;
  beanType?: string;
  dsType?: string;
  extendsName?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
}

interface RepoMeta {
  name: string;
  path: string;
  indexedAt: number;
  fileCount: number;
  loc: number;
  languages: Record<string, number>;
  isDependency: boolean;
}

interface CodeGraphData {
  graphName: string;
  updatedAt: number;
  repos: Record<string, RepoMeta>;
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
}

interface IndexingJob {
  jobId: string;
  repoName: string;
  repoPath: string;
  graphName: string;
  status: "running" | "completed" | "failed";
  startedAt: number;
  completedAt?: number;
  filesProcessed: number;
  nodesCreated: number;
  edgesCreated: number;
  error?: string;
}

interface WatchEntry {
  repoPath: string;
  graphName: string;
  startedAt: number;
  watcher: fs.FSWatcher;
  debounceTimer?: NodeJS.Timeout;
}

interface UserGraphState {
  activeGraph: string;
  jobs: Map<string, IndexingJob>;
  watchers: Map<string, WatchEntry>;
}

const userStates = new Map<string, UserGraphState>();

function getUserState(authKey: string): UserGraphState {
  let st = userStates.get(authKey);
  if (!st) {
    st = {
      activeGraph: "default",
      jobs: new Map(),
      watchers: new Map(),
    };
    userStates.set(authKey, st);
  }
  return st;
}

function sanitizeGraphName(raw?: string): string {
  const clean = String(raw || "default")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  return clean || "default";
}

function graphDirForUser(root: string): string {
  return path.join(root, ".krix_codegraph");
}

function graphFilePath(root: string, graphName: string): string {
  return path.join(graphDirForUser(root), `${sanitizeGraphName(graphName)}.json`);
}

function loadGraph(root: string, graphName: string): CodeGraphData {
  const name = sanitizeGraphName(graphName);
  const fp = graphFilePath(root, name);
  if (fs.existsSync(fp)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(fp, "utf-8"));
      if (parsed && typeof parsed === "object" && parsed.nodes && parsed.edges) {
        return parsed as CodeGraphData;
      }
    } catch {
      /* fall through to fresh graph */
    }
  }
  return {
    graphName: name,
    updatedAt: Date.now(),
    repos: {},
    nodes: {},
    edges: [],
  };
}

function saveGraph(root: string, graph: CodeGraphData): void {
  const dir = graphDirForUser(root);
  fs.mkdirSync(dir, { recursive: true });
  graph.updatedAt = Date.now();
  fs.writeFileSync(
    graphFilePath(root, graph.graphName),
    JSON.stringify(graph, null, 2),
    "utf-8",
  );
}

async function resolveUserSandboxPath(
  sessionId: string,
  rawPath?: string,
): Promise<{ root: string; abs: string }> {
  const authKey = getAuthKeyForSession(sessionId);
  const root = sandboxRootForAuthKey(authKey);
  await ensureSandboxRoot(root);
  const ctx = getSessionContext(sessionId);
  const baseCwd = ctx.cwd || ctx.sandboxDir || root;

  const candidate =
    !rawPath || rawPath === "."
      ? baseCwd
      : path.isAbsolute(rawPath)
        ? rawPath
        : path.resolve(baseCwd, rawPath);

  await assertInsideRealRoot(root, candidate);
  return { root, abs: candidate };
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".krix_codegraph",
  "dist",
  "build",
  "out",
  "target",
  "__pycache__",
  ".venv",
  "venv",
  ".next",
  ".nuxt",
  "coverage",
]);

const EXT_LANG: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".py": "python",
  ".go": "go",
  ".java": "java",
  ".rs": "rust",
  ".rb": "ruby",
  ".php": "php",
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".hpp": "cpp",
};

function walkSourceFiles(dir: string, maxFiles = 2500): string[] {
  const results: string[] = [];
  const stack = [dir];
  while (stack.length > 0 && results.length < maxFiles) {
    const cur = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (ent.isSymbolicLink()) continue;
      if (ent.isDirectory()) {
        if (!SKIP_DIRS.has(ent.name) && !ent.name.startsWith(".")) {
          stack.push(path.join(cur, ent.name));
        }
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (EXT_LANG[ext]) {
          results.push(path.join(cur, ent.name));
          if (results.length >= maxFiles) break;
        }
      }
    }
  }
  return results;
}

function computeComplexityFromBody(body: string): number {
  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\belif\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\bexcept\b/g,
    /&&/g,
    /\|\|/g,
    /\band\b/g,
    /\bor\b/g,
    /\?[^:?\n]*:/g,
  ];
  let complexity = 1;
  for (const re of patterns) {
    const matches = body.match(re);
    if (matches) complexity += matches.length;
  }
  return complexity;
}

function extractBraceBlock(lines: string[], startIdx: number): { endIdx: number; body: string } {
  let depth = 0;
  let seenBrace = false;
  const collected: string[] = [];
  for (let i = startIdx; i < Math.min(lines.length, startIdx + 400); i++) {
    const line = lines[i];
    collected.push(line);
    for (const ch of line) {
      if (ch === "{") {
        depth++;
        seenBrace = true;
      } else if (ch === "}") {
        depth--;
      }
    }
    if (seenBrace && depth <= 0) {
      return { endIdx: i, body: collected.join("\n") };
    }
  }
  return { endIdx: Math.min(lines.length - 1, startIdx + 30), body: collected.join("\n") };
}

function extractPythonBlock(lines: string[], startIdx: number): { endIdx: number; body: string } {
  const defIndent = lines[startIdx].search(/\S|$/);
  const collected: string[] = [lines[startIdx]];
  let endIdx = startIdx;
  for (let i = startIdx + 1; i < Math.min(lines.length, startIdx + 400); i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) {
      collected.push(line);
      continue;
    }
    const indent = line.search(/\S|$/);
    if (indent <= defIndent) break;
    collected.push(line);
    endIdx = i;
  }
  return { endIdx, body: collected.join("\n") };
}

function parseParams(raw: string): string[] {
  return raw
    .split(",")
    .map((p) => p.trim().split(/[=:\s]/)[0].replace(/[^a-zA-Z0-9_$*]/g, ""))
    .filter((p) => p.length > 0 && p !== "self" && p !== "cls" && p !== "this");
}

function parseSourceFile(
  absPath: string,
  relPath: string,
  repoName: string,
  isDependency: boolean,
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  imports: string[];
  calls: Array<{ fromId: string; targetName: string }>;
  loc: number;
  language: string;
} {
  const ext = path.extname(absPath).toLowerCase();
  const language = EXT_LANG[ext] || "unknown";
  let content = "";
  try {
    const st = fs.statSync(absPath);
    if (st.size > 1024 * 1024) {
      return { nodes: [], edges: [], imports: [], calls: [], loc: 0, language };
    }
    content = fs.readFileSync(absPath, "utf-8");
  } catch {
    return { nodes: [], edges: [], imports: [], calls: [], loc: 0, language };
  }

  const lines = content.split(/\r?\n/);
  const fileId = `file:${repoName}:${relPath}`;
  const nodes: GraphNode[] = [
    {
      id: fileId,
      label: "File",
      name: path.basename(relPath),
      repo: repoName,
      file: relPath,
      language,
      loc: lines.length,
      isDependency,
    },
  ];
  const edges: GraphEdge[] = [
    { from: `repo:${repoName}`, to: fileId, type: "CONTAINS" },
  ];
  const imports: string[] = [];
  const calls: Array<{ fromId: string; targetName: string }> = [];

  // Collect decorators/annotations immediately preceding a line
  const pendingDecorators = (idx: number): string[] => {
    const decs: string[] = [];
    for (let k = idx - 1; k >= Math.max(0, idx - 5); k--) {
      const t = lines[k].trim();
      if (t.startsWith("@")) decs.unshift(t);
      else if (t === "" || t.startsWith("//") || t.startsWith("#")) continue;
      else break;
    }
    return decs;
  };

  // Imports
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const esImport = line.match(/^import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/);
    if (esImport) imports.push(esImport[1]);
    const reqImport = line.match(/require\(\s*["']([^"']+)["']\s*\)/);
    if (reqImport) imports.push(reqImport[1]);
    const pyImport = line.match(/^(?:from\s+([\w.]+)\s+import|import\s+([\w.,\s]+))/);
    if (pyImport) imports.push((pyImport[1] || pyImport[2] || "").split(",")[0].trim());
    const goImport = line.match(/^import\s+["']([^"']+)["']/);
    if (goImport) imports.push(goImport[1]);
    const javaImport = line.match(/^import\s+(?:static\s+)?([\w.]+);/);
    if (javaImport) imports.push(javaImport[1]);
  }

  // Datasource detection
  const dsMatchers: Array<{ re: RegExp; dsType: string; name: string }> = [
    { re: /\bmongoose\b|\bMongoClient\b|\bMONGODB_URI\b/i, dsType: "MongoDB", name: "MongoDB" },
    { re: /\bpg\b|\bpostgres\b|\bPool\b|\bPOSTGRES_URL\b/i, dsType: "PostgreSQL", name: "PostgreSQL" },
    { re: /\bmysql2?\b|\bMYSQL_URL\b/i, dsType: "MySQL", name: "MySQL" },
    { re: /\bioredis\b|\bcreateClient\b|\bREDIS_URL\b|\bredis\b/i, dsType: "Redis", name: "Redis" },
    { re: /\bcassandra-driver\b|\bCASSANDRA\b/i, dsType: "Cassandra", name: "Cassandra" },
    { re: /\bsqlite3?\b|\bbetter-sqlite3\b/i, dsType: "SQLite", name: "SQLite" },
    { re: /\bPrismaClient\b/i, dsType: "Prisma", name: "Prisma" },
  ];
  for (const ds of dsMatchers) {
    if (ds.re.test(content)) {
      const dsId = `ds:${repoName}:${ds.name}`;
      if (!nodes.some((n) => n.id === dsId)) {
        nodes.push({
          id: dsId,
          label: "Datasource",
          name: ds.name,
          repo: repoName,
          file: relPath,
          dsType: ds.dsType,
          isDependency,
        });
      }
      edges.push({ from: fileId, to: dsId, type: "USES_DATASOURCE" });
    }
  }

  // Classes / Interfaces / Structs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const classMatch = line.match(
      /^\s*(?:export\s+(?:default\s+)?)?(?:abstract\s+)?(?:public\s+|private\s+|protected\s+)?(?:class|interface|struct)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+(?:extends|implements|:)\s+([A-Za-z0-9_,\s.<>]+))?/,
    );
    if (classMatch) {
      const clsName = classMatch[1];
      const decs = pendingDecorators(i);
      const clsId = `class:${repoName}:${relPath}:${clsName}`;
      const extendsRaw = classMatch[2]?.split(/[,\s<(]/)[0]?.trim();
      nodes.push({
        id: clsId,
        label: "Class",
        name: clsName,
        repo: repoName,
        file: relPath,
        line: i + 1,
        language,
        decorators: decs,
        exported: /\bexport\b|\bpublic\b/.test(line),
        extendsName: extendsRaw || undefined,
        isDependency,
      });
      edges.push({ from: fileId, to: clsId, type: "DEFINES" });

      // Java Spring Bean detection
      const beanDec = decs.find((d) =>
        /@(Service|Component|Repository|Controller|RestController|Configuration)\b/.test(d),
      );
      if (beanDec) {
        const beanId = `bean:${repoName}:${clsName}`;
        nodes.push({
          id: beanId,
          label: "Bean",
          name: clsName,
          repo: repoName,
          file: relPath,
          line: i + 1,
          beanType: beanDec.replace(/^@/, "").split("(")[0],
          isDependency,
        });
        edges.push({ from: fileId, to: beanId, type: "DEFINES" });
      }
    }
  }

  // Functions & Methods
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let fnName: string | null = null;
    let paramsStr = "";
    let exported = /\bexport\b|\bpublic\b/.test(line);

    if (language === "python") {
      const m = line.match(/^\s*(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/);
      if (m) {
        fnName = m[1];
        paramsStr = m[2];
        exported = !fnName.startsWith("_");
      }
    } else if (language === "go") {
      const m = line.match(/^\s*func\s+(?:\([^)]*\)\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/);
      if (m) {
        fnName = m[1];
        paramsStr = m[2];
        exported = /^[A-Z]/.test(fnName);
      }
    } else if (language === "rust") {
      const m = line.match(/^\s*(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:<[^>]*>)?\s*\(([^)]*)\)/);
      if (m) {
        fnName = m[1];
        paramsStr = m[2];
        exported = /\bpub\b/.test(line);
      }
    } else if (language === "java") {
      const m = line.match(
        /^\s*(?:public|private|protected)?\s*(?:static\s+|final\s+|synchronized\s+)*(?:[\w<>\[\]]+\s+)([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\{/,
      );
      if (m && !["if", "for", "while", "switch", "catch"].includes(m[1])) {
        fnName = m[1];
        paramsStr = m[2];
      }
    } else {
      const m1 = line.match(
        /^\s*(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:<[^>]*>)?\s*\(([^)]*)\)/,
      );
      const m2 = line.match(
        /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*(?::[^=]+)?=>/,
      );
      const m3 = line.match(
        /^\s*(?:public|private|protected|static|async|\s)*([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\{/,
      );
      const m = m1 || m2 || m3;
      if (
        m &&
        !["if", "for", "while", "switch", "catch", "constructor", "return"].includes(m[1])
      ) {
        fnName = m[1];
        paramsStr = m[2];
      }
    }

    if (!fnName) continue;

    const decs = pendingDecorators(i);
    const block =
      language === "python"
        ? extractPythonBlock(lines, i)
        : extractBraceBlock(lines, i);
    const complexity = computeComplexityFromBody(block.body);
    const fnId = `fn:${repoName}:${relPath}:${fnName}:${i + 1}`;
    const params = parseParams(paramsStr);

    nodes.push({
      id: fnId,
      label: "Function",
      name: fnName,
      repo: repoName,
      file: relPath,
      line: i + 1,
      endLine: block.endIdx + 1,
      language,
      complexity,
      params,
      decorators: decs,
      exported,
      isDependency,
    });
    edges.push({ from: fileId, to: fnId, type: "DEFINES" });

    // Spring Endpoint detection
    const mappingDec = decs.find((d) =>
      /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\b/.test(d),
    );
    if (mappingDec) {
      const methodMatch = mappingDec.match(/@(\w+)Mapping/);
      const rawMethod = methodMatch ? methodMatch[1].toUpperCase() : "REQUEST";
      const httpMethod = rawMethod === "REQUEST" ? "ANY" : rawMethod;
      const routeMatch = mappingDec.match(/["']([^"']+)["']/);
      const routePath = routeMatch ? routeMatch[1] : "/";
      const epId = `ep:${repoName}:${httpMethod}:${routePath}:${fnName}`;
      nodes.push({
        id: epId,
        label: "Endpoint",
        name: `${httpMethod} ${routePath}`,
        repo: repoName,
        file: relPath,
        line: i + 1,
        httpMethod,
        routePath,
        handler: fnName,
        isDependency,
      });
      edges.push({ from: fnId, to: epId, type: "EXPOSES" });
    }

    // Extract function calls inside block
    const callRe = /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
    let cm: RegExpExecArray | null;
    const seenCalls = new Set<string>();
    while ((cm = callRe.exec(block.body)) !== null) {
      const target = cm[1];
      if (
        target !== fnName &&
        !["if", "for", "while", "switch", "catch", "return", "sizeof", "typeof", "print", "console", "require"].includes(target) &&
        !seenCalls.has(target)
      ) {
        seenCalls.add(target);
        calls.push({ fromId: fnId, targetName: target });
      }
    }
  }

  // Top-level exported/const variables
  for (let i = 0; i < lines.length; i++) {
    const varMatch = lines[i].match(
      /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/,
    );
    if (varMatch && !lines[i].includes("=>")) {
      const varName = varMatch[1];
      const varId = `var:${repoName}:${relPath}:${varName}:${i + 1}`;
      nodes.push({
        id: varId,
        label: "Variable",
        name: varName,
        repo: repoName,
        file: relPath,
        line: i + 1,
        language,
        exported: lines[i].startsWith("export"),
        isDependency,
      });
      edges.push({ from: fileId, to: varId, type: "DEFINES" });
    }
  }

  return { nodes, edges, imports, calls, loc: lines.length, language };
}

function indexDirectoryIntoGraph(
  graph: CodeGraphData,
  repoDir: string,
  repoName: string,
  isDependency: boolean,
): { filesProcessed: number; nodesCreated: number; edgesCreated: number } {
  // Remove previous nodes/edges for this repo so re-indexing is clean
  const oldNodeIds = new Set(
    Object.values(graph.nodes)
      .filter((n) => n.repo === repoName)
      .map((n) => n.id),
  );
  for (const id of oldNodeIds) delete graph.nodes[id];
  graph.edges = graph.edges.filter(
    (e) => !oldNodeIds.has(e.from) && !oldNodeIds.has(e.to),
  );

  const repoId = `repo:${repoName}`;
  graph.nodes[repoId] = {
    id: repoId,
    label: "Repository",
    name: repoName,
    repo: repoName,
    isDependency,
  };

  const files = walkSourceFiles(repoDir);
  const allCalls: Array<{ fromId: string; targetName: string }> = [];
  const fileImports: Array<{ fileId: string; fileRel: string; imp: string }> = [];
  const languages: Record<string, number> = {};
  let totalLoc = 0;
  let nodesCreated = 1;
  let edgesCreated = 0;

  for (const absFile of files) {
    const relPath = path.relative(repoDir, absFile).replace(/\\/g, "/");
    const parsed = parseSourceFile(absFile, relPath, repoName, isDependency);
    totalLoc += parsed.loc;
    languages[parsed.language] = (languages[parsed.language] || 0) + 1;

    for (const n of parsed.nodes) {
      graph.nodes[n.id] = n;
      nodesCreated++;
    }
    for (const e of parsed.edges) {
      graph.edges.push(e);
      edgesCreated++;
    }
    for (const imp of parsed.imports) {
      fileImports.push({ fileId: `file:${repoName}:${relPath}`, fileRel: relPath, imp });
    }
    allCalls.push(...parsed.calls);
  }

  // Resolve CALLS edges by symbol name within the graph
  const fnByName = new Map<string, string[]>();
  const classByName = new Map<string, string>();
  const fileByRel = new Map<string, string>();
  for (const n of Object.values(graph.nodes)) {
    if (n.label === "Function") {
      const list = fnByName.get(n.name) || [];
      list.push(n.id);
      fnByName.set(n.name, list);
    } else if (n.label === "Class") {
      classByName.set(n.name, n.id);
    } else if (n.label === "File" && n.file) {
      fileByRel.set(n.file.replace(/\.[^.]+$/, ""), n.id);
    }
  }

  for (const call of allCalls) {
    const targets = fnByName.get(call.targetName);
    if (targets) {
      for (const targetId of targets) {
        if (targetId !== call.fromId) {
          graph.edges.push({ from: call.fromId, to: targetId, type: "CALLS" });
          edgesCreated++;
        }
      }
    }
  }

  // Resolve EXTENDS edges
  for (const n of Object.values(graph.nodes)) {
    if (n.label === "Class" && n.extendsName && n.repo === repoName) {
      const parentId = classByName.get(n.extendsName);
      if (parentId && parentId !== n.id) {
        graph.edges.push({ from: n.id, to: parentId, type: "EXTENDS" });
        edgesCreated++;
      }
    }
  }

  // Resolve IMPORTS edges
  for (const fi of fileImports) {
    if (fi.imp.startsWith(".")) {
      const resolvedRel = path.posix
        .normalize(path.posix.join(path.posix.dirname(fi.fileRel), fi.imp))
        .replace(/\.js$|\.ts$|\.py$/, "");
      const targetFileId = fileByRel.get(resolvedRel) || fileByRel.get(`${resolvedRel}/index`);
      if (targetFileId) {
        graph.edges.push({ from: fi.fileId, to: targetFileId, type: "IMPORTS" });
        edgesCreated++;
        continue;
      }
    }
    const pkgId = `pkg:${fi.imp.split("/")[0]}`;
    if (!graph.nodes[pkgId]) {
      graph.nodes[pkgId] = {
        id: pkgId,
        label: "Package",
        name: fi.imp,
        repo: repoName,
        isDependency: true,
      };
      nodesCreated++;
    }
    graph.edges.push({ from: fi.fileId, to: pkgId, type: "IMPORTS" });
    edgesCreated++;
  }

  graph.repos[repoName] = {
    name: repoName,
    path: repoDir,
    indexedAt: Date.now(),
    fileCount: files.length,
    loc: totalLoc,
    languages,
    isDependency,
  };

  return { filesProcessed: files.length, nodesCreated, edgesCreated };
}

function computeGraphMetrics(graph: CodeGraphData) {
  const nodes = Object.values(graph.nodes);
  const fns = nodes.filter((n) => n.label === "Function");
  const files = nodes.filter((n) => n.label === "File");
  const avgComplexity =
    fns.length > 0
      ? Math.round(
          (fns.reduce((acc, f) => acc + (f.complexity || 1), 0) / fns.length) * 100,
        ) / 100
      : 0;
  const maxComplexity = fns.reduce((m, f) => Math.max(m, f.complexity || 1), 0);

  const importEdges = graph.edges.filter((e) => e.type === "IMPORTS").length;
  const callEdges = graph.edges.filter((e) => e.type === "CALLS").length;
  const coupling =
    files.length > 0
      ? Math.round(((importEdges + callEdges) / files.length) * 100) / 100
      : 0;

  // Cohesion: ratio of internal-file calls vs total calls
  const nodeFile = new Map<string, string>();
  for (const n of nodes) if (n.file) nodeFile.set(n.id, n.file);
  let internalCalls = 0;
  for (const e of graph.edges) {
    if (e.type === "CALLS") {
      const f1 = nodeFile.get(e.from);
      const f2 = nodeFile.get(e.to);
      if (f1 && f2 && f1 === f2) internalCalls++;
    }
  }
  const cohesion =
    callEdges > 0 ? Math.round((internalCalls / callEdges) * 100) / 100 : 1;

  // God nodes: highest degree
  const degree = new Map<string, number>();
  for (const e of graph.edges) {
    degree.set(e.from, (degree.get(e.from) || 0) + 1);
    degree.set(e.to, (degree.get(e.to) || 0) + 1);
  }
  const godNodes = nodes
    .filter((n) => n.label === "Function" || n.label === "Class" || n.label === "File")
    .map((n) => ({
      name: n.name,
      label: n.label,
      file: n.file,
      degree: degree.get(n.id) || 0,
      complexity: n.complexity || 1,
    }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10);

  return {
    totalNodes: nodes.length,
    totalEdges: graph.edges.length,
    fileCount: files.length,
    functionCount: fns.length,
    avgComplexity,
    maxComplexity,
    coupling,
    cohesion,
    godNodes,
  };
}

function executeCypher(graph: CodeGraphData, query: string): {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  matchedNodes: GraphNode[];
  matchedEdges: GraphEdge[];
} {
  const q = query.trim();
  const limitMatch = q.match(/\bLIMIT\s+(\d+)/i);
  const limit = limitMatch ? Math.min(200, Math.max(1, parseInt(limitMatch[1], 10))) : 50;

  // Pattern 1: MATCH (a[:Label])-[r[:TYPE]]->(b[:Label])
  const relMatch = q.match(
    /MATCH\s*\(\s*([a-zA-Z_]\w*)(?::([A-Za-z_]\w*))?\s*\)\s*-\[\s*([a-zA-Z_]\w*)?(?::([A-Za-z_|]+))?\s*\]->\s*\(\s*([a-zA-Z_]\w*)(?::([A-Za-z_]\w*))?\s*\)/i,
  );
  if (relMatch) {
    const [, varA, labelA, varR, typeR, varB, labelB] = relMatch;
    const allowedTypes = typeR ? new Set(typeR.split("|").map((s) => s.trim().toUpperCase())) : null;
    const rows: Array<Record<string, unknown>> = [];
    const matchedNodesMap = new Map<string, GraphNode>();
    const matchedEdges: GraphEdge[] = [];

    for (const e of graph.edges) {
      if (allowedTypes && !allowedTypes.has(e.type)) continue;
      const a = graph.nodes[e.from];
      const b = graph.nodes[e.to];
      if (!a || !b) continue;
      if (labelA && a.label.toLowerCase() !== labelA.toLowerCase()) continue;
      if (labelB && b.label.toLowerCase() !== labelB.toLowerCase()) continue;
      matchedNodesMap.set(a.id, a);
      matchedNodesMap.set(b.id, b);
      matchedEdges.push(e);
      rows.push({
        [varA]: { name: a.name, label: a.label, file: a.file, line: a.line },
        ...(varR ? { [varR]: e.type } : {}),
        [varB]: { name: b.name, label: b.label, file: b.file, line: b.line },
      });
      if (rows.length >= limit) break;
    }
    return {
      columns: [varA, ...(varR ? [varR] : []), varB],
      rows,
      matchedNodes: Array.from(matchedNodesMap.values()),
      matchedEdges,
    };
  }

  // Pattern 2: MATCH (n[:Label]) [WHERE ...] [RETURN ...]
  const nodeMatch = q.match(/MATCH\s*\(\s*([a-zA-Z_]\w*)(?::([A-Za-z_]\w*))?\s*\)/i);
  const varName = nodeMatch?.[1] || "n";
  const labelFilter = nodeMatch?.[2];

  let candidates = Object.values(graph.nodes).filter(
    (n) => !labelFilter || n.label.toLowerCase() === labelFilter.toLowerCase(),
  );

  // Simple WHERE filtering
  const whereMatch = q.match(/\bWHERE\s+([\s\S]+?)(?=\bRETURN\b|\bORDER\b|\bLIMIT\b|$)/i);
  if (whereMatch) {
    const cond = whereMatch[1].trim();
    const eqM = cond.match(/\w+\.(\w+)\s*=\s*["']([^"']+)["']/);
    const containsM = cond.match(/\w+\.(\w+)\s+CONTAINS\s+["']([^"']+)["']/i);
    const gtM = cond.match(/\w+\.(\w+)\s*>\s*(\d+(?:\.\d+)?)/);
    if (eqM) {
      candidates = candidates.filter((n: any) => String(n[eqM[1]] ?? "") === eqM[2]);
    } else if (containsM) {
      candidates = candidates.filter((n: any) =>
        String(n[containsM[1]] ?? "").toLowerCase().includes(containsM[2].toLowerCase()),
      );
    } else if (gtM) {
      candidates = candidates.filter((n: any) => Number(n[gtM[1]] ?? 0) > Number(gtM[2]));
    }
  }

  const returnMatch = q.match(/\bRETURN\s+([\s\S]+?)(?=\bORDER\b|\bLIMIT\b|$)/i);
  const returnExpr = returnMatch?.[1]?.trim() || varName;

  if (/^COUNT\s*\(/i.test(returnExpr)) {
    return {
      columns: ["count"],
      rows: [{ count: candidates.length }],
      matchedNodes: candidates.slice(0, limit),
      matchedEdges: [],
    };
  }

  const fields = returnExpr.split(",").map((f) => f.trim());
  const sliced = candidates.slice(0, limit);
  const rows = sliced.map((n: any) => {
    const row: Record<string, unknown> = {};
    for (const f of fields) {
      const parts = f.split(".");
      if (parts.length === 2) {
        row[f] = n[parts[1]] ?? null;
      } else {
        row[f] = { id: n.id, label: n.label, name: n.name, file: n.file, line: n.line };
      }
    }
    return row;
  });

  return {
    columns: fields,
    rows,
    matchedNodes: sliced,
    matchedEdges: [],
  };
}

/**
 * Fast web search implementation with in-memory TTL cache, sub-3.5s timeout, and instant fallback.
 */
interface WebSearchCacheEntry {
  timestamp: number;
  data: {
    query: string;
    results: Array<{ title: string; url: string; snippet: string }>;
  };
}
const WEB_SEARCH_CACHE = new Map<string, WebSearchCacheEntry>();
const WEB_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

async function performWebSearch(
  query: string,
  limit: number = 5,
): Promise<{
  query: string;
  results: Array<{ title: string; url: string; snippet: string }>;
}> {
  const cleanQuery = query.trim();
  const cappedLimit = Math.max(1, Math.min(15, limit));
  const cacheKey = `${cleanQuery.toLowerCase()}_${cappedLimit}`;

  const cached = WEB_SEARCH_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WEB_SEARCH_CACHE_TTL_MS) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const searchUrl = new URL("https://html.duckduckgo.com/html/");
    searchUrl.searchParams.set("q", cleanQuery);

    const res = await fetch(searchUrl.toString(), {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ q: cleanQuery }).toString(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Search engine returned HTTP ${res.status}`);
    }

    const html = await res.text();
    const results: Array<{ title: string; url: string; snippet: string }> = [];

    const resultBlockRe =
      /<div class="result__body">([\s\S]*?)<\/div>\s*<\/div>/g;
    let match: RegExpExecArray | null;

    while (
      (match = resultBlockRe.exec(html)) !== null &&
      results.length < cappedLimit
    ) {
      const block = match[1];
      const titleMatch =
        /<a class="result__snippet[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|<h2 class="result__title">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(
          block,
        );
      const snippetMatch =
        /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/i.exec(block);

      const rawHref =
        titleMatch?.[5] || titleMatch?.[1] || titleMatch?.[3] || "";
      const rawTitle =
        titleMatch?.[6] || titleMatch?.[2] || titleMatch?.[4] || "";
      const rawSnippet = snippetMatch?.[1] || "";

      let cleanUrl = rawHref;
      if (cleanUrl.includes("uddg=")) {
        const urlParams = new URL(cleanUrl, "https://duckduckgo.com");
        const realTarget = urlParams.searchParams.get("uddg");
        if (realTarget) cleanUrl = realTarget;
      }

      const stripTags = (s: string) =>
        s
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

      const title = stripTags(rawTitle);
      const snippet = stripTags(rawSnippet);

      if (title && cleanUrl && cleanUrl.startsWith("http")) {
        results.push({
          title,
          url: cleanUrl,
          snippet,
        });
      }
    }

    if (results.length === 0) {
      return {
        query: cleanQuery,
        results: [
          {
            title: `Search Query: ${cleanQuery}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`,
            snippet:
              "No direct parsed snippets returned. Visit search URL for full results.",
          },
        ],
      };
    }

    const finalResult = { query: cleanQuery, results };
    WEB_SEARCH_CACHE.set(cacheKey, {
      timestamp: Date.now(),
      data: finalResult,
    });
    return finalResult;
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      query: cleanQuery,
      results: [
        {
          title: `Search error for: ${cleanQuery}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}`,
          snippet: `Search failed: ${err?.message || "Timeout connecting to search provider"}.`,
        },
      ],
    };
  }
}

/**
 * Register all 29 real per-user-isolated Code Graph tools and 1 Web Search tool into the MCP server registry.
 */
export function registerCodeGraphTools(
  server: McpServer,
  sessionId: string,
  registry: Record<string, any>,
): void {
  const reg = makeRegistrar(server, registry, sessionId);

  const getCtx = (graphName?: string) => {
    const authKey = getAuthKeyForSession(sessionId);
    const root = sandboxRootForAuthKey(authKey);
    const state = getUserState(authKey);
    const activeGraphName = sanitizeGraphName(graphName || state.activeGraph);
    return { authKey, root, state, activeGraphName };
  };

  // 1. add_code_to_graph
  reg(
    "add_code_to_graph",
    {
      description:
        "Performs a one-time scan of a local folder to add its code to the graph. Returns a job ID for background processing.",
      inputSchema: {
        repo_path: z.string().describe("Path to the repository root"),
        is_dependency: z
          .boolean()
          .default(false)
          .describe("Whether this code is a dependency"),
        graph_name: z.string().optional().describe("Optional graph name"),
      },
      annotations: getToolAnnotations("add_code_to_graph"),
    },
    async (args: any) => {
      try {
        const { root, abs } = await resolveUserSandboxPath(sessionId, args.repo_path);
        if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
          throw new Error(`Directory not found in your sandbox: ${args.repo_path}`);
        }
        const { state, activeGraphName } = getCtx(args.graph_name);
        const repoName = path.basename(abs) || "workspace";
        const jobId = `cgc_${crypto.randomBytes(6).toString("hex")}`;
        const job: IndexingJob = {
          jobId,
          repoName,
          repoPath: abs,
          graphName: activeGraphName,
          status: "running",
          startedAt: Date.now(),
          filesProcessed: 0,
          nodesCreated: 0,
          edgesCreated: 0,
        };
        state.jobs.set(jobId, job);

        const graph = loadGraph(root, activeGraphName);
        const stats = indexDirectoryIntoGraph(
          graph,
          abs,
          repoName,
          Boolean(args.is_dependency),
        );
        saveGraph(root, graph);

        job.status = "completed";
        job.completedAt = Date.now();
        job.filesProcessed = stats.filesProcessed;
        job.nodesCreated = stats.nodesCreated;
        job.edgesCreated = stats.edgesCreated;

        return formatOptimizedResponse({
          success: true,
          jobId,
          repo: repoName,
          graphName: activeGraphName,
          ...stats,
          durationMs: job.completedAt - job.startedAt,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 2. check_job_status
  reg(
    "check_job_status",
    {
      description:
        "Check the status and progress of a background CGC indexing job.",
      inputSchema: {
        job_id: z.string().describe("Job ID from a previous tool call"),
      },
      annotations: getToolAnnotations("check_job_status"),
    },
    async (args: any) => {
      try {
        const { state } = getCtx();
        const job = state.jobs.get(String(args.job_id || ""));
        if (!job) {
          return formatOptimizedResponse({
            found: false,
            jobId: args.job_id,
            error: "Job not found for your account.",
          });
        }
        return formatOptimizedResponse({
          found: true,
          ...job,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 3. list_jobs
  reg(
    "list_jobs",
    {
      description:
        "List recent indexing background jobs and their execution status.",
      inputSchema: {
        limit: z
          .number()
          .int()
          .default(10)
          .describe("Maximum number of jobs to return"),
      },
      annotations: getToolAnnotations("list_jobs"),
    },
    async (args: any) => {
      try {
        const { root, state, activeGraphName } = getCtx();
        const jobs = Array.from(state.jobs.values())
          .sort((a, b) => b.startedAt - a.startedAt)
          .slice(0, Math.max(1, args.limit || 10));
        const graph = loadGraph(root, activeGraphName);
        return formatOptimizedResponse({
          jobs,
          indexedRepositories: Object.keys(graph.repos),
          graphName: activeGraphName,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 4. find_code
  reg(
    "find_code",
    {
      description:
        "Search for code elements by name, pattern, AST type, decorator, argument, or variable in the indexed graph.",
      inputSchema: {
        query: z.string().describe("Search term or symbol name"),
        context: z
          .string()
          .optional()
          .describe("Context parameter for scoping (e.g. repo name or label)"),
        graph_name: z.string().optional().describe("Optional graph name"),
        limit: z
          .number()
          .int()
          .default(20)
          .describe("Maximum matches to return"),
        repo_path: z.string().optional().describe("Optional repository path"),
      },
      annotations: getToolAnnotations("find_code"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const q = String(args.query || "").trim();
        let re: RegExp | null = null;
        try {
          re = new RegExp(q, "i");
        } catch {
          re = null;
        }
        const repoFilter = args.repo_path
          ? path.basename(args.repo_path)
          : args.context;
        const limit = Math.max(1, Math.min(100, args.limit || 20));

        const matches = Object.values(graph.nodes)
          .filter((n) => {
            if (repoFilter && n.repo !== repoFilter && n.label.toLowerCase() !== repoFilter.toLowerCase()) {
              return false;
            }
            const haystack = [
              n.name,
              n.file || "",
              ...(n.decorators || []),
              ...(n.params || []),
            ].join(" ");
            return re ? re.test(haystack) : haystack.toLowerCase().includes(q.toLowerCase());
          })
          .slice(0, limit)
          .map((n) => ({
            id: n.id,
            label: n.label,
            name: n.name,
            repo: n.repo,
            file: n.file,
            line: n.line,
            complexity: n.complexity,
            params: n.params,
            decorators: n.decorators,
          }));

        return formatOptimizedResponse({
          query: q,
          graphName: activeGraphName,
          count: matches.length,
          matches,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 5. analyze_code_relationships
  reg(
    "analyze_code_relationships",
    {
      description:
        "Analyze code relationships like callers, callees, importers, class hierarchy, overrides, dead code, or call chains.",
      inputSchema: {
        query_type: z.enum([
          "find_callers",
          "find_callees",
          "find_all_callers",
          "find_all_callees",
          "find_importers",
          "who_modifies",
          "class_hierarchy",
          "overrides",
          "dead_code",
          "call_chain",
          "module_deps",
          "variable_scope",
          "find_complexity",
          "find_functions_by_argument",
          "find_functions_by_decorator",
        ]),
        target: z.string().describe("Target function, class, or symbol"),
        context: z.string().optional().describe("Context or repo name"),
        depth: z
          .number()
          .int()
          .optional()
          .describe("Optional traversal depth (1-20)"),
        graph_name: z.string().optional().describe("Optional graph name"),
        repo_path: z.string().optional().describe("Optional repository path"),
      },
      annotations: getToolAnnotations("analyze_code_relationships"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const target = String(args.target || "").trim();
        const maxDepth = Math.min(20, Math.max(1, args.depth || (args.query_type.startsWith("find_all_") ? 5 : 1)));
        const nodes = Object.values(graph.nodes);

        const matchingNodes = nodes.filter(
          (n) =>
            n.name === target ||
            n.name.toLowerCase() === target.toLowerCase() ||
            (n.file && n.file.includes(target)),
        );
        const matchingIds = new Set(matchingNodes.map((n) => n.id));

        const bfs = (direction: "in" | "out", edgeType: EdgeType) => {
          const visited = new Set<string>(matchingIds);
          let frontier = Array.from(matchingIds);
          const found: Array<{ depth: number; node: GraphNode }> = [];
          for (let d = 1; d <= maxDepth && frontier.length > 0; d++) {
            const next: string[] = [];
            for (const curId of frontier) {
              for (const e of graph.edges) {
                if (e.type !== edgeType) continue;
                const neighborId =
                  direction === "in" && e.to === curId
                    ? e.from
                    : direction === "out" && e.from === curId
                      ? e.to
                      : null;
                if (neighborId && !visited.has(neighborId)) {
                  visited.add(neighborId);
                  next.push(neighborId);
                  const n = graph.nodes[neighborId];
                  if (n) found.push({ depth: d, node: n });
                }
              }
            }
            frontier = next;
          }
          return found.map((f) => ({
            depth: f.depth,
            name: f.node.name,
            label: f.node.label,
            file: f.node.file,
            line: f.node.line,
          }));
        };

        let results: any;
        switch (args.query_type) {
          case "find_callers":
          case "find_all_callers":
            results = bfs("in", "CALLS");
            break;
          case "find_callees":
          case "find_all_callees":
            results = bfs("out", "CALLS");
            break;
          case "find_importers":
            results = bfs("in", "IMPORTS");
            break;
          case "module_deps":
            results = {
              imports: bfs("out", "IMPORTS"),
              importedBy: bfs("in", "IMPORTS"),
            };
            break;
          case "class_hierarchy":
            results = {
              parents: bfs("out", "EXTENDS"),
              subclasses: bfs("in", "EXTENDS"),
            };
            break;
          case "overrides": {
            const parents = bfs("out", "EXTENDS").map((p) => p.file);
            results = nodes
              .filter((n) => n.label === "Function" && n.name === target)
              .map((n) => ({ name: n.name, file: n.file, line: n.line, inParentFiles: parents }));
            break;
          }
          case "dead_code": {
            const calledIds = new Set(
              graph.edges.filter((e) => e.type === "CALLS").map((e) => e.to),
            );
            results = nodes
              .filter((n) => n.label === "Function" && !n.exported && !calledIds.has(n.id))
              .map((n) => ({ name: n.name, file: n.file, line: n.line, complexity: n.complexity }));
            break;
          }
          case "call_chain":
            results = bfs("out", "CALLS");
            break;
          case "find_complexity":
            results = matchingNodes
              .filter((n) => n.label === "Function")
              .map((n) => ({ name: n.name, file: n.file, line: n.line, complexity: n.complexity || 1 }));
            break;
          case "find_functions_by_argument":
            results = nodes
              .filter((n) => n.label === "Function" && n.params?.some((p) => p.toLowerCase().includes(target.toLowerCase())))
              .map((n) => ({ name: n.name, file: n.file, line: n.line, params: n.params }));
            break;
          case "find_functions_by_decorator":
            results = nodes
              .filter((n) =>
                (n.decorators || []).some((d) => d.toLowerCase().includes(target.toLowerCase())),
              )
              .map((n) => ({ name: n.name, label: n.label, file: n.file, line: n.line, decorators: n.decorators }));
            break;
          case "variable_scope":
          case "who_modifies":
            results = nodes
              .filter((n) => n.name === target || (n.label === "Variable" && n.name.includes(target)))
              .map((n) => ({ name: n.name, label: n.label, file: n.file, line: n.line }));
            break;
        }

        return formatOptimizedResponse({
          queryType: args.query_type,
          target,
          graphName: activeGraphName,
          results,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 6. watch_directory
  reg(
    "watch_directory",
    {
      description:
        "Continuously monitors a directory and keeps the graph updated.",
      inputSchema: {
        repo_path: z.string().describe("Path to repository root"),
        graph_name: z.string().optional().describe("Optional graph name"),
      },
      annotations: getToolAnnotations("watch_directory"),
    },
    async (args: any) => {
      try {
        const { root, abs } = await resolveUserSandboxPath(sessionId, args.repo_path);
        if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
          throw new Error(`Directory not found in your sandbox: ${args.repo_path}`);
        }
        const { state, activeGraphName } = getCtx(args.graph_name);
        if (state.watchers.has(abs)) {
          return formatOptimizedResponse({
            watched: true,
            alreadyWatching: true,
            path: abs,
            graphName: activeGraphName,
          });
        }

        const repoName = path.basename(abs) || "workspace";
        const watcher = fs.watch(abs, { recursive: true }, (_event, filename) => {
          if (!filename || SKIP_DIRS.has(filename.split(/[\\/]/)[0])) return;
          const entry = state.watchers.get(abs);
          if (!entry) return;
          if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
          entry.debounceTimer = setTimeout(() => {
            try {
              const g = loadGraph(root, activeGraphName);
              indexDirectoryIntoGraph(g, abs, repoName, false);
              saveGraph(root, g);
            } catch {}
          }, 500);
          entry.debounceTimer.unref?.();
        });

        state.watchers.set(abs, {
          repoPath: abs,
          graphName: activeGraphName,
          startedAt: Date.now(),
          watcher,
        });

        return formatOptimizedResponse({
          watched: true,
          path: abs,
          graphName: activeGraphName,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 7. execute_cypher_query
  reg(
    "execute_cypher_query",
    {
      description: "Execute a custom Cypher query on the code graph database.",
      inputSchema: {
        cypher_query: z.string().describe("Cypher query string"),
        graph_name: z.string().optional().describe("Optional graph name"),
      },
      annotations: getToolAnnotations("execute_cypher_query"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const res = executeCypher(graph, String(args.cypher_query || ""));
        return formatOptimizedResponse({
          graphName: activeGraphName,
          columns: res.columns,
          rowCount: res.rows.length,
          rows: res.rows,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 8. add_package_to_graph
  reg(
    "add_package_to_graph",
    {
      description: "Add an external package to the code graph.",
      inputSchema: {
        package_name: z.string().describe("Package name"),
        language: z.enum([
          "python",
          "javascript",
          "typescript",
          "java",
          "c",
          "go",
          "ruby",
          "php",
          "cpp",
        ]),
        is_dependency: z.boolean().default(true),
        graph_name: z.string().optional(),
      },
      annotations: getToolAnnotations("add_package_to_graph"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const pkgName = String(args.package_name || "").trim();
        const nmPath = path.join(root, "node_modules", pkgName);
        let stats: { filesProcessed: number; nodesCreated: number; edgesCreated: number } | null = null;
        if (fs.existsSync(nmPath) && fs.statSync(nmPath).isDirectory()) {
          stats = indexDirectoryIntoGraph(graph, nmPath, pkgName, true);
        } else {
          const pkgId = `pkg:${pkgName}`;
          graph.nodes[pkgId] = {
            id: pkgId,
            label: "Package",
            name: pkgName,
            repo: pkgName,
            language: args.language,
            isDependency: Boolean(args.is_dependency ?? true),
          };
        }
        saveGraph(root, graph);
        return formatOptimizedResponse({
          success: true,
          package: pkgName,
          language: args.language,
          graphName: activeGraphName,
          indexedFromSandbox: Boolean(stats),
          ...(stats || { nodesCreated: 1, edgesCreated: 0 }),
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 9. find_dead_code
  reg(
    "find_dead_code",
    {
      description:
        "Identify unused functions and unreachable code in the repository.",
      inputSchema: {
        context: z.string().optional(),
        graph_name: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("find_dead_code"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const repoFilter = args.repo_path ? path.basename(args.repo_path) : args.context;
        const calledIds = new Set(
          graph.edges.filter((e) => e.type === "CALLS").map((e) => e.to),
        );
        const deadFunctions = Object.values(graph.nodes)
          .filter(
            (n) =>
              n.label === "Function" &&
              !n.exported &&
              !calledIds.has(n.id) &&
              (!repoFilter || n.repo === repoFilter),
          )
          .map((n) => ({
            name: n.name,
            repo: n.repo,
            file: n.file,
            line: n.line,
            complexity: n.complexity || 1,
          }));
        return formatOptimizedResponse({
          graphName: activeGraphName,
          count: deadFunctions.length,
          deadFunctions,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 10. calculate_cyclomatic_complexity
  reg(
    "calculate_cyclomatic_complexity",
    {
      description: "Calculate cyclomatic complexity of a specific function.",
      inputSchema: {
        function_name: z.string().describe("Function name"),
        graph_name: z.string().optional(),
        path: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("calculate_cyclomatic_complexity"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const fnName = String(args.function_name || "").trim();
        const matches = Object.values(graph.nodes)
          .filter(
            (n) =>
              n.label === "Function" &&
              n.name === fnName &&
              (!args.path || (n.file && n.file.includes(args.path))),
          )
          .map((n) => ({
            name: n.name,
            repo: n.repo,
            file: n.file,
            line: n.line,
            endLine: n.endLine,
            complexity: n.complexity || 1,
            risk:
              (n.complexity || 1) > 15
                ? "high"
                : (n.complexity || 1) > 7
                  ? "moderate"
                  : "low",
          }));
        return formatOptimizedResponse({
          functionName: fnName,
          graphName: activeGraphName,
          matches,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 11. find_most_complex_functions
  reg(
    "find_most_complex_functions",
    {
      description: "Find top functions with highest cyclomatic complexity.",
      inputSchema: {
        limit: z.number().int().default(10),
        context: z.string().optional(),
        graph_name: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("find_most_complex_functions"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const repoFilter = args.repo_path ? path.basename(args.repo_path) : args.context;
        const top = Object.values(graph.nodes)
          .filter((n) => n.label === "Function" && (!repoFilter || n.repo === repoFilter))
          .sort((a, b) => (b.complexity || 1) - (a.complexity || 1))
          .slice(0, Math.max(1, args.limit || 10))
          .map((n) => ({
            name: n.name,
            repo: n.repo,
            file: n.file,
            line: n.line,
            complexity: n.complexity || 1,
          }));
        return formatOptimizedResponse({
          graphName: activeGraphName,
          functions: top,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 12. list_indexed_repositories
  reg(
    "list_indexed_repositories",
    {
      description:
        "List all indexed repositories currently present in the graph database.",
      inputSchema: {
        graph_name: z.string().optional(),
      },
      annotations: getToolAnnotations("list_indexed_repositories"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args?.graph_name);
        const graph = loadGraph(root, activeGraphName);
        return formatOptimizedResponse({
          graphName: activeGraphName,
          repositories: Object.values(graph.repos),
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 13. delete_repository
  reg(
    "delete_repository",
    {
      description:
        "DESTRUCTIVE AND IRREVERSIBLE. Permanently deletes a repository from the graph.",
      inputSchema: {
        repo_name: z.string().describe("Repository name to delete"),
        graph_name: z.string().optional(),
      },
      annotations: getToolAnnotations("delete_repository"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const repoName = String(args.repo_name || "").trim();
        const existed = Boolean(graph.repos[repoName]);
        delete graph.repos[repoName];
        const removedIds = new Set(
          Object.values(graph.nodes)
            .filter((n) => n.repo === repoName)
            .map((n) => n.id),
        );
        for (const id of removedIds) delete graph.nodes[id];
        graph.edges = graph.edges.filter(
          (e) => !removedIds.has(e.from) && !removedIds.has(e.to),
        );
        saveGraph(root, graph);
        return formatOptimizedResponse({
          deleted: existed,
          repoName,
          removedNodes: removedIds.size,
          graphName: activeGraphName,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 14. visualize_graph_query
  reg(
    "visualize_graph_query",
    {
      description:
        "Generate an interactive visualization URL and Mermaid graph for a Cypher query.",
      inputSchema: {
        cypher_query: z.string(),
        graph_name: z.string().optional(),
      },
      annotations: getToolAnnotations("visualize_graph_query"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const res = executeCypher(graph, String(args.cypher_query || ""));
        const mermaidLines = ["graph LR"];
        for (const e of res.matchedEdges.slice(0, 40)) {
          const fromNode = graph.nodes[e.from];
          const toNode = graph.nodes[e.to];
          if (!fromNode || !toNode) continue;
          const fId = fromNode.id.replace(/[^a-zA-Z0-9_]/g, "_");
          const tId = toNode.id.replace(/[^a-zA-Z0-9_]/g, "_");
          mermaidLines.push(
            `  ${fId}["${fromNode.name}"] -->|${e.type}| ${tId}["${toNode.name}"]`,
          );
        }
        return formatOptimizedResponse({
          visualizationUrl: `https://visualize.falkordb.com/?query=${encodeURIComponent(args.cypher_query)}`,
          query: args.cypher_query,
          matchedNodes: res.matchedNodes.length,
          matchedEdges: res.matchedEdges.length,
          mermaid: mermaidLines.join("\n"),
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 15. list_watched_paths
  reg(
    "list_watched_paths",
    {
      description: "List all watched directories.",
      inputSchema: {},
      annotations: getToolAnnotations("list_watched_paths"),
    },
    async () => {
      try {
        const { state } = getCtx();
        const watched = Array.from(state.watchers.values()).map((w) => ({
          path: w.repoPath,
          graphName: w.graphName,
          startedAt: w.startedAt,
        }));
        return formatOptimizedResponse({ watchedPaths: watched });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 16. unwatch_directory
  reg(
    "unwatch_directory",
    {
      description: "Stop watching a directory.",
      inputSchema: {
        repo_path: z.string(),
      },
      annotations: getToolAnnotations("unwatch_directory"),
    },
    async (args: any) => {
      try {
        const { abs } = await resolveUserSandboxPath(sessionId, args.repo_path);
        const { state } = getCtx();
        const entry = state.watchers.get(abs);
        if (entry) {
          if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
          entry.watcher.close();
          state.watchers.delete(abs);
        }
        return formatOptimizedResponse({
          unwatched: Boolean(entry),
          path: abs,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 17. load_bundle
  reg(
    "load_bundle",
    {
      description: "Load a pre-indexed graph bundle (.cgc) into the database.",
      inputSchema: {
        bundle_name: z.string(),
        clear_existing: z.boolean().default(false),
        graph_name: z.string().optional(),
      },
      annotations: getToolAnnotations("load_bundle"),
    },
    async (args: any) => {
      try {
        const { root, abs } = await resolveUserSandboxPath(sessionId, args.bundle_name);
        if (!fs.existsSync(abs)) {
          throw new Error(`Bundle file not found in your sandbox: ${args.bundle_name}`);
        }
        const loaded = JSON.parse(fs.readFileSync(abs, "utf-8")) as Partial<CodeGraphData>;
        const { activeGraphName } = getCtx(args.graph_name);
        const target = args.clear_existing
          ? { graphName: activeGraphName, updatedAt: Date.now(), repos: {}, nodes: {}, edges: [] }
          : loadGraph(root, activeGraphName);

        Object.assign(target.repos, loaded.repos || {});
        Object.assign(target.nodes, loaded.nodes || {});
        if (Array.isArray(loaded.edges)) target.edges.push(...loaded.edges);
        saveGraph(root, target);

        return formatOptimizedResponse({
          loaded: true,
          bundle: path.basename(abs),
          graphName: activeGraphName,
          totalNodes: Object.keys(target.nodes).length,
          totalEdges: target.edges.length,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 18. search_registry_bundles
  reg(
    "search_registry_bundles",
    {
      description: "Search registry bundles in your sandbox.",
      inputSchema: {
        query: z.string().optional(),
        unique_only: z.boolean().default(false),
      },
      annotations: getToolAnnotations("search_registry_bundles"),
    },
    async (args: any) => {
      try {
        const { root } = getCtx();
        const q = String(args?.query || "").toLowerCase();
        const bundles: Array<{ name: string; path: string; size: number }> = [];
        const scanDir = (dir: string) => {
          if (!fs.existsSync(dir)) return;
          for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            if (ent.isFile() && (ent.name.endsWith(".cgc") || ent.name.endsWith(".json"))) {
              if (!q || ent.name.toLowerCase().includes(q)) {
                const full = path.join(dir, ent.name);
                bundles.push({
                  name: ent.name,
                  path: path.relative(root, full),
                  size: fs.statSync(full).size,
                });
              }
            }
          }
        };
        scanDir(root);
        scanDir(graphDirForUser(root));
        return formatOptimizedResponse({ bundles });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 19. get_repository_stats
  reg(
    "get_repository_stats",
    {
      description:
        "Get repository statistics including total nodes and relationships.",
      inputSchema: {
        repo_name: z.string(),
        graph_name: z.string().optional(),
      },
      annotations: getToolAnnotations("get_repository_stats"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const repoName = String(args.repo_name || "").trim();
        const repoNodes = Object.values(graph.nodes).filter((n) => n.repo === repoName);
        const nodeIds = new Set(repoNodes.map((n) => n.id));
        const repoEdges = graph.edges.filter((e) => nodeIds.has(e.from) || nodeIds.has(e.to));

        const nodesByLabel: Record<string, number> = {};
        for (const n of repoNodes) {
          nodesByLabel[n.label] = (nodesByLabel[n.label] || 0) + 1;
        }
        const edgesByType: Record<string, number> = {};
        for (const e of repoEdges) {
          edgesByType[e.type] = (edgesByType[e.type] || 0) + 1;
        }

        return formatOptimizedResponse({
          repoName,
          graphName: activeGraphName,
          meta: graph.repos[repoName] || null,
          totalNodes: repoNodes.length,
          totalEdges: repoEdges.length,
          nodesByLabel,
          edgesByType,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 20. discover_codegraph_contexts
  reg(
    "discover_codegraph_contexts",
    {
      description: "Discover all available CGC contexts and environments.",
      inputSchema: {
        graph_name: z.string().optional(),
      },
      annotations: getToolAnnotations("discover_codegraph_contexts"),
    },
    async () => {
      try {
        const { root, state } = getCtx();
        const dir = graphDirForUser(root);
        const graphs = fs.existsSync(dir)
          ? fs
              .readdirSync(dir)
              .filter((f) => f.endsWith(".json"))
              .map((f) => f.replace(/\.json$/, ""))
          : ["default"];
        return formatOptimizedResponse({
          activeContext: state.activeGraph,
          contexts: graphs.length ? graphs : ["default"],
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 21. switch_context
  reg(
    "switch_context",
    {
      description: "Switch active graph context.",
      inputSchema: {
        context_path: z.string(),
        save: z.boolean().default(true),
      },
      annotations: getToolAnnotations("switch_context"),
    },
    async (args: any) => {
      try {
        const { root, state } = getCtx();
        const nextGraph = sanitizeGraphName(args.context_path);
        state.activeGraph = nextGraph;
        if (args.save !== false) {
          const g = loadGraph(root, nextGraph);
          saveGraph(root, g);
        }
        return formatOptimizedResponse({
          switched: true,
          activeContext: nextGraph,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 22. list_graphs
  reg(
    "list_graphs",
    {
      description: "List all graph names available in the backend database.",
      inputSchema: {},
      annotations: getToolAnnotations("list_graphs"),
    },
    async () => {
      try {
        const { root, state } = getCtx();
        const dir = graphDirForUser(root);
        const graphs = fs.existsSync(dir)
          ? fs
              .readdirSync(dir)
              .filter((f) => f.endsWith(".json"))
              .map((f) => f.replace(/\.json$/, ""))
          : [];
        return formatOptimizedResponse({
          activeGraph: state.activeGraph,
          graphs: graphs.length ? graphs : ["default"],
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 23. generate_report
  reg(
    "generate_report",
    {
      description:
        "Generate a CGC_REPORT.md with architectural metrics and god nodes.",
      inputSchema: {
        output_path: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("generate_report"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx();
        const graph = loadGraph(root, activeGraphName);
        const metrics = computeGraphMetrics(graph);
        const reportLines = [
          `# Code Graph Report (${activeGraphName})`,
          ``,
          `- **Repositories**: ${Object.keys(graph.repos).join(", ") || "None"}`,
          `- **Total Nodes**: ${metrics.totalNodes}`,
          `- **Total Edges**: ${metrics.totalEdges}`,
          `- **Files**: ${metrics.fileCount}`,
          `- **Functions**: ${metrics.functionCount}`,
          `- **Avg Cyclomatic Complexity**: ${metrics.avgComplexity}`,
          `- **Max Cyclomatic Complexity**: ${metrics.maxComplexity}`,
          `- **Coupling**: ${metrics.coupling}`,
          `- **Cohesion**: ${metrics.cohesion}`,
          ``,
          `## Top God Nodes`,
          ...metrics.godNodes.map(
            (g) => `- **${g.name}** (${g.label}) — degree: ${g.degree}, complexity: ${g.complexity} (${g.file || ""})`,
          ),
        ];
        const reportContent = reportLines.join("\n");
        const { abs: outAbs } = await resolveUserSandboxPath(
          sessionId,
          args.output_path || "CGC_REPORT.md",
        );
        fs.mkdirSync(path.dirname(outAbs), { recursive: true });
        fs.writeFileSync(outAbs, reportContent, "utf-8");

        return formatOptimizedResponse({
          generated: true,
          outputPath: path.relative(root, outAbs),
          metrics,
          report: reportContent,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 24. find_java_spring_endpoints
  reg(
    "find_java_spring_endpoints",
    {
      description: "Discover Java Spring REST endpoints and request mappings.",
      inputSchema: {
        graph_name: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("find_java_spring_endpoints"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args?.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const endpoints = Object.values(graph.nodes)
          .filter((n) => n.label === "Endpoint")
          .map((n) => ({
            method: n.httpMethod,
            path: n.routePath,
            handler: n.handler,
            file: n.file,
            line: n.line,
          }));
        return formatOptimizedResponse({ count: endpoints.length, endpoints });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 25. find_java_spring_beans
  reg(
    "find_java_spring_beans",
    {
      description: "Find Java Spring beans and dependency relationships.",
      inputSchema: {
        graph_name: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("find_java_spring_beans"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args?.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const beans = Object.values(graph.nodes)
          .filter((n) => n.label === "Bean")
          .map((n) => ({
            name: n.name,
            type: n.beanType,
            file: n.file,
            line: n.line,
          }));
        return formatOptimizedResponse({ count: beans.length, beans });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 26. find_datasource_nodes
  reg(
    "find_datasource_nodes",
    {
      description: "Find database nodes, Redis, Cassandra, and data sources.",
      inputSchema: {
        graph_name: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("find_datasource_nodes"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args?.graph_name);
        const graph = loadGraph(root, activeGraphName);
        const datasources = Object.values(graph.nodes)
          .filter((n) => n.label === "Datasource")
          .map((n) => ({
            name: n.name,
            type: n.dsType,
            file: n.file,
            repo: n.repo,
          }));
        return formatOptimizedResponse({ count: datasources.length, datasources });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 27. simulate_metrics
  reg(
    "simulate_metrics",
    {
      description:
        "Calculate repository architectural metrics (coupling, cohesion, complexity).",
      inputSchema: {
        context: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("simulate_metrics"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args?.context);
        const graph = loadGraph(root, activeGraphName);
        return formatOptimizedResponse({
          graphName: activeGraphName,
          ...computeGraphMetrics(graph),
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 28. simulate_architectural_change
  reg(
    "simulate_architectural_change",
    {
      description:
        "Simulate architectural modifications and compare against baseline metrics.",
      inputSchema: {
        changes: z
          .array(z.any())
          .describe("List of architectural mutations to simulate (e.g. { type: 'remove_node' | 'remove_edge' | 'add_edge' | 'refactor_function', target, to?, complexity? })"),
        context: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("simulate_architectural_change"),
    },
    async (args: any) => {
      try {
        const { root, activeGraphName } = getCtx(args?.context);
        const baseGraph = loadGraph(root, activeGraphName);
        const before = computeGraphMetrics(baseGraph);

        // Clone graph and apply real mutations
        const simGraph: CodeGraphData = {
          ...baseGraph,
          nodes: structuredClone(baseGraph.nodes),
          edges: structuredClone(baseGraph.edges),
        };

        let applied = 0;
        for (const ch of Array.isArray(args.changes) ? args.changes : []) {
          const type = String(ch?.type || ch?.action || "").toLowerCase();
          const target = String(ch?.target || ch?.node || ch?.from || "");
          if (!target) continue;

          if (type === "remove_node" || type === "delete_node") {
            for (const [id, n] of Object.entries(simGraph.nodes)) {
              if (id === target || n.name === target) {
                delete simGraph.nodes[id];
                simGraph.edges = simGraph.edges.filter((e) => e.from !== id && e.to !== id);
                applied++;
              }
            }
          } else if (type === "remove_edge" || type === "decouple") {
            const to = String(ch?.to || "");
            const beforeLen = simGraph.edges.length;
            simGraph.edges = simGraph.edges.filter((e) => {
              const fn = simGraph.nodes[e.from]?.name;
              const tn = simGraph.nodes[e.to]?.name;
              return !((e.from === target || fn === target) && (!to || e.to === to || tn === to));
            });
            if (simGraph.edges.length !== beforeLen) applied++;
          } else if (type === "add_edge") {
            const to = String(ch?.to || "");
            if (to) {
              simGraph.edges.push({ from: target, to, type: "CALLS" });
              applied++;
            }
          } else if (type === "refactor_function" || type === "reduce_complexity") {
            for (const n of Object.values(simGraph.nodes)) {
              if (n.label === "Function" && (n.id === target || n.name === target)) {
                n.complexity = Math.max(1, Number(ch?.complexity ?? Math.ceil((n.complexity || 2) / 2)));
                applied++;
              }
            }
          }
        }

        const after = computeGraphMetrics(simGraph);
        return formatOptimizedResponse({
          simulationStatus: "completed",
          graphName: activeGraphName,
          changesApplied: applied,
          before,
          after,
          metricsDelta: {
            couplingDelta: Math.round((after.coupling - before.coupling) * 100) / 100,
            cohesionDelta: Math.round((after.cohesion - before.cohesion) * 100) / 100,
            complexityDelta: Math.round((after.avgComplexity - before.avgComplexity) * 100) / 100,
            nodeDelta: after.totalNodes - before.totalNodes,
            edgeDelta: after.totalEdges - before.totalEdges,
          },
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 29. analyze_architectural_evolution
  reg(
    "analyze_architectural_evolution",
    {
      description:
        "Analyze repository growth trend and identify Technical Debt Hotspots.",
      inputSchema: {
        commits: z.number().int().default(50),
        context: z.string().optional(),
        repo_path: z.string().optional(),
      },
      annotations: getToolAnnotations("analyze_architectural_evolution"),
    },
    async (args: any) => {
      try {
        const { abs: repoDir } = await resolveUserSandboxPath(sessionId, args?.repo_path);
        const { root, activeGraphName } = getCtx(args?.context);
        const graph = loadGraph(root, activeGraphName);
        const maxCommits = Math.min(500, Math.max(1, args?.commits || 50));

        const gitOut = await new Promise<string>((resolve) => {
          execFile(
            "git",
            ["log", `-n`, String(maxCommits), "--numstat", "--pretty=format:__COMMIT__%H|%ad", "--date=short"],
            { cwd: repoDir, timeout: 10000, maxBuffer: 4 * 1024 * 1024 },
            (err, stdout) => {
              if (err) resolve("");
              else resolve(stdout || "");
            },
          );
        });

        const fileChurn = new Map<string, { commits: number; additions: number; deletions: number }>();
        let commitCount = 0;
        for (const line of gitOut.split(/\r?\n/)) {
          if (line.startsWith("__COMMIT__")) {
            commitCount++;
            continue;
          }
          const m = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
          if (m) {
            const add = m[1] === "-" ? 0 : parseInt(m[1], 10);
            const del = m[2] === "-" ? 0 : parseInt(m[2], 10);
            const file = m[3].trim();
            const cur = fileChurn.get(file) || { commits: 0, additions: 0, deletions: 0 };
            cur.commits++;
            cur.additions += add;
            cur.deletions += del;
            fileChurn.set(file, cur);
          }
        }

        // Cross-reference churn with indexed complexity for Technical Debt Hotspots
        const fileComplexity = new Map<string, number>();
        for (const n of Object.values(graph.nodes)) {
          if (n.label === "Function" && n.file) {
            fileComplexity.set(n.file, (fileComplexity.get(n.file) || 0) + (n.complexity || 1));
          }
        }

        const hotspots = Array.from(fileChurn.entries())
          .map(([file, c]) => {
            const complexity = fileComplexity.get(file) || 1;
            return {
              file,
              commits: c.commits,
              additions: c.additions,
              deletions: c.deletions,
              complexity,
              debtScore: c.commits * complexity,
            };
          })
          .sort((a, b) => b.debtScore - a.debtScore)
          .slice(0, 15);

        return formatOptimizedResponse({
          repoPath: repoDir,
          commitsAnalyzed: commitCount,
          hotspots,
        });
      } catch (err: any) {
        return formatError(err);
      }
    },
  );

  // 30. web_search
  reg(
    "web_search",
    {
      description:
        "Performs a fast, secure web search for a given query, returning titles, snippets, and source URLs.",
      inputSchema: {
        query: z.string().describe("Search keywords or question"),
        limit: z
          .number()
          .int()
          .default(5)
          .describe("Maximum results to return (1-15)"),
      },
      annotations: getToolAnnotations("web_search"),
    },
    async (args: any) => {
      try {
        const searchResult = await performWebSearch(args.query, args.limit);
        return formatOptimizedResponse(searchResult);
      } catch (err: any) {
        return formatError(err);
      }
    },
  );
}
