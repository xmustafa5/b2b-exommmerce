// Promotion types aligned with backend API

export type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: PromotionType;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  zones: string[];
  categoryIds: string[];
  productIds: string[];
  // Buy X Get Y specific
  buyQuantity: number | null;
  getQuantity: number | null;
  // Bundle specific
  bundleProducts: string[];
  bundlePrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionCreateInput {
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  usageLimit?: number;
  zones?: string[];
  categoryIds?: string[];
  productIds?: string[];
  // Buy X Get Y specific
  buyQuantity?: number;
  getQuantity?: number;
  // Bundle specific
  bundleProducts?: string[];
  bundlePrice?: number;
}

export interface PromotionUpdateInput extends Partial<PromotionCreateInput> {}

export interface PromotionFilters {
  type?: PromotionType;
  isActive?: boolean;
  zone?: string;
  search?: string;
}

export interface PromotionPreview {
  applicablePromotions: Array<{
    id: string;
    name: string;
    type: PromotionType;
    discount: number;
  }>;
  totalSavings: number;
}
