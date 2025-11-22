import { apiClient } from "./config";
import type {
  Company,
  CompanyCreateInput,
  CompanyUpdateInput,
  CompanyFilters,
  CompaniesResponse,
} from "@/types/company";

export const companiesApi = {
  // Get all companies (paginated)
  getAll: async (filters?: CompanyFilters): Promise<CompaniesResponse> => {
    const response = await apiClient.get<CompaniesResponse>("/companies", {
      params: filters,
    });
    return response.data;
  },

  // Get single company by ID
  getById: async (id: string): Promise<Company> => {
    const response = await apiClient.get<Company>(`/companies/${id}`);
    return response.data;
  },

  // Create new company
  create: async (data: CompanyCreateInput): Promise<Company> => {
    const response = await apiClient.post<Company>("/companies", data);
    return response.data;
  },

  // Update company
  update: async (id: string, data: CompanyUpdateInput): Promise<Company> => {
    const response = await apiClient.put<Company>(`/companies/${id}`, data);
    return response.data;
  },

  // Delete company
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },

  // Toggle company active status
  toggleActive: async (id: string): Promise<Company> => {
    const response = await apiClient.patch<Company>(
      `/companies/${id}/toggle`
    );
    return response.data;
  },

  // Update credit limit
  updateCreditLimit: async (
    id: string,
    creditLimit: number
  ): Promise<Company> => {
    const response = await apiClient.patch<Company>(
      `/companies/${id}/credit-limit`,
      { creditLimit }
    );
    return response.data;
  },
};
