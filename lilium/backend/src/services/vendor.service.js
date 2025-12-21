"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorService = void 0;
const client_1 = require("@prisma/client");
class VendorService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    /**
     * Get vendor company details
     */
    async getVendorCompany(vendorUserId) {
        const user = await this.fastify.prisma.user.findUnique({
            where: { id: vendorUserId },
            include: { company: true },
        });
        if (!user || !user.company) {
            throw this.fastify.httpErrors.notFound('Vendor company not found');
        }
        return user.company;
    }
    /**
     * Update vendor company details
     */
    async updateCompany(companyId, data) {
        // Ensure company exists
        const company = await this.fastify.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw this.fastify.httpErrors.notFound('Company not found');
        }
        return await this.fastify.prisma.company.update({
            where: { id: companyId },
            data: {
                name: data.name,
                nameAr: data.nameAr,
                description: data.description,
                descriptionAr: data.descriptionAr,
                logo: data.logo,
                email: data.email,
                phone: data.phone,
                address: data.address,
                zones: data.zones,
                commissionRate: data.commissionRate,
                updatedAt: new Date(),
            },
        });
    }
    /**
     * Get all products for a vendor's company with pagination
     */
    async getVendorProducts(companyId, filter = {}) {
        const { categoryId, isActive, search, minStock, maxStock, page = 1, limit = 20, } = filter;
        const where = {
            companyId,
            ...(categoryId && { categoryId }),
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { nameEn: { contains: search, mode: 'insensitive' } },
                    { nameAr: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(minStock !== undefined && { stock: { gte: minStock } }),
            ...(maxStock !== undefined && { stock: { lte: maxStock } }),
        };
        const [products, total] = await Promise.all([
            this.fastify.prisma.product.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    category: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.fastify.prisma.product.count({ where }),
        ]);
        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Create a product for vendor's company
     */
    async createProduct(companyId, data) {
        // Verify company exists
        const company = await this.fastify.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw this.fastify.httpErrors.notFound('Company not found');
        }
        // Check if SKU is unique
        const existingProduct = await this.fastify.prisma.product.findUnique({
            where: { sku: data.sku },
        });
        if (existingProduct) {
            throw this.fastify.httpErrors.conflict('Product with this SKU already exists');
        }
        return await this.fastify.prisma.product.create({
            data: {
                ...data,
                companyId,
            },
        });
    }
    /**
     * Update vendor's product
     */
    async updateProduct(productId, companyId, data) {
        // Verify product belongs to company
        const product = await this.fastify.prisma.product.findFirst({
            where: {
                id: productId,
                companyId,
            },
        });
        if (!product) {
            throw this.fastify.httpErrors.notFound('Product not found or does not belong to this vendor');
        }
        // Check SKU uniqueness if updating SKU
        if (data.sku && data.sku !== product.sku) {
            const existingProduct = await this.fastify.prisma.product.findUnique({
                where: { sku: data.sku },
            });
            if (existingProduct) {
                throw this.fastify.httpErrors.conflict('Product with this SKU already exists');
            }
        }
        return await this.fastify.prisma.product.update({
            where: { id: productId },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }
    /**
     * Delete vendor's product (soft delete)
     */
    async deleteProduct(productId, companyId) {
        // Verify product belongs to company
        const product = await this.fastify.prisma.product.findFirst({
            where: {
                id: productId,
                companyId,
            },
        });
        if (!product) {
            throw this.fastify.httpErrors.notFound('Product not found or does not belong to this vendor');
        }
        // Soft delete by setting isActive to false
        await this.fastify.prisma.product.update({
            where: { id: productId },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
    }
    /**
     * Get orders for vendor's products
     */
    async getVendorOrders(companyId, filter = {}) {
        const { status, fromDate, toDate, search, page = 1, limit = 20, } = filter;
        // Get all product IDs for this vendor
        const vendorProducts = await this.fastify.prisma.product.findMany({
            where: { companyId },
            select: { id: true },
        });
        const productIds = vendorProducts.map(p => p.id);
        if (productIds.length === 0) {
            return { orders: [], total: 0 };
        }
        // Find orders that contain vendor's products
        const where = {
            items: {
                some: {
                    productId: { in: productIds },
                },
            },
            ...(status && { status }),
            ...(fromDate && { createdAt: { gte: fromDate } }),
            ...(toDate && { createdAt: { lte: toDate } }),
            ...(search && {
                OR: [
                    { orderNumber: { contains: search, mode: 'insensitive' } },
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };
        const [orders, total] = await Promise.all([
            this.fastify.prisma.order.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            businessName: true,
                        },
                    },
                    items: {
                        where: {
                            productId: { in: productIds },
                        },
                        include: {
                            product: true,
                        },
                    },
                    address: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.fastify.prisma.order.count({ where }),
        ]);
        // Calculate vendor-specific totals for each order
        const ordersWithVendorTotals = orders.map(order => {
            const vendorItems = order.items;
            const vendorSubtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const vendorDiscount = vendorItems.reduce((sum, item) => sum + (item.discount || 0), 0);
            const vendorTotal = vendorSubtotal - vendorDiscount;
            return {
                ...order,
                vendorItems,
                vendorSubtotal,
                vendorDiscount,
                vendorTotal,
            };
        });
        return { orders: ordersWithVendorTotals, total };
    }
    /**
     * Update vendor's order status
     */
    async updateOrderStatus(orderId, companyId, newStatus, comment) {
        // Verify order contains vendor's products
        const vendorProducts = await this.fastify.prisma.product.findMany({
            where: { companyId },
            select: { id: true },
        });
        const productIds = vendorProducts.map(p => p.id);
        const order = await this.fastify.prisma.order.findFirst({
            where: {
                id: orderId,
                items: {
                    some: {
                        productId: { in: productIds },
                    },
                },
            },
            include: {
                statusHistory: true,
            },
        });
        if (!order) {
            throw this.fastify.httpErrors.notFound('Order not found or does not contain your products');
        }
        // Validate status transition
        const validTransitions = {
            [client_1.OrderStatus.PENDING]: [client_1.OrderStatus.ACCEPTED, client_1.OrderStatus.REJECTED],
            [client_1.OrderStatus.ACCEPTED]: [client_1.OrderStatus.PROCESSING, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.PROCESSING]: [client_1.OrderStatus.READY, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.READY]: [client_1.OrderStatus.OUT_FOR_DELIVERY],
            [client_1.OrderStatus.OUT_FOR_DELIVERY]: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.FAILED],
            [client_1.OrderStatus.DELIVERED]: [],
            [client_1.OrderStatus.CANCELLED]: [],
            [client_1.OrderStatus.REJECTED]: [],
            [client_1.OrderStatus.FAILED]: [client_1.OrderStatus.PROCESSING], // Can retry
        };
        if (!validTransitions[order.status]?.includes(newStatus)) {
            throw this.fastify.httpErrors.badRequest(`Cannot transition from ${order.status} to ${newStatus}`);
        }
        // Update order status with history
        return await this.fastify.prisma.order.update({
            where: { id: orderId },
            data: {
                status: newStatus,
                statusHistory: {
                    create: {
                        fromStatus: order.status,
                        toStatus: newStatus,
                        comment: comment || `Status updated by vendor`,
                        changedBy: companyId,
                    },
                },
                updatedAt: new Date(),
            },
            include: {
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }
    /**
     * Get vendor dashboard statistics
     */
    async getVendorStats(companyId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Get all vendor products
        const vendorProducts = await this.fastify.prisma.product.findMany({
            where: { companyId },
        });
        const productIds = vendorProducts.map(p => p.id);
        // Get product stats
        const activeProducts = vendorProducts.filter(p => p.isActive).length;
        const lowStockProducts = vendorProducts.filter(p => p.stock <= p.minOrderQty);
        // Get order stats
        const orders = await this.fastify.prisma.order.findMany({
            where: {
                items: {
                    some: {
                        productId: { in: productIds },
                    },
                },
            },
            include: {
                items: {
                    where: {
                        productId: { in: productIds },
                    },
                },
            },
        });
        // Calculate order statistics
        const pendingOrders = orders.filter(o => o.status === client_1.OrderStatus.PENDING).length;
        const processingOrders = orders.filter(o => [client_1.OrderStatus.ACCEPTED, client_1.OrderStatus.PROCESSING, client_1.OrderStatus.READY].includes(o.status)).length;
        const completedOrders = orders.filter(o => o.status === client_1.OrderStatus.DELIVERED).length;
        // Calculate revenue
        const totalRevenue = orders
            .filter(o => o.status === client_1.OrderStatus.DELIVERED)
            .reduce((sum, order) => {
            const orderRevenue = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity - (item.discount || 0)), 0);
            return sum + orderRevenue;
        }, 0);
        // Today's stats
        const todayOrders = orders.filter(o => o.createdAt >= today);
        const todayOrdersCount = todayOrders.length;
        const todayRevenue = todayOrders
            .filter(o => o.status === client_1.OrderStatus.DELIVERED)
            .reduce((sum, order) => {
            const orderRevenue = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity - (item.discount || 0)), 0);
            return sum + orderRevenue;
        }, 0);
        return {
            totalProducts: vendorProducts.length,
            activeProducts,
            totalOrders: orders.length,
            pendingOrders,
            processingOrders,
            completedOrders,
            totalRevenue,
            todayOrders: todayOrdersCount,
            todayRevenue,
            lowStockProducts,
        };
    }
    /**
     * Update product stock
     */
    async updateProductStock(productId, companyId, quantity, operation) {
        // Verify product belongs to company
        const product = await this.fastify.prisma.product.findFirst({
            where: {
                id: productId,
                companyId,
            },
        });
        if (!product) {
            throw this.fastify.httpErrors.notFound('Product not found or does not belong to this vendor');
        }
        let newStock;
        switch (operation) {
            case 'add':
                newStock = product.stock + quantity;
                break;
            case 'subtract':
                newStock = Math.max(0, product.stock - quantity);
                break;
            case 'set':
                newStock = quantity;
                break;
        }
        // Update stock and create history
        const [updatedProduct] = await this.fastify.prisma.$transaction([
            this.fastify.prisma.product.update({
                where: { id: productId },
                data: {
                    stock: newStock,
                    updatedAt: new Date(),
                },
            }),
            this.fastify.prisma.stockHistory.create({
                data: {
                    productId,
                    previousQuantity: product.stock,
                    newQuantity: newStock,
                    changeQuantity: newStock - product.stock,
                    changeType: operation === 'add' ? 'RESTOCK' : operation === 'subtract' ? 'SALE' : 'ADJUSTMENT',
                    changeReason: `Stock ${operation} by vendor`,
                },
            }),
        ]);
        return updatedProduct;
    }
    /**
     * Get vendor's customers (users who ordered their products)
     */
    async getVendorCustomers(companyId, page = 1, limit = 20) {
        // Get vendor's product IDs
        const vendorProducts = await this.fastify.prisma.product.findMany({
            where: { companyId },
            select: { id: true },
        });
        const productIds = vendorProducts.map(p => p.id);
        if (productIds.length === 0) {
            return { customers: [], total: 0 };
        }
        // Find unique users who ordered vendor's products
        const orders = await this.fastify.prisma.order.findMany({
            where: {
                items: {
                    some: {
                        productId: { in: productIds },
                    },
                },
            },
            select: {
                userId: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        businessName: true,
                        createdAt: true,
                    },
                },
            },
            distinct: ['userId'],
            skip: (page - 1) * limit,
            take: limit,
        });
        const customers = await Promise.all(orders.map(async (order) => {
            // Get customer order stats
            const customerOrders = await this.fastify.prisma.order.findMany({
                where: {
                    userId: order.userId,
                    items: {
                        some: {
                            productId: { in: productIds },
                        },
                    },
                },
                include: {
                    items: {
                        where: {
                            productId: { in: productIds },
                        },
                    },
                },
            });
            const totalOrders = customerOrders.length;
            const totalSpent = customerOrders.reduce((sum, o) => {
                const orderTotal = o.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity - (item.discount || 0)), 0);
                return sum + orderTotal;
            }, 0);
            const lastOrderDate = customerOrders.length > 0
                ? customerOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
                : null;
            return {
                ...order.user,
                totalOrders,
                totalSpent,
                lastOrderDate,
            };
        }));
        const total = await this.fastify.prisma.order.count({
            where: {
                items: {
                    some: {
                        productId: { in: productIds },
                    },
                },
            },
            distinct: ['userId'],
        });
        return { customers, total };
    }
    /**
     * Export vendor data (products, orders, etc.)
     */
    async exportVendorData(companyId, dataType, format = 'json') {
        let data;
        switch (dataType) {
            case 'products':
                const { products } = await this.getVendorProducts(companyId, { limit: 10000 });
                data = products;
                break;
            case 'orders':
                const { orders } = await this.getVendorOrders(companyId, { limit: 10000 });
                data = orders;
                break;
            case 'customers':
                const { customers } = await this.getVendorCustomers(companyId, 1, 10000);
                data = customers;
                break;
            default:
                throw this.fastify.httpErrors.badRequest('Invalid data type');
        }
        if (format === 'csv') {
            // Convert to CSV format (simplified)
            if (data.length === 0)
                return '';
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map((item) => Object.values(item).map((v) => typeof v === 'string' ? `"${v}"` : v).join(','));
            return [headers, ...rows].join('\n');
        }
        return data;
    }
}
exports.VendorService = VendorService;
//# sourceMappingURL=vendor.service.js.map