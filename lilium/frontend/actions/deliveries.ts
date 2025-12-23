import { apiClient } from "./config";
import type {
  Delivery,
  DeliveryDriver,
  DeliveryAssignInput,
  DeliveryUpdateInput,
  DeliveryFilters,
  DeliveriesResponse,
  OrderStatusUpdateInput,
  BulkStatusUpdateInput,
  BulkStatusUpdateResponse,
  DeliveryOrder,
  CashCollectionInput,
  CashCollectionRecord,
  DriverAssignment,
  DeliveryMetrics,
  DeliveryTracking,
  ActiveDeliveriesDashboard,
  MetricsPeriod,
  OrderDeliveryStatus,
} from "@/types/delivery";

export const deliveriesApi = {
  // Get all deliveries (paginated)
  getAll: async (filters?: DeliveryFilters): Promise<DeliveriesResponse> => {
    const response = await apiClient.get<DeliveriesResponse>("/deliveries", {
      params: filters,
    });
    return response.data;
  },

  // Get single delivery by ID
  getById: async (id: string): Promise<Delivery> => {
    const response = await apiClient.get<Delivery>(`/deliveries/${id}`);
    return response.data;
  },

  // Assign delivery to driver
  assign: async (id: string, data: DeliveryAssignInput): Promise<Delivery> => {
    const response = await apiClient.post<Delivery>(
      `/deliveries/${id}/assign`,
      data
    );
    return response.data;
  },

  // Update delivery status
  updateStatus: async (
    id: string,
    data: DeliveryUpdateInput
  ): Promise<Delivery> => {
    const response = await apiClient.patch<Delivery>(
      `/deliveries/${id}/status`,
      data
    );
    return response.data;
  },

  // Mark as picked up
  markPickedUp: async (id: string): Promise<Delivery> => {
    const response = await apiClient.post<Delivery>(
      `/deliveries/${id}/picked-up`
    );
    return response.data;
  },

  // Mark as delivered
  markDelivered: async (
    id: string,
    proofOfDelivery?: string
  ): Promise<Delivery> => {
    const response = await apiClient.post<Delivery>(
      `/deliveries/${id}/delivered`,
      { proofOfDelivery }
    );
    return response.data;
  },

  // Mark as failed
  markFailed: async (id: string, reason: string): Promise<Delivery> => {
    const response = await apiClient.post<Delivery>(
      `/deliveries/${id}/failed`,
      { reason }
    );
    return response.data;
  },

  // Get available drivers
  getAvailableDrivers: async (): Promise<DeliveryDriver[]> => {
    const response = await apiClient.get<DeliveryDriver[]>(
      "/deliveries/drivers/available"
    );
    return response.data;
  },

  // Get all drivers
  getAllDrivers: async (): Promise<DeliveryDriver[]> => {
    const response = await apiClient.get<DeliveryDriver[]>(
      "/deliveries/drivers"
    );
    return response.data;
  },

  // === Delivery Workflow API ===

  // Update order status in delivery workflow
  updateOrderStatus: async (
    orderId: string,
    data: OrderStatusUpdateInput
  ): Promise<{ success: boolean; order: DeliveryOrder; message: string }> => {
    const response = await apiClient.patch(
      `/delivery/orders/${orderId}/status`,
      data
    );
    return response.data;
  },

  // Bulk update order statuses
  bulkUpdateStatus: async (
    data: BulkStatusUpdateInput
  ): Promise<BulkStatusUpdateResponse> => {
    const response = await apiClient.patch<BulkStatusUpdateResponse>(
      "/delivery/orders/bulk-status",
      data
    );
    return response.data;
  },

  // Get orders by delivery status
  getOrdersByStatus: async (
    status: OrderDeliveryStatus,
    companyId?: string
  ): Promise<{ success: boolean; orders: DeliveryOrder[] }> => {
    const response = await apiClient.get(`/delivery/orders/status/${status}`, {
      params: companyId ? { companyId } : undefined,
    });
    return response.data;
  },

  // Assign driver to order
  assignDriver: async (
    orderId: string,
    driverId: string
  ): Promise<{ success: boolean; assignment: DriverAssignment; message: string }> => {
    const response = await apiClient.post(
      `/delivery/orders/${orderId}/assign-driver`,
      { driverId }
    );
    return response.data;
  },

  // Record cash collection for COD order
  recordCashCollection: async (
    orderId: string,
    data: CashCollectionInput
  ): Promise<{ success: boolean; collection: CashCollectionRecord; message: string }> => {
    const response = await apiClient.post(
      `/delivery/orders/${orderId}/cash-collection`,
      data
    );
    return response.data;
  },

  // Get delivery metrics
  getMetrics: async (
    period?: MetricsPeriod,
    companyId?: string
  ): Promise<{ success: boolean; metrics: DeliveryMetrics }> => {
    const response = await apiClient.get("/delivery/metrics", {
      params: { period, companyId },
    });
    return response.data;
  },

  // Track delivery (public endpoint)
  trackDelivery: async (
    orderId: string,
    phone?: string
  ): Promise<{ success: boolean; tracking: DeliveryTracking }> => {
    const response = await apiClient.get(`/delivery/track/${orderId}`, {
      params: phone ? { phone } : undefined,
    });
    return response.data;
  },

  // Get active deliveries dashboard
  getActiveDeliveries: async (
    companyId?: string
  ): Promise<{ success: boolean } & ActiveDeliveriesDashboard> => {
    const response = await apiClient.get("/delivery/active", {
      params: companyId ? { companyId } : undefined,
    });
    return response.data;
  },
};
