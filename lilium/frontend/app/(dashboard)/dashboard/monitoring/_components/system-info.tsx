"use client";

import { Server, Cpu, HardDrive, Code } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SystemInfo } from "@/types/monitoring";

interface SystemInfoCardProps {
  system: SystemInfo | undefined;
  isLoading: boolean;
}

export function SystemInfoCard({ system, isLoading }: SystemInfoCardProps) {
  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)}MB`;
  };

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
    <Card>
      <CardHeader>
        <CardTitle>System Information</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !system || !system.memoryUsage || !system.cpuUsage ? (
          <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <p>System info unavailable</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Node.js Info */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Code className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Node.js</p>
                  <p className="text-xs text-muted-foreground">
                    {system.nodeVersion}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  system.env === "production"
                    ? "border-green-500 text-green-600"
                    : "border-yellow-500 text-yellow-600"
                }
              >
                {system.env}
              </Badge>
            </div>

            {/* Platform Info */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Platform</p>
                  <p className="text-xs text-muted-foreground">
                    {system.platform} / {system.arch}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">PID: {system.pid}</p>
                <p className="text-xs text-muted-foreground">
                  {formatUptime(system.uptime)} uptime
                </p>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-3 mb-3">
                <HardDrive className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Used:</span>
                  <span className="font-mono">
                    {formatBytes(system.memoryUsage.heapUsed)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Total:</span>
                  <span className="font-mono">
                    {formatBytes(system.memoryUsage.heapTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">External:</span>
                  <span className="font-mono">
                    {formatBytes(system.memoryUsage.external)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSS:</span>
                  <span className="font-mono">
                    {formatBytes(system.memoryUsage.rss)}
                  </span>
                </div>
              </div>
            </div>

            {/* CPU Usage */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-mono">
                    {(system.cpuUsage.user / 1000000).toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System:</span>
                  <span className="font-mono">
                    {(system.cpuUsage.system / 1000000).toFixed(2)}s
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
