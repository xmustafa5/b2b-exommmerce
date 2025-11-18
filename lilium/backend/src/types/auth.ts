import { z } from 'zod';
import { UserRole, Zone } from '@prisma/client';

// Registration schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  businessName: z.string().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number').optional(),
  role: z.nativeEnum(UserRole).default('SHOP_OWNER'),
  zones: z.array(z.nativeEnum(Zone)).optional(),
});

export const mobileRegisterSchema = registerSchema.extend({
  businessName: z.string().min(2, 'Business name is required'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Phone number is required'),
  zone: z.nativeEnum(Zone),
  address: z.object({
    street: z.string(),
    area: z.string(),
    building: z.string().optional(),
    landmark: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

// OTP login schema (for mobile)
export const otpLoginSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Request OTP schema
export const requestOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
});

// Password reset schema
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// Update password schema
export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type MobileRegisterInput = z.infer<typeof mobileRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpLoginInput = z.infer<typeof otpLoginSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

// JWT Payload types
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  zones: Zone[];
}

export interface JWTTokens {
  accessToken: string;
  refreshToken: string;
}