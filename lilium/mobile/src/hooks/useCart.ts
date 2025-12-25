import { useQuery, useMutation } from '@tanstack/react-query';
import { cartQueryKeys, promotionsQueryKeys } from '../constants/queryKeys';
import { cartApi, promotionsApi } from '../services/api';
import type { CartValidationResult, QuickStockCheck, Promotion } from '../types';

interface CartItem {
  productId: string;
  quantity: number;
}

/**
 * Hook to validate cart items before checkout
 */
export function useValidateCheckout() {
  return useMutation<
    CartValidationResult,
    Error,
    { items: CartItem[]; addressId?: string }
  >({
    mutationFn: ({ items, addressId }) => cartApi.validateCheckout(items, addressId),
  });
}

/**
 * Hook to quickly check stock availability for cart items
 */
export function useQuickStockCheck() {
  return useMutation<QuickStockCheck, Error, CartItem[]>({
    mutationFn: (items) => cartApi.quickStockCheck(items),
  });
}

/**
 * Hook to fetch active promotions
 */
export function useActivePromotions() {
  return useQuery<Promotion[]>({
    queryKey: promotionsQueryKeys.active(),
    queryFn: () => promotionsApi.getActive(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to get promotion by ID
 */
export function usePromotion(id: string) {
  return useQuery<Promotion>({
    queryKey: promotionsQueryKeys.detail(id),
    queryFn: () => promotionsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to preview applicable promotions for cart items
 */
export function usePreviewPromotions() {
  return useMutation<
    { applicablePromotions: Promotion[]; totalSavings: number },
    Error,
    CartItem[]
  >({
    mutationFn: (items) => promotionsApi.preview(items),
  });
}
