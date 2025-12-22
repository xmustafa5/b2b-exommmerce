import { useQuery, useMutation } from "@tanstack/react-query";
import { analyticsApi } from "@/actions/analytics";
import { analyticsQueryKeys } from "@/constants/queryKeys";
import type { DateRangeFilter, ReportRequest } from "@/types/analytics";

// Get dashboard overview statistics
export function useDashboardStats(filters?: DateRangeFilter) {
  return useQuery({
    queryKey: analyticsQueryKeys.dashboard(
      filters?.startDate,
      filters?.endDate,
      filters?.zone
    ),
    queryFn: () => analyticsApi.getDashboard(filters),
  });
}

// Get sales analytics
export function useSalesStats(filters?: DateRangeFilter) {
  return useQuery({
    queryKey: analyticsQueryKeys.sales(
      filters?.startDate,
      filters?.endDate,
      filters?.zone
    ),
    queryFn: () => analyticsApi.getSales(filters),
  });
}

// Get product analytics
export function useProductStats(filters?: DateRangeFilter) {
  return useQuery({
    queryKey: analyticsQueryKeys.products(
      filters?.startDate,
      filters?.endDate,
      filters?.zone
    ),
    queryFn: () => analyticsApi.getProducts(filters),
  });
}

// Get notify request analytics
export function useNotifyRequestStats(
  filters?: Pick<DateRangeFilter, "startDate" | "endDate">
) {
  return useQuery({
    queryKey: analyticsQueryKeys.notifyRequests(
      filters?.startDate,
      filters?.endDate
    ),
    queryFn: () => analyticsApi.getNotifyRequests(filters),
  });
}

// Get vendor dashboard
export function useVendorDashboard() {
  return useQuery({
    queryKey: analyticsQueryKeys.vendorDashboard(),
    queryFn: () => analyticsApi.getVendorDashboard(),
  });
}

// Get admin dashboard
export function useAdminDashboard() {
  return useQuery({
    queryKey: analyticsQueryKeys.adminDashboard(),
    queryFn: () => analyticsApi.getAdminDashboard(),
  });
}

// Generate sales report
export function useGenerateSalesReport() {
  return useMutation({
    mutationFn: (data: ReportRequest) => analyticsApi.generateSalesReport(data),
  });
}

// Generate commission report
export function useGenerateCommissionReport() {
  return useMutation({
    mutationFn: (data: ReportRequest) =>
      analyticsApi.generateCommissionReport(data),
  });
}

// Export analytics data
export function useExportAnalytics() {
  return useMutation({
    mutationFn: (params: {
      type: "dashboard" | "sales" | "products" | "notify-requests";
      format: "csv" | "pdf";
      startDate?: string;
      endDate?: string;
      zone?: string;
    }) => analyticsApi.exportData(params),
  });
}
