import fs from "node:fs";
import path from "node:path";
import { MongoClient, type Db } from "mongodb";

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
  daily: Record<string, number>;
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

export interface ToolDetailMeta {
  name: string;
  category: "Execution" | "Filesystem" | "Git & Cloud" | "Inspection";
  description: string;
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
  dailyTimeline: Array<{ date: string; requests: number; tools: number }>;
  weeklyTimeline: Array<{ week: string; requests: number; tools: number }>;
  monthlyTimeline: Array<{ month: string; requests: number; tools: number }>;
  availableYears: number[];
  sharedSandbox: SharedSandboxStats;
  systemHealth: SystemHealthStats;
  statusCodes: Record<string, number>;
  clientEcosystems: Record<string, number>;
  recentErrors: RecentErrorEntry[];
  peakTraffic: {
    peakHourUtc: number;
    peakDay: string;
  };
  toolsCatalog: ToolDetailMeta[];
  lastUpdated: number;
}

export class StatsTracker {
  private keys = new Map<string, KeyMetrics>();
  private globalTools: Record<string, number> = {};
  private globalProtocol: Record<string, number> = {};
  private globalDaily: Record<string, { requests: number; tools: number }> = {};
  private globalWeekly: Record<string, { requests: number; tools: number }> =
    {};
  private globalMonthly: Record<string, { requests: number; tools: number }> =
    {};
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
    Gemini: 0,
    ChatGPT: 0,
    Antigravity: 0,
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
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private mongoConnected = false;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    }
    this.loadFromFile();
    this.initMongo().catch(() => {});
  }

  public setActiveSessions(count: number): void {
    this.activeHttpSessions = Math.max(0, count);
  }

  private async initMongo(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;
    try {
      this.mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        appName: "krix-stats",
      });
      await this.mongoClient.connect();
      const dbName = process.env.MONGODB_DB_NAME || "krix";
      this.mongoDb = this.mongoClient.db(dbName);
      this.mongoConnected = true;
      await this.loadFromMongo();
    } catch {
      this.mongoConnected = false;
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

  private detectEcosystem(ua?: string): string {
    if (!ua) return "Other";
    const l = ua.toLowerCase();
    if (l.includes("claude") || l.includes("anthropic"))
      return "Claude Desktop";
    if (l.includes("cursor")) return "Cursor";
    if (l.includes("gemini") || l.includes("google")) return "Gemini";
    if (l.includes("chatgpt") || l.includes("openai")) return "ChatGPT";
    if (l.includes("antigravity")) return "Antigravity";
    return "Other";
  }

  public recordRequest(params: {
    keyId: string;
    label?: string;
    type?: "api_key" | "oauth" | "master";
    toolName?: string;
    isActualTool?: boolean;
    durationMs: number;
    isError: boolean;
    statusCode?: number;
    errorMessage?: string;
    bytesIn: number;
    bytesOut: number;
    ip?: string;
    userAgent?: string;
  }): void {
    const {
      keyId,
      durationMs,
      isError,
      statusCode = isError ? 500 : 200,
      errorMessage,
      bytesIn,
      bytesOut,
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
    const eco = this.detectEcosystem(userAgent);
    this.clientEcosystems[eco] = (this.clientEcosystems[eco] || 0) + 1;

    let entry = this.keys.get(keyId);
    if (!entry) {
      entry = {
        keyId,
        label:
          params.label ||
          (keyId.startsWith("oauth:")
            ? `OAuth Client (${keyId.slice(6, 16)})`
            : keyId === "master" || keyId === "master-env-key"
              ? "Master Key"
              : "API Key"),
        type:
          params.type ||
          (keyId.startsWith("oauth:")
            ? "oauth"
            : keyId === "master"
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
        daily: {},
        weekly: {},
        monthly: {},
      };
      this.keys.set(keyId, entry);
    }

    entry.totalRequests++;
    if (isError) {
      entry.errorCount++;
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
      this.globalDaily[date] = { requests: 0, tools: 0 };
    this.globalDaily[date].requests++;

    if (!this.globalWeekly[week])
      this.globalWeekly[week] = { requests: 0, tools: 0 };
    this.globalWeekly[week].requests++;

    if (!this.globalMonthly[month])
      this.globalMonthly[month] = { requests: 0, tools: 0 };
    this.globalMonthly[month].requests++;

    if (toolName) {
      if (isActualTool) {
        entry.toolCalls[toolName] = (entry.toolCalls[toolName] || 0) + 1;
        this.globalTools[toolName] = (this.globalTools[toolName] || 0) + 1;
        this.globalDaily[date].tools++;
        this.globalWeekly[week].tools++;
        this.globalMonthly[month].tools++;
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

  public getSharedSandboxStats(sandboxRoot?: string): SharedSandboxStats {
    let uploadFileCount = 0;
    let uploadBytes = 0;
    const uploadFiles: Array<{ name: string; size: number; mtime: number }> =
      [];
    let activeWorkDirs = 0;
    let totalDiskBytes = 0;
    let workspaceBytes = 0;
    let tempBytes = 0;

    // Standard shared quota is 300 MB
    const quotaLimitMb = Number(process.env.SANDBOX_MAX_TOTAL_MB) || 300;

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

  public getSummary(sandboxRoot?: string): StatsSummary {
    const keys = Array.from(this.keys.values()).sort(
      (a, b) => b.totalRequests - a.totalRequests,
    );
    let totalRequests = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalDuration = 0;
    let totalBytesIn = 0;
    let totalBytesOut = 0;

    for (const k of keys) {
      totalRequests += k.totalRequests;
      totalSuccess += k.successCount;
      totalErrors += k.errorCount;
      totalDuration += k.totalDurationMs;
      totalBytesIn += k.bytesIn;
      totalBytesOut += k.bytesOut;
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

    // Calculate peak traffic
    let peakHourUtc = 0;
    let maxHourly = -1;
    for (let h = 0; h < 24; h++) {
      if (this.hourlyCounts[h] > maxHourly) {
        maxHourly = this.hourlyCounts[h];
        peakHourUtc = h;
      }
    }

    let peakDay = "Monday";
    let maxDayCount = -1;
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
    }> = [];
    const nowTime = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(nowTime.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = this.globalDaily[key] || { requests: 0, tools: 0 };
      dailyTimeline.push({
        date: key,
        requests: entry.requests,
        tools: entry.tools,
      });
    }

    const weeklyTimeline: Array<{
      week: string;
      requests: number;
      tools: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowTime.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const { week } = this.getDateKeys(d);
      const entry = this.globalWeekly[week] || { requests: 0, tools: 0 };
      if (!weeklyTimeline.some((w) => w.week === week)) {
        weeklyTimeline.push({
          week,
          requests: entry.requests,
          tools: entry.tools,
        });
      }
    }
    while (weeklyTimeline.length < 12) {
      weeklyTimeline.unshift({
        week: `W-${12 - weeklyTimeline.length}`,
        requests: 0,
        tools: 0,
      });
    }

    const monthlyTimeline: Array<{
      month: string;
      requests: number;
      tools: number;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowTime.getFullYear(), nowTime.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = this.globalMonthly[key] || { requests: 0, tools: 0 };
      monthlyTimeline.push({
        month: key,
        requests: entry.requests,
        tools: entry.tools,
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

    // Tools Catalog with complete metrics for /tools page
    const knownTools: Array<{
      name: string;
      category: "Execution" | "Filesystem" | "Git & Cloud" | "Inspection";
      description: string;
    }> = [
      {
        name: "sandbox_exec",
        category: "Execution",
        description:
          "Executes commands, tests, scripts, and compilers inside the unprivileged sandbox container.",
      },
      {
        name: "sandbox_file",
        category: "Filesystem",
        description:
          "Reads, writes, updates, or checks files in the workspace with atomic disk safety.",
      },
      {
        name: "git_clone",
        category: "Git & Cloud",
        description:
          "Clones public or private GitHub repositories directly into the sandbox working tree.",
      },
      {
        name: "grep",
        category: "Inspection",
        description:
          "Searches regex patterns and code tokens across repository source trees at high speed.",
      },
      {
        name: "str_replace_editor",
        category: "Filesystem",
        description:
          "Performs precise, lossless search-and-replace edits preserving code indentation and structure.",
      },
      {
        name: "sandbox_store",
        category: "Git & Cloud",
        description:
          "Persistent cloud storage, direct sharing, artifact links, and permanent file uploads.",
      },
      {
        name: "render_deploy",
        category: "Git & Cloud",
        description:
          "Inspects live Render services, triggers continuous builds, and monitors container health.",
      },
      {
        name: "github_repo_info",
        category: "Inspection",
        description:
          "Fetches repository commit logs, pull request statuses, issue threads, and branch heads.",
      },
    ];

    const toolsCatalog: ToolDetailMeta[] = knownTools.map((t) => {
      const calls = this.globalTools[t.name] || 0;
      return {
        name: t.name,
        category: t.category,
        description: t.description,
        totalCalls: calls,
        successRate: calls > 0 ? 100 : 0,
        avgDurationMs: calls > 0 ? avgDurationMs : 0,
        daily: {},
        weekly: {},
        monthly: {},
      };
    });

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
      toolDistribution: this.globalTools,
      protocolDistribution: this.globalProtocol,
      dailyTimeline,
      weeklyTimeline,
      monthlyTimeline,
      availableYears,
      sharedSandbox: this.getSharedSandboxStats(sandboxRoot),
      systemHealth,
      statusCodes: this.statusCodes,
      clientEcosystems: this.clientEcosystems,
      recentErrors: this.recentErrors,
      peakTraffic: {
        peakHourUtc,
        peakDay,
      },
      toolsCatalog,
      lastUpdated: Date.now(),
    };
  }

  private scheduleSave(): void {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.save();
    }, 2000);
  }

  public flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.save();
  }

  private save(): void {
    // 1. Save to local disk fallback
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const data = {
        keys: Array.from(this.keys.entries()),
        globalTools: this.globalTools,
        globalProtocol: this.globalProtocol,
        globalDaily: this.globalDaily,
        globalWeekly: this.globalWeekly,
        globalMonthly: this.globalMonthly,
        statusCodes: this.statusCodes,
        clientEcosystems: this.clientEcosystems,
        recentErrors: this.recentErrors,
        hourlyCounts: this.hourlyCounts,
        dayOfWeekCounts: this.dayOfWeekCounts,
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {}

    // 2. Save to MongoDB if available
    if (this.mongoConnected && this.mongoDb) {
      const coll = this.mongoDb.collection("krix_stats");
      const mongoDoc = {
        _id: "global_stats" as any,
        keys: Array.from(this.keys.entries()),
        globalTools: this.globalTools,
        globalProtocol: this.globalProtocol,
        globalDaily: this.globalDaily,
        globalWeekly: this.globalWeekly,
        globalMonthly: this.globalMonthly,
        statusCodes: this.statusCodes,
        clientEcosystems: this.clientEcosystems,
        recentErrors: this.recentErrors,
        hourlyCounts: this.hourlyCounts,
        dayOfWeekCounts: this.dayOfWeekCounts,
        updatedAt: new Date(),
      };
      coll
        .updateOne(
          { _id: "global_stats" as any },
          { $set: mongoDoc },
          { upsert: true },
        )
        .catch(() => {});
    }
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const data = JSON.parse(raw);
        if (Array.isArray(data.keys)) {
          this.keys = new Map(data.keys);
        }
        if (data.globalTools) this.globalTools = data.globalTools;
        if (data.globalProtocol) this.globalProtocol = data.globalProtocol;
        if (data.globalDaily) this.globalDaily = data.globalDaily;
        if (data.globalWeekly) this.globalWeekly = data.globalWeekly;
        if (data.globalMonthly) this.globalMonthly = data.globalMonthly;
        if (data.statusCodes) this.statusCodes = data.statusCodes;
        if (data.clientEcosystems)
          this.clientEcosystems = data.clientEcosystems;
        if (Array.isArray(data.recentErrors))
          this.recentErrors = data.recentErrors;
        if (Array.isArray(data.hourlyCounts))
          this.hourlyCounts = data.hourlyCounts;
        if (data.dayOfWeekCounts) this.dayOfWeekCounts = data.dayOfWeekCounts;
      }
    } catch {}
  }

  private async loadFromMongo(): Promise<void> {
    if (!this.mongoDb) return;
    try {
      const coll = this.mongoDb.collection("krix_stats");
      const doc = await coll.findOne({ _id: "global_stats" as any });
      if (doc) {
        if (Array.isArray(doc.keys)) {
          this.keys = new Map(doc.keys);
        }
        if (doc.globalTools) this.globalTools = doc.globalTools;
        if (doc.globalProtocol) this.globalProtocol = doc.globalProtocol;
        if (doc.globalDaily) this.globalDaily = doc.globalDaily;
        if (doc.globalWeekly) this.globalWeekly = doc.globalWeekly;
        if (doc.globalMonthly) this.globalMonthly = doc.globalMonthly;
        if (doc.statusCodes) this.statusCodes = doc.statusCodes;
        if (doc.clientEcosystems) this.clientEcosystems = doc.clientEcosystems;
        if (Array.isArray(doc.recentErrors))
          this.recentErrors = doc.recentErrors;
        if (Array.isArray(doc.hourlyCounts))
          this.hourlyCounts = doc.hourlyCounts;
        if (doc.dayOfWeekCounts) this.dayOfWeekCounts = doc.dayOfWeekCounts;
      }
    } catch {}
  }
}

export const statsTracker = new StatsTracker();
