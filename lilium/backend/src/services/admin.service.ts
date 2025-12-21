import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { User, UserRole, Zone, Prisma } from '@prisma/client';

// Types for admin management
export interface CreateAdminInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  zones: Zone[];
}

export interface UpdateAdminInput {
  name?: string;
  phone?: string;
  zones?: Zone[];
  isActive?: boolean;
}

export interface AdminFilters {
  role?: UserRole;
  zone?: Zone;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminListResult {
  admins: Partial<User>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AdminService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Get all admin users (SUPER_ADMIN and LOCATION_ADMIN)
   */
  async getAdmins(filters: AdminFilters = {}): Promise<AdminListResult> {
    const { role, zone, isActive, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: role ? role : { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
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
        { phone: { contains: search, mode: 'insensitive' } },
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.fastify.prisma.user.count({ where }),
    ]);

    return {
      admins,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
  async getAdminById(id: string): Promise<Partial<User> | null> {
    const admin = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
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
   * Create a new admin user
   */
  async createAdmin(data: CreateAdminInput, createdByRole?: UserRole): Promise<Partial<User>> {
    const { password, zones, ...userData } = data;

    // Only SUPER_ADMIN can create other admins (if role check is provided)
    if (createdByRole && createdByRole !== UserRole.SUPER_ADMIN) {
      throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can create new admins');
    }

    // Prevent creating SUPER_ADMIN through API for security
    if (userData.role === UserRole.SUPER_ADMIN) {
      throw this.fastify.httpErrors.forbidden('SUPER_ADMIN accounts cannot be created through API');
    }

    // Check if user already exists
    const existingUser = await this.fastify.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw this.fastify.httpErrors.conflict('User with this email already exists');
    }

    // Check phone uniqueness if provided
    if (userData.phone) {
      const existingPhone = await this.fastify.prisma.user.findUnique({
        where: { phone: userData.phone },
      });
      if (existingPhone) {
        throw this.fastify.httpErrors.conflict('User with this phone number already exists');
      }
    }

    // Validate zones for LOCATION_ADMIN
    if (userData.role === UserRole.LOCATION_ADMIN && zones.length === 0) {
      throw this.fastify.httpErrors.badRequest('Location admin must have at least one zone assigned');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const admin = await this.fastify.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        zones: zones as Zone[],
        role: userData.role as UserRole,
        emailVerified: true, // Admins are pre-verified
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
        updatedAt: true,
      },
    });

    return admin;
  }

  /**
   * Update an admin user
   */
  async updateAdmin(id: string, data: UpdateAdminInput, updatedByRole?: UserRole): Promise<Partial<User>> {
    // Verify admin exists
    const existingAdmin = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
      },
    });

    if (!existingAdmin) {
      throw this.fastify.httpErrors.notFound('Admin not found');
    }

    // Prevent LOCATION_ADMIN from modifying SUPER_ADMIN
    if (existingAdmin.role === UserRole.SUPER_ADMIN && updatedByRole && updatedByRole !== UserRole.SUPER_ADMIN) {
      throw this.fastify.httpErrors.forbidden('Cannot modify SUPER_ADMIN account');
    }

    // Validate zones for LOCATION_ADMIN
    if (
      existingAdmin.role === UserRole.LOCATION_ADMIN &&
      data.zones !== undefined &&
      data.zones.length === 0
    ) {
      throw this.fastify.httpErrors.badRequest('Location admin must have at least one zone assigned');
    }

    const admin = await this.fastify.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.zones && { zones: data.zones }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
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

    return admin;
  }

  /**
   * Update admin zones
   */
  async updateAdminZones(id: string, zones: Zone[], updatedByRole?: UserRole): Promise<Partial<User>> {
    // Verify admin exists
    const existingAdmin = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
      },
    });

    if (!existingAdmin) {
      throw this.fastify.httpErrors.notFound('Admin not found');
    }

    // Prevent modifying SUPER_ADMIN zones (they have access to all)
    if (existingAdmin.role === UserRole.SUPER_ADMIN) {
      throw this.fastify.httpErrors.badRequest('SUPER_ADMIN has access to all zones');
    }

    if (updatedByRole && updatedByRole !== UserRole.SUPER_ADMIN) {
      throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can modify zones');
    }

    if (zones.length === 0) {
      throw this.fastify.httpErrors.badRequest('Location admin must have at least one zone assigned');
    }

    const admin = await this.fastify.prisma.user.update({
      where: { id },
      data: { zones },
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

    return admin;
  }

  /**
   * Activate or deactivate an admin
   */
  async setAdminActive(id: string, isActive: boolean): Promise<Partial<User>> {
    // Verify admin exists
    const existingAdmin = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
      },
    });

    if (!existingAdmin) {
      throw this.fastify.httpErrors.notFound('Admin not found');
    }

    // Prevent deactivating the last super admin
    if (!isActive && existingAdmin.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await this.fastify.prisma.user.count({
        where: {
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      });

      if (superAdminCount <= 1) {
        throw this.fastify.httpErrors.badRequest('Cannot deactivate the last active super admin');
      }
    }

    const admin = await this.fastify.prisma.user.update({
      where: { id },
      data: { isActive },
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

    return admin;
  }

  /**
   * Deactivate an admin
   */
  async deactivateAdmin(id: string, deactivatedByRole?: UserRole): Promise<Partial<User>> {
    const admin = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
      },
    });

    if (!admin) {
      throw this.fastify.httpErrors.notFound('Admin not found');
    }

    // Prevent deactivating SUPER_ADMIN
    if (admin.role === UserRole.SUPER_ADMIN) {
      throw this.fastify.httpErrors.forbidden('Cannot deactivate SUPER_ADMIN account');
    }

    if (deactivatedByRole && deactivatedByRole !== UserRole.SUPER_ADMIN) {
      throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can deactivate admins');
    }

    const updated = await this.fastify.prisma.user.update({
      where: { id },
      data: { isActive: false, refreshToken: null },
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
  async activateAdmin(id: string, activatedByRole?: UserRole): Promise<Partial<User>> {
    const admin = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
      },
    });

    if (!admin) {
      throw this.fastify.httpErrors.notFound('Admin not found');
    }

    if (activatedByRole && activatedByRole !== UserRole.SUPER_ADMIN) {
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
  async resetAdminPassword(id: string, newPassword: string, resetByRole?: UserRole): Promise<{ message: string }> {
    // Verify admin exists
    const existingAdmin = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
      },
    });

    if (!existingAdmin) {
      throw this.fastify.httpErrors.notFound('Admin not found');
    }

    // Only SUPER_ADMIN can reset passwords
    if (resetByRole && resetByRole !== UserRole.SUPER_ADMIN) {
      throw this.fastify.httpErrors.forbidden('Only SUPER_ADMIN can reset admin passwords');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.fastify.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        refreshToken: null, // Invalidate existing sessions
      },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Delete an admin (soft delete by deactivating)
   */
  async deleteAdmin(id: string): Promise<void> {
    // Verify admin exists
    const existingAdmin = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
      },
    });

    if (!existingAdmin) {
      throw this.fastify.httpErrors.notFound('Admin not found');
    }

    // Prevent deleting the last super admin
    if (existingAdmin.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await this.fastify.prisma.user.count({
        where: {
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      });

      if (superAdminCount <= 1) {
        throw this.fastify.httpErrors.badRequest('Cannot delete the last super admin');
      }
    }

    // Soft delete - deactivate the admin
    await this.fastify.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        refreshToken: null,
      },
    });
  }

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<{
    totalAdmins: number;
    superAdmins: number;
    locationAdmins: number;
    activeAdmins: number;
    inactiveAdmins: number;
    adminsByZone: { zone: Zone; count: number }[];
  }> {
    const [totalAdmins, superAdmins, locationAdmins, activeAdmins, inactiveAdmins] =
      await Promise.all([
        this.fastify.prisma.user.count({
          where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] } },
        }),
        this.fastify.prisma.user.count({
          where: { role: UserRole.SUPER_ADMIN },
        }),
        this.fastify.prisma.user.count({
          where: { role: UserRole.LOCATION_ADMIN },
        }),
        this.fastify.prisma.user.count({
          where: {
            role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
            isActive: true,
          },
        }),
        this.fastify.prisma.user.count({
          where: {
            role: { in: [UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN] },
            isActive: false,
          },
        }),
      ]);

    // Count admins by zone
    const adminsByZone = await Promise.all(
      Object.values(Zone).map(async (zone) => {
        const count = await this.fastify.prisma.user.count({
          where: {
            role: UserRole.LOCATION_ADMIN,
            zones: { has: zone },
            isActive: true,
          },
        });
        return { zone, count };
      })
    );

    return {
      totalAdmins,
      superAdmins,
      locationAdmins,
      activeAdmins,
      inactiveAdmins,
      adminsByZone,
    };
  }

  /**
   * Get all shop owners (for admin management)
   */
  async getShopOwners(filters: {
    zone?: Zone;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    shopOwners: Partial<User>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { zone, isActive, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: UserRole.SHOP_OWNER,
      ...(isActive !== undefined && { isActive }),
      ...(zone && { zones: { has: zone } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { businessName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [shopOwners, total] = await Promise.all([
      this.fastify.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          businessName: true,
          phone: true,
          role: true,
          zones: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.fastify.prisma.user.count({ where }),
    ]);

    return {
      shopOwners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Activate or deactivate a shop owner
   */
  async setShopOwnerActive(id: string, isActive: boolean): Promise<Partial<User>> {
    const existingUser = await this.fastify.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.SHOP_OWNER,
      },
    });

    if (!existingUser) {
      throw this.fastify.httpErrors.notFound('Shop owner not found');
    }

    const user = await this.fastify.prisma.user.update({
      where: { id },
      data: {
        isActive,
        ...(isActive === false && { refreshToken: null }), // Invalidate sessions on deactivation
      },
      select: {
        id: true,
        email: true,
        name: true,
        businessName: true,
        phone: true,
        role: true,
        zones: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
