import { FastifyPluginAsync } from 'fastify';
import { PromotionService } from '../services/promotion.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

// Shared schema definitions for reuse
const promotionProductSchema = {
  type: 'object',
  properties: {
    productId: { type: 'string' },
    promotionId: { type: 'string' },
    product: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nameEn: { type: 'string' },
        nameAr: { type: 'string' },
        sku: { type: 'string' },
        price: { type: 'number' },
        images: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

const promotionCategorySchema = {
  type: 'object',
  properties: {
    categoryId: { type: 'string' },
    promotionId: { type: 'string' },
    category: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nameEn: { type: 'string' },
        nameAr: { type: 'string' },
        slug: { type: 'string' }
      }
    }
  }
};

const promotionResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    nameAr: { type: 'string' },
    nameEn: { type: 'string' },
    descriptionAr: { type: 'string', nullable: true },
    descriptionEn: { type: 'string', nullable: true },
    type: { type: 'string', enum: ['percentage', 'fixed', 'buy_x_get_y', 'bundle'] },
    value: { type: 'number' },
    minPurchase: { type: 'number', nullable: true },
    maxDiscount: { type: 'number', nullable: true },
    buyQuantity: { type: 'integer', nullable: true },
    getQuantity: { type: 'integer', nullable: true },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
    zones: { type: 'array', items: { type: 'string', enum: ['KARKH', 'RUSAFA'] } },
    isActive: { type: 'boolean' },
    usageLimit: { type: 'integer', nullable: true },
    usageCount: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    products: { type: 'array', items: promotionProductSchema },
    categories: { type: 'array', items: promotionCategorySchema }
  }
};

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' }
  }
};

const promotionRoutes: FastifyPluginAsync = async (fastify) => {
  const promotionService = new PromotionService(fastify);

  // Get all promotions
  fastify.get('/', {
    schema: {
      tags: ['promotions'],
      summary: 'Get all promotions',
      description: 'Retrieve a list of all promotions. By default, only active and non-expired promotions are returned. Use includeInactive=true to retrieve all promotions including inactive ones.',
      querystring: {
        type: 'object',
        properties: {
          includeInactive: {
            type: 'string',
            enum: ['true', 'false'],
            default: 'false',
            description: 'Set to "true" to include inactive and expired promotions'
          }
        }
      },
      response: {
        200: {
          description: 'List of promotions',
          type: 'array',
          items: promotionResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
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
  fastify.get('/active/:zone', {
    schema: {
      tags: ['promotions'],
      summary: 'Get active promotions by zone',
      description: 'Retrieve all currently active promotions that apply to a specific zone. Only returns promotions that are active, within their valid date range, and applicable to the specified zone.',
      params: {
        type: 'object',
        required: ['zone'],
        properties: {
          zone: {
            type: 'string',
            enum: ['KARKH', 'RUSAFA'],
            description: 'The zone to filter promotions by'
          }
        }
      },
      response: {
        200: {
          description: 'List of active promotions for the specified zone',
          type: 'array',
          items: promotionResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
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
  fastify.get('/:id', {
    schema: {
      tags: ['promotions'],
      summary: 'Get promotion by ID',
      description: 'Retrieve detailed information about a specific promotion by its ID, including associated products and categories.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Promotion ID'
          }
        }
      },
      response: {
        200: {
          description: 'Promotion details',
          ...promotionResponseSchema
        },
        404: {
          description: 'Promotion not found',
          ...errorResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
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
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['promotions'],
      summary: 'Create new promotion',
      description: 'Create a new promotion with specified discount type, value, and validity period. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nameEn', 'nameAr', 'type', 'value', 'startDate', 'endDate', 'zones'],
        properties: {
          nameEn: {
            type: 'string',
            minLength: 2,
            description: 'Promotion name in English'
          },
          nameAr: {
            type: 'string',
            minLength: 2,
            description: 'Promotion name in Arabic'
          },
          descriptionEn: {
            type: 'string',
            nullable: true,
            description: 'Promotion description in English'
          },
          descriptionAr: {
            type: 'string',
            nullable: true,
            description: 'Promotion description in Arabic'
          },
          type: {
            type: 'string',
            enum: ['percentage', 'fixed', 'buy_x_get_y', 'bundle'],
            description: 'Type of discount: percentage (% off), fixed (fixed amount off), buy_x_get_y (buy X get Y free), bundle (bundle discount)'
          },
          value: {
            type: 'number',
            minimum: 0,
            description: 'Discount value (percentage for percentage type, fixed amount for fixed type)'
          },
          minPurchase: {
            type: 'number',
            minimum: 0,
            nullable: true,
            description: 'Minimum purchase amount required to apply this promotion'
          },
          maxDiscount: {
            type: 'number',
            minimum: 0,
            nullable: true,
            description: 'Maximum discount amount (applies to percentage type to cap the discount)'
          },
          buyQuantity: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            description: 'Number of items to buy (for buy_x_get_y type)'
          },
          getQuantity: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            description: 'Number of free items to get (for buy_x_get_y type)'
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Promotion start date and time'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Promotion end date and time'
          },
          zones: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['KARKH', 'RUSAFA']
            },
            minItems: 1,
            description: 'Zones where this promotion is applicable'
          },
          productIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of product IDs this promotion applies to'
          },
          categoryIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of category IDs this promotion applies to'
          },
          isActive: {
            type: 'boolean',
            default: true,
            description: 'Whether the promotion is active'
          },
          usageLimit: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            description: 'Maximum number of times this promotion can be used'
          }
        }
      },
      response: {
        201: {
          description: 'Promotion created successfully',
          ...promotionResponseSchema
        },
        400: {
          description: 'Bad request - validation error or invalid dates',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['promotions'],
      summary: 'Update promotion',
      description: 'Update an existing promotion. All fields are optional. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Promotion ID to update'
          }
        }
      },
      body: {
        type: 'object',
        properties: {
          nameEn: {
            type: 'string',
            minLength: 2,
            description: 'Promotion name in English'
          },
          nameAr: {
            type: 'string',
            minLength: 2,
            description: 'Promotion name in Arabic'
          },
          descriptionEn: {
            type: 'string',
            nullable: true,
            description: 'Promotion description in English'
          },
          descriptionAr: {
            type: 'string',
            nullable: true,
            description: 'Promotion description in Arabic'
          },
          type: {
            type: 'string',
            enum: ['percentage', 'fixed', 'buy_x_get_y', 'bundle'],
            description: 'Type of discount'
          },
          value: {
            type: 'number',
            minimum: 0,
            description: 'Discount value'
          },
          minPurchase: {
            type: 'number',
            minimum: 0,
            nullable: true,
            description: 'Minimum purchase amount required'
          },
          maxDiscount: {
            type: 'number',
            minimum: 0,
            nullable: true,
            description: 'Maximum discount amount (for percentage type)'
          },
          buyQuantity: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            description: 'Number of items to buy (for buy_x_get_y type)'
          },
          getQuantity: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            description: 'Number of free items to get (for buy_x_get_y type)'
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Promotion start date and time'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Promotion end date and time'
          },
          zones: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['KARKH', 'RUSAFA']
            },
            description: 'Zones where this promotion is applicable'
          },
          productIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of product IDs this promotion applies to (replaces existing products)'
          },
          categoryIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of category IDs this promotion applies to (replaces existing categories)'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the promotion is active'
          },
          usageLimit: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            description: 'Maximum number of times this promotion can be used'
          }
        }
      },
      response: {
        200: {
          description: 'Promotion updated successfully',
          ...promotionResponseSchema
        },
        400: {
          description: 'Bad request - validation error or invalid dates',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          ...errorResponseSchema
        },
        404: {
          description: 'Promotion not found',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['promotions'],
      summary: 'Toggle promotion status',
      description: 'Toggle the active status of a promotion (activate/deactivate). Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Promotion ID to toggle'
          }
        }
      },
      response: {
        200: {
          description: 'Promotion status toggled successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            nameAr: { type: 'string' },
            nameEn: { type: 'string' },
            descriptionAr: { type: 'string', nullable: true },
            descriptionEn: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['percentage', 'fixed', 'buy_x_get_y', 'bundle'] },
            value: { type: 'number' },
            minPurchase: { type: 'number', nullable: true },
            maxDiscount: { type: 'number', nullable: true },
            buyQuantity: { type: 'integer', nullable: true },
            getQuantity: { type: 'integer', nullable: true },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            zones: { type: 'array', items: { type: 'string', enum: ['KARKH', 'RUSAFA'] } },
            isActive: { type: 'boolean' },
            usageLimit: { type: 'integer', nullable: true },
            usageCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          description: 'Bad request',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          ...errorResponseSchema
        },
        404: {
          description: 'Promotion not found',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      tags: ['promotions'],
      summary: 'Delete promotion',
      description: 'Permanently delete a promotion. Only accessible by SUPER_ADMIN role.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Promotion ID to delete'
          }
        }
      },
      response: {
        200: {
          description: 'Promotion deleted successfully',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden - insufficient permissions',
          ...errorResponseSchema
        },
        404: {
          description: 'Promotion not found',
          ...errorResponseSchema
        }
      }
    }
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
    schema: {
      tags: ['promotions'],
      summary: 'Apply promotions to cart',
      description: 'Calculate and apply applicable promotions to cart items. Returns total discount amount and details of applied promotions for each item.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['cartItems'],
        properties: {
          cartItems: {
            type: 'array',
            minItems: 1,
            description: 'Array of cart items to calculate promotions for',
            items: {
              type: 'object',
              required: ['productId', 'quantity', 'price'],
              properties: {
                productId: {
                  type: 'string',
                  description: 'Product ID'
                },
                quantity: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Quantity of the product in cart'
                },
                price: {
                  type: 'number',
                  minimum: 0,
                  description: 'Unit price of the product'
                }
              }
            }
          }
        }
      },
      response: {
        200: {
          description: 'Promotion calculation result',
          type: 'object',
          properties: {
            totalDiscount: {
              type: 'number',
              description: 'Total discount amount applied to the cart'
            },
            appliedPromotions: {
              type: 'array',
              description: 'List of promotions applied to cart items',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'string',
                    description: 'Product ID the promotion was applied to'
                  },
                  id: {
                    type: 'string',
                    description: 'Promotion ID'
                  },
                  nameEn: {
                    type: 'string',
                    description: 'Promotion name in English'
                  },
                  nameAr: {
                    type: 'string',
                    description: 'Promotion name in Arabic'
                  },
                  type: {
                    type: 'string',
                    enum: ['percentage', 'fixed', 'buy_x_get_y', 'bundle'],
                    description: 'Type of discount applied'
                  },
                  value: {
                    type: 'number',
                    description: 'Discount value'
                  },
                  discountAmount: {
                    type: 'number',
                    description: 'Actual discount amount applied to this item'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - validation error',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - invalid or missing token',
          ...errorResponseSchema
        }
      }
    }
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
