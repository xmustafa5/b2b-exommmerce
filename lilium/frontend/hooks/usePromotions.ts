import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promotionsApi, ApplyToCartRequest } from "@/actions/promotions";
import { promotionsQueryKeys } from "@/constants/queryKeys";
import type {
  PromotionFilters,
  PromotionCreateInput,
  PromotionUpdateInput,
} from "@/types/promotion";

// Get all promotions with optional filters
export function usePromotions(filters?: PromotionFilters) {
  return useQuery({
    queryKey: promotionsQueryKeys.list(filters),
    queryFn: () => promotionsApi.getAll(filters),
  });
}

// Get active promotions for a specific zone
export function useActivePromotions(zone: string) {
  return useQuery({
    queryKey: promotionsQueryKeys.active(),
    queryFn: () => promotionsApi.getActiveByZone(zone),
    enabled: !!zone,
  });
}

// Get single promotion by ID
export function usePromotion(id: string) {
  return useQuery({
    queryKey: promotionsQueryKeys.detail(id),
    queryFn: () => promotionsApi.getById(id),
    enabled: !!id,
  });
}

// Create new promotion
export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromotionCreateInput) => promotionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
    },
  });
}

// Update promotion
export function useUpdatePromotion(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromotionUpdateInput) => promotionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
    },
  });
}

// Toggle promotion active status
export function useTogglePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promotionsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
    },
  });
}

// Delete promotion
export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promotionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
    },
  });
}

// Apply promotion to cart
export function useApplyPromotionToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApplyToCartRequest) => promotionsApi.applyToCart(data),
    onSuccess: () => {
      // Invalidate cart queries when promotion is applied
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },
  });
}
