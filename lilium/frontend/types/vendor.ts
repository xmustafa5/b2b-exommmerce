export interface Vendor {
  id: string;
  name: string;
  nameAr: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  logo: string | null;
  isActive: boolean;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    orders: number;
  };
}

export interface VendorCreateInput {
  name: string;
  nameAr?: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  commissionRate?: number;
}

export interface VendorUpdateInput extends Partial<VendorCreateInput> {
  isActive?: boolean;
}

export interface VendorFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface VendorsResponse {
  data: Vendor[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
