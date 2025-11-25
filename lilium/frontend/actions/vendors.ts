import { apiClient } from "./config";
import type {
  VendorCompany,
  VendorCompanyUpdateInput,
  VendorCompanyResponse,
  VendorStats,
  VendorStatsResponse,
  VendorProduct,
  VendorProductCreateInput,
  VendorProductUpdateInput,
  VendorProductStockUpdate,
  VendorProductFilters,
  VendorProductsResponse,
  VendorProductResponse,
  VendorOrder,
  VendorOrderFilters,
  VendorOrderStatusUpdate,
  VendorOrdersResponse,
  VendorOrderResponse,
  VendorCustomer,
  VendorCustomerFilters,
  VendorCustomersResponse,
  VendorExportType,
  VendorExportFormat,
  VendorExportResponse,
} from "@/types/vendor";

export const vendorsApi = {
  // ============================================
  // Company Management
  // ============================================

  // Get vendor's company
  getCompany: async (): Promise<VendorCompany> => {
    const response = await apiClient.get<VendorCompanyResponse>("/vendors/company");
    return response.data.company;
  },

  // Update vendor's company
  updateCompany: async (
    id: string,
    data: VendorCompanyUpdateInput
  ): Promise<VendorCompany> => {
    const response = await apiClient.put<VendorCompanyResponse>(
      `/vendors/company/${id}`,
      data
    );
    return response.data.company;
  },

  // ============================================
  // Dashboard Statistics
  // ============================================

  // Get vendor dashboard stats
  getStats: async (): Promise<VendorStats> => {
    const response = await apiClient.get<VendorStatsResponse>("/vendors/stats");
    return response.data.stats;
  },

  // ============================================
  // Product Management
  // ============================================

  // List vendor products
  getProducts: async (filters?: VendorProductFilters): Promise<VendorProductsResponse> => {
    const response = await apiClient.get<VendorProductsResponse>("/vendors/products", {
      params: filters,
    });
    return response.data;
  },

  // Get vendor product by ID
  getProductById: async (id: string): Promise<VendorProduct> => {
    const response = await apiClient.get<VendorProductResponse>(
      `/vendors/products/${id}`
    );
    return response.data.product;
  },

  // Create product
  createProduct: async (data: VendorProductCreateInput): Promise<VendorProduct> => {
    const response = await apiClient.post<VendorProductResponse>(
      "/vendors/products",
      data
    );
    return response.data.product;
  },

  // Update product
  updateProduct: async (
    id: string,
    data: VendorProductUpdateInput
  ): Promise<VendorProduct> => {
    const response = await apiClient.put<VendorProductResponse>(
      `/vendors/products/${id}`,
      data
    );
    return response.data.product;
  },

  // Delete product
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/vendors/products/${id}`);
  },

  // Update product stock
  updateProductStock: async (
    id: string,
    data: VendorProductStockUpdate
  ): Promise<VendorProduct> => {
    const response = await apiClient.patch<VendorProductResponse>(
      `/vendors/products/${id}/stock`,
      data
    );
    return response.data.product;
  },

  // ============================================
  // Order Management
  // ============================================

  // List vendor orders
  getOrders: async (filters?: VendorOrderFilters): Promise<VendorOrdersResponse> => {
    const response = await apiClient.get<VendorOrdersResponse>("/vendors/orders", {
      params: filters,
    });
    return response.data;
  },

  // Get vendor order by ID
  getOrderById: async (id: string): Promise<VendorOrder> => {
    const response = await apiClient.get<VendorOrderResponse>(
      `/vendors/orders/${id}`
    );
    return response.data.order;
  },

  // Update order status
  updateOrderStatus: async (
    id: string,
    data: VendorOrderStatusUpdate
  ): Promise<VendorOrder> => {
    const response = await apiClient.patch<VendorOrderResponse>(
      `/vendors/orders/${id}/status`,
      data
    );
    return response.data.order;
  },

  // ============================================
  // Customer Management
  // ============================================

  // Get vendor customers
  getCustomers: async (
    filters?: VendorCustomerFilters
  ): Promise<VendorCustomersResponse> => {
    const response = await apiClient.get<VendorCustomersResponse>(
      "/vendors/customers",
      {
        params: filters,
      }
    );
    return response.data;
  },

  // ============================================
  // Data Export
  // ============================================

  // Export vendor data
  exportData: async (
    type: VendorExportType,
    format: VendorExportFormat = "json"
  ): Promise<VendorExportResponse> => {
    const response = await apiClient.get<VendorExportResponse>(
      `/vendors/export/${type}`,
      {
        params: { format },
      }
    );
    return response.data;
  },
};
