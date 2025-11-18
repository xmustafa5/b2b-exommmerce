import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, Zone } from '@prisma/client';
import { JWTPayload } from '../types/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * Authenticate request - verifies JWT token
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' });
  }
}

/**
 * Check if user has required role
 */
export function requireRole(...roles: UserRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
    }

    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
  };
}

/**
 * Check if user has access to specific zone
 */
export function requireZone(...zones: Zone[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
    }

    // Super admin has access to all zones
    if (request.user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Check if user has access to at least one required zone
    const hasAccess = zones.some(zone => request.user!.zones.includes(zone));

    if (!hasAccess) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Access denied. Required zone: ${zones.join(' or ')}`
      });
    }
  };
}

/**
 * Check if user is admin (SUPER_ADMIN or LOCATION_ADMIN)
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
  }

  const adminRoles = [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN];
  if (!adminRoles.includes(request.user.role)) {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
}

/**
 * Check if user owns the resource or is admin
 */
export function requireOwnerOrAdmin(getUserId: (request: FastifyRequest) => string) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
    }

    const resourceUserId = getUserId(request);
    const isOwner = request.user.userId === resourceUserId;
    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN].includes(request.user.role);

    if (!isOwner && !isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have access to this resource'
      });
    }
  };
}