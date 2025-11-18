import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

interface RegisterBody {
  email: string
  password: string
  name: string
}

interface LoginBody {
  email: string
  password: string
}

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Register endpoint
  fastify.post<{ Body: RegisterBody }>('/register', {
    schema: {
      description: 'Register a new user',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 2 }
        }
      },
      response: {
        201: {
          description: 'User successfully registered',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            token: { type: 'string' }
          }
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password, name } = request.body

    try {
      // Check if user already exists
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await fastify.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        }
      })

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      )

      reply.code(201).send({
        id: user.id,
        email: user.email,
        name: user.name,
        token
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // Login endpoint
  fastify.post<{ Body: LoginBody }>('/login', {
    schema: {
      description: 'Login user',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Login successful',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            token: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body

    try {
      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      )

      reply.send({
        id: user.id,
        email: user.email,
        name: user.name,
        token
      })
    } catch (error) {
      fastify.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // Verify token endpoint
  fastify.get('/verify', {
    schema: {
      description: 'Verify JWT token',
      tags: ['Auth'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' }
        },
        required: ['authorization']
      },
      response: {
        200: {
          description: 'Token is valid',
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' }
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
        }
      }
    }
  }, async (request, reply) => {
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

      reply.send({
        valid: true,
        user: {
          id: decoded.id,
          email: decoded.email
        }
      })
    } catch (error) {
      reply.code(401).send({ error: 'Invalid token' })
    }
  })
}

export default authRoutes