import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UserRole, Zone } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let mockFastify: Partial<FastifyInstance>;

  beforeEach(() => {
    // Mock Fastify instance
    mockFastify = {
      prisma: {
        user: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        address: {
          create: jest.fn(),
        },
      } as any,
      jwt: {
        sign: jest.fn().mockReturnValue('mock-token'),
        verify: jest.fn(),
      } as any,
      httpErrors: {
        conflict: jest.fn().mockImplementation((msg) => new Error(msg)),
        unauthorized: jest.fn().mockImplementation((msg) => new Error(msg)),
        forbidden: jest.fn().mockImplementation((msg) => new Error(msg)),
        notFound: jest.fn().mockImplementation((msg) => new Error(msg)),
        badRequest: jest.fn().mockImplementation((msg) => new Error(msg)),
      } as any,
      log: {
        info: jest.fn(),
        error: jest.fn(),
      } as any,
    };

    authService = new AuthService(mockFastify as FastifyInstance);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.SHOP_OWNER,
        zones: [Zone.KARKH],
        createdAt: new Date(),
      };

      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockFastify.prisma!.user.create as jest.Mock).mockResolvedValue(mockUser);
      (mockFastify.prisma!.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Test@1234',
        name: 'Test User',
        role: UserRole.SHOP_OWNER,
        zones: [Zone.KARKH],
      });

      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw conflict error if user already exists', async () => {
      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Test@1234',
          name: 'Test User',
          role: UserRole.SHOP_OWNER,
        })
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Test@1234', 10);
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: UserRole.SHOP_OWNER,
        zones: [Zone.KARKH],
        isActive: true,
      };

      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockFastify.prisma!.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Test@1234',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw unauthorized error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('Test@1234', 10);
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
      };

      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw forbidden error for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('Test@1234', 10);
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: false,
      };

      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'Test@1234',
        })
      ).rejects.toThrow('Account is deactivated');
    });
  });

  describe('sendOtp', () => {
    it('should send OTP to valid phone number', async () => {
      const mockUser = {
        id: 'user-id',
        phone: '+9647701234567',
      };

      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockFastify.prisma!.user.update as jest.Mock).mockResolvedValue(mockUser);

      await authService.sendOtp('+9647701234567');

      expect(mockFastify.prisma!.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: expect.objectContaining({
          otpCode: expect.any(String),
          otpExpiry: expect.any(Date),
        }),
      });
    });

    it('should throw not found error for non-existent phone', async () => {
      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.sendOtp('+9647701234567')
      ).rejects.toThrow('User with this phone number not found');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.SHOP_OWNER,
        zones: [Zone.KARKH],
        refreshToken: 'valid-refresh-token',
        isActive: true,
      };

      (mockFastify.jwt!.verify as jest.Mock).mockReturnValue({
        userId: 'user-id',
        email: 'test@example.com',
        role: UserRole.SHOP_OWNER,
        zones: [Zone.KARKH],
      });
      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockFastify.prisma!.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw unauthorized error for invalid refresh token', async () => {
      (mockFastify.jwt!.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const hashedPassword = await bcrypt.hash('OldPassword@123', 10);
      const mockUser = {
        id: 'user-id',
        password: hashedPassword,
      };

      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockFastify.prisma!.user.update as jest.Mock).mockResolvedValue(mockUser);

      await authService.updatePassword('user-id', {
        currentPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
      });

      expect(mockFastify.prisma!.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: expect.objectContaining({
          password: expect.any(String),
        }),
      });
    });

    it('should throw error for incorrect current password', async () => {
      const hashedPassword = await bcrypt.hash('OldPassword@123', 10);
      const mockUser = {
        id: 'user-id',
        password: hashedPassword,
      };

      (mockFastify.prisma!.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.updatePassword('user-id', {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword@123',
        })
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});