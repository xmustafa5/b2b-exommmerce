import { apiClient } from "./config";
import type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductFilters,
  ProductsResponse,
} from "@/types/product";

export const productsApi = {
  // Get all products (paginated)
  getAll: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const response = await apiClient.get<ProductsResponse>("/products", {
      params: filters,
    });
    return response.data;
  },

  // Get vendor's products
  getVendorProducts: async (
    filters?: ProductFilters
  ): Promise<ProductsResponse> => {
    const response = await apiClient.get<ProductsResponse>(
      "/vendors/products",
      {
        params: filters,
      }
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

  // Delete product
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // Toggle product active status
  toggleActive: async (id: string): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/products/${id}/toggle`);
    return response.data;
  },

  // Update stock
  updateStock: async (
    id: string,
    quantity: number,
    operation: "add" | "subtract" | "set"
  ): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/products/${id}/stock`, {
      quantity,
      operation,
    });
    return response.data;
  },

  // Upload product image
  uploadImage: async (
    id: string,
    file: File,
    isPrimary = false
  ): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("isPrimary", String(isPrimary));

    const response = await apiClient.post<{ url: string }>(
      `/products/${id}/images`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  // Delete product image
  deleteImage: async (productId: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/images/${imageId}`);
  },
};
