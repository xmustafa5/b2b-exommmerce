import { apiClient } from "./config";
import type {
  Promotion,
  PromotionCreateInput,
  PromotionUpdateInput,
  PromotionFilters,
  PromotionPreview,
} from "@/types/promotion";

export interface PromotionsListResponse {
  promotions: Promotion[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplyToCartRequest {
  cartId: string;
  promotionCode: string;
}

export interface ApplyToCartResponse {
  success: boolean;
  discount: number;
  message: string;
}

export const promotionsApi = {
  // Get all promotions with optional filters
  getAll: async (filters?: PromotionFilters): Promise<Promotion[]> => {
    const params: Record<string, string> = {};
    if (filters?.type) params.type = filters.type;
    if (filters?.isActive !== undefined) params.isActive = String(filters.isActive);
    if (filters?.zone) params.zone = filters.zone;
    if (filters?.search) params.search = filters.search;

    const response = await apiClient.get<Promotion[]>("/promotions", { params });
    return response.data;
  },

  // Get active promotions for a specific zone
  getActiveByZone: async (zone: string): Promise<Promotion[]> => {
    const response = await apiClient.get<Promotion[]>(`/promotions/active/${zone}`);
    return response.data;
  },

  // Get single promotion by ID
  getById: async (id: string): Promise<Promotion> => {
    const response = await apiClient.get<Promotion>(`/promotions/${id}`);
    return response.data;
  },

  // Create new promotion
  create: async (data: PromotionCreateInput): Promise<Promotion> => {
    const response = await apiClient.post<Promotion>("/promotions", data);
    return response.data;
  },

  // Update promotion
  update: async (id: string, data: PromotionUpdateInput): Promise<Promotion> => {
    const response = await apiClient.put<Promotion>(`/promotions/${id}`, data);
    return response.data;
  },

  // Toggle promotion active status
  toggle: async (id: string): Promise<Promotion> => {
    const response = await apiClient.patch<Promotion>(`/promotions/${id}/toggle`);
    return response.data;
  },

  // Delete promotion
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/promotions/${id}`);
  },

  // Apply promotion to cart
  applyToCart: async (data: ApplyToCartRequest): Promise<ApplyToCartResponse> => {
    const response = await apiClient.post<ApplyToCartResponse>("/promotions/apply-to-cart", data);
    return response.data;
  },
};
