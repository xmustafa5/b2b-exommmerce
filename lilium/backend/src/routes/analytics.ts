import { FastifyPluginAsync } from 'fastify';
import { authenticate, requireRole, authorize } from '../middleware/auth';
import { handleError } from '../utils/errors';
import { AnalyticsService } from '../services/analytics.service';
import { Zone, UserRole } from '@prisma/client';
import { z } from 'zod';

// Query schema for date range filtering
const dateRangeQuerySchema = z.object({
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  zone: z.nativeEnum(Zone).optional(),
});

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const analyticsService = new AnalyticsService(fastify);

  // ============================================
  // Admin Dashboard Analytics
  // ============================================

  // GET /api/analytics/dashboard - Dashboard overview stats
  fastify.get('/dashboard', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      description: 'Get dashboard overview statistics',
      tags: ['analytics'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (ISO format)' },
          endDate: { type: 'string', description: 'End date (ISO format)' },
          zone: { type: 'string', enum: ['KARKH', 'RUSAFA'], description: 'Filter by zone' },
        },
      },
      response: {
        200: {
          description: 'Dashboard statistics',
          type: 'object',
          properties: {
            totalOrders: { type: 'number' },
            totalSales: { type: 'number' },
            totalProducts: { type: 'number' },
            totalUsers: { type: 'number' },
            totalCategories: { type: 'number' },
            avgOrderValue: { type: 'number' },
            pendingOrders: { type: 'number' },
            lowStockProducts: { type: 'number' },
            outOfStockProducts: { type: 'number' },
            activePromotions: { type: 'number' },
            recentOrders: { type: 'array' },
            salesByZone: { type: 'array' },
            ordersByStatus: { type: 'array' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const query = dateRangeQuerySchema.parse(request.query);

      // For LOCATION_ADMIN, restrict to their zones
      let zone = query.zone;
      if (request.user.role === UserRole.LOCATION_ADMIN && request.user.zones?.length > 0) {
        if (zone && !request.user.zones.includes(zone)) {
          return reply.code(403).send({ error: 'Access denied to this zone', code: 'FORBIDDEN' });
        }
        if (!zone && request.user.zones.length === 1) {
          zone = request.user.zones[0];
        }
      }

      const stats = await analyticsService.getDashboardStats({
        startDate: query.startDate,
        endDate: query.endDate,
        zone,
      });

      return reply.send(stats);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/analytics/sales - Sales analytics
  fastify.get('/sales', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      description: 'Get sales analytics with trends and breakdowns',
      tags: ['analytics'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (ISO format)' },
          endDate: { type: 'string', description: 'End date (ISO format)' },
          zone: { type: 'string', enum: ['KARKH', 'RUSAFA'], description: 'Filter by zone' },
        },
      },
      response: {
        200: {
          description: 'Sales statistics',
          type: 'object',
          properties: {
            totalSales: { type: 'number' },
            totalOrders: { type: 'number' },
            avgOrderValue: { type: 'number' },
            salesByDay: { type: 'array' },
            salesByZone: { type: 'array' },
            salesByPaymentMethod: { type: 'array' },
            topCustomers: { type: 'array' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const query = dateRangeQuerySchema.parse(request.query);

      // Zone access check for LOCATION_ADMIN
      let zone = query.zone;
      if (request.user.role === UserRole.LOCATION_ADMIN && request.user.zones?.length > 0) {
        if (zone && !request.user.zones.includes(zone)) {
          return reply.code(403).send({ error: 'Access denied to this zone', code: 'FORBIDDEN' });
        }
        if (!zone && request.user.zones.length === 1) {
          zone = request.user.zones[0];
        }
      }

      const stats = await analyticsService.getSalesStats({
        startDate: query.startDate,
        endDate: query.endDate,
        zone,
      });

      return reply.send(stats);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/analytics/products - Product analytics
  fastify.get('/products', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      description: 'Get product analytics including top sellers and stock status',
      tags: ['analytics'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date for sales data (ISO format)' },
          endDate: { type: 'string', description: 'End date for sales data (ISO format)' },
          zone: { type: 'string', enum: ['KARKH', 'RUSAFA'], description: 'Filter by zone' },
        },
      },
      response: {
        200: {
          description: 'Product statistics',
          type: 'object',
          properties: {
            totalProducts: { type: 'number' },
            activeProducts: { type: 'number' },
            featuredProducts: { type: 'number' },
            lowStockProducts: { type: 'number' },
            outOfStockProducts: { type: 'number' },
            topSellingProducts: { type: 'array' },
            productsByCategory: { type: 'array' },
            revenueByCategory: { type: 'array' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const query = dateRangeQuerySchema.parse(request.query);

      // Zone access check for LOCATION_ADMIN
      let zone = query.zone;
      if (request.user.role === UserRole.LOCATION_ADMIN && request.user.zones?.length > 0) {
        if (zone && !request.user.zones.includes(zone)) {
          return reply.code(403).send({ error: 'Access denied to this zone', code: 'FORBIDDEN' });
        }
        if (!zone && request.user.zones.length === 1) {
          zone = request.user.zones[0];
        }
      }

      const stats = await analyticsService.getProductStats({
        startDate: query.startDate,
        endDate: query.endDate,
        zone,
      });

      return reply.send(stats);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/analytics/notify-requests - Notify request analytics
  fastify.get('/notify-requests', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      description: 'Get notify-me request analytics',
      tags: ['analytics'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (ISO format)' },
          endDate: { type: 'string', description: 'End date (ISO format)' },
        },
      },
      response: {
        200: {
          description: 'Notify request statistics',
          type: 'object',
          properties: {
            totalRequests: { type: 'number' },
            pendingRequests: { type: 'number' },
            notifiedRequests: { type: 'number' },
            requestsByProduct: { type: 'array' },
            requestsTrend: { type: 'array' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const query = dateRangeQuerySchema.parse(request.query);

      const stats = await analyticsService.getNotifyRequestStats({
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return reply.send(stats);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // ============================================
  // Vendor Dashboard Analytics
  // ============================================

  // Get vendor dashboard statistics
  fastify.get('/dashboard/vendor', {
    preHandler: [authenticate],
    schema: {
      tags: ['analytics'],
      summary: 'Get vendor dashboard statistics',
      description: 'Retrieve comprehensive dashboard statistics for vendors including revenue, orders, products, customers, and performance metrics.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Vendor dashboard statistics retrieved successfully',
          type: 'object',
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const user = request.user;

      if (![UserRole.COMPANY_ADMIN, UserRole.COMPANY_USER, UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Access denied to vendor dashboard'
        });
      }

      const stats = await analyticsService.getVendorDashboard(user.userId);

      return reply.send({ success: true, stats });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // Get admin dashboard overview
  fastify.get('/dashboard/admin', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])],
    schema: {
      tags: ['analytics'],
      summary: 'Get admin dashboard overview',
      description: 'Retrieve platform-wide statistics and overview for administrators.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Admin dashboard data retrieved successfully',
          type: 'object',
        },
        403: {
          description: 'Forbidden - admin role required',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
      },
    },
  }, async (request, reply) => {
    try {
      const dashboard = await analyticsService.getAdminDashboard();

      return reply.send({ success: true, dashboard });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // ============================================
  // Report Generation
  // ============================================

  // Generate sales report
  fastify.post('/reports/sales', {
    preHandler: [authenticate],
    schema: {
      tags: ['analytics'],
      summary: 'Generate sales report',
      description: 'Generate a detailed sales report for a specified date range.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          startDate: { type: 'string', format: 'date-time', description: 'Report start date' },
          endDate: { type: 'string', format: 'date-time', description: 'Report end date' },
          companyId: { type: 'string', format: 'uuid', description: 'Company ID (optional for admins)' },
        },
      },
      response: {
        200: {
          description: 'Sales report generated successfully',
          type: 'object',
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const { startDate, endDate, companyId } = request.body;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Start date and end date are required'
        });
      }

      let targetCompanyId = companyId;

      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_USER) {
        targetCompanyId = user.companyId;
      } else if (![UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions to generate sales report'
        });
      }

      if (!targetCompanyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const report = await analyticsService.generateSalesReport(
        targetCompanyId,
        { startDate: new Date(startDate), endDate: new Date(endDate) }
      );

      return reply.send({ success: true, report });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // Generate commission report
  fastify.post('/reports/commission', {
    preHandler: [authenticate],
    schema: {
      tags: ['analytics'],
      summary: 'Generate commission report',
      description: 'Generate a detailed commission report for vendors.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          startDate: { type: 'string', format: 'date-time', description: 'Report start date' },
          endDate: { type: 'string', format: 'date-time', description: 'Report end date' },
          companyId: { type: 'string', format: 'uuid', description: 'Company ID (optional for admins)' },
        },
      },
      response: {
        200: {
          description: 'Commission report generated successfully',
          type: 'object',
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const { startDate, endDate, companyId } = request.body;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Start date and end date are required'
        });
      }

      let targetCompanyId = companyId;

      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_USER) {
        targetCompanyId = user.companyId;
      } else if (![UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions to generate commission report'
        });
      }

      if (!targetCompanyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const report = await analyticsService.generateCommissionReport(
        targetCompanyId,
        { startDate: new Date(startDate), endDate: new Date(endDate) }
      );

      return reply.send({ success: true, report });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // Export report (placeholder)
  fastify.get('/export', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      description: 'Export analytics data (CSV or PDF)',
      tags: ['analytics'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['dashboard', 'sales', 'products', 'notify-requests'], description: 'Data type to export' },
          format: { type: 'string', enum: ['csv', 'pdf'], description: 'Export format' },
          startDate: { type: 'string', description: 'Start date (ISO format)' },
          endDate: { type: 'string', description: 'End date (ISO format)' },
          zone: { type: 'string', enum: ['KARKH', 'RUSAFA'], description: 'Filter by zone' },
        },
        required: ['type', 'format'],
      },
      response: {
        200: {
          description: 'Export successful',
          type: 'object',
          properties: {
            message: { type: 'string' },
            downloadUrl: { type: 'string', nullable: true },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { type, format } = request.query;

      // TODO: Implement actual export functionality
      return reply.send({
        message: `Export of ${type} in ${format} format is not yet implemented`,
        downloadUrl: null,
      });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });
};

export default analyticsRoutes;
