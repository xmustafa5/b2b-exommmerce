import { useQuery } from "@tanstack/react-query";
import { monitoringQueryKeys } from "@/constants/queryKeys";
import { monitoringApi } from "@/actions/monitoring";

// Get API metrics
export function useAPIMetrics() {
  return useQuery({
    queryKey: monitoringQueryKeys.metrics(),
    queryFn: monitoringApi.getMetrics,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// Get endpoint metrics
export function useEndpointMetrics() {
  return useQuery({
    queryKey: monitoringQueryKeys.endpoints(),
    queryFn: monitoringApi.getEndpoints,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get health status
export function useHealthStatus() {
  return useQuery({
    queryKey: monitoringQueryKeys.health(),
    queryFn: monitoringApi.getHealth,
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

// Get system info
export function useSystemInfo() {
  return useQuery({
    queryKey: monitoringQueryKeys.system(),
    queryFn: monitoringApi.getSystemInfo,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
