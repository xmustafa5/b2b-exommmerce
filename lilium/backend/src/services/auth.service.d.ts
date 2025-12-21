import { FastifyInstance } from 'fastify';
import { User } from '@prisma/client';
import { LoginInput, JWTTokens, RequestPasswordResetInput, ResetPasswordInput, UpdatePasswordInput } from '../types/auth';
export declare class AuthService {
    private fastify;
    constructor(fastify: FastifyInstance);
    /**
     * Dashboard Login - For VENDOR, COMPANY_MANAGER, ADMIN, and SUPER_ADMIN roles
     * Users are created by admin/super-admin through dashboard
     */
    loginDashboard(data: LoginInput): Promise<{
        user: Partial<User>;
        tokens: JWTTokens;
    }>;
    /**
     * Mobile Login - For SHOP_OWNER role only
     * Shop owners are created directly in database or through admin dashboard
     */
    loginMobile(data: LoginInput): Promise<{
        user: Partial<User>;
        tokens: JWTTokens;
    }>;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string): Promise<JWTTokens>;
    /**
     * Request password reset
     */
    requestPasswordReset(data: RequestPasswordResetInput): Promise<void>;
    /**
     * Reset password with token
     */
    resetPassword(data: ResetPasswordInput): Promise<void>;
    /**
     * Update user password
     */
    updatePassword(userId: string, data: UpdatePasswordInput): Promise<void>;
    /**
     * Logout user
     */
    logout(userId: string): Promise<void>;
    /**
     * Generate JWT tokens
     */
    private generateTokens;
}
//# sourceMappingURL=auth.service.d.ts.map