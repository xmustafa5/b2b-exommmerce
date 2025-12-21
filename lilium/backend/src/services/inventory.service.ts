import { FastifyInstance } from 'fastify';
import { Zone } from '@prisma/client';
import { NotificationService } from './notification.service';

// Configuration for stock alerts
const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 5;

export interface StockUpdateInput {
  productId: string;
  quantity: number;
  type: 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';
  notes?: string;
  createdBy: string;
}

export interface BulkStockUpdateInput {
  updates: Array<{
    productId: string;
    quantity: number;
    type: 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';
    notes?: string;
  }>;
  createdBy: string;
}

export interface StockAlertConfig {
  lowStockThreshold?: number;
  criticalStockThreshold?: number;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthyStockCount: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalStock: number;
    totalValue: number;
  }>;
  byZone: Array<{
    zone: Zone;
    productCount: number;
    totalStock: number;
  }>;
}

export class InventoryService {
  private notificationService: NotificationService;

  constructor(private fastify: FastifyInstance) {
    this.notificationService = new NotificationService(fastify);
  }

  /**
   * Update stock for a single product
   */
  async updateStock(input: StockUpdateInput): Promise<{
    product: any;
    stockHistory: any;
    alertSent: boolean;
  }> {
    const { productId, quantity, type, notes, createdBy } = input;

    // Get current product
    const product = await this.fastify.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw this.fastify.httpErrors.notFound('Product not found');
    }

    const previousStock = product.stock;
    let newStock: number;

    // Calculate new stock based on type
    switch (type) {
      case 'RESTOCK':
      case 'RETURN':
        newStock = previousStock + quantity;
        break;
      case 'ADJUSTMENT':
        newStock = quantity; // Absolute value for adjustments
        break;
      default:
        throw this.fastify.httpErrors.badRequest('Invalid stock update type');
    }

    // Ensure stock doesn't go negative
    if (newStock < 0) {
      throw this.fastify.httpErrors.badRequest('Stock cannot be negative');
    }

    // Update product and create history in transaction
    const [updatedProduct, stockHistory] = await this.fastify.prisma.$transaction([
      this.fastify.prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
        include: { category: true },
      }),
      this.fastify.prisma.stockHistory.create({
        data: {
          productId,
          type: type.toLowerCase(),
          quantity: type === 'ADJUSTMENT' ? newStock - previousStock : quantity,
          previousStock,
          newStock,
          notes,
          createdBy,
        },
      }),
    ]);

    // Check for stock alerts and notify
    let alertSent = false;

    // Product was out of stock and now has stock - notify users
    if (previousStock === 0 && newStock > 0) {
      await this.notificationService.notifyBackInStock(productId);
      await this.notificationService.sendStockAlert({
        productId,
        productName: product.nameEn,
        productNameAr: product.nameAr,
        currentStock: newStock,
        alertType: 'BACK_IN_STOCK',
      });
      alertSent = true;
    }
    // Product just went out of stock
    else if (previousStock > 0 && newStock === 0) {
      await this.notificationService.sendStockAlert({
        productId,
        productName: product.nameEn,
        productNameAr: product.nameAr,
        currentStock: newStock,
        alertType: 'OUT_OF_STOCK',
      });
      alertSent = true;
    }
    // Product is now low on stock
    else if (previousStock > LOW_STOCK_THRESHOLD && newStock <= LOW_STOCK_THRESHOLD && newStock > 0) {
      await this.notificationService.sendStockAlert({
        productId,
        productName: product.nameEn,
        productNameAr: product.nameAr,
        currentStock: newStock,
        alertType: 'LOW_STOCK',
      });
      alertSent = true;
    }

    return { product: updatedProduct, stockHistory, alertSent };
  }

  /**
   * Bulk update stock for multiple products
   */
  async bulkUpdateStock(input: BulkStockUpdateInput): Promise<{
    successCount: number;
    failureCount: number;
    results: Array<{ productId: string; success: boolean; error?: string }>;
  }> {
    const results: Array<{ productId: string; success: boolean; error?: string }> = [];

    for (const update of input.updates) {
      try {
        await this.updateStock({
          ...update,
          createdBy: input.createdBy,
        });
        results.push({ productId: update.productId, success: true });
      } catch (error: any) {
        results.push({
          productId: update.productId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Deduct stock after order (called when order is confirmed)
   */
  async deductStockForOrder(orderId: string, createdBy: string): Promise<void> {
    const order = await this.fastify.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw this.fastify.httpErrors.notFound('Order not found');
    }

    // Deduct stock for each item
    for (const item of order.items) {
      const product = await this.fastify.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) continue;

      const previousStock = product.stock;
      const newStock = Math.max(0, previousStock - item.quantity);

      await this.fastify.prisma.$transaction([
        this.fastify.prisma.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        }),
        this.fastify.prisma.stockHistory.create({
          data: {
            productId: item.productId,
            type: 'sale',
            quantity: -item.quantity,
            previousStock,
            newStock,
            reference: orderId,
            notes: `Order #${order.orderNumber}`,
            createdBy,
          },
        }),
      ]);

      // Send stock alerts if needed
      if (newStock === 0) {
        await this.notificationService.sendStockAlert({
          productId: item.productId,
          productName: product.nameEn,
          productNameAr: product.nameAr,
          currentStock: 0,
          alertType: 'OUT_OF_STOCK',
        });
      } else if (newStock <= LOW_STOCK_THRESHOLD && previousStock > LOW_STOCK_THRESHOLD) {
        await this.notificationService.sendStockAlert({
          productId: item.productId,
          productName: product.nameEn,
          productNameAr: product.nameAr,
          currentStock: newStock,
          alertType: 'LOW_STOCK',
        });
      }
    }
  }

  /**
   * Restore stock after order cancellation/refund
   */
  async restoreStockForOrder(orderId: string, createdBy: string): Promise<void> {
    const order = await this.fastify.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw this.fastify.httpErrors.notFound('Order not found');
    }

    for (const item of order.items) {
      const product = await this.fastify.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) continue;

      const previousStock = product.stock;
      const newStock = previousStock + item.quantity;

      await this.fastify.prisma.$transaction([
        this.fastify.prisma.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        }),
        this.fastify.prisma.stockHistory.create({
          data: {
            productId: item.productId,
            type: 'return',
            quantity: item.quantity,
            previousStock,
            newStock,
            reference: orderId,
            notes: `Cancelled/Refunded Order #${order.orderNumber}`,
            createdBy,
          },
        }),
      ]);

      // Notify users if product is back in stock
      if (previousStock === 0 && newStock > 0) {
        await this.notificationService.notifyBackInStock(item.productId);
      }
    }
  }

  /**
   * Get all products with low stock
   */
  async getLowStockProducts(options?: {
    threshold?: number;
    zone?: Zone;
  }): Promise<any[]> {
    const threshold = options?.threshold || LOW_STOCK_THRESHOLD;

    const where: any = {
      stock: { gt: 0, lte: threshold },
      isActive: true,
    };

    if (options?.zone) {
      where.zones = { has: options.zone };
    }

    return this.fastify.prisma.product.findMany({
      where,
      include: {
        category: {
          select: { nameEn: true, nameAr: true },
        },
      },
      orderBy: { stock: 'asc' },
    });
  }

  /**
   * Get all out of stock products
   */
  async getOutOfStockProducts(zone?: Zone): Promise<any[]> {
    const where: any = {
      stock: 0,
      isActive: true,
    };

    if (zone) {
      where.zones = { has: zone };
    }

    return this.fastify.prisma.product.findMany({
      where,
      include: {
        category: {
          select: { nameEn: true, nameAr: true },
        },
        notifyRequests: {
          where: { notified: false },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get stock history for a product
   */
  async getStockHistory(
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ history: any[]; total: number }> {
    const where: any = { productId };

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [history, total] = await Promise.all([
      this.fastify.prisma.stockHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          product: {
            select: { nameEn: true, nameAr: true, sku: true },
          },
        },
      }),
      this.fastify.prisma.stockHistory.count({ where }),
    ]);

    return { history, total };
  }

  /**
   * Generate inventory report
   */
  async generateInventoryReport(zone?: Zone): Promise<InventoryReport> {
    const zoneFilter = zone ? { zones: { has: zone } } : {};

    // Get all products
    const products = await this.fastify.prisma.product.findMany({
      where: { isActive: true, ...zoneFilter },
      include: {
        category: {
          select: { id: true, nameEn: true },
        },
      },
    });

    // Calculate totals
    let totalProducts = products.length;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyStockCount = 0;

    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      productCount: number;
      totalStock: number;
      totalValue: number;
    }>();

    const zoneMap = new Map<Zone, {
      zone: Zone;
      productCount: number;
      totalStock: number;
    }>();

    for (const product of products) {
      const value = product.stock * (product.cost || product.price);
      totalValue += value;

      if (product.stock === 0) {
        outOfStockCount++;
      } else if (product.stock <= LOW_STOCK_THRESHOLD) {
        lowStockCount++;
      } else {
        healthyStockCount++;
      }

      // Category aggregation
      const catKey = product.category.id;
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          categoryId: catKey,
          categoryName: product.category.nameEn,
          productCount: 0,
          totalStock: 0,
          totalValue: 0,
        });
      }
      const cat = categoryMap.get(catKey)!;
      cat.productCount++;
      cat.totalStock += product.stock;
      cat.totalValue += value;

      // Zone aggregation
      for (const z of product.zones) {
        if (!zoneMap.has(z)) {
          zoneMap.set(z, {
            zone: z,
            productCount: 0,
            totalStock: 0,
          });
        }
        const zoneData = zoneMap.get(z)!;
        zoneData.productCount++;
        zoneData.totalStock += product.stock;
      }
    }

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      healthyStockCount,
      byCategory: Array.from(categoryMap.values()),
      byZone: Array.from(zoneMap.values()),
    };
  }

  /**
   * Get products that need restock (based on recent sales velocity)
   */
  async getRestockSuggestions(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sales velocity per product
    const salesData = await this.fastify.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
          createdAt: { gte: startDate },
        },
      },
      _sum: { quantity: true },
    });

    const suggestions = [];

    for (const sale of salesData) {
      const product = await this.fastify.prisma.product.findUnique({
        where: { id: sale.productId },
        include: {
          category: { select: { nameEn: true } },
        },
      });

      if (!product || !product.isActive) continue;

      const totalSold = sale._sum.quantity || 0;
      const dailyVelocity = totalSold / days;
      const daysUntilOutOfStock = dailyVelocity > 0
        ? Math.floor(product.stock / dailyVelocity)
        : Infinity;

      // Suggest restock if less than 2 weeks of inventory
      if (daysUntilOutOfStock < 14) {
        suggestions.push({
          product: {
            id: product.id,
            sku: product.sku,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            category: product.category.nameEn,
          },
          currentStock: product.stock,
          totalSold,
          dailyVelocity: Math.round(dailyVelocity * 100) / 100,
          daysUntilOutOfStock,
          suggestedReorder: Math.ceil(dailyVelocity * 30), // 30 days of stock
        });
      }
    }

    // Sort by urgency (days until out of stock)
    return suggestions.sort((a, b) => a.daysUntilOutOfStock - b.daysUntilOutOfStock);
  }
}
