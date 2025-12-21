"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
class AdminService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    /**
     * Get all admins (SUPER_ADMIN and LOCATION_ADMIN users)
     */
    async getAdmins(filters = {}) {
        const { role, zone, isActive, search, page = 1, limit = 20 } = filters;
        const where = {
            role: role ? role : { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
        };
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (zone) {
            where.zones = { has: zone };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [admins, total] = await Promise.all([
            this.fastify.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    zones: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.fastify.prisma.user.count({ where }),
        ]);
        return {
            admins,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get a single admin by ID
     */
    async getAdminById(id) {
        const admin = await this.fastify.prisma.user.findFirst({
            where: {
                id,
                role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                zones: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!admin) {
            throw this.fastify.httpErrors.notFound('Admin not found');
        }
        return admin;
    }
    /**
     * Create a new admin (LOCATION_ADMIN only - SUPER_ADMIN creation should be restricted)
     */
    async createAdmin(data, createdByRole) {
        // Only SUPER_ADMIN can create other admins
        if (createdByRole !== client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can create new admins');
        }
        // Prevent creating SUPER_ADMIN through API for security
        if (data.role === client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.forbidden('SUPER_ADMIN accounts cannot be created through API');
        }
        // Check if email already exists
        const existingUser = await this.fastify.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw this.fastify.httpErrors.conflict('Email already exists');
        }
        // Check if phone already exists
        if (data.phone) {
            const existingPhone = await this.fastify.prisma.user.findUnique({
                where: { phone: data.phone },
            });
            if (existingPhone) {
                throw this.fastify.httpErrors.conflict('Phone number already exists');
            }
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(data.password, 12);
        const admin = await this.fastify.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: data.role,
                zones: data.zones,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                zones: true,
                isActive: true,
                createdAt: true,
            },
        });
        return admin;
    }
    /**
     * Update an admin
     */
    async updateAdmin(id, data, updatedByRole) {
        const admin = await this.fastify.prisma.user.findFirst({
            where: {
                id,
                role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
            },
        });
        if (!admin) {
            throw this.fastify.httpErrors.notFound('Admin not found');
        }
        // Prevent LOCATION_ADMIN from modifying SUPER_ADMIN
        if (admin.role === client_1.UserRole.SUPER_ADMIN && updatedByRole !== client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.forbidden('Cannot modify SUPER_ADMIN account');
        }
        const updated = await this.fastify.prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                phone: data.phone,
                isActive: data.isActive,
                zones: data.zones,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                zones: true,
                isActive: true,
                updatedAt: true,
            },
        });
        return updated;
    }
    /**
     * Update admin zones
     */
    async updateAdminZones(id, zones, updatedByRole) {
        const admin = await this.fastify.prisma.user.findFirst({
            where: {
                id,
                role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
            },
        });
        if (!admin) {
            throw this.fastify.httpErrors.notFound('Admin not found');
        }
        // Prevent modifying SUPER_ADMIN zones (they have access to all)
        if (admin.role === client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.badRequest('SUPER_ADMIN has access to all zones');
        }
        if (updatedByRole !== client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can modify zones');
        }
        const updated = await this.fastify.prisma.user.update({
            where: { id },
            data: { zones },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                zones: true,
                updatedAt: true,
            },
        });
        return updated;
    }
    /**
     * Deactivate an admin
     */
    async deactivateAdmin(id, deactivatedByRole) {
        const admin = await this.fastify.prisma.user.findFirst({
            where: {
                id,
                role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
            },
        });
        if (!admin) {
            throw this.fastify.httpErrors.notFound('Admin not found');
        }
        // Prevent deactivating SUPER_ADMIN
        if (admin.role === client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.forbidden('Cannot deactivate SUPER_ADMIN account');
        }
        if (deactivatedByRole !== client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can deactivate admins');
        }
        const updated = await this.fastify.prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
        });
        return updated;
    }
    /**
     * Activate an admin
     */
    async activateAdmin(id, activatedByRole) {
        const admin = await this.fastify.prisma.user.findFirst({
            where: {
                id,
                role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
            },
        });
        if (!admin) {
            throw this.fastify.httpErrors.notFound('Admin not found');
        }
        if (activatedByRole !== client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can activate admins');
        }
        const updated = await this.fastify.prisma.user.update({
            where: { id },
            data: { isActive: true },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
        });
        return updated;
    }
    /**
     * Reset admin password
     */
    async resetAdminPassword(id, newPassword, resetByRole) {
        const admin = await this.fastify.prisma.user.findFirst({
            where: {
                id,
                role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
            },
        });
        if (!admin) {
            throw this.fastify.httpErrors.notFound('Admin not found');
        }
        // Only SUPER_ADMIN can reset passwords
        if (resetByRole !== client_1.UserRole.SUPER_ADMIN) {
            throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can reset admin passwords');
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 12);
        await this.fastify.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        return { message: 'Password reset successfully' };
    }
    /**
     * Get admin statistics
     */
    async getAdminStats() {
        const [totalAdmins, superAdmins, locationAdmins, activeAdmins, inactiveAdmins] = await Promise.all([
            this.fastify.prisma.user.count({
                where: { role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] } },
            }),
            this.fastify.prisma.user.count({
                where: { role: client_1.UserRole.SUPER_ADMIN },
            }),
            this.fastify.prisma.user.count({
                where: { role: client_1.UserRole.LOCATION_ADMIN },
            }),
            this.fastify.prisma.user.count({
                where: {
                    role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
                    isActive: true,
                },
            }),
            this.fastify.prisma.user.count({
                where: {
                    role: { in: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.LOCATION_ADMIN] },
                    isActive: false,
                },
            }),
        ]);
        // Get admins by zone
        const adminsByZone = await this.fastify.prisma.user.groupBy({
            by: ['zones'],
            where: { role: client_1.UserRole.LOCATION_ADMIN },
            _count: true,
        });
        return {
            totalAdmins,
            superAdmins,
            locationAdmins,
            activeAdmins,
            inactiveAdmins,
            adminsByZone: adminsByZone.map(item => ({
                zones: item.zones,
                count: item._count,
            })),
        };
    }
    /**
     * Get shop owners list (for admin management)
     */
    async getShopOwners(filters = {}) {
        const { zone, search, page = 1, limit = 20 } = filters;
        const where = {
            role: client_1.UserRole.SHOP_OWNER,
        };
        if (zone) {
            where.zones = { has: zone };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { businessName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [shopOwners, total] = await Promise.all([
            this.fastify.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    businessName: true,
                    phone: true,
                    zones: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: { orders: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.fastify.prisma.user.count({ where }),
        ]);
        return {
            shopOwners,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map