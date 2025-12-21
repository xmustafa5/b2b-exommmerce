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
export declare class OrderService {
    private fastify;
    constructor(fastify: FastifyInstance);
    createOrder(data: CreateOrderInput): Promise<{
        status: import(".prisma/client").$Enums.OrderStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        total: number;
        zone: import(".prisma/client").$Enums.Zone;
        addressId: string;
        notes: string | null;
        promotionId: string | null;
        paymentMethod: string | null;
        userId: string;
        orderNumber: string;
        subtotal: number;
        discount: number;
        deliveryFee: number;
        paymentStatus: string | null;
        deliveryDate: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    }>;
    getOrders(page?: number, limit?: number, filters?: OrderFilters, userRole?: string, userZones?: Zone[]): Promise<{
        orders: {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            total: number;
            zone: import(".prisma/client").$Enums.Zone;
            addressId: string;
            notes: string | null;
            promotionId: string | null;
            paymentMethod: string | null;
            userId: string;
            orderNumber: string;
            subtotal: number;
            discount: number;
            deliveryFee: number;
            paymentStatus: string | null;
            deliveryDate: Date | null;
            deliveredAt: Date | null;
            cancelledAt: Date | null;
            cancelReason: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOrderById(orderId: string, userId?: string, userRole?: string): Promise<{
        status: import(".prisma/client").$Enums.OrderStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        total: number;
        zone: import(".prisma/client").$Enums.Zone;
        addressId: string;
        notes: string | null;
        promotionId: string | null;
        paymentMethod: string | null;
        userId: string;
        orderNumber: string;
        subtotal: number;
        discount: number;
        deliveryFee: number;
        paymentStatus: string | null;
        deliveryDate: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    }>;
    updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string, userRole?: string): Promise<{
        status: import(".prisma/client").$Enums.OrderStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        total: number;
        zone: import(".prisma/client").$Enums.Zone;
        addressId: string;
        notes: string | null;
        promotionId: string | null;
        paymentMethod: string | null;
        userId: string;
        orderNumber: string;
        subtotal: number;
        discount: number;
        deliveryFee: number;
        paymentStatus: string | null;
        deliveryDate: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    }>;
    cancelOrder(orderId: string, userId?: string, userRole?: string): Promise<{
        status: import(".prisma/client").$Enums.OrderStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        total: number;
        zone: import(".prisma/client").$Enums.Zone;
        addressId: string;
        notes: string | null;
        promotionId: string | null;
        paymentMethod: string | null;
        userId: string;
        orderNumber: string;
        subtotal: number;
        discount: number;
        deliveryFee: number;
        paymentStatus: string | null;
        deliveryDate: Date | null;
        deliveredAt: Date | null;
        cancelledAt: Date | null;
        cancelReason: string | null;
    }>;
    private restoreStock;
    getOrderStats(zone?: Zone): Promise<{
        totalOrders: number;
        pendingOrders: number;
        confirmedOrders: number;
        processingOrders: number;
        shippedOrders: number;
        deliveredOrders: number;
        cancelledOrders: number;
        totalRevenue: number;
    }>;
}
export {};
//# sourceMappingURL=order.service.d.ts.map