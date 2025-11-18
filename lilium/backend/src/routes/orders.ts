import { FastifyPluginAsync } from 'fastify';
import { OrderService } from '../services/order.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole, OrderStatus } from '@prisma/client';

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  const orderService = new OrderService(fastify);

  // Get all orders (with filters)
  fastify.get('/', {
    preHandler: [authenticate],
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 20, status, zone, startDate, endDate } = request.query;
      const user = request.user;

      const filters: any = {};
      if (status) filters.status = status;
      if (zone) filters.zone = zone;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      // Shop owners only see their own orders
      if (user.role === UserRole.SHOP_OWNER) {
        filters.userId = user.userId;
      }

      const result = await orderService.getOrders(
        parseInt(page),
        parseInt(limit),
        filters,
        user.role,
        user.zones
      );

      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get order statistics
  fastify.get('/stats', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])],
  }, async (request: any, reply) => {
    try {
      const { zone } = request.query;
      const user = request.user;

      // Location admins can only see stats for their zones
      let statsZone = zone;
      if (user.role === UserRole.LOCATION_ADMIN && user.zones && user.zones.length > 0) {
        statsZone = user.zones[0]; // Use first zone for location admin
      }

      const stats = await orderService.getOrderStats(statsZone);
      return reply.send(stats);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get single order
  fastify.get('/:id', {
    preHandler: [authenticate],
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const user = request.user;

      const order = await orderService.getOrderById(id, user.userId, user.role);
      return reply.send(order);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(404).send({ error: error.message });
    }
  });

  // Create order (shop owners only)
  fastify.post('/', {
    preHandler: [authenticate, authorize([UserRole.SHOP_OWNER])],
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      const orderData = {
        ...request.body,
        userId: user.userId,
      };

      const order = await orderService.createOrder(orderData);
      return reply.code(201).send(order);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  // Update order status (admin only)
  fastify.put('/:id/status', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])],
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { status, note } = request.body as { status: OrderStatus; note?: string };
      const user = request.user;

      const order = await orderService.updateOrderStatus(id, status, note, user.role);
      return reply.send(order);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });

  // Cancel order
  fastify.delete('/:id', {
    preHandler: [authenticate],
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const user = request.user;

      const order = await orderService.cancelOrder(id, user.userId, user.role);
      return reply.send(order);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message });
    }
  });
};

export default orderRoutes;
