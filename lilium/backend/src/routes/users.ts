import { FastifyPluginAsync } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { handleError } from '../utils/errors';
import { updateUserSchema } from '../types/validation';

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all users (SUPER_ADMIN only)
  fastify.get('/', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      description: 'Get all users',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of users',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              businessName: { type: 'string', nullable: true },
              phone: { type: 'string', nullable: true },
              role: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const users = await fastify.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          businessName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return reply.send(users);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // Get user by ID (SUPER_ADMIN only, or own profile)
  fastify.get('/:id', {
    preHandler: [authenticate],
    schema: {
      description: 'Get user by ID',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'User details',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            businessName: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            role: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;

      // Only SUPER_ADMIN can view other users, others can only view themselves
      if (request.user.role !== UserRole.SUPER_ADMIN && request.user.userId !== id) {
        return reply.code(403).send({ error: 'Access denied', code: 'FORBIDDEN' });
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          businessName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      }

      return reply.send(user);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // Update user (protected - can only update own profile, or SUPER_ADMIN)
  fastify.put('/:id', {
    preHandler: [authenticate],
    schema: {
      description: 'Update user profile',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          businessName: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Updated user',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            businessName: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;

      // Only SUPER_ADMIN can update other users, others can only update themselves
      if (request.user.role !== UserRole.SUPER_ADMIN && request.user.userId !== id) {
        return reply.code(403).send({ error: 'You can only update your own profile', code: 'FORBIDDEN' });
      }

      const data = updateUserSchema.parse(request.body);

      const updatedUser = await fastify.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          businessName: true,
          phone: true,
          updatedAt: true
        }
      });

      return reply.send(updatedUser);
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });

  // Delete user (SUPER_ADMIN only)
  fastify.delete('/:id', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      description: 'Delete user account',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'User deleted successfully',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;

      // Cannot delete yourself
      if (request.user.userId === id) {
        return reply.code(400).send({ error: 'Cannot delete your own account', code: 'BAD_REQUEST' });
      }

      await fastify.prisma.user.delete({
        where: { id }
      });

      return reply.send({ message: 'User deleted successfully' });
    } catch (error) {
      return handleError(error, reply, fastify.log);
    }
  });
};

export default usersRoutes;
