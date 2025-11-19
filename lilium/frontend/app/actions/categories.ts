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

    const { data } = await apiClient.get<any[]>(
      `/categories?${params.toString()}`
    );

    // Transform backend response to frontend format
    return data.map((category: any) => ({
      ...category,
      name: category.nameEn,
      description: category.descriptionEn,
      order: category.sortOrder || 0,
    }));
  },

  /**
   * Get a single category by ID
   */
  getById: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get<any>(`/categories/${id}`);
    return {
      ...data,
      name: data.nameEn,
      description: data.descriptionEn,
      order: data.sortOrder || 0,
    };
  },

  /**
   * Create a new category
   */
  create: async (input: CategoryCreateInput): Promise<Category> => {
    // Transform frontend format to backend format
    const backendInput = {
      ...input,
      nameEn: input.name,
      descriptionEn: input.description,
      sortOrder: input.order,
      name: undefined,
      description: undefined,
      order: undefined,
    };

    const { data } = await apiClient.post<any>('/categories', backendInput);
    return {
      ...data,
      name: data.nameEn,
      description: data.descriptionEn,
      order: data.sortOrder || 0,
    };
  },

  /**
   * Update an existing category
   */
  update: async (id: string, input: CategoryUpdateInput): Promise<Category> => {
    // Transform frontend format to backend format
    const backendInput = {
      ...input,
      nameEn: input.name,
      descriptionEn: input.description,
      sortOrder: input.order,
      name: undefined,
      description: undefined,
      order: undefined,
    };

    const { data } = await apiClient.put<any>(`/categories/${id}`, backendInput);
    return {
      ...data,
      name: data.nameEn,
      description: data.descriptionEn,
      order: data.sortOrder || 0,
    };
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
