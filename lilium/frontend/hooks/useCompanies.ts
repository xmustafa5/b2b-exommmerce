import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesApi } from "@/actions/companies";
import { companiesQueryKeys } from "@/constants/queryKeys";
import type {
  CompanyFilters,
  CompanyCreateInput,
  CompanyUpdateInput,
  Zone,
} from "@/types/company";

// Get all companies with pagination
export function useCompanies(filters?: CompanyFilters) {
  return useQuery({
    queryKey: companiesQueryKeys.list(filters),
    queryFn: () => companiesApi.getAll(filters),
  });
}

// Get single company by ID
export function useCompany(id: string) {
  return useQuery({
    queryKey: companiesQueryKeys.detail(id),
    queryFn: () => companiesApi.getById(id),
    enabled: !!id,
  });
}

// Create new company
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyCreateInput) => companiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.all,
      });
    },
  });
}

// Update company
export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyUpdateInput) => companiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.all,
      });
    },
  });
}

// Delete company
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.all,
      });
    },
  });
}

// Get company statistics
export function useCompanyStats(id: string) {
  return useQuery({
    queryKey: companiesQueryKeys.stats(id),
    queryFn: () => companiesApi.getStats(id),
    enabled: !!id,
  });
}

// Get company vendors
export function useCompanyVendors(id: string) {
  return useQuery({
    queryKey: companiesQueryKeys.vendors(id),
    queryFn: () => companiesApi.getVendors(id),
    enabled: !!id,
  });
}

// Toggle company active status
export function useToggleCompanyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      companiesApi.toggleStatus(id, isActive),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.all,
      });
    },
  });
}

// Update delivery fees
export function useUpdateDeliveryFees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      deliveryFees,
    }: {
      id: string;
      deliveryFees: Record<string, number>;
    }) => companiesApi.updateDeliveryFees(id, deliveryFees),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.all,
      });
    },
  });
}

// Update commission rate
export function useUpdateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, commissionRate }: { id: string; commissionRate: number }) =>
      companiesApi.updateCommission(id, commissionRate),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.all,
      });
    },
  });
}

// Get company products
export function useCompanyProducts(id: string) {
  return useQuery({
    queryKey: companiesQueryKeys.products(id),
    queryFn: () => companiesApi.getProducts(id),
    enabled: !!id,
  });
}

// Get companies by zone
export function useCompaniesByZone(zone: Zone) {
  return useQuery({
    queryKey: companiesQueryKeys.byZone(zone),
    queryFn: () => companiesApi.getByZone(zone),
    enabled: !!zone,
  });
}

// Get company payouts
export function useCompanyPayouts(
  id: string,
  startDate: string,
  endDate: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: companiesQueryKeys.payouts(id, startDate, endDate),
    queryFn: () => companiesApi.getPayouts(id, startDate, endDate),
    enabled: !!id && !!startDate && !!endDate && enabled,
  });
}
