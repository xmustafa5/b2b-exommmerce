import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { User, UserRole, Zone, Prisma } from '@prisma/client';
import {
  LoginInput,
  JWTPayload,
  JWTTokens,
  RequestPasswordResetInput,
  ResetPasswordInput,
  UpdatePasswordInput,
} from '../types/auth';
import crypto from 'crypto';

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Dashboard Login - For VENDOR, COMPANY_MANAGER, ADMIN, and SUPER_ADMIN roles
   * Users are created by admin/super-admin through dashboard
   */
  async loginDashboard(data: LoginInput): Promise<{ user: Partial<User>; tokens: JWTTokens }> {
    const { email, password } = data;

    // Find user
    const user = await this.fastify.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        businessName: true,
        phone: true,
        role: true,
        zones: true,
        isActive: true,
        companyId: true,
      },
    });

    if (!user) {
      throw this.fastify.httpErrors.unauthorized('Invalid email or password');
    }

    // Verify user has dashboard access (VENDOR, COMPANY_MANAGER, ADMIN, SUPER_ADMIN)
    const dashboardRoles: UserRole[] = [
      UserRole.VENDOR,
      UserRole.COMPANY_MANAGER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN
    ];

    if (!dashboardRoles.includes(user.role)) {
      throw this.fastify.httpErrors.forbidden('You do not have access to the dashboard. Please use the mobile app.');
    }

    if (!user.isActive) {
      throw this.fastify.httpErrors.forbidden('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw this.fastify.httpErrors.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.fastify.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Mobile Login - For SHOP_OWNER role only
   * Shop owners are created directly in database or through admin dashboard
   */
  async loginMobile(data: LoginInput): Promise<{ user: Partial<User>; tokens: JWTTokens }> {
    const { email, password } = data;

    // Find user
    const user = await this.fastify.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        businessName: true,
        phone: true,
        role: true,
        zones: true,
        isActive: true,
      },
    });

    if (!user) {
      throw this.fastify.httpErrors.unauthorized('Invalid email or password');
    }

    // Verify user is a SHOP_OWNER (mobile user)
    if (user.role !== UserRole.SHOP_OWNER) {
      throw this.fastify.httpErrors.forbidden('You do not have access to the mobile app. Please use the dashboard.');
    }

    if (!user.isActive) {
      throw this.fastify.httpErrors.forbidden('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw this.fastify.httpErrors.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.fastify.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<JWTTokens> {
    try {
      // Verify refresh token
      const decoded = this.fastify.jwt.verify(refreshToken) as JWTPayload;

      // Find user and verify refresh token
      const user = await this.fastify.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          zones: true,
          refreshToken: true,
          isActive: true,
        },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw this.fastify.httpErrors.unauthorized('Invalid refresh token');
      }

      if (!user.isActive) {
        throw this.fastify.httpErrors.forbidden('Account is deactivated');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Save new refresh token
      await this.fastify.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch (error) {
      throw this.fastify.httpErrors.unauthorized('Invalid refresh token');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: RequestPasswordResetInput): Promise<void> {
    const { email } = data;

    const user = await this.fastify.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await this.fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send reset email
    // For development, log the token
    this.fastify.log.info(`Password reset token for ${email}: ${resetToken}`);
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordInput): Promise<void> {
    const { token, password } = data;

    // Find user with valid token
    const user = await this.fastify.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw this.fastify.httpErrors.badRequest('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await this.fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, data: UpdatePasswordInput): Promise<void> {
    const { currentPassword, newPassword } = data;

    // Get user
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw this.fastify.httpErrors.notFound('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw this.fastify.httpErrors.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.fastify.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    // Clear refresh token
    await this.fastify.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: Partial<User> & { id: string; email: string; role: UserRole; zones: Zone[] }): Promise<JWTTokens> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      zones: user.zones,
    };

    const accessToken = this.fastify.jwt.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    const refreshToken = this.fastify.jwt.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }
}