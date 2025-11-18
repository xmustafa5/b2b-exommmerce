import Fastify from 'fastify'
import cors from '@fastify/cors'
import env from '@fastify/env'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

// Schema for environment variables
const schema = {
  type: 'object',
  required: ['PORT', 'DATABASE_URL'],
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

    // CORS
    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : true,
      credentials: true
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
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Users', description: 'User management endpoints' },
          { name: 'Auth', description: 'Authentication endpoints' },
        ],
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
    await fastify.register(import('./routes/auth'), { prefix: '/api/auth' })

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