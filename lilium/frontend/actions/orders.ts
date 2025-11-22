import { apiClient } from "./config";
import type {
  Order,
  OrderCreateInput,
  OrderUpdateInput,
  OrderFilters,
  OrdersResponse,
} from "@/types/order";

export const ordersApi = {
  // Get all orders (paginated)
  getAll: async (filters?: OrderFilters): Promise<OrdersResponse> => {
    const response = await apiClient.get<OrdersResponse>("/orders", {
      params: filters,
    });
    return response.data;
  },

  // Get vendor's orders
  getVendorOrders: async (filters?: OrderFilters): Promise<OrdersResponse> => {
    const response = await apiClient.get<OrdersResponse>("/vendors/orders", {
      params: filters,
    });
    return response.data;
  },

  // Get single order by ID
  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Create new order
  create: async (data: OrderCreateInput): Promise<Order> => {
    const response = await apiClient.post<Order>("/orders", data);
    return response.data;
  },

  // Update order
  update: async (id: string, data: OrderUpdateInput): Promise<Order> => {
    const response = await apiClient.put<Order>(`/orders/${id}`, data);
    return response.data;
  },

  // Update order status
  updateStatus: async (id: string, status: string): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/orders/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Cancel order
  cancel: async (id: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post<Order>(`/orders/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Confirm order
  confirm: async (id: string): Promise<Order> => {
    const response = await apiClient.post<Order>(`/orders/${id}/confirm`);
    return response.data;
  },

  // Mark as ready for delivery
  markReadyForDelivery: async (id: string): Promise<Order> => {
    const response = await apiClient.post<Order>(
      `/orders/${id}/ready-for-delivery`
    );
    return response.data;
  },

  // Get order statistics
  getStats: async (): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
  }> => {
    const response = await apiClient.get("/orders/stats");
    return response.data;
  },
};
