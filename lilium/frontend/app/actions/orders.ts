import { apiClient } from './config';
import type {
  Order,
  OrdersResponse,
  OrderFilters,
  OrderStats,
  UpdateOrderStatusInput,
  CancelOrderInput,
} from '@/app/types/order';

export const ordersApi = {
  /**
   * Get all orders with optional filters
   */
  getAll: async (filters?: OrderFilters): Promise<OrdersResponse> => {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.zone) params.append('zone', filters.zone);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const { data } = await apiClient.get(`/orders?${params.toString()}`);
    return data;
  },

  /**
   * Get a single order by ID
   */
  getById: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data;
  },

  /**
   * Update order status
   */
  updateStatus: async (
    id: string,
    input: UpdateOrderStatusInput
  ): Promise<Order> => {
    const { data } = await apiClient.put(`/orders/${id}/status`, input);
    return data;
  },

  /**
   * Cancel an order
   */
  cancel: async (id: string, input?: CancelOrderInput): Promise<Order> => {
    const { data } = await apiClient.post(`/orders/${id}/cancel`, input);
    return data;
  },

  /**
   * Get order statistics
   */
  getStats: async (zone?: string): Promise<OrderStats> => {
    const params = zone ? `?zone=${zone}` : '';
    const { data } = await apiClient.get(`/orders/stats${params}`);
    return data;
  },

  /**
   * Delete an order (admin only)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },
};
