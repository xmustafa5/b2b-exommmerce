import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { User, UserRole, Zone, Prisma } from '@prisma/client';
import {
  RegisterInput,
  MobileRegisterInput,
  LoginInput,
  OtpLoginInput,
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
   * Register a new user
   */
  async register(data: RegisterInput): Promise<{ user: Partial<User>; tokens: JWTTokens }> {
    const { password, zones = [], ...userData } = data;

    // Check if user already exists
    const existingUser = await this.fastify.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw this.fastify.httpErrors.conflict('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.fastify.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        zones: zones as Zone[],
      },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        phone: true,
        role: true,
        zones: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.fastify.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return { user, tokens };
  }

  /**
   * Register a new shop owner (mobile)
   */
  async registerMobile(data: MobileRegisterInput): Promise<{ user: Partial<User>; tokens: JWTTokens }> {
    const { address, zone, ...registerData } = data;

    // Register user with SHOP_OWNER role
    const result = await this.register({
      ...registerData,
      role: UserRole.SHOP_OWNER,
      zones: [zone],
    });

    // Create default address if provided
    if (address && result.user.id) {
      await this.fastify.prisma.address.create({
        data: {
          userId: result.user.id,
          name: 'Default',
          ...address,
          zone,
          phone: data.phone || '',
          isDefault: true,
        },
      });
    }

    return result;
  }

  /**
   * Login user with email and password
   */
  async login(data: LoginInput): Promise<{ user: Partial<User>; tokens: JWTTokens }> {
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
   * Send OTP to phone number
   */
  async sendOtp(phone: string): Promise<void> {
    // Find or create user with phone
    let user = await this.fastify.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw this.fastify.httpErrors.notFound('User with this phone number not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP
    await this.fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry,
      },
    });

    // TODO: Send OTP via SMS service (Twilio, etc.)
    // For development, log the OTP
    this.fastify.log.info(`OTP for ${phone}: ${otp}`);
  }

  /**
   * Login with OTP
   */
  async loginWithOtp(data: OtpLoginInput): Promise<{ user: Partial<User>; tokens: JWTTokens }> {
    const { phone, otp } = data;

    // Find user
    const user = await this.fastify.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        phone: true,
        role: true,
        zones: true,
        isActive: true,
        otpCode: true,
        otpExpiry: true,
      },
    });

    if (!user) {
      throw this.fastify.httpErrors.unauthorized('Invalid phone or OTP');
    }

    if (!user.isActive) {
      throw this.fastify.httpErrors.forbidden('Account is deactivated');
    }

    // Verify OTP
    if (!user.otpCode || user.otpCode !== otp) {
      throw this.fastify.httpErrors.unauthorized('Invalid OTP');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw this.fastify.httpErrors.unauthorized('OTP has expired');
    }

    // Clear OTP
    await this.fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiry: null,
        phoneVerified: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.fastify.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Remove sensitive data
    const { otpCode, otpExpiry, ...userWithoutOtp } = user;
    return { user: userWithoutOtp, tokens };
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