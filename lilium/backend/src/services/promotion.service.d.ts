import { FastifyInstance } from 'fastify';
import { Zone } from '@prisma/client';
interface CreatePromotionInput {
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    type: 'percentage' | 'fixed';
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    startDate: Date;
    endDate: Date;
    zones: Zone[];
    productIds?: string[];
    categoryIds?: string[];
    isActive?: boolean;
}
export declare class PromotionService {
    private fastify;
    constructor(fastify: FastifyInstance);
    createPromotion(data: CreatePromotionInput): Promise<{
        type: string;
        id: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        value: number;
        startDate: Date;
        endDate: Date;
        minPurchase: number | null;
        maxDiscount: number | null;
        buyQuantity: number | null;
        getQuantity: number | null;
        usageLimit: number | null;
        usageCount: number;
    }>;
    getPromotions(includeInactive?: boolean): Promise<{
        type: string;
        id: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        value: number;
        startDate: Date;
        endDate: Date;
        minPurchase: number | null;
        maxDiscount: number | null;
        buyQuantity: number | null;
        getQuantity: number | null;
        usageLimit: number | null;
        usageCount: number;
    }[]>;
    getPromotionById(id: string): Promise<{
        type: string;
        id: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        value: number;
        startDate: Date;
        endDate: Date;
        minPurchase: number | null;
        maxDiscount: number | null;
        buyQuantity: number | null;
        getQuantity: number | null;
        usageLimit: number | null;
        usageCount: number;
    }>;
    updatePromotion(id: string, data: Partial<CreatePromotionInput>): Promise<{
        type: string;
        id: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        value: number;
        startDate: Date;
        endDate: Date;
        minPurchase: number | null;
        maxDiscount: number | null;
        buyQuantity: number | null;
        getQuantity: number | null;
        usageLimit: number | null;
        usageCount: number;
    }>;
    deletePromotion(id: string): Promise<{
        message: string;
    }>;
    togglePromotionStatus(id: string): Promise<{
        type: string;
        id: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        value: number;
        startDate: Date;
        endDate: Date;
        minPurchase: number | null;
        maxDiscount: number | null;
        buyQuantity: number | null;
        getQuantity: number | null;
        usageLimit: number | null;
        usageCount: number;
    }>;
    calculateDiscount(productId: string, quantity: number, subtotal: number): Promise<{
        discount: number;
        appliedPromotion: {
            id: string;
            nameEn: string;
            nameAr: string;
            type: string;
            value: number;
        };
    }>;
    applyPromotionsToCart(cartItems: Array<{
        productId: string;
        quantity: number;
        price: number;
    }>): Promise<{
        totalDiscount: number;
        appliedPromotions: any[];
    }>;
    getActivePromotionsByZone(zone: Zone): Promise<({
        products: ({
            product: {
                id: string;
                nameEn: string;
                nameAr: string;
                price: number;
                images: string[];
            };
        } & {
            id: string;
            productId: string;
            promotionId: string;
        })[];
    } & {
        type: string;
        id: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        value: number;
        startDate: Date;
        endDate: Date;
        minPurchase: number | null;
        maxDiscount: number | null;
        buyQuantity: number | null;
        getQuantity: number | null;
        usageLimit: number | null;
        usageCount: number;
    })[]>;
}
export {};
//# sourceMappingURL=promotion.service.d.ts.map