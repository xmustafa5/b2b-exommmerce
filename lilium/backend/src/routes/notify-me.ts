import { FastifyPluginAsync } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { NotificationService } from '../services/notification.service';

const notifyMeRoutes: FastifyPluginAsync = async (fastify) => {
  const notificationService = new NotificationService(fastify);

  // Subscribe to product back-in-stock notification (Shop owners)
  fastify.post<{
    Params: { productId: string };
  }>('/:productId', {
    preHandler: [authenticate],
    schema: {
      tags: ['notify-me'],
      summary: 'Subscribe to back-in-stock notification',
      description: 'Subscribe to receive a notification when an out-of-stock product becomes available again',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID to subscribe to' }
        }
      },
      response: {
        201: {
          description: 'Successfully subscribed to notification',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                productId: { type: 'string' },
                userId: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        },
        400: {
          description: 'Bad request - Product in stock or already subscribed',
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
      select: { id: true, nameEn: true, stock: true }
    });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    // Check if product is already in stock
    if (product.stock > 0) {
      return reply.code(400).send({
        error: 'Product is already in stock. No need to subscribe for notification.'
      });
    }

    // Check if user already subscribed
    const existingRequest = await fastify.prisma.notifyMe.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingRequest) {
      if (existingRequest.notified) {
        // Re-subscribe if previously notified
        const updated = await fastify.prisma.notifyMe.update({
          where: { id: existingRequest.id },
          data: {
            notified: false,
            notifiedAt: null
          }
        });

        return reply.code(201).send({
          success: true,
          message: 'Re-subscribed to back-in-stock notification',
          data: updated
        });
      }

      return reply.code(400).send({
        error: 'You are already subscribed to notifications for this product'
      });
    }

    // Create subscription
    const notifyRequest = await fastify.prisma.notifyMe.create({
      data: {
        userId,
        productId
      }
    });

    return reply.code(201).send({
      success: true,
      message: `You will be notified when "${product.nameEn}" is back in stock`,
      data: notifyRequest
    });
  });

  // Unsubscribe from product notification
  fastify.delete<{
    Params: { productId: string };
  }>('/:productId', {
    preHandler: [authenticate],
    schema: {
      tags: ['notify-me'],
      summary: 'Unsubscribe from back-in-stock notification',
      description: 'Remove subscription for a product notification',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID to unsubscribe from' }
        }
      },
      response: {
        200: {
          description: 'Successfully unsubscribed',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Subscription not found',
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

    const existingRequest = await fastify.prisma.notifyMe.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (!existingRequest) {
      return reply.code(404).send({
        error: 'You are not subscribed to notifications for this product'
      });
    }

    await fastify.prisma.notifyMe.delete({
      where: { id: existingRequest.id }
    });

    return reply.send({
      success: true,
      message: 'Successfully unsubscribed from notifications'
    });
  });

  // Get user's notify-me subscriptions
  fastify.get('/my-subscriptions', {
    preHandler: [authenticate],
    schema: {
      tags: ['notify-me'],
      summary: 'Get my notify-me subscriptions',
      description: 'Get all products the user has subscribed to for back-in-stock notifications',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of subscribed products',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  notified: { type: 'boolean' },
                  notifiedAt: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  product: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      nameEn: { type: 'string' },
                      nameAr: { type: 'string' },
                      price: { type: 'number' },
                      stock: { type: 'number' },
                      images: { type: 'array', items: { type: 'string' } }
                    }
                  }
                }
              }
            },
            count: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const userId = (request as any).user.userId;

    const subscriptions = await fastify.prisma.notifyMe.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            price: true,
            stock: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({
      success: true,
      data: subscriptions,
      count: subscriptions.length
    });
  });

  // Check if user is subscribed to a product
  fastify.get<{
    Params: { productId: string };
  }>('/check/:productId', {
    preHandler: [authenticate],
    schema: {
      tags: ['notify-me'],
      summary: 'Check subscription status',
      description: 'Check if the user is subscribed to notifications for a specific product',
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
          description: 'Subscription status',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            isSubscribed: { type: 'boolean' },
            notified: { type: 'boolean' },
            subscribedAt: { type: 'string', nullable: true }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { productId } = request.params;
    const userId = (request as any).user.userId;

    const subscription = await fastify.prisma.notifyMe.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    return reply.send({
      success: true,
      isSubscribed: !!subscription && !subscription.notified,
      notified: subscription?.notified || false,
      subscribedAt: subscription?.createdAt?.toISOString() || null
    });
  });

  // ==================== ADMIN ENDPOINTS ====================

  // Get all notify-me requests for a product (Admin)
  fastify.get<{
    Params: { productId: string };
    Querystring: { notified?: string; page?: string; limit?: string };
  }>('/product/:productId/requests', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['notify-me'],
      summary: 'Get notify requests for a product (Admin)',
      description: 'Get all users who have subscribed to notifications for a specific product',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          notified: { type: 'string', enum: ['true', 'false'], description: 'Filter by notification status' },
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' }
        }
      },
      response: {
        200: {
          description: 'List of notify requests',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  notified: { type: 'boolean' },
                  notifiedAt: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      phone: { type: 'string', nullable: true },
                      businessName: { type: 'string', nullable: true }
                    }
                  }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
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
    const { notified, page = '1', limit = '20' } = request.query;

    // Check if product exists
    const product = await fastify.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { productId };
    if (notified !== undefined) {
      where.notified = notified === 'true';
    }

    const [requests, total] = await Promise.all([
      fastify.prisma.notifyMe.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              businessName: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      fastify.prisma.notifyMe.count({ where })
    ]);

    return reply.send({
      success: true,
      data: requests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  });

  // Get notify-me statistics (Admin)
  fastify.get('/stats', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['notify-me'],
      summary: 'Get notify-me statistics (Admin)',
      description: 'Get overall statistics for notify-me requests',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Notify-me statistics',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalRequests: { type: 'number' },
                pendingRequests: { type: 'number' },
                notifiedRequests: { type: 'number' },
                uniqueProducts: { type: 'number' },
                uniqueUsers: { type: 'number' },
                topRequestedProducts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string' },
                      productName: { type: 'string' },
                      requestCount: { type: 'number' },
                      stock: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const [
      totalRequests,
      pendingRequests,
      notifiedRequests,
      uniqueProducts,
      uniqueUsers,
      topProducts
    ] = await Promise.all([
      fastify.prisma.notifyMe.count(),
      fastify.prisma.notifyMe.count({ where: { notified: false } }),
      fastify.prisma.notifyMe.count({ where: { notified: true } }),
      fastify.prisma.notifyMe.groupBy({
        by: ['productId'],
        _count: true
      }).then(r => r.length),
      fastify.prisma.notifyMe.groupBy({
        by: ['userId'],
        _count: true
      }).then(r => r.length),
      fastify.prisma.notifyMe.groupBy({
        by: ['productId'],
        where: { notified: false },
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10
      })
    ]);

    // Get product details for top requested products
    const productIds = topProducts.map(p => p.productId);
    const products = await fastify.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nameEn: true, stock: true }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const topRequestedProducts = topProducts.map(p => {
      const product = productMap.get(p.productId);
      return {
        productId: p.productId,
        productName: product?.nameEn || 'Unknown',
        requestCount: p._count.productId,
        stock: product?.stock || 0
      };
    });

    return reply.send({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        notifiedRequests,
        uniqueProducts,
        uniqueUsers,
        topRequestedProducts
      }
    });
  });

  // Manually trigger back-in-stock notification (Admin)
  fastify.post<{
    Params: { productId: string };
  }>('/product/:productId/notify', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['notify-me'],
      summary: 'Send back-in-stock notifications (Admin)',
      description: 'Manually trigger back-in-stock notifications for all pending subscribers of a product',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', description: 'Product ID' }
        }
      },
      response: {
        200: {
          description: 'Notifications sent',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            notifiedCount: { type: 'number' }
          }
        },
        400: {
          description: 'Product still out of stock',
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

    // Check if product exists and has stock
    const product = await fastify.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, nameEn: true, stock: true }
    });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    if (product.stock <= 0) {
      return reply.code(400).send({
        error: 'Product is still out of stock. Cannot send back-in-stock notifications.'
      });
    }

    // Count pending requests before notifying
    const pendingCount = await fastify.prisma.notifyMe.count({
      where: { productId, notified: false }
    });

    if (pendingCount === 0) {
      return reply.send({
        success: true,
        message: 'No pending notification requests for this product',
        notifiedCount: 0
      });
    }

    // Trigger notifications
    await notificationService.notifyBackInStock(productId);

    return reply.send({
      success: true,
      message: `Successfully sent back-in-stock notifications for "${product.nameEn}"`,
      notifiedCount: pendingCount
    });
  });

  // Bulk clear notified requests (Admin)
  fastify.delete('/clear-notified', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      tags: ['notify-me'],
      summary: 'Clear all notified requests (Super Admin)',
      description: 'Delete all notify-me requests that have already been notified. This helps clean up old data.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          olderThanDays: {
            type: 'string',
            default: '30',
            description: 'Only clear requests notified more than X days ago'
          }
        }
      },
      response: {
        200: {
          description: 'Requests cleared',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            deletedCount: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { olderThanDays = '30' } = request.query as { olderThanDays?: string };

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(olderThanDays, 10));

    const result = await fastify.prisma.notifyMe.deleteMany({
      where: {
        notified: true,
        notifiedAt: { lt: daysAgo }
      }
    });

    return reply.send({
      success: true,
      message: `Cleared ${result.count} notified requests older than ${olderThanDays} days`,
      deletedCount: result.count
    });
  });
};

export default notifyMeRoutes;
