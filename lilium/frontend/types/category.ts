// Category types aligned with backend API

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  parent?: Category | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}

export interface CategoryCreateInput {
  nameEn: string;
  nameAr: string;
  description?: string;
  image?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryUpdateInput extends Partial<CategoryCreateInput> {}

export interface CategoryFilters {
  includeInactive?: boolean;
}

export interface CategoryStats {
  id: string;
  nameEn: string;
  nameAr: string;
  _count: {
    products: number;
  };
}

export interface CategoryReorderItem {
  id: string;
  displayOrder: number;
}
