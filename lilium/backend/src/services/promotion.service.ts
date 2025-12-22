import { FastifyInstance } from 'fastify';
import { Zone } from '@prisma/client';

interface CreatePromotionInput {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  buyQuantity?: number;    // For buy_x_get_y: Buy X items
  getQuantity?: number;    // For buy_x_get_y: Get Y items free
  bundleProductIds?: string[]; // For bundle: Products in the bundle
  bundlePrice?: number;    // For bundle: Special bundle price
  startDate: Date;
  endDate: Date;
  zones: Zone[];
  productIds?: string[];
  categoryIds?: string[];
  isActive?: boolean;
}

export class PromotionService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  async createPromotion(data: CreatePromotionInput) {
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
      const overlappingProductIds = overlapping.flatMap(p =>
        p.products.map(pp => pp.productId)
      );
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

  async getPromotions(includeInactive: boolean = false) {
    const where: any = {};
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

  async getPromotionById(id: string) {
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

  async updatePromotion(id: string, data: Partial<CreatePromotionInput>) {
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

  async deletePromotion(id: string) {
    await this.fastify.prisma.promotion.delete({
      where: { id },
    });

    return { message: 'Promotion deleted successfully' };
  }

  async togglePromotionStatus(id: string) {
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
  async calculateDiscount(productId: string, quantity: number, subtotal: number, unitPrice?: number) {
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
      include: {
        products: true,
      },
      orderBy: { value: 'desc' }, // Prioritize higher discounts
    });

    if (promotions.length === 0) {
      return { discount: 0, appliedPromotion: null, freeItems: 0 };
    }

    // Apply the best promotion
    const bestPromotion = promotions[0];

    // Check minimum purchase requirement
    if (bestPromotion.minPurchase && subtotal < bestPromotion.minPurchase) {
      return { discount: 0, appliedPromotion: null, freeItems: 0 };
    }

    let discount = 0;
    let freeItems = 0;

    if (bestPromotion.type === 'percentage') {
      discount = (subtotal * bestPromotion.value) / 100;

      // Apply max discount if set
      if (bestPromotion.maxDiscount && discount > bestPromotion.maxDiscount) {
        discount = bestPromotion.maxDiscount;
      }
    } else if (bestPromotion.type === 'fixed') {
      discount = bestPromotion.value;
    } else if (bestPromotion.type === 'buy_x_get_y') {
      // Buy X Get Y free calculation
      const buyQty = bestPromotion.buyQuantity || 1;
      const getQty = bestPromotion.getQuantity || 1;
      const groupSize = buyQty + getQty;

      // Calculate how many complete groups and free items
      const completeGroups = Math.floor(quantity / groupSize);
      freeItems = completeGroups * getQty;

      // Discount is the value of free items
      if (unitPrice && freeItems > 0) {
        discount = freeItems * unitPrice;
      }
    }
    // Note: Bundle type is handled at cart level, not per product

    return {
      discount: Math.round(discount),
      freeItems,
      appliedPromotion: {
        id: bestPromotion.id,
        nameEn: bestPromotion.nameEn,
        nameAr: bestPromotion.nameAr,
        type: bestPromotion.type,
        value: bestPromotion.value,
        buyQuantity: bestPromotion.buyQuantity,
        getQuantity: bestPromotion.getQuantity,
      },
    };
  }

  // Calculate Buy X Get Y discount for a specific product
  calculateBuyXGetYDiscount(
    quantity: number,
    unitPrice: number,
    buyQuantity: number,
    getQuantity: number
  ): { discount: number; freeItems: number; totalWithPromo: number } {
    const groupSize = buyQuantity + getQuantity;
    const completeGroups = Math.floor(quantity / groupSize);
    const remainder = quantity % groupSize;

    // Free items are getQuantity per complete group
    const freeItems = completeGroups * getQuantity;

    // Discount is the value of free items
    const discount = freeItems * unitPrice;

    // Total items customer needs to pay for
    const paidItems = quantity - freeItems;
    const totalWithPromo = paidItems * unitPrice;

    return {
      discount: Math.round(discount),
      freeItems,
      totalWithPromo: Math.round(totalWithPromo),
    };
  }

  // Calculate bundle discount
  async calculateBundleDiscount(
    cartItems: Array<{ productId: string; quantity: number; price: number }>
  ): Promise<{
    discount: number;
    appliedBundles: Array<{
      bundleId: string;
      bundleName: string;
      originalPrice: number;
      bundlePrice: number;
      discount: number;
      products: string[];
    }>;
  }> {
    const now = new Date();

    // Find active bundle promotions
    const bundlePromotions = await this.fastify.prisma.promotion.findMany({
      where: {
        isActive: true,
        type: 'bundle',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                nameEn: true,
                price: true,
              },
            },
          },
        },
      },
    });

    let totalDiscount = 0;
    const appliedBundles: Array<{
      bundleId: string;
      bundleName: string;
      originalPrice: number;
      bundlePrice: number;
      discount: number;
      products: string[];
    }> = [];

    for (const bundle of bundlePromotions) {
      const bundleProductIds = bundle.products.map(p => p.productId);

      // Check if all bundle products are in cart
      const cartProductIds = cartItems.map(item => item.productId);
      const allProductsInCart = bundleProductIds.every(id => cartProductIds.includes(id));

      if (!allProductsInCart) continue;

      // Calculate original price of bundle products
      let originalPrice = 0;
      for (const bundleProduct of bundle.products) {
        const cartItem = cartItems.find(item => item.productId === bundleProduct.productId);
        if (cartItem) {
          originalPrice += bundleProduct.product.price;
        }
      }

      // Bundle price is stored in the 'value' field
      const bundlePrice = bundle.value;

      if (bundlePrice < originalPrice) {
        const discount = originalPrice - bundlePrice;
        totalDiscount += discount;

        appliedBundles.push({
          bundleId: bundle.id,
          bundleName: bundle.nameEn,
          originalPrice,
          bundlePrice,
          discount: Math.round(discount),
          products: bundleProductIds,
        });
      }
    }

    return {
      discount: Math.round(totalDiscount),
      appliedBundles,
    };
  }

  // Apply promotions to cart (includes percentage, fixed, buy_x_get_y, and bundle)
  async applyPromotionsToCart(cartItems: Array<{ productId: string; quantity: number; price: number }>) {
    let totalDiscount = 0;
    const appliedPromotions: any[] = [];
    let totalFreeItems = 0;

    // First, apply individual item promotions (percentage, fixed, buy_x_get_y)
    for (const item of cartItems) {
      const itemSubtotal = item.price * item.quantity;
      const { discount, appliedPromotion, freeItems } = await this.calculateDiscount(
        item.productId,
        item.quantity,
        itemSubtotal,
        item.price
      );

      if (discount > 0 && appliedPromotion) {
        totalDiscount += discount;
        totalFreeItems += freeItems;
        appliedPromotions.push({
          productId: item.productId,
          ...appliedPromotion,
          discountAmount: discount,
          freeItems,
        });
      }
    }

    // Then, apply bundle promotions
    const { discount: bundleDiscount, appliedBundles } = await this.calculateBundleDiscount(cartItems);

    if (bundleDiscount > 0) {
      totalDiscount += bundleDiscount;
      for (const bundle of appliedBundles) {
        appliedPromotions.push({
          productId: null, // Bundle applies to multiple products
          id: bundle.bundleId,
          nameEn: bundle.bundleName,
          nameAr: bundle.bundleName,
          type: 'bundle',
          value: bundle.bundlePrice,
          discountAmount: bundle.discount,
          originalPrice: bundle.originalPrice,
          bundleProducts: bundle.products,
        });
      }
    }

    return {
      totalDiscount,
      totalFreeItems,
      appliedPromotions,
      appliedBundles,
    };
  }

  // Get promotion preview for cart (shows potential savings without applying)
  async getPromotionPreview(cartItems: Array<{ productId: string; quantity: number; price: number }>) {
    const preview: {
      potentialSavings: number;
      availablePromotions: any[];
      buyXGetYDeals: any[];
      bundleDeals: any[];
    } = {
      potentialSavings: 0,
      availablePromotions: [],
      buyXGetYDeals: [],
      bundleDeals: [],
    };

    const now = new Date();
    const productIds = cartItems.map(item => item.productId);

    // Find all applicable promotions
    const promotions = await this.fastify.prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        products: {
          some: {
            productId: { in: productIds },
          },
        },
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
              },
            },
          },
        },
      },
    });

    for (const promo of promotions) {
      const promoInfo = {
        id: promo.id,
        nameEn: promo.nameEn,
        nameAr: promo.nameAr,
        type: promo.type,
        value: promo.value,
        applicableProducts: promo.products.map(p => ({
          id: p.product.id,
          nameEn: p.product.nameEn,
        })),
      };

      if (promo.type === 'buy_x_get_y') {
        preview.buyXGetYDeals.push({
          ...promoInfo,
          buyQuantity: promo.buyQuantity,
          getQuantity: promo.getQuantity,
          description: `Buy ${promo.buyQuantity}, Get ${promo.getQuantity} Free`,
        });
      } else if (promo.type === 'bundle') {
        preview.bundleDeals.push({
          ...promoInfo,
          bundlePrice: promo.value,
          description: `Bundle Deal - Save on combined purchase`,
        });
      } else {
        preview.availablePromotions.push(promoInfo);
      }
    }

    // Calculate potential savings
    const { totalDiscount } = await this.applyPromotionsToCart(cartItems);
    preview.potentialSavings = totalDiscount;

    return preview;
  }

  async getActivePromotionsByZone(zone: Zone) {
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
