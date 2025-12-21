"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const product_service_1 = require("../services/product.service");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const validation_1 = require("../types/validation");
const productRoutes = async (fastify) => {
    const productService = new product_service_1.ProductService(fastify);
    // Get all products (Public - filtered by user's zone)
    fastify.get('/', {
        schema: {
            tags: ['products'],
            summary: 'Get all products',
            description: 'Retrieve a paginated list of products with optional filters. Products are filtered by zones and can be searched by name or filtered by category, price range, and stock availability.',
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'number', minimum: 1, default: 1, description: 'Page number for pagination' },
                    limit: { type: 'number', minimum: 1, maximum: 100, default: 20, description: 'Number of items per page' },
                    categoryId: { type: 'string', description: 'Filter by category ID' },
                    minPrice: { type: 'number', minimum: 0, description: 'Minimum price filter' },
                    maxPrice: { type: 'number', minimum: 0, description: 'Maximum price filter' },
                    inStock: { type: 'boolean', description: 'Filter to show only in-stock products' },
                    search: { type: 'string', description: 'Search by product name (Arabic or English)' },
                    sortBy: { type: 'string', enum: ['createdAt', 'price', 'nameEn', 'nameAr', 'stock'], default: 'createdAt', description: 'Field to sort by' },
                    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
                    zones: {
                        type: 'string',
                        description: 'Comma-separated list of zones, e.g. KARKH,RUSAFA'
                    }
                }
            },
            response: {
                200: {
                    description: 'Paginated list of products',
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    sku: { type: 'string' },
                                    nameAr: { type: 'string' },
                                    nameEn: { type: 'string' },
                                    descriptionAr: { type: 'string', nullable: true },
                                    descriptionEn: { type: 'string', nullable: true },
                                    price: { type: 'number' },
                                    compareAtPrice: { type: 'number', nullable: true },
                                    cost: { type: 'number', nullable: true },
                                    stock: { type: 'number' },
                                    minOrderQty: { type: 'number' },
                                    unit: { type: 'string' },
                                    images: { type: 'array', items: { type: 'string' } },
                                    categoryId: { type: 'string' },
                                    companyId: { type: 'string' },
                                    zones: { type: 'array', items: { type: 'string' } },
                                    isActive: { type: 'boolean' },
                                    isFeatured: { type: 'boolean' },
                                    sortOrder: { type: 'number' },
                                    createdAt: { type: 'string', format: 'date-time' },
                                    updatedAt: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                total: { type: 'number' },
                                page: { type: 'number' },
                                limit: { type: 'number' },
                                totalPages: { type: 'number' }
                            }
                        }
                    }
                },
                500: {
                    description: 'Internal server error',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const query = validation_1.productQuerySchema.parse(request.query);
            const parsedZones = query.zones ? query.zones.split(',') : undefined;
            const result = await productService.getProducts(query.page, query.limit, {
                categoryId: query.categoryId,
                minPrice: query.minPrice,
                maxPrice: query.maxPrice,
                zones: parsedZones,
                inStock: query.inStock === 'true',
                search: query.search,
            }, query.sortBy, query.sortOrder);
            return reply.send(result);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Get featured products
    fastify.get('/featured', {
        schema: {
            tags: ['products'],
            summary: 'Get featured products',
            description: 'Retrieve all featured products, optionally filtered by zones. Featured products are highlighted products set by administrators.',
            querystring: {
                type: 'object',
                properties: {
                    zones: {
                        type: 'string',
                        description: 'Comma-separated list of zones, e.g. KARKH,RUSAFA'
                    }
                }
            },
            response: {
                200: {
                    description: 'List of featured products',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            sku: { type: 'string' },
                            nameAr: { type: 'string' },
                            nameEn: { type: 'string' },
                            descriptionAr: { type: 'string', nullable: true },
                            descriptionEn: { type: 'string', nullable: true },
                            price: { type: 'number' },
                            compareAtPrice: { type: 'number', nullable: true },
                            stock: { type: 'number' },
                            minOrderQty: { type: 'number' },
                            unit: { type: 'string' },
                            images: { type: 'array', items: { type: 'string' } },
                            categoryId: { type: 'string' },
                            companyId: { type: 'string' },
                            zones: { type: 'array', items: { type: 'string' } },
                            isFeatured: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                500: {
                    description: 'Internal server error',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { zones } = request.query;
            const parsedZones = zones ? (Array.isArray(zones) ? zones : zones.split(',')) : undefined;
            const products = await productService.getFeaturedProducts(parsedZones);
            return reply.send(products);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Get products by category
    fastify.get('/category/:categoryId', {
        schema: {
            tags: ['products'],
            summary: 'Get products by category',
            description: 'Retrieve all products belonging to a specific category, optionally filtered by zones.',
            params: {
                type: 'object',
                required: ['categoryId'],
                properties: {
                    categoryId: { type: 'string', description: 'Category ID to filter products' }
                }
            },
            querystring: {
                type: 'object',
                properties: {
                    zones: {
                        type: 'string',
                        description: 'Comma-separated list of zones, e.g. KARKH,RUSAFA'
                    }
                }
            },
            response: {
                200: {
                    description: 'List of products in the category',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            sku: { type: 'string' },
                            nameAr: { type: 'string' },
                            nameEn: { type: 'string' },
                            descriptionAr: { type: 'string', nullable: true },
                            descriptionEn: { type: 'string', nullable: true },
                            price: { type: 'number' },
                            compareAtPrice: { type: 'number', nullable: true },
                            stock: { type: 'number' },
                            minOrderQty: { type: 'number' },
                            unit: { type: 'string' },
                            images: { type: 'array', items: { type: 'string' } },
                            categoryId: { type: 'string' },
                            companyId: { type: 'string' },
                            zones: { type: 'array', items: { type: 'string' } },
                            isActive: { type: 'boolean' },
                            isFeatured: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                500: {
                    description: 'Internal server error',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { categoryId } = request.params;
            const { zones } = request.query;
            const parsedZones = zones ? (Array.isArray(zones) ? zones : zones.split(',')) : undefined;
            const products = await productService.getProductsByCategory(categoryId, parsedZones);
            return reply.send(products);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Get single product
    fastify.get('/:id', {
        schema: {
            tags: ['products'],
            summary: 'Get product by ID',
            description: 'Retrieve detailed information about a specific product by its ID.',
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Product ID' }
                }
            },
            response: {
                200: {
                    description: 'Product details',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        sku: { type: 'string' },
                        nameAr: { type: 'string' },
                        nameEn: { type: 'string' },
                        descriptionAr: { type: 'string', nullable: true },
                        descriptionEn: { type: 'string', nullable: true },
                        price: { type: 'number' },
                        compareAtPrice: { type: 'number', nullable: true },
                        cost: { type: 'number', nullable: true },
                        stock: { type: 'number' },
                        minOrderQty: { type: 'number' },
                        unit: { type: 'string' },
                        images: { type: 'array', items: { type: 'string' } },
                        categoryId: { type: 'string' },
                        companyId: { type: 'string' },
                        zones: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        isFeatured: { type: 'boolean' },
                        sortOrder: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                404: {
                    description: 'Product not found',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const product = await productService.getProductById(id);
            return reply.send(product);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Create product (Admin only)
    fastify.post('/', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN)],
        schema: {
            tags: ['products'],
            summary: 'Create new product',
            description: 'Create a new product. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['sku', 'nameAr', 'nameEn', 'price', 'categoryId', 'companyId', 'zones'],
                properties: {
                    sku: { type: 'string', description: 'Unique product SKU/code' },
                    nameAr: { type: 'string', minLength: 2, description: 'Product name in Arabic' },
                    nameEn: { type: 'string', minLength: 2, description: 'Product name in English' },
                    descriptionAr: { type: 'string', nullable: true, description: 'Product description in Arabic' },
                    descriptionEn: { type: 'string', nullable: true, description: 'Product description in English' },
                    price: { type: 'number', minimum: 0, description: 'Product price' },
                    compareAtPrice: { type: 'number', minimum: 0, nullable: true, description: 'Original price before discount' },
                    cost: { type: 'number', minimum: 0, nullable: true, description: 'Cost price for profit calculation' },
                    stock: { type: 'number', minimum: 0, default: 0, description: 'Available stock quantity' },
                    minOrderQty: { type: 'number', minimum: 1, default: 1, description: 'Minimum order quantity' },
                    unit: { type: 'string', default: 'piece', description: 'Unit of measurement (piece, box, carton, etc.)' },
                    images: {
                        type: 'array',
                        items: { type: 'string', format: 'uri' },
                        description: 'Array of image URLs'
                    },
                    categoryId: { type: 'string', description: 'Category ID' },
                    companyId: { type: 'string', description: 'Company/Vendor ID' },
                    zones: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['KARKH', 'RUSAFA']
                        },
                        minItems: 1,
                        description: 'Available zones for this product'
                    },
                    isActive: { type: 'boolean', default: true, description: 'Product active status' },
                    isFeatured: { type: 'boolean', default: false, description: 'Whether product is featured' },
                    sortOrder: { type: 'number', default: 0, description: 'Display order for sorting' }
                }
            },
            response: {
                201: {
                    description: 'Product created successfully',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        sku: { type: 'string' },
                        nameAr: { type: 'string' },
                        nameEn: { type: 'string' },
                        descriptionAr: { type: 'string', nullable: true },
                        descriptionEn: { type: 'string', nullable: true },
                        price: { type: 'number' },
                        compareAtPrice: { type: 'number', nullable: true },
                        cost: { type: 'number', nullable: true },
                        stock: { type: 'number' },
                        minOrderQty: { type: 'number' },
                        unit: { type: 'string' },
                        images: { type: 'array', items: { type: 'string' } },
                        categoryId: { type: 'string' },
                        companyId: { type: 'string' },
                        zones: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        isFeatured: { type: 'boolean' },
                        sortOrder: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                403: {
                    description: 'Forbidden - insufficient permissions',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const data = validation_1.createProductSchema.parse(request.body);
            const product = await productService.createProduct(data);
            return reply.code(201).send(product);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Update product (Admin only)
    fastify.put('/:id', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN)],
        schema: {
            tags: ['products'],
            summary: 'Update product',
            description: 'Update an existing product. All fields are optional. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid', description: 'Product ID to update' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    sku: { type: 'string', description: 'Unique product SKU/code' },
                    nameAr: { type: 'string', minLength: 2, description: 'Product name in Arabic' },
                    nameEn: { type: 'string', minLength: 2, description: 'Product name in English' },
                    descriptionAr: { type: 'string', nullable: true, description: 'Product description in Arabic' },
                    descriptionEn: { type: 'string', nullable: true, description: 'Product description in English' },
                    price: { type: 'number', minimum: 0, description: 'Product price' },
                    compareAtPrice: { type: 'number', minimum: 0, nullable: true, description: 'Original price before discount' },
                    cost: { type: 'number', minimum: 0, nullable: true, description: 'Cost price for profit calculation' },
                    stock: { type: 'number', minimum: 0, description: 'Available stock quantity' },
                    minOrderQty: { type: 'number', minimum: 1, description: 'Minimum order quantity' },
                    unit: { type: 'string', description: 'Unit of measurement (piece, box, carton, etc.)' },
                    images: {
                        type: 'array',
                        items: { type: 'string', format: 'uri' },
                        description: 'Array of image URLs'
                    },
                    categoryId: { type: 'string', description: 'Category ID' },
                    companyId: { type: 'string', description: 'Company/Vendor ID' },
                    zones: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['KARKH', 'RUSAFA']
                        },
                        description: 'Available zones for this product'
                    },
                    isActive: { type: 'boolean', description: 'Product active status' },
                    isFeatured: { type: 'boolean', description: 'Whether product is featured' },
                    sortOrder: { type: 'number', description: 'Display order for sorting' }
                }
            },
            response: {
                200: {
                    description: 'Product updated successfully',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        sku: { type: 'string' },
                        nameAr: { type: 'string' },
                        nameEn: { type: 'string' },
                        descriptionAr: { type: 'string', nullable: true },
                        descriptionEn: { type: 'string', nullable: true },
                        price: { type: 'number' },
                        compareAtPrice: { type: 'number', nullable: true },
                        cost: { type: 'number', nullable: true },
                        stock: { type: 'number' },
                        minOrderQty: { type: 'number' },
                        unit: { type: 'string' },
                        images: { type: 'array', items: { type: 'string' } },
                        categoryId: { type: 'string' },
                        companyId: { type: 'string' },
                        zones: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        isFeatured: { type: 'boolean' },
                        sortOrder: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                403: {
                    description: 'Forbidden - insufficient permissions',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                404: {
                    description: 'Product not found',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const data = validation_1.updateProductSchema.parse(request.body);
            const product = await productService.updateProduct(id, data);
            return reply.send(product);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Update stock
    fastify.patch('/:id/stock', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN)],
        schema: {
            tags: ['products'],
            summary: 'Update product stock',
            description: 'Update product stock quantity by adding, subtracting, or setting a specific value. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', description: 'Product ID' }
                }
            },
            body: {
                type: 'object',
                required: ['quantity', 'operation'],
                properties: {
                    quantity: { type: 'number', minimum: 0, description: 'Stock quantity to add, subtract, or set' },
                    operation: {
                        type: 'string',
                        enum: ['add', 'subtract', 'set'],
                        description: 'Operation to perform: add (increase stock), subtract (decrease stock), or set (replace stock)'
                    }
                }
            },
            response: {
                200: {
                    description: 'Stock updated successfully',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        sku: { type: 'string' },
                        nameAr: { type: 'string' },
                        nameEn: { type: 'string' },
                        stock: { type: 'number' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                400: {
                    description: 'Bad request - validation error or insufficient stock',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                403: {
                    description: 'Forbidden - insufficient permissions',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                404: {
                    description: 'Product not found',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { quantity, operation } = validation_1.updateStockSchema.parse(request.body);
            const product = await productService.updateStock(id, quantity, operation);
            return reply.send(product);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Delete product (Admin only)
    fastify.delete('/:id', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            tags: ['products'],
            summary: 'Delete product',
            description: 'Permanently delete a product. Only accessible by SUPER_ADMIN role.',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid', description: 'Product ID to delete' }
                }
            },
            response: {
                200: {
                    description: 'Product deleted successfully',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                403: {
                    description: 'Forbidden - insufficient permissions',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                404: {
                    description: 'Product not found',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const result = await productService.deleteProduct(id);
            return reply.send(result);
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Bulk update products (Admin only)
    fastify.patch('/bulk', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN)],
        schema: {
            tags: ['products'],
            summary: 'Bulk update products',
            description: 'Update multiple products at once with the same data. Only accessible by SUPER_ADMIN and LOCATION_ADMIN roles.',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['ids', 'data'],
                properties: {
                    ids: {
                        type: 'array',
                        items: { type: 'string', format: 'uuid' },
                        minItems: 1,
                        description: 'Array of product IDs to update'
                    },
                    data: {
                        type: 'object',
                        description: 'Data to apply to all selected products',
                        properties: {
                            nameAr: { type: 'string', minLength: 2 },
                            nameEn: { type: 'string', minLength: 2 },
                            descriptionAr: { type: 'string', nullable: true },
                            descriptionEn: { type: 'string', nullable: true },
                            price: { type: 'number', minimum: 0 },
                            compareAtPrice: { type: 'number', minimum: 0, nullable: true },
                            cost: { type: 'number', minimum: 0, nullable: true },
                            stock: { type: 'number', minimum: 0 },
                            minOrderQty: { type: 'number', minimum: 1 },
                            unit: { type: 'string' },
                            categoryId: { type: 'string', format: 'uuid' },
                            companyId: { type: 'string', format: 'uuid' },
                            zones: {
                                type: 'array',
                                items: { type: 'string', enum: ['KARKH', 'RUSAFA'] }
                            },
                            isActive: { type: 'boolean' },
                            isFeatured: { type: 'boolean' },
                            sortOrder: { type: 'number' }
                        }
                    }
                }
            },
            response: {
                200: {
                    description: 'Products updated successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        products: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    sku: { type: 'string' },
                                    nameAr: { type: 'string' },
                                    nameEn: { type: 'string' },
                                    price: { type: 'number' },
                                    stock: { type: 'number' },
                                    updatedAt: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                403: {
                    description: 'Forbidden - insufficient permissions',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { ids, data } = validation_1.bulkProductSchema.parse(request.body);
            const updates = ids.map((id) => productService.updateProduct(id, data || {}));
            const products = await Promise.all(updates);
            return reply.send({
                message: `${products.length} products updated successfully`,
                products
            });
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
    // Bulk delete products (Admin only)
    fastify.delete('/bulk', {
        preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(client_1.UserRole.SUPER_ADMIN)],
        schema: {
            tags: ['products'],
            summary: 'Bulk delete products',
            description: 'Permanently delete multiple products at once. Only accessible by SUPER_ADMIN role.',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['ids'],
                properties: {
                    ids: {
                        type: 'array',
                        items: { type: 'string', format: 'uuid' },
                        minItems: 1,
                        description: 'Array of product IDs to delete'
                    }
                }
            },
            response: {
                200: {
                    description: 'Products deleted successfully',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                },
                400: {
                    description: 'Bad request - validation error',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                401: {
                    description: 'Unauthorized - invalid or missing token',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                403: {
                    description: 'Forbidden - insufficient permissions',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { ids } = validation_1.bulkProductSchema.parse(request.body);
            const deletes = ids.map((id) => productService.deleteProduct(id));
            await Promise.all(deletes);
            return reply.send({
                message: `${ids.length} products deleted successfully`
            });
        }
        catch (error) {
            return (0, errors_1.handleError)(error, reply, fastify.log);
        }
    });
};
exports.default = productRoutes;
//# sourceMappingURL=products.js.map