"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const company_service_1 = require("../services/company.service");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
// Reusable schema definitions
const companySchema = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'Unique company identifier' },
        nameAr: { type: 'string', description: 'Company name in Arabic' },
        nameEn: { type: 'string', description: 'Company name in English' },
        description: { type: 'string', nullable: true, description: 'Company description' },
        logo: { type: 'string', nullable: true, description: 'URL to company logo' },
        email: { type: 'string', format: 'email', nullable: true, description: 'Company contact email' },
        phone: { type: 'string', nullable: true, description: 'Company contact phone number' },
        address: { type: 'string', nullable: true, description: 'Company physical address' },
        zones: {
            type: 'array',
            items: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
            description: 'Zones where company operates'
        },
        isActive: { type: 'boolean', description: 'Whether the company is active' },
        commission: { type: 'number', description: 'Platform commission percentage' },
        deliveryFees: {
            type: 'object',
            description: 'Zone-based delivery fees',
            additionalProperties: { type: 'number' }
        },
        createdAt: { type: 'string', format: 'date-time', description: 'Company creation timestamp' },
        updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    }
};
const companyWithCountsSchema = {
    type: 'object',
    properties: {
        ...companySchema.properties,
        _count: {
            type: 'object',
            properties: {
                products: { type: 'number', description: 'Total number of products' },
                users: { type: 'number', description: 'Total number of users/vendors' }
            }
        }
    }
};
const companyStatsSchema = {
    type: 'object',
    properties: {
        totalProducts: { type: 'number', description: 'Total number of products' },
        activeProducts: { type: 'number', description: 'Number of active products' },
        totalOrders: { type: 'number', description: 'Total number of orders' },
        pendingOrders: { type: 'number', description: 'Number of pending orders' },
        totalRevenue: { type: 'number', description: 'Total revenue amount' },
        totalCommission: { type: 'number', description: 'Total commission earned' },
        totalVendors: { type: 'number', description: 'Total number of vendors' },
        activeVendors: { type: 'number', description: 'Number of active vendors' },
        averageRating: { type: 'number', description: 'Average company rating' },
        totalReviews: { type: 'number', description: 'Total number of reviews' }
    }
};
const errorSchema = {
    type: 'object',
    properties: {
        error: { type: 'string', description: 'Error type' },
        message: { type: 'string', description: 'Error message' }
    }
};
const successResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
    }
};
const vendorSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', description: 'Vendor user ID' },
        email: { type: 'string', format: 'email', description: 'Vendor email address' },
        name: { type: 'string', description: 'Vendor name' },
        phone: { type: 'string', nullable: true, description: 'Vendor phone number' },
        isActive: { type: 'boolean', description: 'Whether the vendor is active' },
        createdAt: { type: 'string', format: 'date-time', description: 'Vendor creation timestamp' },
        _count: {
            type: 'object',
            properties: {
                products: { type: 'number', description: 'Number of products created by vendor' }
            }
        }
    }
};
const productSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        sku: { type: 'string' },
        nameAr: { type: 'string' },
        nameEn: { type: 'string' },
        descriptionAr: { type: 'string', nullable: true },
        descriptionEn: { type: 'string', nullable: true },
        price: { type: 'number' },
        compareAtPrice: { type: 'number', nullable: true },
        cost: { type: 'number', nullable: true },
        stock: { type: 'number' },
        minOrderQty: { type: 'number' },
        unit: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
        categoryId: { type: 'string' },
        companyId: { type: 'string' },
        zones: { type: 'array', items: { type: 'string' } },
        isActive: { type: 'boolean' },
        isFeatured: { type: 'boolean' },
        sortOrder: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        category: {
            type: 'object',
            nullable: true,
            properties: {
                id: { type: 'string' },
                nameAr: { type: 'string' },
                nameEn: { type: 'string' }
            }
        },
        user: {
            type: 'object',
            nullable: true,
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' }
            }
        },
        _count: {
            type: 'object',
            properties: {
                orderItems: { type: 'number' }
            }
        }
    }
};
const payoutsSchema = {
    type: 'object',
    properties: {
        companyId: { type: 'string', description: 'Company ID' },
        period: {
            type: 'object',
            properties: {
                start: { type: 'string', format: 'date-time', nullable: true, description: 'Period start date' },
                end: { type: 'string', format: 'date-time', nullable: true, description: 'Period end date' }
            }
        },
        totalOrders: { type: 'number', description: 'Total number of completed orders' },
        totalRevenue: { type: 'number', description: 'Total revenue amount' },
        totalCommission: { type: 'number', description: 'Total platform commission' },
        totalPayout: { type: 'number', description: 'Net payout amount (revenue - commission)' },
        commissionRate: { type: 'number', description: 'Commission rate percentage' }
    }
};
const companyRoutes = async (fastify) => {
    const companyService = new company_service_1.CompanyService(fastify);
    // Create a new company (Admin only)
    fastify.post('/', {
        preHandler: [auth_1.authenticate, (0, auth_1.authorize)([client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN])],
        schema: {
            tags: ['companies'],
            summary: 'Create a new company',
            description: 'Create a new company/vendor in the system. Only administrators can create companies. Default delivery fees and commission rates are applied if not specified.',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name', 'nameAr', 'email', 'phone', 'zones'],
                properties: {
                    name: { type: 'string', minLength: 1, description: 'Company name in English' },
                    nameAr: { type: 'string', minLength: 1, description: 'Company name in Arabic' },
                    description: { type: 'string', description: 'Company description in English' },
                    descriptionAr: { type: 'string', description: 'Company description in Arabic' },
                    logo: { type: 'string', format: 'uri', description: 'URL to company logo image' },
                    email: { type: 'string', format: 'email', description: 'Company contact email address' },
                    phone: { type: 'string', description: 'Company contact phone number' },
                    address: { type: 'string', description: 'Company physical address' },
                    zones: {
                        type: 'array',
                        items: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                        minItems: 1,
                        description: 'Zones where company will operate'
                    },
                    deliveryFees: {
                        type: 'object',
                        description: 'Zone-based delivery fees (default fees applied if not provided), e.g. {"KARKH": 2500, "RUSAFA": 2500}',
                        additionalProperties: { type: 'number' }
                    },
                    commissionRate: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        default: 10,
                        description: 'Platform commission percentage (default: 10%)'
                    },
                    minOrderAmount: {
                        type: 'number',
                        minimum: 0,
                        default: 10000,
                        description: 'Minimum order amount in IQD (default: 10,000)'
                    },
                    maxDeliveryTime: {
                        type: 'number',
                        minimum: 0,
                        default: 120,
                        description: 'Maximum delivery time in minutes (default: 120)'
                    }
                }
            },
            response: {
                201: {
                    description: 'Company created successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        company: companySchema,
                        message: { type: 'string' }
                    }
                },
                400: {
                    description: 'Bad request - validation error or duplicate entry',
                    ...errorSchema
                },
                401: {
                    description: 'Unauthorized - authentication required',
                    ...errorSchema
                },
                403: {
                    description: 'Forbidden - insufficient permissions',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const company = await companyService.createCompany(request.body);
            return reply.code(201).send({
                success: true,
                company,
                message: 'Company created successfully'
            });
        }
        catch (error) {
            return reply.code(400).send(error);
        }
    });
    // Update company (Admin or Company Manager)
    fastify.put('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['companies'],
            summary: 'Update company details',
            description: 'Update an existing company\'s details. Admins can update any company, while Company Managers can only update their own company.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1, description: 'Company name in English' },
                    nameAr: { type: 'string', minLength: 1, description: 'Company name in Arabic' },
                    description: { type: 'string', description: 'Company description in English' },
                    descriptionAr: { type: 'string', description: 'Company description in Arabic' },
                    logo: { type: 'string', format: 'uri', description: 'URL to company logo image' },
                    email: { type: 'string', format: 'email', description: 'Company contact email address' },
                    phone: { type: 'string', description: 'Company contact phone number' },
                    address: { type: 'string', description: 'Company physical address' },
                    zones: {
                        type: 'array',
                        items: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                        description: 'Zones where company operates'
                    },
                    deliveryFees: {
                        type: 'object',
                        description: 'Zone-based delivery fees',
                        additionalProperties: { type: 'number' }
                    },
                    commissionRate: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'Platform commission percentage'
                    },
                    minOrderAmount: { type: 'number', minimum: 0, description: 'Minimum order amount in IQD' },
                    maxDeliveryTime: { type: 'number', minimum: 0, description: 'Maximum delivery time in minutes' }
                }
            },
            response: {
                200: {
                    description: 'Company updated successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        company: companySchema,
                        message: { type: 'string' }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    ...errorSchema
                },
                401: {
                    description: 'Unauthorized - authentication required',
                    ...errorSchema
                },
                403: {
                    description: 'Forbidden - insufficient permissions or not your company',
                    ...errorSchema
                },
                404: {
                    description: 'Company not found',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            // Check authorization
            if (user.role === client_1.UserRole.COMPANY_ADMIN && user.companyId !== id) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'You can only update your own company'
                });
            }
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMPANY_ADMIN].includes(user.role)) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'Insufficient permissions'
                });
            }
            const company = await companyService.updateCompany(id, request.body);
            return reply.send({
                success: true,
                company,
                message: 'Company updated successfully'
            });
        }
        catch (error) {
            return reply.code(400).send(error);
        }
    });
    // Get company by ID (Public with limited data, Full data for authorized users)
    fastify.get('/:id', {
        schema: {
            tags: ['companies'],
            summary: 'Get company by ID',
            description: 'Retrieve company details by ID. Public access returns limited data (commission rate and stats are hidden). Authenticated users with appropriate roles get full data.',
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            response: {
                200: {
                    description: 'Company details retrieved successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        company: {
                            type: 'object',
                            properties: {
                                ...companyWithCountsSchema.properties,
                                stats: companyStatsSchema
                            }
                        }
                    }
                },
                404: {
                    description: 'Company not found',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const company = await companyService.getCompanyById(id);
            // Remove sensitive data for public access
            if (!request.user) {
                delete company.commissionRate;
                delete company.stats;
            }
            return reply.send({
                success: true,
                company
            });
        }
        catch (error) {
            return reply.code(404).send(error);
        }
    });
    // List companies with filters
    fastify.get('/', {
        schema: {
            tags: ['companies'],
            summary: 'List companies',
            description: 'Retrieve a paginated list of companies with optional filters for zone, active status, and search term.',
            querystring: {
                type: 'object',
                properties: {
                    zone: {
                        type: 'string',
                        enum: ['KARKH', 'RUSAFA'],
                        description: 'Filter by zone'
                    },
                    isActive: {
                        type: 'string',
                        enum: ['true', 'false'],
                        description: 'Filter by active status'
                    },
                    search: {
                        type: 'string',
                        description: 'Search by company name or email'
                    },
                    page: {
                        type: 'number',
                        minimum: 1,
                        default: 1,
                        description: 'Page number for pagination'
                    },
                    limit: {
                        type: 'number',
                        minimum: 1,
                        maximum: 100,
                        default: 20,
                        description: 'Number of items per page'
                    }
                }
            },
            response: {
                200: {
                    description: 'Paginated list of companies',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        companies: {
                            type: 'array',
                            items: companyWithCountsSchema
                        },
                        total: { type: 'number', description: 'Total number of companies matching filters' }
                    }
                },
                500: {
                    description: 'Internal server error',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { zone, isActive, search, page, limit } = request.query;
            const filter = {
                zone: zone,
                isActive: isActive !== undefined ? isActive === 'true' : undefined,
                search,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20
            };
            const result = await companyService.listCompanies(filter);
            return reply.send({
                success: true,
                ...result
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Get company statistics (Company Manager or Admin)
    fastify.get('/:id/stats', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['companies'],
            summary: 'Get company statistics',
            description: 'Retrieve detailed statistics for a company including product counts, order metrics, revenue, and vendor information. Company Managers can only view stats for their own company.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            response: {
                200: {
                    description: 'Company statistics retrieved successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        stats: companyStatsSchema
                    }
                },
                401: {
                    description: 'Unauthorized - authentication required',
                    ...errorSchema
                },
                403: {
                    description: 'Forbidden - insufficient permissions or not your company',
                    ...errorSchema
                },
                500: {
                    description: 'Internal server error',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            // Check authorization
            if (user.role === client_1.UserRole.COMPANY_ADMIN && user.companyId !== id) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'You can only view stats for your own company'
                });
            }
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMPANY_ADMIN, client_1.UserRole.COMPANY_ADMIN].includes(user.role)) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'Insufficient permissions'
                });
            }
            const stats = await companyService.getCompanyStats(id);
            return reply.send({
                success: true,
                stats
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Toggle company status (Admin only)
    fastify.patch('/:id/status', {
        preHandler: [auth_1.authenticate, (0, auth_1.authorize)([client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN])],
        schema: {
            tags: ['companies'],
            summary: 'Toggle company active status',
            description: 'Activate or deactivate a company. When a company is deactivated, all its products are also deactivated. Only administrators can perform this action.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            body: {
                type: 'object',
                required: ['isActive'],
                properties: {
                    isActive: {
                        type: 'boolean',
                        description: 'New active status for the company'
                    }
                }
            },
            response: {
                200: {
                    description: 'Company status updated successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        company: companySchema,
                        message: { type: 'string' }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    ...errorSchema
                },
                401: {
                    description: 'Unauthorized - authentication required',
                    ...errorSchema
                },
                403: {
                    description: 'Forbidden - admin access required',
                    ...errorSchema
                },
                404: {
                    description: 'Company not found',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { isActive } = request.body;
            const company = await companyService.toggleCompanyStatus(id, isActive);
            return reply.send({
                success: true,
                company,
                message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`
            });
        }
        catch (error) {
            return reply.code(400).send(error);
        }
    });
    // Update delivery fees (Company Manager or Admin)
    fastify.patch('/:id/delivery-fees', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['companies'],
            summary: 'Update company delivery fees',
            description: 'Update the zone-based delivery fees for a company. Admins can update any company, while Company Managers can only update their own company.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            body: {
                type: 'object',
                required: ['deliveryFees'],
                properties: {
                    deliveryFees: {
                        type: 'object',
                        description: 'Zone-based delivery fees object where keys are zone names and values are fees in IQD, e.g. {"KARKH": 2500, "RUSAFA": 2500}',
                        additionalProperties: { type: 'number', minimum: 0 }
                    }
                }
            },
            response: {
                200: {
                    description: 'Delivery fees updated successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        company: companySchema,
                        message: { type: 'string' }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    ...errorSchema
                },
                401: {
                    description: 'Unauthorized - authentication required',
                    ...errorSchema
                },
                403: {
                    description: 'Forbidden - insufficient permissions or not your company',
                    ...errorSchema
                },
                404: {
                    description: 'Company not found',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            // Check authorization
            if (user.role === client_1.UserRole.COMPANY_ADMIN && user.companyId !== id) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'You can only update delivery fees for your own company'
                });
            }
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMPANY_ADMIN].includes(user.role)) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'Insufficient permissions'
                });
            }
            const company = await companyService.updateDeliveryFees(id, request.body.deliveryFees);
            return reply.send({
                success: true,
                company,
                message: 'Delivery fees updated successfully'
            });
        }
        catch (error) {
            return reply.code(400).send(error);
        }
    });
    // Update commission rate (Admin only)
    fastify.patch('/:id/commission', {
        preHandler: [auth_1.authenticate, (0, auth_1.authorize)([client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN])],
        schema: {
            tags: ['companies'],
            summary: 'Update company commission rate',
            description: 'Update the platform commission rate for a company. Commission rate must be between 0 and 100 percent. Only administrators can perform this action.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            body: {
                type: 'object',
                required: ['commissionRate'],
                properties: {
                    commissionRate: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'New commission rate percentage (0-100)'
                    }
                }
            },
            response: {
                200: {
                    description: 'Commission rate updated successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        company: companySchema,
                        message: { type: 'string' }
                    }
                },
                400: {
                    description: 'Bad request - invalid commission rate',
                    ...errorSchema
                },
                401: {
                    description: 'Unauthorized - authentication required',
                    ...errorSchema
                },
                403: {
                    description: 'Forbidden - admin access required',
                    ...errorSchema
                },
                404: {
                    description: 'Company not found',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { commissionRate } = request.body;
            const company = await companyService.updateCommissionRate(id, commissionRate);
            return reply.send({
                success: true,
                company,
                message: 'Commission rate updated successfully'
            });
        }
        catch (error) {
            return reply.code(400).send(error);
        }
    });
    // Get company vendors (Company Manager, Vendor, or Admin)
    fastify.get('/:id/vendors', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['companies'],
            summary: 'Get company vendors',
            description: 'Retrieve a list of vendors associated with a company. Includes vendor details and product counts. Company Managers and Vendors can only view vendors for their own company.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            response: {
                200: {
                    description: 'List of company vendors',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        vendors: {
                            type: 'array',
                            items: vendorSchema
                        },
                        total: { type: 'number', description: 'Total number of vendors' }
                    }
                },
                401: {
                    description: 'Unauthorized - authentication required',
                    ...errorSchema
                },
                403: {
                    description: 'Forbidden - insufficient permissions or not your company',
                    ...errorSchema
                },
                500: {
                    description: 'Internal server error',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            // Check authorization
            if ((user.role === client_1.UserRole.COMPANY_ADMIN || user.role === client_1.UserRole.COMPANY_ADMIN) && user.companyId !== id) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'You can only view vendors for your own company'
                });
            }
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMPANY_ADMIN, client_1.UserRole.COMPANY_ADMIN].includes(user.role)) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'Insufficient permissions'
                });
            }
            const vendors = await companyService.getCompanyVendors(id);
            return reply.send({
                success: true,
                vendors,
                total: vendors.length
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Get company products
    fastify.get('/:id/products', {
        schema: {
            tags: ['companies'],
            summary: 'Get company products',
            description: 'Retrieve a paginated list of products belonging to a specific company. Includes category and vendor information for each product.',
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            querystring: {
                type: 'object',
                properties: {
                    page: {
                        type: 'number',
                        minimum: 1,
                        default: 1,
                        description: 'Page number for pagination'
                    },
                    limit: {
                        type: 'number',
                        minimum: 1,
                        maximum: 100,
                        default: 20,
                        description: 'Number of items per page'
                    }
                }
            },
            response: {
                200: {
                    description: 'Paginated list of company products',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        products: {
                            type: 'array',
                            items: productSchema
                        },
                        total: { type: 'number', description: 'Total number of products' }
                    }
                },
                404: {
                    description: 'Company not found',
                    ...errorSchema
                },
                500: {
                    description: 'Internal server error',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { page, limit } = request.query;
            const result = await companyService.getCompanyProducts(id, parseInt(page) || 1, parseInt(limit) || 20);
            return reply.send({
                success: true,
                ...result
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Get companies by zone
    fastify.get('/zone/:zone', {
        schema: {
            tags: ['companies'],
            summary: 'Get companies by zone',
            description: 'Retrieve a list of active companies operating in a specific zone. Only returns companies that have the specified zone in their zones array and are currently active.',
            params: {
                type: 'object',
                required: ['zone'],
                properties: {
                    zone: {
                        type: 'string',
                        enum: ['KARKH', 'RUSAFA'],
                        description: 'Zone to filter companies by'
                    }
                }
            },
            response: {
                200: {
                    description: 'List of companies in the specified zone',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        companies: {
                            type: 'array',
                            items: companyWithCountsSchema
                        },
                        total: { type: 'number', description: 'Total number of companies in zone' }
                    }
                },
                400: {
                    description: 'Bad request - invalid zone',
                    ...errorSchema
                },
                500: {
                    description: 'Internal server error',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { zone } = request.params;
            if (!Object.values(client_1.Zone).includes(zone)) {
                return reply.code(400).send({
                    error: 'Bad Request',
                    message: 'Invalid zone'
                });
            }
            const companies = await companyService.getCompaniesByZone(zone);
            return reply.send({
                success: true,
                companies,
                total: companies.length
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
    // Calculate company payouts (Company Manager or Admin)
    fastify.get('/:id/payouts', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['companies'],
            summary: 'Calculate company payouts',
            description: 'Calculate total payouts for a company based on completed orders. Optionally filter by date range. Shows total revenue, commission deducted, and net payout amount. Company Managers can only view payouts for their own company.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Company ID' }
                }
            },
            querystring: {
                type: 'object',
                properties: {
                    startDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Start date for payout calculation (ISO 8601 format)'
                    },
                    endDate: {
                        type: 'string',
                        format: 'date-time',
                        description: 'End date for payout calculation (ISO 8601 format)'
                    }
                }
            },
            response: {
                200: {
                    description: 'Company payout calculation',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        payouts: payoutsSchema
                    }
                },
                401: {
                    description: 'Unauthorized - authentication required',
                    ...errorSchema
                },
                403: {
                    description: 'Forbidden - insufficient permissions or not your company',
                    ...errorSchema
                },
                500: {
                    description: 'Internal server error',
                    ...errorSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { startDate, endDate } = request.query;
            const user = request.user;
            // Check authorization
            if (user.role === client_1.UserRole.COMPANY_ADMIN && user.companyId !== id) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'You can only view payouts for your own company'
                });
            }
            if (![client_1.UserRole.LOCATION_ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMPANY_ADMIN].includes(user.role)) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'Insufficient permissions'
                });
            }
            const payouts = await companyService.calculateCompanyPayouts(id, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            return reply.send({
                success: true,
                payouts
            });
        }
        catch (error) {
            return reply.code(500).send(error);
        }
    });
};
exports.default = companyRoutes;
//# sourceMappingURL=companies.js.map