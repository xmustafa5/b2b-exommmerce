declare function seedProductsAndCategories(): Promise<{
    categories: {
        id: string;
        nameAr: string;
        nameEn: string;
        slug: string;
        description: string | null;
        image: string | null;
        isActive: boolean;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
    }[];
    products: {
        id: string;
        nameAr: string;
        nameEn: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        descriptionEn: string | null;
        descriptionAr: string | null;
        isFeatured: boolean;
        sku: string;
        price: number;
        compareAtPrice: number | null;
        cost: number | null;
        stock: number;
        minOrderQty: number;
        unit: string;
        images: string[];
        zones: import("@prisma/client").$Enums.Zone[];
        sortOrder: number;
        categoryId: string;
        companyId: string;
    }[];
}>;
export { seedProductsAndCategories };
//# sourceMappingURL=seed-products.d.ts.map