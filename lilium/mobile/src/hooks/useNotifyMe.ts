import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifyMeQueryKeys } from '../constants/queryKeys';
import { notifyMeApi } from '../services/api';
import type { NotifyMeSubscription } from '../types';

/**
 * Hook to fetch all user's notify-me subscriptions
 */
export function useNotifyMeSubscriptions() {
  return useQuery<NotifyMeSubscription[]>({
    queryKey: notifyMeQueryKeys.subscriptions(),
    queryFn: () => notifyMeApi.getMySubscriptions(),
  });
}

/**
 * Hook to check if user is subscribed to a product's back-in-stock notifications
 */
export function useCheckNotifyMe(productId: string) {
  return useQuery<{ subscribed: boolean }>({
    queryKey: notifyMeQueryKeys.check(productId),
    queryFn: () => notifyMeApi.checkSubscription(productId),
    enabled: !!productId,
  });
}

/**
 * Hook to subscribe to back-in-stock notifications for a product
 */
export function useSubscribeNotifyMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => notifyMeApi.subscribe(productId),
    onSuccess: (_, productId) => {
      // Invalidate subscriptions list
      queryClient.invalidateQueries({
        queryKey: notifyMeQueryKeys.all,
      });
      // Update the check query for this product
      queryClient.setQueryData(notifyMeQueryKeys.check(productId), { subscribed: true });
    },
  });
}

/**
 * Hook to unsubscribe from back-in-stock notifications for a product
 */
export function useUnsubscribeNotifyMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => notifyMeApi.unsubscribe(productId),
    onSuccess: (_, productId) => {
      // Invalidate subscriptions list
      queryClient.invalidateQueries({
        queryKey: notifyMeQueryKeys.all,
      });
      // Update the check query for this product
      queryClient.setQueryData(notifyMeQueryKeys.check(productId), { subscribed: false });
    },
  });
}

/**
 * Hook to toggle notify-me subscription status
 */
export function useToggleNotifyMe() {
  const subscribe = useSubscribeNotifyMe();
  const unsubscribe = useUnsubscribeNotifyMe();

  const toggle = async (productId: string, isSubscribed: boolean) => {
    if (isSubscribed) {
      await unsubscribe.mutateAsync(productId);
    } else {
      await subscribe.mutateAsync(productId);
    }
  };

  return {
    toggle,
    isLoading: subscribe.isPending || unsubscribe.isPending,
    isError: subscribe.isError || unsubscribe.isError,
    error: subscribe.error || unsubscribe.error,
  };
}
