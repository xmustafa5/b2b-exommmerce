import { FastifyInstance } from 'fastify';
import { User, UserRole, Zone, Company } from '@prisma/client';
export interface CreateVendorInput {
    email: string;
    password: string;
    name: string;
    businessName?: string;
    phone?: string;
    companyId: string;
    zones?: Zone[];
}
export interface CreateShopOwnerInput {
    email: string;
    password: string;
    name: string;
    businessName: string;
    phone: string;
    zone: Zone;
    address?: {
        street: string;
        area: string;
        building?: string;
        landmark?: string;
        latitude?: number;
        longitude?: number;
    };
}
export interface InternalLoginInput {
    email: string;
    password: string;
}
export declare class InternalUserService {
    private fastify;
    constructor(fastify: FastifyInstance);
    /**
     * Internal team login - For Lilium team only
     */
    internalLogin(data: InternalLoginInput): Promise<{
        authenticated: boolean;
        token: string;
    }>;
    /**
     * Create a vendor user (for dashboard access)
     */
    createVendor(data: CreateVendorInput): Promise<{
        user: Partial<User>;
        credentials: {
            email: string;
            password: string;
        };
    }>;
    /**
     * Create a company manager user (for dashboard access)
     */
    createCompanyManager(data: CreateVendorInput): Promise<{
        user: Partial<User>;
        credentials: {
            email: string;
            password: string;
        };
    }>;
    /**
     * Create a shop owner user (for mobile access)
     */
    createShopOwner(data: CreateShopOwnerInput): Promise<{
        user: Partial<User>;
        credentials: {
            email: string;
            password: string;
        };
    }>;
    /**
     * List all companies (for vendor assignment)
     */
    listCompanies(): Promise<Company[]>;
    /**
     * Create a new company
     */
    createCompany(data: {
        name: string;
        nameAr?: string;
        description?: string;
        descriptionAr?: string;
        logo?: string;
        email?: string;
        phone?: string;
        address?: string;
        zones: Zone[];
    }): Promise<Company>;
    /**
     * Generate a random secure password
     */
    generatePassword(length?: number): string;
    /**
     * List users by role
     */
    listUsers(role?: UserRole): Promise<Partial<User>[]>;
    /**
     * Deactivate a user
     */
    deactivateUser(userId: string): Promise<void>;
    /**
     * Activate a user
     */
    activateUser(userId: string): Promise<void>;
}
//# sourceMappingURL=internal-user.service.d.ts.map