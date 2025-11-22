import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/actions/categories";
import { categoriesQueryKeys } from "@/constants/queryKeys";
import type {
  CategoryFilters,
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@/types/category";

export function useCategories(filters?: CategoryFilters) {
  return useQuery({
    queryKey: categoriesQueryKeys.list(filters),
    queryFn: () => categoriesApi.getAll(filters),
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: categoriesQueryKeys.tree(),
    queryFn: () => categoriesApi.getTree(),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoriesQueryKeys.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryCreateInput) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryUpdateInput) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}
