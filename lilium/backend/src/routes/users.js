"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middleware/auth");
const errors_1 = require("../utils/errors");
const validation_1 = require("../types/validation");
const usersRoutes = async (fastify) => {
    // Get all users (protected)
    fastify.get('/', {
        preHandler: [auth_1.authenticate],
        schema: {
            description: 'Get all users',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'List of users',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            name: { type: 'string' },
                            businessName: { type: 'string', nullable: true },
                            phone: { type: 'string', nullable: true },
                            role: { type: 'string' },
                            isActive: { type: 'boolean' },
                            createdAt: { type: 'string' },
                            updatedAt: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const users = await fastify.prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    businessName: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return reply.send(users);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Get user by ID (protected)
    fastify.get('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            description: 'Get user by ID',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            },
            response: {
                200: {
                    description: 'User details',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        businessName: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        role: { type: 'string' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = await fastify.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    businessName: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (!user) {
                return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
            }
            return reply.send(user);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Update user (protected - can only update own profile)
    fastify.put('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            description: 'Update user profile',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    businessName: { type: 'string' }
                }
            },
            response: {
                200: {
                    description: 'Updated user',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        businessName: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        updatedAt: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            // Check if user is updating their own profile
            if (request.user.userId !== id) {
                return reply.code(403).send({ error: 'You can only update your own profile', code: 'FORBIDDEN' });
            }
            const data = validation_1.updateUserSchema.parse(request.body);
            const updatedUser = await fastify.prisma.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    businessName: true,
                    phone: true,
                    updatedAt: true
                }
            });
            return reply.send(updatedUser);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Delete user (protected - can only delete own profile)
    fastify.delete('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            description: 'Delete user account',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            },
            response: {
                200: {
                    description: 'User deleted successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            // Check if user is deleting their own profile
            if (request.user.userId !== id) {
                return reply.code(403).send({ error: 'You can only delete your own profile', code: 'FORBIDDEN' });
            }
            await fastify.prisma.user.delete({
                where: { id }
            });
            return reply.send({ message: 'User deleted successfully' });
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
};
exports.default = usersRoutes;
//# sourceMappingURL=users.js.map