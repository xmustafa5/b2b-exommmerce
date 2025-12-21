"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const healthRoutes = async (fastify, opts) => {
    fastify.get('/', {
        schema: {
            description: 'Health check endpoint',
            tags: ['Health'],
            response: {
                200: {
                    description: 'Service is healthy',
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        uptime: { type: 'number' },
                        database: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            // Check database connection
            await fastify.prisma.$queryRaw `SELECT 1`;
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: 'connected'
            };
        }
        catch (error) {
            reply.code(503).send({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: 'disconnected'
            });
        }
    });
};
exports.default = healthRoutes;
//# sourceMappingURL=health.js.map