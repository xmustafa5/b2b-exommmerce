import { FastifyInstance } from 'fastify';
import { UserRole, Zone } from '@prisma/client';
interface AdminCreateInput {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: UserRole;
    zones: Zone[];
}
interface AdminUpdateInput {
    name?: string;
    phone?: string;
    isActive?: boolean;
    zones?: Zone[];
}
interface AdminListFilters {
    role?: UserRole;
    zone?: Zone;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class AdminService {
    private fastify;
    constructor(fastify: FastifyInstance);
    /**
     * Get all admins (SUPER_ADMIN and LOCATION_ADMIN users)
     */
    getAdmins(filters?: AdminListFilters): Promise<{
        admins: {
            email: string;
            name: string;
            id: string;
            phone: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            zones: import(".prisma/client").$Enums.Zone[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get a single admin by ID
     */
    getAdminById(id: string): Promise<{
        email: string;
        name: string;
        id: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Create a new admin (LOCATION_ADMIN only - SUPER_ADMIN creation should be restricted)
     */
    createAdmin(data: AdminCreateInput, createdByRole: UserRole): Promise<{
        email: string;
        name: string;
        id: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
    }>;
    /**
     * Update an admin
     */
    updateAdmin(id: string, data: AdminUpdateInput, updatedByRole: UserRole): Promise<{
        email: string;
        name: string;
        id: string;
        phone: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        updatedAt: Date;
    }>;
    /**
     * Update admin zones
     */
    updateAdminZones(id: string, zones: Zone[], updatedByRole: UserRole): Promise<{
        email: string;
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        zones: import(".prisma/client").$Enums.Zone[];
        updatedAt: Date;
    }>;
    /**
     * Deactivate an admin
     */
    deactivateAdmin(id: string, deactivatedByRole: UserRole): Promise<{
        email: string;
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    /**
     * Activate an admin
     */
    activateAdmin(id: string, activatedByRole: UserRole): Promise<{
        email: string;
        name: string;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    /**
     * Reset admin password
     */
    resetAdminPassword(id: string, newPassword: string, resetByRole: UserRole): Promise<{
        message: string;
    }>;
    /**
     * Get admin statistics
     */
    getAdminStats(): Promise<{
        totalAdmins: number;
        superAdmins: number;
        locationAdmins: number;
        activeAdmins: number;
        inactiveAdmins: number;
        adminsByZone: {
            zones: import(".prisma/client").$Enums.Zone[];
            count: number;
        }[];
    }>;
    /**
     * Get shop owners list (for admin management)
     */
    getShopOwners(filters?: {
        zone?: Zone;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        shopOwners: {
            email: string;
            name: string;
            id: string;
            businessName: string;
            phone: string;
            isActive: boolean;
            zones: import(".prisma/client").$Enums.Zone[];
            createdAt: Date;
            _count: {
                orders: number;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export {};
//# sourceMappingURL=admin.service.d.ts.map