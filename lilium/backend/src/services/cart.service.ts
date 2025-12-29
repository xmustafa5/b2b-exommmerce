import { FastifyInstance } from 'fastify';

interface AddToCartInput {
  productId: string;
  quantity: number;
}

interface UpdateCartItemInput {
  quantity: number;
}

export class CartService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Get or create cart for user
   */
  private async getOrCreateCart(userId: string) {
    let cart = await this.fastify.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.fastify.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  /**
   * Get user's cart with all items and product details
   */
  async getCart(userId: string) {
    const cart = await this.fastify.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                nameEn: true,
                price: true,
                compareAtPrice: true,
                stock: true,
                minOrderQty: true,
                unit: true,
                images: true,
                isActive: true,
                zones: true,
                companyId: true,
                category: {
                  select: {
                    id: true,
                    nameAr: true,
                    nameEn: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      return {
        id: null,
        items: [],
        itemCount: 0,
        subtotal: 0,
      };
    }

    // Calculate totals and filter out inactive/deleted products
    const validItems = cart.items.filter(item => item.product && item.product.isActive);
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = validItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    return {
      id: cart.id,
      items: validItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        lineTotal: item.product.price * item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      itemCount,
      subtotal,
    };
  }

  /**
   * Add item to cart (or update quantity if already exists)
   */
  async addToCart(userId: string, data: AddToCartInput) {
    const { productId, quantity } = data;

    // Validate product exists and is active
    const product = await this.fastify.prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new Error('Product not found or inactive');
    }

    // Check minimum order quantity
    if (quantity < product.minOrderQty) {
      throw new Error(`Minimum order quantity is ${product.minOrderQty}`);
    }

    // Check stock
    if (quantity > product.stock) {
      throw new Error(`Only ${product.stock} items available in stock`);
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await this.fastify.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      // Check stock for total quantity
      if (newQuantity > product.stock) {
        throw new Error(`Cannot add more. Only ${product.stock} items available in stock`);
      }

      await this.fastify.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await this.fastify.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Return updated cart
    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(userId: string, productId: string, data: UpdateCartItemInput) {
    const { quantity } = data;

    // Get user's cart
    const cart = await this.fastify.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Find cart item
    const cartItem = await this.fastify.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: { product: true },
    });

    if (!cartItem) {
      throw new Error('Item not found in cart');
    }

    // Validate quantity
    if (quantity < 1) {
      // If quantity is 0 or negative, remove item
      await this.fastify.prisma.cartItem.delete({
        where: { id: cartItem.id },
      });
    } else {
      // Check minimum order quantity
      if (quantity < cartItem.product.minOrderQty) {
        throw new Error(`Minimum order quantity is ${cartItem.product.minOrderQty}`);
      }

      // Check stock
      if (quantity > cartItem.product.stock) {
        throw new Error(`Only ${cartItem.product.stock} items available in stock`);
      }

      await this.fastify.prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity },
      });
    }

    // Return updated cart
    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string) {
    // Get user's cart
    const cart = await this.fastify.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Find and delete cart item
    const cartItem = await this.fastify.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!cartItem) {
      throw new Error('Item not found in cart');
    }

    await this.fastify.prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    // Return updated cart
    return this.getCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string) {
    const cart = await this.fastify.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.fastify.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return {
      id: cart?.id || null,
      items: [],
      itemCount: 0,
      subtotal: 0,
    };
  }

  /**
   * Sync cart from client (merge local cart with server cart)
   */
  async syncCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Clear existing items
    await this.fastify.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Validate and add new items
    const validItems: Array<{ productId: string; quantity: number }> = [];
    const errors: string[] = [];

    for (const item of items) {
      const product = await this.fastify.prisma.product.findFirst({
        where: { id: item.productId, isActive: true },
      });

      if (!product) {
        errors.push(`Product ${item.productId} not found or inactive`);
        continue;
      }

      // Adjust quantity if necessary
      let quantity = item.quantity;

      if (quantity < product.minOrderQty) {
        quantity = product.minOrderQty;
      }

      if (quantity > product.stock) {
        quantity = product.stock;
        errors.push(`${product.nameEn}: quantity adjusted to ${quantity} (stock limit)`);
      }

      if (quantity > 0) {
        validItems.push({ productId: item.productId, quantity });
      }
    }

    // Bulk create cart items
    if (validItems.length > 0) {
      await this.fastify.prisma.cartItem.createMany({
        data: validItems.map(item => ({
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }

    // Get updated cart
    const updatedCart = await this.getCart(userId);

    return {
      ...updatedCart,
      syncErrors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get cart item count (for badge display)
   */
  async getCartCount(userId: string) {
    const cart = await this.fastify.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: { quantity: true },
        },
      },
    });

    if (!cart) {
      return { count: 0 };
    }

    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return { count };
  }

  /**
   * Validate checkout - check stock, calculate totals with promotions
   */
  async validateCheckout(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    addressId?: string
  ) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validatedItems: Array<{
      productId: string;
      requestedQuantity: number;
      availableQuantity: number;
      isAvailable: boolean;
      price: number;
      adjustedQuantity?: number;
    }> = [];

    let subtotal = 0;
    let itemCount = 0;

    // Validate each item
    for (const item of items) {
      const product = await this.fastify.prisma.product.findFirst({
        where: { id: item.productId, isActive: true },
      });

      if (!product) {
        errors.push(`Product not found or inactive: ${item.productId}`);
        validatedItems.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity: 0,
          isAvailable: false,
          price: 0,
        });
        continue;
      }

      const isAvailable = product.stock >= item.quantity;
      let adjustedQuantity: number | undefined;

      if (!isAvailable && product.stock > 0) {
        adjustedQuantity = product.stock;
        warnings.push(`${product.nameEn}: only ${product.stock} available, quantity adjusted`);
      } else if (product.stock === 0) {
        errors.push(`${product.nameEn} is out of stock`);
      }

      if (item.quantity < product.minOrderQty) {
        errors.push(`${product.nameEn}: minimum order quantity is ${product.minOrderQty}`);
      }

      const effectiveQuantity = adjustedQuantity ?? item.quantity;
      const lineTotal = product.price * effectiveQuantity;

      validatedItems.push({
        productId: item.productId,
        requestedQuantity: item.quantity,
        availableQuantity: product.stock,
        isAvailable,
        price: product.price,
        adjustedQuantity,
      });

      if (isAvailable || adjustedQuantity) {
        subtotal += lineTotal;
        itemCount += effectiveQuantity;
      }
    }

    // Calculate promotions
    let discount = 0;
    let promotionPreview = null;

    try {
      // Import promotion service dynamically to avoid circular dependencies
      const { PromotionService } = await import('./promotion.service');
      const promotionService = new PromotionService(this.fastify);

      // Prepare cart items for promotion calculation
      const cartItemsForPromo = validatedItems
        .filter(item => item.isAvailable || item.adjustedQuantity)
        .map(item => ({
          productId: item.productId,
          quantity: item.adjustedQuantity ?? item.requestedQuantity,
          price: item.price,
        }));

      if (cartItemsForPromo.length > 0) {
        const promoResult = await promotionService.applyPromotionsToCart(cartItemsForPromo);
        discount = promoResult.totalDiscount;

        if (promoResult.appliedPromotions.length > 0) {
          // Remove duplicates
          const uniquePromotions = promoResult.appliedPromotions.filter(
            (p: any, index: number, self: any[]) =>
              index === self.findIndex((t: any) => t.id === p.id)
          );

          promotionPreview = {
            applicablePromotions: uniquePromotions.map((p: any) => ({
              id: p.id,
              name: p.nameEn,
              type: p.type,
              value: p.value,
            })),
            totalSavings: discount,
          };
        }
      }
    } catch (error) {
      // If promotion calculation fails, continue without promotions
      this.fastify.log.warn('Failed to calculate promotions:', error);
    }

    // Calculate delivery fee (can be customized based on zone, total, etc.)
    const deliveryFee = 0; // Free delivery for now

    const total = Math.max(0, subtotal - discount + deliveryFee);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validatedItems,
      summary: {
        subtotal,
        discount,
        deliveryFee,
        total,
        itemCount,
      },
      promotionPreview,
    };
  }

  /**
   * Quick stock check for cart items
   */
  async quickStockCheck(items: Array<{ productId: string; quantity: number }>) {
    const results: Array<{
      productId: string;
      available: boolean;
      requestedQty: number;
      availableQty: number;
    }> = [];

    for (const item of items) {
      const product = await this.fastify.prisma.product.findFirst({
        where: { id: item.productId, isActive: true },
        select: { stock: true },
      });

      results.push({
        productId: item.productId,
        available: product ? product.stock >= item.quantity : false,
        requestedQty: item.quantity,
        availableQty: product?.stock ?? 0,
      });
    }

    return {
      allAvailable: results.every(r => r.available),
      items: results,
    };
  }
}
