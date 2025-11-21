import { FastifyPluginAsync } from 'fastify';
import { OrderService } from '../services/order.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole, OrderStatus } from '@prisma/client';

const orderRoutes: FastifyPluginAsync = async (fastify) => {
  const orderService = new OrderService(fastify);

  // Get all orders (with filters)
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Get all orders with filters',
      description: 'Retrieve orders with pagination and filters. Shop owners see only their orders, admins see orders based on their permissions.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Items per page' },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            description: 'Filter by order status'
          },
          zone: {
            type: 'string',
            enum: ['KARKH', 'RUSAFA'],
            description: 'Filter by zone'
          },
          startDate: { type: 'string', format: 'date-time', description: 'Filter orders from this date' },
          endDate: { type: 'string', format: 'date-time', description: 'Filter orders until this date' }
        }
      },
      response: {
        200: {
          description: 'List of orders with pagination',
          type: 'object',
          properties: {
            orders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  orderNumber: { type: 'string' },
                  userId: { type: 'string' },
                  status: { type: 'string' },
                  subtotal: { type: 'number' },
                  discount: { type: 'number' },
                  deliveryFee: { type: 'number' },
                  total: { type: 'number' },
                  zone: { type: 'string' },
                  paymentMethod: { type: 'string', nullable: true },
                  paymentStatus: { type: 'string', nullable: true },
                  notes: { type: 'string', nullable: true },
                  deliveryDate: { type: 'string', format: 'date-time', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
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
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['orders'],
      summary: 'Get order statistics',
      description: 'Retrieve order statistics for admins. Location admins can only see stats for their zones.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          zone: {
            type: 'string',
            enum: ['KARKH', 'RUSAFA'],
            description: 'Filter statistics by zone'
          }
        }
      },
      response: {
        200: {
          description: 'Order statistics',
          type: 'object',
          properties: {
            totalOrders: { type: 'integer', description: 'Total number of orders' },
            totalRevenue: { type: 'number', description: 'Total revenue from all orders' },
            averageOrderValue: { type: 'number', description: 'Average order value' },
            ordersByStatus: {
              type: 'object',
              properties: {
                PENDING: { type: 'integer' },
                CONFIRMED: { type: 'integer' },
                PROCESSING: { type: 'integer' },
                SHIPPED: { type: 'integer' },
                DELIVERED: { type: 'integer' },
                CANCELLED: { type: 'integer' },
                REFUNDED: { type: 'integer' }
              }
            },
            ordersByZone: {
              type: 'object',
              properties: {
                KARKH: { type: 'integer' },
                RUSAFA: { type: 'integer' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
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
    schema: {
      tags: ['orders'],
      summary: 'Get order by ID',
      description: 'Retrieve a single order with all details including items and status history. Shop owners can only access their own orders.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Order ID' }
        }
      },
      response: {
        200: {
          description: 'Order details',
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            userId: { type: 'string' },
            addressId: { type: 'string' },
            companyId: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] },
            subtotal: { type: 'number' },
            discount: { type: 'number' },
            deliveryFee: { type: 'number' },
            total: { type: 'number' },
            notes: { type: 'string', nullable: true },
            promotionId: { type: 'string', nullable: true },
            zone: { type: 'string', enum: ['KARKH', 'RUSAFA'] },
            paymentMethod: { type: 'string', nullable: true },
            paymentStatus: { type: 'string', nullable: true },
            deliveryDate: { type: 'string', format: 'date-time', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            cancelReason: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameEn: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'integer' },
                  discount: { type: 'number' },
                  total: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            statusHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  fromStatus: { type: 'string', nullable: true },
                  toStatus: { type: 'string' },
                  comment: { type: 'string', nullable: true },
                  createdBy: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string', nullable: true }
              }
            },
            address: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                street: { type: 'string' },
                area: { type: 'string' },
                zone: { type: 'string' },
                phone: { type: 'string' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Order not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
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
    preHandler: [authenticate, requireRole(UserRole.SHOP_OWNER)],
    schema: {
      tags: ['orders'],
      summary: 'Create a new order',
      description: 'Create a new order. Only shop owners can create orders.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['addressId', 'companyId', 'items', 'zone'],
        properties: {
          addressId: { type: 'string', description: 'Delivery address ID' },
          companyId: { type: 'string', description: 'Company/vendor ID for this order' },
          zone: {
            type: 'string',
            enum: ['KARKH', 'RUSAFA'],
            description: 'Delivery zone'
          },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'string', description: 'Product ID' },
                quantity: { type: 'integer', minimum: 1, description: 'Quantity to order' }
              }
            },
            description: 'Array of order items'
          },
          notes: { type: 'string', maxLength: 500, description: 'Order notes or special instructions' },
          promotionId: { type: 'string', description: 'Promotion code to apply' },
          paymentMethod: { type: 'string', enum: ['cash', 'card', 'bank_transfer'], description: 'Payment method' },
          deliveryDate: { type: 'string', format: 'date-time', description: 'Preferred delivery date' }
        }
      },
      response: {
        201: {
          description: 'Order created successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            userId: { type: 'string' },
            addressId: { type: 'string' },
            companyId: { type: 'string' },
            status: { type: 'string' },
            subtotal: { type: 'number' },
            discount: { type: 'number' },
            deliveryFee: { type: 'number' },
            total: { type: 'number' },
            notes: { type: 'string', nullable: true },
            zone: { type: 'string' },
            paymentMethod: { type: 'string', nullable: true },
            paymentStatus: { type: 'string' },
            deliveryDate: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  productId: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameEn: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'integer' },
                  discount: { type: 'number' },
                  total: { type: 'number' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - Invalid data or out of stock',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Only shop owners can create orders',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
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
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['orders'],
      summary: 'Update order status',
      description: 'Update the status of an order. Only admins can perform this action. Status changes are tracked in status history.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Order ID' }
        }
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            description: 'New order status'
          },
          note: { type: 'string', maxLength: 500, description: 'Optional note about the status change' }
        }
      },
      response: {
        200: {
          description: 'Order status updated successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            status: { type: 'string' },
            updatedAt: { type: 'string', format: 'date-time' },
            statusHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  fromStatus: { type: 'string', nullable: true },
                  toStatus: { type: 'string' },
                  comment: { type: 'string', nullable: true },
                  createdBy: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad request - Invalid status transition',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Order not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
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
    schema: {
      tags: ['orders'],
      summary: 'Cancel an order',
      description: 'Cancel an order. Shop owners can cancel their own orders if not yet shipped. Admins can cancel any order.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Order ID' }
        }
      },
      response: {
        200: {
          description: 'Order cancelled successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            status: { type: 'string' },
            cancelledAt: { type: 'string', format: 'date-time' },
            cancelReason: { type: 'string', nullable: true },
            updatedAt: { type: 'string', format: 'date-time' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - Order cannot be cancelled (already shipped or delivered)',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Cannot cancel orders of other users',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Order not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
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
