import { apiClient } from "./config";
import type {
  DateRangeFilter,
  DashboardStats,
  SalesStats,
  ProductStats,
  NotifyRequestStats,
  VendorDashboardStats,
  AdminDashboardStats,
  SalesReport,
  CommissionReport,
  ReportRequest,
} from "@/types/analytics";

export const analyticsApi = {
  // Get dashboard overview statistics
  getDashboard: async (filters?: DateRangeFilter): Promise<DashboardStats> => {
    const params: Record<string, string> = {};
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.zone) params.zone = filters.zone;

    const response = await apiClient.get<DashboardStats>("/analytics/dashboard", {
      params,
    });
    return response.data;
  },

  // Get sales analytics
  getSales: async (filters?: DateRangeFilter): Promise<SalesStats> => {
    const params: Record<string, string> = {};
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.zone) params.zone = filters.zone;

    const response = await apiClient.get<SalesStats>("/analytics/sales", {
      params,
    });
    return response.data;
  },

  // Get product analytics
  getProducts: async (filters?: DateRangeFilter): Promise<ProductStats> => {
    const params: Record<string, string> = {};
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.zone) params.zone = filters.zone;

    const response = await apiClient.get<ProductStats>("/analytics/products", {
      params,
    });
    return response.data;
  },

  // Get notify request analytics
  getNotifyRequests: async (
    filters?: Pick<DateRangeFilter, "startDate" | "endDate">
  ): Promise<NotifyRequestStats> => {
    const params: Record<string, string> = {};
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const response = await apiClient.get<NotifyRequestStats>(
      "/analytics/notify-requests",
      { params }
    );
    return response.data;
  },

  // Get vendor dashboard
  getVendorDashboard: async (): Promise<{ success: boolean; stats: VendorDashboardStats }> => {
    const response = await apiClient.get<{ success: boolean; stats: VendorDashboardStats }>(
      "/analytics/dashboard/vendor"
    );
    return response.data;
  },

  // Get admin dashboard
  getAdminDashboard: async (): Promise<{ success: boolean; dashboard: AdminDashboardStats }> => {
    const response = await apiClient.get<{ success: boolean; dashboard: AdminDashboardStats }>(
      "/analytics/dashboard/admin"
    );
    return response.data;
  },

  // Generate sales report
  generateSalesReport: async (data: ReportRequest): Promise<{ success: boolean; report: SalesReport }> => {
    const response = await apiClient.post<{ success: boolean; report: SalesReport }>(
      "/analytics/reports/sales",
      data
    );
    return response.data;
  },

  // Generate commission report
  generateCommissionReport: async (data: ReportRequest): Promise<{ success: boolean; report: CommissionReport }> => {
    const response = await apiClient.post<{ success: boolean; report: CommissionReport }>(
      "/analytics/reports/commission",
      data
    );
    return response.data;
  },

  // Export analytics data
  exportData: async (params: {
    type: "dashboard" | "sales" | "products" | "notify-requests";
    format: "csv" | "pdf";
    startDate?: string;
    endDate?: string;
    zone?: string;
  }): Promise<{ message: string; downloadUrl: string | null }> => {
    const response = await apiClient.get<{ message: string; downloadUrl: string | null }>(
      "/analytics/export",
      { params }
    );
    return response.data;
  },
};
