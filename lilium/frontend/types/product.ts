// Product types aligned with backend API

export type Zone = "KARKH" | "RUSAFA";

export interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  stock: number;
  minOrderQty: number;
  unit: string;
  images: string[];
  categoryId: string;
  companyId: string;
  zones: Zone[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    nameEn: string;
    nameAr: string;
  };
  company?: {
    id: string;
    nameEn: string;
    nameAr: string;
  };
}

export interface ProductCreateInput {
  sku: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  stock: number;
  minOrderQty?: number;
  unit?: string;
  images?: string[];
  categoryId: string;
  companyId: string;
  zones: Zone[];
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sortBy?: "createdAt" | "price" | "nameEn" | "nameAr" | "stock";
  sortOrder?: "asc" | "desc";
  zones?: string; // Comma-separated zones
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StockUpdateInput {
  quantity: number;
  operation: "add" | "subtract" | "set";
}

export interface BulkUpdateInput {
  ids: string[];
  data: Partial<ProductUpdateInput>;
}

export interface BulkDeleteInput {
  ids: string[];
}
