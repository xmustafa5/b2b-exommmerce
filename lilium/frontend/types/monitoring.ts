// API Metrics
export interface APIMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  activeConnections: number;
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

// Endpoint Metrics
export interface EndpointMetrics {
  path: string;
  method: string;
  count: number;
  avgResponseTime: number;
  errorCount: number;
  lastAccessed: string;
}

// Health Status
export type HealthStatusType = "healthy" | "degraded" | "unhealthy";

export interface HealthStatus {
  status: HealthStatusType;
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: boolean;
    redis?: boolean;
    memory: boolean;
    cpu: boolean;
  };
  details: {
    database?: string;
    redis?: string;
    memory?: string;
    cpu?: string;
  };
}

// System Info
export interface SystemInfo {
  nodeVersion: string;
  platform: string;
  arch: string;
  pid: number;
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  env: string;
}
