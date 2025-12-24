import { FastifyInstance } from 'fastify';

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

export interface EndpointMetrics {
  path: string;
  method: string;
  count: number;
  avgResponseTime: number;
  errorCount: number;
  lastAccessed: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
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

// In-memory metrics storage (in production, use Redis or TimescaleDB)
class MetricsStore {
  private responseTimes: number[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private startTime = Date.now();
  private endpointMetrics: Map<string, EndpointMetrics> = new Map();
  private readonly maxSamples = 1000;

  addResponseTime(time: number, path: string, method: string, isError: boolean) {
    this.responseTimes.push(time);
    this.requestCount++;

    if (isError) {
      this.errorCount++;
    }

    // Keep only last maxSamples
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }

    // Update endpoint metrics
    const key = `${method}:${path}`;
    const existing = this.endpointMetrics.get(key) || {
      path,
      method,
      count: 0,
      avgResponseTime: 0,
      errorCount: 0,
      lastAccessed: new Date(),
    };

    existing.count++;
    existing.avgResponseTime =
      (existing.avgResponseTime * (existing.count - 1) + time) / existing.count;
    if (isError) {
      existing.errorCount++;
    }
    existing.lastAccessed = new Date();

    this.endpointMetrics.set(key, existing);
  }

  getMetrics(): APIMetrics {
    const uptime = (Date.now() - this.startTime) / 1000;
    const mem = process.memoryUsage();

    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      avgResponseTime:
        sortedTimes.length > 0
          ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length
          : 0,
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      requestsPerMinute:
        uptime > 0 ? Math.round((this.requestCount / uptime) * 60) : 0,
      errorRate:
        this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      activeConnections: 0, // Would need server tracking
      uptime,
      memoryUsage: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
      },
    };
  }

  getEndpointMetrics(): EndpointMetrics[] {
    return Array.from(this.endpointMetrics.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 endpoints
  }

  reset() {
    this.responseTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.endpointMetrics.clear();
  }
}

const metricsStore = new MetricsStore();

export class MonitoringService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Record a request metric
   */
  recordRequest(
    responseTime: number,
    path: string,
    method: string,
    statusCode: number
  ) {
    const isError = statusCode >= 400;
    metricsStore.addResponseTime(responseTime, path, method, isError);
  }

  /**
   * Get current API metrics
   */
  getMetrics(): APIMetrics {
    return metricsStore.getMetrics();
  }

  /**
   * Get endpoint-specific metrics
   */
  getEndpointMetrics(): EndpointMetrics[] {
    return metricsStore.getEndpointMetrics();
  }

  /**
   * Check overall health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = {
      database: false,
      redis: undefined as boolean | undefined,
      memory: false,
      cpu: false,
    };
    const details: Record<string, string> = {};

    // Check database
    try {
      await this.fastify.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
      details.database = 'Connected';
    } catch (error) {
      details.database = `Connection failed: ${(error as Error).message}`;
    }

    // Check Redis if available
    if (this.fastify.redis) {
      try {
        await this.fastify.redis.ping();
        checks.redis = true;
        details.redis = 'Connected';
      } catch (error) {
        checks.redis = false;
        details.redis = `Connection failed: ${(error as Error).message}`;
      }
    }

    // Check memory
    const mem = process.memoryUsage();
    const heapUsedMB = mem.heapUsed / 1024 / 1024;
    const heapTotalMB = mem.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    if (heapUsagePercent < 85) {
      checks.memory = true;
      details.memory = `${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB (${heapUsagePercent.toFixed(1)}%)`;
    } else {
      details.memory = `High memory usage: ${heapUsagePercent.toFixed(1)}%`;
    }

    // CPU check (basic - just check if process is responsive)
    checks.cpu = true;
    details.cpu = 'Normal';

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!checks.database) {
      status = 'unhealthy';
    } else if (!checks.memory || (checks.redis === false)) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
      details,
    };
  }

  /**
   * Get detailed system info
   */
  getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      env: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Reset metrics (for testing or periodic reset)
   */
  resetMetrics() {
    metricsStore.reset();
  }
}

/**
 * Fastify plugin to add metrics collection
 */
export async function metricsPlugin(fastify: FastifyInstance) {
  const monitoringService = new MonitoringService(fastify);

  // Decorate fastify with monitoring service
  fastify.decorate('monitoring', monitoringService);

  // Add request timing hook
  fastify.addHook('onRequest', async (request) => {
    (request as any).startTime = process.hrtime();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime;
    if (startTime) {
      const diff = process.hrtime(startTime);
      const responseTime = diff[0] * 1000 + diff[1] / 1e6; // Convert to ms

      monitoringService.recordRequest(
        responseTime,
        request.routerPath || request.url,
        request.method,
        reply.statusCode
      );
    }
  });

  // Register metrics endpoints
  fastify.get('/api/monitoring/metrics', {
    schema: {
      tags: ['monitoring'],
      summary: 'Get API metrics',
      description: 'Returns current API performance metrics including request counts, response times, and error rates.',
      response: {
        200: {
          type: 'object',
          properties: {
            requestCount: { type: 'integer' },
            errorCount: { type: 'integer' },
            avgResponseTime: { type: 'number' },
            p95ResponseTime: { type: 'number' },
            p99ResponseTime: { type: 'number' },
            requestsPerMinute: { type: 'number' },
            errorRate: { type: 'number' },
            activeConnections: { type: 'integer' },
            uptime: { type: 'number' },
            memoryUsage: {
              type: 'object',
              properties: {
                heapUsed: { type: 'integer' },
                heapTotal: { type: 'integer' },
                external: { type: 'integer' },
                rss: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  }, async () => {
    return monitoringService.getMetrics();
  });

  fastify.get('/api/monitoring/endpoints', {
    schema: {
      tags: ['monitoring'],
      summary: 'Get endpoint metrics',
      description: 'Returns metrics for individual API endpoints (top 20 by request count).',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              method: { type: 'string' },
              count: { type: 'integer' },
              avgResponseTime: { type: 'number' },
              errorCount: { type: 'integer' },
              lastAccessed: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, async () => {
    return monitoringService.getEndpointMetrics();
  });

  fastify.get('/api/monitoring/health', {
    schema: {
      tags: ['monitoring'],
      summary: 'Get health status',
      description: 'Returns detailed health status including database and cache connectivity.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'boolean' },
                redis: { type: 'boolean', nullable: true },
                memory: { type: 'boolean' },
                cpu: { type: 'boolean' },
              },
            },
            details: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
        },
      },
    },
  }, async () => {
    return await monitoringService.getHealthStatus();
  });

  fastify.get('/api/monitoring/system', {
    schema: {
      tags: ['monitoring'],
      summary: 'Get system info',
      description: 'Returns detailed system information including Node.js version, memory usage, and CPU usage.',
      response: {
        200: {
          type: 'object',
          properties: {
            nodeVersion: { type: 'string' },
            platform: { type: 'string' },
            arch: { type: 'string' },
            pid: { type: 'integer' },
            uptime: { type: 'number' },
            env: { type: 'string' },
            memoryUsage: {
              type: 'object',
              properties: {
                heapUsed: { type: 'number' },
                heapTotal: { type: 'number' },
                external: { type: 'number' },
                rss: { type: 'number' },
                arrayBuffers: { type: 'number' },
              },
            },
            cpuUsage: {
              type: 'object',
              properties: {
                user: { type: 'number' },
                system: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async () => {
    return monitoringService.getSystemInfo();
  });
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    monitoring: MonitoringService;
    redis?: {
      ping(): Promise<string>;
    };
  }
}
