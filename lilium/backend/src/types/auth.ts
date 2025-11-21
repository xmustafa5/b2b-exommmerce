import { z } from 'zod';
import { UserRole, Zone } from '@prisma/client';

// Login schema - Used for both dashboard and mobile login
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
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
export type LoginInput = z.infer<typeof loginSchema>;
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