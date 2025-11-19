import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersQueryKeys } from '@/app/constants/queryKeys';
import { ordersApi } from '@/app/actions/orders';
import type {
  OrderFilters,
  UpdateOrderStatusInput,
  CancelOrderInput,
} from '@/app/types/order';

/**
 * Hook to fetch orders list with filters
 */
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ordersQueryKeys.list(filters),
    queryFn: () => ordersApi.getAll(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ordersQueryKeys.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch order statistics
 */
export function useOrderStats(zone?: string) {
  return useQuery({
    queryKey: ordersQueryKeys.stats(zone),
    queryFn: () => ordersApi.getStats(zone),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrderStatusInput) =>
      ordersApi.updateStatus(orderId, input),
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(orderId),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.stats(),
      });

      toast.success('Order status updated successfully', {
        description: `Order ${data.orderNumber} is now ${data.status}`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to update order status', {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: CancelOrderInput }) =>
      ordersApi.cancel(id, input),
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.stats(),
      });

      toast.success('Order cancelled successfully', {
        description: `Order ${data.orderNumber} has been cancelled`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to cancel order', {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}

/**
 * Hook to delete an order (admin only)
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });

      toast.success('Order deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete order', {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}
