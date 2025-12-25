import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersQueryKeys } from '../constants/queryKeys';
import { ordersApi } from '../services/api';
import type { Order, OrdersResponse, CreateOrderInput } from '../types';

interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
}

/**
 * Hook to fetch orders list with filters
 */
export function useOrders(filters?: OrderFilters) {
  return useQuery<OrdersResponse>({
    queryKey: ordersQueryKeys.list(filters),
    queryFn: () => ordersApi.getOrders(filters),
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ordersQueryKeys.detail(id),
    queryFn: () => ordersApi.getOrderById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, CreateOrderInput>({
    mutationFn: (data) => ordersApi.createOrder(data),
    onSuccess: () => {
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to prefetch an order (useful for optimistic UX)
 */
export function usePrefetchOrder() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ordersQueryKeys.detail(id),
      queryFn: () => ordersApi.getOrderById(id),
    });
  };
}
