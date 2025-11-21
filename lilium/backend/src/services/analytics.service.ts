import { FastifyInstance } from 'fastify';
import { OrderStatus, UserRole } from '@prisma/client';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DashboardStats {
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number; // Percentage compared to last period
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  products: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number; // Products with stock < 10
    outOfStock: number;
    bestSelling: Array<{
      productId: string;
      name: string;
      sales: number;
      revenue: number;
    }>;
  };
  customers: {
    total: number;
    new: number; // Last 30 days
    returning: number;
    topCustomers: Array<{
      userId: string;
      name: string;
      orderCount: number;
      totalSpent: number;
    }>;
  };
  performance: {
    averageOrderValue: number;
    conversionRate: number;
    fulfillmentRate: number;
    averageDeliveryTime: number; // In hours
  };
}

interface SalesReport {
  period: DateRange;
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  topProducts: any[];
  topCategories: any[];
  salesByDate: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  salesByZone: Array<{
    zone: string;
    sales: number;
    orders: number;
  }>;
}

interface CommissionReport {
  period: DateRange;
  totalRevenue: number;
  totalCommission: number;
  totalPayout: number;
  commissionRate: number;
  transactions: Array<{
    orderId: string;
    date: Date;
    amount: number;
    commission: number;
    payout: number;
    status: string;
  }>;
}

export class AnalyticsService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  // Get vendor dashboard statistics
  async getVendorDashboard(userId: string): Promise<DashboardStats> {
    try {
      const user = await this.fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true, role: true }
      });

      if (!user?.companyId) {
        throw this.fastify.httpErrors.badRequest('User not associated with any company');
      }

      // Get date ranges
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Revenue calculations
      const revenueData = await this.calculateRevenue(user.companyId, {
        today,
        thisWeekStart,
        thisMonthStart,
        lastMonthStart,
        lastMonthEnd
      });

      // Order statistics
      const orderStats = await this.calculateOrderStats(user.companyId, {
        today,
        thisWeekStart,
        thisMonthStart
      });

      // Product statistics
      const productStats = await this.calculateProductStats(user.companyId);

      // Customer statistics
      const customerStats = await this.calculateCustomerStats(user.companyId);

      // Performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(user.companyId);

      return {
        revenue: revenueData,
        orders: orderStats,
        products: productStats,
        customers: customerStats,
        performance: performanceMetrics
      };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to generate dashboard statistics');
    }
  }

  // Calculate revenue data
  private async calculateRevenue(companyId: string, dates: any) {
    const { today, thisWeekStart, thisMonthStart, lastMonthStart, lastMonthEnd } = dates;

    // Total revenue
    const totalRevenue = await this.fastify.prisma.orderItem.aggregate({
      where: {
        product: { companyId },
        order: { status: 'COMPLETED' }
      },
      _sum: {
        price: true,
        quantity: true
      }
    });

    const total = (totalRevenue._sum.price || 0) * (totalRevenue._sum.quantity || 1);

    // Today's revenue
    const todayRevenue = await this.fastify.prisma.orderItem.aggregate({
      where: {
        product: { companyId },
        order: {
          status: 'COMPLETED',
          createdAt: { gte: today }
        }
      },
      _sum: {
        price: true,
        quantity: true
      }
    });

    const todayTotal = (todayRevenue._sum.price || 0) * (todayRevenue._sum.quantity || 1);

    // This week's revenue
    const weekRevenue = await this.fastify.prisma.orderItem.aggregate({
      where: {
        product: { companyId },
        order: {
          status: 'COMPLETED',
          createdAt: { gte: thisWeekStart }
        }
      },
      _sum: {
        price: true,
        quantity: true
      }
    });

    const weekTotal = (weekRevenue._sum.price || 0) * (weekRevenue._sum.quantity || 1);

    // This month's revenue
    const monthRevenue = await this.fastify.prisma.orderItem.aggregate({
      where: {
        product: { companyId },
        order: {
          status: 'COMPLETED',
          createdAt: { gte: thisMonthStart }
        }
      },
      _sum: {
        price: true,
        quantity: true
      }
    });

    const monthTotal = (monthRevenue._sum.price || 0) * (monthRevenue._sum.quantity || 1);

    // Last month's revenue for growth calculation
    const lastMonthRevenue = await this.fastify.prisma.orderItem.aggregate({
      where: {
        product: { companyId },
        order: {
          status: 'COMPLETED',
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      },
      _sum: {
        price: true,
        quantity: true
      }
    });

    const lastMonthTotal = (lastMonthRevenue._sum.price || 0) * (lastMonthRevenue._sum.quantity || 1);

    // Calculate growth percentage
    const growth = lastMonthTotal > 0
      ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    return {
      total,
      today: todayTotal,
      thisWeek: weekTotal,
      thisMonth: monthTotal,
      growth: Math.round(growth * 100) / 100
    };
  }

  // Calculate order statistics
  private async calculateOrderStats(companyId: string, dates: any) {
    const { today, thisWeekStart, thisMonthStart } = dates;

    // Get orders with company products
    const orders = await this.fastify.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: { companyId }
          }
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true
      }
    });

    // Count by status
    const statusCounts = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      processing: orders.filter(o => o.status === 'PROCESSING').length,
      completed: orders.filter(o => o.status === 'COMPLETED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      today: orders.filter(o => o.createdAt >= today).length,
      thisWeek: orders.filter(o => o.createdAt >= thisWeekStart).length,
      thisMonth: orders.filter(o => o.createdAt >= thisMonthStart).length
    };

    return statusCounts;
  }

  // Calculate product statistics
  private async calculateProductStats(companyId: string) {
    // Get all products
    const products = await this.fastify.prisma.product.findMany({
      where: { companyId },
      select: {
        id: true,
        nameEn: true,
        stock: true,
        isActive: true,
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    });

    // Count product statuses
    const stats = {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      inactive: products.filter(p => !p.isActive).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      bestSelling: [] as any[]
    };

    // Get best selling products
    const bestSelling = await this.fastify.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        product: { companyId }
      },
      _sum: {
        quantity: true,
        price: true
      },
      _count: true,
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    // Map best selling products with names
    stats.bestSelling = await Promise.all(
      bestSelling.map(async (item) => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name: product?.nameEn || 'Unknown',
          sales: item._sum.quantity || 0,
          revenue: (item._sum.price || 0) * (item._sum.quantity || 1)
        };
      })
    );

    return stats;
  }

  // Calculate customer statistics
  private async calculateCustomerStats(companyId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get unique customers
    const customers = await this.fastify.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: { companyId }
          }
        }
      },
      select: {
        userId: true,
        createdAt: true,
        totalAmount: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      distinct: ['userId']
    });

    // Count new vs returning
    const newCustomers = customers.filter(c => c.createdAt >= thirtyDaysAgo).length;

    // Get top customers
    const customerOrders = await this.fastify.prisma.order.groupBy({
      by: ['userId'],
      where: {
        items: {
          some: {
            product: { companyId }
          }
        }
      },
      _count: true,
      _sum: {
        totalAmount: true
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 5
    });

    // Map top customers with user details
    const topCustomers = await Promise.all(
      customerOrders.map(async (customer) => {
        const user = await this.fastify.prisma.user.findUnique({
          where: { id: customer.userId },
          select: { name: true }
        });

        return {
          userId: customer.userId,
          name: user?.name || 'Unknown',
          orderCount: customer._count,
          totalSpent: customer._sum.totalAmount || 0
        };
      })
    );

    return {
      total: customers.length,
      new: newCustomers,
      returning: customers.length - newCustomers,
      topCustomers
    };
  }

  // Calculate performance metrics
  private async calculatePerformanceMetrics(companyId: string) {
    // Average order value
    const orderValues = await this.fastify.prisma.order.aggregate({
      where: {
        items: {
          some: {
            product: { companyId }
          }
        }
      },
      _avg: {
        totalAmount: true
      },
      _count: true
    });

    // Fulfillment rate (completed orders / total orders)
    const completedOrders = await this.fastify.prisma.order.count({
      where: {
        items: {
          some: {
            product: { companyId }
          }
        },
        status: 'COMPLETED'
      }
    });

    const fulfillmentRate = orderValues._count > 0
      ? (completedOrders / orderValues._count) * 100
      : 0;

    // Average delivery time (for completed orders)
    const completedOrdersWithTime = await this.fastify.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: { companyId }
          }
        },
        status: 'COMPLETED',
        completedAt: { not: null }
      },
      select: {
        createdAt: true,
        completedAt: true
      }
    });

    let averageDeliveryTime = 0;
    if (completedOrdersWithTime.length > 0) {
      const totalTime = completedOrdersWithTime.reduce((acc, order) => {
        if (order.completedAt) {
          const diff = order.completedAt.getTime() - order.createdAt.getTime();
          return acc + diff;
        }
        return acc;
      }, 0);

      // Convert to hours
      averageDeliveryTime = totalTime / completedOrdersWithTime.length / (1000 * 60 * 60);
    }

    return {
      averageOrderValue: orderValues._avg.totalAmount || 0,
      conversionRate: 0, // Would need visitor tracking to calculate properly
      fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
      averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10
    };
  }

  // Generate sales report
  async generateSalesReport(companyId: string, dateRange: DateRange): Promise<SalesReport> {
    try {
      const { startDate, endDate } = dateRange;

      // Get all orders in date range
      const orders = await this.fastify.prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { companyId }
            }
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          items: {
            where: {
              product: { companyId }
            },
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          },
          user: true,
          address: true
        }
      });

      // Calculate totals
      let totalSales = 0;
      const productSales = new Map();
      const categorySales = new Map();
      const dailySales = new Map();
      const zoneSales = new Map();
      const uniqueCustomers = new Set();

      orders.forEach(order => {
        const orderDate = order.createdAt.toISOString().split('T')[0];
        uniqueCustomers.add(order.userId);

        order.items.forEach(item => {
          const itemTotal = item.price * item.quantity;
          totalSales += itemTotal;

          // Product sales
          if (productSales.has(item.productId)) {
            productSales.get(item.productId).sales += itemTotal;
            productSales.get(item.productId).quantity += item.quantity;
          } else {
            productSales.set(item.productId, {
              productId: item.productId,
              name: item.product.nameEn,
              sales: itemTotal,
              quantity: item.quantity
            });
          }

          // Category sales
          if (item.product.categoryId) {
            if (categorySales.has(item.product.categoryId)) {
              categorySales.get(item.product.categoryId).sales += itemTotal;
            } else {
              categorySales.set(item.product.categoryId, {
                categoryId: item.product.categoryId,
                name: item.product.category?.nameEn || 'Uncategorized',
                sales: itemTotal
              });
            }
          }

          // Daily sales
          if (dailySales.has(orderDate)) {
            dailySales.get(orderDate).sales += itemTotal;
            dailySales.get(orderDate).orders += 1;
          } else {
            dailySales.set(orderDate, {
              date: orderDate,
              sales: itemTotal,
              orders: 1
            });
          }

          // Zone sales
          const zone = order.address?.zone || 'Unknown';
          if (zoneSales.has(zone)) {
            zoneSales.get(zone).sales += itemTotal;
            zoneSales.get(zone).orders += 1;
          } else {
            zoneSales.set(zone, {
              zone,
              sales: itemTotal,
              orders: 1
            });
          }
        });
      });

      // Sort and convert to arrays
      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      const topCategories = Array.from(categorySales.values())
        .sort((a, b) => b.sales - a.sales);

      const salesByDate = Array.from(dailySales.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const salesByZone = Array.from(zoneSales.values())
        .sort((a, b) => b.sales - a.sales);

      return {
        period: dateRange,
        totalSales,
        totalOrders: orders.length,
        totalCustomers: uniqueCustomers.size,
        averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
        topProducts,
        topCategories,
        salesByDate,
        salesByZone
      };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to generate sales report');
    }
  }

  // Generate commission report for vendors
  async generateCommissionReport(companyId: string, dateRange: DateRange): Promise<CommissionReport> {
    try {
      const { startDate, endDate } = dateRange;

      // Get company commission rate
      const company = await this.fastify.prisma.company.findUnique({
        where: { id: companyId },
        select: { commissionRate: true }
      });

      const commissionRate = company?.commissionRate || 10;

      // Get completed orders
      const orders = await this.fastify.prisma.order.findMany({
        where: {
          items: {
            some: {
              product: { companyId }
            }
          },
          status: 'COMPLETED',
          completedAt: {
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

      // Calculate commissions
      let totalRevenue = 0;
      let totalCommission = 0;
      const transactions = [];

      for (const order of orders) {
        let orderRevenue = 0;

        for (const item of order.items) {
          orderRevenue += item.price * item.quantity;
        }

        const orderCommission = orderRevenue * (commissionRate / 100);
        const orderPayout = orderRevenue - orderCommission;

        totalRevenue += orderRevenue;
        totalCommission += orderCommission;

        transactions.push({
          orderId: order.id,
          date: order.completedAt!,
          amount: orderRevenue,
          commission: orderCommission,
          payout: orderPayout,
          status: 'COMPLETED'
        });
      }

      return {
        period: dateRange,
        totalRevenue,
        totalCommission,
        totalPayout: totalRevenue - totalCommission,
        commissionRate,
        transactions
      };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to generate commission report');
    }
  }

  // Get admin dashboard overview
  async getAdminDashboard(): Promise<any> {
    try {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Platform-wide statistics
      const [
        totalUsers,
        totalVendors,
        totalShopOwners,
        totalCompanies,
        activeCompanies,
        totalProducts,
        totalOrders,
        todayOrders,
        monthOrders,
        totalRevenue
      ] = await Promise.all([
        this.fastify.prisma.user.count(),
        this.fastify.prisma.user.count({ where: { role: UserRole.VENDOR } }),
        this.fastify.prisma.user.count({ where: { role: UserRole.SHOP_OWNER } }),
        this.fastify.prisma.company.count(),
        this.fastify.prisma.company.count({ where: { isActive: true } }),
        this.fastify.prisma.product.count(),
        this.fastify.prisma.order.count(),
        this.fastify.prisma.order.count({ where: { createdAt: { gte: today } } }),
        this.fastify.prisma.order.count({ where: { createdAt: { gte: thisMonthStart } } }),
        this.fastify.prisma.order.aggregate({ _sum: { totalAmount: true } })
      ]);

      // Top performing companies
      const topCompanies = await this.fastify.prisma.order.groupBy({
        by: ['items'],
        _sum: {
          totalAmount: true
        },
        _count: true,
        orderBy: {
          _sum: {
            totalAmount: 'desc'
          }
        },
        take: 5
      });

      return {
        overview: {
          totalUsers,
          totalVendors,
          totalShopOwners,
          totalCompanies,
          activeCompanies,
          totalProducts,
          totalOrders,
          todayOrders,
          monthOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0
        },
        topCompanies
      };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to generate admin dashboard');
    }
  }
}