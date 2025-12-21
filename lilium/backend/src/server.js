"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const env_1 = __importDefault(require("@fastify/env"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const sensible_1 = __importDefault(require("@fastify/sensible"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const compress_1 = __importDefault(require("@fastify/compress"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const static_1 = __importDefault(require("@fastify/static"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
require("dotenv/config");
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
};
const options = {
    confKey: 'config',
    schema: schema,
    dotenv: true,
    data: process.env
};
// Initialize Prisma Client
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
// Create Fastify instance with updated auth
const fastify = (0, fastify_1.default)({
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
});
// Register plugins and setup server
async function buildServer() {
    try {
        // Environment variables
        await fastify.register(env_1.default, options);
        // Sensible defaults for errors
        await fastify.register(sensible_1.default);
        // Security headers with Helmet
        await fastify.register(helmet_1.default, {
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
        });
        // Response compression
        await fastify.register(compress_1.default, {
            global: true,
            threshold: 1024, // Only compress responses larger than 1KB
            encodings: ['gzip', 'deflate'],
        });
        // JWT authentication
        await fastify.register(jwt_1.default, {
            secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
            sign: {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        });
        // Rate limiting - Properly configured
        await fastify.register(rate_limit_1.default, {
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
                const userId = request.user?.id;
                return userId ? `${request.ip}-${userId}` : request.ip;
            },
            errorResponseBuilder: (request, context) => {
                return {
                    error: 'Too Many Requests',
                    message: `You have exceeded the ${context.max} requests in ${context.after} limit!`,
                    date: Date.now(),
                    expiresIn: context.ttl
                };
            }
        });
        // CORS - Allow all for development
        await fastify.register(cors_1.default, {
            origin: true, // Allow all origins
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            exposedHeaders: ['Content-Length', 'X-Request-Id']
        });
        // Multipart for file uploads
        await fastify.register(multipart_1.default, {
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
                files: 10, // Max 10 files
            }
        });
        // Static files (for uploaded images)
        await fastify.register(static_1.default, {
            root: path_1.default.join(process.cwd(), 'uploads'),
            prefix: '/uploads/',
        });
        // Swagger Documentation
        await fastify.register(swagger_1.default, {
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
                    { name: 'products', description: 'Product management endpoints' },
                    { name: 'categories', description: 'Category management endpoints' },
                    { name: 'orders', description: 'Order management endpoints' },
                    { name: 'promotions', description: 'Promotion management endpoints' },
                    { name: 'companies', description: 'Company management endpoints' },
                    { name: 'vendors', description: 'Vendor operations endpoints' },
                    { name: 'cart', description: 'Shopping cart endpoints' },
                    { name: 'delivery', description: 'Delivery and fulfillment endpoints' },
                    { name: 'settlements', description: 'Settlement management endpoints' },
                    { name: 'analytics', description: 'Analytics and reporting endpoints' },
                    { name: 'payouts', description: 'Payout management endpoints' },
                    { name: 'upload', description: 'File upload endpoints' },
                    { name: 'internal', description: 'Internal system endpoints' },
                    { name: 'addresses', description: 'Address management endpoints' },
                    { name: 'admins', description: 'Admin management endpoints' },
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
        });
        await fastify.register(swagger_ui_1.default, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false
            },
            staticCSP: true,
            transformStaticCSP: (header) => header,
            transformSpecification: (swaggerObject, request, reply) => { return swaggerObject; },
            transformSpecificationClone: true
        });
        // Decorate Fastify instance with Prisma
        fastify.decorate('prisma', prisma);
        // Register routes
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/health'))), { prefix: '/api/health' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/auth.simple'))), { prefix: '/api/auth' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/products'))), { prefix: '/api/products' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/categories'))), { prefix: '/api/categories' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/upload'))), { prefix: '/api/upload' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/orders'))), { prefix: '/api/orders' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/promotions'))), { prefix: '/api/promotions' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/addresses'))), { prefix: '/api/addresses' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/analytics'))), { prefix: '/api/analytics' });
        // Phase 4: Admin Management Routes
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/admins'))), { prefix: '/api/admins' });
        // Phase 5: Vendor/Company Management Routes
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/vendors'))), { prefix: '/api/vendors' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/cart'))), { prefix: '/api/cart' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/companies'))), { prefix: '/api/companies' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/payouts'))), { prefix: '/api/payouts' });
        // Phase 6: Order Fulfillment & Delivery Routes
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/delivery'))), { prefix: '/api/delivery' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/settlements'))), { prefix: '/api/settlements' });
        // Internal API for Lilium team to manage users
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/internal'))), { prefix: '/api/internal' });
        // Graceful shutdown
        const closeGracefully = async (signal) => {
            fastify.log.info(`Received signal: ${signal}`);
            await fastify.close();
            await prisma.$disconnect();
            process.exit(0);
        };
        process.on('SIGINT', () => closeGracefully('SIGINT'));
        process.on('SIGTERM', () => closeGracefully('SIGTERM'));
        return fastify;
    }
    catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
}
// Start server
const start = async () => {
    const server = await buildServer();
    try {
        const port = parseInt(process.env.PORT || '3000', 10);
        await server.listen({
            port,
            host: '0.0.0.0' // Listen on all network interfaces
        });
        server.log.info(`Server listening on http://localhost:${port}`);
        server.log.info(`Swagger documentation available at http://localhost:${port}/docs`);
    }
    catch (error) {
        server.log.error(error);
        process.exit(1);
    }
};
// Start server
start();
//# sourceMappingURL=server.js.map