import { FastifyPluginAsync } from 'fastify';
import { CartService } from '../services/cart.service';
import { authenticate } from '../middleware/auth';

const cartRoutes: FastifyPluginAsync = async (fastify) => {
  const cartService = new CartService(fastify);

  // Validate cart items and get summary
  fastify.post('/validate', async (request: any, reply) => {
    try {
      const { items, userId } = request.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cart items are required'
        });
      }

      const summary = await cartService.getCartSummary(items, userId);

      return reply.send({
        success: true,
        summary,
        message: 'Cart validated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get cart summary with authentication
  fastify.post('/summary', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { items } = request.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cart items are required'
        });
      }

      const summary = await cartService.getCartSummary(items, request.user.userId);

      // Estimate delivery time
      const deliveryEstimate = await cartService.estimateDeliveryTime(summary.vendorGroups);

      return reply.send({
        success: true,
        summary,
        deliveryEstimate,
        message: 'Cart summary generated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Checkout - Create orders from cart
  fastify.post('/checkout', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { addressId, items, paymentMethod, notes } = request.body;

      if (!addressId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Delivery address is required'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cart items are required'
        });
      }

      const orders = await cartService.checkout({
        userId: request.user.userId,
        addressId,
        items,
        paymentMethod,
        notes
      });

      return reply.code(201).send({
        success: true,
        orders,
        orderCount: orders.length,
        message: `Successfully created ${orders.length} order(s)`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Save cart for later
  fastify.post('/save', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { items } = request.body;

      if (!items || !Array.isArray(items)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cart items are required'
        });
      }

      await cartService.saveCart(request.user.userId, items);

      return reply.send({
        success: true,
        message: 'Cart saved successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get saved cart
  fastify.get('/saved', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const items = await cartService.getSavedCart(request.user.userId);

      return reply.send({
        success: true,
        items,
        itemCount: items.length
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Clear cart
  fastify.delete('/clear', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      await cartService.clearCart(request.user.userId);

      return reply.send({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Merge guest cart with user cart
  fastify.post('/merge', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { guestItems } = request.body;

      if (!guestItems || !Array.isArray(guestItems)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Guest cart items are required'
        });
      }

      const mergedItems = await cartService.mergeCart(request.user.userId, guestItems);

      return reply.send({
        success: true,
        items: mergedItems,
        itemCount: mergedItems.length,
        message: 'Cart merged successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Apply promotions to cart
  fastify.post('/promotions', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { items } = request.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cart items are required'
        });
      }

      // Validate items first
      const { valid, errors, validatedItems } = await cartService.validateCartItems(items);

      if (!valid) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Cart validation failed',
          errors
        });
      }

      // Apply promotions
      const itemsWithPromotions = await cartService.applyPromotions(
        validatedItems,
        request.user.userId
      );

      // Get updated summary
      const summary = await cartService.getCartSummary(
        itemsWithPromotions.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount
        })),
        request.user.userId
      );

      return reply.send({
        success: true,
        items: itemsWithPromotions,
        summary,
        message: 'Promotions applied successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Check product availability
  fastify.post('/check-availability', async (request: any, reply) => {
    try {
      const { items } = request.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cart items are required'
        });
      }

      const { valid, errors, validatedItems } = await cartService.validateCartItems(items);

      const availability = validatedItems.map(item => ({
        productId: item.productId,
        productName: item.product.nameEn,
        requestedQuantity: item.quantity,
        availableStock: item.product.stock,
        isAvailable: item.product.stock >= item.quantity,
        minOrderQty: item.product.minOrderQty,
        isActive: item.product.isActive
      }));

      return reply.send({
        success: true,
        valid,
        errors,
        availability
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Calculate delivery fees
  fastify.post('/delivery-fee', {
    preHandler: [authenticate]
  }, async (request: any, reply) => {
    try {
      const { items, addressId } = request.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Cart items are required'
        });
      }

      // Get user's address zone
      let userZone = null;
      if (addressId) {
        const address = await fastify.prisma.address.findFirst({
          where: {
            id: addressId,
            userId: request.user.userId
          }
        });
        userZone = address?.zone;
      }

      // Get cart summary which includes delivery fees
      const summary = await cartService.getCartSummary(items, request.user.userId);

      const deliveryDetails = summary.vendorGroups.map(group => ({
        companyId: group.companyId,
        companyName: group.companyName,
        deliveryFee: group.deliveryFee,
        itemCount: group.items.length
      }));

      return reply.send({
        success: true,
        userZone,
        deliveryDetails,
        totalDeliveryFee: summary.totalDeliveryFee,
        message: 'Delivery fees calculated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });
};

export default cartRoutes;