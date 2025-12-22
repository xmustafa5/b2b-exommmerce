// Analytics types aligned with backend API

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
  zone?: string;
}

// Dashboard Stats
export interface DashboardStats {
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
  recentOrders: RecentOrder[];
  salesByZone: ZoneSales[];
  ordersByStatus: OrderStatusCount[];
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  shop?: {
    id: string;
    name: string;
  };
}

export interface ZoneSales {
  zone: string;
  total: number;
  count: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

// Sales Analytics
export interface SalesStats {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  salesByDay: DailySales[];
  salesByZone: ZoneSales[];
  salesByPaymentMethod: PaymentMethodSales[];
  topCustomers: TopCustomer[];
}

export interface DailySales {
  date: string;
  sales: number;
  orders: number;
}

export interface PaymentMethodSales {
  method: string;
  total: number;
  count: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
}

// Product Analytics
export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topSellingProducts: TopProduct[];
  productsByCategory: CategoryProductCount[];
  revenueByCategory: CategoryRevenue[];
}

export interface TopProduct {
  id: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  soldQuantity: number;
  revenue: number;
}

export interface CategoryProductCount {
  categoryId: string;
  categoryName: string;
  productCount: number;
}

export interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  revenue: number;
  orderCount: number;
}

// Notify Request Analytics
export interface NotifyRequestStats {
  totalRequests: number;
  pendingRequests: number;
  notifiedRequests: number;
  requestsByProduct: ProductNotifyCount[];
  requestsTrend: NotifyTrend[];
}

export interface ProductNotifyCount {
  productId: string;
  productName: string;
  count: number;
}

export interface NotifyTrend {
  date: string;
  count: number;
}

// Vendor Dashboard
export interface VendorDashboardStats {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  salesTrend: DailySales[];
}

// Admin Dashboard
export interface AdminDashboardStats {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
    totalCompanies: number;
    activePromotions: number;
  };
  performance: {
    pendingOrders: number;
    lowStockAlerts: number;
    outOfStockProducts: number;
  };
  salesByZone: ZoneSales[];
  topCompanies: {
    id: string;
    name: string;
    revenue: number;
    orderCount: number;
  }[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
}

// Reports
export interface SalesReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    totalItems: number;
  };
  dailyBreakdown: DailySales[];
  productBreakdown: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface CommissionReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSales: number;
    commissionRate: number;
    totalCommission: number;
    netRevenue: number;
  };
  orderBreakdown: {
    orderId: string;
    orderNumber: string;
    total: number;
    commission: number;
    date: string;
  }[];
}

export interface ReportRequest {
  startDate: string;
  endDate: string;
  companyId?: string;
}
