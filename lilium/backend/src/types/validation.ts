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

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const zoneSchema = z.nativeEnum(Zone);

export const searchSchema = z.object({
  search: z.string().optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  businessName: z.string().optional(),
  phone: z.string().min(10, 'Phone must be at least 10 characters').optional(),
  zone: z.nativeEnum(Zone).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// ============================================
// Product Schemas
// ============================================

export const productQuerySchema = paginationSchema.extend({
  categoryId: z.string().optional(),
  companyId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'price', 'nameEn', 'nameAr', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  zones: z.string().optional(), // comma-separated zones
  isActive: z.enum(['true', 'false']).optional(),
  isFeatured: z.enum(['true', 'false']).optional(),
});

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  nameAr: z.string().min(1, 'Arabic name is required').max(200, 'Arabic name must be less than 200 characters'),
  nameEn: z.string().min(1, 'English name is required').max(200, 'English name must be less than 200 characters'),
  descriptionAr: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  descriptionEn: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  price: z.number().positive('Price must be positive').max(999999999, 'Price is too high'),
  compareAtPrice: z.number().positive().max(999999999).optional().nullable(),
  cost: z.number().positive().max(999999999).optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minOrderQty: z.number().int().positive('Minimum order quantity must be positive').default(1),
  unit: z.string().max(50).default('piece'),
  images: z.array(z.string().url('Invalid image URL')).max(10, 'Maximum 10 images allowed').default([]),
  categoryId: z.string().min(1, 'Category is required'),
  companyId: z.string().optional(),
  zones: z.array(z.nativeEnum(Zone)).min(1, 'At least one zone is required'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  quantity: z.number().int('Quantity must be an integer'),
  operation: z.enum(['add', 'subtract', 'set'], {
    errorMap: () => ({ message: 'Operation must be add, subtract, or set' }),
  }),
  notes: z.string().max(500).optional(),
});

export const bulkStockUpdateSchema = z.object({
  updates: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int(),
    operation: z.enum(['add', 'subtract', 'set']),
  })).min(1, 'At least one update is required').max(100, 'Maximum 100 updates at a time'),
});

export const bulkProductSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
  data: updateProductSchema.optional(),
});

// ============================================
// Category Schemas
// ============================================

export const categoryQuerySchema = paginationSchema.extend({
  parentId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const createCategorySchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required').max(100, 'Arabic name must be less than 100 characters'),
  nameEn: z.string().min(1, 'English name is required').max(100, 'English name must be less than 100 characters'),
  slug: z.string().max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  description: z.string().max(500).optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const reorderCategoriesSchema = z.array(z.object({
  id: z.string().min(1),
  displayOrder: z.number().int().min(0),
})).min(1, 'At least one category is required');

// ============================================
// Order Schemas
// ============================================

export const orderQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  zone: z.nativeEnum(Zone).optional(),
  companyId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(), // search by order number
});

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required').max(50, 'Maximum 50 items per order'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  promotionId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'online']).default('cash'),
  deliveryDate: z.coerce.date().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  comment: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancel reason is required').max(500),
});

// ============================================
// Address Schemas
// ============================================

export const createAddressSchema = z.object({
  name: z.string().min(1, 'Address name is required').max(100),
  street: z.string().min(1, 'Street is required').max(200),
  area: z.string().min(1, 'Area is required').max(100),
  building: z.string().max(50).optional(),
  floor: z.string().max(20).optional(),
  apartment: z.string().max(20).optional(),
  zone: z.nativeEnum(Zone),
  landmark: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

// ============================================
// Promotion Schemas
// ============================================

export const promotionQuerySchema = paginationSchema.extend({
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y', 'bundle']).optional(),
  zone: z.nativeEnum(Zone).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const createPromotionSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required').max(100),
  nameEn: z.string().min(1, 'English name is required').max(100),
  descriptionAr: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y', 'bundle']),
  value: z.number().positive('Value must be positive'),
  minPurchase: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  buyQuantity: z.number().int().positive().optional(),
  getQuantity: z.number().int().positive().optional(),
  bundleProductIds: z.array(z.string()).optional(), // For bundle: Products included in bundle
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  zones: z.array(z.nativeEnum(Zone)).optional().default([]), // Empty array means all zones
  isActive: z.boolean().default(true),
  usageLimit: z.number().int().positive().optional(),
  productIds: z.array(z.string()).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
).refine(
  (data) => data.type !== 'percentage' || (data.value > 0 && data.value <= 100),
  { message: 'Percentage discount must be between 0 and 100', path: ['value'] }
).refine(
  (data) => data.type !== 'buy_x_get_y' || (data.buyQuantity && data.getQuantity),
  { message: 'Buy X Get Y promotion requires buyQuantity and getQuantity', path: ['buyQuantity'] }
).refine(
  (data) => data.type !== 'bundle' || (data.bundleProductIds && data.bundleProductIds.length >= 2),
  { message: 'Bundle promotion requires at least 2 products', path: ['bundleProductIds'] }
);

export const updatePromotionSchema = createPromotionSchema.partial();

export const applyPromotionSchema = z.object({
  promotionId: z.string().optional(), // Optional specific promotion
  cartItems: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1, 'At least one item is required'),
});

// ============================================
// Cart Validation Schema (for Module 3.3)
// ============================================

export const validateCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
  })).min(1, 'Cart must have at least one item').max(100, 'Cart cannot exceed 100 items'),
  zone: z.nativeEnum(Zone).optional(),
  addressId: z.string().optional(),
  applyPromotions: z.boolean().default(true),
});

export type ValidateCartInput = z.infer<typeof validateCartSchema>;

// ============================================
// Company Schemas
// ============================================

export const companyQuerySchema = paginationSchema.extend({
  zone: z.nativeEnum(Zone).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const createCompanySchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required').max(100),
  nameEn: z.string().min(1, 'English name is required').max(100),
  description: z.string().max(500).optional(),
  logo: z.string().url('Invalid logo URL').optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().min(10).max(20).optional().nullable(),
  address: z.string().max(300).optional(),
  zones: z.array(z.nativeEnum(Zone)).min(1, 'At least one zone is required'),
  commission: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export const updateCompanySchema = createCompanySchema.partial();

export const updateCommissionSchema = z.object({
  commission: z.number().min(0, 'Commission cannot be negative').max(100, 'Commission cannot exceed 100%'),
});

// ============================================
// Admin Schemas
// ============================================

export const adminQuerySchema = paginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  zone: z.nativeEnum(Zone).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10).max(20).optional(),
  role: z.enum([UserRole.LOCATION_ADMIN, UserRole.COMPANY_ADMIN, UserRole.COMPANY_USER]),
  zones: z.array(z.nativeEnum(Zone)).min(1, 'At least one zone is required'),
  companyId: z.string().optional(),
});

export const updateAdminSchema = createAdminSchema.partial().omit({ password: true });

export const updateAdminZonesSchema = z.object({
  zones: z.array(z.nativeEnum(Zone)).min(1, 'At least one zone is required'),
});

export const updateAdminStatusSchema = z.object({
  isActive: z.boolean(),
});

// ============================================
// User Schemas
// ============================================

export const userQuerySchema = paginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  zone: z.nativeEnum(Zone).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  businessName: z.string().max(200).optional(),
});

// ============================================
// Cart Schemas
// ============================================

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
});

// ============================================
// Inventory Schemas
// ============================================

export const inventoryQuerySchema = paginationSchema.extend({
  companyId: z.string().optional(),
  categoryId: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  outOfStock: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const stockHistoryQuerySchema = paginationSchema.extend({
  productId: z.string().optional(),
  type: z.enum(['restock', 'sale', 'adjustment', 'return']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ============================================
// Notification Schemas
// ============================================

export const registerFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
});

export const sendNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(1, 'Body is required').max(500),
  data: z.record(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export const sendToUserSchema = sendNotificationSchema.extend({
  userId: z.string().min(1, 'User ID is required'),
});

export const sendToZoneSchema = sendNotificationSchema.extend({
  zone: z.nativeEnum(Zone),
});

// ============================================
// Analytics Schemas
// ============================================

export const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  zone: z.nativeEnum(Zone).optional(),
  companyId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// ============================================
// Export Schemas
// ============================================

export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  zone: z.nativeEnum(Zone).optional(),
  companyId: z.string().optional(),
});

// ============================================
// Payout & Settlement Schemas
// ============================================

export const payoutQuerySchema = paginationSchema.extend({
  companyId: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const createPayoutSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().max(500).optional(),
});

export const updatePayoutStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  notes: z.string().max(500).optional(),
});

export const settlementQuerySchema = paginationSchema.extend({
  companyId: z.string().optional(),
  status: z.enum(['pending', 'settled']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ============================================
// Delivery Route Schemas
// ============================================

export const deliveryRouteQuerySchema = paginationSchema.extend({
  zone: z.nativeEnum(Zone).optional(),
  date: z.coerce.date().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

export const createDeliveryRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required').max(100),
  zone: z.nativeEnum(Zone),
  date: z.coerce.date(),
  driverId: z.string().optional(),
  orderIds: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

export const updateDeliveryRouteSchema = createDeliveryRouteSchema.partial();

export const assignOrdersToRouteSchema = z.object({
  orderIds: z.array(z.string()).min(1, 'At least one order is required'),
});

// ============================================
// Type Exports
// ============================================

// Common
export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;

// Auth
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Product
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type BulkStockUpdateInput = z.infer<typeof bulkStockUpdateSchema>;

// Category
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Order
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

// Address
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

// Promotion
export type PromotionQueryInput = z.infer<typeof promotionQuerySchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type ApplyPromotionInput = z.infer<typeof applyPromotionSchema>;

// Company
export type CompanyQueryInput = z.infer<typeof companyQuerySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// Admin
export type AdminQueryInput = z.infer<typeof adminQuerySchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;

// User
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Cart
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// Inventory
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
export type StockHistoryQueryInput = z.infer<typeof stockHistoryQuerySchema>;

// Notification
export type RegisterFcmTokenInput = z.infer<typeof registerFcmTokenSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type SendToUserInput = z.infer<typeof sendToUserSchema>;
export type SendToZoneInput = z.infer<typeof sendToZoneSchema>;

// Analytics
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

// Export
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;

// Payout & Settlement
export type PayoutQueryInput = z.infer<typeof payoutQuerySchema>;
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
export type SettlementQueryInput = z.infer<typeof settlementQuerySchema>;

// Delivery
export type DeliveryRouteQueryInput = z.infer<typeof deliveryRouteQuerySchema>;
export type CreateDeliveryRouteInput = z.infer<typeof createDeliveryRouteSchema>;
export type UpdateDeliveryRouteInput = z.infer<typeof updateDeliveryRouteSchema>;
