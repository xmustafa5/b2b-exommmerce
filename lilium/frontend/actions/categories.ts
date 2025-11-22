import { apiClient } from "./config";
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryFilters,
  CategoriesResponse,
} from "@/types/category";

export const categoriesApi = {
  // Get all categories (paginated)
  getAll: async (filters?: CategoryFilters): Promise<CategoriesResponse> => {
    const response = await apiClient.get<CategoriesResponse>("/categories", {
      params: filters,
    });
    return response.data;
  },

  // Get category tree (hierarchical)
  getTree: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/categories/tree");
    return response.data;
  },

  // Get single category by ID
  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  // Get category by slug
  getBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/slug/${slug}`);
    return response.data;
  },

  // Create new category
  create: async (data: CategoryCreateInput): Promise<Category> => {
    const response = await apiClient.post<Category>("/categories", data);
    return response.data;
  },

  // Update category
  update: async (
    id: string,
    data: CategoryUpdateInput
  ): Promise<Category> => {
    const response = await apiClient.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  // Toggle category active status
  toggleActive: async (id: string): Promise<Category> => {
    const response = await apiClient.patch<Category>(
      `/categories/${id}/toggle`
    );
    return response.data;
  },

  // Reorder categories
  reorder: async (
    categoryIds: { id: string; sortOrder: number }[]
  ): Promise<void> => {
    await apiClient.post("/categories/reorder", { categories: categoryIds });
  },
};
