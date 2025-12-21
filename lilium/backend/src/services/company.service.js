"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
class CompanyService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    // Create a new company
    async createCompany(data) {
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
                    nameEn: data.name,
                    nameAr: data.nameAr,
                    description: data.description,
                    logo: data.logo,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    zones: data.zones,
                    commission: commissionRate,
                    isActive: true
                }
            });
            return company;
        }
        catch (error) {
            throw this.fastify.httpErrors.badRequest('Failed to create company');
        }
    }
    // Update company details
    async updateCompany(companyId, data) {
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
                    ...(data.name && { nameEn: data.name }),
                    ...(data.nameAr && { nameAr: data.nameAr }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.logo !== undefined && { logo: data.logo }),
                    ...(data.email && { email: data.email }),
                    ...(data.phone && { phone: data.phone }),
                    ...(data.address !== undefined && { address: data.address }),
                    ...(data.zones && { zones: data.zones }),
                    ...(data.commissionRate !== undefined && { commission: data.commissionRate }),
                }
            });
            return company;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw this.fastify.httpErrors.badRequest('Failed to update company');
        }
    }
    // Get company by ID
    async getCompanyById(companyId) {
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
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw this.fastify.httpErrors.internalServerError('Failed to fetch company');
        }
    }
    // List companies with filters
    async listCompanies(filter) {
        try {
            const page = filter.page || 1;
            const limit = filter.limit || 20;
            const skip = (page - 1) * limit;
            const where = {};
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
                    { nameEn: { contains: filter.search, mode: 'insensitive' } },
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
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to fetch companies');
        }
    }
    // Get company statistics
    async getCompanyStats(companyId) {
        try {
            const [productStats, orderStats, vendorStats, revenueData] = await Promise.all([
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
                        total: true
                    }
                }),
                // Vendor statistics (COMPANY_ADMIN and COMPANY_USER)
                this.fastify.prisma.user.aggregate({
                    where: {
                        companyId,
                        role: {
                            in: ['COMPANY_ADMIN', 'COMPANY_USER']
                        }
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
                select: { commission: true }
            });
            const commissionRate = (company?.commission || 10) / 100;
            const totalRevenue = orderStats._sum.total || 0;
            const totalCommission = totalRevenue * commissionRate;
            // Get active vendors (COMPANY_ADMIN and COMPANY_USER)
            const activeVendors = await this.fastify.prisma.user.count({
                where: {
                    companyId,
                    role: {
                        in: ['COMPANY_ADMIN', 'COMPANY_USER']
                    },
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
                totalReviews: 0 // To be implemented with review system
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to calculate company statistics');
        }
    }
    // Activate/Deactivate company
    async toggleCompanyStatus(companyId, isActive) {
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
        }
        catch (error) {
            throw this.fastify.httpErrors.badRequest('Failed to update company status');
        }
    }
    // Update delivery fees for company
    async updateDeliveryFees(companyId, deliveryFees) {
        try {
            const company = await this.fastify.prisma.company.update({
                where: { id: companyId },
                data: { deliveryFees }
            });
            return company;
        }
        catch (error) {
            throw this.fastify.httpErrors.badRequest('Failed to update delivery fees');
        }
    }
    // Update commission rate
    async updateCommissionRate(companyId, commissionRate) {
        try {
            if (commissionRate < 0 || commissionRate > 100) {
                throw this.fastify.httpErrors.badRequest('Commission rate must be between 0 and 100');
            }
            const company = await this.fastify.prisma.company.update({
                where: { id: companyId },
                data: { commissionRate }
            });
            return company;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('Commission rate')) {
                throw error;
            }
            throw this.fastify.httpErrors.badRequest('Failed to update commission rate');
        }
    }
    // Get company vendors
    async getCompanyVendors(companyId) {
        try {
            const vendors = await this.fastify.prisma.user.findMany({
                where: {
                    companyId,
                    role: {
                        in: ['COMPANY_ADMIN', 'COMPANY_USER']
                    }
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
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to fetch vendors');
        }
    }
    // Get company products
    async getCompanyProducts(companyId, page = 1, limit = 20) {
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
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to fetch company products');
        }
    }
    // Get companies by zone
    async getCompaniesByZone(zone) {
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
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to fetch companies by zone');
        }
    }
    // Calculate total payouts for a company
    async calculateCompanyPayouts(companyId, startDate, endDate) {
        try {
            const where = {
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
                select: { commission: true }
            });
            const commissionRate = (company?.commission || 10) / 100;
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
                commissionRate: company?.commission || 10
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to calculate payouts');
        }
    }
}
exports.CompanyService = CompanyService;
//# sourceMappingURL=company.service.js.map