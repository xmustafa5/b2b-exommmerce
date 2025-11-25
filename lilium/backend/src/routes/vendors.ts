import { FastifyPluginAsync } from 'fastify';
import { VendorService } from '../services/vendor.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole, OrderStatus } from '@prisma/client';

// Reusable schema definitions
const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' }
  }
};

const successMessageSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' }
  }
};

const companySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    nameAr: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
    descriptionAr: { type: 'string', nullable: true },
    logo: { type: 'string', nullable: true },
    email: { type: 'string', nullable: true },
    phone: { type: 'string', nullable: true },
    address: { type: 'string', nullable: true },
    zones: { type: 'array', items: { type: 'string' } },
    commissionRate: { type: 'number', nullable: true },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const categorySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    nameAr: { type: 'string' },
    nameEn: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string', nullable: true },
    image: { type: 'string', nullable: true },
    parentId: { type: 'string', nullable: true },
    isActive: { type: 'boolean' },
    displayOrder: { type: 'integer' }
  }
};

const productSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    sku: { type: 'string' },
    nameAr: { type: 'string' },
    nameEn: { type: 'string' },
    descriptionAr: { type: 'string', nullable: true },
    descriptionEn: { type: 'string', nullable: true },
    price: { type: 'number' },
    compareAtPrice: { type: 'number', nullable: true },
    cost: { type: 'number', nullable: true },
    stock: { type: 'integer' },
    minOrderQty: { type: 'integer' },
    unit: { type: 'string' },
    images: { type: 'array', items: { type: 'string' } },
    categoryId: { type: 'string' },
    category: categorySchema,
    companyId: { type: 'string' },
    zones: { type: 'array', items: { type: 'string' } },
    isActive: { type: 'boolean' },
    isFeatured: { type: 'boolean' },
    sortOrder: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const orderUserSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string', nullable: true },
    businessName: { type: 'string', nullable: true }
  }
};

const addressSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    street: { type: 'string' },
    area: { type: 'string' },
    building: { type: 'string', nullable: true },
    floor: { type: 'string', nullable: true },
    apartment: { type: 'string', nullable: true },
    zone: { type: 'string' },
    landmark: { type: 'string', nullable: true },
    latitude: { type: 'number', nullable: true },
    longitude: { type: 'number', nullable: true },
    phone: { type: 'string' },
    isDefault: { type: 'boolean' }
  }
};

const orderItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    orderId: { type: 'string' },
    productId: { type: 'string' },
    product: productSchema,
    nameAr: { type: 'string' },
    nameEn: { type: 'string' },
    price: { type: 'number' },
    quantity: { type: 'integer' },
    discount: { type: 'number' },
    total: { type: 'number' }
  }
};

const statusHistorySchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    orderId: { type: 'string' },
    fromStatus: { type: 'string', nullable: true },
    toStatus: { type: 'string' },
    comment: { type: 'string', nullable: true },
    changedBy: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    orderNumber: { type: 'string' },
    userId: { type: 'string' },
    user: orderUserSchema,
    addressId: { type: 'string' },
    address: addressSchema,
    companyId: { type: 'string' },
    status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED', 'FAILED'] },
    subtotal: { type: 'number' },
    discount: { type: 'number' },
    deliveryFee: { type: 'number' },
    total: { type: 'number' },
    notes: { type: 'string', nullable: true },
    promotionId: { type: 'string', nullable: true },
    zone: { type: 'string' },
    paymentMethod: { type: 'string', nullable: true },
    paymentStatus: { type: 'string', nullable: true },
    deliveryDate: { type: 'string', format: 'date-time', nullable: true },
    deliveredAt: { type: 'string', format: 'date-time', nullable: true },
    cancelledAt: { type: 'string', format: 'date-time', nullable: true },
    cancelReason: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    items: { type: 'array', items: orderItemSchema },
    vendorItems: { type: 'array', items: orderItemSchema },
    vendorSubtotal: { type: 'number' },
    vendorDiscount: { type: 'number' },
    vendorTotal: { type: 'number' },
    statusHistory: { type: 'array', items: statusHistorySchema }
  }
};

const customerSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string', nullable: true },
    businessName: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    totalOrders: { type: 'integer' },
    totalSpent: { type: 'number' },
    lastOrderDate: { type: 'string', format: 'date-time', nullable: true }
  }
};

const vendorStatsSchema = {
  type: 'object',
  properties: {
    totalProducts: { type: 'integer' },
    activeProducts: { type: 'integer' },
    totalOrders: { type: 'integer' },
    pendingOrders: { type: 'integer' },
    processingOrders: { type: 'integer' },
    completedOrders: { type: 'integer' },
    totalRevenue: { type: 'number' },
    todayOrders: { type: 'integer' },
    todayRevenue: { type: 'number' },
    lowStockProducts: { type: 'array', items: productSchema }
  }
};

const paginationSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
  }
};

const vendorRoutes: FastifyPluginAsync = async (fastify) => {
  const vendorService = new VendorService(fastify);

  // Middleware to check if user is a vendor or company manager
  const requireVendorAccess = [
    authenticate,
    requireRole(UserRole.COMPANY_ADMIN, UserRole.COMPANY_USER, UserRole.LOCATION_ADMIN, UserRole.SUPER_ADMIN)
  ];

  // Get vendor's company details
  fastify.get('/company', {
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Get vendor company details',
      description: 'Retrieves the company details associated with the authenticated vendor user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Company details retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            company: companySchema
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Company not found',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Update vendor company details',
      description: 'Updates the company details for the authenticated vendor. Vendors can only update their own company.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Company ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Company name in English' },
          nameAr: { type: 'string', description: 'Company name in Arabic' },
          description: { type: 'string', description: 'Company description in English' },
          descriptionAr: { type: 'string', description: 'Company description in Arabic' },
          logo: { type: 'string', description: 'URL to company logo' },
          email: { type: 'string', format: 'email', description: 'Company email address' },
          phone: { type: 'string', description: 'Company phone number' },
          address: { type: 'string', description: 'Company physical address' },
          zones: { type: 'array', items: { type: 'string', enum: ['KARKH', 'RUSAFA'] }, description: 'Operating zones' },
          commissionRate: { type: 'number', minimum: 0, maximum: 100, description: 'Commission rate percentage' }
        }
      },
      response: {
        200: {
          description: 'Company updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            company: companySchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - Invalid input data',
          ...errorSchema
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Cannot update another company',
          ...errorSchema
        },
        404: {
          description: 'Company not found',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Get vendor dashboard statistics',
      description: 'Retrieves dashboard statistics for the vendor including product counts, order stats, and revenue metrics',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Statistics retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            stats: vendorStatsSchema
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Company not found',
          ...errorSchema
        },
        500: {
          description: 'Internal server error',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Get vendor products',
      description: 'Retrieves a paginated list of products belonging to the vendor\'s company with optional filters',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          categoryId: { type: 'string', description: 'Filter by category ID' },
          isActive: { type: 'boolean', description: 'Filter by active status' },
          search: { type: 'string', description: 'Search by product name or SKU' },
          minStock: { type: 'integer', minimum: 0, description: 'Filter by minimum stock level' },
          maxStock: { type: 'integer', minimum: 0, description: 'Filter by maximum stock level' },
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number for pagination' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Number of items per page' }
        }
      },
      response: {
        200: {
          description: 'Products retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            products: { type: 'array', items: productSchema },
            total: { type: 'integer', description: 'Total number of products matching the filter' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Company not found',
          ...errorSchema
        },
        500: {
          description: 'Internal server error',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Create a new product',
      description: 'Creates a new product for the vendor\'s company',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['sku', 'nameAr', 'nameEn', 'price', 'categoryId'],
        properties: {
          sku: { type: 'string', description: 'Unique product SKU' },
          nameAr: { type: 'string', description: 'Product name in Arabic' },
          nameEn: { type: 'string', description: 'Product name in English' },
          descriptionAr: { type: 'string', description: 'Product description in Arabic' },
          descriptionEn: { type: 'string', description: 'Product description in English' },
          price: { type: 'number', minimum: 0, description: 'Product price' },
          compareAtPrice: { type: 'number', minimum: 0, description: 'Original price before discount' },
          cost: { type: 'number', minimum: 0, description: 'Cost price for profit calculation' },
          stock: { type: 'integer', minimum: 0, default: 0, description: 'Current stock quantity' },
          minOrderQty: { type: 'integer', minimum: 1, default: 1, description: 'Minimum order quantity' },
          unit: { type: 'string', default: 'piece', description: 'Unit of measurement (piece, box, carton, etc.)' },
          images: { type: 'array', items: { type: 'string' }, description: 'Array of image URLs' },
          categoryId: { type: 'string', description: 'Category ID for the product' },
          zones: { type: 'array', items: { type: 'string', enum: ['KARKH', 'RUSAFA'] }, description: 'Available zones for this product' },
          isActive: { type: 'boolean', default: true, description: 'Whether the product is active' },
          isFeatured: { type: 'boolean', default: false, description: 'Whether the product is featured' },
          sortOrder: { type: 'integer', default: 0, description: 'Display order for sorting' }
        }
      },
      response: {
        201: {
          description: 'Product created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            product: productSchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - Invalid input data or duplicate SKU',
          ...errorSchema
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Company not found',
          ...errorSchema
        },
        409: {
          description: 'Conflict - SKU already exists',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Update a product',
      description: 'Updates an existing product belonging to the vendor\'s company',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Product ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          sku: { type: 'string', description: 'Unique product SKU' },
          nameAr: { type: 'string', description: 'Product name in Arabic' },
          nameEn: { type: 'string', description: 'Product name in English' },
          descriptionAr: { type: 'string', description: 'Product description in Arabic' },
          descriptionEn: { type: 'string', description: 'Product description in English' },
          price: { type: 'number', minimum: 0, description: 'Product price' },
          compareAtPrice: { type: 'number', minimum: 0, description: 'Original price before discount' },
          cost: { type: 'number', minimum: 0, description: 'Cost price for profit calculation' },
          stock: { type: 'integer', minimum: 0, description: 'Current stock quantity' },
          minOrderQty: { type: 'integer', minimum: 1, description: 'Minimum order quantity' },
          unit: { type: 'string', description: 'Unit of measurement (piece, box, carton, etc.)' },
          images: { type: 'array', items: { type: 'string' }, description: 'Array of image URLs' },
          categoryId: { type: 'string', description: 'Category ID for the product' },
          zones: { type: 'array', items: { type: 'string', enum: ['KARKH', 'RUSAFA'] }, description: 'Available zones for this product' },
          isActive: { type: 'boolean', description: 'Whether the product is active' },
          isFeatured: { type: 'boolean', description: 'Whether the product is featured' },
          sortOrder: { type: 'integer', description: 'Display order for sorting' }
        }
      },
      response: {
        200: {
          description: 'Product updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            product: productSchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - Invalid input data or duplicate SKU',
          ...errorSchema
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Product not found or does not belong to vendor',
          ...errorSchema
        },
        409: {
          description: 'Conflict - SKU already exists',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Delete a product',
      description: 'Soft deletes a product by setting isActive to false. The product will no longer appear in listings.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Product ID' }
        }
      },
      response: {
        200: {
          description: 'Product deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Product not found or does not belong to vendor',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Update product stock',
      description: 'Updates the stock quantity for a product. Supports add, subtract, and set operations. Creates a stock history record.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Product ID' }
        }
      },
      body: {
        type: 'object',
        required: ['quantity', 'operation'],
        properties: {
          quantity: { type: 'integer', minimum: 0, description: 'Quantity to add, subtract, or set' },
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'set'],
            description: 'Operation type: add (increase stock), subtract (decrease stock), set (replace stock value)'
          }
        }
      },
      response: {
        200: {
          description: 'Stock updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            product: productSchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - Invalid input data',
          ...errorSchema
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Product not found or does not belong to vendor',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Get vendor orders',
      description: 'Retrieves a paginated list of orders containing products from the vendor\'s company',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED', 'FAILED'],
            description: 'Filter by order status'
          },
          fromDate: { type: 'string', format: 'date-time', description: 'Filter orders from this date' },
          toDate: { type: 'string', format: 'date-time', description: 'Filter orders up to this date' },
          search: { type: 'string', description: 'Search by order number, customer name, or email' },
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number for pagination' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Number of items per page' }
        }
      },
      response: {
        200: {
          description: 'Orders retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            orders: { type: 'array', items: orderSchema },
            total: { type: 'integer', description: 'Total number of orders matching the filter' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Company not found',
          ...errorSchema
        },
        500: {
          description: 'Internal server error',
          ...errorSchema
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      // SUPER_ADMIN and LOCATION_ADMIN can see all orders without company restriction
      if (request.user.role === UserRole.SUPER_ADMIN || request.user.role === UserRole.LOCATION_ADMIN) {
        // Get all orders if admin doesn't have a company
        const user = await fastify.prisma.user.findUnique({
          where: { id: request.user.userId },
          select: { companyId: true }
        });

        if (!user?.companyId) {
          // Admin without company - return all orders
          const result = await vendorService.getAllOrders(request.query);
          return reply.send({
            success: true,
            ...result
          });
        }
      }

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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Update order status',
      description: 'Updates the status of an order containing vendor products. Status transitions must follow valid workflow paths.',
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
            enum: ['PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED', 'FAILED'],
            description: 'New order status. Valid transitions: PENDING -> ACCEPTED/REJECTED, ACCEPTED -> PROCESSING/CANCELLED, PROCESSING -> READY/CANCELLED, READY -> OUT_FOR_DELIVERY, OUT_FOR_DELIVERY -> DELIVERED/FAILED, FAILED -> PROCESSING'
          },
          comment: { type: 'string', description: 'Optional comment for the status change' }
        }
      },
      response: {
        200: {
          description: 'Order status updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            order: orderSchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request - Invalid status transition',
          ...errorSchema
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Order not found or does not contain vendor products',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Get vendor customers',
      description: 'Retrieves a paginated list of customers who have ordered products from the vendor\'s company, including order statistics',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number for pagination' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Number of items per page' }
        }
      },
      response: {
        200: {
          description: 'Customers retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            customers: { type: 'array', items: customerSchema },
            total: { type: 'integer', description: 'Total number of customers' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Company not found',
          ...errorSchema
        },
        500: {
          description: 'Internal server error',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Export vendor data',
      description: 'Exports vendor data (products, orders, or customers) in JSON or CSV format for download',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['products', 'orders', 'customers'],
            description: 'Type of data to export'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['json', 'csv'],
            default: 'json',
            description: 'Export format'
          }
        }
      },
      response: {
        200: {
          description: 'Data exported successfully. Content-Type header will indicate format (application/json or text/csv)',
          type: 'string'
        },
        400: {
          description: 'Bad request - Invalid data type',
          ...errorSchema
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Company not found',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Get product by ID',
      description: 'Retrieves a single product by ID. The product must belong to the vendor\'s company.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Product ID' }
        }
      },
      response: {
        200: {
          description: 'Product retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            product: productSchema
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Product not found or does not belong to vendor',
          ...errorSchema
        },
        500: {
          description: 'Internal server error',
          ...errorSchema
        }
      }
    }
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
    preHandler: requireVendorAccess,
    schema: {
      tags: ['vendors'],
      summary: 'Get order by ID',
      description: 'Retrieves a single order by ID. The order must contain at least one product from the vendor\'s company. Returns vendor-specific totals.',
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
          description: 'Order retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            order: {
              type: 'object',
              properties: {
                ...orderSchema.properties,
                vendorSubtotal: { type: 'number', description: 'Subtotal for vendor items only' },
                vendorDiscount: { type: 'number', description: 'Total discount for vendor items' },
                vendorTotal: { type: 'number', description: 'Total for vendor items after discount' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          ...errorSchema
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          ...errorSchema
        },
        404: {
          description: 'Order not found or does not contain vendor products',
          ...errorSchema
        },
        500: {
          description: 'Internal server error',
          ...errorSchema
        }
      }
    }
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