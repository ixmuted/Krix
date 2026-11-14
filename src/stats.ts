import fs from "node:fs";
import path from "node:path";
import { MongoClient, type Db } from "mongodb";
import { fileShareRegistry } from "./fileShareRegistry.js";
import { getMongoDb } from "./googleAuth.js";
import { CODE_GRAPH_TOOLS_CATALOG } from "./codeGraphTools.js";
import { getToolInputSchema } from "./toolSchemas.js";

export interface KeyMetrics {
  keyId: string;
  label: string;
  type: "api_key" | "oauth" | "master";
  totalRequests: number;
  successCount: number;
  errorCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  bytesIn: number;
  bytesOut: number;
  lastActiveAt: number;
  lastClientIp: string;
  lastUserAgent: string;
  toolCalls: Record<string, number>;
  toolMetrics?: Record<string, ToolUsageMetrics>;
  daily: Record<string, number>;
  dailyErrors?: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
}

export interface SharedSandboxStats {
  uploadFileCount: number;
  uploadBytes: number;
  uploadFiles: Array<{ name: string; size: number; mtime: number }>;
  activeWorkDirs: number;
  totalDiskBytes: number;
  quotaLimitMb: number;
  quotaUsedPercent: number;
  storageBreakdown?: {
    uploadMb: number;
    workspaceMb: number;
    tempMb: number;
  };
}

export interface RecentErrorEntry {
  timestamp: number;
  toolName: string;
  errorMessage: string;
  keyId: string;
  client: string;
  statusCode: number;
}

export interface SystemHealthStats {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  uptimeSec: number;
  nodeVersion: string;
  platform: string;
}

interface ToolUsageMetrics {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  totalDurationMs: number;
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
}

export interface ToolDetailMeta {
  name: string;
  category:
    | "Sandbox"
    | "Files"
    | "Render"
    | "GitHub"
    | "Execution"
    | "Filesystem"
    | "Git & Cloud"
    | "Inspection"
    | "Code Graph"
    | "Search";
  description: string;
  inputSchema?: Record<string, unknown>;
  totalCalls: number;
  successRate: number;
  avgDurationMs: number;
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
}

export interface StatsSummary {
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  overallSuccessRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  throughputRpm: number;
  activeHttpSessions: number;
  totalBytesIn: number;
  totalBytesOut: number;
  uniqueKeysCount: number;
  keys: KeyMetrics[];
  toolDistribution: Record<string, number>;
  protocolDistribution: Record<string, number>;
  dailyTimeline: Array<{
    date: string;
    requests: number;
    tools: number;
    errors: number;
    success: number;
  }>;
  weeklyTimeline: Array<{
    week: string;
    requests: number;
    tools: number;
    errors: number;
    success: number;
  }>;
  monthlyTimeline: Array<{
    month: string;
    requests: number;
    tools: number;
    errors: number;
    success: number;
  }>;
  availableYears: number[];
  sharedSandbox: SharedSandboxStats;
  systemHealth: SystemHealthStats;
  statusCodes: Record<string, number>;
  clientEcosystems: Record<string, number>;
  recentErrors: RecentErrorEntry[];
  peakTraffic: {
    peakHourUtc: number | null;
    peakDay: string | null;
  };
  toolsCatalog: ToolDetailMeta[];
  selectedKeyId?: string;
  lastUpdated: number;
}

export class StatsTracker {
  private keys = new Map<string, KeyMetrics>();
  private globalTools: Record<string, number> = {};
  private toolMetrics: Record<string, ToolUsageMetrics> = {};
  private globalProtocol: Record<string, number> = {};
  private globalDaily: Record<
    string,
    { requests: number; tools: number; errors?: number }
  > = {};
  private globalWeekly: Record<
    string,
    { requests: number; tools: number; errors?: number }
  > = {};
  private globalMonthly: Record<
    string,
    { requests: number; tools: number; errors?: number }
  > = {};
  private statusCodes: Record<string, number> = {
    "200": 0,
    "400": 0,
    "401": 0,
    "413": 0,
    "500": 0,
  };
  private clientEcosystems: Record<string, number> = {
    "Claude Desktop": 0,
    Cursor: 0,
    "Google Gemini": 0,
    ChatGPT: 0,
    Antigravity: 0,
    "CLI / Script": 0,
    Other: 0,
  };
  private recentErrors: RecentErrorEntry[] = [];
  private recentTimestamps: number[] = [];
  private recentDurations: number[] = [];
  private hourlyCounts: number[] = new Array(24).fill(0);
  private dayOfWeekCounts: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  private activeHttpSessions = 0;
  private filePath = path.resolve(process.cwd(), "data", ".krix_stats.json");
  private saveTimeout: NodeJS.Timeout | null = null;
  private persistQueue: Promise<void> = Promise.resolve();
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private mongoConnected = false;
  private mongoInitPromise: Promise<void> | null = null;
  // True only after the stored stats document was read. Nothing may be written to MongoDB
  // before that, or a fresh in-memory state could overwrite the saved statistics.
  private mongoLoaded = false;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    }
    this.loadFromFile();
    this.ensureMongo().catch(() => {});
  }

  public setActiveSessions(count: number): void {
    this.activeHttpSessions = Math.max(0, count);
  }

  public async ensureMongo(): Promise<void> {
    if (this.mongoConnected && this.mongoDb) return;
    const sharedDb = getMongoDb();
    if (sharedDb) {
      this.mongoDb = sharedDb;
      fileShareRegistry.setMongoDb(sharedDb);
      try {
        await this.loadFromMongo();
        this.mongoConnected = true;
      } catch (error) {
        this.mongoConnected = false;
        throw error;
      }
      return;
    }
    if (!this.mongoInitPromise) {
      this.mongoInitPromise = this.initMongo();
    }
    try {
      await this.mongoInitPromise;
    } catch (error) {
      this.mongoInitPromise = null;
      throw error;
    }
  }

  private async initMongo(): Promise<void> {
    const sharedDb = getMongoDb();
    if (sharedDb) {
      this.mongoDb = sharedDb;
      fileShareRegistry.setMongoDb(sharedDb);
      await this.loadFromMongo();
      this.mongoConnected = true;
      return;
    }
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL;
    if (!uri) return;
    try {
      this.mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        appName: "krix-stats",
      });
      await this.mongoClient.connect();
      const dbName =
        process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || "krix";
      this.mongoDb = this.mongoClient.db(dbName);
      fileShareRegistry.setMongoDb(this.mongoDb);
      await this.loadFromMongo();
      this.mongoConnected = true;
    } catch (error: any) {
      this.mongoConnected = false;
      this.mongoDb = null;
      console.error(
        "[stats] MongoDB initialization failed:",
        error?.message || error,
      );
      throw error;
    }
  }

  private getDateKeys(now: Date = new Date()) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const d = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    const week = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;

    return {
      date: `${year}-${month}-${day}`,
      week,
      month: `${year}-${month}`,
      year,
    };
  }

  private detectEcosystem(ua?: string, label?: string, keyId?: string): string {
    const combined = `${ua || ""} ${label || ""} ${keyId || ""}`.toLowerCase();
    if (combined.includes("gemini") || combined.includes("google"))
      return "Google Gemini";
    if (combined.includes("claude") || combined.includes("anthropic"))
      return "Claude Desktop";
    if (combined.includes("cursor")) return "Cursor";
    if (combined.includes("antigravity") || combined.includes("agy"))
      return "Antigravity";
    if (combined.includes("chatgpt") || combined.includes("openai"))
      return "ChatGPT";
    if (
      combined.includes("python") ||
      combined.includes("curl") ||
      combined.includes("node") ||
      combined.includes("fetch") ||
      combined.includes("postman")
    ) {
      return "CLI / Script";
    }
    return "Other";
  }

  public recordRequest(params: {
    keyId: string;
    label?: string;
    type?: "api_key" | "oauth" | "master";
    toolName?: string;
    isActualTool?: boolean;
    durationMs: number;
    isError?: boolean;
    statusCode?: number;
    errorMessage?: string;
    bytesIn?: number;
    bytesOut?: number;
    ip?: string;
    userAgent?: string;
  }): void {
    const isError =
      typeof params.isError === "boolean"
        ? params.isError
        : params.statusCode !== undefined
          ? params.statusCode >= 400
          : false;
    const {
      keyId,
      durationMs,
      statusCode = isError ? 500 : 200,
      errorMessage,
      bytesIn = 0,
      bytesOut = 0,
      toolName,
      isActualTool = Boolean(
        toolName &&
        ![
          "mcp_request",
          "server/discover",
          "initialize",
          "notifications/initialized",
          "tools/list",
          "prompts/list",
          "resources/list",
        ].includes(toolName),
      ),
      ip,
      userAgent,
    } = params;

    const now = new Date();
    const { date, week, month } = this.getDateKeys(now);

    // Track throughput & latency sampling
    const nowMs = now.getTime();
    this.recentTimestamps.push(nowMs);
    this.recentDurations.push(durationMs);
    // Keep 5-minute rolling window
    const cutoff5m = nowMs - 5 * 60 * 1000;
    while (
      this.recentTimestamps.length > 0 &&
      this.recentTimestamps[0] < cutoff5m
    ) {
      this.recentTimestamps.shift();
    }
    if (this.recentDurations.length > 200) {
      this.recentDurations.shift();
    }

    // Peak traffic windows
    const hourUtc = now.getUTCHours();
    this.hourlyCounts[hourUtc] = (this.hourlyCounts[hourUtc] || 0) + 1;
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = days[now.getUTCDay()];
    this.dayOfWeekCounts[dayName] = (this.dayOfWeekCounts[dayName] || 0) + 1;

    // Status code breakdown
    const codeKey = String(statusCode);
    this.statusCodes[codeKey] = (this.statusCodes[codeKey] || 0) + 1;

    // Client ecosystem breakdown
    const eco = this.detectEcosystem(userAgent, params.label, keyId);
    this.clientEcosystems[eco] = (this.clientEcosystems[eco] || 0) + 1;

    let entry = this.keys.get(keyId);
    if (!entry) {
      entry = {
        keyId,
        label:
          params.label ||
          (keyId.startsWith("oauth:")
            ? `OAuth Client (${keyId.slice(6, 16)})`
            : keyId === "master" ||
                keyId === "master-env-key" ||
                keyId === "primary-key"
              ? "Primary Key"
              : "API Key"),
        type:
          params.type ||
          (keyId.startsWith("oauth:")
            ? "oauth"
            : keyId === "master" ||
                keyId === "master-env-key" ||
                keyId === "primary-key"
              ? "master"
              : "api_key"),
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        totalDurationMs: 0,
        avgDurationMs: 0,
        bytesIn: 0,
        bytesOut: 0,
        lastActiveAt: 0,
        lastClientIp: "",
        lastUserAgent: "",
        toolCalls: {},
        toolMetrics: {},
        daily: {},
        weekly: {},
        monthly: {},
      };
      this.keys.set(keyId, entry);
    }

    entry.totalRequests++;
    if (isError) {
      entry.errorCount++;
      if (!entry.dailyErrors) entry.dailyErrors = {};
      entry.dailyErrors[date] = (entry.dailyErrors[date] || 0) + 1;
    } else {
      entry.successCount++;
    }
    entry.totalDurationMs += durationMs;
    entry.avgDurationMs = Math.round(
      entry.totalDurationMs / entry.totalRequests,
    );
    entry.bytesIn += bytesIn;
    entry.bytesOut += bytesOut;
    entry.lastActiveAt = nowMs;
    if (ip) entry.lastClientIp = ip;
    if (userAgent) entry.lastUserAgent = userAgent.slice(0, 100);

    // Timelines
    entry.daily[date] = (entry.daily[date] || 0) + 1;
    entry.weekly[week] = (entry.weekly[week] || 0) + 1;
    entry.monthly[month] = (entry.monthly[month] || 0) + 1;

    // Global aggregations
    if (!this.globalDaily[date])
      this.globalDaily[date] = { requests: 0, tools: 0, errors: 0 };
    this.globalDaily[date].requests++;
    if (isError) {
      this.globalDaily[date].errors = (this.globalDaily[date].errors || 0) + 1;
    }

    if (!this.globalWeekly[week])
      this.globalWeekly[week] = { requests: 0, tools: 0, errors: 0 };
    this.globalWeekly[week].requests++;
    if (isError) {
      this.globalWeekly[week].errors =
        (this.globalWeekly[week].errors || 0) + 1;
    }

    if (!this.globalMonthly[month])
      this.globalMonthly[month] = { requests: 0, tools: 0, errors: 0 };
    this.globalMonthly[month].requests++;
    if (isError) {
      this.globalMonthly[month].errors =
        (this.globalMonthly[month].errors || 0) + 1;
    }

    if (toolName) {
      if (isActualTool) {
        entry.toolCalls[toolName] = (entry.toolCalls[toolName] || 0) + 1;
        this.globalTools[toolName] = (this.globalTools[toolName] || 0) + 1;
        this.globalDaily[date].tools++;
        this.globalWeekly[week].tools++;
        this.globalMonthly[month].tools++;
        const tool =
          this.toolMetrics[toolName] ||
          (this.toolMetrics[toolName] = {
            totalCalls: 0,
            successCount: 0,
            errorCount: 0,
            totalDurationMs: 0,
            daily: {},
            weekly: {},
            monthly: {},
          });
        const keyTool =
          (entry.toolMetrics ||= {})[toolName] ||
          ((entry.toolMetrics ||= {})[toolName] = {
            totalCalls: 0,
            successCount: 0,
            errorCount: 0,
            totalDurationMs: 0,
            daily: {},
            weekly: {},
            monthly: {},
          });
        for (const metric of [tool, keyTool]) {
          metric.totalCalls++;
          if (isError) metric.errorCount++;
          else metric.successCount++;
          metric.totalDurationMs += durationMs;
          metric.daily[date] = (metric.daily[date] || 0) + 1;
          metric.weekly[week] = (metric.weekly[week] || 0) + 1;
          metric.monthly[month] = (metric.monthly[month] || 0) + 1;
        }
      } else {
        this.globalProtocol[toolName] =
          (this.globalProtocol[toolName] || 0) + 1;
      }
    }

    // Record error log
    if (isError && (errorMessage || isActualTool || statusCode >= 400)) {
      this.recentErrors.unshift({
        timestamp: nowMs,
        toolName: toolName || "http_request",
        errorMessage: errorMessage || `HTTP ${statusCode} failure`,
        keyId: entry.label,
        client: eco,
        statusCode,
      });
      if (this.recentErrors.length > 8) {
        this.recentErrors.pop();
      }
    }

    this.scheduleSave();
  }

  public getSharedSandboxStats(
    sandboxRoot?: string,
    isOwner: boolean = true,
  ): SharedSandboxStats {
    let uploadFileCount = 0;
    let uploadBytes = 0;
    const uploadFiles: Array<{ name: string; size: number; mtime: number }> =
      [];
    let activeWorkDirs = 0;
    let totalDiskBytes = 0;
    let workspaceBytes = 0;
    let tempBytes = 0;

    // Distribute quotas: Owner receives standard/full limits (300MB default),
    // regular users receive 50MB
    const quotaLimitMb = isOwner
      ? Number(process.env.SANDBOX_MAX_TOTAL_MB) || 300
      : 50;

    if (sandboxRoot && fs.existsSync(sandboxRoot)) {
      try {
        const uploadDir = path.join(sandboxRoot, "upload");
        if (fs.existsSync(uploadDir)) {
          const files = fs.readdirSync(uploadDir);
          for (const f of files) {
            try {
              const st = fs.statSync(path.join(uploadDir, f));
              if (st.isFile()) {
                uploadFileCount++;
                uploadBytes += st.size;
                uploadFiles.push({
                  name: f,
                  size: st.size,
                  mtime: st.mtimeMs,
                });
              }
            } catch {}
          }
        }

        const entries = fs.readdirSync(sandboxRoot);
        for (const e of entries) {
          if (e === "upload") continue;
          try {
            const p = path.join(sandboxRoot, e);
            const st = fs.statSync(p);
            if (st.isDirectory()) {
              activeWorkDirs++;
              // approximate size of workspace
              workspaceBytes += 1024 * 1024; // baseline per directory
            } else {
              tempBytes += st.size;
            }
          } catch {}
        }
      } catch {}
    }

    totalDiskBytes = uploadBytes + workspaceBytes + tempBytes;
    const quotaUsedPercent = Math.min(
      100,
      Math.round((totalDiskBytes / (quotaLimitMb * 1024 * 1024)) * 100 * 10) /
        10,
    );

    return {
      uploadFileCount,
      uploadBytes,
      uploadFiles: uploadFiles.sort((a, b) => b.mtime - a.mtime).slice(0, 10),
      activeWorkDirs,
      totalDiskBytes,
      quotaLimitMb,
      quotaUsedPercent,
      storageBreakdown: {
        uploadMb: Math.round((uploadBytes / (1024 * 1024)) * 10) / 10,
        workspaceMb: Math.round((workspaceBytes / (1024 * 1024)) * 10) / 10,
        tempMb: Math.round((tempBytes / (1024 * 1024)) * 10) / 10,
      },
    };
  }

  public syncKnownKeys(
    dynamicKeys?: Array<{ id: string; label?: string; clientId?: string }>,
    oauthClients?: Array<{ clientId: string; clientName?: string }>,
  ): void {
    let changed = false;

    if (dynamicKeys && Array.isArray(dynamicKeys)) {
      for (const k of dynamicKeys) {
        if (!k.id) continue;
        const targetLabel = k.label || `API Key (${k.id.slice(0, 8)})`;
        let canonical = this.keys.get(k.id);
        if (!canonical) {
          canonical = {
            keyId: k.id,
            label: targetLabel,
            type: "api_key",
            totalRequests: 0,
            successCount: 0,
            errorCount: 0,
            totalDurationMs: 0,
            avgDurationMs: 0,
            bytesIn: 0,
            bytesOut: 0,
            lastActiveAt: 0,
            lastClientIp: "",
            lastUserAgent: "",
            toolCalls: {},
            daily: {},
            weekly: {},
            monthly: {},
          };
          this.keys.set(k.id, canonical);
          changed = true;
        } else if (k.label && canonical.label !== k.label) {
          canonical.label = k.label;
          changed = true;
        }

        // Merge any legacy keys starting with dyn: matching this dynamic key
        const prefix = k.id.slice(0, 16);
        for (const [existingKeyId, existingMetrics] of Array.from(
          this.keys.entries(),
        )) {
          if (existingKeyId === k.id) continue;
          if (
            existingKeyId.startsWith("dyn:") &&
            (existingKeyId.includes(prefix) ||
              existingKeyId.includes(k.id) ||
              (k.label && existingMetrics.label.includes(k.label)))
          ) {
            canonical.totalRequests += existingMetrics.totalRequests;
            canonical.successCount += existingMetrics.successCount;
            canonical.errorCount += existingMetrics.errorCount;
            canonical.totalDurationMs += existingMetrics.totalDurationMs;
            canonical.avgDurationMs =
              canonical.totalRequests > 0
                ? Math.round(
                    canonical.totalDurationMs / canonical.totalRequests,
                  )
                : 0;
            canonical.bytesIn += existingMetrics.bytesIn;
            canonical.bytesOut += existingMetrics.bytesOut;
            canonical.lastActiveAt = Math.max(
              canonical.lastActiveAt,
              existingMetrics.lastActiveAt,
            );
            if (existingMetrics.lastClientIp)
              canonical.lastClientIp = existingMetrics.lastClientIp;
            if (existingMetrics.lastUserAgent)
              canonical.lastUserAgent = existingMetrics.lastUserAgent;
            for (const [t, c] of Object.entries(
              existingMetrics.toolCalls || {},
            )) {
              canonical.toolCalls[t] = (canonical.toolCalls[t] || 0) + c;
            }
            for (const [d, c] of Object.entries(existingMetrics.daily || {})) {
              canonical.daily[d] = (canonical.daily[d] || 0) + c;
            }
            for (const [w, c] of Object.entries(existingMetrics.weekly || {})) {
              canonical.weekly[w] = (canonical.weekly[w] || 0) + c;
            }
            for (const [m, c] of Object.entries(
              existingMetrics.monthly || {},
            )) {
              canonical.monthly[m] = (canonical.monthly[m] || 0) + c;
            }
            this.keys.delete(existingKeyId);
            changed = true;
          }
        }
      }

      // Purge revoked/deleted API keys from active keys collection
      const activeDynamicIds = new Set(dynamicKeys.map((k) => k.id));
      for (const [existingKeyId, existingMetrics] of Array.from(
        this.keys.entries(),
      )) {
        if (
          existingMetrics.type === "api_key" &&
          !activeDynamicIds.has(existingKeyId) &&
          existingKeyId !== "primary-key"
        ) {
          this.keys.delete(existingKeyId);
          changed = true;
        }
      }
    }

    if (oauthClients && Array.isArray(oauthClients)) {
      for (const c of oauthClients) {
        if (!c.clientId) continue;
        const targetLabel =
          c.clientName ||
          (c.clientId.toLowerCase().includes("gemini")
            ? "Google Gemini"
            : `OAuth Client (${c.clientId.slice(0, 8)})`);
        let canonical = this.keys.get(c.clientId);
        if (!canonical) {
          canonical = {
            keyId: c.clientId,
            label: targetLabel,
            type: "oauth",
            totalRequests: 0,
            successCount: 0,
            errorCount: 0,
            totalDurationMs: 0,
            avgDurationMs: 0,
            bytesIn: 0,
            bytesOut: 0,
            lastActiveAt: 0,
            lastClientIp: "",
            lastUserAgent: "",
            toolCalls: {},
            daily: {},
            weekly: {},
            monthly: {},
          };
          this.keys.set(c.clientId, canonical);
          changed = true;
        } else if (c.clientName && canonical.label !== c.clientName) {
          canonical.label = c.clientName;
          changed = true;
        }

        // Merge legacy keys (e.g. oauth:sub or oauth:clientId) into the canonical clientId entry
        for (const [existingKeyId, existingMetrics] of Array.from(
          this.keys.entries(),
        )) {
          if (existingKeyId === c.clientId) continue;
          const isLegacyOAuthMatch =
            (existingKeyId.startsWith("oauth:") &&
              (existingKeyId.includes(c.clientId) ||
                existingMetrics.label.includes(c.clientId) ||
                (c.clientId.toLowerCase().includes("gemini") &&
                  (existingMetrics.label.toLowerCase().includes("gemini") ||
                    existingMetrics.label.includes(c.clientId))) ||
                (c.clientName &&
                  existingMetrics.label
                    .toLowerCase()
                    .includes(c.clientName.toLowerCase())))) ||
            existingKeyId === `oauth:${c.clientId}`;

          if (isLegacyOAuthMatch) {
            canonical.totalRequests += existingMetrics.totalRequests;
            canonical.successCount += existingMetrics.successCount;
            canonical.errorCount += existingMetrics.errorCount;
            canonical.totalDurationMs += existingMetrics.totalDurationMs;
            canonical.avgDurationMs =
              canonical.totalRequests > 0
                ? Math.round(
                    canonical.totalDurationMs / canonical.totalRequests,
                  )
                : 0;
            canonical.bytesIn += existingMetrics.bytesIn;
            canonical.bytesOut += existingMetrics.bytesOut;
            canonical.lastActiveAt = Math.max(
              canonical.lastActiveAt,
              existingMetrics.lastActiveAt,
            );
            if (existingMetrics.lastClientIp)
              canonical.lastClientIp = existingMetrics.lastClientIp;
            if (existingMetrics.lastUserAgent)
              canonical.lastUserAgent = existingMetrics.lastUserAgent;
            for (const [t, cnt] of Object.entries(
              existingMetrics.toolCalls || {},
            )) {
              canonical.toolCalls[t] = (canonical.toolCalls[t] || 0) + cnt;
            }
            for (const [toolName, metrics] of Object.entries(
              existingMetrics.toolMetrics || {},
            )) {
              const target =
                (canonical.toolMetrics ||= {})[toolName] ||
                ((canonical.toolMetrics ||= {})[toolName] = {
                  totalCalls: 0,
                  successCount: 0,
                  errorCount: 0,
                  totalDurationMs: 0,
                  daily: {},
                  weekly: {},
                  monthly: {},
                });
              target.totalCalls += metrics.totalCalls || 0;
              target.successCount += metrics.successCount || 0;
              target.errorCount += metrics.errorCount || 0;
              target.totalDurationMs += metrics.totalDurationMs || 0;
              for (const [d, count] of Object.entries(metrics.daily || {}))
                target.daily[d] = (target.daily[d] || 0) + count;
              for (const [w, count] of Object.entries(metrics.weekly || {}))
                target.weekly[w] = (target.weekly[w] || 0) + count;
              for (const [m, count] of Object.entries(metrics.monthly || {}))
                target.monthly[m] = (target.monthly[m] || 0) + count;
            }
            for (const [d, cnt] of Object.entries(
              existingMetrics.daily || {},
            )) {
              canonical.daily[d] = (canonical.daily[d] || 0) + cnt;
            }
            for (const [w, cnt] of Object.entries(
              existingMetrics.weekly || {},
            )) {
              canonical.weekly[w] = (canonical.weekly[w] || 0) + cnt;
            }
            for (const [m, cnt] of Object.entries(
              existingMetrics.monthly || {},
            )) {
              canonical.monthly[m] = (canonical.monthly[m] || 0) + cnt;
            }
            this.keys.delete(existingKeyId);
            changed = true;
          }
        }
      }

      // Purge revoked/deleted OAuth clients from active keys collection
      const activeOAuthClientIds = new Set(oauthClients.map((c) => c.clientId));
      for (const [existingKeyId, existingMetrics] of Array.from(
        this.keys.entries(),
      )) {
        if (
          existingMetrics.type === "oauth" &&
          !activeOAuthClientIds.has(existingKeyId)
        ) {
          this.keys.delete(existingKeyId);
          changed = true;
        }
      }
    }

    // Complete purge of any orphaned legacy keys not in active dynamic keys or active OAuth clients
    if (dynamicKeys && oauthClients) {
      const activeDynamicIds = new Set(dynamicKeys.map((k) => k.id));
      const activeOAuthClientIds = new Set(oauthClients.map((c) => c.clientId));
      for (const [existingKeyId] of Array.from(this.keys.entries())) {
        if (
          existingKeyId === "primary-key" ||
          existingKeyId === "master-env-key"
        )
          continue;
        if (
          !activeDynamicIds.has(existingKeyId) &&
          !activeOAuthClientIds.has(existingKeyId)
        ) {
          this.keys.delete(existingKeyId);
          changed = true;
        }
      }
    }

    if (changed) {
      this.scheduleSave();
    }
  }

  public removeKey(id: string): void {
    let changed = false;
    if (this.keys.has(id)) {
      this.keys.delete(id);
      changed = true;
    }
    for (const k of Array.from(this.keys.keys())) {
      if (k === id || k.includes(id)) {
        this.keys.delete(k);
        changed = true;
      }
    }
    if (changed) {
      this.scheduleSave();
    }
  }

  public getSummary(
    sandboxRoot?: string,
    targetKeyId?: string,
    isOwner: boolean = true,
  ): StatsSummary {
    const keys = Array.from(this.keys.values()).sort(
      (a, b) => b.totalRequests - a.totalRequests,
    );
    const isFiltered = Boolean(targetKeyId && targetKeyId !== "all");
    const matchedKey = isFiltered
      ? keys.find(
          (k) =>
            k.keyId === targetKeyId ||
            k.keyId.toLowerCase() === targetKeyId?.toLowerCase() ||
            k.label.toLowerCase() === targetKeyId?.toLowerCase() ||
            k.keyId.startsWith(targetKeyId!) ||
            targetKeyId!.startsWith(k.keyId),
        ) || null
      : null;

    let totalRequests = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalDuration = 0;
    let totalBytesIn = 0;
    let totalBytesOut = 0;

    if (isFiltered) {
      if (matchedKey) {
        totalRequests = matchedKey.totalRequests;
        totalSuccess = matchedKey.successCount;
        totalErrors = matchedKey.errorCount;
        totalDuration = matchedKey.totalDurationMs;
        totalBytesIn = matchedKey.bytesIn;
        totalBytesOut = matchedKey.bytesOut;
      }
    } else {
      for (const k of keys) {
        totalRequests += k.totalRequests;
        totalSuccess += k.successCount;
        totalErrors += k.errorCount;
        totalDuration += k.totalDurationMs;
        totalBytesIn += k.bytesIn;
        totalBytesOut += k.bytesOut;
      }
    }

    const overallSuccessRate =
      totalRequests > 0
        ? Math.round((totalSuccess / totalRequests) * 1000) / 10
        : 100;
    const avgDurationMs =
      totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    // Calculate P95 latency
    let p95DurationMs = avgDurationMs;
    if (this.recentDurations.length > 0) {
      const sorted = [...this.recentDurations].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * 0.95);
      p95DurationMs = sorted[Math.min(idx, sorted.length - 1)];
    }

    // Calculate rolling throughput RPM (requests per minute over 5 min)
    const nowMs = Date.now();
    const cutoff5m = nowMs - 5 * 60 * 1000;
    const count5m = this.recentTimestamps.filter((t) => t >= cutoff5m).length;
    const throughputRpm = Math.round((count5m / 5) * 10) / 10;

    // Calculate peak traffic (strictly real data, null if zero requests)
    let peakHourUtc: number | null = null;
    let maxHourly = 0;
    for (let h = 0; h < 24; h++) {
      if (this.hourlyCounts[h] > maxHourly) {
        maxHourly = this.hourlyCounts[h];
        peakHourUtc = h;
      }
    }

    let peakDay: string | null = null;
    let maxDayCount = 0;
    for (const [day, count] of Object.entries(this.dayOfWeekCounts)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        peakDay = day;
      }
    }

    // Dynamic smart years calculation
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    for (const monthKey of Object.keys(this.globalMonthly)) {
      const y = parseInt(monthKey.split("-")[0], 10);
      if (Number.isFinite(y) && y >= 2024 && y <= currentYear + 1) {
        yearsSet.add(y);
      }
    }
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Continuous rolling timelines (30 continuous days, 12 weeks, 12 months)
    const dailyTimeline: Array<{
      date: string;
      requests: number;
      tools: number;
      errors: number;
      success: number;
    }> = [];
    const nowTime = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(nowTime.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const reqCount = isFiltered
        ? matchedKey?.daily[key] || 0
        : this.globalDaily[key]?.requests || 0;
      const errCount = isFiltered
        ? matchedKey?.dailyErrors?.[key] || 0
        : this.globalDaily[key]?.errors || 0;
      const toolCount = isFiltered ? 0 : this.globalDaily[key]?.tools || 0;
      const succCount = Math.max(0, reqCount - errCount);
      dailyTimeline.push({
        date: key,
        requests: reqCount,
        tools: toolCount,
        errors: errCount,
        success: succCount,
      });
    }

    const weeklyTimeline: Array<{
      week: string;
      requests: number;
      tools: number;
      errors: number;
      success: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowTime.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const { week } = this.getDateKeys(d);
      const reqCount = isFiltered
        ? matchedKey?.weekly[week] || 0
        : this.globalWeekly[week]?.requests || 0;
      const errCount = this.globalWeekly[week]?.errors || 0;
      const toolCount = isFiltered ? 0 : this.globalWeekly[week]?.tools || 0;
      const succCount = Math.max(0, reqCount - errCount);
      if (!weeklyTimeline.some((w) => w.week === week)) {
        weeklyTimeline.push({
          week,
          requests: reqCount,
          tools: toolCount,
          errors: errCount,
          success: succCount,
        });
      }
    }
    while (weeklyTimeline.length < 12) {
      weeklyTimeline.unshift({
        week: `W-${12 - weeklyTimeline.length}`,
        requests: 0,
        tools: 0,
        errors: 0,
        success: 0,
      });
    }

    const monthlyTimeline: Array<{
      month: string;
      requests: number;
      tools: number;
      errors: number;
      success: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowTime.getFullYear(), nowTime.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const reqCount = isFiltered
        ? matchedKey?.monthly[key] || 0
        : this.globalMonthly[key]?.requests || 0;
      const errCount = this.globalMonthly[key]?.errors || 0;
      const toolCount = isFiltered ? 0 : this.globalMonthly[key]?.tools || 0;
      const succCount = Math.max(0, reqCount - errCount);
      monthlyTimeline.push({
        month: key,
        requests: reqCount,
        tools: toolCount,
        errors: errCount,
        success: succCount,
      });
    }

    // System process health
    const mem = process.memoryUsage();
    const systemHealth: SystemHealthStats = {
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
      rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
      uptimeSec: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: `${process.platform} (${process.arch})`,
    };

    // Tools Catalog with complete specifications for all MCP tools offered by Krix
    const knownTools: Array<{
      name: string;
      category:
        "Sandbox" | "Files" | "Render" | "GitHub" | "Code Graph" | "Search";
      description: string;
    }> = [
      // 1. Sandbox Tools (14 tools)
      {
        name: "sandbox_exec",
        category: "Sandbox",
        description:
          "Executes commands, compilers, tests, and scripts inside the isolated sandbox.",
      },
      {
        name: "sandbox_run",
        category: "Sandbox",
        description:
          "Runs long-running background tasks or development servers with log streaming.",
      },
      {
        name: "sandbox_install",
        category: "Sandbox",
        description:
          "Installs package dependencies (npm, pip, apt) inside the sandbox workspace.",
      },
      {
        name: "sandbox_ps",
        category: "Sandbox",
        description:
          "Lists running processes, PIDs, memory usage, and background jobs in the sandbox.",
      },
      {
        name: "sandbox_output",
        category: "Sandbox",
        description:
          "Retrieves accumulated stdout and stderr streams from background sandbox tasks.",
      },
      {
        name: "sandbox_file",
        category: "Sandbox",
        description:
          "Reads, writes, updates, and inspects files in the workspace with atomic disk safety.",
      },
      {
        name: "sandbox_reset",
        category: "Sandbox",
        description:
          "Resets sandbox workspace to a clean state while preserving shared uploads.",
      },
      {
        name: "sandbox_status",
        category: "Sandbox",
        description:
          "Reports container health, memory utilization, disk usage, and resource quotas.",
      },
      {
        name: "git_clone",
        category: "Sandbox",
        description:
          "Clones public or private GitHub repositories directly into the sandbox working tree.",
      },
      {
        name: "git_checkout",
        category: "Sandbox",
        description:
          "Switches branches, tags, or commits within cloned git repositories in the sandbox.",
      },
      {
        name: "git_pull",
        category: "Sandbox",
        description:
          "Pulls and integrates latest commits from upstream remote repository tracking branches.",
      },
      {
        name: "git_status",
        category: "Sandbox",
        description:
          "Inspects modified, untracked, and staged file paths in the active repository tree.",
      },
      {
        name: "git_diff",
        category: "Sandbox",
        description:
          "Generates unified diffs of uncommitted changes across files in the sandbox workspace.",
      },
      {
        name: "git_commit_push",
        category: "Sandbox",
        description:
          "Stages workspace modifications, creates signed commits, and pushes to remote branches.",
      },

      // 2. File Storage Tools (1 tool - merged in Sandbox)
      {
        name: "sandbox_store",
        category: "Sandbox",
        description:
          "Persistent cloud storage, permanent retention, direct sharing links, and uploads.",
      },

      // 3. Render Tools (21 tools)
      {
        name: "list_workspaces",
        category: "Render",
        description:
          "Lists all authorized Render workspaces and team organization accounts.",
      },
      {
        name: "select_workspace",
        category: "Render",
        description:
          "Sets the active target workspace context for subsequent Render management calls.",
      },
      {
        name: "get_selected_workspace",
        category: "Render",
        description:
          "Retrieves metadata and owner details for the currently active Render workspace.",
      },
      {
        name: "list_services",
        category: "Render",
        description:
          "Lists web services, background workers, cron jobs, and static sites on Render.",
      },
      {
        name: "get_service",
        category: "Render",
        description:
          "Fetches configuration, environment variables, health status, and live URL.",
      },
      {
        name: "create_web_service",
        category: "Render",
        description:
          "Deploys a new containerized web service or Node.js/Python server to Render.",
      },
      {
        name: "create_static_site",
        category: "Render",
        description:
          "Provisions and deploys a high-speed CDN static website on Render infrastructure.",
      },
      {
        name: "create_cron_job",
        category: "Render",
        description:
          "Schedules recurring cron jobs and timed background tasks on Render.",
      },
      {
        name: "restart_service",
        category: "Render",
        description:
          "Restarts running service containers on Render to pick up fresh environment configurations.",
      },
      {
        name: "delete_service",
        category: "Render",
        description:
          "Permanently tears down and destroys a service instance on Render.",
      },
      {
        name: "list_deploys",
        category: "Render",
        description:
          "Retrieves recent deployment history, build statuses, commit hashes, and triggers.",
      },
      {
        name: "get_deploy",
        category: "Render",
        description:
          "Fetches real-time build logs, progress, and error traces for an active Render deploy.",
      },
      {
        name: "trigger_deploy",
        category: "Render",
        description:
          "Triggers a live continuous deployment build with optional cache invalidation.",
      },
      {
        name: "cancel_deploy",
        category: "Render",
        description:
          "Cancels an in-progress build or deployment pipeline on Render.",
      },
      {
        name: "list_logs",
        category: "Render",
        description:
          "Streams live stdout and stderr runtime log lines from active Render service containers.",
      },
      {
        name: "list_log_label_values",
        category: "Render",
        description:
          "Inspects searchable log stream labels and component tags for Render services.",
      },
      {
        name: "get_metrics",
        category: "Render",
        description:
          "Queries real-time CPU utilization, memory consumption, and network I/O metrics.",
      },
      {
        name: "list_env_vars",
        category: "Render",
        description:
          "Lists secret and plain-text environment variables configured on a Render service.",
      },
      {
        name: "update_env_vars",
        category: "Render",
        description:
          "Sets or updates environment variables and triggers zero-downtime service redeployments.",
      },
      {
        name: "delete_env_var",
        category: "Render",
        description:
          "Removes an environment variable from a target Render service configuration.",
      },
      {
        name: "query_render_postgres",
        category: "Render",
        description:
          "Executes parameterized SQL queries against managed PostgreSQL databases on Render.",
      },

      // 4. GitHub Tools (51 tools)
      {
        name: "set_active_context",
        category: "GitHub",
        description:
          "Sets the default owner and repository context for subsequent GitHub tool invocations.",
      },
      {
        name: "get_me",
        category: "GitHub",
        description:
          "Retrieves authenticated GitHub user profile, scopes, permissions, and quota details.",
      },
      {
        name: "get_file_contents",
        category: "GitHub",
        description:
          "Reads source code files, directory listings, or binary assets from any GitHub repository.",
      },
      {
        name: "str_replace_editor",
        category: "GitHub",
        description:
          "Performs surgical, lossless text replacements preserving code structure and indentation.",
      },
      {
        name: "grep",
        category: "GitHub",
        description:
          "Fast regex pattern and token search across entire GitHub repository source trees.",
      },
      {
        name: "view_file_outline",
        category: "GitHub",
        description:
          "Extracts AST symbol definitions, classes, functions, and interfaces from source files.",
      },
      {
        name: "git_tree",
        category: "GitHub",
        description:
          "Recursively explores directory hierarchies, files, submodules, and repository trees.",
      },
      {
        name: "patch_contents",
        category: "GitHub",
        description:
          "Applies unified diff patches to source files with atomic validation.",
      },
      {
        name: "get_commit",
        category: "GitHub",
        description:
          "Fetches commit details, author metadata, parent commit SHAs, and file changesets.",
      },
      {
        name: "get_label",
        category: "GitHub",
        description:
          "Retrieves issue and pull request label metadata, descriptions, and color codes.",
      },
      {
        name: "get_release",
        category: "GitHub",
        description:
          "Fetches release tag metadata, release notes, changelogs, and binary asset downloads.",
      },
      {
        name: "get_tag",
        category: "GitHub",
        description:
          "Reads git tag annotations, target commit hashes, and tagger signatures.",
      },
      {
        name: "get_team_members",
        category: "GitHub",
        description:
          "Lists members of organization teams, permissions, and roles.",
      },
      {
        name: "get_teams",
        category: "GitHub",
        description:
          "Lists organizational teams, slugs, and access control groups.",
      },
      {
        name: "list_branches",
        category: "GitHub",
        description:
          "Lists active and protected branches in a repository with latest commit SHAs.",
      },
      {
        name: "list_commits",
        category: "GitHub",
        description:
          "Queries chronological commit histories, author timestamps, and commit messages.",
      },
      {
        name: "list_issue_fields",
        category: "GitHub",
        description:
          "Inspects custom fields, project columns, and issue metadata schemas.",
      },
      {
        name: "list_issue_types",
        category: "GitHub",
        description:
          "Lists issue type classifications, bug templates, and feature request schemas.",
      },
      {
        name: "list_issues",
        category: "GitHub",
        description:
          "Filters and queries repository issue trackers by state, labels, author, and assignee.",
      },
      {
        name: "list_pull_requests",
        category: "GitHub",
        description:
          "Lists pull requests by review status, target branch, author, and draft state.",
      },
      {
        name: "list_releases",
        category: "GitHub",
        description:
          "Lists all published and draft releases, prereleases, and release tags.",
      },
      {
        name: "list_repository_collaborators",
        category: "GitHub",
        description:
          "Lists repository contributors, collaborators, and their access permission tiers.",
      },
      {
        name: "list_tags",
        category: "GitHub",
        description:
          "Queries all git release and version tags in a repository.",
      },
      {
        name: "issue_read",
        category: "GitHub",
        description:
          "Reads full issue descriptions, conversation threads, reactions, and timeline events.",
      },
      {
        name: "pull_request_read",
        category: "GitHub",
        description:
          "Inspects pull request diffs, review comments, check runs, and merge readiness.",
      },
      {
        name: "search_code",
        category: "GitHub",
        description:
          "Searches code snippets and symbols across all public and organization repositories.",
      },
      {
        name: "search_commits",
        category: "GitHub",
        description:
          "Searches commit messages and changes across GitHub repository histories.",
      },
      {
        name: "search_issues",
        category: "GitHub",
        description:
          "Performs advanced searches across issues, discussions, and pull requests.",
      },
      {
        name: "search_pull_requests",
        category: "GitHub",
        description:
          "Searches pull requests by review state, CI status, and target branches.",
      },
      {
        name: "search_repositories",
        category: "GitHub",
        description:
          "Discovers repositories by name, topic, language, stars, and organization.",
      },
      {
        name: "search_users",
        category: "GitHub",
        description:
          "Searches GitHub users and organizations by username, bio, and location.",
      },
      {
        name: "run_secret_scanning",
        category: "GitHub",
        description:
          "Scans code commits and PRs for leaked API tokens, private keys, and secrets.",
      },
      {
        name: "add_comment_to_pending_review",
        category: "GitHub",
        description:
          "Adds an inline line-by-line review comment to a pull request review draft.",
      },
      {
        name: "add_issue_comment",
        category: "GitHub",
        description:
          "Posts a new markdown comment to an issue or pull request discussion thread.",
      },
      {
        name: "add_reply_to_pull_request_comment",
        category: "GitHub",
        description:
          "Replies to an existing pull request review comment thread.",
      },
      {
        name: "create_branch",
        category: "GitHub",
        description:
          "Creates a new git branch pointing to an existing commit SHA or branch ref.",
      },
      {
        name: "delete_branch",
        category: "GitHub",
        description:
          "Deletes a remote git branch after pull request merges or cleanup.",
      },
      {
        name: "create_or_update_file",
        category: "GitHub",
        description:
          "Creates or updates a single file in a GitHub repository via git commit.",
      },
      {
        name: "create_pull_request",
        category: "GitHub",
        description:
          "Opens a new pull request with title, description body, base branch, and head branch.",
      },
      {
        name: "create_repository",
        category: "GitHub",
        description:
          "Creates a new public or private repository with optional templates.",
      },
      {
        name: "delete_file",
        category: "GitHub",
        description:
          "Deletes a file from a repository with a clean commit message.",
      },
      {
        name: "fork_repository",
        category: "GitHub",
        description:
          "Forks an upstream repository into the authenticated user or organization account.",
      },
      {
        name: "issue_write",
        category: "GitHub",
        description:
          "Creates or updates an issue title, markdown body, assignees, and labels.",
      },
      {
        name: "merge_pull_request",
        category: "GitHub",
        description:
          "Merges a pull request using merge commit, squash and merge, or rebase.",
      },
      {
        name: "pull_request_review_write",
        category: "GitHub",
        description:
          "Submits an approving review, comment, or request-for-changes on a pull request.",
      },
      {
        name: "push_files",
        category: "GitHub",
        description:
          "Commits and pushes multiple file modifications atomically in a single git commit.",
      },
      {
        name: "request_copilot_review",
        category: "GitHub",
        description:
          "Requests an automated Copilot review on an open pull request.",
      },
      {
        name: "assign_copilot_to_issue",
        category: "GitHub",
        description:
          "Assigns Copilot coding assistant to triage and resolve an issue.",
      },
      {
        name: "sub_issue_write",
        category: "GitHub",
        description:
          "Creates or links a child sub-issue under a parent epic or tracking issue.",
      },
      {
        name: "update_pull_request",
        category: "GitHub",
        description:
          "Updates pull request title, description, state (open/closed), or target base.",
      },
      {
        name: "update_pull_request_branch",
        category: "GitHub",
        description:
          "Updates a pull request branch with latest commits from the base branch.",
      },
      ...CODE_GRAPH_TOOLS_CATALOG.map((t) => ({
        name: t.name,
        category: t.category,
        description: t.description,
        inputSchema: getToolInputSchema(t.name),
      })),
    ];

    const activeToolsSource = isFiltered
      ? matchedKey
        ? matchedKey.toolCalls
        : {}
      : this.globalTools;

    const cleanToolDistribution: Record<string, number> = {};
    for (const [k, v] of Object.entries(activeToolsSource)) {
      if (
        ![
          "mcp_request",
          "server/discover",
          "initialize",
          "notifications/initialized",
          "tools/list",
          "prompts/list",
          "resources/list",
        ].includes(k) &&
        v > 0
      ) {
        cleanToolDistribution[k] = v;
      }
    }

    const activeToolMetrics = isFiltered
      ? matchedKey?.toolMetrics || {}
      : this.toolMetrics;
    const toolsCatalog: ToolDetailMeta[] = knownTools.map((t) => {
      const calls = cleanToolDistribution[t.name] || 0;
      const toolMetric = activeToolMetrics[t.name];
      return {
        name: t.name,
        category: t.category,
        description: t.description,
        inputSchema: getToolInputSchema(t.name),
        totalCalls: calls,
        successRate: toolMetric?.totalCalls
          ? Math.round((toolMetric.successCount / toolMetric.totalCalls) * 100)
          : 0,
        avgDurationMs: toolMetric?.totalCalls
          ? Math.round(toolMetric.totalDurationMs / toolMetric.totalCalls)
          : 0,
        daily: toolMetric?.daily || {},
        weekly: toolMetric?.weekly || {},
        monthly: toolMetric?.monthly || {},
      };
    });
    const catalogNames = new Set(toolsCatalog.map((tool) => tool.name));
    for (const [name, metrics] of Object.entries(activeToolMetrics)) {
      if (catalogNames.has(name)) continue;
      toolsCatalog.push({
        name,
        category: "Inspection",
        description: "Tool usage recorded from MCP calls.",
        inputSchema: getToolInputSchema(name),
        totalCalls: metrics.totalCalls,
        successRate: metrics.totalCalls
          ? Math.round((metrics.successCount / metrics.totalCalls) * 100)
          : 0,
        avgDurationMs: metrics.totalCalls
          ? Math.round(metrics.totalDurationMs / metrics.totalCalls)
          : 0,
        daily: metrics.daily,
        weekly: metrics.weekly,
        monthly: metrics.monthly,
      });
    }

    return {
      totalRequests,
      totalSuccess,
      totalErrors,
      overallSuccessRate,
      avgDurationMs,
      p95DurationMs,
      throughputRpm,
      activeHttpSessions: this.activeHttpSessions,
      totalBytesIn,
      totalBytesOut,
      uniqueKeysCount: keys.length,
      keys,
      toolDistribution: cleanToolDistribution,
      protocolDistribution: this.globalProtocol,
      dailyTimeline,
      weeklyTimeline,
      monthlyTimeline,
      availableYears,
      sharedSandbox: this.getSharedSandboxStats(sandboxRoot, isOwner),
      systemHealth,
      statusCodes: this.statusCodes,
      clientEcosystems: this.clientEcosystems,
      recentErrors: this.recentErrors,
      peakTraffic: {
        peakHourUtc,
        peakDay,
      },
      toolsCatalog,
      selectedKeyId: isFiltered ? matchedKey?.keyId || targetKeyId : "all",
      lastUpdated: Date.now(),
    };
  }

  private scheduleSave(): void {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      void this.persist().catch((error) => {
        console.error(
          "[stats] scheduled persistence failed:",
          error?.message || error,
        );
        this.saveTimeout = setTimeout(() => {
          this.saveTimeout = null;
          this.scheduleSave();
        }, 5000);
        this.saveTimeout.unref?.();
      });
    }, 1500);
    this.saveTimeout.unref?.();
  }

  private snapshot() {
    return {
      _id: "global_stats" as any,
      keys: Array.from(this.keys.entries()),
      globalTools: this.globalTools,
      toolMetrics: this.toolMetrics,
      globalProtocol: this.globalProtocol,
      globalDaily: this.globalDaily,
      globalWeekly: this.globalWeekly,
      globalMonthly: this.globalMonthly,
      statusCodes: this.statusCodes,
      clientEcosystems: this.clientEcosystems,
      recentErrors: this.recentErrors,
      recentTimestamps: this.recentTimestamps,
      recentDurations: this.recentDurations,
      hourlyCounts: this.hourlyCounts,
      dayOfWeekCounts: this.dayOfWeekCounts,
      updatedAt: new Date(),
    };
  }

  public async loadHistoricalChunk(
    monthKey: string,
  ): Promise<
    Record<string, { requests: number; tools: number; errors?: number }>
  > {
    const inMemory: Record<
      string,
      { requests: number; tools: number; errors?: number }
    > = {};
    for (const [k, v] of Object.entries(this.globalDaily)) {
      if (k.startsWith(monthKey)) {
        inMemory[k] = {
          requests: v.requests || 0,
          tools: v.tools || 0,
          errors: v.errors || 0,
        };
      }
    }
    if (Object.keys(inMemory).length >= 28) return inMemory;

    if (this.mongoDb) {
      try {
        const doc = await this.mongoDb
          .collection("krix_stats_history")
          .findOne({ _id: `history_${monthKey}` as any });
        if (doc && doc.daily) {
          for (const [d, m] of Object.entries(
            doc.daily as Record<string, any>,
          )) {
            if (!this.globalDaily[d]) {
              this.globalDaily[d] = {
                requests: m.requests || 0,
                errors: m.errors || 0,
                tools: m.tools || 0,
              };
            }
          }
          return { ...doc.daily, ...inMemory };
        }
      } catch (err: any) {
        console.warn(
          "[stats] failed to lazy-load historical chunk for " + monthKey,
          err?.message || err,
        );
      }
    }
    return inMemory;
  }

  private persist(): Promise<void> {
    const writeSnapshot = async (): Promise<void> => {
      // Chunking & Splitting Safeguard against 16MB MongoDB document limit:
      // Archive historical days older than 60 days into companion collection 'krix_stats_history'.
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 60);
      const cutoffKey = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}-${String(cutoffDate.getDate()).padStart(2, "0")}`;

      const historicalDailyByMonth: Record<
        string,
        Record<string, { requests: number; tools: number; errors?: number }>
      > = {};
      const activeDaily: Record<
        string,
        { requests: number; tools: number; errors?: number }
      > = {};

      for (const [dayKey, metrics] of Object.entries(this.globalDaily)) {
        const entry = {
          requests: metrics.requests || 0,
          tools: metrics.tools || 0,
          errors: metrics.errors || 0,
        };
        if (dayKey < cutoffKey) {
          const monthKey = dayKey.slice(0, 7);
          if (!historicalDailyByMonth[monthKey])
            historicalDailyByMonth[monthKey] = {};
          historicalDailyByMonth[monthKey][dayKey] = entry;
        } else {
          activeDaily[dayKey] = entry;
        }
      }

      if (
        this.mongoConnected &&
        this.mongoDb &&
        Object.keys(historicalDailyByMonth).length > 0
      ) {
        try {
          const historyColl = this.mongoDb.collection("krix_stats_history");
          for (const [monthKey, chunk] of Object.entries(
            historicalDailyByMonth,
          )) {
            await historyColl.updateOne(
              { _id: `history_${monthKey}` as any },
              {
                $set: {
                  _id: `history_${monthKey}` as any,
                  month: monthKey,
                  daily: chunk,
                  updatedAt: new Date(),
                },
              },
              { upsert: true },
            );
          }
        } catch (err: any) {
          console.warn(
            "[stats] failed to archive historical chunk to krix_stats_history:",
            err?.message || err,
          );
        }
      }

      const data = this.snapshot();
      if (Object.keys(historicalDailyByMonth).length > 0) {
        data.globalDaily = activeDaily;
      }

      // Keep the local fallback, but MongoDB remains the durable source of truth
      // whenever configured and connected.
      try {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
      } catch (error: any) {
        console.error(
          "[stats] local fallback write failed:",
          error?.message || error,
        );
      }

      const mongoConfigured = Boolean(
        process.env.MONGODB_URI ||
        process.env.MONGO_URL ||
        process.env.DATABASE_URL ||
        getMongoDb(),
      );
      // Retry the connection/restore here so a MongoDB that was down at boot is picked up
      // later instead of failing every save until shutdown.
      if (mongoConfigured && !(this.mongoConnected && this.mongoLoaded)) {
        await this.ensureMongo().catch(() => {});
      }

      if (this.mongoConnected && this.mongoDb && this.mongoLoaded) {
        await this.mongoDb
          .collection("krix_stats")
          .updateOne(
            { _id: "global_stats" as any },
            { $set: data },
            { upsert: true },
          );
      } else if (mongoConfigured) {
        throw new Error(
          "MongoDB is configured but unavailable; statistics were only written to local fallback.",
        );
      }
    };

    // Serialize snapshots so a slower earlier write cannot overwrite a newer one.
    const next = this.persistQueue.then(writeSnapshot, writeSnapshot);
    this.persistQueue = next.catch(() => {});
    return next;
  }

  public async flush(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    await this.ensureMongo().catch((error) => {
      console.error(
        "[stats] MongoDB unavailable during flush:",
        error?.message || error,
      );
    });
    await this.persist();
  }

  private mergeLoadedData(doc: any): void {
    if (!doc) return;

    if (Array.isArray(doc.keys)) {
      for (const [kId, loadedKey] of doc.keys) {
        if (!this.keys.has(kId)) {
          this.keys.set(kId, loadedKey);
        } else {
          const curKey = this.keys.get(kId)!;
          curKey.totalRequests =
            (curKey.totalRequests || 0) + (loadedKey.totalRequests || 0);
          curKey.successCount =
            (curKey.successCount || 0) + (loadedKey.successCount || 0);
          curKey.errorCount =
            (curKey.errorCount || 0) + (loadedKey.errorCount || 0);
          curKey.totalDurationMs =
            (curKey.totalDurationMs || 0) + (loadedKey.totalDurationMs || 0);
          curKey.avgDurationMs =
            curKey.totalRequests > 0
              ? Math.round(curKey.totalDurationMs / curKey.totalRequests)
              : 0;
          curKey.bytesIn = (curKey.bytesIn || 0) + (loadedKey.bytesIn || 0);
          curKey.bytesOut = (curKey.bytesOut || 0) + (loadedKey.bytesOut || 0);
          curKey.lastActiveAt = Math.max(
            curKey.lastActiveAt || 0,
            loadedKey.lastActiveAt || 0,
          );
          if (!curKey.label && loadedKey.label) curKey.label = loadedKey.label;
          if (!curKey.type && loadedKey.type) curKey.type = loadedKey.type;

          for (const [tool, count] of Object.entries(
            loadedKey.toolCalls || {},
          )) {
            curKey.toolCalls[tool] =
              (curKey.toolCalls[tool] || 0) + Number(count);
          }
          for (const [d, count] of Object.entries(loadedKey.daily || {})) {
            curKey.daily[d] = (curKey.daily[d] || 0) + Number(count);
          }
          if (loadedKey.dailyErrors) {
            if (!curKey.dailyErrors) curKey.dailyErrors = {};
            for (const [d, count] of Object.entries(loadedKey.dailyErrors)) {
              curKey.dailyErrors[d] =
                (curKey.dailyErrors[d] || 0) + Number(count);
            }
          }
          for (const [w, count] of Object.entries(loadedKey.weekly || {})) {
            curKey.weekly[w] = (curKey.weekly[w] || 0) + Number(count);
          }
          for (const [m, count] of Object.entries(loadedKey.monthly || {})) {
            curKey.monthly[m] = (curKey.monthly[m] || 0) + Number(count);
          }
          if (loadedKey.toolMetrics) {
            if (!curKey.toolMetrics) curKey.toolMetrics = {};
            for (const [t, tm] of Object.entries(
              loadedKey.toolMetrics as Record<string, any>,
            )) {
              if (!curKey.toolMetrics[t]) {
                curKey.toolMetrics[t] = { ...tm };
              } else {
                const ctm = curKey.toolMetrics[t];
                ctm.totalCalls = (ctm.totalCalls || 0) + (tm.totalCalls || 0);
                ctm.successCount =
                  (ctm.successCount || 0) + (tm.successCount || 0);
                ctm.errorCount =
                  (ctm.errorCount || 0) + (tm.errorCount || 0);
                ctm.totalDurationMs =
                  (ctm.totalDurationMs || 0) + (tm.totalDurationMs || 0);
                if (tm.daily) {
                  if (!ctm.daily) ctm.daily = {};
                  for (const [d, count] of Object.entries(tm.daily)) {
                    ctm.daily[d] = (ctm.daily[d] || 0) + Number(count);
                  }
                }
                if (tm.weekly) {
                  if (!ctm.weekly) ctm.weekly = {};
                  for (const [w, count] of Object.entries(tm.weekly)) {
                    ctm.weekly[w] = (ctm.weekly[w] || 0) + Number(count);
                  }
                }
                if (tm.monthly) {
                  if (!ctm.monthly) ctm.monthly = {};
                  for (const [m, count] of Object.entries(tm.monthly)) {
                    ctm.monthly[m] = (ctm.monthly[m] || 0) + Number(count);
                  }
                }
              }
            }
          }
        }
      }
    }

    if (doc.globalTools) {
      for (const [t, count] of Object.entries(doc.globalTools)) {
        this.globalTools[t] = (this.globalTools[t] || 0) + Number(count);
      }
    }

    if (doc.toolMetrics) {
      for (const [t, tm] of Object.entries(
        doc.toolMetrics as Record<string, any>,
      )) {
        if (!this.toolMetrics[t]) {
          this.toolMetrics[t] = { ...tm };
        } else {
          const ctm = this.toolMetrics[t];
          ctm.totalCalls = (ctm.totalCalls || 0) + (tm.totalCalls || 0);
          ctm.successCount = (ctm.successCount || 0) + (tm.successCount || 0);
          ctm.errorCount = (ctm.errorCount || 0) + (tm.errorCount || 0);
          ctm.totalDurationMs =
            (ctm.totalDurationMs || 0) + (tm.totalDurationMs || 0);
          if (tm.daily) {
            if (!ctm.daily) ctm.daily = {};
            for (const [d, count] of Object.entries(tm.daily)) {
              ctm.daily[d] = (ctm.daily[d] || 0) + Number(count);
            }
          }
          if (tm.weekly) {
            if (!ctm.weekly) ctm.weekly = {};
            for (const [w, count] of Object.entries(tm.weekly)) {
              ctm.weekly[w] = (ctm.weekly[w] || 0) + Number(count);
            }
          }
          if (tm.monthly) {
            if (!ctm.monthly) ctm.monthly = {};
            for (const [m, count] of Object.entries(tm.monthly)) {
              ctm.monthly[m] = (ctm.monthly[m] || 0) + Number(count);
            }
          }
        }
      }
    }

    if (doc.globalProtocol) {
      for (const [p, count] of Object.entries(doc.globalProtocol)) {
        this.globalProtocol[p] = (this.globalProtocol[p] || 0) + Number(count);
      }
    }

    if (doc.globalDaily) {
      for (const [d, m] of Object.entries(
        doc.globalDaily as Record<string, any>,
      )) {
        if (!this.globalDaily[d]) {
          this.globalDaily[d] = {
            requests: m.requests || 0,
            errors: m.errors || 0,
            tools: m.tools || 0,
          };
        } else {
          this.globalDaily[d].requests =
            (this.globalDaily[d].requests || 0) + (m.requests || 0);
          this.globalDaily[d].errors =
            (this.globalDaily[d].errors || 0) + (m.errors || 0);
          this.globalDaily[d].tools =
            (this.globalDaily[d].tools || 0) + (m.tools || 0);
        }
      }
    }

    if (doc.globalWeekly) {
      for (const [w, m] of Object.entries(
        doc.globalWeekly as Record<string, any>,
      )) {
        if (!this.globalWeekly[w]) {
          this.globalWeekly[w] = {
            requests: m.requests || 0,
            errors: m.errors || 0,
            tools: m.tools || 0,
          };
        } else {
          this.globalWeekly[w].requests =
            (this.globalWeekly[w].requests || 0) + (m.requests || 0);
          this.globalWeekly[w].errors =
            (this.globalWeekly[w].errors || 0) + (m.errors || 0);
          this.globalWeekly[w].tools =
            (this.globalWeekly[w].tools || 0) + (m.tools || 0);
        }
      }
    }

    if (doc.globalMonthly) {
      for (const [mo, m] of Object.entries(
        doc.globalMonthly as Record<string, any>,
      )) {
        if (!this.globalMonthly[mo]) {
          this.globalMonthly[mo] = {
            requests: m.requests || 0,
            errors: m.errors || 0,
            tools: m.tools || 0,
          };
        } else {
          this.globalMonthly[mo].requests =
            (this.globalMonthly[mo].requests || 0) + (m.requests || 0);
          this.globalMonthly[mo].errors =
            (this.globalMonthly[mo].errors || 0) + (m.errors || 0);
          this.globalMonthly[mo].tools =
            (this.globalMonthly[mo].tools || 0) + (m.tools || 0);
        }
      }
    }

    if (doc.statusCodes) {
      for (const [c, count] of Object.entries(doc.statusCodes)) {
        this.statusCodes[c] = (this.statusCodes[c] || 0) + Number(count);
      }
    }

    if (doc.clientEcosystems) {
      for (const [e, count] of Object.entries(doc.clientEcosystems)) {
        this.clientEcosystems[e] =
          (this.clientEcosystems[e] || 0) + Number(count);
      }
    }

    if (Array.isArray(doc.recentErrors)) {
      const combined = [...doc.recentErrors, ...this.recentErrors];
      combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      this.recentErrors = combined.slice(0, 50);
    }

    if (Array.isArray(doc.recentTimestamps)) {
      const valid = doc.recentTimestamps.filter(
        (t: number) => Number.isFinite(t) && t >= Date.now() - 5 * 60 * 1000,
      );
      this.recentTimestamps = Array.from(
        new Set([...valid, ...this.recentTimestamps]),
      ).sort();
    }

    if (Array.isArray(doc.recentDurations)) {
      this.recentDurations = [...doc.recentDurations, ...this.recentDurations]
        .filter((n: number) => Number.isFinite(n))
        .slice(-200);
    }

    if (Array.isArray(doc.hourlyCounts)) {
      for (let i = 0; i < 24; i++) {
        this.hourlyCounts[i] =
          (this.hourlyCounts[i] || 0) + (doc.hourlyCounts[i] || 0);
      }
    }

    if (Array.isArray(doc.dayOfWeekCounts)) {
      for (let i = 0; i < 7; i++) {
        this.dayOfWeekCounts[i] =
          (this.dayOfWeekCounts[i] || 0) + (doc.dayOfWeekCounts[i] || 0);
      }
    }

    this.purgeProtocolAndLegacyKeys();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const data = JSON.parse(raw);
        this.mergeLoadedData(data);
      }
    } catch {}
  }

  private purgeProtocolAndLegacyKeys(): void {
    const protocolNames = new Set([
      "mcp_request",
      "server/discover",
      "initialize",
      "notifications/initialized",
      "tools/list",
      "prompts/list",
      "resources/list",
    ]);
    for (const p of protocolNames) {
      delete this.globalTools[p];
    }
    for (const k of this.keys.values()) {
      for (const p of protocolNames) {
        delete k.toolCalls[p];
      }
      if (k.keyId === "master" || k.keyId === "master-env-key") {
        k.keyId = "primary-key";
        k.label = "Primary Key";
        k.type = "master";
      }
    }
  }

  private async loadFromMongo(): Promise<void> {
    if (!this.mongoDb) return;
    try {
      const coll = this.mongoDb.collection("krix_stats");
      const doc = await coll.findOne({ _id: "global_stats" as any });
      if (!doc) {
        await coll.updateOne(
          { _id: "global_stats" as any },
          { $set: this.snapshot() },
          { upsert: true },
        );
        this.mongoLoaded = true;
        return;
      }
      if (doc) {
        this.mergeLoadedData(doc);
        this.mongoLoaded = true;
      }
    } catch (error: any) {
      console.error("[stats] MongoDB restore failed:", error?.message || error);
      throw error;
    }
  }
}

export const statsTracker = new StatsTracker();
