import { FastifyPluginAsync } from 'fastify';
import { PayoutService } from '../services/payout.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const payoutRoutes: FastifyPluginAsync = async (fastify) => {
  const payoutService = new PayoutService(fastify);

  // Create a payout request (Company Manager or Vendor)
  fastify.post('/request', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const user = request.user;

      // Only company managers and vendors can request payouts
      if (![UserRole.COMPANY_MANAGER, UserRole.VENDOR].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only company managers and vendors can request payouts'
        });
      }

      if (!user.companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'User not associated with any company'
        });
      }

      const payoutData = {
        ...request.body,
        companyId: user.companyId
      };

      const payout = await payoutService.createPayout(payoutData);

      return reply.code(201).send({
        success: true,
        payout,
        message: 'Payout request created successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get available balance for payout
  fastify.get('/balance', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const user = request.user;

      if (![UserRole.COMPANY_MANAGER, UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      const companyId = request.query.companyId || user.companyId;

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      // Check if user can access this company's data
      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        if (user.companyId !== companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only view balance for your own company'
          });
        }
      }

      const balance = await payoutService.calculateAvailableBalance(companyId);

      return reply.send({
        success: true,
        balance,
        currency: 'IQD'
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get payout history
  fastify.get('/history', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const query = request.query;

      let filter: any = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        status: query.status,
        method: query.method,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
        minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
        maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined
      };

      // Set company filter based on user role
      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        filter.companyId = user.companyId;
      } else if (query.companyId) {
        filter.companyId = query.companyId;
      }

      const result = await payoutService.getPayoutHistory(filter);

      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get payout summary
  fastify.get('/summary', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const { companyId } = request.query;

      let targetCompanyId = companyId || user.companyId;

      if (!targetCompanyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      // Check authorization
      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        if (user.companyId !== targetCompanyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only view summary for your own company'
          });
        }
      }

      const summary = await payoutService.getPayoutSummary(targetCompanyId);

      return reply.send({
        success: true,
        summary
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Update payout status (Admin only)
  fastify.patch('/:id/status', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { status, notes } = request.body;

      if (!status) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Status is required'
        });
      }

      const payout = await payoutService.updatePayoutStatus(
        id,
        status,
        request.user.id,
        notes
      );

      return reply.send({
        success: true,
        payout,
        message: `Payout status updated to ${status}`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Cancel payout
  fastify.delete('/:id', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { reason } = request.body;

      if (!reason) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cancellation reason is required'
        });
      }

      // TODO: Check if user has permission to cancel this payout
      const payout = await payoutService.cancelPayout(id, reason);

      return reply.send({
        success: true,
        payout,
        message: 'Payout cancelled successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Generate payout report
  fastify.post('/report', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const { companyId, startDate, endDate } = request.body;

      if (!startDate || !endDate) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Start date and end date are required'
        });
      }

      let targetCompanyId = companyId || user.companyId;

      if (!targetCompanyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      // Check authorization
      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        if (user.companyId !== targetCompanyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only generate reports for your own company'
          });
        }
      }

      const report = await payoutService.generatePayoutReport(
        targetCompanyId,
        new Date(startDate),
        new Date(endDate)
      );

      return reply.send({
        success: true,
        report
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Schedule automatic payouts
  fastify.post('/schedule', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const { schedule } = request.body;

      if (!['WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(schedule)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid schedule. Must be WEEKLY, BIWEEKLY, or MONTHLY'
        });
      }

      if (![UserRole.COMPANY_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only company managers and admins can schedule automatic payouts'
        });
      }

      const companyId = user.companyId || request.body.companyId;

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const result = await payoutService.scheduleAutomaticPayout(companyId, schedule);

      return reply.send({
        success: true,
        schedule: result,
        message: `Automatic ${schedule.toLowerCase()} payouts scheduled successfully`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get pending payouts for review (Admin only)
  fastify.get('/pending', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])]
  }, async (request, reply) => {
    try {
      const payouts = await payoutService.getPendingPayoutsForReview();

      return reply.send({
        success: true,
        payouts,
        total: payouts.length
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Bulk approve payouts (Admin only)
  fastify.post('/bulk-approve', {
    preHandler: [authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { payoutIds } = request.body;

      if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Payout IDs array is required'
        });
      }

      const result = await payoutService.bulkApprovePayouts(payoutIds, request.user.id);

      return reply.send({
        success: true,
        ...result,
        message: `${result.approved} payouts approved successfully`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Validate bank details
  fastify.post('/validate-bank', async (request: any, reply) => {
    try {
      const { bankDetails } = request.body;

      const isValid = payoutService.validateBankDetails(bankDetails);

      return reply.send({
        success: true,
        valid: isValid,
        message: isValid ? 'Bank details are valid' : 'Invalid bank details'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });
};

export default payoutRoutes;