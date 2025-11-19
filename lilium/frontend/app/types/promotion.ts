export type PromotionType = "percentage" | "fixed";
export type PromotionStatus = "active" | "upcoming" | "expired";

export interface Promotion {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  zones: string[];
  products: string[];
  categories: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionCreateInput {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  zones: string[];
  products: string[];
  categories: string[];
  isActive: boolean;
}

export interface PromotionUpdateInput {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type?: PromotionType;
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate?: Date;
  endDate?: Date;
  zones?: string[];
  products?: string[];
  categories?: string[];
  isActive?: boolean;
}

export interface PromotionFilters {
  status?: PromotionStatus;
  zone?: string;
  type?: PromotionType;
  search?: string;
}

export interface PromotionsResponse {
  promotions: Promotion[];
  total: number;
  page: number;
  limit: number;
}
