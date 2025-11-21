import { FastifyPluginAsync } from 'fastify';
import { DeliveryService } from '../services/delivery.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole, OrderStatus } from '@prisma/client';

const deliveryRoutes: FastifyPluginAsync = async (fastify) => {
  const deliveryService = new DeliveryService(fastify);

  // Update order status (Vendor/Company Manager)
  fastify.patch('/orders/:orderId/status', {
    preHandler: [authenticate],
    schema: {
      tags: ['delivery'],
      summary: 'Update order status in delivery workflow',
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string' }
        },
        required: ['orderId']
      },
      body: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: Object.values(OrderStatus)
          },
          notes: { type: 'string' },
          estimatedTime: { type: 'string', format: 'date-time' },
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' }
            }
          }
        },
        required: ['status']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderId } = request.params;
      const user = request.user;

      // Check if user has permission to update this order
      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        // Verify order belongs to user's company
        const order = await fastify.prisma.order.findFirst({
          where: {
            id: orderId,
            items: {
              some: {
                product: {
                  companyId: user.companyId
                }
              }
            }
          }
        });

        if (!order) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to update this order'
          });
        }
      }

      const updatedOrder = await deliveryService.updateOrderStatus(
        {
          orderId,
          ...request.body
        },
        user.id
      );

      return reply.send({
        success: true,
        order: updatedOrder,
        message: `Order status updated to ${request.body.status}`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Bulk update order statuses (Vendor/Company Manager)
  fastify.patch('/orders/bulk-status', {
    preHandler: [authenticate],
    schema: {
      tags: ['delivery'],
      summary: 'Bulk update order statuses',
      body: {
        type: 'object',
        properties: {
          orderIds: {
            type: 'array',
            items: { type: 'string' }
          },
          status: {
            type: 'string',
            enum: Object.values(OrderStatus)
          }
        },
        required: ['orderIds', 'status']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderIds, status } = request.body;
      const user = request.user;

      // Validate permissions for each order if vendor/company manager
      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        const validOrders = await fastify.prisma.order.findMany({
          where: {
            id: { in: orderIds },
            items: {
              some: {
                product: {
                  companyId: user.companyId
                }
              }
            }
          },
          select: { id: true }
        });

        const validIds = validOrders.map(o => o.id);
        if (validIds.length !== orderIds.length) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to update some of these orders'
          });
        }
      }

      const result = await deliveryService.bulkUpdateStatus(orderIds, status, user.id);

      return reply.send({
        success: true,
        ...result,
        message: `Updated ${result.updated} orders, ${result.failed} failed`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get orders by status (Vendor/Company Manager)
  fastify.get('/orders/status/:status', {
    preHandler: [authenticate],
    schema: {
      tags: ['delivery'],
      summary: 'Get orders by delivery status',
      params: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: Object.values(OrderStatus)
          }
        },
        required: ['status']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { status } = request.params;
      const user = request.user;

      let companyId = user.companyId;

      // Admins can view all orders
      if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        const { companyId: queryCompanyId } = request.query;
        if (queryCompanyId) {
          companyId = queryCompanyId;
        } else {
          // Return all orders if no company specified
          const orders = await fastify.prisma.order.findMany({
            where: { status },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  address: true
                }
              },
              items: {
                include: {
                  product: {
                    include: {
                      company: true
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          });

          return reply.send({
            success: true,
            orders
          });
        }
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const orders = await deliveryService.getOrdersByStatus(companyId, status);

      return reply.send({
        success: true,
        orders
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Assign driver to order (Admin/Company Manager)
  fastify.post('/orders/:orderId/assign-driver', {
    preHandler: [authenticate],
    schema: {
      tags: ['delivery'],
      summary: 'Assign delivery driver to order',
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string' }
        },
        required: ['orderId']
      },
      body: {
        type: 'object',
        properties: {
          driverId: { type: 'string' }
        },
        required: ['driverId']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderId } = request.params;
      const { driverId } = request.body;
      const user = request.user;

      // Check permissions
      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY_MANAGER].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only admins and company managers can assign drivers'
        });
      }

      // If company manager, verify order belongs to their company
      if (user.role === UserRole.COMPANY_MANAGER) {
        const order = await fastify.prisma.order.findFirst({
          where: {
            id: orderId,
            items: {
              some: {
                product: {
                  companyId: user.companyId
                }
              }
            }
          }
        });

        if (!order) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to assign driver to this order'
          });
        }
      }

      const assignment = await deliveryService.assignDriver(orderId, driverId);

      return reply.send({
        success: true,
        assignment,
        message: 'Driver assigned successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Record cash collection (Vendor/Driver)
  fastify.post('/orders/:orderId/cash-collection', {
    preHandler: [authenticate],
    schema: {
      tags: ['delivery'],
      summary: 'Record cash collection for COD order',
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string' }
        },
        required: ['orderId']
      },
      body: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0 },
          notes: { type: 'string' }
        },
        required: ['amount']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderId } = request.params;
      const { amount, notes } = request.body;
      const user = request.user;

      // Verify user has permission to record cash for this order
      if (user.role === UserRole.VENDOR || user.role === UserRole.COMPANY_MANAGER) {
        const order = await fastify.prisma.order.findFirst({
          where: {
            id: orderId,
            items: {
              some: {
                product: {
                  companyId: user.companyId
                }
              }
            }
          }
        });

        if (!order) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to record cash for this order'
          });
        }
      }

      const collection = await deliveryService.recordCashCollection({
        orderId,
        amount,
        collectedBy: user.id,
        notes
      });

      return reply.send({
        success: true,
        collection,
        message: 'Cash collection recorded successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get delivery metrics (Vendor/Company Manager)
  fastify.get('/metrics', {
    preHandler: [authenticate],
    schema: {
      tags: ['delivery'],
      summary: 'Get delivery metrics',
      query: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month']
          },
          companyId: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { period = 'today', companyId: queryCompanyId } = request.query;
      const user = request.user;

      let companyId = queryCompanyId || user.companyId;

      // Non-admin users can only view their company's metrics
      if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        if (queryCompanyId && queryCompanyId !== user.companyId) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You can only view metrics for your own company'
          });
        }
        companyId = user.companyId;
      }

      if (!companyId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Company ID is required'
        });
      }

      const metrics = await deliveryService.getDeliveryMetrics(companyId, period);

      return reply.send({
        success: true,
        metrics
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Track delivery (Public - with order ID and phone verification)
  fastify.get('/track/:orderId', {
    schema: {
      tags: ['delivery'],
      summary: 'Track delivery status',
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string' }
        },
        required: ['orderId']
      },
      query: {
        type: 'object',
        properties: {
          phone: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderId } = request.params;
      const { phone } = request.query;

      // If phone provided, verify it matches the order
      if (phone) {
        const order = await fastify.prisma.order.findFirst({
          where: {
            id: orderId,
            user: {
              phone: phone
            }
          }
        });

        if (!order) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Order not found or phone number does not match'
          });
        }
      }

      const trackingInfo = await deliveryService.trackDelivery(orderId);

      return reply.send({
        success: true,
        tracking: trackingInfo
      });
    } catch (error) {
      return reply.code(404).send(error);
    }
  });

  // Get active deliveries dashboard (Vendor/Company Manager)
  fastify.get('/active', {
    preHandler: [authenticate],
    schema: {
      tags: ['delivery'],
      summary: 'Get active deliveries dashboard'
    }
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      let companyId = user.companyId;

      // Admins can view all or specific company
      if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
        const { companyId: queryCompanyId } = request.query;
        if (queryCompanyId) {
          companyId = queryCompanyId;
        }
      }

      const activeStatuses = [
        OrderStatus.ACCEPTED,
        OrderStatus.PREPARING,
        OrderStatus.ON_THE_WAY
      ];

      const activeOrders = await fastify.prisma.order.findMany({
        where: {
          ...(companyId && {
            items: {
              some: {
                product: { companyId }
              }
            }
          }),
          status: {
            in: activeStatuses
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
              zone: true
            }
          },
          items: {
            ...(companyId && {
              where: {
                product: { companyId }
              }
            }),
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  company: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc' // Oldest first for processing
        }
      });

      // Group orders by status
      const groupedOrders = {
        accepted: activeOrders.filter(o => o.status === OrderStatus.ACCEPTED),
        preparing: activeOrders.filter(o => o.status === OrderStatus.PREPARING),
        onTheWay: activeOrders.filter(o => o.status === OrderStatus.ON_THE_WAY)
      };

      return reply.send({
        success: true,
        activeOrders: groupedOrders,
        summary: {
          total: activeOrders.length,
          accepted: groupedOrders.accepted.length,
          preparing: groupedOrders.preparing.length,
          onTheWay: groupedOrders.onTheWay.length
        }
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });
};

export default deliveryRoutes;