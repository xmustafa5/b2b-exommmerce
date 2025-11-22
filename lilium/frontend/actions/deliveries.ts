import { apiClient } from "./config";
import type {
  Delivery,
  DeliveryDriver,
  DeliveryAssignInput,
  DeliveryUpdateInput,
  DeliveryFilters,
  DeliveriesResponse,
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
};
