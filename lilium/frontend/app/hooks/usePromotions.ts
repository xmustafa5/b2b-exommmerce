import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promotionsQueryKeys } from "@/app/constants/queryKeys";
import { promotionsApi } from "@/app/actions/promotions";
import type {
  PromotionCreateInput,
  PromotionUpdateInput,
  PromotionFilters,
} from "@/app/types/promotion";
import { toast } from "sonner";

// Fetch list of promotions with filters
export function usePromotions(filters?: PromotionFilters) {
  return useQuery({
    queryKey: promotionsQueryKeys.list(filters),
    queryFn: () => promotionsApi.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single promotion detail
export function usePromotion(id: string) {
  return useQuery({
    queryKey: promotionsQueryKeys.detail(id),
    queryFn: () => promotionsApi.getById(id),
    enabled: !!id,
  });
}

// Fetch active promotions
export function useActivePromotions(zone?: string) {
  return useQuery({
    queryKey: promotionsQueryKeys.active(zone),
    queryFn: () => promotionsApi.getActive(zone),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Create promotion mutation
export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromotionCreateInput) => promotionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
      toast.success("Promotion created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create promotion"
      );
    },
  });
}

// Update promotion mutation
export function useUpdatePromotion(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromotionUpdateInput) =>
      promotionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
      toast.success("Promotion updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update promotion"
      );
    },
  });
}

// Delete promotion mutation
export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promotionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
      toast.success("Promotion deleted successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete promotion"
      );
    },
  });
}

// Toggle promotion active status mutation
export function useTogglePromotionActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promotionsApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionsQueryKeys.all,
      });
      toast.success("Promotion status updated");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update promotion status"
      );
    },
  });
}
