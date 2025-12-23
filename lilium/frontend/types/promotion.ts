// Promotion types aligned with backend API

export type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';

export interface Promotion {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  type: PromotionType;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  zones: string[];
  usageLimit: number | null;
  usageCount: number;
  // Buy X Get Y specific
  buyQuantity: number | null;
  getQuantity: number | null;
  // Bundle specific
  bundlePrice: number | null;
  createdAt: string;
  updatedAt: string;
  // Included relation
  products?: Array<{
    productId: string;
    product: {
      id: string;
      nameEn: string;
      nameAr: string;
      sku: string;
      price: number;
      images?: string[];
    };
  }>;
}

export interface PromotionCreateInput {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  zones?: string[];
  productIds?: string[];
  // Buy X Get Y specific
  buyQuantity?: number;
  getQuantity?: number;
  // Bundle specific
  bundleProductIds?: string[];
  bundlePrice?: number;
}

export interface PromotionUpdateInput extends Partial<PromotionCreateInput> {}

export interface PromotionFilters {
  type?: PromotionType;
  isActive?: boolean;
  zone?: string;
  search?: string;
  includeInactive?: boolean;
}

export interface PromotionPreview {
  applicablePromotions: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    type: PromotionType;
    discount: number;
  }>;
  totalSavings: number;
}
