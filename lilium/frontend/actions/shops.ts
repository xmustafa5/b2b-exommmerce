import { apiClient } from "./config";
import type {
  Shop,
  ShopCreateInput,
  ShopUpdateInput,
  ShopFilters,
  ShopsResponse,
} from "@/types/shop";

export const shopsApi = {
  // Get all shops (paginated)
  getAll: async (filters?: ShopFilters): Promise<ShopsResponse> => {
    const response = await apiClient.get<ShopsResponse>("/shops", {
      params: filters,
    });
    return response.data;
  },

  // Get single shop by ID
  getById: async (id: string): Promise<Shop> => {
    const response = await apiClient.get<Shop>(`/shops/${id}`);
    return response.data;
  },

  // Get shops by company
  getByCompany: async (
    companyId: string,
    filters?: ShopFilters
  ): Promise<ShopsResponse> => {
    const response = await apiClient.get<ShopsResponse>(
      `/companies/${companyId}/shops`,
      { params: filters }
    );
    return response.data;
  },

  // Create new shop
  create: async (data: ShopCreateInput): Promise<Shop> => {
    const response = await apiClient.post<Shop>("/shops", data);
    return response.data;
  },

  // Update shop
  update: async (id: string, data: ShopUpdateInput): Promise<Shop> => {
    const response = await apiClient.put<Shop>(`/shops/${id}`, data);
    return response.data;
  },

  // Delete shop
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/shops/${id}`);
  },

  // Toggle shop active status
  toggleActive: async (id: string): Promise<Shop> => {
    const response = await apiClient.patch<Shop>(`/shops/${id}/toggle`);
    return response.data;
  },
};
