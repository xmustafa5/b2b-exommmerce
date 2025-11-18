import { FastifyInstance } from 'fastify';
import { Category, Prisma } from '@prisma/client';

interface CategoryCreateInput {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  icon?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

interface CategoryUpdateInput extends Partial<CategoryCreateInput> {}

export class CategoryService {
  constructor(private fastify: FastifyInstance) {}

  // Get all categories with hierarchy
  async getCategories(includeInactive: boolean = false) {
    const where: Prisma.CategoryWhereInput = includeInactive ? {} : { isActive: true };

    const categories = await this.fastify.prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: {
          where: includeInactive ? {} : { isActive: true },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { nameEn: 'asc' },
      ],
    });

    // Build hierarchy tree
    const rootCategories = categories.filter(c => !c.parentId);
    return this.buildCategoryTree(rootCategories, categories);
  }

  // Build category tree structure
  private buildCategoryTree(rootCategories: any[], allCategories: any[]) {
    return rootCategories.map(root => ({
      ...root,
      children: allCategories
        .filter(c => c.parentId === root.id)
        .map(child => ({
          ...child,
          children: allCategories.filter(c => c.parentId === child.id),
        })),
    }));
  }

  // Get single category by ID
  async getCategoryById(id: string) {
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

    // Auto-assign display order if not provided
    if (!data.displayOrder) {
      const maxOrder = await this.fastify.prisma.category.aggregate({
        where: { parentId: data.parentId || null },
        _max: { displayOrder: true },
      });
      data.displayOrder = (maxOrder._max.displayOrder || 0) + 1;
    }

    const category = await this.fastify.prisma.category.create({
      data,
      include: {
        parent: true,
        children: true,
      },
    });

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

    return { message: 'Category deleted successfully' };
  }

  // Reorder categories
  async reorderCategories(orders: Array<{ id: string; displayOrder: number }>) {
    const updates = orders.map(({ id, displayOrder }) =>
      this.fastify.prisma.category.update({
        where: { id },
        data: { displayOrder },
      })
    );

    await this.fastify.prisma.$transaction(updates);

    return { message: 'Categories reordered successfully' };
  }

  // Get category products count
  async getCategoryStats() {
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

    return stats;
  }
}