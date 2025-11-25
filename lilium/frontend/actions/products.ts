import { apiClient } from "./config";
import type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductFilters,
  ProductsResponse,
  StockUpdateInput,
  BulkUpdateInput,
  BulkDeleteInput,
} from "@/types/product";

export const productsApi = {
  // Get all products with pagination and filters
  getAll: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const response = await apiClient.get<ProductsResponse>("/products", {
      params: filters,
    });
    return response.data;
  },

  // Get featured products
  getFeatured: async (zones?: string): Promise<Product[]> => {
    const params = zones ? { zones } : {};
    const response = await apiClient.get<Product[]>("/products/featured", {
      params,
    });
    return response.data;
  },

  // Get products by category
  getByCategory: async (
    categoryId: string,
    zones?: string
  ): Promise<Product[]> => {
    const params = zones ? { zones } : {};
    const response = await apiClient.get<Product[]>(
      `/products/category/${categoryId}`,
      { params }
    );
    return response.data;
  },

  // Get single product by ID
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  // Create new product
  create: async (data: ProductCreateInput): Promise<Product> => {
    const response = await apiClient.post<Product>("/products", data);
    return response.data;
  },

  // Update product
  update: async (id: string, data: ProductUpdateInput): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  // Update stock
  updateStock: async (
    id: string,
    data: StockUpdateInput
  ): Promise<Product> => {
    const response = await apiClient.patch<Product>(
      `/products/${id}/stock`,
      data
    );
    return response.data;
  },

  // Delete product
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // Bulk update products
  bulkUpdate: async (data: BulkUpdateInput): Promise<void> => {
    await apiClient.patch("/products/bulk", data);
  },

  // Bulk delete products
  bulkDelete: async (data: BulkDeleteInput): Promise<void> => {
    await apiClient.delete("/products/bulk", { data });
  },
};
