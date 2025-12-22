import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import jwt from '@fastify/jwt';
import { PrismaClient, UserRole, Zone } from '@prisma/client';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('Auth API Integration Tests', () => {
  let fastify: FastifyInstance;
  let mockPrisma: any;

  const mockAdmin = {
    id: 'admin1',
    email: 'admin@example.com',
    password: 'hashedPassword',
    name: 'Admin User',
    businessName: 'Admin Corp',
    phone: '1234567890',
    role: UserRole.ADMIN,
    zones: [Zone.KARKH, Zone.RUSAFA],
    isActive: true,
    refreshToken: null,
    companyId: null,
  };

  const mockShopOwner = {
    id: 'shop1',
    email: 'shop@example.com',
    password: 'hashedPassword',
    name: 'Shop Owner',
    businessName: 'My Shop',
    phone: '0987654321',
    role: UserRole.SHOP_OWNER,
    zones: [Zone.KARKH],
    isActive: true,
    refreshToken: null,
  };

  beforeAll(async () => {
    fastify = Fastify({ logger: false });

    await fastify.register(sensible);
    await fastify.register(jwt, {
      secret: 'test-secret-key',
    });

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    fastify.decorate('prisma', mockPrisma as unknown as PrismaClient);

    // Dashboard login
    fastify.post('/api/auth/dashboard/login', async (request: any, reply) => {
      const { email, password } = request.body;

      const user = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.unauthorized('Invalid email or password');
      }

      // Check role
      const dashboardRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.VENDOR, UserRole.COMPANY_MANAGER];
      if (!dashboardRoles.includes(user.role)) {
        return reply.forbidden('Access denied');
      }

      if (!user.isActive) {
        return reply.forbidden('Account is deactivated');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return reply.unauthorized('Invalid email or password');
      }

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        zones: user.zones,
      });

      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, tokens: { accessToken: token, refreshToken: token } };
    });

    // Mobile login
    fastify.post('/api/auth/mobile/login', async (request: any, reply) => {
      const { email, password } = request.body;

      const user = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.unauthorized('Invalid email or password');
      }

      if (user.role !== UserRole.SHOP_OWNER) {
        return reply.forbidden('Access denied');
      }

      if (!user.isActive) {
        return reply.forbidden('Account is deactivated');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return reply.unauthorized('Invalid email or password');
      }

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        zones: user.zones,
      });

      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, tokens: { accessToken: token, refreshToken: token } };
    });

    // Profile route
    fastify.get('/api/auth/profile', {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          return reply.unauthorized('Unauthorized');
        }
      },
    }, async (request: any, reply) => {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.userId },
      });

      if (!user) {
        return reply.notFound('User not found');
      }

      const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;
      return userWithoutSensitiveData;
    });

    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/dashboard/login', () => {
    it('should login admin successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/dashboard/login',
        payload: {
          email: 'admin@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.email).toBe('admin@example.com');
      expect(body.user.role).toBe(UserRole.ADMIN);
      expect(body.tokens.accessToken).toBeDefined();
      expect(body.user.password).toBeUndefined();
    });

    it('should return 401 for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/dashboard/login',
        payload: {
          email: 'invalid@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/dashboard/login',
        payload: {
          email: 'admin@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 403 for shop owner trying dashboard login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockShopOwner);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/dashboard/login',
        payload: {
          email: 'shop@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return 403 for deactivated account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockAdmin, isActive: false });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/dashboard/login',
        payload: {
          email: 'admin@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('POST /api/auth/mobile/login', () => {
    it('should login shop owner successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockShopOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/mobile/login',
        payload: {
          email: 'shop@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.email).toBe('shop@example.com');
      expect(body.user.role).toBe(UserRole.SHOP_OWNER);
      expect(body.tokens.accessToken).toBeDefined();
    });

    it('should return 403 for admin trying mobile login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/mobile/login',
        payload: {
          email: 'admin@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);

      const token = fastify.jwt.sign({
        userId: mockAdmin.id,
        email: mockAdmin.email,
        role: mockAdmin.role,
        zones: mockAdmin.zones,
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/profile',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.email).toBe('admin@example.com');
      expect(body.password).toBeUndefined();
      expect(body.refreshToken).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/profile',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/auth/profile',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
