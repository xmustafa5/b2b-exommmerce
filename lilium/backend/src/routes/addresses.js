"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
// Validation schemas
const createAddressSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Address name is required'),
    street: zod_1.z.string().min(1, 'Street is required'),
    area: zod_1.z.string().min(1, 'Area is required'),
    building: zod_1.z.string().optional(),
    floor: zod_1.z.string().optional(),
    apartment: zod_1.z.string().optional(),
    zone: zod_1.z.nativeEnum(client_1.Zone),
    landmark: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    phone: zod_1.z.string().min(1, 'Phone is required'),
    isDefault: zod_1.z.boolean().optional().default(false),
});
const updateAddressSchema = createAddressSchema.partial();
const addressRoutes = async (fastify) => {
    /**
     * @route GET /api/addresses
     * @description Get all addresses for current user
     * @access Private
     */
    fastify.get('/', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Addresses'],
            summary: 'Get all addresses for current user',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            street: { type: 'string' },
                            area: { type: 'string' },
                            building: { type: 'string', nullable: true },
                            floor: { type: 'string', nullable: true },
                            apartment: { type: 'string', nullable: true },
                            zone: { type: 'string' },
                            landmark: { type: 'string', nullable: true },
                            latitude: { type: 'number', nullable: true },
                            longitude: { type: 'number', nullable: true },
                            phone: { type: 'string' },
                            isDefault: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const addresses = await fastify.prisma.address.findMany({
            where: { userId: request.user.userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' },
            ],
        });
        return reply.send(addresses);
    });
    /**
     * @route GET /api/addresses/:id
     * @description Get address by ID
     * @access Private
     */
    fastify.get('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Addresses'],
            summary: 'Get address by ID',
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
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        street: { type: 'string' },
                        area: { type: 'string' },
                        building: { type: 'string', nullable: true },
                        floor: { type: 'string', nullable: true },
                        apartment: { type: 'string', nullable: true },
                        zone: { type: 'string' },
                        landmark: { type: 'string', nullable: true },
                        latitude: { type: 'number', nullable: true },
                        longitude: { type: 'number', nullable: true },
                        phone: { type: 'string' },
                        isDefault: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const address = await fastify.prisma.address.findFirst({
            where: {
                id,
                userId: request.user.userId,
            },
        });
        if (!address) {
            return reply.code(404).send({ error: 'Address not found' });
        }
        return reply.send(address);
    });
    /**
     * @route POST /api/addresses
     * @description Create a new address
     * @access Private
     */
    fastify.post('/', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Addresses'],
            summary: 'Create a new address',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    street: { type: 'string' },
                    area: { type: 'string' },
                    building: { type: 'string' },
                    floor: { type: 'string' },
                    apartment: { type: 'string' },
                    zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                    landmark: { type: 'string' },
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    phone: { type: 'string' },
                    isDefault: { type: 'boolean' },
                },
                required: ['name', 'street', 'area', 'zone', 'phone'],
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        street: { type: 'string' },
                        area: { type: 'string' },
                        building: { type: 'string', nullable: true },
                        floor: { type: 'string', nullable: true },
                        apartment: { type: 'string', nullable: true },
                        zone: { type: 'string' },
                        landmark: { type: 'string', nullable: true },
                        latitude: { type: 'number', nullable: true },
                        longitude: { type: 'number', nullable: true },
                        phone: { type: 'string' },
                        isDefault: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const data = createAddressSchema.parse(request.body);
            const userId = request.user.userId;
            // If this is the first address or marked as default, handle default logic
            if (data.isDefault) {
                // Remove default from all other addresses
                await fastify.prisma.address.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            // Check if user has any addresses - if not, make this default
            const existingAddresses = await fastify.prisma.address.count({
                where: { userId },
            });
            const address = await fastify.prisma.address.create({
                data: {
                    ...data,
                    userId,
                    isDefault: data.isDefault || existingAddresses === 0,
                },
            });
            return reply.code(201).send(address);
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(400).send({ error: error.message || 'Failed to create address' });
        }
    });
    /**
     * @route PUT /api/addresses/:id
     * @description Update an address
     * @access Private
     */
    fastify.put('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Addresses'],
            summary: 'Update an address',
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
                    name: { type: 'string' },
                    street: { type: 'string' },
                    area: { type: 'string' },
                    building: { type: 'string' },
                    floor: { type: 'string' },
                    apartment: { type: 'string' },
                    zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
                    landmark: { type: 'string' },
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    phone: { type: 'string' },
                    isDefault: { type: 'boolean' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        street: { type: 'string' },
                        area: { type: 'string' },
                        building: { type: 'string', nullable: true },
                        floor: { type: 'string', nullable: true },
                        apartment: { type: 'string', nullable: true },
                        zone: { type: 'string' },
                        landmark: { type: 'string', nullable: true },
                        latitude: { type: 'number', nullable: true },
                        longitude: { type: 'number', nullable: true },
                        phone: { type: 'string' },
                        isDefault: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.userId;
            const data = updateAddressSchema.parse(request.body);
            // Check if address exists and belongs to user
            const existingAddress = await fastify.prisma.address.findFirst({
                where: { id, userId },
            });
            if (!existingAddress) {
                return reply.code(404).send({ error: 'Address not found' });
            }
            // If setting as default, remove default from others
            if (data.isDefault) {
                await fastify.prisma.address.updateMany({
                    where: { userId, isDefault: true, id: { not: id } },
                    data: { isDefault: false },
                });
            }
            const address = await fastify.prisma.address.update({
                where: { id },
                data,
            });
            return reply.send(address);
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(400).send({ error: error.message || 'Failed to update address' });
        }
    });
    /**
     * @route DELETE /api/addresses/:id
     * @description Delete an address
     * @access Private
     */
    fastify.delete('/:id', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Addresses'],
            summary: 'Delete an address',
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
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.user.userId;
        // Check if address exists and belongs to user
        const address = await fastify.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!address) {
            return reply.code(404).send({ error: 'Address not found' });
        }
        // Check if address is used in any orders
        const ordersWithAddress = await fastify.prisma.order.count({
            where: { addressId: id },
        });
        if (ordersWithAddress > 0) {
            return reply.code(400).send({
                error: 'Cannot delete address that is used in orders. You can update it instead.'
            });
        }
        await fastify.prisma.address.delete({
            where: { id },
        });
        // If deleted address was default, set another address as default
        if (address.isDefault) {
            const nextAddress = await fastify.prisma.address.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (nextAddress) {
                await fastify.prisma.address.update({
                    where: { id: nextAddress.id },
                    data: { isDefault: true },
                });
            }
        }
        return reply.send({ message: 'Address deleted successfully' });
    });
    /**
     * @route PATCH /api/addresses/:id/default
     * @description Set an address as default
     * @access Private
     */
    fastify.patch('/:id/default', {
        preHandler: [auth_1.authenticate],
        schema: {
            tags: ['Addresses'],
            summary: 'Set address as default',
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
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        isDefault: { type: 'boolean' },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.user.userId;
        // Check if address exists and belongs to user
        const existingAddress = await fastify.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existingAddress) {
            return reply.code(404).send({ error: 'Address not found' });
        }
        // Remove default from all addresses
        await fastify.prisma.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
        });
        // Set this address as default
        const address = await fastify.prisma.address.update({
            where: { id },
            data: { isDefault: true },
            select: {
                id: true,
                name: true,
                isDefault: true,
            },
        });
        return reply.send(address);
    });
};
exports.default = addressRoutes;
//# sourceMappingURL=addresses.js.map