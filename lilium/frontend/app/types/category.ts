export interface Category {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  slug: string;
  image?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateInput {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
}

export interface CategoryUpdateInput {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
}

export interface CategoryReorderInput {
  categoryId: string;
  newOrder: number;
}
