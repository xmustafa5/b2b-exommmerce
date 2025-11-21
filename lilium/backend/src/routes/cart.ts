import { FastifyPluginAsync } from 'fastify';
import { CartService } from '../services/cart.service';
import { authenticate } from '../middleware/auth';

// Reusable schema definitions
const cartItemSchema = {
  type: 'object',
  required: ['productId', 'quantity'],
  properties: {
    productId: { type: 'string', format: 'uuid', description: 'Unique identifier of the product' },
    quantity: { type: 'integer', minimum: 1, description: 'Quantity of the product' },
    price: { type: 'number', minimum: 0, nullable: true, description: 'Custom price (optional, uses product price if not provided)' },
    discount: { type: 'number', minimum: 0, nullable: true, description: 'Discount per unit (optional)' }
  }
};

const cartItemsArraySchema = {
  type: 'array',
  items: cartItemSchema,
  minItems: 1,
  description: 'Array of cart items'
};

const vendorGroupItemSchema = {
  type: 'object',
  properties: {
    productId: { type: 'string' },
    quantity: { type: 'integer' },
    price: { type: 'number' },
    discount: { type: 'number', nullable: true },
    product: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        sku: { type: 'string' },
        nameAr: { type: 'string' },
        nameEn: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'integer' },
        minOrderQty: { type: 'integer' },
        unit: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } },
        categoryId: { type: 'string', nullable: true },
        companyId: { type: 'string', nullable: true },
        isActive: { type: 'boolean' }
      }
    },
    subtotal: { type: 'number', description: 'Item subtotal (price * quantity)' },
    discountAmount: { type: 'number', description: 'Total discount for this item' },
    total: { type: 'number', description: 'Final total after discount' }
  }
};

const vendorGroupSchema = {
  type: 'object',
  properties: {
    companyId: { type: 'string', description: 'Vendor/Company ID' },
    companyName: { type: 'string', description: 'Vendor/Company name' },
    items: {
      type: 'array',
      items: vendorGroupItemSchema,
      description: 'Items from this vendor'
    },
    subtotal: { type: 'number', description: 'Subtotal for all items from this vendor' },
    discount: { type: 'number', description: 'Total discount for this vendor group' },
    deliveryFee: { type: 'number', description: 'Delivery fee for this vendor' },
    total: { type: 'number', description: 'Total including delivery fee minus discounts' }
  }
};

const cartSummarySchema = {
  type: 'object',
  properties: {
    vendorGroups: {
      type: 'array',
      items: vendorGroupSchema,
      description: 'Cart items grouped by vendor'
    },
    totalItems: { type: 'integer', description: 'Total number of distinct items' },
    subtotal: { type: 'number', description: 'Subtotal of all items before discounts' },
    totalDiscount: { type: 'number', description: 'Total discount applied' },
    totalDeliveryFee: { type: 'number', description: 'Total delivery fees from all vendors' },
    grandTotal: { type: 'number', description: 'Final total to pay' }
  }
};

const deliveryEstimateSchema = {
  type: 'object',
  properties: {
    minDays: { type: 'integer', description: 'Minimum delivery days' },
    maxDays: { type: 'integer', description: 'Maximum delivery days' },
    estimatedDate: { type: 'string', format: 'date-time', description: 'Estimated delivery date' }
  }
};

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'Error type' },
    message: { type: 'string', description: 'Human-readable error message' }
  }
};

const validationErrorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'Error type' },
    message: { type: 'string', description: 'Human-readable error message' },
    errors: { type: 'array', items: { type: 'string' }, description: 'List of validation errors' }
  }
};

const orderItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    orderId: { type: 'string' },
    productId: { type: 'string' },
    quantity: { type: 'integer' },
    price: { type: 'number' },
    discount: { type: 'number', nullable: true },
    total: { type: 'number' },
    product: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nameEn: { type: 'string' },
        nameAr: { type: 'string' },
        sku: { type: 'string' },
        images: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    orderNumber: { type: 'string' },
    userId: { type: 'string' },
    addressId: { type: 'string' },
    status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] },
    subtotal: { type: 'number' },
    discount: { type: 'number' },
    deliveryFee: { type: 'number' },
    total: { type: 'number' },
    paymentMethod: { type: 'string', nullable: true },
    paymentStatus: { type: 'string', nullable: true },
    notes: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    items: { type: 'array', items: orderItemSchema },
    address: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        label: { type: 'string' },
        street: { type: 'string' },
        city: { type: 'string' },
        zone: { type: 'string' }
      }
    },
    statusHistory: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fromStatus: { type: 'string' },
          toStatus: { type: 'string' },
          comment: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

const cartRoutes: FastifyPluginAsync = async (fastify) => {
  const cartService = new CartService(fastify);

  // Validate cart items and get summary
  fastify.post('/validate', {
    schema: {
      tags: ['cart'],
      summary: 'Validate cart items',
      description: 'Validates cart items by checking product availability, stock levels, and minimum order quantities. Returns a cart summary with vendor grouping. This endpoint does not require authentication and can be used by guests.',
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: cartItemsArraySchema,
          userId: { type: 'string', format: 'uuid', nullable: true, description: 'Optional user ID for personalized pricing and delivery fees' }
        }
      },
      response: {
        200: {
          description: 'Cart validated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Indicates successful validation' },
            summary: cartSummarySchema,
            message: { type: 'string', description: 'Success message' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input or validation errors',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
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
    preHandler: [authenticate],
    schema: {
      tags: ['cart'],
      summary: 'Get authenticated cart summary',
      description: 'Generates a detailed cart summary for authenticated users including personalized delivery fees based on user zone, delivery time estimates, and vendor grouping. Requires authentication to access user-specific pricing and delivery options.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: cartItemsArraySchema
        }
      },
      response: {
        200: {
          description: 'Cart summary generated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            summary: cartSummarySchema,
            deliveryEstimate: deliveryEstimateSchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input or validation errors',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - Authentication required',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate],
    schema: {
      tags: ['cart'],
      summary: 'Checkout and create orders',
      description: 'Processes the cart checkout, validates all items, applies promotions, and creates one order per vendor. Stock is decremented atomically, and order history is created. Returns all created orders with their details.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['addressId', 'items'],
        properties: {
          addressId: { type: 'string', format: 'uuid', description: 'ID of the delivery address' },
          items: cartItemsArraySchema,
          paymentMethod: {
            type: 'string',
            enum: ['CASH_ON_DELIVERY', 'CREDIT_CARD', 'BANK_TRANSFER', 'WALLET'],
            default: 'CASH_ON_DELIVERY',
            description: 'Payment method for the order'
          },
          notes: { type: 'string', nullable: true, description: 'Additional notes for the order' }
        }
      },
      response: {
        201: {
          description: 'Orders created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            orders: {
              type: 'array',
              items: orderSchema,
              description: 'Array of created orders (one per vendor)'
            },
            orderCount: { type: 'integer', description: 'Number of orders created' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input, insufficient stock, or validation errors',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - Authentication required',
          ...errorResponseSchema
        },
        404: {
          description: 'Not Found - User or address not found',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate],
    schema: {
      tags: ['cart'],
      summary: 'Save cart for later',
      description: 'Persists the current cart items for the authenticated user. Cart data is saved and can be retrieved later using the GET /saved endpoint. Useful for users who want to continue shopping later.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: cartItemSchema,
            description: 'Array of cart items to save (can be empty to clear)'
          }
        }
      },
      response: {
        200: {
          description: 'Cart saved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - Authentication required',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate],
    schema: {
      tags: ['cart'],
      summary: 'Get saved cart',
      description: 'Retrieves the previously saved cart items for the authenticated user. Returns an empty array if no cart has been saved.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Saved cart retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            items: {
              type: 'array',
              items: cartItemSchema,
              description: 'Array of saved cart items'
            },
            itemCount: { type: 'integer', description: 'Number of items in saved cart' }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
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
    preHandler: [authenticate],
    schema: {
      tags: ['cart'],
      summary: 'Clear saved cart',
      description: 'Removes all items from the authenticated user\'s saved cart. This action is irreversible.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Cart cleared successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
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
    preHandler: [authenticate],
    schema: {
      tags: ['cart'],
      summary: 'Merge guest cart with user cart',
      description: 'Merges a guest cart (from localStorage or session) with the authenticated user\'s saved cart. Duplicate products have their quantities combined. Useful when a guest user logs in and wants to preserve their cart.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['guestItems'],
        properties: {
          guestItems: {
            type: 'array',
            items: cartItemSchema,
            description: 'Cart items from guest session to merge'
          }
        }
      },
      response: {
        200: {
          description: 'Cart merged successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            items: {
              type: 'array',
              items: cartItemSchema,
              description: 'Merged cart items'
            },
            itemCount: { type: 'integer', description: 'Number of items after merge' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - Authentication required',
          ...errorResponseSchema
        }
      }
    }
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
    preHandler: [authenticate],
    schema: {
      tags: ['cart'],
      summary: 'Apply promotions to cart',
      description: 'Validates cart items and applies all eligible promotions based on the user\'s zone, product categories, and current active promotions. Returns items with applied discounts and an updated cart summary.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: cartItemsArraySchema
        }
      },
      response: {
        200: {
          description: 'Promotions applied successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' },
                  discount: { type: 'number', description: 'Discount per unit after promotion' },
                  product: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      nameEn: { type: 'string' },
                      nameAr: { type: 'string' },
                      price: { type: 'number' }
                    }
                  },
                  appliedPromotion: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'string' },
                      code: { type: 'string' },
                      name: { type: 'string' },
                      discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] },
                      discountValue: { type: 'number' }
                    },
                    description: 'Applied promotion details (null if no promotion applied)'
                  }
                }
              },
              description: 'Cart items with applied promotions'
            },
            summary: cartSummarySchema,
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad Request - Validation errors',
          ...validationErrorResponseSchema
        },
        401: {
          description: 'Unauthorized - Authentication required',
          ...errorResponseSchema
        }
      }
    }
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
  fastify.post('/check-availability', {
    schema: {
      tags: ['cart'],
      summary: 'Check product availability',
      description: 'Checks the availability of products in the cart including stock levels, minimum order quantities, and product active status. This endpoint does not require authentication and can be used by guests.',
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: cartItemsArraySchema
        }
      },
      response: {
        200: {
          description: 'Availability check completed',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            valid: { type: 'boolean', description: 'Whether all items are available' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of availability issues'
            },
            availability: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string', description: 'Product ID' },
                  productName: { type: 'string', description: 'Product name (English)' },
                  requestedQuantity: { type: 'integer', description: 'Quantity requested in cart' },
                  availableStock: { type: 'integer', description: 'Current stock available' },
                  isAvailable: { type: 'boolean', description: 'Whether requested quantity is available' },
                  minOrderQty: { type: 'integer', description: 'Minimum order quantity for this product' },
                  isActive: { type: 'boolean', description: 'Whether product is active and available for purchase' }
                }
              },
              description: 'Detailed availability status for each item'
            }
          }
        },
        400: {
          description: 'Bad Request - Invalid input',
          ...errorResponseSchema
        }
      }
    }
  }, async (request: any, reply) => {
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
    preHandler: [authenticate],
    schema: {
      tags: ['cart'],
      summary: 'Calculate delivery fees',
      description: 'Calculates delivery fees for the cart based on the user\'s selected delivery address zone and vendor locations. Fees vary based on whether vendors deliver to the same zone or different zones.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: cartItemsArraySchema,
          addressId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'Optional delivery address ID. If not provided, uses user\'s default zone.'
          }
        }
      },
      response: {
        200: {
          description: 'Delivery fees calculated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            userZone: {
              type: 'string',
              enum: ['KARKH', 'RUSAFA'],
              nullable: true,
              description: 'User\'s delivery zone'
            },
            deliveryDetails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  companyId: { type: 'string', description: 'Vendor/Company ID' },
                  companyName: { type: 'string', description: 'Vendor/Company name' },
                  deliveryFee: { type: 'number', description: 'Delivery fee for this vendor (in IQD)' },
                  itemCount: { type: 'integer', description: 'Number of items from this vendor' }
                }
              },
              description: 'Delivery fee breakdown by vendor'
            },
            totalDeliveryFee: { type: 'number', description: 'Total delivery fee for all vendors (in IQD)' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Bad Request - Invalid input',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized - Authentication required',
          ...errorResponseSchema
        }
      }
    }
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
