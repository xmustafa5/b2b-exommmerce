"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const settlement_service_1 = require("../services/settlement.service");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const settlementRoutes = async (fastify) => {
    const settlementService = new settlement_service_1.SettlementService(fastify);
    // Create settlement for a period (Admin/Company Manager)
    fastify.post('/create', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['settlements'],
            summary: 'Create settlement for a period',
            description: 'Creates a new settlement record for a company within a specified date range. Admins can create settlements for any company, while company managers can only create settlements for their own company. The settlement includes all orders within the period.',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                description: 'Settlement creation parameters',
                properties: {
                    companyId: {
                        type: 'string',
                        description: 'UUID of the company to create settlement for. Optional for company managers (defaults to their own company), e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    },
                    periodStart: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Start date/time of the settlement period in ISO 8601 format, e.g. "2024-01-01T00:00:00Z"'
                    },
                    periodEnd: {
                        type: 'string',
                        format: 'date-time',
                        description: 'End date/time of the settlement period in ISO 8601 format, e.g. "2024-01-31T23:59:59Z"'
                    }
                },
                required: ['periodStart', 'periodEnd']
            },
            response: {
                201: {
                    type: 'object',
                    description: 'Settlement created successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        settlement: {
                            type: 'object',
                            description: 'The created settlement record',
                            properties: {
                                id: { type: 'string', description: 'Settlement UUID' },
                                companyId: { type: 'string', description: 'Company UUID' },
                                periodStart: { type: 'string', format: 'date-time', description: 'Settlement period start' },
                                periodEnd: { type: 'string', format: 'date-time', description: 'Settlement period end' },
                                totalSales: { type: 'number', description: 'Total sales amount in IQD' },
                                platformFee: { type: 'number', description: 'Platform fee amount in IQD' },
                                netAmount: { type: 'number', description: 'Net amount payable in IQD' },
                                status: { type: 'string', description: 'Settlement status: PENDING, VERIFIED, PAID' },
                                createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
                            }
                        },
                        message: { type: 'string', description: 'Success message' }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - validation error or missing required fields',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - user does not have permission to create settlements',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { companyId: bodyCompanyId, periodStart, periodEnd } = request.body;
            const user = request.user;
            let companyId = bodyCompanyId;
            // Company managers can only create settlements for their own company
            if (user.role === client_1.UserRole.COMPANY_ADMIN) {
                if (bodyCompanyId && bodyCompanyId !== user.companyId) {
                    return reply.code(403).send({
                        error: 'Forbidden',
                        message: 'You can only create settlements for your own company'
                    });
                }
                companyId = user.companyId;
            }
            else if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(user.role)) {
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
            const settlement = await settlementService.createSettlement(companyId, new Date(periodStart), new Date(periodEnd));
            return reply.code(201).send({
                success: true,
                settlement,
                message: 'Settlement created successfully'
            });
        }
        catch (error) {
            return reply.code(400).send(error);
        }
    });
    // Get settlement summary (Vendor/Company Manager)
    fastify.get('/summary', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['settlements'],
            summary: 'Get settlement summary',
            description: 'Retrieves a comprehensive settlement summary for a company including total sales, platform fees, cash collections, pending amounts, and cash flow data. Non-admin users can only view their own company\'s summary.',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                description: 'Query parameters for filtering the settlement summary',
                properties: {
                    companyId: {
                        type: 'string',
                        description: 'UUID of the company to get summary for. Optional for non-admins (defaults to their own company), e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    },
                    startDate: {
                        type: 'string',
                        format: 'date',
                        description: 'Start date for the summary period in YYYY-MM-DD format, e.g. "2024-01-01"'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date',
                        description: 'End date for the summary period in YYYY-MM-DD format, e.g. "2024-01-31"'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Settlement summary retrieved successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        summary: {
                            type: 'object',
                            description: 'The settlement summary data',
                            properties: {
                                companyId: { type: 'string', description: 'Company UUID' },
                                companyName: { type: 'string', description: 'Company name' },
                                period: {
                                    type: 'object',
                                    description: 'Summary period details',
                                    properties: {
                                        start: { type: 'string', format: 'date-time', description: 'Period start date' },
                                        end: { type: 'string', format: 'date-time', description: 'Period end date' }
                                    }
                                },
                                totalSales: { type: 'number', description: 'Total sales amount in IQD' },
                                totalPlatformFees: { type: 'number', description: 'Total platform fees in IQD' },
                                totalCashCollected: { type: 'number', description: 'Total cash collected in IQD' },
                                pendingCashAmount: { type: 'number', description: 'Pending cash collection amount in IQD' },
                                netPayable: { type: 'number', description: 'Net amount payable to company in IQD' },
                                cashFlow: {
                                    type: 'object',
                                    description: 'Cash flow breakdown',
                                    properties: {
                                        inflow: { type: 'number', description: 'Total cash inflow in IQD' },
                                        outflow: { type: 'number', description: 'Total cash outflow in IQD' },
                                        balance: { type: 'number', description: 'Net cash balance in IQD' }
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - missing company ID',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - user does not have permission to view this company\'s settlements',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { companyId: queryCompanyId, startDate, endDate } = request.query;
            const user = request.user;
            let companyId = queryCompanyId || user.companyId;
            // Non-admin users can only view their company's summary
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(user.role)) {
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
            const summary = await settlementService.getSettlementSummary(companyId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            return reply.send({
                success: true,
                summary
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Reconcile cash collections (Company Manager/Admin)
    fastify.post('/reconcile-cash', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['settlements'],
            summary: 'Reconcile cash collections for a period',
            description: 'Reconciles cash collections for a company within a specified date range. This process verifies collected cash against order records and identifies any discrepancies. Only admins and company managers can perform reconciliation.',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                description: 'Cash reconciliation parameters',
                properties: {
                    companyId: {
                        type: 'string',
                        description: 'UUID of the company to reconcile cash for. Optional for company managers (defaults to their own company), e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    },
                    startDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Start date/time of the reconciliation period in ISO 8601 format, e.g. "2024-01-01T00:00:00Z"'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'End date/time of the reconciliation period in ISO 8601 format, e.g. "2024-01-31T23:59:59Z"'
                    }
                },
                required: ['startDate', 'endDate']
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Cash reconciliation completed successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        reconciliations: {
                            type: 'array',
                            description: 'List of reconciliation records',
                            items: {
                                type: 'object',
                                properties: {
                                    orderId: { type: 'string', description: 'Order UUID' },
                                    orderNumber: { type: 'string', description: 'Order reference number' },
                                    expectedAmount: { type: 'number', description: 'Expected cash amount in IQD' },
                                    collectedAmount: { type: 'number', description: 'Actual collected amount in IQD' },
                                    discrepancy: { type: 'number', description: 'Difference between expected and collected in IQD' },
                                    status: { type: 'string', description: 'Reconciliation status: MATCHED, SHORTAGE, OVERAGE' },
                                    collectedAt: { type: 'string', format: 'date-time', description: 'Collection timestamp' }
                                }
                            }
                        },
                        total: { type: 'integer', description: 'Total number of reconciliation records' },
                        message: { type: 'string', description: 'Success message' }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - missing required fields',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - user does not have permission to reconcile cash',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { companyId: bodyCompanyId, startDate, endDate } = request.body;
            const user = request.user;
            let companyId = bodyCompanyId;
            // Company managers can only reconcile for their own company
            if (user.role === client_1.UserRole.COMPANY_ADMIN) {
                if (bodyCompanyId && bodyCompanyId !== user.companyId) {
                    return reply.code(403).send({
                        error: 'Forbidden',
                        message: 'You can only reconcile cash for your own company'
                    });
                }
                companyId = user.companyId;
            }
            else if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(user.role)) {
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
            const reconciliations = await settlementService.reconcileCash(companyId, new Date(startDate), new Date(endDate));
            return reply.send({
                success: true,
                reconciliations,
                total: reconciliations.length,
                message: 'Cash reconciliation completed'
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Mark cash as collected (Vendor/Company Manager)
    fastify.post('/cash-collected', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['settlements'],
            summary: 'Mark cash as collected for an order',
            description: 'Records cash payment collection for a specific order. Vendors and company managers can only mark cash collected for orders containing their products. Admins can mark cash for any order.',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                description: 'Cash collection details',
                properties: {
                    orderId: {
                        type: 'string',
                        description: 'UUID of the order to mark cash collected for, e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    },
                    amount: {
                        type: 'number',
                        minimum: 0,
                        description: 'Amount of cash collected in IQD, e.g. 50000'
                    }
                },
                required: ['orderId', 'amount']
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Cash collection marked successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        message: { type: 'string', description: 'Success message' }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - invalid order ID or amount',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - user does not have permission to mark cash for this order',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                404: {
                    type: 'object',
                    description: 'Order not found',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { orderId, amount } = request.body;
            const user = request.user;
            // Verify user has permission for this order
            if (user.role === client_1.UserRole.COMPANY_ADMIN || user.role === client_1.UserRole.COMPANY_ADMIN) {
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
        }
        catch (error) {
            return reply.code(400).send(error);
        }
    });
    // Get pending cash collections (Vendor/Company Manager)
    fastify.get('/pending-cash', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['settlements'],
            summary: 'Get pending cash collections',
            description: 'Retrieves a list of orders with pending cash collections for a company. Shows orders where cash payment has not yet been marked as collected. Non-admin users can only view pending cash for their own company.',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                description: 'Query parameters for filtering pending cash collections',
                properties: {
                    companyId: {
                        type: 'string',
                        description: 'UUID of the company to get pending cash for. Optional for non-admins (defaults to their own company), e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Pending cash collections retrieved successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        pendingCollections: {
                            type: 'array',
                            description: 'List of orders with pending cash collections',
                            items: {
                                type: 'object',
                                properties: {
                                    orderId: { type: 'string', description: 'Order UUID' },
                                    orderNumber: { type: 'string', description: 'Order reference number' },
                                    orderAmount: { type: 'number', description: 'Total order amount in IQD' },
                                    customerName: { type: 'string', description: 'Customer name' },
                                    orderDate: { type: 'string', format: 'date-time', description: 'Order creation date' },
                                    dueDate: { type: 'string', format: 'date-time', description: 'Payment due date' }
                                }
                            }
                        },
                        total: { type: 'integer', description: 'Total number of pending collections' },
                        totalAmount: { type: 'number', description: 'Total pending amount in IQD' }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - missing company ID',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - user does not have permission to view pending cash for this company',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { companyId: queryCompanyId } = request.query;
            const user = request.user;
            let companyId = queryCompanyId || user.companyId;
            // Non-admin users can only view their company's pending cash
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(user.role)) {
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
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Process daily settlement (Admin/Company Manager)
    fastify.post('/daily', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['settlements'],
            summary: 'Process daily settlement',
            description: 'Processes and creates a daily settlement record for a company. This aggregates all completed orders from the current day, calculates platform fees, and generates a settlement record. Only admins and company managers can process daily settlements.',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                description: 'Daily settlement parameters',
                properties: {
                    companyId: {
                        type: 'string',
                        description: 'UUID of the company to process daily settlement for. Optional for company managers (defaults to their own company), e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Daily settlement processed successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        settlement: {
                            type: 'object',
                            description: 'The created daily settlement record',
                            properties: {
                                id: { type: 'string', description: 'Settlement UUID' },
                                companyId: { type: 'string', description: 'Company UUID' },
                                date: { type: 'string', format: 'date', description: 'Settlement date' },
                                totalOrders: { type: 'integer', description: 'Number of orders included' },
                                totalSales: { type: 'number', description: 'Total sales amount in IQD' },
                                platformFee: { type: 'number', description: 'Platform fee amount in IQD' },
                                netAmount: { type: 'number', description: 'Net amount payable in IQD' },
                                cashCollected: { type: 'number', description: 'Cash collected amount in IQD' },
                                pendingCash: { type: 'number', description: 'Pending cash collection in IQD' },
                                status: { type: 'string', description: 'Settlement status: PENDING, VERIFIED, PAID' },
                                createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
                            }
                        },
                        message: { type: 'string', description: 'Success message' }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - missing company ID',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - user does not have permission to process settlements',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { companyId: bodyCompanyId } = request.body;
            const user = request.user;
            let companyId = bodyCompanyId || user.companyId;
            // Company managers can only process for their own company
            if (user.role === client_1.UserRole.COMPANY_ADMIN) {
                if (bodyCompanyId && bodyCompanyId !== user.companyId) {
                    return reply.code(403).send({
                        error: 'Forbidden',
                        message: 'You can only process settlements for your own company'
                    });
                }
                companyId = user.companyId;
            }
            else if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(user.role)) {
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
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Verify settlement (Admin only)
    fastify.patch('/:settlementId/verify', {
        preHandler: [auth_1.authenticate, (0, auth_1.authorize)([client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN])],
        schema: {
            tags: ['settlements'],
            summary: 'Verify and approve settlement',
            description: 'Verifies and approves a pending settlement. This action confirms that the settlement amounts are correct and authorizes payment to the company. Only administrators can verify settlements.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                description: 'URL parameters',
                properties: {
                    settlementId: {
                        type: 'string',
                        description: 'UUID of the settlement to verify, e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    }
                },
                required: ['settlementId']
            },
            body: {
                type: 'object',
                description: 'Verification details',
                properties: {
                    notes: {
                        type: 'string',
                        description: 'Optional notes or comments for the verification, e.g. "Verified after reconciliation"'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Settlement verified successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        settlement: {
                            type: 'object',
                            description: 'The verified settlement record',
                            properties: {
                                id: { type: 'string', description: 'Settlement UUID' },
                                companyId: { type: 'string', description: 'Company UUID' },
                                periodStart: { type: 'string', format: 'date-time', description: 'Settlement period start' },
                                periodEnd: { type: 'string', format: 'date-time', description: 'Settlement period end' },
                                totalSales: { type: 'number', description: 'Total sales amount in IQD' },
                                platformFee: { type: 'number', description: 'Platform fee amount in IQD' },
                                netAmount: { type: 'number', description: 'Net amount payable in IQD' },
                                status: { type: 'string', description: 'Settlement status: VERIFIED' },
                                verifiedBy: { type: 'string', description: 'UUID of the admin who verified' },
                                verifiedAt: { type: 'string', format: 'date-time', description: 'Verification timestamp' },
                                notes: { type: 'string', description: 'Verification notes' }
                            }
                        },
                        message: { type: 'string', description: 'Success message' }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - settlement already verified or invalid state',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - only administrators can verify settlements',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                404: {
                    type: 'object',
                    description: 'Settlement not found',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { settlementId } = request.params;
            const { notes } = request.body;
            const user = request.user;
            const settlement = await settlementService.verifySettlement(settlementId, user.id, notes);
            return reply.send({
                success: true,
                settlement,
                message: 'Settlement verified successfully'
            });
        }
        catch (error) {
            return reply.code(400).send(error);
        }
    });
    // Get settlement history (Vendor/Company Manager)
    fastify.get('/history', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['settlements'],
            summary: 'Get settlement history',
            description: 'Retrieves the settlement history for a company, showing past settlements with their status, amounts, and dates. Non-admin users can only view their own company\'s settlement history. Results are sorted by date in descending order.',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                description: 'Query parameters for filtering settlement history',
                properties: {
                    companyId: {
                        type: 'string',
                        description: 'UUID of the company to get history for. Optional for non-admins (defaults to their own company), e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    },
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 10,
                        description: 'Maximum number of settlement records to return, default is 10, max is 100'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Settlement history retrieved successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        settlements: {
                            type: 'array',
                            description: 'List of settlement records',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', description: 'Settlement UUID' },
                                    companyId: { type: 'string', description: 'Company UUID' },
                                    companyName: { type: 'string', description: 'Company name' },
                                    periodStart: { type: 'string', format: 'date-time', description: 'Settlement period start' },
                                    periodEnd: { type: 'string', format: 'date-time', description: 'Settlement period end' },
                                    totalSales: { type: 'number', description: 'Total sales amount in IQD' },
                                    platformFee: { type: 'number', description: 'Platform fee amount in IQD' },
                                    netAmount: { type: 'number', description: 'Net amount payable in IQD' },
                                    status: { type: 'string', description: 'Settlement status: PENDING, VERIFIED, PAID' },
                                    verifiedAt: { type: 'string', format: 'date-time', description: 'Verification timestamp if verified' },
                                    paidAt: { type: 'string', format: 'date-time', description: 'Payment timestamp if paid' },
                                    createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
                                }
                            }
                        },
                        total: { type: 'integer', description: 'Total number of settlements returned' }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - missing company ID',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - user does not have permission to view this company\'s settlements',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { companyId: queryCompanyId, limit = 10 } = request.query;
            const user = request.user;
            let companyId = queryCompanyId || user.companyId;
            // Non-admin users can only view their company's history
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(user.role)) {
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
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Calculate platform earnings (Admin only)
    fastify.get('/platform-earnings', {
        preHandler: [auth_1.authenticate, (0, auth_1.authorize)([client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN])],
        schema: {
            tags: ['settlements'],
            summary: 'Calculate platform earnings for a period',
            description: 'Calculates the total platform earnings (commission fees) for a specified date range across all companies. This provides a comprehensive view of platform revenue from transaction fees. Only administrators can access this endpoint.',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                description: 'Query parameters for filtering platform earnings',
                properties: {
                    startDate: {
                        type: 'string',
                        format: 'date',
                        description: 'Start date for the earnings period in YYYY-MM-DD format, e.g. "2024-01-01"'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date',
                        description: 'End date for the earnings period in YYYY-MM-DD format, e.g. "2024-01-31"'
                    }
                },
                required: ['startDate', 'endDate']
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Platform earnings calculated successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        earnings: {
                            type: 'object',
                            description: 'Platform earnings breakdown',
                            properties: {
                                period: {
                                    type: 'object',
                                    description: 'Earnings period',
                                    properties: {
                                        start: { type: 'string', format: 'date', description: 'Period start date' },
                                        end: { type: 'string', format: 'date', description: 'Period end date' }
                                    }
                                },
                                totalSales: { type: 'number', description: 'Total sales volume across all companies in IQD' },
                                totalPlatformFees: { type: 'number', description: 'Total platform fees earned in IQD' },
                                totalOrders: { type: 'integer', description: 'Total number of orders processed' },
                                averageFeeRate: { type: 'number', description: 'Average fee rate as percentage, e.g. 5.5' },
                                byCompany: {
                                    type: 'array',
                                    description: 'Earnings breakdown by company',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            companyId: { type: 'string', description: 'Company UUID' },
                                            companyName: { type: 'string', description: 'Company name' },
                                            sales: { type: 'number', description: 'Company sales in IQD' },
                                            platformFee: { type: 'number', description: 'Platform fee from this company in IQD' },
                                            orderCount: { type: 'integer', description: 'Number of orders from this company' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - missing or invalid date parameters',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - only administrators can view platform earnings',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { startDate, endDate } = request.query;
            const earnings = await settlementService.calculatePlatformEarnings(new Date(startDate), new Date(endDate));
            return reply.send({
                success: true,
                earnings
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Get cash flow report (Company Manager/Admin)
    fastify.get('/cash-flow', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['settlements'],
            summary: 'Get cash flow report',
            description: 'Retrieves a detailed cash flow report for a company, showing inflows, outflows, and balance for a specified period. Non-admin users can only view cash flow reports for their own company. Useful for financial planning and reconciliation.',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                description: 'Query parameters for filtering cash flow report',
                properties: {
                    companyId: {
                        type: 'string',
                        description: 'UUID of the company to get cash flow for. Optional for non-admins (defaults to their own company), e.g. "550e8400-e29b-41d4-a716-446655440000"'
                    },
                    startDate: {
                        type: 'string',
                        format: 'date',
                        description: 'Start date for the cash flow period in YYYY-MM-DD format, e.g. "2024-01-01"'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date',
                        description: 'End date for the cash flow period in YYYY-MM-DD format, e.g. "2024-01-31"'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Cash flow report retrieved successfully',
                    properties: {
                        success: { type: 'boolean', description: 'Operation success status' },
                        cashFlow: {
                            type: 'object',
                            description: 'Cash flow data',
                            properties: {
                                inflow: { type: 'number', description: 'Total cash inflow (collections) in IQD' },
                                outflow: { type: 'number', description: 'Total cash outflow (payments, fees) in IQD' },
                                balance: { type: 'number', description: 'Net cash balance in IQD' },
                                pendingCollections: { type: 'number', description: 'Pending cash collections in IQD' },
                                settledAmount: { type: 'number', description: 'Total settled amount in IQD' },
                                unsettledAmount: { type: 'number', description: 'Total unsettled amount in IQD' }
                            }
                        },
                        period: {
                            type: 'object',
                            description: 'Report period details',
                            properties: {
                                start: { type: 'string', format: 'date-time', description: 'Period start date' },
                                end: { type: 'string', format: 'date-time', description: 'Period end date' }
                            }
                        },
                        company: {
                            type: 'object',
                            description: 'Company information',
                            properties: {
                                id: { type: 'string', description: 'Company UUID' },
                                name: { type: 'string', description: 'Company name' }
                            }
                        }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Bad request - missing company ID',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                401: {
                    type: 'object',
                    description: 'Unauthorized - invalid or missing authentication token',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                403: {
                    type: 'object',
                    description: 'Forbidden - user does not have permission to view cash flow for this company',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Internal server error',
                    properties: {
                        error: { type: 'string', description: 'Error type' },
                        message: { type: 'string', description: 'Error details' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { companyId: queryCompanyId, startDate, endDate } = request.query;
            const user = request.user;
            let companyId = queryCompanyId || user.companyId;
            // Non-admin users can only view their company's cash flow
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN].includes(user.role)) {
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
            const summary = await settlementService.getSettlementSummary(companyId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            return reply.send({
                success: true,
                cashFlow: summary.cashFlow,
                period: summary.period,
                company: {
                    id: summary.companyId,
                    name: summary.companyName
                }
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
};
exports.default = settlementRoutes;
//# sourceMappingURL=settlements.js.map