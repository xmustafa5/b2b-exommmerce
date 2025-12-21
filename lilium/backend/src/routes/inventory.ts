import { FastifyPluginAsync } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth';
import { handleError } from '../utils/errors';
import { InventoryService } from '../services/inventory.service';
import { Zone } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const stockUpdateSchema = z.object({
  productId: z.string(),
  quantity: z.number().int(),
  type: z.enum(['RESTOCK', 'ADJUSTMENT', 'RETURN']),
  notes: z.string().optional(),
});

const bulkStockUpdateSchema = z.object({
  updates: z.array(stockUpdateSchema.omit({ productId: true }).extend({
    productId: z.string(),
  })),
});

const inventoryRoutes: FastifyPluginAsync = async (fastify) => {
  const inventoryService = new InventoryService(fastify);

  // POST /api/inventory/stock/update - Update stock for a single product
  fastify.post('/stock/update', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Update stock for a single product',
      tags: ['Inventory'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['productId', 'quantity', 'type'],
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'number', description: 'For RESTOCK/RETURN: amount to add. For ADJUSTMENT: new absolute value' },
          type: { type: 'string', enum: ['RESTOCK', 'ADJUSTMENT', 'RETURN'] },
          notes: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            product: { type: 'object' },
            stockHistory: { type: 'object' },
            alertSent: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const data = stockUpdateSchema.parse(request.body);
      const result = await inventoryService.updateStock({
        ...data,
        createdBy: request.user.userId,
      });
      return reply.send(result);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // POST /api/inventory/stock/bulk-update - Bulk update stock for multiple products
  fastify.post('/stock/bulk-update', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Bulk update stock for multiple products',
      tags: ['Inventory'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['updates'],
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId', 'quantity', 'type'],
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number' },
                type: { type: 'string', enum: ['RESTOCK', 'ADJUSTMENT', 'RETURN'] },
                notes: { type: 'string' },
              },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            successCount: { type: 'number' },
            failureCount: { type: 'number' },
            results: { type: 'array' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const data = bulkStockUpdateSchema.parse(request.body);
      const result = await inventoryService.bulkUpdateStock({
        updates: data.updates,
        createdBy: request.user.userId,
      });
      return reply.send(result);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/inventory/low-stock - Get all products with low stock
  fastify.get('/low-stock', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Get all products with low stock',
      tags: ['Inventory'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          threshold: { type: 'number', description: 'Low stock threshold (default: 10)' },
          zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
        },
      },
      response: {
        200: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { threshold, zone } = request.query;

      // Zone access check for LOCATION_ADMIN
      let effectiveZone = zone as Zone | undefined;
      if (request.user.role === 'LOCATION_ADMIN' && request.user.zones?.length > 0) {
        if (zone && !request.user.zones.includes(zone)) {
          return reply.code(403).send({ error: 'Access denied to this zone', code: 'FORBIDDEN' });
        }
        if (!zone && request.user.zones.length === 1) {
          effectiveZone = request.user.zones[0];
        }
      }

      const products = await inventoryService.getLowStockProducts({
        threshold: threshold ? parseInt(threshold) : undefined,
        zone: effectiveZone,
      });
      return reply.send(products);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/inventory/out-of-stock - Get all out of stock products
  fastify.get('/out-of-stock', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Get all out of stock products',
      tags: ['Inventory'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
        },
      },
      response: {
        200: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { zone } = request.query;

      // Zone access check for LOCATION_ADMIN
      let effectiveZone = zone as Zone | undefined;
      if (request.user.role === 'LOCATION_ADMIN' && request.user.zones?.length > 0) {
        if (zone && !request.user.zones.includes(zone)) {
          return reply.code(403).send({ error: 'Access denied to this zone', code: 'FORBIDDEN' });
        }
        if (!zone && request.user.zones.length === 1) {
          effectiveZone = request.user.zones[0];
        }
      }

      const products = await inventoryService.getOutOfStockProducts(effectiveZone);
      return reply.send(products);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/inventory/history/:productId - Get stock history for a product
  fastify.get('/history/:productId', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Get stock history for a product',
      tags: ['Inventory'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            history: { type: 'array' },
            total: { type: 'number' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { productId } = request.params;
      const { limit, offset, startDate, endDate } = request.query;

      const result = await inventoryService.getStockHistory(productId, {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return reply.send(result);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/inventory/report - Generate inventory report
  fastify.get('/report', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Generate inventory report',
      tags: ['Inventory'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            totalProducts: { type: 'number' },
            totalValue: { type: 'number' },
            lowStockCount: { type: 'number' },
            outOfStockCount: { type: 'number' },
            healthyStockCount: { type: 'number' },
            byCategory: { type: 'array' },
            byZone: { type: 'array' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { zone } = request.query;

      // Zone access check for LOCATION_ADMIN
      let effectiveZone = zone as Zone | undefined;
      if (request.user.role === 'LOCATION_ADMIN' && request.user.zones?.length > 0) {
        if (zone && !request.user.zones.includes(zone)) {
          return reply.code(403).send({ error: 'Access denied to this zone', code: 'FORBIDDEN' });
        }
        if (!zone && request.user.zones.length === 1) {
          effectiveZone = request.user.zones[0];
        }
      }

      const report = await inventoryService.generateInventoryReport(effectiveZone);
      return reply.send(report);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // GET /api/inventory/restock-suggestions - Get products that need restocking
  fastify.get('/restock-suggestions', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      description: 'Get products that need restocking based on sales velocity',
      tags: ['Inventory'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'number', default: 30, description: 'Days to analyze for sales velocity' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product: { type: 'object' },
              currentStock: { type: 'number' },
              totalSold: { type: 'number' },
              dailyVelocity: { type: 'number' },
              daysUntilOutOfStock: { type: 'number' },
              suggestedReorder: { type: 'number' },
            },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { days } = request.query;
      const suggestions = await inventoryService.getRestockSuggestions(
        days ? parseInt(days) : 30
      );
      return reply.send(suggestions);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });
};

export default inventoryRoutes;
