import { apiClient } from "./config";
import type {
  Promotion,
  PromotionCreateInput,
  PromotionUpdateInput,
  PromotionFilters,
  PromotionsResponse,
} from "@/app/types/promotion";

export const promotionsApi = {
  getAll: async (filters?: PromotionFilters): Promise<PromotionsResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.zone) params.append("zone", filters.zone);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.search) params.append("search", filters.search);

    const { data } = await apiClient.get(
      `/promotions${params.toString() ? `?${params.toString()}` : ""}`
    );
    return data;
  },

  getById: async (id: string): Promise<Promotion> => {
    const { data } = await apiClient.get(`/promotions/${id}`);
    return data;
  },

  create: async (input: PromotionCreateInput): Promise<Promotion> => {
    const { data } = await apiClient.post("/promotions", input);
    return data;
  },

  update: async (
    id: string,
    input: PromotionUpdateInput
  ): Promise<Promotion> => {
    const { data } = await apiClient.put(`/promotions/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/promotions/${id}`);
  },

  toggleActive: async (id: string): Promise<Promotion> => {
    const { data } = await apiClient.patch(`/promotions/${id}/toggle-active`);
    return data;
  },

  getActive: async (zone?: string): Promise<Promotion[]> => {
    const params = zone ? `?zone=${zone}` : "";
    const { data } = await apiClient.get(`/promotions/active${params}`);
    return data;
  },
};
