import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/actions/products";
import { productsQueryKeys } from "@/constants/queryKeys";
import type {
  ProductFilters,
  ProductCreateInput,
  ProductUpdateInput,
} from "@/types/product";

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productsQueryKeys.list(filters),
    queryFn: () => productsApi.getVendorProducts(filters),
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
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
    },
  });
}
