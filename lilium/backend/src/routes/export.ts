import { FastifyPluginAsync } from 'fastify';
import { ExportService } from '../services/export.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const exportRoutes: FastifyPluginAsync = async (fastify) => {
  const exportService = new ExportService(fastify);

  // Export orders to CSV
  fastify.get('/orders/csv', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['export'],
      summary: 'Export orders to CSV',
      description: 'Export orders data to CSV format with optional date range filter',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          status: { type: 'string' },
          zone: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { startDate, endDate, status, zone } = request.query as any;
    const user = (request as any).user;

    const where: any = {};
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (status) where.status = status;
    if (zone) where.zone = zone;

    // Zone filtering for LOCATION_ADMIN
    if (user.role === UserRole.LOCATION_ADMIN) {
      where.zone = { in: user.zones };
    }

    const orders = await fastify.prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, businessName: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = orders.map((order) => ({
      orderNumber: order.orderNumber,
      customer: order.user.name,
      businessName: order.user.businessName || '',
      email: order.user.email,
      status: order.status,
      zone: order.zone,
      subtotal: order.subtotal,
      discount: order.discount,
      deliveryFee: order.deliveryFee,
      total: order.total,
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
    }));

    const csv = exportService.generateCSV(data);

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`)
      .send(csv);
  });

  // Export products to CSV
  fastify.get('/products/csv', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['export'],
      summary: 'Export products to CSV',
      description: 'Export products inventory to CSV format',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          categoryId: { type: 'string' },
          inStock: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { categoryId, inStock } = request.query as any;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (inStock !== undefined) {
      where.stock = inStock ? { gt: 0 } : { equals: 0 };
    }

    const products = await fastify.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { nameEn: 'asc' },
    });

    const data = products.map((product) => ({
      sku: product.sku,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      category: product.category.nameEn,
      price: product.price,
      compareAtPrice: product.compareAtPrice || '',
      cost: product.cost || '',
      stock: product.stock,
      minOrderQty: product.minOrderQty,
      unit: product.unit,
      zones: product.zones.join(', '),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt.toISOString(),
    }));

    const csv = exportService.generateCSV(data);

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename=products-${Date.now()}.csv`)
      .send(csv);
  });

  // Export sales report to PDF
  fastify.get('/sales/pdf', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['export'],
      summary: 'Export sales report to PDF',
      description: 'Generate a PDF sales report with summary and charts data',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      },
    },
  }, async (request, reply) => {
    const { startDate, endDate } = request.query as any;
    const user = (request as any).user;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const where: any = {
      createdAt: { gte: start, lte: end },
      status: { not: 'CANCELLED' },
    };

    if (user.role === UserRole.LOCATION_ADMIN) {
      where.zone = { in: user.zones };
    }

    // Get orders
    const orders = await fastify.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
    });

    // Calculate stats
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Sales by zone
    const zoneMap = new Map<string, { total: number; count: number }>();
    orders.forEach((order) => {
      const zone = order.zone;
      const existing = zoneMap.get(zone) || { total: 0, count: 0 };
      existing.total += order.total;
      existing.count += 1;
      zoneMap.set(zone, existing);
    });
    const salesByZone = Array.from(zoneMap.entries()).map(([zone, data]) => ({
      zone,
      ...data,
    }));

    // Top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productMap.get(item.productId) || {
          name: item.nameEn,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.total;
        productMap.set(item.productId, existing);
      });
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const pdf = await exportService.generateSalesReportPDF({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalSales,
      totalOrders,
      avgOrderValue,
      salesByZone,
      topProducts,
    });

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.pdf`)
      .send(pdf);
  });

  // Export inventory report to PDF
  fastify.get('/inventory/pdf', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['export'],
      summary: 'Export inventory report to PDF',
      description: 'Generate a PDF inventory report with stock levels',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const products = await fastify.prisma.product.findMany({
      include: { category: true },
      orderBy: { stock: 'asc' },
    });

    const totalProducts = products.length;
    const inStock = products.filter((p) => p.stock > 10).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;

    const productData = products.map((p) => ({
      sku: p.sku,
      name: p.nameEn,
      stock: p.stock,
      category: p.category.nameEn,
      status: p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock',
    }));

    const pdf = await exportService.generateInventoryReportPDF({
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      products: productData,
    });

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename=inventory-report-${Date.now()}.pdf`)
      .send(pdf);
  });

  // Export customers to CSV
  fastify.get('/customers/csv', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      tags: ['export'],
      summary: 'Export customers to CSV',
      description: 'Export customer list to CSV format (Super Admin only)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const users = await fastify.prisma.user.findMany({
      where: { role: 'SHOP_OWNER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        businessName: true,
        zones: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      businessName: user.businessName || '',
      zones: user.zones.join(', '),
      isActive: user.isActive,
      orderCount: user._count.orders,
      createdAt: user.createdAt.toISOString(),
    }));

    const csv = exportService.generateCSV(data);

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename=customers-${Date.now()}.csv`)
      .send(csv);
  });
};

export default exportRoutes;
