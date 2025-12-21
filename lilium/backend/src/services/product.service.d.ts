import { FastifyInstance } from 'fastify';
import { Zone } from '@prisma/client';
interface ProductFilters {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    zones?: Zone[];
    inStock?: boolean;
    search?: string;
}
interface ProductCreateInput {
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    sku: string;
    barcode?: string;
    categoryId: string;
    price: number;
    comparisonPrice?: number;
    cost?: number;
    stock: number;
    minOrderQty: number;
    unitType: string;
    zones: Zone[];
    images?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
}
interface ProductUpdateInput extends Partial<ProductCreateInput> {
}
export declare class ProductService {
    private fastify;
    constructor(fastify: FastifyInstance);
    getProducts(page?: number, limit?: number, filters?: ProductFilters, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        data: ({
            category: {
                description: string | null;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                nameEn: string;
                nameAr: string;
                slug: string;
                image: string | null;
                parentId: string | null;
                displayOrder: number;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            zones: import(".prisma/client").$Enums.Zone[];
            createdAt: Date;
            updatedAt: Date;
            nameEn: string;
            nameAr: string;
            descriptionEn: string | null;
            descriptionAr: string | null;
            sku: string;
            categoryId: string;
            price: number;
            cost: number | null;
            stock: number;
            minOrderQty: number;
            images: string[];
            isFeatured: boolean;
            compareAtPrice: number | null;
            unit: string;
            sortOrder: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getProductById(id: string): Promise<{
        category: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            nameEn: string;
            nameAr: string;
            slug: string;
            image: string | null;
            parentId: string | null;
            displayOrder: number;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        sku: string;
        categoryId: string;
        price: number;
        cost: number | null;
        stock: number;
        minOrderQty: number;
        images: string[];
        isFeatured: boolean;
        compareAtPrice: number | null;
        unit: string;
        sortOrder: number;
    }>;
    createProduct(data: ProductCreateInput): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        sku: string;
        categoryId: string;
        price: number;
        cost: number | null;
        stock: number;
        minOrderQty: number;
        images: string[];
        isFeatured: boolean;
        compareAtPrice: number | null;
        unit: string;
        sortOrder: number;
    }>;
    updateProduct(id: string, data: ProductUpdateInput): Promise<{
        category: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            nameEn: string;
            nameAr: string;
            slug: string;
            image: string | null;
            parentId: string | null;
            displayOrder: number;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        sku: string;
        categoryId: string;
        price: number;
        cost: number | null;
        stock: number;
        minOrderQty: number;
        images: string[];
        isFeatured: boolean;
        compareAtPrice: number | null;
        unit: string;
        sortOrder: number;
    }>;
    deleteProduct(id: string): Promise<{
        message: string;
    }>;
    updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        sku: string;
        categoryId: string;
        price: number;
        cost: number | null;
        stock: number;
        minOrderQty: number;
        images: string[];
        isFeatured: boolean;
        compareAtPrice: number | null;
        unit: string;
        sortOrder: number;
    }>;
    getFeaturedProducts(zones?: Zone[]): Promise<({
        category: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            nameEn: string;
            nameAr: string;
            slug: string;
            image: string | null;
            parentId: string | null;
            displayOrder: number;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        sku: string;
        categoryId: string;
        price: number;
        cost: number | null;
        stock: number;
        minOrderQty: number;
        images: string[];
        isFeatured: boolean;
        compareAtPrice: number | null;
        unit: string;
        sortOrder: number;
    })[]>;
    getProductsByCategory(categoryId: string, zones?: Zone[]): Promise<({
        category: {
            description: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            nameEn: string;
            nameAr: string;
            slug: string;
            image: string | null;
            parentId: string | null;
            displayOrder: number;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        zones: import(".prisma/client").$Enums.Zone[];
        createdAt: Date;
        updatedAt: Date;
        nameEn: string;
        nameAr: string;
        descriptionEn: string | null;
        descriptionAr: string | null;
        sku: string;
        categoryId: string;
        price: number;
        cost: number | null;
        stock: number;
        minOrderQty: number;
        images: string[];
        isFeatured: boolean;
        compareAtPrice: number | null;
        unit: string;
        sortOrder: number;
    })[]>;
}
export {};
//# sourceMappingURL=product.service.d.ts.map