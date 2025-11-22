import { apiClient } from "./config";
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryFilters,
  CategoryStats,
  CategoryReorderItem,
} from "@/types/category";

export const categoriesApi = {
  // Get all categories (returns hierarchical tree)
  getAll: async (filters?: CategoryFilters): Promise<Category[]> => {
    const params = filters?.includeInactive ? { includeInactive: "true" } : {};
    const response = await apiClient.get<Category[]>("/categories", { params });
    return response.data;
  },

  // Get single category by ID
  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  // Get category statistics
  getStats: async (): Promise<CategoryStats[]> => {
    const response = await apiClient.get<CategoryStats[]>("/categories/stats");
    return response.data;
  },

  // Create new category
  create: async (data: CategoryCreateInput): Promise<Category> => {
    const response = await apiClient.post<Category>("/categories", data);
    return response.data;
  },

  // Update category
  update: async (id: string, data: CategoryUpdateInput): Promise<Category> => {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  delete: async (id: string, reassignToId?: string): Promise<void> => {
    const params = reassignToId ? { reassignToId } : {};
    await apiClient.delete(`/categories/${id}`, { params });
  },

  // Reorder categories
  reorder: async (categories: CategoryReorderItem[]): Promise<void> => {
    await apiClient.patch("/categories/reorder", { categories });
  },
};
