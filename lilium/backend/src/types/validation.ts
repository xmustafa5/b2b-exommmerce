import { z } from 'zod';
import { Zone, OrderStatus, UserRole } from '@prisma/client';

// ============================================
// Common Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// ============================================
// Product Schemas
// ============================================

export const productQuerySchema = paginationSchema.extend({
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'price', 'nameEn', 'nameAr', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  zones: z.string().optional(), // comma-separated zones
});

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  minOrderQty: z.number().int().positive().default(1),
  unit: z.string().default('piece'),
  images: z.array(z.string().url()).default([]),
  categoryId: z.string().min(1, 'Category is required'),
  zones: z.array(z.nativeEnum(Zone)).min(1, 'At least one zone is required'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  quantity: z.number().int(),
  operation: z.enum(['add', 'subtract', 'set']),
});

export const bulkProductSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  data: updateProductSchema.optional(),
});

// ============================================
// Category Schemas
// ============================================

export const createCategorySchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const reorderCategoriesSchema = z.array(z.object({
  id: z.string(),
  sortOrder: z.number().int(),
}));

// ============================================
// Order Schemas
// ============================================

export const orderQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  zone: z.nativeEnum(Zone).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  promotionId: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
});

// ============================================
// Promotion Schemas
// ============================================

export const createPromotionSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y', 'bundle']),
  value: z.number().positive('Value must be positive'),
  minPurchase: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  buyQuantity: z.number().int().positive().optional(),
  getQuantity: z.number().int().positive().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  zones: z.array(z.nativeEnum(Zone)).min(1, 'At least one zone is required'),
  isActive: z.boolean().default(true),
  usageLimit: z.number().int().positive().optional(),
  productIds: z.array(z.string()).optional(),
});

export const updatePromotionSchema = createPromotionSchema.partial();

export const applyPromotionSchema = z.object({
  cartItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1),
});

// ============================================
// User Schemas
// ============================================

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  businessName: z.string().optional(),
});

// ============================================
// Type Exports
// ============================================

export type PaginationInput = z.infer<typeof paginationSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type ApplyPromotionInput = z.infer<typeof applyPromotionSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
