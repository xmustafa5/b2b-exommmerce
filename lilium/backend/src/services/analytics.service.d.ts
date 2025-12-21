import { FastifyInstance } from 'fastify';
import { Zone, OrderStatus } from '@prisma/client';
interface DateRange {
    startDate: Date;
    endDate: Date;
}
interface DateRangeFilter {
    startDate?: Date;
    endDate?: Date;
    zone?: Zone;
}
interface DashboardStats {
    totalOrders: number;
    totalSales: number;
    totalProducts: number;
    totalUsers: number;
    totalCategories: number;
    avgOrderValue: number;
    pendingOrders: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    activePromotions: number;
    recentOrders: any[];
    salesByZone: {
        zone: Zone;
        total: number;
        count: number;
    }[];
    ordersByStatus: {
        status: OrderStatus;
        count: number;
    }[];
}
interface SalesStats {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    salesByDay: {
        date: string;
        total: number;
        count: number;
    }[];
    salesByZone: {
        zone: Zone;
        total: number;
        count: number;
    }[];
    salesByPaymentMethod: {
        method: string;
        total: number;
        count: number;
    }[];
    topCustomers: {
        userId: string;
        name: string;
        businessName: string | null;
        total: number;
        orderCount: number;
    }[];
}
interface ProductStats {
    totalProducts: number;
    activeProducts: number;
    featuredProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    topSellingProducts: any[];
    productsByCategory: {
        categoryId: string;
        categoryName: string;
        count: number;
    }[];
    revenueByCategory: {
        categoryId: string;
        categoryName: string;
        revenue: number;
    }[];
}
interface NotifyRequestStats {
    totalRequests: number;
    pendingRequests: number;
    notifiedRequests: number;
    requestsByProduct: {
        productId: string;
        productName: string;
        count: number;
    }[];
    requestsTrend: {
        date: string;
        count: number;
    }[];
}
interface VendorDashboardStats {
    revenue: {
        total: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
        growth: number;
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
        lowStock: number;
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
        new: number;
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
        averageDeliveryTime: number;
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
export declare class AnalyticsService {
    private fastify;
    constructor(fastify: FastifyInstance);
    getDashboardStats(filter?: DateRangeFilter): Promise<DashboardStats>;
    getSalesStats(filter?: DateRangeFilter): Promise<SalesStats>;
    getProductStats(filter?: DateRangeFilter): Promise<ProductStats>;
    getNotifyRequestStats(filter?: DateRangeFilter): Promise<NotifyRequestStats>;
    getVendorDashboard(userId: string): Promise<VendorDashboardStats>;
    private calculateVendorRevenue;
    private calculateVendorOrderStats;
    private calculateVendorProductStats;
    private calculateVendorCustomerStats;
    private calculateVendorPerformanceMetrics;
    generateSalesReport(companyId: string, dateRange: DateRange): Promise<SalesReport>;
    generateCommissionReport(companyId: string, dateRange: DateRange): Promise<CommissionReport>;
    getAdminDashboard(): Promise<any>;
}
export {};
//# sourceMappingURL=analytics.service.d.ts.map