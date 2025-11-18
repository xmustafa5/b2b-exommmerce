import { FastifyPluginAsync } from 'fastify';
import { ProductService } from '../services/product.service';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole, Zone } from '@prisma/client';

const productRoutes: FastifyPluginAsync = async (fastify) => {
  const productService = new ProductService(fastify);

  // Get all products (Public - filtered by user's zone)
  fastify.get('/', async (request: any, reply) => {
    try {
      const {
        page = 1,
        limit = 20,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        zones
      } = request.query;

      // Parse zones if provided as string
      const parsedZones = zones ? (Array.isArray(zones) ? zones : zones.split(',')) : undefined;

      const result = await productService.getProducts(
        parseInt(page),
        parseInt(limit),
        {
          categoryId,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          zones: parsedZones,
          inStock: inStock === 'true',
          search,
        },
        sortBy,
        sortOrder
      );

      return reply.send(result);
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get featured products
  fastify.get('/featured', async (request: any, reply) => {
    try {
      const { zones } = request.query;
      const parsedZones = zones ? (Array.isArray(zones) ? zones : zones.split(',')) : undefined;

      const products = await productService.getFeaturedProducts(parsedZones);
      return reply.send(products);
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get products by category
  fastify.get('/category/:categoryId', async (request: any, reply) => {
    try {
      const { categoryId } = request.params;
      const { zones } = request.query;
      const parsedZones = zones ? (Array.isArray(zones) ? zones : zones.split(',')) : undefined;

      const products = await productService.getProductsByCategory(categoryId, parsedZones);
      return reply.send(products);
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get single product
  fastify.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const product = await productService.getProductById(id);
      return reply.send(product);
    } catch (error) {
      return reply.code(404).send(error);
    }
  });

  // Create product (Admin only)
  fastify.post('/', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const product = await productService.createProduct(request.body);
      return reply.code(201).send(product);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update product (Admin only)
  fastify.put('/:id', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const product = await productService.updateProduct(id, request.body);
      return reply.send(product);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update stock
  fastify.patch('/:id/stock', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { quantity, operation } = request.body;

      const product = await productService.updateStock(id, quantity, operation);
      return reply.send(product);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Delete product (Admin only)
  fastify.delete('/:id', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const result = await productService.deleteProduct(id);
      return reply.send(result);
    } catch (error) {
      return reply.code(404).send(error);
    }
  });

  // Bulk update products (Admin only)
  fastify.patch('/bulk', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { ids, data } = request.body;

      const updates = ids.map((id: string) =>
        productService.updateProduct(id, data)
      );

      const products = await Promise.all(updates);
      return reply.send({
        message: `${products.length} products updated successfully`,
        products
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Bulk delete products (Admin only)
  fastify.delete('/bulk', {
    preHandler: [authenticate, authorize([UserRole.SUPER_ADMIN])]
  }, async (request: any, reply) => {
    try {
      const { ids } = request.body;

      const deletes = ids.map((id: string) =>
        productService.deleteProduct(id)
      );

      await Promise.all(deletes);
      return reply.send({
        message: `${ids.length} products deleted successfully`
      });
    } catch (error) {
      return reply.code(400).send(error);
    }
  });
};

export default productRoutes;