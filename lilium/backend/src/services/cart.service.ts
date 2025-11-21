import { FastifyInstance } from 'fastify';
import { Product, User, Address, Order, OrderItem, OrderStatus, Zone, Prisma } from '@prisma/client';

export interface CartItem {
  productId: string;
  quantity: number;
  price?: number;
  discount?: number;
}

export interface VendorCartGroup {
  companyId: string;
  companyName: string;
  items: Array<CartItem & {
    product: Product;
    subtotal: number;
    discountAmount: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

export interface CartSummary {
  vendorGroups: VendorCartGroup[];
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  totalDeliveryFee: number;
  grandTotal: number;
}

export interface CheckoutInput {
  userId: string;
  addressId: string;
  items: CartItem[];
  paymentMethod?: string;
  notes?: string;
}

export interface VendorOrder {
  companyId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

export class CartService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Validate cart items and check stock availability
   */
  async validateCartItems(items: CartItem[]): Promise<{
    valid: boolean;
    errors: string[];
    validatedItems: Array<CartItem & { product: Product }>;
  }> {
    const errors: string[] = [];
    const validatedItems: Array<CartItem & { product: Product }> = [];

    for (const item of items) {
      // Get product details
      const product = await this.fastify.prisma.product.findUnique({
        where: { id: item.productId },
        include: { company: true },
      });

      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      if (!product.isActive) {
        errors.push(`Product "${product.nameEn}" is not available`);
        continue;
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        errors.push(`Insufficient stock for "${product.nameEn}". Available: ${product.stock}, Requested: ${item.quantity}`);
        continue;
      }

      // Check minimum order quantity
      if (item.quantity < product.minOrderQty) {
        errors.push(`Minimum order quantity for "${product.nameEn}" is ${product.minOrderQty}`);
        continue;
      }

      // Add validated item with product details
      validatedItems.push({
        ...item,
        product,
        price: item.price || product.price,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      validatedItems,
    };
  }

  /**
   * Group cart items by vendor/company
   */
  async groupItemsByVendor(
    items: Array<CartItem & { product: Product }>,
    userZone?: Zone
  ): Promise<VendorCartGroup[]> {
    const vendorGroups = new Map<string, VendorCartGroup>();

    for (const item of items) {
      const companyId = item.product.companyId;

      if (!companyId) {
        continue; // Skip products without company
      }

      // Get or create vendor group
      if (!vendorGroups.has(companyId)) {
        const company = await this.fastify.prisma.company.findUnique({
          where: { id: companyId },
        });

        if (!company) continue;

        vendorGroups.set(companyId, {
          companyId,
          companyName: company.name,
          items: [],
          subtotal: 0,
          discount: 0,
          deliveryFee: this.calculateDeliveryFee(userZone, company.zones as Zone[]),
          total: 0,
        });
      }

      const group = vendorGroups.get(companyId)!;

      // Calculate item totals
      const itemSubtotal = (item.price || item.product.price) * item.quantity;
      const itemDiscount = (item.discount || 0) * item.quantity;
      const itemTotal = itemSubtotal - itemDiscount;

      // Add item to group
      group.items.push({
        ...item,
        subtotal: itemSubtotal,
        discountAmount: itemDiscount,
        total: itemTotal,
      });

      // Update group totals
      group.subtotal += itemSubtotal;
      group.discount += itemDiscount;
    }

    // Calculate final totals for each group
    vendorGroups.forEach(group => {
      group.total = group.subtotal - group.discount + group.deliveryFee;
    });

    return Array.from(vendorGroups.values());
  }

  /**
   * Calculate delivery fee based on zones
   */
  private calculateDeliveryFee(userZone?: Zone, vendorZones?: Zone[]): number {
    if (!userZone || !vendorZones) {
      return 5000; // Default delivery fee in IQD
    }

    // If vendor serves user's zone, lower fee
    if (vendorZones.includes(userZone)) {
      return 2500; // Same zone delivery fee
    }

    // Different zone, higher fee
    return 5000; // Cross-zone delivery fee
  }

  /**
   * Get cart summary with vendor grouping
   */
  async getCartSummary(items: CartItem[], userId?: string): Promise<CartSummary> {
    // Validate items
    const { valid, errors, validatedItems } = await this.validateCartItems(items);

    if (!valid) {
      throw this.fastify.httpErrors.badRequest(errors.join(', '));
    }

    // Get user zone if userId provided
    let userZone: Zone | undefined;
    if (userId) {
      const user = await this.fastify.prisma.user.findUnique({
        where: { id: userId },
      });
      userZone = user?.zones?.[0];
    }

    // Group items by vendor
    const vendorGroups = await this.groupItemsByVendor(validatedItems, userZone);

    // Calculate totals
    const totalItems = validatedItems.length;
    const subtotal = vendorGroups.reduce((sum, group) => sum + group.subtotal, 0);
    const totalDiscount = vendorGroups.reduce((sum, group) => sum + group.discount, 0);
    const totalDeliveryFee = vendorGroups.reduce((sum, group) => sum + group.deliveryFee, 0);
    const grandTotal = subtotal - totalDiscount + totalDeliveryFee;

    return {
      vendorGroups,
      totalItems,
      subtotal,
      totalDiscount,
      totalDeliveryFee,
      grandTotal,
    };
  }

  /**
   * Apply promotions to cart items
   */
  async applyPromotions(
    items: Array<CartItem & { product: Product }>,
    userId: string
  ): Promise<Array<CartItem & { product: Product; appliedPromotion?: any }>> {
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return items;
    }

    const userZones = user.zones as Zone[];
    const currentDate = new Date();

    // Get active promotions
    const promotions = await this.fastify.prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
        OR: [
          { zones: { hasSome: userZones } },
          { zones: { isEmpty: true } },
        ],
      },
    });

    // Apply promotions to items
    const itemsWithPromotions = items.map(item => {
      let bestPromotion = null;
      let bestDiscount = item.discount || 0;

      for (const promo of promotions) {
        // Check if promotion applies to this product
        const productIds = promo.productIds as string[];
        const categoryIds = promo.categoryIds as string[];

        const appliesToProduct =
          productIds.length === 0 ||
          productIds.includes(item.productId);

        const appliesToCategory =
          categoryIds.length === 0 ||
          (item.product.categoryId && categoryIds.includes(item.product.categoryId));

        if (!appliesToProduct || !appliesToCategory) {
          continue;
        }

        // Check minimum purchase amount
        const itemTotal = item.price! * item.quantity;
        if (promo.minPurchaseAmount && itemTotal < promo.minPurchaseAmount) {
          continue;
        }

        // Calculate discount
        let discount = 0;
        if (promo.discountType === 'PERCENTAGE') {
          discount = (itemTotal * promo.discountValue) / 100;
          if (promo.maxDiscountAmount) {
            discount = Math.min(discount, promo.maxDiscountAmount);
          }
        } else {
          discount = promo.discountValue;
        }

        // Use best discount
        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestPromotion = promo;
        }
      }

      return {
        ...item,
        discount: bestDiscount / item.quantity, // Discount per unit
        appliedPromotion: bestPromotion,
      };
    });

    return itemsWithPromotions;
  }

  /**
   * Create orders from cart (one per vendor)
   */
  async checkout(input: CheckoutInput): Promise<Order[]> {
    const { userId, addressId, items, paymentMethod, notes } = input;

    // Validate user
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          where: { id: addressId },
        },
      },
    });

    if (!user) {
      throw this.fastify.httpErrors.notFound('User not found');
    }

    if (user.addresses.length === 0) {
      throw this.fastify.httpErrors.badRequest('Invalid delivery address');
    }

    const deliveryAddress = user.addresses[0];
    const userZone = deliveryAddress.zone as Zone;

    // Validate and get cart items with products
    const { valid, errors, validatedItems } = await this.validateCartItems(items);

    if (!valid) {
      throw this.fastify.httpErrors.badRequest(errors.join(', '));
    }

    // Apply promotions
    const itemsWithPromotions = await this.applyPromotions(validatedItems, userId);

    // Group items by vendor
    const vendorGroups = await this.groupItemsByVendor(itemsWithPromotions, userZone);

    // Create orders in transaction
    const orders = await this.fastify.prisma.$transaction(async (tx) => {
      const createdOrders: Order[] = [];

      for (const vendorGroup of vendorGroups) {
        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId,
            status: OrderStatus.PENDING,
            subtotal: vendorGroup.subtotal,
            discount: vendorGroup.discount,
            deliveryFee: vendorGroup.deliveryFee,
            total: vendorGroup.total,
            paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
            paymentStatus: 'PENDING',
            notes,
            statusHistory: {
              create: {
                fromStatus: OrderStatus.PENDING,
                toStatus: OrderStatus.PENDING,
                comment: 'Order created',
                changedBy: userId,
              },
            },
            items: {
              create: vendorGroup.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price || item.product.price,
                discount: item.discount,
                total: (item.price || item.product.price) * item.quantity - (item.discount || 0) * item.quantity,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            address: true,
            statusHistory: true,
          },
        });

        // Update product stock
        for (const item of vendorGroup.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          // Create stock history
          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              previousQuantity: item.product.stock,
              newQuantity: item.product.stock - item.quantity,
              changeQuantity: -item.quantity,
              changeType: 'SALE',
              changeReason: `Order ${orderNumber}`,
              referenceId: order.id,
              referenceType: 'ORDER',
            },
          });
        }

        createdOrders.push(order);

        // Send notification to vendor
        this.fastify.log.info(`New order ${orderNumber} for company ${vendorGroup.companyId}`);
      }

      return createdOrders;
    });

    return orders;
  }

  /**
   * Save cart for later
   */
  async saveCart(userId: string, items: CartItem[]): Promise<void> {
    // In production, this would save to Redis or a cart table
    // For now, we'll just validate the items
    const { valid, errors } = await this.validateCartItems(items);

    if (!valid) {
      throw this.fastify.httpErrors.badRequest(errors.join(', '));
    }

    // TODO: Implement cart persistence
    this.fastify.log.info(`Cart saved for user ${userId} with ${items.length} items`);
  }

  /**
   * Get saved cart
   */
  async getSavedCart(userId: string): Promise<CartItem[]> {
    // TODO: Implement cart retrieval from storage
    // For now, return empty array
    return [];
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<void> {
    // TODO: Implement cart clearing
    this.fastify.log.info(`Cart cleared for user ${userId}`);
  }

  /**
   * Merge guest cart with user cart
   */
  async mergeCart(userId: string, guestItems: CartItem[]): Promise<CartItem[]> {
    const savedItems = await this.getSavedCart(userId);

    // Merge items, combining quantities for duplicate products
    const mergedMap = new Map<string, CartItem>();

    // Add saved items
    for (const item of savedItems) {
      mergedMap.set(item.productId, item);
    }

    // Add or merge guest items
    for (const item of guestItems) {
      const existing = mergedMap.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        mergedMap.set(item.productId, item);
      }
    }

    const mergedItems = Array.from(mergedMap.values());

    // Save merged cart
    await this.saveCart(userId, mergedItems);

    return mergedItems;
  }

  /**
   * Calculate estimated delivery time
   */
  async estimateDeliveryTime(vendorGroups: VendorCartGroup[]): Promise<{
    minDays: number;
    maxDays: number;
    estimatedDate: Date;
  }> {
    // Simple estimation: 2-5 days for same zone, 3-7 days for different zones
    const hasMultipleVendors = vendorGroups.length > 1;
    const baseMinDays = hasMultipleVendors ? 3 : 2;
    const baseMaxDays = hasMultipleVendors ? 7 : 5;

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + baseMinDays);

    return {
      minDays: baseMinDays,
      maxDays: baseMaxDays,
      estimatedDate,
    };
  }
}