import { FastifyInstance } from 'fastify';
interface CategoryCreateInput {
    nameEn: string;
    nameAr: string;
    slug?: string;
    description?: string;
    image?: string;
    parentId?: string;
    sortOrder?: number;
    isActive?: boolean;
}
interface CategoryUpdateInput extends Partial<CategoryCreateInput> {
}
export declare class CategoryService {
    private fastify;
    constructor(fastify: FastifyInstance);
    getCategories(includeInactive?: boolean): Promise<any[]>;
    private buildCategoryTree;
    getCategoryById(id: string): Promise<{
        _count: {
            products: number;
        };
        parent: {
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
        children: {
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
        }[];
    } & {
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
    }>;
    createCategory(data: CategoryCreateInput): Promise<{
        parent: {
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
        children: {
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
        }[];
    } & {
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
    }>;
    updateCategory(id: string, data: CategoryUpdateInput): Promise<{
        _count: {
            products: number;
        };
        parent: {
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
        children: {
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
        }[];
    } & {
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
    }>;
    deleteCategory(id: string, reassignToId?: string): Promise<{
        message: string;
    }>;
    reorderCategories(orders: Array<{
        id: string;
        sortOrder: number;
    }>): Promise<{
        message: string;
    }>;
    getCategoryStats(): Promise<{
        id: string;
        _count: {
            products: number;
        };
        nameEn: string;
        nameAr: string;
    }[]>;
}
export {};
//# sourceMappingURL=category.service.d.ts.map