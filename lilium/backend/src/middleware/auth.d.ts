import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, Zone } from '@prisma/client';
import { JWTPayload } from '../types/auth';
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JWTPayload;
        user: JWTPayload;
    }
}
/**
 * Authenticate request - verifies JWT token
 */
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
/**
 * Check if user has required role
 */
export declare function requireRole(...roles: UserRole[]): (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
/**
 * Authorize - alias for requireRole for backward compatibility
 */
export declare function authorize(roles: UserRole[]): (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
/**
 * Check if user has access to specific zone
 */
export declare function requireZone(...zones: Zone[]): (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
/**
 * Check if user is admin (SUPER_ADMIN or LOCATION_ADMIN)
 */
export declare function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * Check if user owns the resource or is admin
 */
export declare function requireOwnerOrAdmin(getUserId: (request: FastifyRequest) => string): (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
//# sourceMappingURL=auth.d.ts.map