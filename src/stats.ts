import fs from "node:fs";
import path from "node:path";

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
}

export interface StatsSummary {
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  overallSuccessRate: number;
  avgDurationMs: number;
  totalBytesIn: number;
  totalBytesOut: number;
  uniqueKeysCount: number;
  keys: KeyMetrics[];
  toolDistribution: Record<string, number>;
  dailyTimeline: Array<{ date: string; requests: number; tools: number }>;
  weeklyTimeline: Array<{ week: string; requests: number; tools: number }>;
  monthlyTimeline: Array<{ month: string; requests: number; tools: number }>;
  sharedSandbox: SharedSandboxStats;
}

export class StatsTracker {
  private keys = new Map<string, KeyMetrics>();
  private globalTools: Record<string, number> = {};
  private globalDaily: Record<string, { requests: number; tools: number }> = {};
  private globalWeekly: Record<string, { requests: number; tools: number }> =
    {};
  private globalMonthly: Record<string, { requests: number; tools: number }> =
    {};
  private filePath = path.resolve(process.cwd(), "data", ".krix_stats.json");
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    }
    this.load();
  }

  private getDateKeys(now: Date = new Date()) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    // ISO week calculation
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
    };
  }

  public recordRequest(params: {
    keyId: string;
    label?: string;
    type?: "api_key" | "oauth" | "master";
    toolName?: string;
    durationMs: number;
    isError: boolean;
    bytesIn: number;
    bytesOut: number;
    ip?: string;
    userAgent?: string;
  }): void {
    const {
      keyId,
      durationMs,
      isError,
      bytesIn,
      bytesOut,
      toolName,
      ip,
      userAgent,
    } = params;
    const now = new Date();
    const { date, week, month } = this.getDateKeys(now);

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
    entry.lastActiveAt = now.getTime();
    if (ip) entry.lastClientIp = ip;
    if (userAgent) entry.lastUserAgent = userAgent.slice(0, 100);

    // Timeline buckets
    entry.daily[date] = (entry.daily[date] || 0) + 1;
    entry.weekly[week] = (entry.weekly[week] || 0) + 1;
    entry.monthly[month] = (entry.monthly[month] || 0) + 1;

    // Global timeline buckets
    if (!this.globalDaily[date])
      this.globalDaily[date] = { requests: 0, tools: 0 };
    this.globalDaily[date].requests++;

    if (!this.globalWeekly[week])
      this.globalWeekly[week] = { requests: 0, tools: 0 };
    this.globalWeekly[week].requests++;

    if (!this.globalMonthly[month])
      this.globalMonthly[month] = { requests: 0, tools: 0 };
    this.globalMonthly[month].requests++;

    // Tool call tracking
    if (toolName) {
      entry.toolCalls[toolName] = (entry.toolCalls[toolName] || 0) + 1;
      this.globalTools[toolName] = (this.globalTools[toolName] || 0) + 1;
      this.globalDaily[date].tools++;
      this.globalWeekly[week].tools++;
      this.globalMonthly[month].tools++;
    }

    this.scheduleSave();
  }

  public getSharedSandboxStats(sandboxRoot?: string): SharedSandboxStats {
    const quotaLimitMb = Number(process.env.SANDBOX_MAX_TOTAL_MB) || 1000;
    const targetRoot =
      sandboxRoot || path.resolve(process.cwd(), "sandbox_data");
    const uploadDir = path.join(targetRoot, "upload");

    let uploadFileCount = 0;
    let uploadBytes = 0;
    const uploadFiles: Array<{ name: string; size: number; mtime: number }> =
      [];

    if (fs.existsSync(uploadDir)) {
      try {
        const files = fs.readdirSync(uploadDir);
        for (const f of files) {
          try {
            const stat = fs.statSync(path.join(uploadDir, f));
            if (stat.isFile()) {
              uploadFileCount++;
              uploadBytes += stat.size;
              uploadFiles.push({
                name: f,
                size: stat.size,
                mtime: stat.mtimeMs,
              });
            }
          } catch {}
        }
      } catch {}
    }

    let activeWorkDirs = 0;
    let totalDiskBytes = uploadBytes;

    if (fs.existsSync(targetRoot)) {
      try {
        const topDirs = fs.readdirSync(targetRoot);
        for (const d of topDirs) {
          if (d === "upload" || d === "lost+found" || d.startsWith("."))
            continue;
          try {
            const stat = fs.statSync(path.join(targetRoot, d));
            if (stat.isDirectory()) activeWorkDirs++;
          } catch {}
        }
      } catch {}
    }

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

    return {
      totalRequests,
      totalSuccess,
      totalErrors,
      overallSuccessRate,
      avgDurationMs,
      totalBytesIn,
      totalBytesOut,
      uniqueKeysCount: keys.length,
      keys,
      toolDistribution: this.globalTools,
      dailyTimeline,
      weeklyTimeline,
      monthlyTimeline,
      sharedSandbox: this.getSharedSandboxStats(sandboxRoot),
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
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const data = {
        keys: Array.from(this.keys.entries()),
        globalTools: this.globalTools,
        globalDaily: this.globalDaily,
        globalWeekly: this.globalWeekly,
        globalMonthly: this.globalMonthly,
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {}
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const data = JSON.parse(raw);
        if (Array.isArray(data.keys)) {
          this.keys = new Map(data.keys);
        }
        if (data.globalTools) this.globalTools = data.globalTools;
        if (data.globalDaily) this.globalDaily = data.globalDaily;
        if (data.globalWeekly) this.globalWeekly = data.globalWeekly;
        if (data.globalMonthly) this.globalMonthly = data.globalMonthly;
      }
    } catch {}
  }
}

export const statsTracker = new StatsTracker();
