import { FastifyInstance } from 'fastify';
import { OrderStatus, UserRole, Zone } from '@prisma/client';

interface DeliveryAssignment {
  orderId: string;
  driverId: string;
  assignedAt: Date;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryNotes?: string;
  cashCollected?: number;
  deliveryProof?: string; // URL to signature or photo
}

interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  notes?: string;
  estimatedTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface DeliveryMetrics {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  onTimeRate: number;
  averageDeliveryTime: number;
  totalCashCollected: number;
  todayDeliveries: number;
}

interface CashCollection {
  orderId: string;
  amount: number;
  collectedAt: Date;
  collectedBy: string;
  verified: boolean;
  notes?: string;
}

export class DeliveryService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Update order status in the delivery workflow
   */
  async updateOrderStatus(data: OrderStatusUpdate, updatedBy: string): Promise<any> {
    try {
      const order = await this.fastify.prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  company: true
                }
              }
            }
          },
          user: true
        }
      });

      if (!order) {
        throw this.fastify.httpErrors.notFound('Order not found');
      }

      // Validate status transition
      this.validateStatusTransition(order.status, data.status);

      // Update order status
      const updatedOrder = await this.fastify.prisma.order.update({
        where: { id: data.orderId },
        data: {
          status: data.status,
          updatedAt: new Date(),
          // Add status-specific timestamps
          ...(data.status === OrderStatus.ACCEPTED && { acceptedAt: new Date() }),
          ...(data.status === OrderStatus.PREPARING && { preparingAt: new Date() }),
          ...(data.status === OrderStatus.ON_THE_WAY && { dispatchedAt: new Date() }),
          ...(data.status === OrderStatus.DELIVERED && {
            deliveredAt: new Date(),
            completedAt: new Date()
          }),
          ...(data.status === OrderStatus.CANCELLED && { cancelledAt: new Date() })
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      });

      // Create status history entry
      await this.createStatusHistory(data.orderId, data.status, updatedBy, data.notes);

      // Send notifications based on status
      await this.sendStatusNotification(updatedOrder, data.status);

      return updatedOrder;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.fastify.httpErrors.badRequest('Failed to update order status');
    }
  }

  /**
   * Validate if status transition is allowed
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.ON_THE_WAY, OrderStatus.CANCELLED],
      [OrderStatus.ON_THE_WAY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [], // No transitions from delivered
      [OrderStatus.CANCELLED]: [], // No transitions from cancelled
      [OrderStatus.COMPLETED]: [], // No transitions from completed
      [OrderStatus.REFUNDED]: []   // No transitions from refunded
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw this.fastify.httpErrors.badRequest(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Create status history entry
   */
  private async createStatusHistory(
    orderId: string,
    status: OrderStatus,
    updatedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      // Store in a JSON field or separate table
      // For now, we'll log it
      this.fastify.log.info({
        orderId,
        status,
        updatedBy,
        notes,
        timestamp: new Date()
      }, 'Order status history');
    } catch (error) {
      this.fastify.log.error(error, 'Failed to create status history');
    }
  }

  /**
   * Send notification based on order status
   */
  private async sendStatusNotification(order: any, status: OrderStatus): Promise<void> {
    try {
      const notifications: Record<OrderStatus, string> = {
        [OrderStatus.ACCEPTED]: 'Your order has been accepted and is being prepared',
        [OrderStatus.PREPARING]: 'Your order is being prepared',
        [OrderStatus.ON_THE_WAY]: 'Your order is on the way! The delivery driver will arrive soon',
        [OrderStatus.DELIVERED]: 'Your order has been delivered. Thank you for your purchase!',
        [OrderStatus.CANCELLED]: 'Your order has been cancelled',
        [OrderStatus.PENDING]: 'Your order is pending confirmation',
        [OrderStatus.COMPLETED]: 'Your order has been completed',
        [OrderStatus.REFUNDED]: 'Your order has been refunded'
      };

      const message = notifications[status];
      if (message) {
        // In production, send actual notification (SMS, push, email)
        this.fastify.log.info({
          userId: order.userId,
          orderId: order.id,
          message
        }, 'Notification sent');
      }
    } catch (error) {
      this.fastify.log.error(error, 'Failed to send notification');
    }
  }

  /**
   * Assign delivery driver to order
   */
  async assignDriver(orderId: string, driverId: string): Promise<DeliveryAssignment> {
    try {
      const order = await this.fastify.prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw this.fastify.httpErrors.notFound('Order not found');
      }

      if (order.status !== OrderStatus.PREPARING) {
        throw this.fastify.httpErrors.badRequest(
          'Order must be in PREPARING status to assign driver'
        );
      }

      // Create delivery assignment
      const assignment: DeliveryAssignment = {
        orderId,
        driverId,
        assignedAt: new Date(),
        estimatedDeliveryTime: this.calculateEstimatedDeliveryTime(order)
      };

      // Update order with driver info
      await this.fastify.prisma.order.update({
        where: { id: orderId },
        data: {
          assignedDriverId: driverId,
          status: OrderStatus.ON_THE_WAY
        }
      });

      return assignment;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.fastify.httpErrors.badRequest('Failed to assign driver');
    }
  }

  /**
   * Calculate estimated delivery time based on zone and current load
   */
  private calculateEstimatedDeliveryTime(order: any): Date {
    const baseTime = 30; // Base 30 minutes
    const zoneTime: Record<Zone, number> = {
      [Zone.KARKH]: 20,
      [Zone.RUSAFA]: 25,
      [Zone.KADHMIYA]: 30,
      [Zone.ADHAMIYA]: 30,
      [Zone.SADR_CITY]: 35,
      [Zone.NEW_BAGHDAD]: 25,
      [Zone.MANSOUR]: 20,
      [Zone.KARRADA]: 25
    };

    const additionalTime = zoneTime[order.zone as Zone] || 30;
    const totalMinutes = baseTime + additionalTime;

    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + totalMinutes);
    return estimatedTime;
  }

  /**
   * Record cash collection for COD order
   */
  async recordCashCollection(data: {
    orderId: string;
    amount: number;
    collectedBy: string;
    notes?: string;
  }): Promise<CashCollection> {
    try {
      const order = await this.fastify.prisma.order.findUnique({
        where: { id: data.orderId }
      });

      if (!order) {
        throw this.fastify.httpErrors.notFound('Order not found');
      }

      if (order.paymentMethod !== 'CASH_ON_DELIVERY') {
        throw this.fastify.httpErrors.badRequest('Order is not cash on delivery');
      }

      if (order.status !== OrderStatus.DELIVERED) {
        throw this.fastify.httpErrors.badRequest('Order must be delivered to collect cash');
      }

      // Verify amount matches order total
      if (Math.abs(data.amount - order.totalAmount) > 0.01) {
        throw this.fastify.httpErrors.badRequest(
          `Cash amount (${data.amount}) does not match order total (${order.totalAmount})`
        );
      }

      // Record cash collection
      const collection: CashCollection = {
        orderId: data.orderId,
        amount: data.amount,
        collectedAt: new Date(),
        collectedBy: data.collectedBy,
        verified: false,
        notes: data.notes
      };

      // Update order payment status
      await this.fastify.prisma.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date()
        }
      });

      return collection;
    } catch (error) {
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('does not match'))) {
        throw error;
      }
      throw this.fastify.httpErrors.badRequest('Failed to record cash collection');
    }
  }

  /**
   * Get delivery metrics for vendor/company (or all companies if companyId is null)
   */
  async getDeliveryMetrics(companyId: string | null, period: 'today' | 'week' | 'month' = 'today'): Promise<DeliveryMetrics> {
    try {
      const startDate = this.getStartDate(period);

      const orders = await this.fastify.prisma.order.findMany({
        where: {
          // If companyId is provided, filter by company; otherwise get all orders
          ...(companyId && {
            items: {
              some: {
                product: { companyId }
              }
            }
          }),
          createdAt: {
            gte: startDate
          }
        }
      });

      const totalDeliveries = orders.length;
      const completedDeliveries = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
      // Use correct Prisma OrderStatus values:
      // CONFIRMED = accepted, PROCESSING = preparing, SHIPPED = on the way
      const pendingDeliveries = orders.filter(o =>
        [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED].includes(o.status)
      ).length;

      // Calculate on-time rate (delivered within estimated time)
      const onTimeDeliveries = orders.filter(o => {
        if (o.status !== OrderStatus.DELIVERED) return false;
        // Check if delivered within estimated time
        return true; // Simplified for now
      }).length;

      const onTimeRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

      // Calculate average delivery time
      const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
      let totalDeliveryTime = 0;

      deliveredOrders.forEach(order => {
        if (order.deliveredAt && order.createdAt) {
          const deliveryTime = order.deliveredAt.getTime() - order.createdAt.getTime();
          totalDeliveryTime += deliveryTime;
        }
      });

      const averageDeliveryTime = deliveredOrders.length > 0
        ? totalDeliveryTime / deliveredOrders.length / (1000 * 60) // Convert to minutes
        : 0;

      // Calculate total cash collected
      const cashOrders = orders.filter(o =>
        o.paymentMethod === 'CASH_ON_DELIVERY' &&
        o.paymentStatus === 'PAID'
      );

      const totalCashCollected = cashOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      // Today's deliveries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDeliveries = orders.filter(o =>
        o.createdAt >= today
      ).length;

      return {
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries,
        onTimeRate,
        averageDeliveryTime,
        totalCashCollected,
        todayDeliveries
      };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to get delivery metrics');
    }
  }

  /**
   * Get start date based on period
   */
  private getStartDate(period: 'today' | 'week' | 'month'): Date {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return startDate;
  }

  /**
   * Get orders by status for vendor
   */
  async getOrdersByStatus(companyId: string, status: OrderStatus): Promise<any[]> {
    try {
      const orders = await this.fastify.prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { companyId }
            }
          },
          status
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true
            }
          },
          items: {
            where: {
              product: { companyId }
            },
            include: {
              product: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return orders.map(order => ({
        ...order,
        estimatedDeliveryTime: this.calculateEstimatedDeliveryTime(order)
      }));
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to get orders by status');
    }
  }

  /**
   * Track delivery in real-time
   */
  async trackDelivery(orderId: string): Promise<any> {
    try {
      const order = await this.fastify.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: {
                include: {
                  company: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw this.fastify.httpErrors.notFound('Order not found');
      }

      // Get delivery assignment info
      const trackingInfo = {
        orderId: order.id,
        status: order.status,
        statusHistory: [], // Would fetch from history table
        estimatedDeliveryTime: this.calculateEstimatedDeliveryTime(order),
        driver: order.assignedDriverId ? {
          id: order.assignedDriverId,
          name: 'Driver Name', // Would fetch from driver table
          phone: 'Driver Phone',
          location: null // Would get real-time location
        } : null,
        delivery: {
          address: order.deliveryAddress,
          zone: order.zone,
          instructions: order.deliveryInstructions
        },
        timeline: {
          ordered: order.createdAt,
          accepted: order.acceptedAt,
          preparing: order.preparingAt,
          dispatched: order.dispatchedAt,
          delivered: order.deliveredAt
        }
      };

      return trackingInfo;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.fastify.httpErrors.internalServerError('Failed to track delivery');
    }
  }

  /**
   * Bulk update order statuses
   */
  async bulkUpdateStatus(
    orderIds: string[],
    status: OrderStatus,
    updatedBy: string
  ): Promise<{ updated: number; failed: number }> {
    try {
      let updated = 0;
      let failed = 0;

      for (const orderId of orderIds) {
        try {
          await this.updateOrderStatus({ orderId, status }, updatedBy);
          updated++;
        } catch (error) {
          failed++;
          this.fastify.log.error({ orderId, error }, 'Failed to update order status in bulk');
        }
      }

      return { updated, failed };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to bulk update statuses');
    }
  }
}