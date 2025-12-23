import { apiClient } from "./config";
import type {
  APIMetrics,
  EndpointMetrics,
  HealthStatus,
  SystemInfo,
} from "@/types/monitoring";

export const monitoringApi = {
  // Get API metrics
  getMetrics: async (): Promise<APIMetrics> => {
    const response = await apiClient.get<APIMetrics>("/monitoring/metrics");
    return response.data;
  },

  // Get endpoint metrics
  getEndpoints: async (): Promise<EndpointMetrics[]> => {
    const response = await apiClient.get<EndpointMetrics[]>(
      "/monitoring/endpoints"
    );
    return response.data;
  },

  // Get health status
  getHealth: async (): Promise<HealthStatus> => {
    const response = await apiClient.get<HealthStatus>("/monitoring/health");
    return response.data;
  },

  // Get system info
  getSystemInfo: async (): Promise<SystemInfo> => {
    const response = await apiClient.get<SystemInfo>("/monitoring/system");
    return response.data;
  },
};
