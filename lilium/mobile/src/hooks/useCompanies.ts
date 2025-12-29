import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesQueryKeys } from '../constants/queryKeys';
import { companiesApi } from '../services/api';
import type { Company } from '../types';

/**
 * Hook to fetch all companies with optional filters
 */
export function useCompanies(filters?: {
  zone?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: companiesQueryKeys.list(filters),
    queryFn: () => companiesApi.getAll(filters),
  });
}

/**
 * Hook to fetch a single company by ID
 */
export function useCompany(id: string) {
  return useQuery({
    queryKey: companiesQueryKeys.detail(id),
    queryFn: () => companiesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch companies by zone
 */
export function useCompaniesByZone(zone: string) {
  return useQuery({
    queryKey: companiesQueryKeys.byZone(zone),
    queryFn: () => companiesApi.getByZone(zone),
    enabled: !!zone,
  });
}

/**
 * Hook to fetch products for a specific company
 */
export function useCompanyProducts(id: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: companiesQueryKeys.products(id, params),
    queryFn: () => companiesApi.getProducts(id, params),
    enabled: !!id,
  });
}

/**
 * Hook to prefetch a company (for faster navigation)
 */
export function usePrefetchCompany() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: companiesQueryKeys.detail(id),
      queryFn: () => companiesApi.getById(id),
    });
  };
}

/**
 * Hook to get active companies for home screen
 */
export function useActiveCompanies(zone?: string) {
  return useQuery({
    queryKey: companiesQueryKeys.list({ zone, isActive: true }),
    queryFn: () => companiesApi.getAll({ zone, isActive: true, limit: 20 }),
  });
}
