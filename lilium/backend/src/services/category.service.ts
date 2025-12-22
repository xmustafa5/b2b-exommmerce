import { FastifyInstance } from 'fastify';
import { Category, Prisma } from '@prisma/client';
import { CacheService, CACHE_KEYS, CACHE_TTL } from './cache.service';

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

// Helper function to generate slug from English name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CategoryUpdateInput extends Partial<CategoryCreateInput> {}

export class CategoryService {
  private cacheService: CacheService;

  constructor(private fastify: FastifyInstance) {
    this.cacheService = new CacheService(fastify);
  }

  // Get all categories with hierarchy
  async getCategories(includeInactive: boolean = false) {
    const cacheKey = `all:${includeInactive ? 'with-inactive' : 'active-only'}`;

    // Try to get from cache
    const cached = await this.cacheService.get<any[]>(cacheKey, CACHE_KEYS.CATEGORIES);
    if (cached) {
      this.fastify.log.debug(`Cache hit for categories`);
      return cached;
    }

    const where: Prisma.CategoryWhereInput = includeInactive ? {} : { isActive: true };

    const categories = await this.fastify.prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { nameEn: 'asc' },
      ],
    });

    // Build hierarchy tree from flat list
    const result = this.buildCategoryTree(categories);

    // Cache the result
    await this.cacheService.set(cacheKey, result, {
      prefix: CACHE_KEYS.CATEGORIES,
      ttl: CACHE_TTL.CATEGORIES,
    });

    return result;
  }

  // Build category tree structure from flat list
  private buildCategoryTree(categories: any[]) {
    const categoryMap = new Map<string, any>();

    // First pass: create map of all categories with empty children arrays
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const rootCategories: any[] = [];

    // Second pass: assign children to parents
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(category);
      } else if (!cat.parentId) {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  // Get single category by ID
  async getCategoryById(id: string) {
    // Try to get from cache
    const cached = await this.cacheService.get<any>(id, CACHE_KEYS.CATEGORY);
    if (cached) {
      this.fastify.log.debug(`Cache hit for category: ${id}`);
      return cached;
    }

    const category = await this.fastify.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw this.fastify.httpErrors.notFound('Category not found');
    }

    // Cache the result
    await this.cacheService.set(id, category, {
      prefix: CACHE_KEYS.CATEGORY,
      ttl: CACHE_TTL.CATEGORIES,
    });

    return category;
  }

  // Create new category
  async createCategory(data: CategoryCreateInput) {
    // If parent ID is provided, verify it exists
    if (data.parentId) {
      const parent = await this.fastify.prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw this.fastify.httpErrors.notFound('Parent category not found');
      }
    }

    // Auto-assign sort order if not provided
    if (!data.sortOrder) {
      const maxOrder = await this.fastify.prisma.category.aggregate({
        where: { parentId: data.parentId || null },
        _max: { sortOrder: true },
      });
      data.sortOrder = (maxOrder._max.sortOrder || 0) + 1;
    }

    // Generate slug from English name
    let slug = generateSlug(data.nameEn);

    // Check for existing slug and make unique if needed
    const existingSlug = await this.fastify.prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const category = await this.fastify.prisma.category.create({
      data: {
        ...data,
        slug,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    // Invalidate category list cache
    await this.invalidateCategoryListCache();

    return category;
  }

  // Update category
  async updateCategory(id: string, data: CategoryUpdateInput) {
    // Check if category exists
    const existingCategory = await this.fastify.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw this.fastify.httpErrors.notFound('Category not found');
    }

    // If updating parent, verify it exists and prevent circular reference
    if (data.parentId) {
      if (data.parentId === id) {
        throw this.fastify.httpErrors.badRequest('Category cannot be its own parent');
      }

      const parent = await this.fastify.prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw this.fastify.httpErrors.notFound('Parent category not found');
      }

      // Check for circular reference
      let currentParent = parent;
      while (currentParent.parentId) {
        if (currentParent.parentId === id) {
          throw this.fastify.httpErrors.badRequest('Circular reference detected');
        }
        currentParent = await this.fastify.prisma.category.findUnique({
          where: { id: currentParent.parentId },
        }) as Category;
      }
    }

    const category = await this.fastify.prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    // Invalidate caches
    await this.cacheService.del(id, CACHE_KEYS.CATEGORY);
    await this.invalidateCategoryListCache();

    return category;
  }

  // Delete category
  async deleteCategory(id: string, reassignToId?: string) {
    const category = await this.fastify.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw this.fastify.httpErrors.notFound('Category not found');
    }

    // Check if category has products or children
    if (category._count.products > 0 || category._count.children > 0) {
      if (!reassignToId) {
        throw this.fastify.httpErrors.conflict(
          'Category has products or subcategories. Provide reassignToId to move them.'
        );
      }

      // Verify reassign category exists
      const reassignCategory = await this.fastify.prisma.category.findUnique({
        where: { id: reassignToId },
      });

      if (!reassignCategory) {
        throw this.fastify.httpErrors.notFound('Reassign category not found');
      }

      // Move products and children to new category
      await this.fastify.prisma.$transaction([
        this.fastify.prisma.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignToId },
        }),
        this.fastify.prisma.category.updateMany({
          where: { parentId: id },
          data: { parentId: reassignToId },
        }),
        this.fastify.prisma.category.delete({
          where: { id },
        }),
      ]);
    } else {
      // No products or children, safe to delete
      await this.fastify.prisma.category.delete({
        where: { id },
      });
    }

    // Invalidate caches
    await this.cacheService.del(id, CACHE_KEYS.CATEGORY);
    await this.invalidateCategoryListCache();

    return { message: 'Category deleted successfully' };
  }

  // Reorder categories
  async reorderCategories(orders: Array<{ id: string; sortOrder: number }>) {
    const updates = orders.map(({ id, sortOrder }) =>
      this.fastify.prisma.category.update({
        where: { id },
        data: { sortOrder },
      })
    );

    await this.fastify.prisma.$transaction(updates);

    // Invalidate category list cache
    await this.invalidateCategoryListCache();

    return { message: 'Categories reordered successfully' };
  }

  // Get category products count
  async getCategoryStats() {
    const cacheKey = 'stats';

    // Try to get from cache
    const cached = await this.cacheService.get<any[]>(cacheKey, CACHE_KEYS.CATEGORIES);
    if (cached) {
      this.fastify.log.debug(`Cache hit for category stats`);
      return cached;
    }

    const stats = await this.fastify.prisma.category.findMany({
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        products: {
          _count: 'desc',
        },
      },
    });

    // Cache the result
    await this.cacheService.set(cacheKey, stats, {
      prefix: CACHE_KEYS.CATEGORIES,
      ttl: CACHE_TTL.CATEGORIES,
    });

    return stats;
  }

  /**
   * Invalidate all category list caches
   */
  private async invalidateCategoryListCache(): Promise<void> {
    await this.cacheService.delPattern(`${CACHE_KEYS.CATEGORIES}:*`);
  }

  /**
   * Invalidate all category caches
   */
  async invalidateAllCategoryCaches(): Promise<void> {
    await this.cacheService.delPattern(`${CACHE_KEYS.CATEGORIES}:*`);
    await this.cacheService.delPattern(`${CACHE_KEYS.CATEGORY}:*`);
  }
}
