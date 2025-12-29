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
}
