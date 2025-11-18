import { FastifyInstance } from 'fastify';
import { OrderStatus, Zone } from '@prisma/client';

interface CreateOrderInput {
  userId: string;
  addressId: string;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
  notes?: string;
}

interface OrderFilters {
  status?: OrderStatus;
  zone?: Zone;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class OrderService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  async createOrder(data: CreateOrderInput) {
    const { userId, addressId, items, notes } = data;

    // Validate address belongs to user
    const address = await this.fastify.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new Error('Address not found or does not belong to user');
    }

    // Validate products and check stock
    const productIds = items.map(item => item.productId);
    const products = await this.fastify.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== items.length) {
      throw new Error('Some products not found or inactive');
    }

    // Check stock and minimum order quantity
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.nameEn}`);
      }

      if (item.quantity < product.minOrderQty) {
        throw new Error(`Minimum order quantity for ${product.nameEn} is ${product.minOrderQty}`);
      }

      // Check zone compatibility
      if (!product.zones.includes(address.zone)) {
        throw new Error(`Product ${product.nameEn} is not available in ${address.zone} zone`);
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
        notes: item.notes,
      };
    });

    const deliveryFee = 5000; // Fixed delivery fee (5000 IQD = ~$5)
    const total = subtotal + deliveryFee;

    // Create order in transaction
    const order = await this.fastify.prisma.$transaction(async (prisma) => {
      // Create order
      const newOrder = await prisma.order.create({
        data: {
          userId,
          addressId,
          status: OrderStatus.PENDING,
          subtotal,
          deliveryFee,
          total,
          notes,
          orderItems: {
            create: orderItems,
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              note: 'Order created',
            },
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          address: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              businessName: true,
            },
          },
        },
      });

      // Update product stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Create stock history
        await prisma.stockHistory.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            reason: `Order #${newOrder.id}`,
          },
        });
      }

      return newOrder;
    });

    return order;
  }

  async getOrders(
    page: number = 1,
    limit: number = 20,
    filters: OrderFilters = {},
    userRole?: string,
    userZones?: Zone[]
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    // Zone-based filtering for location admins
    if (userRole === 'LOCATION_ADMIN' && userZones && userZones.length > 0) {
      where.address = {
        zone: { in: userZones },
      };
    } else if (filters.zone) {
      where.address = {
        zone: filters.zone,
      };
    }

    const [orders, total] = await Promise.all([
      this.fastify.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  nameEn: true,
                  nameAr: true,
                  images: true,
                  sku: true,
                },
              },
            },
          },
          address: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              businessName: true,
            },
          },
        },
      }),
      this.fastify.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string, userId?: string, userRole?: string) {
    const where: any = { id: orderId };

    // Shop owners can only see their own orders
    if (userRole === 'SHOP_OWNER' && userId) {
      where.userId = userId;
    }

    const order = await this.fastify.prisma.order.findUnique({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            businessName: true,
            zones: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    userRole?: string
  ) {
    // Validate status transition
    const order = await this.fastify.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Define allowed status transitions
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[order.status].includes(newStatus)) {
      throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    // Update order status
    const updatedOrder = await this.fastify.prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        statusHistory: {
          create: {
            status: newStatus,
            note: note || `Status changed to ${newStatus}`,
          },
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            businessName: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // If order is cancelled, restore stock
    if (newStatus === OrderStatus.CANCELLED) {
      await this.restoreStock(orderId);
    }

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId?: string, userRole?: string) {
    const order = await this.fastify.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Shop owners can only cancel their own pending orders
    if (userRole === 'SHOP_OWNER') {
      if (order.userId !== userId) {
        throw new Error('Not authorized to cancel this order');
      }
      if (order.status !== OrderStatus.PENDING) {
        throw new Error('Can only cancel pending orders');
      }
    }

    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED, 'Order cancelled by user', userRole);
  }

  private async restoreStock(orderId: string) {
    const order = await this.fastify.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) return;

    await this.fastify.prisma.$transaction(
      order.orderItems.map(item =>
        this.fastify.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      )
    );

    // Create stock history for restoration
    await Promise.all(
      order.orderItems.map(item =>
        this.fastify.prisma.stockHistory.create({
          data: {
            productId: item.productId,
            change: item.quantity,
            reason: `Order #${orderId} cancelled`,
          },
        })
      )
    );
  }

  async getOrderStats(zone?: Zone) {
    const where: any = {};
    if (zone) {
      where.address = { zone };
    }

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      this.fastify.prisma.order.count({ where }),
      this.fastify.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.fastify.prisma.order.count({ where: { ...where, status: OrderStatus.CONFIRMED } }),
      this.fastify.prisma.order.count({ where: { ...where, status: OrderStatus.PROCESSING } }),
      this.fastify.prisma.order.count({ where: { ...where, status: OrderStatus.SHIPPED } }),
      this.fastify.prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
      this.fastify.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      this.fastify.prisma.order.aggregate({
        where: { ...where, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    };
  }
}
