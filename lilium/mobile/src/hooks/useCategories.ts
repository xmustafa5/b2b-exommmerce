import { useQuery } from '@tanstack/react-query';
import { categoriesQueryKeys } from '../constants/queryKeys';
import { categoriesApi } from '../services/api';
import type { Category } from '../types';

/**
 * Hook to fetch all categories
 */
export function useCategories(filters?: { isActive?: boolean }) {
  return useQuery<Category[]>({
    queryKey: categoriesQueryKeys.list(filters),
    queryFn: () => categoriesApi.getAll(filters),
  });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(id: string) {
  return useQuery<Category>({
    queryKey: categoriesQueryKeys.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch only active categories
 */
export function useActiveCategories() {
  return useCategories({ isActive: true });
}
