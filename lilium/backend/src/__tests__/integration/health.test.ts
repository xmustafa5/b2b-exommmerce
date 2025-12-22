import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

describe('Health Endpoint Integration Tests', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    // Create a minimal Fastify instance for testing
    fastify = Fastify({ logger: false });

    // Mock Prisma
    const mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
    } as unknown as PrismaClient;

    fastify.decorate('prisma', mockPrisma);

    // Register health route
    fastify.get('/api/health', async (request, reply) => {
      try {
        // Check database connection
        await fastify.prisma.$queryRaw`SELECT 1`;

        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: 'connected',
        };
      } catch (error) {
        return reply.code(503).send({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
        });
      }
    });

    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.database).toBe('connected');
      expect(body.timestamp).toBeDefined();
      expect(body.uptime).toBeGreaterThan(0);
    });

    it('should return unhealthy when database is down', async () => {
      // Override the mock to simulate database failure
      (fastify.prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(503);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('unhealthy');
      expect(body.database).toBe('disconnected');
    });
  });
});

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
