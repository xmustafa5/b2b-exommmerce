import { z } from 'zod';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const productQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    categoryId: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    inStock: z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        nameEn: "nameEn";
        nameAr: "nameAr";
        price: "price";
        stock: "stock";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    zones: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createProductSchema: z.ZodObject<{
    sku: z.ZodString;
    nameAr: z.ZodString;
    nameEn: z.ZodString;
    descriptionAr: z.ZodOptional<z.ZodString>;
    descriptionEn: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    compareAtPrice: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    stock: z.ZodDefault<z.ZodNumber>;
    minOrderQty: z.ZodDefault<z.ZodNumber>;
    unit: z.ZodDefault<z.ZodString>;
    images: z.ZodDefault<z.ZodArray<z.ZodString>>;
    categoryId: z.ZodString;
    zones: z.ZodArray<z.ZodEnum<{
        KARKH: "KARKH";
        RUSAFA: "RUSAFA";
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateProductSchema: z.ZodObject<{
    sku: z.ZodOptional<z.ZodString>;
    nameAr: z.ZodOptional<z.ZodString>;
    nameEn: z.ZodOptional<z.ZodString>;
    descriptionAr: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    descriptionEn: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    compareAtPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    cost: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    stock: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    minOrderQty: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    unit: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    images: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString>>>;
    categoryId: z.ZodOptional<z.ZodString>;
    zones: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        KARKH: "KARKH";
        RUSAFA: "RUSAFA";
    }>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isFeatured: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, z.core.$strip>;
export declare const updateStockSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    operation: z.ZodEnum<{
        add: "add";
        subtract: "subtract";
        set: "set";
    }>;
}, z.core.$strip>;
export declare const bulkProductSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString>;
    data: z.ZodOptional<z.ZodObject<{
        sku: z.ZodOptional<z.ZodString>;
        nameAr: z.ZodOptional<z.ZodString>;
        nameEn: z.ZodOptional<z.ZodString>;
        descriptionAr: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        descriptionEn: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        price: z.ZodOptional<z.ZodNumber>;
        compareAtPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        cost: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        stock: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        minOrderQty: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        unit: z.ZodOptional<z.ZodDefault<z.ZodString>>;
        images: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString>>>;
        categoryId: z.ZodOptional<z.ZodString>;
        zones: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            KARKH: "KARKH";
            RUSAFA: "RUSAFA";
        }>>>;
        isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        isFeatured: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const createCategorySchema: z.ZodObject<{
    nameAr: z.ZodString;
    nameEn: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateCategorySchema: z.ZodObject<{
    nameAr: z.ZodOptional<z.ZodString>;
    nameEn: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    image: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, z.core.$strip>;
export declare const reorderCategoriesSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    sortOrder: z.ZodNumber;
}, z.core.$strip>>;
export declare const orderQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        CONFIRMED: "CONFIRMED";
        PROCESSING: "PROCESSING";
        SHIPPED: "SHIPPED";
        DELIVERED: "DELIVERED";
        CANCELLED: "CANCELLED";
        REFUNDED: "REFUNDED";
    }>>;
    zone: z.ZodOptional<z.ZodEnum<{
        KARKH: "KARKH";
        RUSAFA: "RUSAFA";
    }>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createOrderSchema: z.ZodObject<{
    addressId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>>;
    notes: z.ZodOptional<z.ZodString>;
    promotionId: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        PENDING: "PENDING";
        CONFIRMED: "CONFIRMED";
        PROCESSING: "PROCESSING";
        SHIPPED: "SHIPPED";
        DELIVERED: "DELIVERED";
        CANCELLED: "CANCELLED";
        REFUNDED: "REFUNDED";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createPromotionSchema: z.ZodObject<{
    nameAr: z.ZodString;
    nameEn: z.ZodString;
    descriptionAr: z.ZodOptional<z.ZodString>;
    descriptionEn: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        fixed: "fixed";
        percentage: "percentage";
        buy_x_get_y: "buy_x_get_y";
        bundle: "bundle";
    }>;
    value: z.ZodNumber;
    minPurchase: z.ZodOptional<z.ZodNumber>;
    maxDiscount: z.ZodOptional<z.ZodNumber>;
    buyQuantity: z.ZodOptional<z.ZodNumber>;
    getQuantity: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodCoercedDate<unknown>;
    endDate: z.ZodCoercedDate<unknown>;
    zones: z.ZodArray<z.ZodEnum<{
        KARKH: "KARKH";
        RUSAFA: "RUSAFA";
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    productIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const updatePromotionSchema: z.ZodObject<{
    nameAr: z.ZodOptional<z.ZodString>;
    nameEn: z.ZodOptional<z.ZodString>;
    descriptionAr: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    descriptionEn: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<{
        fixed: "fixed";
        percentage: "percentage";
        buy_x_get_y: "buy_x_get_y";
        bundle: "bundle";
    }>>;
    value: z.ZodOptional<z.ZodNumber>;
    minPurchase: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    maxDiscount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    buyQuantity: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    getQuantity: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    startDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    zones: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        KARKH: "KARKH";
        RUSAFA: "RUSAFA";
    }>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    usageLimit: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    productIds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const applyPromotionSchema: z.ZodObject<{
    cartItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    businessName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
//# sourceMappingURL=validation.d.ts.map