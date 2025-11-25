import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesApi } from "@/actions/companies";
import { companiesQueryKeys } from "@/constants/queryKeys";
import type {
  CompanyFilters,
  CompanyCreateInput,
  CompanyUpdateInput,
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

// Toggle company active status
export function useToggleCompanyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companiesApi.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: companiesQueryKeys.all,
      });
    },
  });
}

// Update credit limit
export function useUpdateCreditLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, creditLimit }: { id: string; creditLimit: number }) =>
      companiesApi.updateCreditLimit(id, creditLimit),
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
