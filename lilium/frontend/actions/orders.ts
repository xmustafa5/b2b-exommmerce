import { apiClient } from "./config";
import type {
  Order,
  OrderCreateInput,
  OrderUpdateInput,
  OrderFilters,
  OrdersResponse,
} from "@/types/order";

// Transform backend response to expected frontend format
const transformOrdersResponse = (data: any, filters?: OrderFilters): OrdersResponse => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const total = data.total || data.pagination?.total || 0;
  const orders = data.orders || data.data || [];

  return {
    data: orders.map((order: any) => ({
      ...order,
      // Map backend fields to frontend expected fields
      shop: order.user ? {
        id: order.user.id,
        name: order.user.businessName || order.user.name,
        address: order.address?.street ? `${order.address.street}, ${order.address.area}` : '',
      } : undefined,
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentMethod: order.paymentMethod || 'COD',
      discount: order.discount || 0,
    })),
    meta: {
      total,
      page: data.pagination?.page || page,
      limit: data.pagination?.limit || limit,
      totalPages: data.pagination?.totalPages || Math.ceil(total / limit),
    },
  };
};

export const ordersApi = {
  // Get all orders (paginated)
  getAll: async (filters?: OrderFilters): Promise<OrdersResponse> => {
    const response = await apiClient.get("/orders", {
      params: filters,
    });
    return transformOrdersResponse(response.data, filters);
  },

  // Get vendor's orders
  getVendorOrders: async (filters?: OrderFilters): Promise<OrdersResponse> => {
    const response = await apiClient.get("/vendors/orders", {
      params: filters,
    });
    return transformOrdersResponse(response.data, filters);
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

  // Update order status (PUT /orders/:id/status)
  updateStatus: async (id: string, status: string, note?: string): Promise<Order> => {
    const response = await apiClient.put<Order>(`/orders/${id}/status`, {
      status,
      note,
    });
    return response.data;
  },

  // Cancel order (DELETE /orders/:id)
  cancel: async (id: string, reason?: string): Promise<Order> => {
    const response = await apiClient.delete<Order>(`/orders/${id}`);
    return response.data;
  },

  // Confirm order (uses updateStatus with CONFIRMED status)
  confirm: async (id: string): Promise<Order> => {
    const response = await apiClient.put<Order>(`/orders/${id}/status`, {
      status: 'CONFIRMED',
      note: 'Order confirmed',
    });
    return response.data;
  },

  // Mark as shipped (uses updateStatus with SHIPPED status)
  markAsShipped: async (id: string): Promise<Order> => {
    const response = await apiClient.put<Order>(`/orders/${id}/status`, {
      status: 'SHIPPED',
      note: 'Order shipped',
    });
    return response.data;
  },

  // Mark as delivered (uses updateStatus with DELIVERED status)
  markAsDelivered: async (id: string): Promise<Order> => {
    const response = await apiClient.put<Order>(`/orders/${id}/status`, {
      status: 'DELIVERED',
      note: 'Order delivered',
    });
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
