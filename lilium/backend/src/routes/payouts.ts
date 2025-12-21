import { FastifyPluginAsync } from 'fastify';
import { PayoutService } from '../services/payout.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

// Reusable schema definitions
const payoutStatusEnum = {
  type: 'string',
  enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  description: 'Status of the payout request'
};

const payoutMethodEnum = {
  type: 'string',
  enum: ['BANK_TRANSFER', 'CASH', 'WALLET', 'CHECK'],
  description: 'Payment method for the payout'
};

const bankDetailsSchema = {
  type: 'object',
  properties: {
    accountName: { type: 'string', description: 'Bank account holder name' },
    accountNumber: { type: 'string', description: 'Bank account number' },
    bankName: { type: 'string', description: 'Name of the bank' },
    iban: { type: 'string', nullable: true, description: 'International Bank Account Number (optional)' },
    swiftCode: { type: 'string', nullable: true, description: 'SWIFT/BIC code (optional)' }
  },
  required: ['accountName', 'accountNumber', 'bankName']
};

const payoutSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Unique payout identifier' },
    companyId: { type: 'string', format: 'uuid', description: 'Company ID associated with the payout' },
    amount: { type: 'number', description: 'Payout amount in IQD' },
    method: payoutMethodEnum,
    status: payoutStatusEnum,
    bankDetails: { ...bankDetailsSchema, nullable: true },
    notes: { type: 'string', nullable: true, description: 'Additional notes for the payout' },
    ordersIncluded: {
      type: 'array',
      items: { type: 'string' },
      description: 'Array of order IDs included in this payout'
    },
    processedBy: { type: 'string', format: 'uuid', nullable: true, description: 'ID of admin who processed the payout' },
    processedAt: { type: 'string', format: 'date-time', nullable: true, description: 'When the payout was processed' },
    requestedAt: { type: 'string', format: 'date-time', description: 'When the payout was requested' },
    createdAt: { type: 'string', format: 'date-time', description: 'Record creation timestamp' },
    updatedAt: { type: 'string', format: 'date-time', description: 'Record last update timestamp' }
  }
};

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'Error type' },
    message: { type: 'string', description: 'Error message' }
  }
};

const successResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', description: 'Operation success status' },
    message: { type: 'string', description: 'Success message' }
  }
};

const payoutRoutes: FastifyPluginAsync = async (fastify) => {
  const payoutService = new PayoutService(fastify);

  // Create a payout request (Company Manager or Vendor)
  fastify.post('/request', {
    preHandler: [authenticate],
    schema: {
      tags: ['payouts'],
      summary: 'Create payout request',
      description: 'Create a new payout request. Only accessible by COMPANY_MANAGER and VENDOR roles. The payout amount must not exceed the available balance.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['amount', 'method'],
        properties: {
          amount: { type: 'number', minimum: 1, description: 'Payout amount in IQD (must not exceed available balance)' },
          method: payoutMethodEnum,
          bankDetails: { ...bankDetailsSchema, description: 'Required if method is BANK_TRANSFER' },
          notes: { type: 'string', description: 'Additional notes for the payout request' },
          ordersIncluded: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            description: 'Array of order IDs to include in this payout'
          }
        }
      },
      response: {
        201: {
          description: 'Payout request created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            payout: payoutSchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - validation error or insufficient balance',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - only company managers and vendors can request payouts',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const user = request.user;

      // Only company managers and vendors can request payouts
      if (![UserRole.COMPANY_ADMIN, UserRole.COMPANY_ADMIN].includes(user.role)) {
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
    preHandler: [authenticate],
    schema: {
      tags: ['payouts'],
      summary: 'Get available balance for payout',
      description: 'Retrieve the available balance that can be requested for payout. Company managers and vendors can only view their own company balance, while admins can view any company balance.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          companyId: {
            type: 'string',
            format: 'uuid',
            description: 'Company ID to check balance for (optional for admins, ignored for company managers/vendors)'
          }
        }
      },
      response: {
        200: {
          description: 'Available balance retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            balance: { type: 'number', description: 'Available balance amount in IQD' },
            currency: { type: 'string', description: 'Currency code (IQD)' }
          }
        },
        400: {
          description: 'Bad request - company ID is required',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - insufficient permissions or trying to access another company balance',
          ...errorResponseSchema
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

      if (![UserRole.COMPANY_ADMIN, UserRole.COMPANY_ADMIN, UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
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
      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_ADMIN) {
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
    preHandler: [authenticate],
    schema: {
      tags: ['payouts'],
      summary: 'Get payout history',
      description: 'Retrieve paginated payout history with optional filters. Company managers and vendors can only view their own company payouts, while admins can view all payouts.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1, description: 'Page number for pagination' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20, description: 'Number of items per page' },
          companyId: { type: 'string', format: 'uuid', description: 'Filter by company ID (admins only)' },
          status: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
            description: 'Filter by payout status'
          },
          method: {
            type: 'string',
            enum: ['BANK_TRANSFER', 'CASH', 'WALLET', 'CHECK'],
            description: 'Filter by payment method'
          },
          fromDate: { type: 'string', format: 'date', description: 'Filter payouts from this date (YYYY-MM-DD)' },
          toDate: { type: 'string', format: 'date', description: 'Filter payouts until this date (YYYY-MM-DD)' },
          minAmount: { type: 'number', minimum: 0, description: 'Minimum payout amount filter' },
          maxAmount: { type: 'number', minimum: 0, description: 'Maximum payout amount filter' }
        }
      },
      response: {
        200: {
          description: 'Payout history retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            payouts: {
              type: 'array',
              items: payoutSchema
            },
            total: { type: 'number', description: 'Total number of payouts matching the filters' },
            page: { type: 'number', description: 'Current page number' },
            limit: { type: 'number', description: 'Items per page' },
            totalPages: { type: 'number', description: 'Total number of pages' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
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
      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_ADMIN) {
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
    preHandler: [authenticate],
    schema: {
      tags: ['payouts'],
      summary: 'Get payout summary',
      description: 'Retrieve a summary of payouts for a company including total payouts, pending amounts, completed amounts, and other statistics. Company managers and vendors can only view their own company summary.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          companyId: {
            type: 'string',
            format: 'uuid',
            description: 'Company ID to get summary for (optional for admins, ignored for company managers/vendors)'
          }
        }
      },
      response: {
        200: {
          description: 'Payout summary retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            summary: {
              type: 'object',
              properties: {
                totalPayouts: { type: 'number', description: 'Total number of payouts' },
                totalAmount: { type: 'number', description: 'Total amount of all payouts in IQD' },
                pendingPayouts: { type: 'number', description: 'Number of pending payouts' },
                pendingAmount: { type: 'number', description: 'Total amount of pending payouts in IQD' },
                completedPayouts: { type: 'number', description: 'Number of completed payouts' },
                completedAmount: { type: 'number', description: 'Total amount of completed payouts in IQD' },
                averagePayoutAmount: { type: 'number', description: 'Average payout amount in IQD' },
                lastPayoutDate: { type: 'string', format: 'date-time', nullable: true, description: 'Date of the last payout' },
                nextScheduledPayout: { type: 'string', format: 'date-time', nullable: true, description: 'Date of the next scheduled payout' }
              }
            }
          }
        },
        400: {
          description: 'Bad request - company ID is required',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - trying to access another company summary',
          ...errorResponseSchema
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
      const { companyId } = request.query;

      let targetCompanyId = companyId || user.companyId;

      if (!targetCompanyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      // Check authorization
      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_ADMIN) {
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
    preHandler: [authenticate, authorize([UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN])],
    schema: {
      tags: ['payouts'],
      summary: 'Update payout status',
      description: 'Update the status of a payout request. Only accessible by ADMIN and SUPER_ADMIN roles. Used to approve, process, complete, or reject payout requests.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Payout ID to update' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
            description: 'New status for the payout'
          },
          notes: { type: 'string', description: 'Admin notes about the status change' }
        }
      },
      response: {
        200: {
          description: 'Payout status updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            payout: payoutSchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - status is required or invalid status transition',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - only admins can update payout status',
          ...errorResponseSchema
        },
        404: {
          description: 'Payout not found',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate],
    schema: {
      tags: ['payouts'],
      summary: 'Cancel payout',
      description: 'Cancel a pending payout request. Only the requesting user or admins can cancel a payout. Requires a cancellation reason.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Payout ID to cancel' }
        }
      },
      body: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: { type: 'string', minLength: 1, description: 'Reason for cancelling the payout request' }
        }
      },
      response: {
        200: {
          description: 'Payout cancelled successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            payout: payoutSchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - cancellation reason is required or payout cannot be cancelled',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - no permission to cancel this payout',
          ...errorResponseSchema
        },
        404: {
          description: 'Payout not found',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate],
    schema: {
      tags: ['payouts'],
      summary: 'Generate payout report',
      description: 'Generate a detailed payout report for a specific period. Includes order details, revenue breakdown, commission calculations, and payout amounts. Company managers and vendors can only generate reports for their own company.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['startDate', 'endDate'],
        properties: {
          companyId: { type: 'string', format: 'uuid', description: 'Company ID to generate report for (optional for admins)' },
          startDate: { type: 'string', format: 'date', description: 'Report start date (YYYY-MM-DD)' },
          endDate: { type: 'string', format: 'date', description: 'Report end date (YYYY-MM-DD)' }
        }
      },
      response: {
        200: {
          description: 'Payout report generated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            report: {
              type: 'object',
              properties: {
                company: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    commissionRate: { type: 'number' }
                  }
                },
                period: {
                  type: 'object',
                  properties: {
                    start: { type: 'string', format: 'date-time' },
                    end: { type: 'string', format: 'date-time' }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalOrders: { type: 'number', description: 'Total number of completed orders' },
                    totalRevenue: { type: 'number', description: 'Total revenue in IQD' },
                    totalCommission: { type: 'number', description: 'Total commission deducted in IQD' },
                    totalPayout: { type: 'number', description: 'Total payout amount in IQD' }
                  }
                },
                orders: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      orderId: { type: 'string' },
                      date: { type: 'string', format: 'date-time' },
                      revenue: { type: 'number' },
                      commission: { type: 'number' },
                      payout: { type: 'number' },
                      status: { type: 'string' }
                    }
                  }
                },
                generatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        400: {
          description: 'Bad request - start date and end date are required',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - trying to generate report for another company',
          ...errorResponseSchema
        },
        404: {
          description: 'Company not found',
          ...errorResponseSchema
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
      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_ADMIN) {
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
    preHandler: [authenticate],
    schema: {
      tags: ['payouts'],
      summary: 'Schedule automatic payouts',
      description: 'Set up automatic payout scheduling for a company. Only accessible by COMPANY_MANAGER, ADMIN, and SUPER_ADMIN roles. Payouts can be scheduled weekly, biweekly, or monthly.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['schedule'],
        properties: {
          schedule: {
            type: 'string',
            enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'],
            description: 'Payout schedule frequency'
          },
          companyId: { type: 'string', format: 'uuid', description: 'Company ID to set schedule for (optional for admins)' }
        }
      },
      response: {
        200: {
          description: 'Automatic payout scheduled successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            schedule: {
              type: 'object',
              properties: {
                companyId: { type: 'string', format: 'uuid' },
                schedule: { type: 'string', enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] },
                enabled: { type: 'boolean' },
                nextPayoutDate: { type: 'string', format: 'date-time', description: 'Next scheduled payout date' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - invalid schedule value or company ID required',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - only company managers and admins can schedule automatic payouts',
          ...errorResponseSchema
        }
      }
    }
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

      if (![UserRole.COMPANY_ADMIN, UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
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
    preHandler: [authenticate, authorize([UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN])],
    schema: {
      tags: ['payouts'],
      summary: 'Get pending payouts for review',
      description: 'Retrieve all pending payout requests that need admin review. Only accessible by ADMIN and SUPER_ADMIN roles. Used for the admin dashboard to review and approve/reject payout requests.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Pending payouts retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            payouts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ...payoutSchema.properties,
                  company: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' }
                    },
                    description: 'Company information'
                  }
                }
              }
            },
            total: { type: 'number', description: 'Total number of pending payouts' }
          }
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - only admins can view pending payouts',
          ...errorResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate, authorize([UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN])],
    schema: {
      tags: ['payouts'],
      summary: 'Bulk approve payouts',
      description: 'Approve multiple pending payout requests at once. Only accessible by ADMIN and SUPER_ADMIN roles. All specified payouts will be moved to PROCESSING status.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['payoutIds'],
        properties: {
          payoutIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            description: 'Array of payout IDs to approve'
          }
        }
      },
      response: {
        200: {
          description: 'Payouts approved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            approved: { type: 'number', description: 'Number of payouts approved' },
            payouts: {
              type: 'array',
              items: payoutSchema,
              description: 'List of approved payouts'
            },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - payout IDs array is required or invalid',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - only admins can bulk approve payouts',
          ...errorResponseSchema
        }
      }
    }
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
  fastify.post('/validate-bank', {
    schema: {
      tags: ['payouts'],
      summary: 'Validate bank details',
      description: 'Validate bank account details before submitting a payout request. This is a public endpoint that does not require authentication. Useful for validating bank details in forms.',
      body: {
        type: 'object',
        required: ['bankDetails'],
        properties: {
          bankDetails: {
            type: 'object',
            required: ['accountName', 'accountNumber', 'bankName'],
            properties: {
              accountName: { type: 'string', minLength: 2, description: 'Bank account holder name' },
              accountNumber: { type: 'string', minLength: 5, description: 'Bank account number' },
              bankName: { type: 'string', minLength: 2, description: 'Name of the bank' },
              iban: { type: 'string', nullable: true, description: 'International Bank Account Number (optional)' },
              swiftCode: { type: 'string', nullable: true, description: 'SWIFT/BIC code (optional)' }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Bank details validation result',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            valid: { type: 'boolean', description: 'Whether the bank details are valid' },
            message: { type: 'string', description: 'Validation message' }
          }
        },
        400: {
          description: 'Bad request - invalid request body',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
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