import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deliveriesQueryKeys, driversQueryKeys, ordersQueryKeys } from "@/constants/queryKeys";
import { deliveriesApi } from "@/actions/deliveries";
import type {
  DeliveryFilters,
  OrderStatusUpdateInput,
  BulkStatusUpdateInput,
  CashCollectionInput,
  MetricsPeriod,
  OrderDeliveryStatus,
  DeliveryUpdateInput,
} from "@/types/delivery";

// Get all deliveries (paginated)
export function useDeliveries(filters?: DeliveryFilters) {
  return useQuery({
    queryKey: deliveriesQueryKeys.list(filters),
    queryFn: () => deliveriesApi.getAll(filters),
  });
}

// Get single delivery by ID
export function useDelivery(id: string) {
  return useQuery({
    queryKey: deliveriesQueryKeys.detail(id),
    queryFn: () => deliveriesApi.getById(id),
    enabled: !!id,
  });
}

// Get available drivers
export function useAvailableDrivers() {
  return useQuery({
    queryKey: driversQueryKeys.available(),
    queryFn: deliveriesApi.getAvailableDrivers,
  });
}

// Get all drivers
export function useAllDrivers() {
  return useQuery({
    queryKey: driversQueryKeys.all,
    queryFn: deliveriesApi.getAllDrivers,
  });
}

// Get orders by delivery status
export function useOrdersByStatus(
  status: OrderDeliveryStatus,
  companyId?: string
) {
  return useQuery({
    queryKey: deliveriesQueryKeys.byStatus(status, companyId),
    queryFn: () => deliveriesApi.getOrdersByStatus(status, companyId),
  });
}

// Get active deliveries dashboard
export function useActiveDeliveries(companyId?: string) {
  return useQuery({
    queryKey: deliveriesQueryKeys.active(companyId),
    queryFn: () => deliveriesApi.getActiveDeliveries(companyId),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });
}

// Get delivery metrics
export function useDeliveryMetrics(
  period?: MetricsPeriod,
  companyId?: string
) {
  return useQuery({
    queryKey: deliveriesQueryKeys.metrics(period, companyId),
    queryFn: () => deliveriesApi.getMetrics(period, companyId),
  });
}

// Track delivery (public)
export function useDeliveryTracking(orderId: string, phone?: string) {
  return useQuery({
    queryKey: deliveriesQueryKeys.tracking(orderId),
    queryFn: () => deliveriesApi.trackDelivery(orderId, phone),
    enabled: !!orderId,
    refetchInterval: 60000, // Refresh every minute for tracking
  });
}

// Update order status mutation
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: OrderStatusUpdateInput;
    }) => deliveriesApi.updateOrderStatus(orderId, data),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
    },
  });
}

// Bulk update order statuses mutation
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkStatusUpdateInput) =>
      deliveriesApi.bulkUpdateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
    },
  });
}

// Assign driver mutation
export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      driverId,
    }: {
      orderId: string;
      driverId: string;
    }) => deliveriesApi.assignDriver(orderId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: driversQueryKeys.available() });
    },
  });
}

// Record cash collection mutation
export function useRecordCashCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: CashCollectionInput;
    }) => deliveriesApi.recordCashCollection(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
    },
  });
}

// Assign delivery to driver (existing endpoint)
export function useAssignDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryId,
      data,
    }: {
      deliveryId: string;
      data: { driverId: string; scheduledDate?: string; notes?: string };
    }) => deliveriesApi.assign(deliveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: driversQueryKeys.available() });
    },
  });
}

// Update delivery status (existing endpoint)
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryId,
      data,
    }: {
      deliveryId: string;
      data: DeliveryUpdateInput;
    }) => deliveriesApi.updateStatus(deliveryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
    },
  });
}

// Mark delivery as picked up
export function useMarkPickedUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => deliveriesApi.markPickedUp(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
    },
  });
}

// Mark delivery as delivered
export function useMarkDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryId,
      proofOfDelivery,
    }: {
      deliveryId: string;
      proofOfDelivery?: string;
    }) => deliveriesApi.markDelivered(deliveryId, proofOfDelivery),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
    },
  });
}

// Mark delivery as failed
export function useMarkFailed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deliveryId,
      reason,
    }: {
      deliveryId: string;
      reason: string;
    }) => deliveriesApi.markFailed(deliveryId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
    },
  });
}
