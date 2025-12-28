import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth';

const favoritesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all favorites for current user
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      tags: ['favorites'],
      summary: 'Get user favorites',
      description: 'Get all favorite products for the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of favorite products',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              productId: { type: 'string' },
              userId: { type: 'string' },
              createdAt: { type: 'string' },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nameEn: { type: 'string' },
                  nameAr: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'number' },
                  images: { type: 'array', items: { type: 'string' } },
                  minOrderQty: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const userId = (request as any).user.userId;

    const favorites = await fastify.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            price: true,
            stock: true,
            images: true,
            minOrderQty: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send(favorites);
  });

  // Add product to favorites
  fastify.post<{
    Params: { productId: string };
  }>('/:productId', {
    preHandler: [authenticate],
    schema: {
      tags: ['favorites'],
      summary: 'Add product to favorites',
      description: 'Add a product to the user\'s favorites list',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID to add to favorites' }
        }
      },
      response: {
        201: {
          description: 'Product added to favorites',
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            userId: { type: 'string' },
            createdAt: { type: 'string' },
            product: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nameEn: { type: 'string' },
                nameAr: { type: 'string' },
                price: { type: 'number' },
                stock: { type: 'number' },
                images: { type: 'array', items: { type: 'string' } },
                minOrderQty: { type: 'number' }
              }
            }
          }
        },
        400: {
          description: 'Product already in favorites',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Product not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { productId } = request.params;
    const userId = (request as any).user.userId;

    // Check if product exists
    const product = await fastify.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        price: true,
        stock: true,
        images: true,
        minOrderQty: true
      }
    });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    // Check if already in favorites
    const existingFavorite = await fastify.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingFavorite) {
      return reply.code(400).send({ error: 'Product already in favorites' });
    }

    // Add to favorites
    const favorite = await fastify.prisma.favorite.create({
      data: {
        userId,
        productId
      },
      include: {
        product: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            price: true,
            stock: true,
            images: true,
            minOrderQty: true
          }
        }
      }
    });

    return reply.code(201).send(favorite);
  });

  // Remove product from favorites
  fastify.delete<{
    Params: { productId: string };
  }>('/:productId', {
    preHandler: [authenticate],
    schema: {
      tags: ['favorites'],
      summary: 'Remove product from favorites',
      description: 'Remove a product from the user\'s favorites list',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID to remove from favorites' }
        }
      },
      response: {
        200: {
          description: 'Product removed from favorites',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Favorite not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { productId } = request.params;
    const userId = (request as any).user.userId;

    // Check if favorite exists
    const favorite = await fastify.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (!favorite) {
      return reply.code(404).send({ error: 'Product not in favorites' });
    }

    // Remove from favorites
    await fastify.prisma.favorite.delete({
      where: { id: favorite.id }
    });

    return reply.send({
      success: true,
      message: 'Product removed from favorites'
    });
  });

  // Check if product is in favorites
  fastify.get<{
    Params: { productId: string };
  }>('/check/:productId', {
    preHandler: [authenticate],
    schema: {
      tags: ['favorites'],
      summary: 'Check if product is in favorites',
      description: 'Check if a specific product is in the user\'s favorites',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID to check' }
        }
      },
      response: {
        200: {
          description: 'Favorite status',
          type: 'object',
          properties: {
            isFavorite: { type: 'boolean' },
            favoriteId: { type: 'string', nullable: true }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { productId } = request.params;
    const userId = (request as any).user.userId;

    const favorite = await fastify.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    return reply.send({
      isFavorite: !!favorite,
      favoriteId: favorite?.id || null
    });
  });
};

export default favoritesRoutes;
