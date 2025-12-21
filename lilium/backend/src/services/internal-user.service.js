"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalUserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
class InternalUserService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    /**
     * Internal team login - For Lilium team only
     */
    async internalLogin(data) {
        const { email, password } = data;
        // Check if this is the Lilium team account
        if (email !== 'lilium@lilium.iq') {
            throw this.fastify.httpErrors.unauthorized('Invalid credentials');
        }
        // Verify password (in production, this should be in database)
        const validPassword = await bcrypt_1.default.compare(password, await bcrypt_1.default.hash('lilium@123', 10));
        // For now, we'll do a simple check
        if (password !== 'lilium@123') {
            throw this.fastify.httpErrors.unauthorized('Invalid credentials');
        }
        // Generate internal API token
        const token = this.fastify.jwt.sign({
            email: 'lilium@lilium.iq',
            role: 'INTERNAL_ADMIN',
            isInternal: true
        }, { expiresIn: '8h' });
        return {
            authenticated: true,
            token
        };
    }
    /**
     * Create a vendor user (for dashboard access)
     */
    async createVendor(data) {
        const { password, zones = [], ...userData } = data;
        // Check if user already exists
        const existingUser = await this.fastify.prisma.user.findUnique({
            where: { email: userData.email },
        });
        if (existingUser) {
            throw this.fastify.httpErrors.conflict('User with this email already exists');
        }
        // Verify company exists
        const company = await this.fastify.prisma.company.findUnique({
            where: { id: data.companyId },
        });
        if (!company) {
            throw this.fastify.httpErrors.notFound('Company not found');
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create vendor user
        const user = await this.fastify.prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
                role: client_1.UserRole.VENDOR,
                zones: zones,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                businessName: true,
                phone: true,
                role: true,
                zones: true,
                companyId: true,
                createdAt: true,
            },
        });
        this.fastify.log.info(`Vendor user created: ${user.email}`);
        return {
            user,
            credentials: {
                email: userData.email,
                password: password
            }
        };
    }
    /**
     * Create a company manager user (for dashboard access)
     */
    async createCompanyManager(data) {
        const { password, zones = [], ...userData } = data;
        // Check if user already exists
        const existingUser = await this.fastify.prisma.user.findUnique({
            where: { email: userData.email },
        });
        if (existingUser) {
            throw this.fastify.httpErrors.conflict('User with this email already exists');
        }
        // Verify company exists
        const company = await this.fastify.prisma.company.findUnique({
            where: { id: data.companyId },
        });
        if (!company) {
            throw this.fastify.httpErrors.notFound('Company not found');
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create company manager user
        const user = await this.fastify.prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
                role: client_1.UserRole.COMPANY_MANAGER,
                zones: zones,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                businessName: true,
                phone: true,
                role: true,
                zones: true,
                companyId: true,
                createdAt: true,
            },
        });
        this.fastify.log.info(`Company Manager created: ${user.email}`);
        return {
            user,
            credentials: {
                email: userData.email,
                password: password
            }
        };
    }
    /**
     * Create a shop owner user (for mobile access)
     */
    async createShopOwner(data) {
        const { password, address, zone, ...userData } = data;
        // Check if user already exists
        const existingUser = await this.fastify.prisma.user.findUnique({
            where: { email: userData.email },
        });
        if (existingUser) {
            throw this.fastify.httpErrors.conflict('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create shop owner user with address in a transaction
        const result = await this.fastify.prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    ...userData,
                    password: hashedPassword,
                    role: client_1.UserRole.SHOP_OWNER,
                    zones: [zone],
                    isActive: true,
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
            // Create default address if provided
            if (address) {
                await tx.address.create({
                    data: {
                        userId: user.id,
                        name: 'Default',
                        ...address,
                        zone,
                        phone: userData.phone,
                        isDefault: true,
                    },
                });
            }
            return user;
        });
        this.fastify.log.info(`Shop Owner created: ${result.email}`);
        return {
            user: result,
            credentials: {
                email: userData.email,
                password: password
            }
        };
    }
    /**
     * List all companies (for vendor assignment)
     */
    async listCompanies() {
        return await this.fastify.prisma.company.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    /**
     * Create a new company
     */
    async createCompany(data) {
        return await this.fastify.prisma.company.create({
            data: {
                ...data,
                isActive: true,
            },
        });
    }
    /**
     * Generate a random secure password
     */
    generatePassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }
    /**
     * List users by role
     */
    async listUsers(role) {
        const where = role ? { role } : {};
        return await this.fastify.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                businessName: true,
                phone: true,
                role: true,
                zones: true,
                companyId: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Deactivate a user
     */
    async deactivateUser(userId) {
        await this.fastify.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    }
    /**
     * Activate a user
     */
    async activateUser(userId) {
        await this.fastify.prisma.user.update({
            where: { id: userId },
            data: { isActive: true },
        });
    }
}
exports.InternalUserService = InternalUserService;
//# sourceMappingURL=internal-user.service.js.map