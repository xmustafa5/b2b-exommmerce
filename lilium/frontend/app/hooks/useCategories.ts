import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesQueryKeys } from "@/app/constants/queryKeys";
import { categoriesApi } from "@/app/actions/categories";
import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryReorderInput,
} from "@/app/types/category";
import { toast } from "sonner";

export function useCategories(filters?: { isActive?: boolean }) {
  return useQuery({
    queryKey: categoriesQueryKeys.list(filters),
    queryFn: () => categoriesApi.getAll(filters),
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
      toast.success("Category created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create category");
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
      toast.success("Category updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update category");
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
      toast.success("Category deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete category");
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryReorderInput[]) => categoriesApi.reorder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
      toast.success("Categories reordered successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reorder categories");
    },
  });
}

export function useToggleCategoryActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoriesQueryKeys.all,
      });
      toast.success("Category status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });
}
