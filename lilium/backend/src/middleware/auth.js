"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.authorize = authorize;
exports.requireZone = requireZone;
exports.requireAdmin = requireAdmin;
exports.requireOwnerOrAdmin = requireOwnerOrAdmin;
const client_1 = require("@prisma/client");
/**
 * Authenticate request - verifies JWT token
 */
async function authenticate(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' });
    }
}
/**
 * Check if user has required role
 */
function requireRole(...roles) {
    return async function (request, reply) {
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
function authorize(roles) {
    return async function (request, reply) {
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
function requireZone(...zones) {
    return async function (request, reply) {
        if (!request.user) {
            return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
        }
        // Super admin has access to all zones
        if (request.user.role === client_1.UserRole.SUPER_ADMIN) {
            return;
        }
        // Check if user has access to at least one required zone
        const hasAccess = zones.some(zone => request.user.zones.includes(zone));
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
async function requireAdmin(request, reply) {
    if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
    }
    const adminRoles = [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN];
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
function requireOwnerOrAdmin(getUserId) {
    return async function (request, reply) {
        if (!request.user) {
            return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
        }
        const resourceUserId = getUserId(request);
        const isOwner = request.user.userId === resourceUserId;
        const adminRoles = [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN];
        const isAdmin = adminRoles.includes(request.user.role);
        if (!isOwner && !isAdmin) {
            return reply.code(403).send({
                error: 'Forbidden',
                message: 'You do not have access to this resource'
            });
        }
    };
}
//# sourceMappingURL=auth.js.map