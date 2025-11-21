import { FastifyPluginAsync } from 'fastify';
import { AnalyticsService } from '../services/analytics.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

// ============================================================================
// Shared Schema Definitions
// ============================================================================

// Revenue statistics schema
const revenueSchema = {
  type: 'object',
  properties: {
    total: { type: 'number', description: 'Total revenue of all time' },
    today: { type: 'number', description: 'Revenue generated today' },
    thisWeek: { type: 'number', description: 'Revenue generated this week' },
    thisMonth: { type: 'number', description: 'Revenue generated this month' },
    growth: { type: 'number', description: 'Growth percentage compared to last period' }
  }
};

// Order statistics schema
const orderStatsSchema = {
  type: 'object',
  properties: {
    total: { type: 'number', description: 'Total number of orders' },
    pending: { type: 'number', description: 'Number of pending orders' },
    processing: { type: 'number', description: 'Number of orders being processed' },
    completed: { type: 'number', description: 'Number of completed orders' },
    cancelled: { type: 'number', description: 'Number of cancelled orders' },
    today: { type: 'number', description: 'Orders placed today' },
    thisWeek: { type: 'number', description: 'Orders placed this week' },
    thisMonth: { type: 'number', description: 'Orders placed this month' }
  }
};

// Best selling product schema
const bestSellingProductSchema = {
  type: 'object',
  properties: {
    productId: { type: 'string', format: 'uuid', description: 'Product unique identifier' },
    name: { type: 'string', description: 'Product name' },
    sales: { type: 'number', description: 'Total units sold' },
    revenue: { type: 'number', description: 'Total revenue generated' }
  }
};

// Product statistics schema
const productStatsSchema = {
  type: 'object',
  properties: {
    total: { type: 'number', description: 'Total number of products' },
    active: { type: 'number', description: 'Number of active products' },
    inactive: { type: 'number', description: 'Number of inactive products' },
    lowStock: { type: 'number', description: 'Products with stock less than 10' },
    outOfStock: { type: 'number', description: 'Products with zero stock' },
    bestSelling: {
      type: 'array',
      items: bestSellingProductSchema,
      description: 'Top 5 best selling products'
    }
  }
};

// Top customer schema
const topCustomerSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid', description: 'Customer user ID' },
    name: { type: 'string', description: 'Customer name' },
    orderCount: { type: 'number', description: 'Total number of orders' },
    totalSpent: { type: 'number', description: 'Total amount spent' }
  }
};

// Customer statistics schema
const customerStatsSchema = {
  type: 'object',
  properties: {
    total: { type: 'number', description: 'Total unique customers' },
    new: { type: 'number', description: 'New customers in last 30 days' },
    returning: { type: 'number', description: 'Returning customers' },
    topCustomers: {
      type: 'array',
      items: topCustomerSchema,
      description: 'Top 5 customers by spending'
    }
  }
};

// Performance metrics schema
const performanceSchema = {
  type: 'object',
  properties: {
    averageOrderValue: { type: 'number', description: 'Average value per order' },
    conversionRate: { type: 'number', description: 'Conversion rate percentage' },
    fulfillmentRate: { type: 'number', description: 'Order fulfillment rate percentage' },
    averageDeliveryTime: { type: 'number', description: 'Average delivery time in hours' }
  }
};

// Full vendor dashboard stats schema
const vendorDashboardStatsSchema = {
  type: 'object',
  properties: {
    revenue: revenueSchema,
    orders: orderStatsSchema,
    products: productStatsSchema,
    customers: customerStatsSchema,
    performance: performanceSchema
  }
};

// Admin dashboard overview schema
const adminOverviewSchema = {
  type: 'object',
  properties: {
    totalUsers: { type: 'number', description: 'Total registered users' },
    totalVendors: { type: 'number', description: 'Total vendor accounts' },
    totalShopOwners: { type: 'number', description: 'Total shop owner accounts' },
    totalCompanies: { type: 'number', description: 'Total registered companies' },
    activeCompanies: { type: 'number', description: 'Number of active companies' },
    totalProducts: { type: 'number', description: 'Total products in platform' },
    totalOrders: { type: 'number', description: 'Total orders placed' },
    todayOrders: { type: 'number', description: 'Orders placed today' },
    monthOrders: { type: 'number', description: 'Orders placed this month' },
    totalRevenue: { type: 'number', description: 'Total platform revenue' }
  }
};

// Date range schema
const dateRangeSchema = {
  type: 'object',
  properties: {
    startDate: { type: 'string', format: 'date-time', description: 'Start date of the period' },
    endDate: { type: 'string', format: 'date-time', description: 'End date of the period' }
  }
};

// Sales by date schema
const salesByDateSchema = {
  type: 'object',
  properties: {
    date: { type: 'string', format: 'date', description: 'Date of sales' },
    sales: { type: 'number', description: 'Total sales amount' },
    orders: { type: 'number', description: 'Number of orders' }
  }
};

// Sales by zone schema
const salesByZoneSchema = {
  type: 'object',
  properties: {
    zone: { type: 'string', description: 'Zone name' },
    sales: { type: 'number', description: 'Total sales in zone' },
    orders: { type: 'number', description: 'Number of orders in zone' }
  }
};

// Top product in report schema
const topProductReportSchema = {
  type: 'object',
  properties: {
    productId: { type: 'string', format: 'uuid', description: 'Product ID' },
    name: { type: 'string', description: 'Product name' },
    sales: { type: 'number', description: 'Total sales amount' },
    quantity: { type: 'number', description: 'Total quantity sold' }
  }
};

// Top category schema
const topCategorySchema = {
  type: 'object',
  properties: {
    categoryId: { type: 'string', format: 'uuid', description: 'Category ID' },
    name: { type: 'string', description: 'Category name' },
    sales: { type: 'number', description: 'Total sales amount' }
  }
};

// Sales report schema
const salesReportSchema = {
  type: 'object',
  properties: {
    period: dateRangeSchema,
    totalSales: { type: 'number', description: 'Total sales amount in period' },
    totalOrders: { type: 'number', description: 'Total number of orders' },
    totalCustomers: { type: 'number', description: 'Unique customers count' },
    averageOrderValue: { type: 'number', description: 'Average value per order' },
    topProducts: {
      type: 'array',
      items: topProductReportSchema,
      description: 'Top 10 selling products'
    },
    topCategories: {
      type: 'array',
      items: topCategorySchema,
      description: 'Top selling categories'
    },
    salesByDate: {
      type: 'array',
      items: salesByDateSchema,
      description: 'Daily sales breakdown'
    },
    salesByZone: {
      type: 'array',
      items: salesByZoneSchema,
      description: 'Sales breakdown by delivery zone'
    }
  }
};

// Commission transaction schema
const commissionTransactionSchema = {
  type: 'object',
  properties: {
    orderId: { type: 'string', format: 'uuid', description: 'Order ID' },
    date: { type: 'string', format: 'date-time', description: 'Transaction date' },
    amount: { type: 'number', description: 'Order amount' },
    commission: { type: 'number', description: 'Commission deducted' },
    payout: { type: 'number', description: 'Net payout amount' },
    status: { type: 'string', description: 'Transaction status' }
  }
};

// Commission report schema
const commissionReportSchema = {
  type: 'object',
  properties: {
    period: dateRangeSchema,
    totalRevenue: { type: 'number', description: 'Total revenue in period' },
    totalCommission: { type: 'number', description: 'Total commission deducted' },
    totalPayout: { type: 'number', description: 'Total net payout' },
    commissionRate: { type: 'number', description: 'Commission rate percentage' },
    transactions: {
      type: 'array',
      items: commissionTransactionSchema,
      description: 'List of commission transactions'
    }
  }
};

// Common error response schemas
const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'Error type' },
    message: { type: 'string', description: 'Error message' }
  }
};

const forbiddenResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'Error type, e.g. Forbidden' },
    message: { type: 'string', description: 'Access denied reason' }
  }
};

const badRequestResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'Error type, e.g. Bad Request' },
    message: { type: 'string', description: 'Validation error message' }
  }
};

// ============================================================================
// Routes
// ============================================================================

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const analyticsService = new AnalyticsService(fastify);

  // Get vendor dashboard statistics
  fastify.get('/dashboard/vendor', {
    preHandler: [authenticate],
    schema: {
      tags: ['analytics'],
      summary: 'Get vendor dashboard statistics',
      description: 'Retrieve comprehensive dashboard statistics for vendors including revenue, orders, products, customers, and performance metrics. Accessible by VENDOR, COMPANY_MANAGER, ADMIN, and SUPER_ADMIN roles.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Vendor dashboard statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            stats: vendorDashboardStatsSchema
          }
        },
        403: {
          description: 'Access denied - user does not have vendor permissions',
          ...forbiddenResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const user = request.user;

      // Check if user is a vendor, company manager, or admin
      if (![UserRole.VENDOR, UserRole.COMPANY_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Access denied to vendor dashboard'
        });
      }

      const stats = await analyticsService.getVendorDashboard(user.id);

      return reply.send({
        success: true,
        stats
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get admin dashboard overview
  fastify.get('/dashboard/admin', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])],
    schema: {
      tags: ['analytics'],
      summary: 'Get admin dashboard overview',
      description: 'Retrieve platform-wide statistics and overview for administrators. Includes total users, vendors, companies, products, orders, and revenue metrics. Only accessible by ADMIN and SUPER_ADMIN roles.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Admin dashboard data retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            dashboard: {
              type: 'object',
              properties: {
                overview: adminOverviewSchema,
                topCompanies: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _sum: {
                        type: 'object',
                        properties: {
                          totalAmount: { type: 'number', nullable: true, description: 'Total revenue amount' }
                        }
                      },
                      _count: { type: 'number', description: 'Number of orders' }
                    }
                  },
                  description: 'Top 5 performing companies by revenue'
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - authentication required',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - admin role required',
          ...forbiddenResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request, reply) => {
    try {
      const dashboard = await analyticsService.getAdminDashboard();

      return reply.send({
        success: true,
        dashboard
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Generate sales report
  fastify.post('/reports/sales', {
    preHandler: [authenticate],
    schema: {
      tags: ['analytics'],
      summary: 'Generate sales report',
      description: 'Generate a detailed sales report for a specified date range. Vendors and company managers can only view their own company data. Admins can specify a company ID to view any company data.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Report start date (ISO 8601 format)',
            description: 'ISO 8601 format, e.g. 2024-01-01T00:00:00.000Z'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Report end date (ISO 8601 format)',
            description: 'ISO 8601 format, e.g. 2024-12-31T23:59:59.999Z'
          },
          companyId: {
            type: 'string',
            format: 'uuid',
            description: 'Company ID (optional for admins, ignored for vendors/company managers)'
          }
        }
      },
      response: {
        200: {
          description: 'Sales report generated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            report: salesReportSchema
          }
        },
        400: {
          description: 'Bad request - missing required fields',
          ...badRequestResponseSchema
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          ...forbiddenResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const { startDate, endDate, companyId } = request.body;

      // Validate dates
      if (!startDate || !endDate) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Start date and end date are required'
        });
      }

      // Determine company ID based on user role
      let targetCompanyId = companyId;

      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        // Vendors and company managers can only view their own company data
        targetCompanyId = user.companyId;
      } else if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
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
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        }
      );

      return reply.send({
        success: true,
        report
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Generate commission report
  fastify.post('/reports/commission', {
    preHandler: [authenticate],
    schema: {
      tags: ['analytics'],
      summary: 'Generate commission report',
      description: 'Generate a detailed commission report showing revenue, commission deductions, and net payouts for a specified date range. Vendors and company managers can only view their own company data. Admins can specify a company ID.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Report start date (ISO 8601 format)',
            description: 'ISO 8601 format, e.g. 2024-01-01T00:00:00.000Z'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Report end date (ISO 8601 format)',
            description: 'ISO 8601 format, e.g. 2024-12-31T23:59:59.999Z'
          },
          companyId: {
            type: 'string',
            format: 'uuid',
            description: 'Company ID (optional for admins, ignored for vendors/company managers)'
          }
        }
      },
      response: {
        200: {
          description: 'Commission report generated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            report: commissionReportSchema
          }
        },
        400: {
          description: 'Bad request - missing required fields',
          ...badRequestResponseSchema
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          ...forbiddenResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const { startDate, endDate, companyId } = request.body;

      // Validate dates
      if (!startDate || !endDate) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Start date and end date are required'
        });
      }

      // Determine company ID based on user role
      let targetCompanyId = companyId;

      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        // Vendors and company managers can only view their own company data
        targetCompanyId = user.companyId;
      } else if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
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
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        }
      );

      return reply.send({
        success: true,
        report
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get real-time stats (WebSocket endpoint preparation)
  fastify.get('/realtime', {
    preHandler: [authenticate],
    schema: {
      tags: ['analytics'],
      summary: 'Get real-time statistics snapshot',
      description: 'Retrieve a current snapshot of real-time statistics. Admins receive platform-wide stats, vendors receive their company-specific stats. This endpoint serves as a REST fallback for WebSocket-based real-time updates.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Real-time stats retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            stats: {
              oneOf: [
                {
                  type: 'object',
                  description: 'Admin dashboard stats (for ADMIN/SUPER_ADMIN users)',
                  properties: {
                    overview: adminOverviewSchema,
                    topCompanies: { type: 'array', items: { type: 'object' } }
                  }
                },
                {
                  type: 'object',
                  description: 'Vendor dashboard stats (for VENDOR/COMPANY_MANAGER users)',
                  properties: {
                    revenue: revenueSchema,
                    orders: orderStatsSchema,
                    products: productStatsSchema,
                    customers: customerStatsSchema,
                    performance: performanceSchema
                  }
                }
              ]
            },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - no access to real-time stats',
          ...forbiddenResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const user = request.user;

      // This would typically connect to a WebSocket for real-time updates
      // For now, return current snapshot
      let stats;

      if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        stats = await analyticsService.getAdminDashboard();
      } else if (user.companyId) {
        stats = await analyticsService.getVendorDashboard(user.id);
      } else {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No access to real-time stats'
        });
      }

      return reply.send({
        success: true,
        stats,
        message: 'Real-time stats snapshot'
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Export report as CSV/PDF (placeholder for future implementation)
  fastify.post('/reports/export', {
    preHandler: [authenticate],
    schema: {
      tags: ['analytics'],
      summary: 'Export report to file',
      description: 'Export analytics reports to various file formats (CSV, PDF, Excel). This endpoint is currently a placeholder for future implementation.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['type', 'format'],
        properties: {
          type: {
            type: 'string',
            enum: ['sales', 'commission', 'inventory', 'customers', 'orders'],
            description: 'Type of report to export (e.g. sales)'
          },
          format: {
            type: 'string',
            enum: ['csv', 'pdf', 'excel'],
            description: 'Export file format (e.g. csv)'
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Report start date - ISO 8601 format, e.g. 2024-01-01T00:00:00.000Z'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Report end date - ISO 8601 format, e.g. 2024-12-31T23:59:59.999Z'
          },
          companyId: {
            type: 'string',
            format: 'uuid',
            description: 'Company ID for company-specific reports (optional for admins)'
          },
          filters: {
            type: 'object',
            description: 'Additional filters for the report',
            additionalProperties: true
          }
        }
      },
      response: {
        200: {
          description: 'Export request processed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            requestedFormat: {
              type: 'string',
              enum: ['csv', 'pdf', 'excel'],
              description: 'Requested export format'
            },
            requestedType: {
              type: 'string',
              enum: ['sales', 'commission', 'inventory', 'customers', 'orders'],
              description: 'Requested report type'
            },
            downloadUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to download the exported file (when implemented)',
              nullable: true
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Expiration time for the download URL (when implemented)',
              nullable: true
            }
          }
        },
        400: {
          description: 'Bad request - invalid parameters',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized - authentication required',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { type, format, startDate, endDate } = request.body;

      // Validate input
      if (!type || !format) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Report type and format are required'
        });
      }

      if (!['csv', 'pdf', 'excel'].includes(format)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid format. Supported formats: csv, pdf, excel'
        });
      }

      // TODO: Implement actual export functionality
      // This would generate the file and return a download URL

      return reply.send({
        success: true,
        message: 'Report export feature coming soon',
        requestedFormat: format,
        requestedType: type
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });
};

export default analyticsRoutes;