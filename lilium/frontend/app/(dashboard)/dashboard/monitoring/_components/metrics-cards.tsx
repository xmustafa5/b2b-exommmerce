"use client";

import {
  Activity,
  AlertCircle,
  Clock,
  Gauge,
  Server,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { APIMetrics } from "@/types/monitoring";

interface MetricsCardsProps {
  metrics: APIMetrics | undefined;
  isLoading: boolean;
}

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "-" : metrics?.requestCount?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "-"
              : `${metrics?.requestsPerMinute || 0} req/min`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              metrics?.errorRate && metrics.errorRate > 5
                ? "text-red-600"
                : metrics?.errorRate && metrics.errorRate > 1
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {isLoading ? "-" : `${metrics?.errorRate?.toFixed(2) || 0}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "-" : `${metrics?.errorCount || 0} errors`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <Clock className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              metrics?.avgResponseTime && metrics.avgResponseTime > 500
                ? "text-red-600"
                : metrics?.avgResponseTime && metrics.avgResponseTime > 200
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {isLoading
              ? "-"
              : `${metrics?.avgResponseTime?.toFixed(1) || 0}ms`}
          </div>
          <p className="text-xs text-muted-foreground">
            p95: {isLoading ? "-" : `${metrics?.p95ResponseTime?.toFixed(1) || 0}ms`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          <Server className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "-" : formatUptime(metrics?.uptime || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Server running</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Heap Used</CardTitle>
          <Gauge className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "-" : `${metrics?.memoryUsage?.heapUsed || 0}MB`}
          </div>
          <p className="text-xs text-muted-foreground">
            of {isLoading ? "-" : `${metrics?.memoryUsage?.heapTotal || 0}MB`}{" "}
            total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">RSS Memory</CardTitle>
          <Zap className="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "-" : `${metrics?.memoryUsage?.rss || 0}MB`}
          </div>
          <p className="text-xs text-muted-foreground">Resident Set Size</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">p95 Response</CardTitle>
          <Clock className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading
              ? "-"
              : `${metrics?.p95ResponseTime?.toFixed(1) || 0}ms`}
          </div>
          <p className="text-xs text-muted-foreground">95th percentile</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">p99 Response</CardTitle>
          <Clock className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading
              ? "-"
              : `${metrics?.p99ResponseTime?.toFixed(1) || 0}ms`}
          </div>
          <p className="text-xs text-muted-foreground">99th percentile</p>
        </CardContent>
      </Card>
    </div>
  );
}
