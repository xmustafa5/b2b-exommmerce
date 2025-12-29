import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';
import { CartService } from '../services/cart.service';
import { z } from 'zod';

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

const syncCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })),
});

// Swagger response schemas
const cartItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    productId: { type: 'string' },
    quantity: { type: 'integer' },
    lineTotal: { type: 'number' },
    product: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        sku: { type: 'string' },
        nameAr: { type: 'string' },
        nameEn: { type: 'string' },
        price: { type: 'number' },
        compareAtPrice: { type: 'number', nullable: true },
        stock: { type: 'integer' },
        minOrderQty: { type: 'integer' },
        unit: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
        isActive: { type: 'boolean' },
        zones: { type: 'array', items: { type: 'string' } },
        companyId: { type: 'string' },
        category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nameAr: { type: 'string' },
            nameEn: { type: 'string' },
          },
        },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const cartResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', nullable: true },
    items: { type: 'array', items: cartItemSchema },
    itemCount: { type: 'integer' },
    subtotal: { type: 'number' },
    syncErrors: { type: 'array', items: { type: 'string' }, nullable: true },
  },
};

const cartRoutes: FastifyPluginAsync = async (fastify) => {
  const cartService = new CartService(fastify);

  /**
   * @route GET /api/cart
   * @description Get current user's cart
   * @access Private
   */
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      tags: ['Cart'],
      summary: 'Get cart',
      description: 'Get the current user\'s shopping cart with all items and product details',
      security: [{ bearerAuth: [] }],
      response: {
        200: cartResponseSchema,
      },
    },
  }, async (request: any, reply) => {
    try {
      const cart = await cartService.getCart(request.user.userId);
      return reply.send(cart);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message || 'Failed to get cart' });
    }
  });

  /**
   * @route GET /api/cart/count
   * @description Get cart item count
   * @access Private
   */
  fastify.get('/count', {
    preHandler: [authenticate],
    schema: {
      tags: ['Cart'],
      summary: 'Get cart item count',
      description: 'Get the total number of items in the cart (for badge display)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const result = await cartService.getCartCount(request.user.userId);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message || 'Failed to get cart count' });
    }
  });

  /**
   * @route POST /api/cart/items
   * @description Add item to cart
   * @access Private
   */
  fastify.post('/items', {
    preHandler: [authenticate],
    schema: {
      tags: ['Cart'],
      summary: 'Add item to cart',
      description: 'Add a product to the cart. If product already exists, quantity will be added.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string', description: 'Product ID to add' },
          quantity: { type: 'integer', minimum: 1, description: 'Quantity to add' },
        },
      },
      response: {
        200: cartResponseSchema,
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const data = addToCartSchema.parse(request.body);
      const cart = await cartService.addToCart(request.user.userId, data);
      return reply.send(cart);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message || 'Failed to add item to cart' });
    }
  });

  /**
   * @route PUT /api/cart/items/:productId
   * @description Update cart item quantity
   * @access Private
   */
  fastify.put('/items/:productId', {
    preHandler: [authenticate],
    schema: {
      tags: ['Cart'],
      summary: 'Update cart item quantity',
      description: 'Update the quantity of a specific item in the cart. Set to 0 to remove.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID to update' },
        },
      },
      body: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'integer', minimum: 0, description: 'New quantity (0 to remove)' },
        },
      },
      response: {
        200: cartResponseSchema,
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
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
  }, async (request: any, reply) => {
    try {
      const { productId } = request.params;
      const data = updateCartItemSchema.parse(request.body);
      const cart = await cartService.updateCartItem(request.user.userId, productId, data);
      return reply.send(cart);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.message.includes('not found')) {
        return reply.code(404).send({ error: error.message });
      }
      return reply.code(400).send({ error: error.message || 'Failed to update cart item' });
    }
  });

  /**
   * @route DELETE /api/cart/items/:productId
   * @description Remove item from cart
   * @access Private
   */
  fastify.delete('/items/:productId', {
    preHandler: [authenticate],
    schema: {
      tags: ['Cart'],
      summary: 'Remove item from cart',
      description: 'Remove a specific product from the cart',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID to remove' },
        },
      },
      response: {
        200: cartResponseSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { productId } = request.params;
      const cart = await cartService.removeFromCart(request.user.userId, productId);
      return reply.send(cart);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.message.includes('not found')) {
        return reply.code(404).send({ error: error.message });
      }
      return reply.code(400).send({ error: error.message || 'Failed to remove item from cart' });
    }
  });

  /**
   * @route DELETE /api/cart
   * @description Clear entire cart
   * @access Private
   */
  fastify.delete('/', {
    preHandler: [authenticate],
    schema: {
      tags: ['Cart'],
      summary: 'Clear cart',
      description: 'Remove all items from the cart',
      security: [{ bearerAuth: [] }],
      response: {
        200: cartResponseSchema,
      },
    },
  }, async (request: any, reply) => {
    try {
      const cart = await cartService.clearCart(request.user.userId);
      return reply.send(cart);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message || 'Failed to clear cart' });
    }
  });

  /**
   * @route POST /api/cart/sync
   * @description Sync local cart with server
   * @access Private
   */
  fastify.post('/sync', {
    preHandler: [authenticate],
    schema: {
      tags: ['Cart'],
      summary: 'Sync cart',
      description: 'Sync local cart data with the server. Replaces server cart with provided items.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
              },
            },
          },
        },
      },
      response: {
        200: cartResponseSchema,
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const data = syncCartSchema.parse(request.body);
      const cart = await cartService.syncCart(request.user.userId, data.items);
      return reply.send(cart);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: error.message || 'Failed to sync cart' });
    }
  });
};

export default cartRoutes;
