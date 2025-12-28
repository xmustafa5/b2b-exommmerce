import Fastify from 'fastify'
import cors from '@fastify/cors'
import env from '@fastify/env'
import jwt from '@fastify/jwt'
import sensible from '@fastify/sensible'
import rateLimit from '@fastify/rate-limit'
import helmet from '@fastify/helmet'
import compress from '@fastify/compress'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import websocket from '@fastify/websocket'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import 'dotenv/config'
import { metricsPlugin } from './services/monitoring.service'

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

// Create Fastify instance with updated auth
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

    // Security headers with Helmet
    await fastify.register(helmet, {
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "data:"],
        }
      } : false, // Disable CSP in development for Swagger UI
      crossOriginEmbedderPolicy: false, // Allow embedding for development
    })

    // Response compression
    await fastify.register(compress, {
      global: true,
      threshold: 1024, // Only compress responses larger than 1KB
      encodings: ['gzip', 'deflate'],
    })

    // JWT authentication
    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      sign: {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    })

    // Rate limiting - Properly configured
    await fastify.register(rateLimit, {
      global: true,
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
      timeWindow: '15 minutes',
      cache: 10000, // Cache up to 10000 rate limit objects
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true
      },
      skipOnError: true, // Don't apply rate limiting if there's an error
      keyGenerator: (request) => {
        // Use IP + user ID if authenticated, otherwise just IP
        const userId = (request as any).user?.id
        return userId ? `${request.ip}-${userId}` : request.ip
      },
      errorResponseBuilder: (request, context) => {
        return {
          error: 'Too Many Requests',
          message: `You have exceeded the ${context.max} requests in ${context.after} limit!`,
          date: Date.now(),
          expiresIn: context.ttl
        }
      }
    })

    // CORS - Allow all for development
    await fastify.register(cors, {
      origin: true, // Allow all origins
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Length', 'X-Request-Id']
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

    // WebSocket support
    await fastify.register(websocket)

    // Swagger Documentation
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Lilium B2B E-commerce API',
          description: 'Complete API documentation for Lilium B2B multi-vendor platform with cash-on-delivery system',
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
          { name: 'auth', description: 'Authentication endpoints' },
          { name: 'Users', description: 'User profile management endpoints' },
          { name: 'favorites', description: 'User favorites/wishlist endpoints' },
          { name: 'admins', description: 'Admin management endpoints' },
          { name: 'products', description: 'Product management endpoints' },
          { name: 'categories', description: 'Category management endpoints' },
          { name: 'orders', description: 'Order management endpoints' },
          { name: 'cart', description: 'Shopping cart endpoints' },
          { name: 'Addresses', description: 'Address management endpoints' },
          { name: 'promotions', description: 'Promotions and discounts endpoints' },
          { name: 'Inventory', description: 'Inventory and stock management endpoints' },
          { name: 'Notifications', description: 'Push notification endpoints' },
          { name: 'Analytics', description: 'Analytics and reporting endpoints' },
          { name: 'notify-me', description: 'Back-in-stock notification endpoints' },
          { name: 'export', description: 'Data export endpoints (CSV/PDF)' },
          { name: 'companies', description: 'Company/vendor management endpoints' },
          { name: 'vendors', description: 'Vendor portal endpoints' },
          { name: 'payouts', description: 'Vendor payout endpoints' },
          { name: 'settlements', description: 'Settlement management endpoints' },
          { name: 'delivery', description: 'Delivery route management endpoints' },
          { name: 'websocket', description: 'Real-time WebSocket endpoints' },
          { name: 'monitoring', description: 'API monitoring and metrics endpoints' },
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
    await fastify.register(import('./routes/auth.simple'), { prefix: '/api/auth' })
    await fastify.register(import('./routes/users'), { prefix: '/api/users' })
    await fastify.register(import('./routes/favorites'), { prefix: '/api/users/favorites' })
    await fastify.register(import('./routes/admins'), { prefix: '/api/admins' })
    await fastify.register(import('./routes/products'), { prefix: '/api/products' })
    await fastify.register(import('./routes/categories'), { prefix: '/api/categories' })
    await fastify.register(import('./routes/upload'), { prefix: '/api/upload' })
    await fastify.register(import('./routes/orders'), { prefix: '/api/orders' })
    await fastify.register(import('./routes/cart'), { prefix: '/api/cart' })
    await fastify.register(import('./routes/promotions'), { prefix: '/api/promotions' })
    await fastify.register(import('./routes/addresses'), { prefix: '/api/addresses' })
    await fastify.register(import('./routes/inventory'), { prefix: '/api/inventory' })
    await fastify.register(import('./routes/notifications'), { prefix: '/api/notifications' })
    await fastify.register(import('./routes/analytics'), { prefix: '/api/analytics' })
    await fastify.register(import('./routes/notify-me'), { prefix: '/api/notify-me' })
    await fastify.register(import('./routes/export'), { prefix: '/api/export' })
    await fastify.register(import('./routes/companies'), { prefix: '/api/companies' })
    await fastify.register(import('./routes/vendors'), { prefix: '/api/vendors' })
    await fastify.register(import('./routes/payouts'), { prefix: '/api/payouts' })
    await fastify.register(import('./routes/settlements'), { prefix: '/api/settlements' })
    await fastify.register(import('./routes/delivery'), { prefix: '/api/delivery' })
    await fastify.register(import('./routes/internal'), { prefix: '/api/internal' })
    await fastify.register(import('./routes/websocket'), { prefix: '/ws' })

    // API Monitoring and Metrics plugin
    await fastify.register(metricsPlugin)

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

// Start server
start()