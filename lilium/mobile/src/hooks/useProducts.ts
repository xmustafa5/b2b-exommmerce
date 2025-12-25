import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productsQueryKeys } from '../constants/queryKeys';
import { productsApi } from '../services/api';
import type { Product, ProductsResponse } from '../types';

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  zones?: string[];
}

/**
 * Hook to fetch products list with filters
 */
export function useProducts(filters?: ProductFilters) {
  return useQuery<ProductsResponse>({
    queryKey: productsQueryKeys.list(filters),
    queryFn: () => productsApi.getProducts(filters),
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: productsQueryKeys.detail(id),
    queryFn: () => productsApi.getProductById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch featured products
 */
export function useFeaturedProducts(zones?: string[]) {
  return useQuery<Product[]>({
    queryKey: productsQueryKeys.featured(zones),
    queryFn: () => productsApi.getFeaturedProducts(zones),
  });
}

/**
 * Hook to prefetch a product (useful for optimistic UX)
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productsQueryKeys.detail(id),
      queryFn: () => productsApi.getProductById(id),
    });
  };
}
