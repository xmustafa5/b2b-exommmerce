import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsQueryKeys } from "@/app/constants/queryKeys";
import { productsApi } from "@/app/actions/products";
import type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductFilters,
} from "@/app/types/product";
import { toast } from "sonner";

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productsQueryKeys.list(filters),
    queryFn: () => productsApi.getAll(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productsQueryKeys.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductCreateInput) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
      toast.success("Product created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductUpdateInput) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
      toast.success("Product updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update product");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
      toast.success("Product deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product");
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productsApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
      toast.success("Products deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete products");
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
      toast.success("Product status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });
}

export function useToggleProductFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.toggleFeatured(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
      toast.success("Product featured status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });
}
