// Company types aligned with backend API

export type Zone = "KARKH" | "RUSAFA";

export interface Company {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  logo: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  zones: Zone[];
  isActive: boolean;
  commission: number;
  deliveryFees: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    users: number;
  };
  stats?: {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalCommission: number;
    totalVendors: number;
    activeVendors: number;
    averageRating: number;
    totalReviews: number;
  };
}

export interface CompanyCreateInput {
  name: string; // Will be used for nameEn
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  logo?: string;
  email: string;
  phone?: string;
  address?: string;
  zones: Zone[];
  deliveryFees?: Record<string, number>;
  commissionRate?: number;
  minOrderAmount?: number;
  maxDeliveryTime?: number;
}

export interface CompanyUpdateInput {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  zones?: Zone[];
  deliveryFees?: Record<string, number>;
  commissionRate?: number;
  minOrderAmount?: number;
  maxDeliveryTime?: number;
}

export interface CompanyFilters {
  zone?: Zone;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CompaniesResponse {
  success: boolean;
  companies: Company[];
  total: number;
}

export interface CompanyResponse {
  success: boolean;
  company: Company;
  message?: string;
}

export interface CompanyStatsResponse {
  success: boolean;
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalCommission: number;
    totalVendors: number;
    activeVendors: number;
    averageRating: number;
    totalReviews: number;
  };
}

export interface CompanyVendor {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    products: number;
  };
}

export interface CompanyVendorsResponse {
  success: boolean;
  vendors: CompanyVendor[];
  total: number;
}

export interface CompanyProductsResponse {
  success: boolean;
  products: any[]; // Use Product type from @/types/product when available
  total: number;
}

export interface CompanyPayoutsResponse {
  success: boolean;
  companyId: string;
  period: {
    start: string;
    end: string;
  };
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalPayout: number;
  commissionRate: number;
}
