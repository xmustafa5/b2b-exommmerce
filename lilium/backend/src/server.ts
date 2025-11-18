import Fastify from 'fastify'
import cors from '@fastify/cors'
import env from '@fastify/env'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import 'dotenv/config'

// Schema for environment variables
const schema = {
  type: 'object',
  required: ['PORT', 'DATABASE_URL', 'JWT_SECRET'],
  properties: {
    PORT: {
      type: 'string',
      default: '3000'
    },
    DATABASE_URL: {
      type: 'string'
    },
    NODE_ENV: {
      type: 'string',
      default: 'development'
    },
    JWT_SECRET: {
      type: 'string'
    },
    JWT_REFRESH_SECRET: {
      type: 'string'
    },
    JWT_EXPIRES_IN: {
      type: 'string',
      default: '1h'
    },
    JWT_REFRESH_EXPIRES_IN: {
      type: 'string',
      default: '7d'
    }
  }
}

const options = {
  confKey: 'config',
  schema: schema,
  dotenv: true,
  data: process.env
}

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    transport: process.env.NODE_ENV === 'development'
      ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
      : undefined,
  }
})

// Register plugins and setup server
async function buildServer() {
  try {
    // Environment variables
    await fastify.register(env, options)

    // Sensible defaults for errors
    await fastify.register(sensible)

    // JWT authentication
    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      sign: {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    })

    // Rate limiting
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '15 minutes'
    })

    // CORS
    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : true,
      credentials: true
    })

    // Multipart for file uploads
    await fastify.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10, // Max 10 files
      }
    })

    // Static files (for uploaded images)
    await fastify.register(fastifyStatic, {
      root: path.join(process.cwd(), 'uploads'),
      prefix: '/uploads/',
    })

    // Swagger Documentation
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Lilium Backend API',
          description: 'Backend API for Lilium application',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${process.env.PORT || 3000}`,
            description: 'Development server',
          },
        ],
        tags: [
          { name: 'health', description: 'Health check endpoints' },
          { name: 'users', description: 'User management endpoints' },
          { name: 'auth', description: 'Authentication endpoints' },
          { name: 'products', description: 'Product management endpoints' },
          { name: 'orders', description: 'Order management endpoints' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
      },
    })

    await fastify.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
      transformSpecificationClone: true
    })

    // Decorate Fastify instance with Prisma
    fastify.decorate('prisma', prisma)

    // Register routes
    await fastify.register(import('./routes/health'), { prefix: '/api/health' })
    await fastify.register(import('./routes/users'), { prefix: '/api/users' })
    await fastify.register(import('./routes/auth.simple'), { prefix: '/api/auth' })
    await fastify.register(import('./routes/products'), { prefix: '/api/products' })
    await fastify.register(import('./routes/categories'), { prefix: '/api/categories' })
    await fastify.register(import('./routes/upload'), { prefix: '/api/upload' })
    await fastify.register(import('./routes/orders'), { prefix: '/api/orders' })
    await fastify.register(import('./routes/promotions'), { prefix: '/api/promotions' })

    // Graceful shutdown
    const closeGracefully = async (signal: string) => {
      fastify.log.info(`Received signal: ${signal}`)
      await fastify.close()
      await prisma.$disconnect()
      process.exit(0)
    }

    process.on('SIGINT', () => closeGracefully('SIGINT'))
    process.on('SIGTERM', () => closeGracefully('SIGTERM'))

    return fastify
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

// Start server
const start = async () => {
  const server = await buildServer()

  try {
    const port = parseInt(process.env.PORT || '3000', 10)
    await server.listen({
      port,
      host: '0.0.0.0'  // Listen on all network interfaces
    })

    server.log.info(`Server listening on http://localhost:${port}`)
    server.log.info(`Swagger documentation available at http://localhost:${port}/docs`)
  } catch (error) {
    server.log.error(error)
    process.exit(1)
  }
}

// Declare module to add Prisma to Fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

start()