import { apiClient } from "./config";
import type {
  Company,
  CompanyCreateInput,
  CompanyUpdateInput,
  CompanyFilters,
  CompaniesResponse,
  CompanyResponse,
  CompanyStatsResponse,
  CompanyVendorsResponse,
  CompanyProductsResponse,
  CompanyPayoutsResponse,
  Zone,
} from "@/types/company";

export const companiesApi = {
  // Get all companies (paginated) - Dashboard
  getAll: async (filters?: CompanyFilters): Promise<CompaniesResponse> => {
    const response = await apiClient.get<CompaniesResponse>("/companies", {
      params: filters,
    });
    return response.data;
  },

  // Get single company by ID - Dashboard
  getById: async (id: string): Promise<Company> => {
    const response = await apiClient.get<CompanyResponse>(`/companies/${id}`);
    return response.data.company;
  },

  // Create new company - Dashboard
  create: async (data: CompanyCreateInput): Promise<Company> => {
    const response = await apiClient.post<CompanyResponse>("/companies", data);
    return response.data.company;
  },

  // Update company - Dashboard
  update: async (id: string, data: CompanyUpdateInput): Promise<Company> => {
    const response = await apiClient.put<CompanyResponse>(
      `/companies/${id}`,
      data
    );
    return response.data.company;
  },

  // Get company statistics - Dashboard
  getStats: async (id: string): Promise<CompanyStatsResponse> => {
    const response = await apiClient.get<CompanyStatsResponse>(
      `/companies/${id}/stats`
    );
    return response.data;
  },

  // Toggle company active status - Dashboard
  toggleStatus: async (id: string, isActive: boolean): Promise<Company> => {
    const response = await apiClient.patch<CompanyResponse>(
      `/companies/${id}/status`,
      { isActive }
    );
    return response.data.company;
  },

  // Update delivery fees - Dashboard
  updateDeliveryFees: async (
    id: string,
    deliveryFees: Record<string, number>
  ): Promise<Company> => {
    const response = await apiClient.patch<CompanyResponse>(
      `/companies/${id}/delivery-fees`,
      { deliveryFees }
    );
    return response.data.company;
  },

  // Update commission rate - Dashboard
  updateCommission: async (
    id: string,
    commissionRate: number
  ): Promise<Company> => {
    const response = await apiClient.patch<CompanyResponse>(
      `/companies/${id}/commission`,
      { commissionRate }
    );
    return response.data.company;
  },

  // Get company vendors - Dashboard
  getVendors: async (id: string): Promise<CompanyVendorsResponse> => {
    const response = await apiClient.get<CompanyVendorsResponse>(
      `/companies/${id}/vendors`
    );
    return response.data;
  },

  // Get company products - Dashboard
  getProducts: async (id: string): Promise<CompanyProductsResponse> => {
    const response = await apiClient.get<CompanyProductsResponse>(
      `/companies/${id}/products`
    );
    return response.data;
  },

  // Get companies by zone - Dashboard
  getByZone: async (zone: Zone): Promise<Company[]> => {
    const response = await apiClient.get<{ success: boolean; companies: Company[] }>(
      `/companies/zone/${zone}`
    );
    return response.data.companies;
  },

  // Calculate company payouts - Dashboard
  getPayouts: async (
    id: string,
    startDate: string,
    endDate: string
  ): Promise<CompanyPayoutsResponse> => {
    const response = await apiClient.get<CompanyPayoutsResponse>(
      `/companies/${id}/payouts`,
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  },

  // Delete company (if endpoint exists) - Dashboard
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },
};
