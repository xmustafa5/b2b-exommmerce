export interface Product {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  sku: string;
  barcode: string | null;
  price: number;
  wholesalePrice: number | null;
  costPrice: number | null;
  stock: number;
  minStock: number;
  maxStock: number | null;
  unit: string;
  isActive: boolean;
  categoryId: string;
  vendorId: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
  vendor?: {
    id: string;
    name: string;
  };
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  productId: string;
}

export interface ProductCreateInput {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  sku: string;
  barcode?: string;
  price: number;
  wholesalePrice?: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  categoryId: string;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
