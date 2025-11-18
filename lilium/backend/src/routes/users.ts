import { FastifyPluginAsync } from 'fastify'
import jwt from 'jsonwebtoken'

interface UpdateUserBody {
  name?: string
  email?: string
}

const usersRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Authentication hook
  const authenticate = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization

    if (!authHeader) {
      return reply.code(401).send({ error: 'No token provided' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { id: string; email: string }
      request.user = decoded
    } catch (error) {
      reply.code(401).send({ error: 'Invalid token' })
    }
  }

  // Get all users (protected)
  fastify.get('/', {
    preHandler: authenticate,
    schema: {
      description: 'Get all users',
      tags: ['Users'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' }
        },
        required: ['authorization']
      },
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
          createdAt: true,
          updatedAt: true
        }
      })

      reply.send(users)
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // Get user by ID (protected)
  fastify.get('/:id', {
    preHandler: authenticate,
    schema: {
      description: 'Get user by ID',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' }
        },
        required: ['authorization']
      },
      response: {
        200: {
          description: 'User details',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }

      reply.send(user)
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // Update user (protected - can only update own profile)
  fastify.put('/:id', {
    preHandler: authenticate,
    schema: {
      description: 'Update user',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' }
        },
        required: ['authorization']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' }
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
            updatedAt: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params
    const updateData = request.body as UpdateUserBody

    // Check if user is updating their own profile
    if (request.user.id !== id) {
      return reply.code(403).send({ error: 'You can only update your own profile' })
    }

    try {
      const updatedUser = await fastify.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          updatedAt: true
        }
      })

      reply.send(updatedUser)
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // Delete user (protected - can only delete own profile)
  fastify.delete('/:id', {
    preHandler: authenticate,
    schema: {
      description: 'Delete user',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' }
        },
        required: ['authorization']
      },
      response: {
        204: {
          description: 'User deleted successfully',
          type: 'null'
        },
        403: {
          description: 'Forbidden',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    const { id } = request.params

    // Check if user is deleting their own profile
    if (request.user.id !== id) {
      return reply.code(403).send({ error: 'You can only delete your own profile' })
    }

    try {
      await fastify.prisma.user.delete({
        where: { id }
      })

      reply.code(204).send()
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })
}

export default usersRoutes