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
      description: 'Updates the delivery status of an order. Vendors and Company Managers can only update orders belonging to their company. Admins can update any order.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'The unique identifier of the order, e.g. clx1234567890' }
        },
        required: ['orderId']
      },
      body: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: Object.values(OrderStatus),
            description: 'The new order status, e.g. PREPARING, ON_THE_WAY, DELIVERED'
          },
          notes: { type: 'string', description: 'Optional notes about the status update, e.g. Customer requested delay' },
          estimatedTime: { type: 'string', format: 'date-time', description: 'Estimated delivery time in ISO 8601 format, e.g. 2024-01-15T14:30:00Z' },
          location: {
            type: 'object',
            description: 'Current location coordinates of the delivery',
            properties: {
              latitude: { type: 'number', description: 'Latitude coordinate, e.g. 40.7128' },
              longitude: { type: 'number', description: 'Longitude coordinate, e.g. -74.0060' }
            }
          }
        },
        required: ['status']
      },
      response: {
        200: {
          type: 'object',
          description: 'Order status updated successfully',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            order: {
              type: 'object',
              description: 'The updated order object',
              properties: {
                id: { type: 'string', description: 'Order ID' },
                status: { type: 'string', description: 'Updated order status' },
                updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp of the update' }
              }
            },
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: {
          type: 'object',
          description: 'Bad request - Invalid status or request body',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        401: {
          type: 'object',
          description: 'Unauthorized - Missing or invalid authentication token',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        403: {
          type: 'object',
          description: 'Forbidden - User does not have permission to update this order',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderId } = request.params;
      const user = request.user;

      // Check if user has permission to update this order
      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_ADMIN) {
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
      description: 'Updates the status of multiple orders at once. Vendors and Company Managers can only update orders belonging to their company. Useful for batch processing of orders in the same delivery workflow stage.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          orderIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of order IDs to update, e.g. ["clx123", "clx456", "clx789"]'
          },
          status: {
            type: 'string',
            enum: Object.values(OrderStatus),
            description: 'The new status to apply to all orders, e.g. PREPARING, ON_THE_WAY'
          }
        },
        required: ['orderIds', 'status']
      },
      response: {
        200: {
          type: 'object',
          description: 'Bulk status update completed',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            updated: { type: 'number', description: 'Number of orders successfully updated' },
            failed: { type: 'number', description: 'Number of orders that failed to update' },
            message: { type: 'string', description: 'Summary message of the bulk operation' }
          }
        },
        400: {
          type: 'object',
          description: 'Bad request - Invalid order IDs or status',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        401: {
          type: 'object',
          description: 'Unauthorized - Missing or invalid authentication token',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        403: {
          type: 'object',
          description: 'Forbidden - User does not have permission to update some orders',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderIds, status } = request.body;
      const user = request.user;

      // Validate permissions for each order if vendor/company manager
      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_ADMIN) {
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
      description: 'Retrieves all orders with a specific delivery status. Vendors and Company Managers see only their company orders. Admins can view all orders or filter by company using the companyId query parameter.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: Object.values(OrderStatus),
            description: 'The order status to filter by, e.g. PENDING, ACCEPTED, PREPARING, ON_THE_WAY, DELIVERED'
          }
        },
        required: ['status']
      },
      querystring: {
        type: 'object',
        properties: {
          companyId: { type: 'string', description: 'Company ID to filter orders (admin only), e.g. clx987654321' }
        }
      },
      response: {
        200: {
          type: 'object',
          description: 'Orders retrieved successfully',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            orders: {
              type: 'array',
              description: 'List of orders matching the status',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Order ID' },
                  status: { type: 'string', description: 'Order status' },
                  createdAt: { type: 'string', format: 'date-time', description: 'Order creation timestamp' },
                  user: {
                    type: 'object',
                    description: 'Customer information',
                    properties: {
                      id: { type: 'string', description: 'User ID' },
                      name: { type: 'string', description: 'Customer name' },
                      phone: { type: 'string', description: 'Customer phone number' },
                      address: { type: 'string', description: 'Delivery address' }
                    }
                  },
                  items: {
                    type: 'array',
                    description: 'Order items',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'Order item ID' },
                        quantity: { type: 'number', description: 'Item quantity' },
                        product: {
                          type: 'object',
                          description: 'Product details',
                          properties: {
                            id: { type: 'string', description: 'Product ID' },
                            name: { type: 'string', description: 'Product name' },
                            company: {
                              type: 'object',
                              description: 'Company that owns the product',
                              properties: {
                                id: { type: 'string', description: 'Company ID' },
                                name: { type: 'string', description: 'Company name' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          description: 'Bad request - Company ID required for non-admin users without company',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        401: {
          type: 'object',
          description: 'Unauthorized - Missing or invalid authentication token',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        500: {
          type: 'object',
          description: 'Internal server error',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { status } = request.params;
      const user = request.user;

      let companyId = user.companyId;

      // Admins can view all orders
      if ([UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
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
      description: 'Assigns a delivery driver to a specific order. Only Admins, Super Admins, and Company Managers can assign drivers. Company Managers can only assign drivers to orders belonging to their company.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'The unique identifier of the order, e.g. clx1234567890' }
        },
        required: ['orderId']
      },
      body: {
        type: 'object',
        properties: {
          driverId: { type: 'string', description: 'The unique identifier of the driver to assign, e.g. usr9876543210' }
        },
        required: ['driverId']
      },
      response: {
        200: {
          type: 'object',
          description: 'Driver assigned successfully',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            assignment: {
              type: 'object',
              description: 'Driver assignment details',
              properties: {
                orderId: { type: 'string', description: 'Order ID' },
                driverId: { type: 'string', description: 'Assigned driver ID' },
                assignedAt: { type: 'string', format: 'date-time', description: 'Assignment timestamp' }
              }
            },
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: {
          type: 'object',
          description: 'Bad request - Invalid order ID or driver ID',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        401: {
          type: 'object',
          description: 'Unauthorized - Missing or invalid authentication token',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        403: {
          type: 'object',
          description: 'Forbidden - User does not have permission to assign drivers',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        404: {
          type: 'object',
          description: 'Not found - Order or driver not found',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderId } = request.params;
      const { driverId } = request.body;
      const user = request.user;

      // Check permissions
      if (![UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN].includes(user.role)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Only admins and company managers can assign drivers'
        });
      }

      // If company manager, verify order belongs to their company
      if (user.role === UserRole.COMPANY_ADMIN) {
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
      description: 'Records cash collection for Cash on Delivery (COD) orders. Vendors and Company Managers can only record collections for orders belonging to their company. The collected amount is stored with the collector information.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'The unique identifier of the order, e.g. clx1234567890' }
        },
        required: ['orderId']
      },
      body: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0, description: 'The cash amount collected in the base currency, e.g. 150.50' },
          notes: { type: 'string', description: 'Optional notes about the collection, e.g. Exact change received' }
        },
        required: ['amount']
      },
      response: {
        200: {
          type: 'object',
          description: 'Cash collection recorded successfully',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            collection: {
              type: 'object',
              description: 'Cash collection record details',
              properties: {
                id: { type: 'string', description: 'Collection record ID' },
                orderId: { type: 'string', description: 'Associated order ID' },
                amount: { type: 'number', description: 'Collected amount' },
                collectedBy: { type: 'string', description: 'ID of user who collected the cash' },
                collectedAt: { type: 'string', format: 'date-time', description: 'Collection timestamp' },
                notes: { type: 'string', description: 'Collection notes' }
              }
            },
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: {
          type: 'object',
          description: 'Bad request - Invalid amount or order already has collection recorded',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        401: {
          type: 'object',
          description: 'Unauthorized - Missing or invalid authentication token',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        403: {
          type: 'object',
          description: 'Forbidden - User does not have permission to record cash for this order',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        404: {
          type: 'object',
          description: 'Not found - Order not found',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { orderId } = request.params;
      const { amount, notes } = request.body;
      const user = request.user;

      // Verify user has permission to record cash for this order
      if (user.role === UserRole.COMPANY_ADMIN || user.role === UserRole.COMPANY_ADMIN) {
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
      description: 'Retrieves delivery performance metrics for a company. Includes statistics on completed deliveries, average delivery time, success rate, and more. Non-admin users can only view metrics for their own company.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month'],
            description: 'Time period for metrics aggregation, e.g. today, week, or month'
          },
          companyId: { type: 'string', description: 'Company ID to get metrics for (admin only), e.g. clx987654321' }
        }
      },
      response: {
        200: {
          type: 'object',
          description: 'Delivery metrics retrieved successfully',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            metrics: {
              type: 'object',
              description: 'Delivery performance metrics',
              properties: {
                totalOrders: { type: 'number', description: 'Total number of orders in the period' },
                completedOrders: { type: 'number', description: 'Number of successfully delivered orders' },
                pendingOrders: { type: 'number', description: 'Number of pending orders' },
                cancelledOrders: { type: 'number', description: 'Number of cancelled orders' },
                averageDeliveryTime: { type: 'number', description: 'Average delivery time in minutes' },
                successRate: { type: 'number', description: 'Delivery success rate as percentage, e.g. 95.5' },
                totalRevenue: { type: 'number', description: 'Total revenue from completed orders' },
                cashCollected: { type: 'number', description: 'Total cash collected from COD orders' },
                ordersByStatus: {
                  type: 'object',
                  description: 'Order count breakdown by status',
                  additionalProperties: { type: 'number' }
                },
                ordersByZone: {
                  type: 'object',
                  description: 'Order count breakdown by delivery zone',
                  additionalProperties: { type: 'number' }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          description: 'Bad request - Company ID required',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        401: {
          type: 'object',
          description: 'Unauthorized - Missing or invalid authentication token',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        403: {
          type: 'object',
          description: 'Forbidden - User can only view metrics for their own company',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        500: {
          type: 'object',
          description: 'Internal server error',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { period = 'today', companyId: queryCompanyId } = request.query;
      const user = request.user;

      let companyId = queryCompanyId || user.companyId;

      // Non-admin users can only view their company's metrics
      if (![UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
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
      description: 'Public endpoint to track delivery status of an order. Optionally verify with phone number for additional security. Returns current status, estimated delivery time, and tracking history.',
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'The unique identifier of the order to track, e.g. clx1234567890' }
        },
        required: ['orderId']
      },
      querystring: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Phone number for verification (must match order customer phone), e.g. +1234567890' }
        }
      },
      response: {
        200: {
          type: 'object',
          description: 'Tracking information retrieved successfully',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            tracking: {
              type: 'object',
              description: 'Delivery tracking information',
              properties: {
                orderId: { type: 'string', description: 'Order ID' },
                status: { type: 'string', description: 'Current order status' },
                estimatedDelivery: { type: 'string', format: 'date-time', description: 'Estimated delivery time' },
                currentLocation: {
                  type: 'object',
                  description: 'Current delivery location (if available)',
                  properties: {
                    latitude: { type: 'number', description: 'Latitude coordinate' },
                    longitude: { type: 'number', description: 'Longitude coordinate' },
                    updatedAt: { type: 'string', format: 'date-time', description: 'Location update timestamp' }
                  }
                },
                history: {
                  type: 'array',
                  description: 'Status history timeline',
                  items: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', description: 'Status at this point' },
                      timestamp: { type: 'string', format: 'date-time', description: 'When status changed' },
                      notes: { type: 'string', description: 'Optional notes for this status' }
                    }
                  }
                },
                driver: {
                  type: 'object',
                  description: 'Assigned driver information (if available)',
                  properties: {
                    name: { type: 'string', description: 'Driver name' },
                    phone: { type: 'string', description: 'Driver phone number' }
                  }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          description: 'Not found - Order not found or phone number does not match',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        500: {
          type: 'object',
          description: 'Internal server error',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
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
      summary: 'Get active deliveries dashboard',
      description: 'Retrieves all active deliveries grouped by status (accepted, preparing, on_the_way). Provides a real-time dashboard view for managing ongoing deliveries. Vendors and Company Managers see only their company orders.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          companyId: { type: 'string', description: 'Company ID to filter active deliveries (admin only), e.g. clx987654321' }
        }
      },
      response: {
        200: {
          type: 'object',
          description: 'Active deliveries retrieved successfully',
          properties: {
            success: { type: 'boolean', description: 'Indicates if the operation was successful' },
            activeOrders: {
              type: 'object',
              description: 'Orders grouped by status',
              properties: {
                accepted: {
                  type: 'array',
                  description: 'Orders that have been accepted',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: 'Order ID' },
                      status: { type: 'string', description: 'Order status' },
                      createdAt: { type: 'string', format: 'date-time', description: 'Order creation timestamp' },
                      user: {
                        type: 'object',
                        description: 'Customer information',
                        properties: {
                          id: { type: 'string', description: 'User ID' },
                          name: { type: 'string', description: 'Customer name' },
                          phone: { type: 'string', description: 'Customer phone' },
                          address: { type: 'string', description: 'Delivery address' },
                          zone: { type: 'string', description: 'Delivery zone' }
                        }
                      },
                      items: {
                        type: 'array',
                        description: 'Order items',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', description: 'Order item ID' },
                            quantity: { type: 'number', description: 'Item quantity' },
                            product: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', description: 'Product ID' },
                                name: { type: 'string', description: 'Product name' },
                                price: { type: 'number', description: 'Product price' },
                                company: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string', description: 'Company ID' },
                                    name: { type: 'string', description: 'Company name' }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                preparing: {
                  type: 'array',
                  description: 'Orders being prepared',
                  items: { type: 'object' }
                },
                onTheWay: {
                  type: 'array',
                  description: 'Orders out for delivery',
                  items: { type: 'object' }
                }
              }
            },
            summary: {
              type: 'object',
              description: 'Summary counts of active orders',
              properties: {
                total: { type: 'number', description: 'Total active orders' },
                accepted: { type: 'number', description: 'Count of accepted orders' },
                preparing: { type: 'number', description: 'Count of orders being prepared' },
                onTheWay: { type: 'number', description: 'Count of orders out for delivery' }
              }
            }
          }
        },
        401: {
          type: 'object',
          description: 'Unauthorized - Missing or invalid authentication token',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        },
        500: {
          type: 'object',
          description: 'Internal server error',
          properties: {
            error: { type: 'string', description: 'Error type' },
            message: { type: 'string', description: 'Error message' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const user = request.user;
      let companyId = user.companyId;

      // Admins can view all or specific company
      if ([UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
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