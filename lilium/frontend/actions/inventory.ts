import { apiClient } from "./config";
import type {
  StockUpdateInput,
  BulkStockUpdateInput,
  StockUpdateResult,
  BulkStockUpdateResult,
  LowStockProduct,
  StockHistoryResponse,
  StockHistoryFilters,
  InventoryReport,
  RestockSuggestion,
  InventoryFilters,
} from "@/types/inventory";

export const inventoryApi = {
  // Update stock for a single product
  updateStock: async (data: StockUpdateInput): Promise<StockUpdateResult> => {
    const response = await apiClient.post<StockUpdateResult>(
      "/inventory/stock/update",
      data
    );
    return response.data;
  },

  // Bulk update stock for multiple products
  bulkUpdateStock: async (
    data: BulkStockUpdateInput
  ): Promise<BulkStockUpdateResult> => {
    const response = await apiClient.post<BulkStockUpdateResult>(
      "/inventory/stock/bulk-update",
      data
    );
    return response.data;
  },

  // Get all products with low stock
  getLowStock: async (filters?: InventoryFilters): Promise<LowStockProduct[]> => {
    const params: Record<string, string> = {};
    if (filters?.zone) params.zone = filters.zone;
    if (filters?.threshold) params.threshold = String(filters.threshold);

    const response = await apiClient.get<LowStockProduct[]>(
      "/inventory/low-stock",
      { params }
    );
    return response.data;
  },

  // Get all out of stock products
  getOutOfStock: async (zone?: string): Promise<LowStockProduct[]> => {
    const params = zone ? { zone } : {};
    const response = await apiClient.get<LowStockProduct[]>(
      "/inventory/out-of-stock",
      { params }
    );
    return response.data;
  },

  // Get stock history for a product
  getHistory: async (
    productId: string,
    filters?: StockHistoryFilters
  ): Promise<StockHistoryResponse> => {
    const params: Record<string, string> = {};
    if (filters?.limit) params.limit = String(filters.limit);
    if (filters?.offset) params.offset = String(filters.offset);
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const response = await apiClient.get<StockHistoryResponse>(
      `/inventory/history/${productId}`,
      { params }
    );
    return response.data;
  },

  // Generate inventory report
  getReport: async (zone?: string): Promise<InventoryReport> => {
    const params = zone ? { zone } : {};
    const response = await apiClient.get<InventoryReport>("/inventory/report", {
      params,
    });
    return response.data;
  },

  // Get products that need restocking based on sales velocity
  getRestockSuggestions: async (days?: number): Promise<RestockSuggestion[]> => {
    const params = days ? { days: String(days) } : {};
    const response = await apiClient.get<RestockSuggestion[]>(
      "/inventory/restock-suggestions",
      { params }
    );
    return response.data;
  },
};
