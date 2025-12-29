import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/actions/orders";
import { ordersQueryKeys } from "@/constants/queryKeys";
import type { OrderFilters, OrderUpdateInput } from "@/types/order";

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ordersQueryKeys.list(filters),
    queryFn: () => ordersApi.getVendorOrders(filters),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ordersQueryKeys.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ordersQueryKeys.stats(),
    queryFn: () => ordersApi.getStats(),
  });
}

export function useUpdateOrder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrderUpdateInput) => ordersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });
    },
  });
}

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.confirm(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ordersApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });
    },
  });
}

export function useProcessOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.updateStatus(id, "PROCESSING", "Order is being processed"),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });
    },
  });
}

export function useShipOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.markAsShipped(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });
    },
  });
}

export function useDeliverOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.markAsDelivered(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.all,
      });
    },
  });
}
