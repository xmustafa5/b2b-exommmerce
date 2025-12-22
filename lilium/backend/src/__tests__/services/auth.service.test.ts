import { AuthService } from '../../services/auth.service';
import { UserRole, Zone } from '@prisma/client';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockFastify: any;
  let mockPrisma: any;

  const mockAdminUser = {
    id: 'admin1',
    email: 'admin@example.com',
    password: 'hashedPassword123',
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
    password: 'hashedPassword123',
    name: 'Shop Owner',
    businessName: 'My Shop',
    phone: '0987654321',
    role: UserRole.SHOP_OWNER,
    zones: [Zone.KARKH],
    isActive: true,
    refreshToken: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    mockFastify = {
      prisma: mockPrisma,
      jwt: {
        sign: jest.fn().mockReturnValue('mockAccessToken'),
        verify: jest.fn(),
      },
      httpErrors: {
        unauthorized: (msg: string) => {
          const error = new Error(msg);
          (error as any).statusCode = 401;
          return error;
        },
        forbidden: (msg: string) => {
          const error = new Error(msg);
          (error as any).statusCode = 403;
          return error;
        },
        badRequest: (msg: string) => {
          const error = new Error(msg);
          (error as any).statusCode = 400;
          return error;
        },
        notFound: (msg: string) => {
          const error = new Error(msg);
          (error as any).statusCode = 404;
          return error;
        },
      },
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
    };

    authService = new AuthService(mockFastify);
  });

  describe('loginDashboard', () => {
    it('should successfully login admin user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.user.update.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.loginDashboard({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('admin@example.com');
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.user).not.toHaveProperty('password');
    });

    it('should successfully login vendor user', async () => {
      const vendorUser = { ...mockAdminUser, role: UserRole.VENDOR };
      mockPrisma.user.findUnique.mockResolvedValue(vendorUser);
      mockPrisma.user.update.mockResolvedValue(vendorUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.loginDashboard({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(result.user.role).toBe(UserRole.VENDOR);
    });

    it('should throw error for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.loginDashboard({
          email: 'invalid@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.loginDashboard({
          email: 'admin@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when shop owner tries dashboard login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockShopOwner);

      await expect(
        authService.loginDashboard({
          email: 'shop@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('You do not have access to the dashboard');
    });

    it('should throw error when account is deactivated', async () => {
      const inactiveUser = { ...mockAdminUser, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(
        authService.loginDashboard({
          email: 'admin@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Account is deactivated');
    });
  });

  describe('loginMobile', () => {
    it('should successfully login shop owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockShopOwner);
      mockPrisma.user.update.mockResolvedValue(mockShopOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.loginMobile({
        email: 'shop@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('shop@example.com');
      expect(result.user.role).toBe(UserRole.SHOP_OWNER);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.loginMobile({
          email: 'invalid@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockShopOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.loginMobile({
          email: 'shop@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when admin tries mobile login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);

      await expect(
        authService.loginMobile({
          email: 'admin@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('You do not have access to the mobile app');
    });

    it('should throw error when account is deactivated', async () => {
      const inactiveUser = { ...mockShopOwner, isActive: false };
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(
        authService.loginMobile({
          email: 'shop@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Account is deactivated');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const userWithRefreshToken = {
        ...mockAdminUser,
        refreshToken: 'validRefreshToken',
      };
      mockFastify.jwt.verify.mockReturnValue({ userId: 'admin1' });
      mockPrisma.user.findUnique.mockResolvedValue(userWithRefreshToken);
      mockPrisma.user.update.mockResolvedValue(userWithRefreshToken);

      const result = await authService.refreshToken('validRefreshToken');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should throw error for invalid refresh token', async () => {
      mockFastify.jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalidToken')).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error when refresh token does not match', async () => {
      mockFastify.jwt.verify.mockReturnValue({ userId: 'admin1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockAdminUser,
        refreshToken: 'differentToken',
      });

      await expect(authService.refreshToken('wrongToken')).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error when user not found', async () => {
      mockFastify.jwt.verify.mockReturnValue({ userId: 'admin1' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken('someToken')).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should generate reset token for valid user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.user.update.mockResolvedValue(mockAdminUser);

      await authService.requestPasswordReset({ email: 'admin@example.com' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'admin1' },
          data: expect.objectContaining({
            resetToken: expect.any(String),
            resetTokenExpiry: expect.any(Date),
          }),
        })
      );
    });

    it('should not throw error for non-existent email (security)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Should not throw - don't reveal if email exists
      await expect(
        authService.requestPasswordReset({ email: 'nonexistent@example.com' })
      ).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const userWithResetToken = {
        ...mockAdminUser,
        resetToken: 'validResetToken',
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour in future
      };
      mockPrisma.user.findFirst.mockResolvedValue(userWithResetToken);
      mockPrisma.user.update.mockResolvedValue(mockAdminUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await authService.resetPassword({
        token: 'validResetToken',
        password: 'newPassword123',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'newHashedPassword',
            resetToken: null,
            resetTokenExpiry: null,
          }),
        })
      );
    });

    it('should throw error for invalid or expired token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: 'invalidToken',
          password: 'newPassword123',
        })
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      mockPrisma.user.update.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await authService.updatePassword('admin1', {
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { password: 'newHashedPassword' },
        })
      );
    });

    it('should throw error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.updatePassword('nonexistent', {
          currentPassword: 'current',
          newPassword: 'new',
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error for incorrect current password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.updatePassword('admin1', {
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123',
        })
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      mockPrisma.user.update.mockResolvedValue(mockAdminUser);

      await authService.logout('admin1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin1' },
        data: { refreshToken: null },
      });
    });
  });
});
