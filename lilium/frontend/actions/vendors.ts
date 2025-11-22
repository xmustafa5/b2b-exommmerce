import { apiClient } from "./config";
import type {
  Vendor,
  VendorCreateInput,
  VendorUpdateInput,
  VendorFilters,
  VendorsResponse,
} from "@/types/vendor";

export const vendorsApi = {
  // Get all vendors (paginated)
  getAll: async (filters?: VendorFilters): Promise<VendorsResponse> => {
    const response = await apiClient.get<VendorsResponse>("/vendors", {
      params: filters,
    });
    return response.data;
  },

  // Get single vendor by ID
  getById: async (id: string): Promise<Vendor> => {
    const response = await apiClient.get<Vendor>(`/vendors/${id}`);
    return response.data;
  },

  // Create new vendor
  create: async (data: VendorCreateInput): Promise<Vendor> => {
    const response = await apiClient.post<Vendor>("/vendors", data);
    return response.data;
  },

  // Update vendor
  update: async (id: string, data: VendorUpdateInput): Promise<Vendor> => {
    const response = await apiClient.put<Vendor>(`/vendors/${id}`, data);
    return response.data;
  },

  // Delete vendor
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vendors/${id}`);
  },

  // Toggle vendor active status
  toggleActive: async (id: string): Promise<Vendor> => {
    const response = await apiClient.patch<Vendor>(`/vendors/${id}/toggle`);
    return response.data;
  },

  // Get vendor dashboard stats
  getDashboardStats: async (): Promise<{
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  }> => {
    const response = await apiClient.get("/vendors/dashboard/stats");
    return response.data;
  },
};
