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
 * Helper type for zone filter result
 */
export interface ZoneFilterResult {
  zones: Zone[] | undefined;
  shouldFilter: boolean;
}

/**
 * Get zone filter based on user role
 * - SUPER_ADMIN: No filter (access to all zones)
 * - LOCATION_ADMIN: Filter by assigned zones
 * - SHOP_OWNER: Filter by assigned zones
 *
 * @param user - JWT payload with user info
 * @param requestedZone - Optional zone from request query
 * @returns ZoneFilterResult with zones to filter by
 */
export function getZoneFilter(user: JWTPayload, requestedZone?: Zone): ZoneFilterResult {
  // Super admin has access to all zones - no filter needed
  if (user.role === UserRole.SUPER_ADMIN) {
    // If a zone is requested, filter by it; otherwise, no filter
    return {
      zones: requestedZone ? [requestedZone] : undefined,
      shouldFilter: !!requestedZone,
    };
  }

  // For LOCATION_ADMIN and SHOP_OWNER, filter by their zones
  const userZones = user.zones || [];

  // If a specific zone is requested, validate access
  if (requestedZone) {
    if (!userZones.includes(requestedZone)) {
      // User doesn't have access to requested zone - return empty to filter out all
      return { zones: [], shouldFilter: true };
    }
    return { zones: [requestedZone], shouldFilter: true };
  }

  // No specific zone requested - filter by all user's zones
  return { zones: userZones, shouldFilter: true };
}

/**
 * Validate if user has access to a specific zone
 * @param user - JWT payload with user info
 * @param zone - Zone to check access for
 * @returns true if user has access, false otherwise
 */
export function hasZoneAccess(user: JWTPayload, zone: Zone): boolean {
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  return user.zones?.includes(zone) ?? false;
}

/**
 * Get the zones a user can access
 * @param user - JWT payload with user info
 * @returns Array of zones the user can access, or undefined for all zones
 */
export function getUserAccessibleZones(user: JWTPayload): Zone[] | undefined {
  if (user.role === UserRole.SUPER_ADMIN) {
    return undefined; // All zones
  }
  return user.zones || [];
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
 * Authorize - alias for requireRole for backward compatibility
 */
export function authorize(roles: UserRole[]) {
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

  const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN];
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
    const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN];
    const isAdmin = adminRoles.includes(request.user.role);

    if (!isOwner && !isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have access to this resource'
      });
    }
  };
}