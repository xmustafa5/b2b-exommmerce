"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middleware/auth");
const errors_1 = require("../utils/errors");
const admin_service_1 = require("../services/admin.service");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
// Validation schemas
const createAdminSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.literal(client_1.UserRole.LOCATION_ADMIN), // Only LOCATION_ADMIN can be created
    zones: zod_1.z.array(zod_1.z.nativeEnum(client_1.Zone)).min(1),
});
const updateAdminSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    zones: zod_1.z.array(zod_1.z.nativeEnum(client_1.Zone)).optional(),
});
const updateZonesSchema = zod_1.z.object({
    zones: zod_1.z.array(zod_1.z.nativeEnum(client_1.Zone)).min(1),
});
const resetPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z.string().min(8),
});
const adminRoutes = async (fastify) => {
    const adminService = new admin_service_1.AdminService(fastify);
    // GET /api/admins - List all admins
    fastify.get('/', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Get all admins (SUPER_ADMIN and LOCATION_ADMIN users)',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    role: { type: 'string', enum: ['SUPER_ADMIN', 'LOCATION_ADMIN'] },
                    zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                    isActive: { type: 'boolean' },
                    search: { type: 'string' },
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                },
            },
            response: {
                200: {
                    description: 'List of admins with pagination',
                    type: 'object',
                    properties: {
                        admins: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    email: { type: 'string' },
                                    name: { type: 'string' },
                                    phone: { type: 'string', nullable: true },
                                    role: { type: 'string' },
                                    zones: { type: 'array', items: { type: 'string' } },
                                    isActive: { type: 'boolean' },
                                    createdAt: { type: 'string' },
                                    updatedAt: { type: 'string' },
                                },
                            },
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer' },
                                limit: { type: 'integer' },
                                total: { type: 'integer' },
                                totalPages: { type: 'integer' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const result = await adminService.getAdmins(request.query);
            return reply.send(result);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // GET /api/admins/stats - Get admin statistics
    fastify.get('/stats', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Get admin statistics',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'Admin statistics',
                    type: 'object',
                    properties: {
                        totalAdmins: { type: 'integer' },
                        superAdmins: { type: 'integer' },
                        locationAdmins: { type: 'integer' },
                        activeAdmins: { type: 'integer' },
                        inactiveAdmins: { type: 'integer' },
                        adminsByZone: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    zones: { type: 'array', items: { type: 'string' } },
                                    count: { type: 'integer' },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const stats = await adminService.getAdminStats();
            return reply.send(stats);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // GET /api/admins/shop-owners - Get shop owners list
    fastify.get('/shop-owners', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN)],
        schema: {
            description: 'Get shop owners list',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                    search: { type: 'string' },
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                },
            },
            response: {
                200: {
                    description: 'List of shop owners',
                    type: 'object',
                    properties: {
                        shopOwners: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    email: { type: 'string' },
                                    name: { type: 'string' },
                                    businessName: { type: 'string', nullable: true },
                                    phone: { type: 'string', nullable: true },
                                    zones: { type: 'array', items: { type: 'string' } },
                                    isActive: { type: 'boolean' },
                                    createdAt: { type: 'string' },
                                    _count: {
                                        type: 'object',
                                        properties: {
                                            orders: { type: 'integer' },
                                        },
                                    },
                                },
                            },
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer' },
                                limit: { type: 'integer' },
                                total: { type: 'integer' },
                                totalPages: { type: 'integer' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            // For LOCATION_ADMIN, restrict to their zones
            let zone = request.query.zone;
            if (request.user.role === client_1.UserRole.LOCATION_ADMIN && request.user.zones?.length > 0) {
                if (zone && !request.user.zones.includes(zone)) {
                    return reply.code(403).send({ error: 'Access denied to this zone', code: 'FORBIDDEN' });
                }
                if (!zone && request.user.zones.length === 1) {
                    zone = request.user.zones[0];
                }
            }
            const result = await adminService.getShopOwners({
                ...request.query,
                zone,
            });
            return reply.send(result);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // GET /api/admins/:id - Get single admin
    fastify.get('/:id', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Get a single admin by ID',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            response: {
                200: {
                    description: 'Admin details',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        phone: { type: 'string', nullable: true },
                        role: { type: 'string' },
                        zones: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                },
                404: {
                    description: 'Admin not found',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const admin = await adminService.getAdminById(request.params.id);
            return reply.send(admin);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // POST /api/admins - Create new admin
    fastify.post('/', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Create a new LOCATION_ADMIN',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['email', 'password', 'name', 'role', 'zones'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    name: { type: 'string', minLength: 2 },
                    phone: { type: 'string' },
                    role: { type: 'string', enum: ['LOCATION_ADMIN'] },
                    zones: {
                        type: 'array',
                        items: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                        minItems: 1,
                    },
                },
            },
            response: {
                201: {
                    description: 'Admin created successfully',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        phone: { type: 'string', nullable: true },
                        role: { type: 'string' },
                        zones: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string' },
                    },
                },
                400: {
                    description: 'Validation error',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                409: {
                    description: 'Email or phone already exists',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const validatedData = createAdminSchema.parse(request.body);
            const admin = await adminService.createAdmin(validatedData, request.user.role);
            return reply.code(201).send(admin);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // PUT /api/admins/:id - Update admin
    fastify.put('/:id', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Update an admin',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 2 },
                    phone: { type: 'string' },
                    isActive: { type: 'boolean' },
                    zones: {
                        type: 'array',
                        items: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                    },
                },
            },
            response: {
                200: {
                    description: 'Admin updated successfully',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        phone: { type: 'string', nullable: true },
                        role: { type: 'string' },
                        zones: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        updatedAt: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const validatedData = updateAdminSchema.parse(request.body);
            const admin = await adminService.updateAdmin(request.params.id, validatedData, request.user.role);
            return reply.send(admin);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // PATCH /api/admins/:id/zones - Update admin zones
    fastify.patch('/:id/zones', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Update admin zones',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            body: {
                type: 'object',
                required: ['zones'],
                properties: {
                    zones: {
                        type: 'array',
                        items: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                        minItems: 1,
                    },
                },
            },
            response: {
                200: {
                    description: 'Zones updated successfully',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                        zones: { type: 'array', items: { type: 'string' } },
                        updatedAt: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const validatedData = updateZonesSchema.parse(request.body);
            const admin = await adminService.updateAdminZones(request.params.id, validatedData.zones, request.user.role);
            return reply.send(admin);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // PATCH /api/admins/:id/active - Toggle admin active status
    fastify.patch('/:id/active', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Activate or deactivate an admin',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            body: {
                type: 'object',
                required: ['isActive'],
                properties: {
                    isActive: { type: 'boolean' },
                },
            },
            response: {
                200: {
                    description: 'Status updated successfully',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                        isActive: { type: 'boolean' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { isActive } = request.body;
            let admin;
            if (isActive) {
                admin = await adminService.activateAdmin(request.params.id, request.user.role);
            }
            else {
                admin = await adminService.deactivateAdmin(request.params.id, request.user.role);
            }
            return reply.send(admin);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // POST /api/admins/:id/reset-password - Reset admin password
    fastify.post('/:id/reset-password', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Reset admin password',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            body: {
                type: 'object',
                required: ['newPassword'],
                properties: {
                    newPassword: { type: 'string', minLength: 8 },
                },
            },
            response: {
                200: {
                    description: 'Password reset successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const validatedData = resetPasswordSchema.parse(request.body);
            const result = await adminService.resetAdminPassword(request.params.id, validatedData.newPassword, request.user.role);
            return reply.send(result);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // DELETE /api/admins/:id - Delete (deactivate) admin
    fastify.delete('/:id', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            description: 'Delete (deactivate) an admin',
            tags: ['admins'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            response: {
                200: {
                    description: 'Admin deactivated successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        admin: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                isActive: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const admin = await adminService.deactivateAdmin(request.params.id, request.user.role);
            return reply.send({
                message: 'Admin deactivated successfully',
                admin,
            });
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
};
exports.default = adminRoutes;
//# sourceMappingURL=admins.js.map