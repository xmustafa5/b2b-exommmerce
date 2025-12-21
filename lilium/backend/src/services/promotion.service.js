"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionService = void 0;
class PromotionService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    async createPromotion(data) {
        const { productIds, categoryIds, ...promotionData } = data;
        // Validate dates
        if (new Date(data.startDate) >= new Date(data.endDate)) {
            throw new Error('End date must be after start date');
        }
        // Check for overlapping promotions
        const overlapping = await this.fastify.prisma.promotion.findMany({
            where: {
                isActive: true,
                OR: [
                    {
                        AND: [
                            { startDate: { lte: data.endDate } },
                            { endDate: { gte: data.startDate } },
                        ],
                    },
                ],
            },
            include: {
                products: true,
                categories: true,
            },
        });
        if (overlapping.length > 0 && productIds) {
            // Check if any products overlap
            const overlappingProductIds = overlapping.flatMap(p => p.products.map(pp => pp.productId));
            const hasOverlap = productIds.some(id => overlappingProductIds.includes(id));
            if (hasOverlap) {
                fastify.log.warn('Some products already have active promotions in this period');
            }
        }
        const promotion = await this.fastify.prisma.promotion.create({
            data: {
                ...promotionData,
                products: productIds ? {
                    create: productIds.map(productId => ({ productId })),
                } : undefined,
                categories: categoryIds ? {
                    create: categoryIds.map(categoryId => ({ categoryId })),
                } : undefined,
            },
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameAr: true,
                                sku: true,
                                price: true,
                            },
                        },
                    },
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameAr: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });
        return promotion;
    }
    async getPromotions(includeInactive = false) {
        const where = {};
        if (!includeInactive) {
            where.isActive = true;
            where.endDate = { gte: new Date() };
        }
        const promotions = await this.fastify.prisma.promotion.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameAr: true,
                                sku: true,
                                price: true,
                                images: true,
                            },
                        },
                    },
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameAr: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });
        return promotions;
    }
    async getPromotionById(id) {
        const promotion = await this.fastify.prisma.promotion.findUnique({
            where: { id },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });
        if (!promotion) {
            throw new Error('Promotion not found');
        }
        return promotion;
    }
    async updatePromotion(id, data) {
        const { productIds, categoryIds, ...updateData } = data;
        // If updating dates, validate them
        if (data.startDate && data.endDate) {
            if (new Date(data.startDate) >= new Date(data.endDate)) {
                throw new Error('End date must be after start date');
            }
        }
        const promotion = await this.fastify.prisma.promotion.update({
            where: { id },
            data: {
                ...updateData,
                products: productIds ? {
                    deleteMany: {},
                    create: productIds.map(productId => ({ productId })),
                } : undefined,
                categories: categoryIds ? {
                    deleteMany: {},
                    create: categoryIds.map(categoryId => ({ categoryId })),
                } : undefined,
            },
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameAr: true,
                                sku: true,
                                price: true,
                            },
                        },
                    },
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameAr: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });
        return promotion;
    }
    async deletePromotion(id) {
        await this.fastify.prisma.promotion.delete({
            where: { id },
        });
        return { message: 'Promotion deleted successfully' };
    }
    async togglePromotionStatus(id) {
        const promotion = await this.fastify.prisma.promotion.findUnique({
            where: { id },
        });
        if (!promotion) {
            throw new Error('Promotion not found');
        }
        const updated = await this.fastify.prisma.promotion.update({
            where: { id },
            data: { isActive: !promotion.isActive },
        });
        return updated;
    }
    // Calculate discount for a product
    async calculateDiscount(productId, quantity, subtotal) {
        const now = new Date();
        // Find active promotions for this product
        const promotions = await this.fastify.prisma.promotion.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
                OR: [
                    {
                        products: {
                            some: { productId },
                        },
                    },
                    {
                        categories: {
                            some: {
                                category: {
                                    products: {
                                        some: { id: productId },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            orderBy: { value: 'desc' }, // Prioritize higher discounts
        });
        if (promotions.length === 0) {
            return { discount: 0, appliedPromotion: null };
        }
        // Apply the best promotion
        const bestPromotion = promotions[0];
        // Check minimum purchase requirement
        if (bestPromotion.minPurchase && subtotal < bestPromotion.minPurchase) {
            return { discount: 0, appliedPromotion: null };
        }
        let discount = 0;
        if (bestPromotion.type === 'percentage') {
            discount = (subtotal * bestPromotion.value) / 100;
            // Apply max discount if set
            if (bestPromotion.maxDiscount && discount > bestPromotion.maxDiscount) {
                discount = bestPromotion.maxDiscount;
            }
        }
        else if (bestPromotion.type === 'fixed') {
            discount = bestPromotion.value;
        }
        return {
            discount: Math.round(discount),
            appliedPromotion: {
                id: bestPromotion.id,
                nameEn: bestPromotion.nameEn,
                nameAr: bestPromotion.nameAr,
                type: bestPromotion.type,
                value: bestPromotion.value,
            },
        };
    }
    // Apply promotions to cart
    async applyPromotionsToCart(cartItems) {
        let totalDiscount = 0;
        const appliedPromotions = [];
        for (const item of cartItems) {
            const itemSubtotal = item.price * item.quantity;
            const { discount, appliedPromotion } = await this.calculateDiscount(item.productId, item.quantity, itemSubtotal);
            if (discount > 0 && appliedPromotion) {
                totalDiscount += discount;
                appliedPromotions.push({
                    productId: item.productId,
                    ...appliedPromotion,
                    discountAmount: discount,
                });
            }
        }
        return {
            totalDiscount,
            appliedPromotions,
        };
    }
    async getActivePromotionsByZone(zone) {
        const now = new Date();
        const promotions = await this.fastify.prisma.promotion.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
                zones: { has: zone },
            },
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameAr: true,
                                price: true,
                                images: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return promotions;
    }
}
exports.PromotionService = PromotionService;
//# sourceMappingURL=promotion.service.js.map