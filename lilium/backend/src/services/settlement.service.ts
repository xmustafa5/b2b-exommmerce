import { FastifyInstance } from 'fastify';
import { OrderStatus, PaymentStatus } from '@prisma/client';

interface Settlement {
  id: string;
  companyId: string;
  periodStart: Date;
  periodEnd: Date;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalPayout: number;
  cashCollected: number;
  cashToRemit: number; // Cash that needs to be remitted to platform
  status: 'PENDING' | 'VERIFIED' | 'SETTLED' | 'DISPUTED';
  createdAt: Date;
  settledAt?: Date;
  notes?: string;
}

interface CashReconciliation {
  orderId: string;
  orderAmount: number;
  cashCollected: number;
  collectedBy: string;
  collectedAt: Date;
  verified: boolean;
  discrepancy?: number;
  notes?: string;
}

interface SettlementSummary {
  companyId: string;
  companyName: string;
  period: {
    start: Date;
    end: Date;
  };
  orders: {
    total: number;
    delivered: number;
    cashOrders: number;
    onlineOrders: number;
  };
  financials: {
    totalRevenue: number;
    cashCollected: number;
    onlinePayments: number;
    platformCommission: number;
    vendorPayout: number;
    pendingCash: number;
  };
  cashFlow: {
    toCollect: number;  // Cash to be collected from pending COD orders
    collected: number;  // Cash already collected
    toRemit: number;    // Cash to be remitted to platform (commission)
    remitted: number;   // Cash already remitted
  };
}

export class SettlementService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  /**
   * Create a settlement for a company for a specific period
   */
  async createSettlement(
    companyId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Settlement> {
    try {
      // Get company details
      const company = await this.fastify.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          commissionRate: true
        }
      });

      if (!company) {
        throw this.fastify.httpErrors.notFound('Company not found');
      }

      // Get all delivered orders for the period
      const orders = await this.fastify.prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { companyId }
            }
          },
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        include: {
          items: {
            where: {
              product: { companyId }
            }
          }
        }
      });

      // Calculate totals
      let totalRevenue = 0;
      let cashCollected = 0;
      let totalOrders = orders.length;

      orders.forEach(order => {
        const orderRevenue = order.items.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        );
        totalRevenue += orderRevenue;

        if (order.paymentMethod === 'CASH_ON_DELIVERY' && order.paymentStatus === PaymentStatus.PAID) {
          cashCollected += orderRevenue;
        }
      });

      const commissionRate = (company.commissionRate || 10) / 100;
      const totalCommission = totalRevenue * commissionRate;
      const totalPayout = totalRevenue - totalCommission;
      const cashToRemit = cashCollected * commissionRate; // Platform's commission from cash

      // Create settlement record
      const settlement: Settlement = {
        id: `SET-${Date.now()}`,
        companyId,
        periodStart,
        periodEnd,
        totalOrders,
        totalRevenue,
        totalCommission,
        totalPayout,
        cashCollected,
        cashToRemit,
        status: 'PENDING',
        createdAt: new Date()
      };

      // Store settlement (in production, save to database)
      this.fastify.log.info({
        settlement
      }, 'Settlement created');

      return settlement;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.fastify.httpErrors.badRequest('Failed to create settlement');
    }
  }

  /**
   * Get settlement summary for a company
   */
  async getSettlementSummary(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SettlementSummary> {
    try {
      const company = await this.fastify.prisma.company.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          commissionRate: true
        }
      });

      if (!company) {
        throw this.fastify.httpErrors.notFound('Company not found');
      }

      // Default to last 30 days if no dates provided
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all orders for the period
      const orders = await this.fastify.prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { companyId }
            }
          },
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          items: {
            where: {
              product: { companyId }
            }
          }
        }
      });

      // Calculate metrics
      const totalOrders = orders.length;
      const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
      const cashOrders = orders.filter(o => o.paymentMethod === 'CASH_ON_DELIVERY');
      const onlineOrders = orders.filter(o => o.paymentMethod !== 'CASH_ON_DELIVERY');

      let totalRevenue = 0;
      let cashCollected = 0;
      let onlinePayments = 0;
      let pendingCash = 0;
      let toCollect = 0;

      orders.forEach(order => {
        const orderRevenue = order.items.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        );

        if (order.status === OrderStatus.DELIVERED) {
          totalRevenue += orderRevenue;

          if (order.paymentMethod === 'CASH_ON_DELIVERY') {
            if (order.paymentStatus === PaymentStatus.PAID) {
              cashCollected += orderRevenue;
            } else {
              pendingCash += orderRevenue;
            }
          } else {
            onlinePayments += orderRevenue;
          }
        } else if (order.paymentMethod === 'CASH_ON_DELIVERY' &&
                   [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.ON_THE_WAY].includes(order.status)) {
          toCollect += orderRevenue;
        }
      });

      const commissionRate = (company.commissionRate || 10) / 100;
      const platformCommission = totalRevenue * commissionRate;
      const vendorPayout = totalRevenue - platformCommission;
      const toRemit = cashCollected * commissionRate;

      const summary: SettlementSummary = {
        companyId,
        companyName: company.name,
        period: {
          start,
          end
        },
        orders: {
          total: totalOrders,
          delivered: deliveredOrders.length,
          cashOrders: cashOrders.length,
          onlineOrders: onlineOrders.length
        },
        financials: {
          totalRevenue,
          cashCollected,
          onlinePayments,
          platformCommission,
          vendorPayout,
          pendingCash
        },
        cashFlow: {
          toCollect,
          collected: cashCollected,
          toRemit,
          remitted: 0 // Would track actual remittances
        }
      };

      return summary;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.fastify.httpErrors.internalServerError('Failed to get settlement summary');
    }
  }

  /**
   * Reconcile cash collections for a period
   */
  async reconcileCash(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashReconciliation[]> {
    try {
      // Get all COD orders that should have cash collected
      const cashOrders = await this.fastify.prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { companyId }
            }
          },
          paymentMethod: 'CASH_ON_DELIVERY',
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          items: {
            where: {
              product: { companyId }
            }
          }
        }
      });

      const reconciliations: CashReconciliation[] = [];

      for (const order of cashOrders) {
        const orderAmount = order.items.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        );

        const reconciliation: CashReconciliation = {
          orderId: order.id,
          orderAmount,
          cashCollected: order.paymentStatus === PaymentStatus.PAID ? orderAmount : 0,
          collectedBy: order.assignedDriverId || 'Unknown',
          collectedAt: order.paidAt || order.deliveredAt || new Date(),
          verified: order.paymentStatus === PaymentStatus.PAID,
          discrepancy: order.paymentStatus === PaymentStatus.PAID ? 0 : orderAmount,
          notes: order.paymentStatus !== PaymentStatus.PAID ? 'Cash not yet collected' : undefined
        };

        reconciliations.push(reconciliation);
      }

      return reconciliations;
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to reconcile cash');
    }
  }

  /**
   * Mark cash as collected for an order
   */
  async markCashCollected(
    orderId: string,
    amount: number,
    collectedBy: string
  ): Promise<void> {
    try {
      const order = await this.fastify.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true
        }
      });

      if (!order) {
        throw this.fastify.httpErrors.notFound('Order not found');
      }

      if (order.paymentMethod !== 'CASH_ON_DELIVERY') {
        throw this.fastify.httpErrors.badRequest('Order is not cash on delivery');
      }

      if (order.status !== OrderStatus.DELIVERED) {
        throw this.fastify.httpErrors.badRequest('Order must be delivered first');
      }

      const orderTotal = order.items.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );

      if (Math.abs(amount - orderTotal) > 0.01) {
        throw this.fastify.httpErrors.badRequest(
          `Cash amount (${amount}) does not match order total (${orderTotal})`
        );
      }

      // Update order payment status
      await this.fastify.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date()
        }
      });

      this.fastify.log.info({
        orderId,
        amount,
        collectedBy
      }, 'Cash collection recorded');
    } catch (error) {
      if (error instanceof Error &&
          (error.message.includes('not found') ||
           error.message.includes('not cash') ||
           error.message.includes('must be delivered') ||
           error.message.includes('does not match'))) {
        throw error;
      }
      throw this.fastify.httpErrors.badRequest('Failed to mark cash as collected');
    }
  }

  /**
   * Get pending cash collections for a company
   */
  async getPendingCashCollections(companyId: string): Promise<any[]> {
    try {
      const pendingOrders = await this.fastify.prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { companyId }
            }
          },
          paymentMethod: 'CASH_ON_DELIVERY',
          status: OrderStatus.DELIVERED,
          paymentStatus: {
            not: PaymentStatus.PAID
          }
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
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          deliveredAt: 'desc'
        }
      });

      return pendingOrders.map(order => ({
        ...order,
        orderAmount: order.items.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        ),
        daysPending: order.deliveredAt ?
          Math.floor((new Date().getTime() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
      }));
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to get pending cash collections');
    }
  }

  /**
   * Process daily settlement
   */
  async processDailySettlement(companyId: string): Promise<Settlement> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await this.createSettlement(companyId, today, tomorrow);
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to process daily settlement');
    }
  }

  /**
   * Verify settlement and mark as settled
   */
  async verifySettlement(
    settlementId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<Settlement> {
    try {
      // In production, fetch from database
      const settlement: Settlement = {
        id: settlementId,
        companyId: 'company-id',
        periodStart: new Date(),
        periodEnd: new Date(),
        totalOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalPayout: 0,
        cashCollected: 0,
        cashToRemit: 0,
        status: 'VERIFIED',
        createdAt: new Date(),
        settledAt: new Date(),
        notes: notes || 'Settlement verified'
      };

      this.fastify.log.info({
        settlementId,
        verifiedBy,
        notes
      }, 'Settlement verified');

      return settlement;
    } catch (error) {
      throw this.fastify.httpErrors.badRequest('Failed to verify settlement');
    }
  }

  /**
   * Get settlement history
   */
  async getSettlementHistory(
    companyId: string,
    limit: number = 10
  ): Promise<Settlement[]> {
    try {
      // In production, fetch from database
      // For now, return empty array
      return [];
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to get settlement history');
    }
  }

  /**
   * Calculate platform earnings for a period
   */
  async calculatePlatformEarnings(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const orders = await this.fastify.prisma.order.findMany({
        where: {
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
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

      let totalRevenue = 0;
      let totalCommission = 0;
      const companyBreakdown: Map<string, any> = new Map();

      orders.forEach(order => {
        order.items.forEach(item => {
          const itemRevenue = item.price * item.quantity;
          const company = item.product.company;
          const commissionRate = (company.commissionRate || 10) / 100;
          const itemCommission = itemRevenue * commissionRate;

          totalRevenue += itemRevenue;
          totalCommission += itemCommission;

          if (!companyBreakdown.has(company.id)) {
            companyBreakdown.set(company.id, {
              companyId: company.id,
              companyName: company.name,
              orders: 0,
              revenue: 0,
              commission: 0
            });
          }

          const breakdown = companyBreakdown.get(company.id);
          breakdown.orders += 1;
          breakdown.revenue += itemRevenue;
          breakdown.commission += itemCommission;
        });
      });

      return {
        period: {
          start: startDate,
          end: endDate
        },
        totalOrders: orders.length,
        totalRevenue,
        totalCommission,
        averageCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
        companyBreakdown: Array.from(companyBreakdown.values())
      };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to calculate platform earnings');
    }
  }
}