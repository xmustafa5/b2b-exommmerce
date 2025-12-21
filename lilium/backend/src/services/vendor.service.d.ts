import { FastifyInstance } from 'fastify';
import { Company, Product, Order, OrderStatus } from '@prisma/client';
export interface VendorDashboardStats {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
    lowStockProducts: Product[];
}
export interface VendorOrderFilter {
    status?: OrderStatus;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
}
export interface VendorProductFilter {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    minStock?: number;
    maxStock?: number;
    page?: number;
    limit?: number;
}
export declare class VendorService {
    private fastify;
    constructor(fastify: FastifyInstance);
    /**
     * Get vendor company details
     */
    getVendorCompany(vendorUserId: string): Promise<Company | null>;
    /**
     * Update vendor company details
     */
    updateCompany(companyId: string, data: Partial<Company>): Promise<Company>;
    /**
     * Get all products for a vendor's company with pagination
     */
    getVendorProducts(companyId: string, filter?: VendorProductFilter): Promise<{
        data: Product[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Create a product for vendor's company
     */
    createProduct(companyId: string, data: Omit<Product, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<Product>;
    /**
     * Update vendor's product
     */
    updateProduct(productId: string, companyId: string, data: Partial<Product>): Promise<Product>;
    /**
     * Delete vendor's product (soft delete)
     */
    deleteProduct(productId: string, companyId: string): Promise<void>;
    /**
     * Get orders for vendor's products
     */
    getVendorOrders(companyId: string, filter?: VendorOrderFilter): Promise<{
        orders: any[];
        total: number;
    }>;
    /**
     * Update vendor's order status
     */
    updateOrderStatus(orderId: string, companyId: string, newStatus: OrderStatus, comment?: string): Promise<Order>;
    /**
     * Get vendor dashboard statistics
     */
    getVendorStats(companyId: string): Promise<VendorDashboardStats>;
    /**
     * Update product stock
     */
    updateProductStock(productId: string, companyId: string, quantity: number, operation: 'add' | 'set' | 'subtract'): Promise<Product>;
    /**
     * Get vendor's customers (users who ordered their products)
     */
    getVendorCustomers(companyId: string, page?: number, limit?: number): Promise<{
        customers: any[];
        total: number;
    }>;
    /**
     * Export vendor data (products, orders, etc.)
     */
    exportVendorData(companyId: string, dataType: 'products' | 'orders' | 'customers', format?: 'json' | 'csv'): Promise<any>;
}
//# sourceMappingURL=vendor.service.d.ts.map