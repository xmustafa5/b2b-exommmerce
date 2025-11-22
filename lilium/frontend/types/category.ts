export interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  slug: string;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
  _count?: {
    products: number;
  };
}

export interface CategoryCreateInput {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  slug?: string;
  image?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface CategoryUpdateInput extends Partial<CategoryCreateInput> {
  isActive?: boolean;
}

export interface CategoryFilters {
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CategoriesResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
