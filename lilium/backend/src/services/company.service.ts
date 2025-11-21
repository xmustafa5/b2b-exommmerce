import { FastifyInstance } from 'fastify';
import { Company, Zone, Prisma } from '@prisma/client';

interface CreateCompanyInput {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  logo?: string;
  email: string;
  phone: string;
  address?: string;
  zones: Zone[];
  deliveryFees?: any; // JSON object for zone-based delivery fees
  commissionRate?: number; // Percentage commission (e.g., 10 for 10%)
  minOrderAmount?: number;
  maxDeliveryTime?: number; // In minutes
}

interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

interface CompanyFilter {
  zone?: Zone;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface CompanyStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalVendors: number;
  activeVendors: number;
  averageRating: number;
  totalReviews: number;
}

export class CompanyService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  // Create a new company
  async createCompany(data: CreateCompanyInput): Promise<Company> {
    try {
      // Set default commission rate if not provided
      const commissionRate = data.commissionRate || 10; // Default 10%

      // Set default delivery fees structure if not provided
      const defaultDeliveryFees = {
        KARKH: 2500,
        RUSAFA: 2500,
        SADR_CITY: 3000,
        ADAMIYA: 3000,
        KADHIMIYA: 3000,
        MANSOUR: 2500,
        SHAAB: 3000,
        SAYDIYA: 3000,
        NEW_BAGHDAD: 3000,
        ZAFARANIYA: 3500,
        ABU_GHRAIB: 4000,
        TAJI: 4500,
        MAHMUDIYA: 5000,
        RASHID: 3500,
        NAHRAWAN: 5000
      };

      const company = await this.fastify.prisma.company.create({
        data: {
          name: data.name,
          nameAr: data.nameAr,
          description: data.description,
          descriptionAr: data.descriptionAr,
          logo: data.logo,
          email: data.email,
          phone: data.phone,
          address: data.address,
          zones: data.zones,
          deliveryFees: data.deliveryFees || defaultDeliveryFees,
          commissionRate,
          minOrderAmount: data.minOrderAmount || 10000, // Default 10,000 IQD
          maxDeliveryTime: data.maxDeliveryTime || 120, // Default 2 hours
          isActive: true
        }
      });

      return company;
    } catch (error) {
      throw this.fastify.httpErrors.badRequest('Failed to create company');
    }
  }

  // Update company details
  async updateCompany(companyId: string, data: UpdateCompanyInput): Promise<Company> {
    try {
      // Check if company exists
      const existingCompany = await this.fastify.prisma.company.findUnique({
        where: { id: companyId }
      });

      if (!existingCompany) {
        throw this.fastify.httpErrors.notFound('Company not found');
      }

      const company = await this.fastify.prisma.company.update({
        where: { id: companyId },
        data: {
          name: data.name,
          nameAr: data.nameAr,
          description: data.description,
          descriptionAr: data.descriptionAr,
          logo: data.logo,
          email: data.email,
          phone: data.phone,
          address: data.address,
          zones: data.zones,
          deliveryFees: data.deliveryFees,
          commissionRate: data.commissionRate,
          minOrderAmount: data.minOrderAmount,
          maxDeliveryTime: data.maxDeliveryTime
        }
      });

      return company;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.fastify.httpErrors.badRequest('Failed to update company');
    }
  }

  // Get company by ID
  async getCompanyById(companyId: string): Promise<Company & { stats?: CompanyStats }> {
    try {
      const company = await this.fastify.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          _count: {
            select: {
              products: true,
              users: true
            }
          }
        }
      });

      if (!company) {
        throw this.fastify.httpErrors.notFound('Company not found');
      }

      // Calculate stats
      const stats = await this.getCompanyStats(companyId);

      return {
        ...company,
        stats
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw this.fastify.httpErrors.internalServerError('Failed to fetch company');
    }
  }

  // List companies with filters
  async listCompanies(filter: CompanyFilter): Promise<{ companies: Company[]; total: number }> {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const skip = (page - 1) * limit;

      const where: Prisma.CompanyWhereInput = {};

      // Apply filters
      if (filter.zone) {
        where.zones = {
          has: filter.zone
        };
      }

      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }

      if (filter.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { nameAr: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } }
        ];
      }

      const [companies, total] = await Promise.all([
        this.fastify.prisma.company.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                products: true,
                users: true
              }
            }
          }
        }),
        this.fastify.prisma.company.count({ where })
      ]);

      return { companies, total };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to fetch companies');
    }
  }

  // Get company statistics
  async getCompanyStats(companyId: string): Promise<CompanyStats> {
    try {
      const [
        productStats,
        orderStats,
        vendorStats,
        revenueData
      ] = await Promise.all([
        // Product statistics
        this.fastify.prisma.product.aggregate({
          where: { companyId },
          _count: true
        }),
        // Order statistics
        this.fastify.prisma.order.aggregate({
          where: {
            items: {
              some: {
                product: { companyId }
              }
            }
          },
          _count: true,
          _sum: {
            totalAmount: true
          }
        }),
        // Vendor statistics
        this.fastify.prisma.user.aggregate({
          where: {
            companyId,
            role: 'VENDOR'
          },
          _count: true
        }),
        // Active products
        this.fastify.prisma.product.count({
          where: {
            companyId,
            isActive: true
          }
        })
      ]);

      // Calculate pending orders
      const pendingOrders = await this.fastify.prisma.order.count({
        where: {
          items: {
            some: {
              product: { companyId }
            }
          },
          status: {
            in: ['PENDING', 'PROCESSING']
          }
        }
      });

      // Calculate commission (assuming 10% default)
      const company = await this.fastify.prisma.company.findUnique({
        where: { id: companyId },
        select: { commissionRate: true }
      });

      const commissionRate = (company?.commissionRate || 10) / 100;
      const totalRevenue = orderStats._sum.totalAmount || 0;
      const totalCommission = totalRevenue * commissionRate;

      // Get active vendors
      const activeVendors = await this.fastify.prisma.user.count({
        where: {
          companyId,
          role: 'VENDOR',
          isActive: true
        }
      });

      return {
        totalProducts: productStats._count,
        activeProducts: revenueData,
        totalOrders: orderStats._count,
        pendingOrders,
        totalRevenue,
        totalCommission,
        totalVendors: vendorStats._count,
        activeVendors,
        averageRating: 0, // To be implemented with review system
        totalReviews: 0  // To be implemented with review system
      };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to calculate company statistics');
    }
  }

  // Activate/Deactivate company
  async toggleCompanyStatus(companyId: string, isActive: boolean): Promise<Company> {
    try {
      const company = await this.fastify.prisma.company.update({
        where: { id: companyId },
        data: { isActive }
      });

      // Also deactivate all products if company is deactivated
      if (!isActive) {
        await this.fastify.prisma.product.updateMany({
          where: { companyId },
          data: { isActive: false }
        });
      }

      return company;
    } catch (error) {
      throw this.fastify.httpErrors.badRequest('Failed to update company status');
    }
  }

  // Update delivery fees for company
  async updateDeliveryFees(companyId: string, deliveryFees: any): Promise<Company> {
    try {
      const company = await this.fastify.prisma.company.update({
        where: { id: companyId },
        data: { deliveryFees }
      });

      return company;
    } catch (error) {
      throw this.fastify.httpErrors.badRequest('Failed to update delivery fees');
    }
  }

  // Update commission rate
  async updateCommissionRate(companyId: string, commissionRate: number): Promise<Company> {
    try {
      if (commissionRate < 0 || commissionRate > 100) {
        throw this.fastify.httpErrors.badRequest('Commission rate must be between 0 and 100');
      }

      const company = await this.fastify.prisma.company.update({
        where: { id: companyId },
        data: { commissionRate }
      });

      return company;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Commission rate')) {
        throw error;
      }
      throw this.fastify.httpErrors.badRequest('Failed to update commission rate');
    }
  }

  // Get company vendors
  async getCompanyVendors(companyId: string): Promise<any[]> {
    try {
      const vendors = await this.fastify.prisma.user.findMany({
        where: {
          companyId,
          role: 'VENDOR'
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return vendors;
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to fetch vendors');
    }
  }

  // Get company products
  async getCompanyProducts(companyId: string, page = 1, limit = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        this.fastify.prisma.product.findMany({
          where: { companyId },
          skip,
          take: limit,
          include: {
            category: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                orderItems: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        this.fastify.prisma.product.count({
          where: { companyId }
        })
      ]);

      return { products, total };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to fetch company products');
    }
  }

  // Get companies by zone
  async getCompaniesByZone(zone: Zone): Promise<Company[]> {
    try {
      const companies = await this.fastify.prisma.company.findMany({
        where: {
          zones: {
            has: zone
          },
          isActive: true
        },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });

      return companies;
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to fetch companies by zone');
    }
  }

  // Calculate total payouts for a company
  async calculateCompanyPayouts(companyId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const where: any = {
        items: {
          some: {
            product: { companyId }
          }
        },
        status: 'COMPLETED'
      };

      if (startDate && endDate) {
        where.completedAt = {
          gte: startDate,
          lte: endDate
        };
      }

      const orders = await this.fastify.prisma.order.findMany({
        where,
        include: {
          items: {
            where: {
              product: { companyId }
            },
            include: {
              product: true
            }
          }
        }
      });

      const company = await this.fastify.prisma.company.findUnique({
        where: { id: companyId },
        select: { commissionRate: true }
      });

      const commissionRate = (company?.commissionRate || 10) / 100;

      let totalRevenue = 0;
      let totalCommission = 0;
      let totalPayout = 0;

      orders.forEach(order => {
        order.items.forEach(item => {
          const itemTotal = item.price * item.quantity;
          totalRevenue += itemTotal;
          const commission = itemTotal * commissionRate;
          totalCommission += commission;
          totalPayout += (itemTotal - commission);
        });
      });

      return {
        companyId,
        period: {
          start: startDate,
          end: endDate
        },
        totalOrders: orders.length,
        totalRevenue,
        totalCommission,
        totalPayout,
        commissionRate: company?.commissionRate || 10
      };
    } catch (error) {
      throw this.fastify.httpErrors.internalServerError('Failed to calculate payouts');
    }
  }
}