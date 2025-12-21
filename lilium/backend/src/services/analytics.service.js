"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const client_1 = require("@prisma/client");
class AnalyticsService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    // ============================================
    // Admin Dashboard Analytics
    // ============================================
    // Get dashboard overview stats
    async getDashboardStats(filter = {}) {
        const { startDate, endDate, zone } = filter;
        const dateFilter = {};
        if (startDate)
            dateFilter.gte = startDate;
        if (endDate)
            dateFilter.lte = endDate;
        const orderWhereClause = {};
        if (Object.keys(dateFilter).length > 0)
            orderWhereClause.createdAt = dateFilter;
        if (zone)
            orderWhereClause.zone = zone;
        // Run all queries in parallel for performance
        const [totalOrders, totalSalesResult, totalProducts, totalUsers, totalCategories, pendingOrders, lowStockProducts, outOfStockProducts, activePromotions, recentOrders, salesByZoneResult, ordersByStatusResult,] = await Promise.all([
            this.fastify.prisma.order.count({ where: orderWhereClause }),
            this.fastify.prisma.order.aggregate({
                where: { ...orderWhereClause, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
                _sum: { total: true },
            }),
            this.fastify.prisma.product.count({ where: zone ? { zones: { has: zone } } : {} }),
            this.fastify.prisma.user.count({ where: { role: 'SHOP_OWNER', isActive: true } }),
            this.fastify.prisma.category.count({ where: { isActive: true } }),
            this.fastify.prisma.order.count({ where: { ...orderWhereClause, status: 'PENDING' } }),
            this.fastify.prisma.product.count({ where: { stock: { gt: 0, lt: 10 }, isActive: true } }),
            this.fastify.prisma.product.count({ where: { stock: 0, isActive: true } }),
            this.fastify.prisma.promotion.count({
                where: {
                    isActive: true,
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() },
                },
            }),
            this.fastify.prisma.order.findMany({
                where: orderWhereClause,
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, businessName: true } },
                    items: { include: { product: { select: { nameEn: true, nameAr: true } } } },
                },
            }),
            this.fastify.prisma.order.groupBy({
                by: ['zone'],
                where: { ...orderWhereClause, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
                _sum: { total: true },
                _count: true,
            }),
            this.fastify.prisma.order.groupBy({
                by: ['status'],
                where: orderWhereClause,
                _count: true,
            }),
        ]);
        const totalSales = totalSalesResult._sum.total || 0;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        return {
            totalOrders,
            totalSales,
            totalProducts,
            totalUsers,
            totalCategories,
            avgOrderValue: Math.round(avgOrderValue * 100) / 100,
            pendingOrders,
            lowStockProducts,
            outOfStockProducts,
            activePromotions,
            recentOrders,
            salesByZone: salesByZoneResult.map((item) => ({
                zone: item.zone,
                total: item._sum.total || 0,
                count: item._count,
            })),
            ordersByStatus: ordersByStatusResult.map((item) => ({
                status: item.status,
                count: item._count,
            })),
        };
    }
    // Get sales analytics
    async getSalesStats(filter = {}) {
        const { startDate, endDate, zone } = filter;
        const effectiveStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const effectiveEndDate = endDate || new Date();
        const orderWhereClause = {
            createdAt: { gte: effectiveStartDate, lte: effectiveEndDate },
            status: { notIn: ['CANCELLED', 'REFUNDED'] },
        };
        if (zone)
            orderWhereClause.zone = zone;
        const [totalSalesResult, totalOrders, salesByZoneResult, salesByPaymentMethodResult, topCustomersResult, dailySalesResult,] = await Promise.all([
            this.fastify.prisma.order.aggregate({
                where: orderWhereClause,
                _sum: { total: true },
            }),
            this.fastify.prisma.order.count({ where: orderWhereClause }),
            this.fastify.prisma.order.groupBy({
                by: ['zone'],
                where: orderWhereClause,
                _sum: { total: true },
                _count: true,
            }),
            this.fastify.prisma.order.groupBy({
                by: ['paymentMethod'],
                where: { ...orderWhereClause, paymentMethod: { not: null } },
                _sum: { total: true },
                _count: true,
            }),
            this.fastify.prisma.order.groupBy({
                by: ['userId'],
                where: orderWhereClause,
                _sum: { total: true },
                _count: true,
                orderBy: { _sum: { total: 'desc' } },
                take: 10,
            }),
            zone
                ? this.fastify.prisma.$queryRaw `
            SELECT
              DATE("createdAt") as date,
              SUM(total) as total,
              COUNT(*) as count
            FROM "Order"
            WHERE "createdAt" >= ${effectiveStartDate}
              AND "createdAt" <= ${effectiveEndDate}
              AND status NOT IN ('CANCELLED', 'REFUNDED')
              AND zone = ${zone}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `
                : this.fastify.prisma.$queryRaw `
            SELECT
              DATE("createdAt") as date,
              SUM(total) as total,
              COUNT(*) as count
            FROM "Order"
            WHERE "createdAt" >= ${effectiveStartDate}
              AND "createdAt" <= ${effectiveEndDate}
              AND status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `,
        ]);
        const customerIds = topCustomersResult.map((c) => c.userId);
        const customers = await this.fastify.prisma.user.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true, businessName: true },
        });
        const customerMap = new Map(customers.map((c) => [c.id, c]));
        const totalSales = totalSalesResult._sum.total || 0;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        return {
            totalSales,
            totalOrders,
            avgOrderValue: Math.round(avgOrderValue * 100) / 100,
            salesByDay: dailySalesResult.map((item) => ({
                date: item.date.toISOString().split('T')[0],
                total: Number(item.total) || 0,
                count: Number(item.count) || 0,
            })),
            salesByZone: salesByZoneResult.map((item) => ({
                zone: item.zone,
                total: item._sum.total || 0,
                count: item._count,
            })),
            salesByPaymentMethod: salesByPaymentMethodResult.map((item) => ({
                method: item.paymentMethod || 'unknown',
                total: item._sum.total || 0,
                count: item._count,
            })),
            topCustomers: topCustomersResult.map((item) => {
                const customer = customerMap.get(item.userId);
                return {
                    userId: item.userId,
                    name: customer?.name || 'Unknown',
                    businessName: customer?.businessName || null,
                    total: item._sum.total || 0,
                    orderCount: item._count,
                };
            }),
        };
    }
    // Get product analytics
    async getProductStats(filter = {}) {
        const { startDate, endDate, zone } = filter;
        const productWhereClause = {};
        if (zone)
            productWhereClause.zones = { has: zone };
        const orderItemDateFilter = {};
        if (startDate)
            orderItemDateFilter.gte = startDate;
        if (endDate)
            orderItemDateFilter.lte = endDate;
        const [totalProducts, activeProducts, featuredProducts, lowStockProducts, outOfStockProducts, productsByCategory, topSellingProducts,] = await Promise.all([
            this.fastify.prisma.product.count({ where: productWhereClause }),
            this.fastify.prisma.product.count({ where: { ...productWhereClause, isActive: true } }),
            this.fastify.prisma.product.count({ where: { ...productWhereClause, isFeatured: true, isActive: true } }),
            this.fastify.prisma.product.count({ where: { ...productWhereClause, stock: { gt: 0, lt: 10 }, isActive: true } }),
            this.fastify.prisma.product.count({ where: { ...productWhereClause, stock: 0, isActive: true } }),
            this.fastify.prisma.product.groupBy({
                by: ['categoryId'],
                where: productWhereClause,
                _count: true,
            }),
            this.fastify.prisma.orderItem.groupBy({
                by: ['productId'],
                where: {
                    order: {
                        status: { notIn: ['CANCELLED', 'REFUNDED'] },
                        ...(Object.keys(orderItemDateFilter).length > 0 ? { createdAt: orderItemDateFilter } : {}),
                    },
                },
                _sum: { quantity: true, total: true },
                orderBy: { _sum: { total: 'desc' } },
                take: 20,
            }),
        ]);
        const categoryIds = productsByCategory.map((p) => p.categoryId);
        const categories = await this.fastify.prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, nameEn: true },
        });
        const categoryMap = new Map(categories.map((c) => [c.id, c.nameEn]));
        const productIds = topSellingProducts.map((p) => p.productId);
        const products = await this.fastify.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, nameEn: true, nameAr: true, sku: true, stock: true, price: true, images: true, category: { select: { nameEn: true } } },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        const revenueByCategory = await this.fastify.prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    status: { notIn: ['CANCELLED', 'REFUNDED'] },
                    ...(Object.keys(orderItemDateFilter).length > 0 ? { createdAt: orderItemDateFilter } : {}),
                },
            },
            _sum: { total: true },
        });
        const allProductsForRevenue = await this.fastify.prisma.product.findMany({
            where: { id: { in: revenueByCategory.map(r => r.productId) } },
            select: { id: true, categoryId: true, category: { select: { nameEn: true } } },
        });
        const productCategoryMap = new Map(allProductsForRevenue.map((p) => [p.id, { categoryId: p.categoryId, categoryName: p.category?.nameEn || 'Unknown' }]));
        const categoryRevenueMap = new Map();
        for (const item of revenueByCategory) {
            const categoryInfo = productCategoryMap.get(item.productId);
            if (categoryInfo) {
                const existing = categoryRevenueMap.get(categoryInfo.categoryId);
                if (existing) {
                    existing.revenue += item._sum.total || 0;
                }
                else {
                    categoryRevenueMap.set(categoryInfo.categoryId, {
                        categoryId: categoryInfo.categoryId,
                        categoryName: categoryInfo.categoryName,
                        revenue: item._sum.total || 0,
                    });
                }
            }
        }
        return {
            totalProducts,
            activeProducts,
            featuredProducts,
            lowStockProducts,
            outOfStockProducts,
            topSellingProducts: topSellingProducts.map((item) => {
                const product = productMap.get(item.productId);
                return {
                    productId: item.productId,
                    name: product?.nameEn || 'Unknown',
                    nameAr: product?.nameAr || 'Unknown',
                    sku: product?.sku || '',
                    stock: product?.stock || 0,
                    price: product?.price || 0,
                    image: product?.images?.[0] || null,
                    category: product?.category?.nameEn || 'Unknown',
                    totalQuantitySold: item._sum.quantity || 0,
                    totalRevenue: item._sum.total || 0,
                };
            }),
            productsByCategory: productsByCategory.map((item) => ({
                categoryId: item.categoryId,
                categoryName: categoryMap.get(item.categoryId) || 'Unknown',
                count: item._count,
            })),
            revenueByCategory: Array.from(categoryRevenueMap.values()).sort((a, b) => b.revenue - a.revenue),
        };
    }
    // Get notify request analytics
    async getNotifyRequestStats(filter = {}) {
        const { startDate, endDate } = filter;
        const dateFilter = {};
        if (startDate)
            dateFilter.gte = startDate;
        if (endDate)
            dateFilter.lte = endDate;
        const whereClause = {};
        if (Object.keys(dateFilter).length > 0)
            whereClause.createdAt = dateFilter;
        const [totalRequests, pendingRequests, notifiedRequests, requestsByProduct, requestsTrend,] = await Promise.all([
            this.fastify.prisma.notifyMe.count({ where: whereClause }),
            this.fastify.prisma.notifyMe.count({ where: { ...whereClause, notified: false } }),
            this.fastify.prisma.notifyMe.count({ where: { ...whereClause, notified: true } }),
            this.fastify.prisma.notifyMe.groupBy({
                by: ['productId'],
                where: whereClause,
                _count: true,
                orderBy: { _count: { productId: 'desc' } },
                take: 20,
            }),
            Object.keys(dateFilter).length > 0
                ? this.fastify.prisma.$queryRaw `
            SELECT
              DATE("createdAt") as date,
              COUNT(*) as count
            FROM "NotifyMe"
            WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `
                : this.fastify.prisma.$queryRaw `
            SELECT
              DATE("createdAt") as date,
              COUNT(*) as count
            FROM "NotifyMe"
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `,
        ]);
        const productIds = requestsByProduct.map((r) => r.productId);
        const products = await this.fastify.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, nameEn: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p.nameEn]));
        return {
            totalRequests,
            pendingRequests,
            notifiedRequests,
            requestsByProduct: requestsByProduct.map((item) => ({
                productId: item.productId,
                productName: productMap.get(item.productId) || 'Unknown',
                count: item._count,
            })),
            requestsTrend: requestsTrend.map((item) => ({
                date: item.date.toISOString().split('T')[0],
                count: Number(item.count) || 0,
            })),
        };
    }
    // ============================================
    // Vendor Dashboard Analytics
    // ============================================
    // Get vendor dashboard statistics
    async getVendorDashboard(userId) {
        try {
            const user = await this.fastify.prisma.user.findUnique({
                where: { id: userId },
                select: { companyId: true, role: true }
            });
            if (!user?.companyId) {
                throw this.fastify.httpErrors.badRequest('User not associated with any company');
            }
            const now = new Date();
            const today = new Date(now.setHours(0, 0, 0, 0));
            const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const revenueData = await this.calculateVendorRevenue(user.companyId, {
                today,
                thisWeekStart,
                thisMonthStart,
                lastMonthStart,
                lastMonthEnd
            });
            const orderStats = await this.calculateVendorOrderStats(user.companyId, {
                today,
                thisWeekStart,
                thisMonthStart
            });
            const productStats = await this.calculateVendorProductStats(user.companyId);
            const customerStats = await this.calculateVendorCustomerStats(user.companyId);
            const performanceMetrics = await this.calculateVendorPerformanceMetrics(user.companyId);
            return {
                revenue: revenueData,
                orders: orderStats,
                products: productStats,
                customers: customerStats,
                performance: performanceMetrics
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to generate dashboard statistics');
        }
    }
    async calculateVendorRevenue(companyId, dates) {
        const { today, thisWeekStart, thisMonthStart, lastMonthStart, lastMonthEnd } = dates;
        const totalRevenue = await this.fastify.prisma.orderItem.aggregate({
            where: {
                product: { companyId },
                order: { status: 'DELIVERED' }
            },
            _sum: { total: true }
        });
        const todayRevenue = await this.fastify.prisma.orderItem.aggregate({
            where: {
                product: { companyId },
                order: { status: 'DELIVERED', createdAt: { gte: today } }
            },
            _sum: { total: true }
        });
        const weekRevenue = await this.fastify.prisma.orderItem.aggregate({
            where: {
                product: { companyId },
                order: { status: 'DELIVERED', createdAt: { gte: thisWeekStart } }
            },
            _sum: { total: true }
        });
        const monthRevenue = await this.fastify.prisma.orderItem.aggregate({
            where: {
                product: { companyId },
                order: { status: 'DELIVERED', createdAt: { gte: thisMonthStart } }
            },
            _sum: { total: true }
        });
        const lastMonthRevenue = await this.fastify.prisma.orderItem.aggregate({
            where: {
                product: { companyId },
                order: {
                    status: 'DELIVERED',
                    createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
                }
            },
            _sum: { total: true }
        });
        const total = totalRevenue._sum.total || 0;
        const todayTotal = todayRevenue._sum.total || 0;
        const weekTotal = weekRevenue._sum.total || 0;
        const monthTotal = monthRevenue._sum.total || 0;
        const lastMonthTotal = lastMonthRevenue._sum.total || 0;
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
    async calculateVendorOrderStats(companyId, dates) {
        const { today, thisWeekStart, thisMonthStart } = dates;
        const orders = await this.fastify.prisma.order.findMany({
            where: {
                items: { some: { product: { companyId } } }
            },
            select: { id: true, status: true, createdAt: true }
        });
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'PENDING').length,
            processing: orders.filter(o => o.status === 'PROCESSING').length,
            completed: orders.filter(o => o.status === 'DELIVERED').length,
            cancelled: orders.filter(o => o.status === 'CANCELLED').length,
            today: orders.filter(o => o.createdAt >= today).length,
            thisWeek: orders.filter(o => o.createdAt >= thisWeekStart).length,
            thisMonth: orders.filter(o => o.createdAt >= thisMonthStart).length
        };
    }
    async calculateVendorProductStats(companyId) {
        const products = await this.fastify.prisma.product.findMany({
            where: { companyId },
            select: { id: true, nameEn: true, stock: true, isActive: true }
        });
        const bestSelling = await this.fastify.prisma.orderItem.groupBy({
            by: ['productId'],
            where: { product: { companyId } },
            _sum: { quantity: true, total: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });
        return {
            total: products.length,
            active: products.filter(p => p.isActive).length,
            inactive: products.filter(p => !p.isActive).length,
            lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
            outOfStock: products.filter(p => p.stock === 0).length,
            bestSelling: bestSelling.map((item) => {
                const product = products.find(p => p.id === item.productId);
                return {
                    productId: item.productId,
                    name: product?.nameEn || 'Unknown',
                    sales: item._sum.quantity || 0,
                    revenue: item._sum.total || 0
                };
            })
        };
    }
    async calculateVendorCustomerStats(companyId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const orders = await this.fastify.prisma.order.findMany({
            where: { items: { some: { product: { companyId } } } },
            select: { userId: true, createdAt: true, total: true },
            distinct: ['userId']
        });
        const newCustomers = orders.filter(c => c.createdAt >= thirtyDaysAgo).length;
        const customerOrders = await this.fastify.prisma.order.groupBy({
            by: ['userId'],
            where: { items: { some: { product: { companyId } } } },
            _count: true,
            _sum: { total: true },
            orderBy: { _sum: { total: 'desc' } },
            take: 5
        });
        const topCustomers = await Promise.all(customerOrders.map(async (customer) => {
            const user = await this.fastify.prisma.user.findUnique({
                where: { id: customer.userId },
                select: { name: true }
            });
            return {
                userId: customer.userId,
                name: user?.name || 'Unknown',
                orderCount: customer._count,
                totalSpent: customer._sum.total || 0
            };
        }));
        return {
            total: orders.length,
            new: newCustomers,
            returning: orders.length - newCustomers,
            topCustomers
        };
    }
    async calculateVendorPerformanceMetrics(companyId) {
        const orderValues = await this.fastify.prisma.order.aggregate({
            where: { items: { some: { product: { companyId } } } },
            _avg: { total: true },
            _count: true
        });
        const completedOrders = await this.fastify.prisma.order.count({
            where: {
                items: { some: { product: { companyId } } },
                status: 'DELIVERED'
            }
        });
        const fulfillmentRate = orderValues._count > 0
            ? (completedOrders / orderValues._count) * 100
            : 0;
        return {
            averageOrderValue: orderValues._avg.total || 0,
            conversionRate: 0,
            fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
            averageDeliveryTime: 0
        };
    }
    // Generate sales report for vendors
    async generateSalesReport(companyId, dateRange) {
        try {
            const { startDate, endDate } = dateRange;
            const orders = await this.fastify.prisma.order.findMany({
                where: {
                    items: { some: { product: { companyId } } },
                    createdAt: { gte: startDate, lte: endDate }
                },
                include: {
                    items: {
                        where: { product: { companyId } },
                        include: { product: { include: { category: true } } }
                    },
                    user: true,
                    address: true
                }
            });
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
                    const itemTotal = item.total;
                    totalSales += itemTotal;
                    if (productSales.has(item.productId)) {
                        productSales.get(item.productId).sales += itemTotal;
                        productSales.get(item.productId).quantity += item.quantity;
                    }
                    else {
                        productSales.set(item.productId, {
                            productId: item.productId,
                            name: item.product.nameEn,
                            sales: itemTotal,
                            quantity: item.quantity
                        });
                    }
                    if (item.product.categoryId) {
                        if (categorySales.has(item.product.categoryId)) {
                            categorySales.get(item.product.categoryId).sales += itemTotal;
                        }
                        else {
                            categorySales.set(item.product.categoryId, {
                                categoryId: item.product.categoryId,
                                name: item.product.category?.nameEn || 'Uncategorized',
                                sales: itemTotal
                            });
                        }
                    }
                    if (dailySales.has(orderDate)) {
                        dailySales.get(orderDate).sales += itemTotal;
                        dailySales.get(orderDate).orders += 1;
                    }
                    else {
                        dailySales.set(orderDate, { date: orderDate, sales: itemTotal, orders: 1 });
                    }
                    const zone = order.address?.zone || 'Unknown';
                    if (zoneSales.has(zone)) {
                        zoneSales.get(zone).sales += itemTotal;
                        zoneSales.get(zone).orders += 1;
                    }
                    else {
                        zoneSales.set(zone, { zone, sales: itemTotal, orders: 1 });
                    }
                });
            });
            return {
                period: dateRange,
                totalSales,
                totalOrders: orders.length,
                totalCustomers: uniqueCustomers.size,
                averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
                topProducts: Array.from(productSales.values()).sort((a, b) => b.sales - a.sales).slice(0, 10),
                topCategories: Array.from(categorySales.values()).sort((a, b) => b.sales - a.sales),
                salesByDate: Array.from(dailySales.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                salesByZone: Array.from(zoneSales.values()).sort((a, b) => b.sales - a.sales)
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to generate sales report');
        }
    }
    // Generate commission report for vendors
    async generateCommissionReport(companyId, dateRange) {
        try {
            const { startDate, endDate } = dateRange;
            const company = await this.fastify.prisma.company.findUnique({
                where: { id: companyId },
                select: { commissionRate: true }
            });
            const commissionRate = company?.commissionRate || 10;
            const orders = await this.fastify.prisma.order.findMany({
                where: {
                    items: { some: { product: { companyId } } },
                    status: 'DELIVERED',
                    deliveredAt: { gte: startDate, lte: endDate }
                },
                include: {
                    items: { where: { product: { companyId } } }
                }
            });
            let totalRevenue = 0;
            let totalCommission = 0;
            const transactions = [];
            for (const order of orders) {
                let orderRevenue = 0;
                for (const item of order.items) {
                    orderRevenue += item.total;
                }
                const orderCommission = orderRevenue * (commissionRate / 100);
                const orderPayout = orderRevenue - orderCommission;
                totalRevenue += orderRevenue;
                totalCommission += orderCommission;
                transactions.push({
                    orderId: order.id,
                    date: order.deliveredAt,
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
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to generate commission report');
        }
    }
    // Get admin dashboard overview
    async getAdminDashboard() {
        try {
            const now = new Date();
            const today = new Date(now.setHours(0, 0, 0, 0));
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const [totalUsers, totalVendors, totalShopOwners, totalCompanies, activeCompanies, totalProducts, totalOrders, todayOrders, monthOrders, totalRevenue] = await Promise.all([
                this.fastify.prisma.user.count(),
                this.fastify.prisma.user.count({ where: { role: client_1.UserRole.VENDOR } }),
                this.fastify.prisma.user.count({ where: { role: client_1.UserRole.SHOP_OWNER } }),
                this.fastify.prisma.company.count(),
                this.fastify.prisma.company.count({ where: { isActive: true } }),
                this.fastify.prisma.product.count(),
                this.fastify.prisma.order.count(),
                this.fastify.prisma.order.count({ where: { createdAt: { gte: today } } }),
                this.fastify.prisma.order.count({ where: { createdAt: { gte: thisMonthStart } } }),
                this.fastify.prisma.order.aggregate({ _sum: { total: true } })
            ]);
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
                    totalRevenue: totalRevenue._sum.total || 0
                }
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to generate admin dashboard');
        }
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map