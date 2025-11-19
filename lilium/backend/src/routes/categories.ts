import { FastifyPluginAsync } from 'fastify';
import { CategoryService } from '../services/category.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const categoryRoutes: FastifyPluginAsync = async (fastify) => {
  const categoryService = new CategoryService(fastify);

  // Get all categories (Public)
  fastify.get('/', async (request: any, reply) => {
    try {
      const { includeInactive = false } = request.query;
      const categories = await categoryService.getCategories(includeInactive === 'true');
      return reply.send(categories);
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get category stats
  fastify.get('/stats', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)]
  }, async (request: any, reply) => {
    try {
      const stats = await categoryService.getCategoryStats();
      return reply.send(stats);
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get single category
  fastify.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params;
      const category = await categoryService.getCategoryById(id);
      return reply.send(category);
    } catch (error) {
      return reply.code(404).send(error);
    }
  });

  // Create category (Admin only)
  fastify.post('/', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)]
  }, async (request: any, reply) => {
    try {
      const category = await categoryService.createCategory(request.body);
      return reply.code(201).send(category);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update category (Admin only)
  fastify.put('/:id', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const category = await categoryService.updateCategory(id, request.body);
      return reply.send(category);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Reorder categories (Admin only)
  fastify.patch('/reorder', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)]
  }, async (request: any, reply) => {
    try {
      const result = await categoryService.reorderCategories(request.body);
      return reply.send(result);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Delete category (Admin only)
  fastify.delete('/:id', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { reassignToId } = request.query;
      const result = await categoryService.deleteCategory(id, reassignToId);
      return reply.send(result);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });
};

export default categoryRoutes;