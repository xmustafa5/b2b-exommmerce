"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.applyPromotionSchema = exports.updatePromotionSchema = exports.createPromotionSchema = exports.updateOrderStatusSchema = exports.createOrderSchema = exports.orderQuerySchema = exports.reorderCategoriesSchema = exports.updateCategorySchema = exports.createCategorySchema = exports.bulkProductSchema = exports.updateStockSchema = exports.updateProductSchema = exports.createProductSchema = exports.productQuerySchema = exports.idParamSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// ============================================
// Common Schemas
// ============================================
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'ID is required'),
});
// ============================================
// Product Schemas
// ============================================
exports.productQuerySchema = exports.paginationSchema.extend({
    categoryId: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().positive().optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    inStock: zod_1.z.enum(['true', 'false']).optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['createdAt', 'price', 'nameEn', 'nameAr', 'stock']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    zones: zod_1.z.string().optional(), // comma-separated zones
});
exports.createProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1, 'SKU is required'),
    nameAr: zod_1.z.string().min(1, 'Arabic name is required'),
    nameEn: zod_1.z.string().min(1, 'English name is required'),
    descriptionAr: zod_1.z.string().optional(),
    descriptionEn: zod_1.z.string().optional(),
    price: zod_1.z.number().positive('Price must be positive'),
    compareAtPrice: zod_1.z.number().positive().optional(),
    cost: zod_1.z.number().positive().optional(),
    stock: zod_1.z.number().int().min(0).default(0),
    minOrderQty: zod_1.z.number().int().positive().default(1),
    unit: zod_1.z.string().default('piece'),
    images: zod_1.z.array(zod_1.z.string().url()).default([]),
    categoryId: zod_1.z.string().min(1, 'Category is required'),
    zones: zod_1.z.array(zod_1.z.nativeEnum(client_1.Zone)).min(1, 'At least one zone is required'),
    isActive: zod_1.z.boolean().default(true),
    isFeatured: zod_1.z.boolean().default(false),
    sortOrder: zod_1.z.number().int().default(0),
});
exports.updateProductSchema = exports.createProductSchema.partial();
exports.updateStockSchema = zod_1.z.object({
    quantity: zod_1.z.number().int(),
    operation: zod_1.z.enum(['add', 'subtract', 'set']),
});
exports.bulkProductSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string()).min(1, 'At least one ID is required'),
    data: exports.updateProductSchema.optional(),
});
// ============================================
// Category Schemas
// ============================================
exports.createCategorySchema = zod_1.z.object({
    nameAr: zod_1.z.string().min(1, 'Arabic name is required'),
    nameEn: zod_1.z.string().min(1, 'English name is required'),
    slug: zod_1.z.string().min(1, 'Slug is required'),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().url().optional(),
    parentId: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
    sortOrder: zod_1.z.number().int().default(0),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
exports.reorderCategoriesSchema = zod_1.z.array(zod_1.z.object({
    id: zod_1.z.string(),
    sortOrder: zod_1.z.number().int(),
}));
// ============================================
// Order Schemas
// ============================================
exports.orderQuerySchema = exports.paginationSchema.extend({
    status: zod_1.z.nativeEnum(client_1.OrderStatus).optional(),
    zone: zod_1.z.nativeEnum(client_1.Zone).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.createOrderSchema = zod_1.z.object({
    addressId: zod_1.z.string().min(1, 'Address is required'),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().positive(),
    })).min(1, 'At least one item is required'),
    notes: zod_1.z.string().optional(),
    promotionId: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.string().optional(),
});
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.OrderStatus),
    note: zod_1.z.string().optional(),
});
// ============================================
// Promotion Schemas
// ============================================
exports.createPromotionSchema = zod_1.z.object({
    nameAr: zod_1.z.string().min(1, 'Arabic name is required'),
    nameEn: zod_1.z.string().min(1, 'English name is required'),
    descriptionAr: zod_1.z.string().optional(),
    descriptionEn: zod_1.z.string().optional(),
    type: zod_1.z.enum(['percentage', 'fixed', 'buy_x_get_y', 'bundle']),
    value: zod_1.z.number().positive('Value must be positive'),
    minPurchase: zod_1.z.number().positive().optional(),
    maxDiscount: zod_1.z.number().positive().optional(),
    buyQuantity: zod_1.z.number().int().positive().optional(),
    getQuantity: zod_1.z.number().int().positive().optional(),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
    zones: zod_1.z.array(zod_1.z.nativeEnum(client_1.Zone)).min(1, 'At least one zone is required'),
    isActive: zod_1.z.boolean().default(true),
    usageLimit: zod_1.z.number().int().positive().optional(),
    productIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updatePromotionSchema = exports.createPromotionSchema.partial();
exports.applyPromotionSchema = zod_1.z.object({
    cartItems: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        quantity: zod_1.z.number().int().positive(),
        price: zod_1.z.number().positive(),
    })).min(1),
});
// ============================================
// User Schemas
// ============================================
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    businessName: zod_1.z.string().optional(),
});
//# sourceMappingURL=validation.js.map