"use client";

import { RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAPIMetrics,
  useEndpointMetrics,
  useHealthStatus,
  useSystemInfo,
} from "@/hooks/useMonitoring";
import { MetricsCards } from "./_components/metrics-cards";
import { HealthStatusCard } from "./_components/health-status";
import { EndpointsTable } from "./_components/endpoints-table";
import { SystemInfoCard } from "./_components/system-info";

export default function MonitoringPage() {
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useAPIMetrics();
  const {
    data: endpoints,
    isLoading: isLoadingEndpoints,
    refetch: refetchEndpoints,
  } = useEndpointMetrics();
  const {
    data: health,
    isLoading: isLoadingHealth,
    refetch: refetchHealth,
  } = useHealthStatus();
  const {
    data: system,
    isLoading: isLoadingSystem,
    refetch: refetchSystem,
  } = useSystemInfo();

  const handleRefreshAll = () => {
    refetchMetrics();
    refetchEndpoints();
    refetchHealth();
    refetchSystem();
  };

  return (
    <div className="flex flex-col">
      <Header title="API Monitoring" />

      <div className="flex-1 space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Real-time API performance monitoring and system health
          </p>
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All
          </Button>
        </div>

        {/* Metrics Cards */}
        <MetricsCards metrics={metrics} isLoading={isLoadingMetrics} />

        {/* Tabs for detailed views */}
        <Tabs defaultValue="endpoints" className="space-y-4">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="health">Health Status</TabsTrigger>
            <TabsTrigger value="system">System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-4">
            <EndpointsTable
              endpoints={endpoints}
              isLoading={isLoadingEndpoints}
            />
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <HealthStatusCard health={health} isLoading={isLoadingHealth} />
              <SystemInfoCard system={system} isLoading={isLoadingSystem} />
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <SystemInfoCard system={system} isLoading={isLoadingSystem} />
              <HealthStatusCard health={health} isLoading={isLoadingHealth} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
