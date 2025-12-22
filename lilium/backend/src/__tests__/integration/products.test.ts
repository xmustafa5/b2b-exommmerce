import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import { PrismaClient, Zone } from '@prisma/client';

describe('Products API Integration Tests', () => {
  let fastify: FastifyInstance;
  let mockPrisma: any;

  const mockProducts = [
    {
      id: 'prod1',
      sku: 'SKU001',
      nameEn: 'Product 1',
      nameAr: 'منتج 1',
      descriptionEn: 'Description 1',
      descriptionAr: 'وصف 1',
      price: 10000,
      compareAtPrice: null,
      cost: 5000,
      stock: 100,
      minOrderQty: 1,
      unit: 'piece',
      images: ['https://example.com/img1.jpg'],
      categoryId: 'cat1',
      companyId: null,
      zones: [Zone.KARKH, Zone.RUSAFA],
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'cat1',
        nameEn: 'Electronics',
        nameAr: 'الكترونيات',
      },
    },
    {
      id: 'prod2',
      sku: 'SKU002',
      nameEn: 'Product 2',
      nameAr: 'منتج 2',
      price: 20000,
      stock: 50,
      minOrderQty: 5,
      zones: [Zone.KARKH],
      isActive: true,
      isFeatured: false,
      category: {
        id: 'cat1',
        nameEn: 'Electronics',
        nameAr: 'الكترونيات',
      },
    },
  ];

  beforeAll(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(sensible);

    mockPrisma = {
      product: {
        findMany: jest.fn().mockResolvedValue(mockProducts),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
      },
      category: {
        findUnique: jest.fn(),
      },
    };

    fastify.decorate('prisma', mockPrisma as unknown as PrismaClient);

    // Register products routes (simplified for testing)
    fastify.get('/api/products', async (request: any, reply) => {
      const { page = 1, limit = 20, categoryId, search, inStock, zones } = request.query;

      const where: any = {};
      if (categoryId) where.categoryId = categoryId;
      if (search) {
        where.OR = [
          { nameEn: { contains: search, mode: 'insensitive' } },
          { nameAr: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (inStock === 'true') where.stock = { gt: 0 };

      const products = await fastify.prisma.product.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });

      const total = await fastify.prisma.product.count({ where });

      return {
        data: products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };
    });

    fastify.get('/api/products/:id', async (request: any, reply) => {
      const product = await fastify.prisma.product.findUnique({
        where: { id: request.params.id },
        include: { category: true },
      });

      if (!product) {
        return reply.notFound('Product not found');
      }

      return product;
    });

    fastify.get('/api/products/featured', async (request: any, reply) => {
      const products = await fastify.prisma.product.findMany({
        where: { isFeatured: true, isActive: true },
        take: 10,
        include: { category: true },
      });

      return products;
    });

    fastify.post('/api/products', async (request: any, reply) => {
      const { sku, categoryId } = request.body;

      // Check SKU uniqueness
      const existingProduct = await fastify.prisma.product.findUnique({
        where: { sku },
      });
      if (existingProduct) {
        return reply.conflict('Product with this SKU already exists');
      }

      // Check category exists
      const category = await fastify.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return reply.notFound('Category not found');
      }

      const product = await fastify.prisma.product.create({
        data: request.body,
        include: { category: true },
      });

      return reply.code(201).send(product);
    });

    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(2);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.pagination.total).toBe(2);
      expect(body.pagination.page).toBe(1);
    });

    it('should filter by category', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products?categoryId=cat1',
      });

      expect(response.statusCode).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat1',
          }),
        })
      );
    });

    it('should search products', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products?search=Product',
      });

      expect(response.statusCode).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ nameEn: { contains: 'Product', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });

    it('should filter in-stock products', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products?inStock=true',
      });

      expect(response.statusCode).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: { gt: 0 },
          }),
        })
      );
    });

    it('should paginate correctly', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products?page=2&limit=10',
      });

      expect(response.statusCode).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by ID', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProducts[0]);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products/prod1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('prod1');
      expect(body.nameEn).toBe('Product 1');
      expect(body.category).toBeDefined();
    });

    it('should return 404 for non-existent product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/products/featured', () => {
    it('should return featured products', async () => {
      const featuredProducts = mockProducts.filter(p => p.isFeatured);
      mockPrisma.product.findMany.mockResolvedValue(featuredProducts);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products/featured',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].isFeatured).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should create new product', async () => {
      const newProduct = {
        sku: 'SKU003',
        nameEn: 'New Product',
        nameAr: 'منتج جديد',
        price: 15000,
        stock: 100,
        minOrderQty: 1,
        unit: 'piece',
        categoryId: 'cat1',
        zones: [Zone.KARKH],
        isActive: true,
        isFeatured: false,
      };

      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat1', nameEn: 'Electronics' });
      mockPrisma.product.create.mockResolvedValue({
        id: 'prod3',
        ...newProduct,
        category: { id: 'cat1', nameEn: 'Electronics' },
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/products',
        payload: newProduct,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('prod3');
      expect(body.sku).toBe('SKU003');
    });

    it('should return 409 for duplicate SKU', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProducts[0]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          sku: 'SKU001',
          nameEn: 'Duplicate',
          nameAr: 'مكرر',
          price: 10000,
          categoryId: 'cat1',
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/products',
        payload: {
          sku: 'SKU003',
          nameEn: 'Product',
          nameAr: 'منتج',
          price: 10000,
          categoryId: 'nonexistent',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
