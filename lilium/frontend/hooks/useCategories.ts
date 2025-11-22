import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/actions/categories";
import { categoriesQueryKeys } from "@/constants/queryKeys";
import type {
  CategoryFilters,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryReorderItem,
} from "@/types/category";

// Get all categories (returns hierarchical tree)
export function useCategories(filters?: CategoryFilters) {
  return useQuery({
    queryKey: categoriesQueryKeys.list(filters),
    queryFn: () => categoriesApi.getAll(filters),
  });
}

// Get single category by ID
export function useCategory(id: string) {
  return useQuery({
    queryKey: categoriesQueryKeys.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
}

// Get category statistics
export function useCategoryStats() {
  return useQuery({
    queryKey: categoriesQueryKeys.stats(),
    queryFn: () => categoriesApi.getStats(),
  });
}

// Create new category
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

// Update category
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

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reassignToId }: { id: string; reassignToId?: string }) =>
      categoriesApi.delete(id, reassignToId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}

// Reorder categories
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categories: CategoryReorderItem[]) =>
      categoriesApi.reorder(categories),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
    },
  });
}
