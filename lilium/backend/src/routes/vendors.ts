import { FastifyPluginAsync } from 'fastify';
import { VendorService } from '../services/vendor.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole, OrderStatus } from '@prisma/client';

const vendorRoutes: FastifyPluginAsync = async (fastify) => {
  const vendorService = new VendorService(fastify);

  // Middleware to check if user is a vendor or company manager
  const requireVendorAccess = [
    authenticate,
    requireRole([UserRole.VENDOR, UserRole.COMPANY_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN])
  ];

  // Get vendor's company details
  fastify.get('/company', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      return reply.send({
        success: true,
        company
      });
    } catch (error) {
      return reply.code(404).send(error);
    }
  });

  // Update vendor's company details
  fastify.put('/company/:id', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      // Verify user's company matches the ID
      const userCompany = await vendorService.getVendorCompany(request.user.userId);
      if (userCompany?.id !== request.params.id) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only update your own company'
        });
      }

      const company = await vendorService.updateCompany(request.params.id, request.body);
      return reply.send({
        success: true,
        company,
        message: 'Company updated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get vendor dashboard statistics
  fastify.get('/stats', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const stats = await vendorService.getVendorStats(company.id);
      return reply.send({
        success: true,
        stats
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get vendor's products
  fastify.get('/products', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const result = await vendorService.getVendorProducts(company.id, request.query);
      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Create product for vendor
  fastify.post('/products', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const product = await vendorService.createProduct(company.id, request.body);
      return reply.code(201).send({
        success: true,
        product,
        message: 'Product created successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update vendor's product
  fastify.put('/products/:id', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const product = await vendorService.updateProduct(
        request.params.id,
        company.id,
        request.body
      );
      return reply.send({
        success: true,
        product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Delete vendor's product
  fastify.delete('/products/:id', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      await vendorService.deleteProduct(request.params.id, company.id);
      return reply.send({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      return reply.code(404).send(error);
    }
  });

  // Update product stock
  fastify.patch('/products/:id/stock', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const { quantity, operation } = request.body;
      const product = await vendorService.updateProductStock(
        request.params.id,
        company.id,
        quantity,
        operation
      );
      return reply.send({
        success: true,
        product,
        message: `Stock ${operation} successfully`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get vendor's orders
  fastify.get('/orders', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const result = await vendorService.getVendorOrders(company.id, request.query);
      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Update order status
  fastify.patch('/orders/:id/status', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const { status, comment } = request.body;
      const order = await vendorService.updateOrderStatus(
        request.params.id,
        company.id,
        status as OrderStatus,
        comment
      );
      return reply.send({
        success: true,
        order,
        message: `Order status updated to ${status}`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get vendor's customers
  fastify.get('/customers', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const { page = 1, limit = 20 } = request.query;
      const result = await vendorService.getVendorCustomers(company.id, page, limit);
      return reply.send({
        success: true,
        ...result
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Export vendor data
  fastify.get('/export/:type', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const { format = 'json' } = request.query;
      const data = await vendorService.exportVendorData(
        company.id,
        request.params.type as any,
        format as any
      );

      // Set appropriate headers for download
      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="${request.params.type}.csv"`);
      } else {
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${request.params.type}.json"`);
      }

      return reply.send(data);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Get product by ID (for vendor)
  fastify.get('/products/:id', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      const product = await fastify.prisma.product.findFirst({
        where: {
          id: request.params.id,
          companyId: company.id
        },
        include: {
          category: true,
        }
      });

      if (!product) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Product not found or does not belong to your company'
        });
      }

      return reply.send({
        success: true,
        product
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get order by ID (for vendor)
  fastify.get('/orders/:id', {
    preHandler: requireVendorAccess
  }, async (request: any, reply) => {
    try {
      const company = await vendorService.getVendorCompany(request.user.userId);
      if (!company) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Company not found'
        });
      }

      // Get vendor's product IDs
      const vendorProducts = await fastify.prisma.product.findMany({
        where: { companyId: company.id },
        select: { id: true },
      });

      const productIds = vendorProducts.map(p => p.id);

      const order = await fastify.prisma.order.findFirst({
        where: {
          id: request.params.id,
          items: {
            some: {
              productId: { in: productIds },
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              businessName: true,
            },
          },
          items: {
            where: {
              productId: { in: productIds },
            },
            include: {
              product: true,
            },
          },
          address: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!order) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Order not found or does not contain your products'
        });
      }

      // Calculate vendor-specific totals
      const vendorSubtotal = order.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
      const vendorDiscount = order.items.reduce(
        (sum, item) => sum + (item.discount || 0),
        0
      );
      const vendorTotal = vendorSubtotal - vendorDiscount;

      return reply.send({
        success: true,
        order: {
          ...order,
          vendorSubtotal,
          vendorDiscount,
          vendorTotal,
        }
      });
    } catch (error) {
      return reply.code(500).send(error);
    }
  });
};

export default vendorRoutes;