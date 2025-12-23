import { apiClient } from "./config";
import type {
  User,
  Admin,
  ShopOwner,
  AdminCreateInput,
  AdminUpdateInput,
  UserUpdateInput,
  AdminFilters,
  ShopOwnerFilters,
  AdminListResponse,
  ShopOwnerListResponse,
  AdminStats,
  Zone,
} from "@/types/user";

// Regular users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get("/users");
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  update: async (id: string, input: UserUpdateInput): Promise<User> => {
    const { data } = await apiClient.put(`/users/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

// Admins API
export const adminsApi = {
  getAll: async (filters?: AdminFilters): Promise<AdminListResponse> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.zone) params.append("zone", filters.zone);
    if (filters?.isActive !== undefined)
      params.append("isActive", String(filters.isActive));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const { data } = await apiClient.get(`/admins?${params}`);
    return data;
  },

  getById: async (id: string): Promise<Admin> => {
    const { data } = await apiClient.get(`/admins/${id}`);
    return data;
  },

  getStats: async (): Promise<AdminStats> => {
    const { data } = await apiClient.get("/admins/stats");
    return data;
  },

  create: async (input: AdminCreateInput): Promise<Admin> => {
    const { data } = await apiClient.post("/admins", input);
    return data;
  },

  update: async (id: string, input: AdminUpdateInput): Promise<Admin> => {
    const { data } = await apiClient.put(`/admins/${id}`, input);
    return data;
  },

  updateZones: async (id: string, zones: Zone[]): Promise<Admin> => {
    const { data } = await apiClient.patch(`/admins/${id}/zones`, { zones });
    return data;
  },

  toggleActive: async (id: string, isActive: boolean): Promise<Admin> => {
    const { data } = await apiClient.patch(`/admins/${id}/active`, { isActive });
    return data;
  },

  resetPassword: async (
    id: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.post(`/admins/${id}/reset-password`, {
      newPassword,
    });
    return data;
  },

  delete: async (id: string): Promise<{ message: string; admin: Admin }> => {
    const { data } = await apiClient.delete(`/admins/${id}`);
    return data;
  },

  // Shop owners management
  getShopOwners: async (
    filters?: ShopOwnerFilters
  ): Promise<ShopOwnerListResponse> => {
    const params = new URLSearchParams();
    if (filters?.zone) params.append("zone", filters.zone);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const { data } = await apiClient.get(`/admins/shop-owners?${params}`);
    return data;
  },

  toggleShopOwnerActive: async (
    id: string,
    isActive: boolean
  ): Promise<ShopOwner> => {
    const { data } = await apiClient.patch(`/admins/shop-owners/${id}/active`, {
      isActive,
    });
    return data;
  },
};
