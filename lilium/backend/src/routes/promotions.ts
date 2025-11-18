import { FastifyPluginAsync } from 'fastify';
import { PromotionService } from '../services/promotion.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const promotionRoutes: FastifyPluginAsync = async (fastify) => {
  const promotionService = new PromotionService(fastify);

  // Get all promotions
  fastify.get('/', async (request: any, reply) => {
    try {
      const { includeInactive = false } = request.query;
      const promotions = await promotionService.getPromotions(includeInactive === 'true');
      return reply.send(promotions);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get active promotions by zone
  fastify.get('/active/:zone', async (request: any, reply) => {
    try {
      const { zone } = request.params;
      const promotions = await promotionService.getActivePromotionsByZone(zone);
      return reply.send(promotions);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get single promotion
  fastify.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const promotion = await promotionService.getPromotionById(id);
      return reply.send(promotion);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(404).send({ error: error.message });
    }
  });

  // Create promotion (admin only)
  fastify.post('/', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])],
  }, async (request: any, reply) => {
    try {
      const promotion = await promotionService.createPromotion(request.body);
      return reply.code(201).send(promotion);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  // Update promotion (admin only)
  fastify.put('/:id', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])],
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const promotion = await promotionService.updatePromotion(id, request.body);
      return reply.send(promotion);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  // Toggle promotion status (admin only)
  fastify.patch('/:id/toggle', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])],
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const promotion = await promotionService.togglePromotionStatus(id);
      return reply.send(promotion);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  // Delete promotion (super admin only)
  fastify.delete('/:id', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN])],
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const result = await promotionService.deletePromotion(id);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  // Apply promotions to cart
  fastify.post('/apply-to-cart', {
    preHandler: [authenticate],
  }, async (request: any, reply) => {
    try {
      const { cartItems } = request.body;
      const result = await promotionService.applyPromotionsToCart(cartItems);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });
};

export default promotionRoutes;
