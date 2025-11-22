export interface Company {
  id: string;
  name: string;
  nameAr: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  logo: string | null;
  isActive: boolean;
  creditLimit: number;
  currentCredit: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    shops: number;
    users: number;
  };
}

export interface CompanyCreateInput {
  name: string;
  nameAr?: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  creditLimit?: number;
}

export interface CompanyUpdateInput extends Partial<CompanyCreateInput> {
  isActive?: boolean;
}

export interface CompanyFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CompaniesResponse {
  data: Company[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
