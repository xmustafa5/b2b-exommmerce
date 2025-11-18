import { FastifyInstance } from 'fastify';
import { Product, Category, Prisma, Zone } from '@prisma/client';

interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  zones?: Zone[];
  inStock?: boolean;
  search?: string;
}

interface ProductCreateInput {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;
  comparisonPrice?: number;
  cost?: number;
  stock: number;
  minOrderQty: number;
  unitType: string;
  zones: Zone[];
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

interface ProductUpdateInput extends Partial<ProductCreateInput> {}

export class ProductService {
  constructor(private fastify: FastifyInstance) {}

  // Get all products with pagination and filters
  async getProducts(
    page: number = 1,
    limit: number = 20,
    filters: ProductFilters = {},
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
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

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.ProductOrderByWithRelationInput] = sortOrder;

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
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single product by ID
  async getProductById(id: string) {
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
  async createProduct(data: ProductCreateInput) {
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
  async updateProduct(id: string, data: ProductUpdateInput) {
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
  async deleteProduct(id: string) {
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
  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set') {
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
  async getFeaturedProducts(zones?: Zone[]) {
    const where: Prisma.ProductWhereInput = {
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
  async getProductsByCategory(categoryId: string, zones?: Zone[]) {
    const where: Prisma.ProductWhereInput = {
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