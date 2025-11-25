import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/actions/products";
import { productsQueryKeys } from "@/constants/queryKeys";
import type {
  ProductFilters,
  ProductCreateInput,
  ProductUpdateInput,
  StockUpdateInput,
  BulkUpdateInput,
  BulkDeleteInput,
} from "@/types/product";

// Get all products with pagination
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productsQueryKeys.list(filters),
    queryFn: () => productsApi.getAll(filters),
  });
}

// Get single product by ID
export function useProduct(id: string) {
  return useQuery({
    queryKey: productsQueryKeys.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

// Get featured products
export function useFeaturedProducts(zones?: string) {
  return useQuery({
    queryKey: productsQueryKeys.featured(zones),
    queryFn: () => productsApi.getFeatured(zones),
  });
}

// Get products by category
export function useProductsByCategory(categoryId: string, zones?: string) {
  return useQuery({
    queryKey: productsQueryKeys.byCategory(categoryId, zones),
    queryFn: () => productsApi.getByCategory(categoryId, zones),
    enabled: !!categoryId,
  });
}

// Create new product
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

// Update product
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

// Update product stock
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StockUpdateInput }) =>
      productsApi.updateStock(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
    },
  });
}

// Delete product
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

// Bulk update products
export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateInput) => productsApi.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
    },
  });
}

// Bulk delete products
export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkDeleteInput) => productsApi.bulkDelete(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
    },
  });
}
