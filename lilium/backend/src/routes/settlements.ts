import { FastifyPluginAsync } from 'fastify';
import { SettlementService } from '../services/settlement.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const settlementRoutes: FastifyPluginAsync = async (fastify) => {
  const settlementService = new SettlementService(fastify);

  // Create settlement for a period (Admin/Company Manager)
  fastify.post('/create', {
    preHandler: [authenticate],
    schema: {
      tags: ['settlements'],
      summary: 'Create settlement for a period',
      body: {
        type: 'object',
        properties: {
          companyId: { type: 'string' },
          periodStart: { type: 'string', format: 'date-time' },
          periodEnd: { type: 'string', format: 'date-time' }
        },
        required: ['periodStart', 'periodEnd']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { companyId: bodyCompanyId, periodStart, periodEnd } = request.body;
      const user = request.user;

      let companyId = bodyCompanyId;

      // Company managers can only create settlements for their own company
      if (user.role === UserRole.COMPANY_MANAGER) {
        if (bodyCompanyId && bodyCompanyId !== user.companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only create settlements for your own company'
          });
        }
        companyId = user.companyId;
      } else if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only admins and company managers can create settlements'
        });
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const settlement = await settlementService.createSettlement(
        companyId,
        new Date(periodStart),
        new Date(periodEnd)
      );

      return reply.code(201).send({
        success: true,
        settlement,
        message: 'Settlement created successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get settlement summary (Vendor/Company Manager)
  fastify.get('/summary', {
    preHandler: [authenticate],
    schema: {
      tags: ['settlements'],
      summary: 'Get settlement summary',
      query: {
        type: 'object',
        properties: {
          companyId: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { companyId: queryCompanyId, startDate, endDate } = request.query;
      const user = request.user;

      let companyId = queryCompanyId || user.companyId;

      // Non-admin users can only view their company's summary
      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        if (queryCompanyId && queryCompanyId !== user.companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only view settlements for your own company'
          });
        }
        companyId = user.companyId;
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const summary = await settlementService.getSettlementSummary(
        companyId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      return reply.send({
        success: true,
        summary
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Reconcile cash collections (Company Manager/Admin)
  fastify.post('/reconcile-cash', {
    preHandler: [authenticate],
    schema: {
      tags: ['settlements'],
      summary: 'Reconcile cash collections for a period',
      body: {
        type: 'object',
        properties: {
          companyId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' }
        },
        required: ['startDate', 'endDate']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { companyId: bodyCompanyId, startDate, endDate } = request.body;
      const user = request.user;

      let companyId = bodyCompanyId;

      // Company managers can only reconcile for their own company
      if (user.role === UserRole.COMPANY_MANAGER) {
        if (bodyCompanyId && bodyCompanyId !== user.companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only reconcile cash for your own company'
          });
        }
        companyId = user.companyId;
      } else if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only admins and company managers can reconcile cash'
        });
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const reconciliations = await settlementService.reconcileCash(
        companyId,
        new Date(startDate),
        new Date(endDate)
      );

      return reply.send({
        success: true,
        reconciliations,
        total: reconciliations.length,
        message: 'Cash reconciliation completed'
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Mark cash as collected (Vendor/Company Manager)
  fastify.post('/cash-collected', {
    preHandler: [authenticate],
    schema: {
      tags: ['settlements'],
      summary: 'Mark cash as collected for an order',
      body: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          amount: { type: 'number', minimum: 0 }
        },
        required: ['orderId', 'amount']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderId, amount } = request.body;
      const user = request.user;

      // Verify user has permission for this order
      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        const order = await fastify.prisma.order.findFirst({
          where: {
            id: orderId,
            items: {
              some: {
                product: {
                  companyId: user.companyId
                }
              }
            }
          }
        });

        if (!order) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to mark cash for this order'
          });
        }
      }

      await settlementService.markCashCollected(orderId, amount, user.id);

      return reply.send({
        success: true,
        message: 'Cash collection marked successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get pending cash collections (Vendor/Company Manager)
  fastify.get('/pending-cash', {
    preHandler: [authenticate],
    schema: {
      tags: ['settlements'],
      summary: 'Get pending cash collections',
      query: {
        type: 'object',
        properties: {
          companyId: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { companyId: queryCompanyId } = request.query;
      const user = request.user;

      let companyId = queryCompanyId || user.companyId;

      // Non-admin users can only view their company's pending cash
      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        if (queryCompanyId && queryCompanyId !== user.companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only view pending cash for your own company'
          });
        }
        companyId = user.companyId;
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const pendingCollections = await settlementService.getPendingCashCollections(companyId);

      return reply.send({
        success: true,
        pendingCollections,
        total: pendingCollections.length,
        totalAmount: pendingCollections.reduce((sum, order) => sum + order.orderAmount, 0)
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Process daily settlement (Admin/Company Manager)
  fastify.post('/daily', {
    preHandler: [authenticate],
    schema: {
      tags: ['settlements'],
      summary: 'Process daily settlement',
      body: {
        type: 'object',
        properties: {
          companyId: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { companyId: bodyCompanyId } = request.body;
      const user = request.user;

      let companyId = bodyCompanyId || user.companyId;

      // Company managers can only process for their own company
      if (user.role === UserRole.COMPANY_MANAGER) {
        if (bodyCompanyId && bodyCompanyId !== user.companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only process settlements for your own company'
          });
        }
        companyId = user.companyId;
      } else if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only admins and company managers can process settlements'
        });
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const settlement = await settlementService.processDailySettlement(companyId);

      return reply.send({
        success: true,
        settlement,
        message: 'Daily settlement processed successfully'
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Verify settlement (Admin only)
  fastify.patch('/:settlementId/verify', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])],
    schema: {
      tags: ['settlements'],
      summary: 'Verify and approve settlement',
      params: {
        type: 'object',
        properties: {
          settlementId: { type: 'string' }
        },
        required: ['settlementId']
      },
      body: {
        type: 'object',
        properties: {
          notes: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { settlementId } = request.params;
      const { notes } = request.body;
      const user = request.user;

      const settlement = await settlementService.verifySettlement(
        settlementId,
        user.id,
        notes
      );

      return reply.send({
        success: true,
        settlement,
        message: 'Settlement verified successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get settlement history (Vendor/Company Manager)
  fastify.get('/history', {
    preHandler: [authenticate],
    schema: {
      tags: ['settlements'],
      summary: 'Get settlement history',
      query: {
        type: 'object',
        properties: {
          companyId: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { companyId: queryCompanyId, limit = 10 } = request.query;
      const user = request.user;

      let companyId = queryCompanyId || user.companyId;

      // Non-admin users can only view their company's history
      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        if (queryCompanyId && queryCompanyId !== user.companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only view settlement history for your own company'
          });
        }
        companyId = user.companyId;
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const history = await settlementService.getSettlementHistory(companyId, limit);

      return reply.send({
        success: true,
        settlements: history,
        total: history.length
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Calculate platform earnings (Admin only)
  fastify.get('/platform-earnings', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])],
    schema: {
      tags: ['settlements'],
      summary: 'Calculate platform earnings for a period',
      query: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' }
        },
        required: ['startDate', 'endDate']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { startDate, endDate } = request.query;

      const earnings = await settlementService.calculatePlatformEarnings(
        new Date(startDate),
        new Date(endDate)
      );

      return reply.send({
        success: true,
        earnings
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get cash flow report (Company Manager/Admin)
  fastify.get('/cash-flow', {
    preHandler: [authenticate],
    schema: {
      tags: ['settlements'],
      summary: 'Get cash flow report',
      query: {
        type: 'object',
        properties: {
          companyId: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { companyId: queryCompanyId, startDate, endDate } = request.query;
      const user = request.user;

      let companyId = queryCompanyId || user.companyId;

      // Non-admin users can only view their company's cash flow
      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        if (queryCompanyId && queryCompanyId !== user.companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only view cash flow for your own company'
          });
        }
        companyId = user.companyId;
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      // Get settlement summary which includes cash flow data
      const summary = await settlementService.getSettlementSummary(
        companyId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      return reply.send({
        success: true,
        cashFlow: summary.cashFlow,
        period: summary.period,
        company: {
          id: summary.companyId,
          name: summary.companyName
        }
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });
};

export default settlementRoutes;