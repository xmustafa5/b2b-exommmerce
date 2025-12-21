import { FastifyInstance } from 'fastify';
import { Company, Zone } from '@prisma/client';
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
    deliveryFees?: any;
    commissionRate?: number;
    minOrderAmount?: number;
    maxDeliveryTime?: number;
}
interface UpdateCompanyInput extends Partial<CreateCompanyInput> {
}
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
export declare class CompanyService {
    private fastify;
    constructor(fastify: FastifyInstance);
    createCompany(data: CreateCompanyInput): Promise<Company>;
    updateCompany(companyId: string, data: UpdateCompanyInput): Promise<Company>;
    getCompanyById(companyId: string): Promise<Company & {
        stats?: CompanyStats;
    }>;
    listCompanies(filter: CompanyFilter): Promise<{
        companies: Company[];
        total: number;
    }>;
    getCompanyStats(companyId: string): Promise<CompanyStats>;
    toggleCompanyStatus(companyId: string, isActive: boolean): Promise<Company>;
    updateDeliveryFees(companyId: string, deliveryFees: any): Promise<Company>;
    updateCommissionRate(companyId: string, commissionRate: number): Promise<Company>;
    getCompanyVendors(companyId: string): Promise<any[]>;
    getCompanyProducts(companyId: string, page?: number, limit?: number): Promise<any>;
    getCompaniesByZone(zone: Zone): Promise<Company[]>;
    calculateCompanyPayouts(companyId: string, startDate?: Date, endDate?: Date): Promise<any>;
}
export {};
//# sourceMappingURL=company.service.d.ts.map