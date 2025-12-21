"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
class ProductService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    // Get all products with pagination and filters
    async getProducts(page = 1, limit = 20, filters = {}, sortBy = 'createdAt', sortOrder = 'desc') {
        const skip = (page - 1) * limit;
        const where = {
            ...(filters.categoryId && { categoryId: filters.categoryId }),
            ...(filters.minPrice && { price: { gte: filters.minPrice } }),
            ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
            ...(filters.zones && { zones: { hasSome: filters.zones } }),
            ...(filters.inStock && { stock: { gt: 0 } }),
            ...(filters.search && {
                OR: [
                    { nameEn: { contains: filters.search, mode: 'insensitive' } },
                    { nameAr: { contains: filters.search, mode: 'insensitive' } },
                    { descriptionEn: { contains: filters.search, mode: 'insensitive' } },
                    { descriptionAr: { contains: filters.search, mode: 'insensitive' } },
                    { sku: { contains: filters.search, mode: 'insensitive' } },
                    { barcode: { contains: filters.search, mode: 'insensitive' } },
                ],
            }),
        };
        const orderBy = {};
        orderBy[sortBy] = sortOrder;
        const [products, total] = await Promise.all([
            this.fastify.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    category: true,
                },
            }),
            this.fastify.prisma.product.count({ where }),
        ]);
        return {
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Get single product by ID
    async getProductById(id) {
        const product = await this.fastify.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });
        if (!product) {
            throw this.fastify.httpErrors.notFound('Product not found');
        }
        return product;
    }
    // Create new product (Admin only)
    async createProduct(data) {
        // Check if SKU already exists
        const existingProduct = await this.fastify.prisma.product.findUnique({
            where: { sku: data.sku },
        });
        if (existingProduct) {
            throw this.fastify.httpErrors.conflict('Product with this SKU already exists');
        }
        // Verify category exists
        const category = await this.fastify.prisma.category.findUnique({
            where: { id: data.categoryId },
        });
        if (!category) {
            throw this.fastify.httpErrors.notFound('Category not found');
        }
        const product = await this.fastify.prisma.product.create({
            data: {
                ...data,
                images: data.images || [],
            },
            include: {
                category: true,
            },
        });
        return product;
    }
    // Update product (Admin only)
    async updateProduct(id, data) {
        // Check if product exists
        const existingProduct = await this.fastify.prisma.product.findUnique({
            where: { id },
        });
        if (!existingProduct) {
            throw this.fastify.httpErrors.notFound('Product not found');
        }
        // If updating SKU, check if new SKU is unique
        if (data.sku && data.sku !== existingProduct.sku) {
            const skuExists = await this.fastify.prisma.product.findUnique({
                where: { sku: data.sku },
            });
            if (skuExists) {
                throw this.fastify.httpErrors.conflict('Product with this SKU already exists');
            }
        }
        // If updating category, verify it exists
        if (data.categoryId) {
            const category = await this.fastify.prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw this.fastify.httpErrors.notFound('Category not found');
            }
        }
        const product = await this.fastify.prisma.product.update({
            where: { id },
            data,
            include: {
                category: true,
            },
        });
        return product;
    }
    // Delete product (Admin only)
    async deleteProduct(id) {
        const product = await this.fastify.prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw this.fastify.httpErrors.notFound('Product not found');
        }
        await this.fastify.prisma.product.delete({
            where: { id },
        });
        return { message: 'Product deleted successfully' };
    }
    // Update stock
    async updateStock(id, quantity, operation) {
        const product = await this.fastify.prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw this.fastify.httpErrors.notFound('Product not found');
        }
        let newStock = product.stock;
        switch (operation) {
            case 'add':
                newStock = product.stock + quantity;
                break;
            case 'subtract':
                newStock = product.stock - quantity;
                if (newStock < 0) {
                    throw this.fastify.httpErrors.badRequest('Insufficient stock');
                }
                break;
            case 'set':
                newStock = quantity;
                break;
        }
        const updatedProduct = await this.fastify.prisma.product.update({
            where: { id },
            data: { stock: newStock },
        });
        return updatedProduct;
    }
    // Get featured products
    async getFeaturedProducts(zones) {
        const where = {
            isFeatured: true,
            isActive: true,
            ...(zones && { zones: { hasSome: zones } }),
        };
        const products = await this.fastify.prisma.product.findMany({
            where,
            take: 10,
            include: {
                category: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return products;
    }
    // Get products by category
    async getProductsByCategory(categoryId, zones) {
        const where = {
            categoryId,
            isActive: true,
            ...(zones && { zones: { hasSome: zones } }),
        };
        const products = await this.fastify.prisma.product.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return products;
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map