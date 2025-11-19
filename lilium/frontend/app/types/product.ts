export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    nameAr: string;
  };
  price: number;
  stock: number;
  minOrderQty: number;
  images: string[];
  zones: string[];
  isActive: boolean;
  isFeatured: boolean;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateInput {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  categoryId: string;
  price: number;
  stock: number;
  minOrderQty: number;
  images: string[];
  zones: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ProductUpdateInput {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  categoryId?: string;
  price?: number;
  stock?: number;
  minOrderQty?: number;
  images?: string[];
  zones?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  zones?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
