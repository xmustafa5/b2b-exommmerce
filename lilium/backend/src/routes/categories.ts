import { FastifyPluginAsync } from 'fastify';
import { CategoryService } from '../services/category.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const categoryRoutes: FastifyPluginAsync = async (fastify) => {
  const categoryService = new CategoryService(fastify);

  // Get all categories (Public)
  fastify.get('/', {
    schema: {
      tags: ['categories'],
      summary: 'Get all categories',
      description: 'Retrieve all categories with optional filtering for inactive ones',
      querystring: {
        type: 'object',
        properties: {
          includeInactive: {
            type: 'string',
            enum: ['true', 'false'],
            default: 'false',
            description: 'Include inactive categories in the response'
          }
        }
      },
      response: {
        200: {
          description: 'Categories retrieved successfully',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nameAr: { type: 'string' },
              nameEn: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string', nullable: true },
              image: { type: 'string', nullable: true },
              parentId: { type: 'string', nullable: true },
              isActive: { type: 'boolean' },
              displayOrder: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              children: {
                type: 'array',
                items: { type: 'object' }
              },
              productCount: { type: 'number' }
            }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { includeInactive = false } = request.query;
      const categories = await categoryService.getCategories(includeInactive === 'true');
      return reply.send(categories);
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get category stats
  fastify.get('/stats', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['categories'],
      summary: 'Get category statistics',
      description: 'Retrieve statistics for all categories (Admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Category statistics',
          type: 'object',
          properties: {
            totalCategories: { type: 'number' },
            activeCategories: { type: 'number' },
            inactiveCategories: { type: 'number' },
            parentCategories: { type: 'number' },
            childCategories: { type: 'number' },
            categoriesWithProducts: { type: 'number' },
            topCategories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameEn: { type: 'string' },
                  productCount: { type: 'number' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const stats = await categoryService.getCategoryStats();
      return reply.send(stats);
    } catch (error) {
      return reply.code(500).send(error);
    }
  });

  // Get single category
  fastify.get('/:id', {
    schema: {
      tags: ['categories'],
      summary: 'Get category by ID',
      description: 'Retrieve a single category by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Category ID'
          }
        }
      },
      response: {
        200: {
          description: 'Category retrieved successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            nameAr: { type: 'string' },
            nameEn: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            image: { type: 'string', nullable: true },
            parentId: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            displayOrder: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            parent: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                nameAr: { type: 'string' },
                nameEn: { type: 'string' },
                slug: { type: 'string' }
              }
            },
            children: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameEn: { type: 'string' },
                  slug: { type: 'string' },
                  isActive: { type: 'boolean' },
                  displayOrder: { type: 'number' }
                }
              }
            },
            productCount: { type: 'number' }
          }
        },
        404: {
          description: 'Category not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const category = await categoryService.getCategoryById(id);
      return reply.send(category);
    } catch (error) {
      return reply.code(404).send(error);
    }
  });

  // Create category (Admin only)
  fastify.post('/', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['categories'],
      summary: 'Create a new category',
      description: 'Create a new category (Admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nameAr', 'nameEn'],
        properties: {
          nameAr: {
            type: 'string',
            minLength: 2,
            description: 'Category name in Arabic'
          },
          nameEn: {
            type: 'string',
            minLength: 2,
            description: 'Category name in English'
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Category description'
          },
          image: {
            type: 'string',
            nullable: true,
            description: 'Category image URL'
          },
          parentId: {
            type: 'string',
            nullable: true,
            description: 'Parent category ID for subcategories'
          },
          isActive: {
            type: 'boolean',
            default: true,
            description: 'Category active status'
          },
          displayOrder: {
            type: 'number',
            default: 0,
            description: 'Display order for sorting'
          }
        }
      },
      response: {
        201: {
          description: 'Category created successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            nameAr: { type: 'string' },
            nameEn: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            image: { type: 'string', nullable: true },
            parentId: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            displayOrder: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          description: 'Bad request - Invalid input',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const category = await categoryService.createCategory(request.body);
      return reply.code(201).send(category);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Update category (Admin only)
  fastify.put('/:id', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['categories'],
      summary: 'Update a category',
      description: 'Update an existing category (Admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Category ID'
          }
        }
      },
      body: {
        type: 'object',
        properties: {
          nameAr: {
            type: 'string',
            minLength: 2,
            description: 'Category name in Arabic'
          },
          nameEn: {
            type: 'string',
            minLength: 2,
            description: 'Category name in English'
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Category description'
          },
          image: {
            type: 'string',
            nullable: true,
            description: 'Category image URL'
          },
          parentId: {
            type: 'string',
            nullable: true,
            description: 'Parent category ID for subcategories'
          },
          isActive: {
            type: 'boolean',
            description: 'Category active status'
          },
          displayOrder: {
            type: 'number',
            description: 'Display order for sorting'
          }
        }
      },
      response: {
        200: {
          description: 'Category updated successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            nameAr: { type: 'string' },
            nameEn: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            image: { type: 'string', nullable: true },
            parentId: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            displayOrder: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          description: 'Bad request - Invalid input',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Category not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const category = await categoryService.updateCategory(id, request.body);
      return reply.send(category);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Reorder categories (Admin only)
  fastify.patch('/reorder', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.LOCATION_ADMIN)],
    schema: {
      tags: ['categories'],
      summary: 'Reorder categories',
      description: 'Update display order for multiple categories (Admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['categories'],
        properties: {
          categories: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'displayOrder'],
              properties: {
                id: {
                  type: 'string',
                  description: 'Category ID'
                },
                displayOrder: {
                  type: 'number',
                  description: 'New display order'
                }
              }
            },
            description: 'Array of category IDs with new display orders'
          }
        }
      },
      response: {
        200: {
          description: 'Categories reordered successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            updatedCount: { type: 'number' }
          }
        },
        400: {
          description: 'Bad request - Invalid input',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const result = await categoryService.reorderCategories(request.body);
      return reply.send(result);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });

  // Delete category (Admin only)
  fastify.delete('/:id', {
    preHandler: [authenticate, requireRole(UserRole.SUPER_ADMIN)],
    schema: {
      tags: ['categories'],
      summary: 'Delete a category',
      description: 'Delete a category. If category has products, must provide reassignToId to reassign products to another category (Super Admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Category ID to delete'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          reassignToId: {
            type: 'string',
            description: 'Category ID to reassign products to (required if category has products)'
          }
        }
      },
      response: {
        200: {
          description: 'Category deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            deletedCategory: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nameAr: { type: 'string' },
                nameEn: { type: 'string' }
              }
            },
            reassignedProductsCount: { type: 'number' }
          }
        },
        400: {
          description: 'Bad request - Cannot delete category with products without reassignToId',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden - Super Admin only',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Category not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { reassignToId } = request.query;
      const result = await categoryService.deleteCategory(id, reassignToId);
      return reply.send(result);
    } catch (error) {
      return reply.code(400).send(error);
    }
  });
};

export default categoryRoutes;