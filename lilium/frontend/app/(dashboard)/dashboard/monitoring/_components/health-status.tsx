"use client";

import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  HardDrive,
  Cpu,
  Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HealthStatus } from "@/types/monitoring";

interface HealthStatusCardProps {
  health: HealthStatus | undefined;
  isLoading: boolean;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    label: "Healthy",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    label: "Degraded",
  },
  unhealthy: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    label: "Unhealthy",
  },
};

export function HealthStatusCard({ health, isLoading }: HealthStatusCardProps) {
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

  const status = health?.status || "healthy";
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Health</span>
          {!isLoading && (
            <Badge className={`${config.bgColor} ${config.textColor}`}>
              <StatusIcon className="mr-1 h-4 w-4" />
              {config.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Version & Uptime */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Server</p>
                  <p className="text-xs text-muted-foreground">
                    v{health?.version || "1.0.0"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatUptime(health?.uptime || 0)}
                </p>
                <p className="text-xs text-muted-foreground">uptime</p>
              </div>
            </div>

            {/* Health Checks */}
            <div className="space-y-2">
              {/* Database */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  {health?.checks?.database ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {health?.details?.database || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Redis (if available) */}
              {health?.checks?.redis !== undefined && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Redis Cache</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {health?.checks?.redis ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {health?.details?.redis || "Unknown"}
                    </span>
                  </div>
                </div>
              )}

              {/* Memory */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Memory</span>
                </div>
                <div className="flex items-center gap-2">
                  {health?.checks?.memory ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {health?.details?.memory || "Unknown"}
                  </span>
                </div>
              </div>

              {/* CPU */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                <div className="flex items-center gap-2">
                  {health?.checks?.cpu ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {health?.details?.cpu || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
