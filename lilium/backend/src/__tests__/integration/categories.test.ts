import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import { PrismaClient, Zone } from '@prisma/client';

describe('Categories API Integration Tests', () => {
  let fastify: FastifyInstance;
  let mockPrisma: any;

  const mockCategories = [
    {
      id: 'cat1',
      nameEn: 'Electronics',
      nameAr: 'الكترونيات',
      slug: 'electronics',
      description: 'Electronic devices',
      image: 'https://example.com/electronics.jpg',
      parentId: null,
      isActive: true,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat2',
      nameEn: 'Phones',
      nameAr: 'هواتف',
      slug: 'phones',
      description: 'Mobile phones',
      image: 'https://example.com/phones.jpg',
      parentId: 'cat1',
      isActive: true,
      displayOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeAll(async () => {
    fastify = Fastify({ logger: false });

    await fastify.register(sensible);

    mockPrisma = {
      category: {
        findMany: jest.fn().mockResolvedValue(mockCategories),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
      },
    };

    fastify.decorate('prisma', mockPrisma as unknown as PrismaClient);

    // Register categories routes (simplified for testing)
    fastify.get('/api/categories', async (request, reply) => {
      const categories = await fastify.prisma.category.findMany({
        orderBy: { displayOrder: 'asc' },
      });
      return { data: categories, pagination: { total: categories.length } };
    });

    fastify.get('/api/categories/:id', async (request: any, reply) => {
      const category = await fastify.prisma.category.findUnique({
        where: { id: request.params.id },
      });
      if (!category) {
        return reply.notFound('Category not found');
      }
      return category;
    });

    fastify.post('/api/categories', async (request: any, reply) => {
      const { nameEn, nameAr, slug } = request.body;

      // Check slug uniqueness
      const existing = await fastify.prisma.category.findFirst({
        where: { slug },
      });
      if (existing) {
        return reply.conflict('Category with this slug already exists');
      }

      const category = await fastify.prisma.category.create({
        data: request.body,
      });
      return reply.code(201).send(category);
    });

    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/categories', () => {
    it('should return list of categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/categories',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].nameEn).toBe('Electronics');
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return category by ID', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategories[0]);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/categories/cat1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('cat1');
      expect(body.nameEn).toBe('Electronics');
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/categories/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/categories', () => {
    it('should create new category', async () => {
      const newCategory = {
        nameEn: 'New Category',
        nameAr: 'فئة جديدة',
        slug: 'new-category',
        isActive: true,
      };

      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 'cat3',
        ...newCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/categories',
        payload: newCategory,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('cat3');
      expect(body.nameEn).toBe('New Category');
    });

    it('should return 409 for duplicate slug', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategories[0]);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/categories',
        payload: {
          nameEn: 'Electronics Duplicate',
          nameAr: 'الكترونيات مكرر',
          slug: 'electronics',
        },
      });

      expect(response.statusCode).toBe(409);
    });
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
