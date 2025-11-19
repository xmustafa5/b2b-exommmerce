import { apiClient } from './config';
import type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductsResponse,
  ProductFilters,
} from '@/app/types/product';

export const productsApi = {
  /**
   * Get all products with optional filters
   */
  getAll: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.isFeatured !== undefined) params.append('isFeatured', String(filters.isFeatured));
    if (filters?.minPrice) params.append('minPrice', String(filters.minPrice));
    if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
    if (filters?.zones?.length) params.append('zones', filters.zones.join(','));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const { data } = await apiClient.get<{
      products: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/products?${params.toString()}`);

    // Transform backend response to frontend format
    return {
      data: data.products.map((product: any) => ({
        ...product,
        name: product.nameEn,
        description: product.descriptionEn,
      })),
      page: data.pagination.page,
      pageSize: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.totalPages,
    };
  },

  /**
   * Get a single product by ID
   */
  getById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<any>(`/products/${id}`);
    return {
      ...data,
      name: data.nameEn,
      description: data.descriptionEn,
    };
  },

  /**
   * Create a new product
   */
  create: async (input: ProductCreateInput): Promise<Product> => {
    // Transform frontend format to backend format
    const backendInput = {
      ...input,
      nameEn: input.name,
      descriptionEn: input.description,
      name: undefined,
      description: undefined,
    };

    const { data } = await apiClient.post<any>('/products', backendInput);
    return {
      ...data,
      name: data.nameEn,
      description: data.descriptionEn,
    };
  },

  /**
   * Update an existing product
   */
  update: async (id: string, input: ProductUpdateInput): Promise<Product> => {
    // Transform frontend format to backend format
    const backendInput = {
      ...input,
      nameEn: input.name,
      descriptionEn: input.description,
      name: undefined,
      description: undefined,
    };

    const { data } = await apiClient.put<any>(`/products/${id}`, backendInput);
    return {
      ...data,
      name: data.nameEn,
      description: data.descriptionEn,
    };
  },

  /**
   * Delete a product
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  /**
   * Bulk delete products
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiClient.post('/products/bulk-delete', { ids });
  },

  /**
   * Upload product images
   */
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const { data } = await apiClient.post<{ urls: string[] }>(
      '/products/upload-images',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data.urls;
  },

  /**
   * Toggle product active status
   */
  toggleActive: async (id: string): Promise<Product> => {
    const { data } = await apiClient.patch<Product>(`/products/${id}/toggle-active`);
    return data;
  },

  /**
   * Toggle product featured status
   */
  toggleFeatured: async (id: string): Promise<Product> => {
    const { data } = await apiClient.patch<Product>(`/products/${id}/toggle-featured`);
    return data;
  },
};
