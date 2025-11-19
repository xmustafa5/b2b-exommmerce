import { apiClient } from './config';
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryReorderInput,
} from '@/app/types/category';

export const categoriesApi = {
  /**
   * Get all categories
   */
  getAll: async (filters?: { isActive?: boolean }): Promise<Category[]> => {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) {
      params.append('isActive', String(filters.isActive));
    }

    const { data } = await apiClient.get<Category[]>(
      `/categories?${params.toString()}`
    );
    return data;
  },

  /**
   * Get a single category by ID
   */
  getById: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get<Category>(`/categories/${id}`);
    return data;
  },

  /**
   * Create a new category
   */
  create: async (input: CategoryCreateInput): Promise<Category> => {
    const { data } = await apiClient.post<Category>('/categories', input);
    return data;
  },

  /**
   * Update an existing category
   */
  update: async (id: string, input: CategoryUpdateInput): Promise<Category> => {
    const { data } = await apiClient.put<Category>(`/categories/${id}`, input);
    return data;
  },

  /**
   * Delete a category
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  /**
   * Reorder categories
   */
  reorder: async (reorderData: CategoryReorderInput[]): Promise<Category[]> => {
    const { data } = await apiClient.post<Category[]>('/categories/reorder', {
      items: reorderData,
    });
    return data;
  },

  /**
   * Toggle category active status
   */
  toggleActive: async (id: string): Promise<Category> => {
    const { data } = await apiClient.patch<Category>(`/categories/${id}/toggle-active`);
    return data;
  },

  /**
   * Upload category image
   */
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const { data } = await apiClient.post<{ url: string }>(
      '/categories/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.url;
  },
};
