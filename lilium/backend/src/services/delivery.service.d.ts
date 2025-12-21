import { FastifyInstance } from 'fastify';
import { OrderStatus } from '@prisma/client';
interface DeliveryAssignment {
    orderId: string;
    driverId: string;
    assignedAt: Date;
    estimatedDeliveryTime?: Date;
    actualDeliveryTime?: Date;
    deliveryNotes?: string;
    cashCollected?: number;
    deliveryProof?: string;
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
export declare class DeliveryService {
    private fastify;
    constructor(fastify: FastifyInstance);
    /**
     * Update order status in the delivery workflow
     */
    updateOrderStatus(data: OrderStatusUpdate, updatedBy: string): Promise<any>;
    /**
     * Validate if status transition is allowed
     */
    private validateStatusTransition;
    /**
     * Create status history entry
     */
    private createStatusHistory;
    /**
     * Send notification based on order status
     */
    private sendStatusNotification;
    /**
     * Assign delivery driver to order
     */
    assignDriver(orderId: string, driverId: string): Promise<DeliveryAssignment>;
    /**
     * Calculate estimated delivery time based on zone and current load
     */
    private calculateEstimatedDeliveryTime;
    /**
     * Record cash collection for COD order
     */
    recordCashCollection(data: {
        orderId: string;
        amount: number;
        collectedBy: string;
        notes?: string;
    }): Promise<CashCollection>;
    /**
     * Get delivery metrics for vendor/company
     */
    getDeliveryMetrics(companyId: string, period?: 'today' | 'week' | 'month'): Promise<DeliveryMetrics>;
    /**
     * Get start date based on period
     */
    private getStartDate;
    /**
     * Get orders by status for vendor
     */
    getOrdersByStatus(companyId: string, status: OrderStatus): Promise<any[]>;
    /**
     * Track delivery in real-time
     */
    trackDelivery(orderId: string): Promise<any>;
    /**
     * Bulk update order statuses
     */
    bulkUpdateStatus(orderIds: string[], status: OrderStatus, updatedBy: string): Promise<{
        updated: number;
        failed: number;
    }>;
}
export {};
//# sourceMappingURL=delivery.service.d.ts.map