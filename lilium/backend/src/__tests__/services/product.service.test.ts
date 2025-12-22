import { ProductService } from '../../services/product.service';
import { Zone } from '@prisma/client';

describe('ProductService', () => {
  let productService: ProductService;
  let mockFastify: any;
  let mockPrisma: any;

  beforeEach(() => {
    // Mock Prisma client
    mockPrisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
    };

    // Mock Fastify instance
    mockFastify = {
      prisma: mockPrisma,
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
      httpErrors: {
        notFound: (msg: string) => {
          const error = new Error(msg);
          (error as any).statusCode = 404;
          return error;
        },
        conflict: (msg: string) => {
          const error = new Error(msg);
          (error as any).statusCode = 409;
          return error;
        },
        badRequest: (msg: string) => {
          const error = new Error(msg);
          (error as any).statusCode = 400;
          return error;
        },
      },
    };

    productService = new ProductService(mockFastify);
  });

  describe('getProducts', () => {
    const mockProducts = [
      {
        id: 'prod1',
        sku: 'SKU001',
        nameEn: 'Product 1',
        nameAr: 'منتج 1',
        price: 100,
        stock: 50,
        zones: [Zone.KARKH],
        category: { id: 'cat1', nameEn: 'Category 1' },
      },
      {
        id: 'prod2',
        sku: 'SKU002',
        nameEn: 'Product 2',
        nameAr: 'منتج 2',
        price: 200,
        stock: 30,
        zones: [Zone.RUSAFA],
        category: { id: 'cat1', nameEn: 'Category 1' },
      },
    ];

    it('should return paginated products', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await productService.getProducts(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter products by categoryId', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productService.getProducts(1, 20, { categoryId: 'cat1' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat1',
          }),
        })
      );
    });

    it('should filter products by minPrice', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productService.getProducts(1, 20, { minPrice: 50 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 50 },
          }),
        })
      );
    });

    it('should filter products by maxPrice', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productService.getProducts(1, 20, { maxPrice: 150 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { lte: 150 },
          }),
        })
      );
    });

    it('should filter products by zones', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productService.getProducts(1, 20, { zones: [Zone.KARKH] });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            zones: { hasSome: [Zone.KARKH] },
          }),
        })
      );
    });

    it('should filter in-stock products', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productService.getProducts(1, 20, { inStock: true });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: { gt: 0 },
          }),
        })
      );
    });

    it('should search products by name or SKU', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      mockPrisma.product.count.mockResolvedValue(1);

      await productService.getProducts(1, 20, { search: 'Product' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ nameEn: { contains: 'Product', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });

    it('should calculate correct pagination', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(45);

      const result = await productService.getProducts(2, 20);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should apply sort order', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(2);

      await productService.getProducts(1, 20, {}, 'price', 'asc');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        })
      );
    });
  });

  describe('getProductById', () => {
    const mockProduct = {
      id: 'prod1',
      sku: 'SKU001',
      nameEn: 'Product 1',
      nameAr: 'منتج 1',
      price: 100,
      stock: 50,
      zones: [Zone.KARKH],
      category: { id: 'cat1', nameEn: 'Category 1' },
    };

    it('should return product by ID', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productService.getProductById('prod1');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        include: { category: true },
      });
    });

    it('should throw error when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(productService.getProductById('nonexistent')).rejects.toThrow(
        'Product not found'
      );
    });
  });

  describe('createProduct', () => {
    const validProductData = {
      sku: 'SKU001',
      nameEn: 'New Product',
      nameAr: 'منتج جديد',
      price: 100,
      stock: 50,
      minOrderQty: 1,
      unitType: 'piece',
      categoryId: 'cat1',
      zones: [Zone.KARKH] as Zone[],
    };

    it('should create a new product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat1', nameEn: 'Category' });
      mockPrisma.product.create.mockResolvedValue({
        id: 'prod1',
        ...validProductData,
        category: { id: 'cat1', nameEn: 'Category' },
      });

      const result = await productService.createProduct(validProductData);

      expect(result.id).toBe('prod1');
      expect(result.sku).toBe('SKU001');
      expect(mockPrisma.product.create).toHaveBeenCalled();
    });

    it('should throw error when SKU already exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'existing', sku: 'SKU001' });

      await expect(productService.createProduct(validProductData)).rejects.toThrow(
        'Product with this SKU already exists'
      );
    });

    it('should throw error when category not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(productService.createProduct(validProductData)).rejects.toThrow(
        'Category not found'
      );
    });
  });

  describe('updateProduct', () => {
    const existingProduct = {
      id: 'prod1',
      sku: 'SKU001',
      nameEn: 'Product 1',
      price: 100,
      stock: 50,
    };

    it('should update an existing product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue({
        ...existingProduct,
        nameEn: 'Updated Product',
        category: { id: 'cat1' },
      });

      const result = await productService.updateProduct('prod1', { nameEn: 'Updated Product' });

      expect(result.nameEn).toBe('Updated Product');
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { nameEn: 'Updated Product' },
        include: { category: true },
      });
    });

    it('should throw error when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(productService.updateProduct('nonexistent', {})).rejects.toThrow(
        'Product not found'
      );
    });

    it('should throw error when changing to existing SKU', async () => {
      mockPrisma.product.findUnique
        .mockResolvedValueOnce(existingProduct) // First call for product check
        .mockResolvedValueOnce({ id: 'other', sku: 'SKU002' }); // Second call for SKU check

      await expect(
        productService.updateProduct('prod1', { sku: 'SKU002' })
      ).rejects.toThrow('Product with this SKU already exists');
    });

    it('should throw error when new category not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        productService.updateProduct('prod1', { categoryId: 'nonexistent' })
      ).rejects.toThrow('Category not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete an existing product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod1' });
      mockPrisma.product.delete.mockResolvedValue({ id: 'prod1' });

      const result = await productService.deleteProduct('prod1');

      expect(result.message).toBe('Product deleted successfully');
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod1' },
      });
    });

    it('should throw error when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(productService.deleteProduct('nonexistent')).rejects.toThrow(
        'Product not found'
      );
    });
  });

  describe('updateStock', () => {
    const existingProduct = {
      id: 'prod1',
      stock: 50,
    };

    it('should add stock', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue({ ...existingProduct, stock: 60 });

      const result = await productService.updateStock('prod1', 10, 'add');

      expect(result.stock).toBe(60);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { stock: 60 },
      });
    });

    it('should subtract stock', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue({ ...existingProduct, stock: 40 });

      const result = await productService.updateStock('prod1', 10, 'subtract');

      expect(result.stock).toBe(40);
    });

    it('should set stock', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue({ ...existingProduct, stock: 100 });

      const result = await productService.updateStock('prod1', 100, 'set');

      expect(result.stock).toBe(100);
    });

    it('should throw error when subtracting more than available', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);

      await expect(productService.updateStock('prod1', 100, 'subtract')).rejects.toThrow(
        'Insufficient stock'
      );
    });

    it('should throw error when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(productService.updateStock('nonexistent', 10, 'add')).rejects.toThrow(
        'Product not found'
      );
    });
  });

  describe('getFeaturedProducts', () => {
    const mockFeaturedProducts = [
      { id: 'prod1', nameEn: 'Featured 1', isFeatured: true, zones: [Zone.KARKH] },
      { id: 'prod2', nameEn: 'Featured 2', isFeatured: true, zones: [Zone.RUSAFA] },
    ];

    it('should return featured products', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockFeaturedProducts);

      const result = await productService.getFeaturedProducts();

      expect(result).toHaveLength(2);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isFeatured: true, isActive: true },
          take: 10,
        })
      );
    });

    it('should filter featured products by zone', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockFeaturedProducts[0]]);

      await productService.getFeaturedProducts([Zone.KARKH]);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            zones: { hasSome: [Zone.KARKH] },
          }),
        })
      );
    });
  });

  describe('getProductsByCategory', () => {
    const mockCategoryProducts = [
      { id: 'prod1', nameEn: 'Product 1', categoryId: 'cat1', zones: [Zone.KARKH] },
    ];

    it('should return products by category', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockCategoryProducts);

      const result = await productService.getProductsByCategory('cat1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId: 'cat1', isActive: true },
        })
      );
    });

    it('should filter by zone', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockCategoryProducts);

      await productService.getProductsByCategory('cat1', [Zone.KARKH]);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            zones: { hasSome: [Zone.KARKH] },
          }),
        })
      );
    });
  });
});
