"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const client_1 = require("@prisma/client");
class DeliveryService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    /**
     * Update order status in the delivery workflow
     */
    async updateOrderStatus(data, updatedBy) {
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
                    ...(data.status === client_1.OrderStatus.ACCEPTED && { acceptedAt: new Date() }),
                    ...(data.status === client_1.OrderStatus.PREPARING && { preparingAt: new Date() }),
                    ...(data.status === client_1.OrderStatus.ON_THE_WAY && { dispatchedAt: new Date() }),
                    ...(data.status === client_1.OrderStatus.DELIVERED && {
                        deliveredAt: new Date(),
                        completedAt: new Date()
                    }),
                    ...(data.status === client_1.OrderStatus.CANCELLED && { cancelledAt: new Date() })
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
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw this.fastify.httpErrors.badRequest('Failed to update order status');
        }
    }
    /**
     * Validate if status transition is allowed
     */
    validateStatusTransition(currentStatus, newStatus) {
        const allowedTransitions = {
            [client_1.OrderStatus.PENDING]: [client_1.OrderStatus.ACCEPTED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.ACCEPTED]: [client_1.OrderStatus.PREPARING, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.PREPARING]: [client_1.OrderStatus.ON_THE_WAY, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.ON_THE_WAY]: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.DELIVERED]: [], // No transitions from delivered
            [client_1.OrderStatus.CANCELLED]: [], // No transitions from cancelled
            [client_1.OrderStatus.COMPLETED]: [], // No transitions from completed
            [client_1.OrderStatus.REFUNDED]: [] // No transitions from refunded
        };
        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            throw this.fastify.httpErrors.badRequest(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
    }
    /**
     * Create status history entry
     */
    async createStatusHistory(orderId, status, updatedBy, notes) {
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
        }
        catch (error) {
            this.fastify.log.error(error, 'Failed to create status history');
        }
    }
    /**
     * Send notification based on order status
     */
    async sendStatusNotification(order, status) {
        try {
            const notifications = {
                [client_1.OrderStatus.ACCEPTED]: 'Your order has been accepted and is being prepared',
                [client_1.OrderStatus.PREPARING]: 'Your order is being prepared',
                [client_1.OrderStatus.ON_THE_WAY]: 'Your order is on the way! The delivery driver will arrive soon',
                [client_1.OrderStatus.DELIVERED]: 'Your order has been delivered. Thank you for your purchase!',
                [client_1.OrderStatus.CANCELLED]: 'Your order has been cancelled',
                [client_1.OrderStatus.PENDING]: 'Your order is pending confirmation',
                [client_1.OrderStatus.COMPLETED]: 'Your order has been completed',
                [client_1.OrderStatus.REFUNDED]: 'Your order has been refunded'
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
        }
        catch (error) {
            this.fastify.log.error(error, 'Failed to send notification');
        }
    }
    /**
     * Assign delivery driver to order
     */
    async assignDriver(orderId, driverId) {
        try {
            const order = await this.fastify.prisma.order.findUnique({
                where: { id: orderId }
            });
            if (!order) {
                throw this.fastify.httpErrors.notFound('Order not found');
            }
            if (order.status !== client_1.OrderStatus.PREPARING) {
                throw this.fastify.httpErrors.badRequest('Order must be in PREPARING status to assign driver');
            }
            // Create delivery assignment
            const assignment = {
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
                    status: client_1.OrderStatus.ON_THE_WAY
                }
            });
            return assignment;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw this.fastify.httpErrors.badRequest('Failed to assign driver');
        }
    }
    /**
     * Calculate estimated delivery time based on zone and current load
     */
    calculateEstimatedDeliveryTime(order) {
        const baseTime = 30; // Base 30 minutes
        const zoneTime = {
            [client_1.Zone.KARKH]: 20,
            [client_1.Zone.RUSAFA]: 25,
            [client_1.Zone.KADHMIYA]: 30,
            [client_1.Zone.ADHAMIYA]: 30,
            [client_1.Zone.SADR_CITY]: 35,
            [client_1.Zone.NEW_BAGHDAD]: 25,
            [client_1.Zone.MANSOUR]: 20,
            [client_1.Zone.KARRADA]: 25
        };
        const additionalTime = zoneTime[order.zone] || 30;
        const totalMinutes = baseTime + additionalTime;
        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + totalMinutes);
        return estimatedTime;
    }
    /**
     * Record cash collection for COD order
     */
    async recordCashCollection(data) {
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
            if (order.status !== client_1.OrderStatus.DELIVERED) {
                throw this.fastify.httpErrors.badRequest('Order must be delivered to collect cash');
            }
            // Verify amount matches order total
            if (Math.abs(data.amount - order.totalAmount) > 0.01) {
                throw this.fastify.httpErrors.badRequest(`Cash amount (${data.amount}) does not match order total (${order.totalAmount})`);
            }
            // Record cash collection
            const collection = {
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
        }
        catch (error) {
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('does not match'))) {
                throw error;
            }
            throw this.fastify.httpErrors.badRequest('Failed to record cash collection');
        }
    }
    /**
     * Get delivery metrics for vendor/company
     */
    async getDeliveryMetrics(companyId, period = 'today') {
        try {
            const startDate = this.getStartDate(period);
            const orders = await this.fastify.prisma.order.findMany({
                where: {
                    items: {
                        some: {
                            product: { companyId }
                        }
                    },
                    createdAt: {
                        gte: startDate
                    }
                }
            });
            const totalDeliveries = orders.length;
            const completedDeliveries = orders.filter(o => o.status === client_1.OrderStatus.DELIVERED).length;
            const pendingDeliveries = orders.filter(o => [client_1.OrderStatus.PENDING, client_1.OrderStatus.ACCEPTED, client_1.OrderStatus.PREPARING, client_1.OrderStatus.ON_THE_WAY].includes(o.status)).length;
            // Calculate on-time rate (delivered within estimated time)
            const onTimeDeliveries = orders.filter(o => {
                if (o.status !== client_1.OrderStatus.DELIVERED)
                    return false;
                // Check if delivered within estimated time
                return true; // Simplified for now
            }).length;
            const onTimeRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;
            // Calculate average delivery time
            const deliveredOrders = orders.filter(o => o.status === client_1.OrderStatus.DELIVERED);
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
            const cashOrders = orders.filter(o => o.paymentMethod === 'CASH_ON_DELIVERY' &&
                o.paymentStatus === 'PAID');
            const totalCashCollected = cashOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            // Today's deliveries
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayDeliveries = orders.filter(o => o.createdAt >= today).length;
            return {
                totalDeliveries,
                completedDeliveries,
                pendingDeliveries,
                onTimeRate,
                averageDeliveryTime,
                totalCashCollected,
                todayDeliveries
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to get delivery metrics');
        }
    }
    /**
     * Get start date based on period
     */
    getStartDate(period) {
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
    async getOrdersByStatus(companyId, status) {
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
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to get orders by status');
        }
    }
    /**
     * Track delivery in real-time
     */
    async trackDelivery(orderId) {
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
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw this.fastify.httpErrors.internalServerError('Failed to track delivery');
        }
    }
    /**
     * Bulk update order statuses
     */
    async bulkUpdateStatus(orderIds, status, updatedBy) {
        try {
            let updated = 0;
            let failed = 0;
            for (const orderId of orderIds) {
                try {
                    await this.updateOrderStatus({ orderId, status }, updatedBy);
                    updated++;
                }
                catch (error) {
                    failed++;
                    this.fastify.log.error({ orderId, error }, 'Failed to update order status in bulk');
                }
            }
            return { updated, failed };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to bulk update statuses');
        }
    }
}
exports.DeliveryService = DeliveryService;
//# sourceMappingURL=delivery.service.js.map