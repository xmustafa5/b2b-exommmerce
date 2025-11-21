import { FastifyPluginAsync } from 'fastify';
import { AnalyticsService } from '../services/analytics.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const analyticsService = new AnalyticsService(fastify);

  // Get vendor dashboard statistics
  fastify.get('/dashboard/vendor', {
    preHandler: [authenticate]
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
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])]
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
    preHandler: [authenticate]
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
    preHandler: [authenticate]
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
    preHandler: [authenticate]
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
    preHandler: [authenticate]
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