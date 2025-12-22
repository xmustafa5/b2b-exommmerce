import { Zone, OrderStatus, UserRole } from '@prisma/client';
import {
  // Common
  paginationSchema,
  idParamSchema,
  dateRangeSchema,
  // Auth
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  // Product
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  bulkStockUpdateSchema,
  // Category
  categoryQuerySchema,
  createCategorySchema,
  // Order
  orderQuerySchema,
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  // Address
  createAddressSchema,
  // Promotion
  createPromotionSchema,
  applyPromotionSchema,
  // Company
  createCompanySchema,
  updateCommissionSchema,
  // Admin
  createAdminSchema,
  updateAdminZonesSchema,
  // Cart
  addToCartSchema,
  updateCartItemSchema,
  // Notification
  registerFcmTokenSchema,
  sendNotificationSchema,
  sendToZoneSchema,
} from '../../types/validation';

describe('Validation Schemas', () => {
  // ============================================
  // Common Schemas
  // ============================================
  describe('paginationSchema', () => {
    it('should accept valid pagination', () => {
      const result = paginationSchema.parse({ page: 1, limit: 20 });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should use defaults when not provided', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should coerce string numbers', () => {
      const result = paginationSchema.parse({ page: '2', limit: '50' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject limit over 100', () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
    });

    it('should reject negative page', () => {
      expect(() => paginationSchema.parse({ page: -1 })).toThrow();
    });
  });

  describe('idParamSchema', () => {
    it('should accept valid ID', () => {
      const result = idParamSchema.parse({ id: 'abc123' });
      expect(result.id).toBe('abc123');
    });

    it('should reject empty ID', () => {
      expect(() => idParamSchema.parse({ id: '' })).toThrow();
    });
  });

  // ============================================
  // Auth Schemas
  // ============================================
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.parse({
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      });
      expect(result.email).toBe('test@example.com');
    });

    it('should accept optional fields', () => {
      const result = registerSchema.parse({
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        businessName: 'Test Business',
        phone: '1234567890',
        zone: Zone.KARKH,
      });
      expect(result.businessName).toBe('Test Business');
      expect(result.zone).toBe(Zone.KARKH);
    });

    it('should reject invalid email', () => {
      expect(() =>
        registerSchema.parse({
          email: 'invalid-email',
          password: 'password123',
          name: 'John',
        })
      ).toThrow();
    });

    it('should reject short password', () => {
      expect(() =>
        registerSchema.parse({
          email: 'test@example.com',
          password: '1234567',
          name: 'John',
        })
      ).toThrow();
    });

    it('should reject short name', () => {
      expect(() =>
        registerSchema.parse({
          email: 'test@example.com',
          password: 'password123',
          name: 'J',
        })
      ).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login', () => {
      const result = loginSchema.parse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.email).toBe('test@example.com');
    });

    it('should reject empty password', () => {
      expect(() =>
        loginSchema.parse({
          email: 'test@example.com',
          password: '',
        })
      ).toThrow();
    });
  });

  describe('changePasswordSchema', () => {
    it('should accept valid password change', () => {
      const result = changePasswordSchema.parse({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      });
      expect(result.currentPassword).toBe('oldpass123');
    });

    it('should reject short new password', () => {
      expect(() =>
        changePasswordSchema.parse({
          currentPassword: 'oldpass123',
          newPassword: 'short',
        })
      ).toThrow();
    });
  });

  // ============================================
  // Product Schemas
  // ============================================
  describe('createProductSchema', () => {
    const validProduct = {
      sku: 'SKU001',
      nameAr: 'منتج اختبار',
      nameEn: 'Test Product',
      price: 100,
      categoryId: 'cat123',
      zones: [Zone.KARKH],
    };

    it('should accept valid product', () => {
      const result = createProductSchema.parse(validProduct);
      expect(result.sku).toBe('SKU001');
      expect(result.price).toBe(100);
    });

    it('should apply defaults', () => {
      const result = createProductSchema.parse(validProduct);
      expect(result.stock).toBe(0);
      expect(result.minOrderQty).toBe(1);
      expect(result.unit).toBe('piece');
      expect(result.isActive).toBe(true);
      expect(result.isFeatured).toBe(false);
    });

    it('should accept all optional fields', () => {
      const result = createProductSchema.parse({
        ...validProduct,
        descriptionAr: 'وصف المنتج',
        descriptionEn: 'Product description',
        compareAtPrice: 120,
        cost: 80,
        stock: 50,
        minOrderQty: 5,
        images: ['https://example.com/img.jpg'],
        isFeatured: true,
      });
      expect(result.compareAtPrice).toBe(120);
      expect(result.isFeatured).toBe(true);
    });

    it('should reject negative price', () => {
      expect(() =>
        createProductSchema.parse({ ...validProduct, price: -10 })
      ).toThrow();
    });

    it('should reject negative stock', () => {
      expect(() =>
        createProductSchema.parse({ ...validProduct, stock: -5 })
      ).toThrow();
    });

    it('should reject empty zones', () => {
      expect(() =>
        createProductSchema.parse({ ...validProduct, zones: [] })
      ).toThrow();
    });

    it('should reject invalid image URLs', () => {
      expect(() =>
        createProductSchema.parse({ ...validProduct, images: ['not-a-url'] })
      ).toThrow();
    });

    it('should reject SKU over 50 characters', () => {
      expect(() =>
        createProductSchema.parse({ ...validProduct, sku: 'A'.repeat(51) })
      ).toThrow();
    });
  });

  describe('updateStockSchema', () => {
    it('should accept valid stock update', () => {
      const result = updateStockSchema.parse({
        quantity: 10,
        operation: 'add',
      });
      expect(result.quantity).toBe(10);
      expect(result.operation).toBe('add');
    });

    it('should accept negative quantity for set', () => {
      expect(() =>
        updateStockSchema.parse({ quantity: -5, operation: 'set' })
      ).not.toThrow();
    });

    it('should reject invalid operation', () => {
      expect(() =>
        updateStockSchema.parse({ quantity: 10, operation: 'invalid' })
      ).toThrow();
    });
  });

  describe('bulkStockUpdateSchema', () => {
    it('should accept valid bulk update', () => {
      const result = bulkStockUpdateSchema.parse({
        updates: [
          { productId: 'prod1', quantity: 10, operation: 'add' },
          { productId: 'prod2', quantity: 5, operation: 'subtract' },
        ],
      });
      expect(result.updates).toHaveLength(2);
    });

    it('should reject empty updates', () => {
      expect(() => bulkStockUpdateSchema.parse({ updates: [] })).toThrow();
    });
  });

  // ============================================
  // Category Schemas
  // ============================================
  describe('createCategorySchema', () => {
    const validCategory = {
      nameAr: 'فئة',
      nameEn: 'Category',
      slug: 'category-slug',
    };

    it('should accept valid category', () => {
      const result = createCategorySchema.parse(validCategory);
      expect(result.slug).toBe('category-slug');
    });

    it('should reject invalid slug format', () => {
      expect(() =>
        createCategorySchema.parse({ ...validCategory, slug: 'Invalid Slug!' })
      ).toThrow();
    });

    it('should accept slug with numbers and hyphens', () => {
      const result = createCategorySchema.parse({
        ...validCategory,
        slug: 'category-123-test',
      });
      expect(result.slug).toBe('category-123-test');
    });
  });

  // ============================================
  // Order Schemas
  // ============================================
  describe('createOrderSchema', () => {
    const validOrder = {
      addressId: 'addr123',
      items: [{ productId: 'prod123', quantity: 2 }],
    };

    it('should accept valid order', () => {
      const result = createOrderSchema.parse(validOrder);
      expect(result.items).toHaveLength(1);
    });

    it('should apply default payment method', () => {
      const result = createOrderSchema.parse(validOrder);
      expect(result.paymentMethod).toBe('cash');
    });

    it('should reject empty items', () => {
      expect(() =>
        createOrderSchema.parse({ addressId: 'addr123', items: [] })
      ).toThrow();
    });

    it('should reject negative quantity', () => {
      expect(() =>
        createOrderSchema.parse({
          addressId: 'addr123',
          items: [{ productId: 'prod123', quantity: -1 }],
        })
      ).toThrow();
    });

    it('should accept optional notes', () => {
      const result = createOrderSchema.parse({
        ...validOrder,
        notes: 'Please deliver in the morning',
      });
      expect(result.notes).toBe('Please deliver in the morning');
    });
  });

  describe('updateOrderStatusSchema', () => {
    it('should accept valid status update', () => {
      const result = updateOrderStatusSchema.parse({
        status: OrderStatus.CONFIRMED,
      });
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should accept with comment', () => {
      const result = updateOrderStatusSchema.parse({
        status: OrderStatus.SHIPPED,
        comment: 'On the way',
      });
      expect(result.comment).toBe('On the way');
    });

    it('should reject invalid status', () => {
      expect(() =>
        updateOrderStatusSchema.parse({ status: 'INVALID_STATUS' })
      ).toThrow();
    });
  });

  describe('cancelOrderSchema', () => {
    it('should accept valid cancel reason', () => {
      const result = cancelOrderSchema.parse({
        reason: 'Customer requested cancellation',
      });
      expect(result.reason).toBe('Customer requested cancellation');
    });

    it('should reject empty reason', () => {
      expect(() => cancelOrderSchema.parse({ reason: '' })).toThrow();
    });
  });

  // ============================================
  // Address Schemas
  // ============================================
  describe('createAddressSchema', () => {
    const validAddress = {
      name: 'Home',
      street: '123 Main St',
      area: 'Downtown',
      zone: Zone.KARKH,
      phone: '1234567890',
    };

    it('should accept valid address', () => {
      const result = createAddressSchema.parse(validAddress);
      expect(result.name).toBe('Home');
      expect(result.zone).toBe(Zone.KARKH);
    });

    it('should accept optional coordinates', () => {
      const result = createAddressSchema.parse({
        ...validAddress,
        latitude: 33.3,
        longitude: 44.4,
      });
      expect(result.latitude).toBe(33.3);
    });

    it('should reject invalid latitude', () => {
      expect(() =>
        createAddressSchema.parse({ ...validAddress, latitude: 100 })
      ).toThrow();
    });

    it('should reject invalid longitude', () => {
      expect(() =>
        createAddressSchema.parse({ ...validAddress, longitude: 200 })
      ).toThrow();
    });

    it('should reject short phone', () => {
      expect(() =>
        createAddressSchema.parse({ ...validAddress, phone: '123' })
      ).toThrow();
    });
  });

  // ============================================
  // Promotion Schemas
  // ============================================
  describe('createPromotionSchema', () => {
    const futureDate = new Date(Date.now() + 86400000); // tomorrow
    const farFutureDate = new Date(Date.now() + 86400000 * 7); // week from now

    const validPromotion = {
      nameAr: 'خصم',
      nameEn: 'Discount',
      type: 'percentage' as const,
      value: 10,
      startDate: futureDate,
      endDate: farFutureDate,
      zones: [Zone.KARKH],
    };

    it('should accept valid percentage promotion', () => {
      const result = createPromotionSchema.parse(validPromotion);
      expect(result.type).toBe('percentage');
      expect(result.value).toBe(10);
    });

    it('should accept fixed discount', () => {
      const result = createPromotionSchema.parse({
        ...validPromotion,
        type: 'fixed',
        value: 5000,
      });
      expect(result.type).toBe('fixed');
    });

    it('should reject percentage over 100', () => {
      expect(() =>
        createPromotionSchema.parse({ ...validPromotion, value: 150 })
      ).toThrow();
    });

    it('should reject end date before start date', () => {
      expect(() =>
        createPromotionSchema.parse({
          ...validPromotion,
          startDate: farFutureDate,
          endDate: futureDate,
        })
      ).toThrow();
    });

    it('should require buy/get quantities for buy_x_get_y', () => {
      expect(() =>
        createPromotionSchema.parse({
          ...validPromotion,
          type: 'buy_x_get_y',
          value: 1,
        })
      ).toThrow();
    });

    it('should accept buy_x_get_y with quantities', () => {
      const result = createPromotionSchema.parse({
        ...validPromotion,
        type: 'buy_x_get_y',
        value: 1,
        buyQuantity: 2,
        getQuantity: 1,
      });
      expect(result.buyQuantity).toBe(2);
      expect(result.getQuantity).toBe(1);
    });
  });

  // ============================================
  // Company Schemas
  // ============================================
  describe('createCompanySchema', () => {
    const validCompany = {
      nameAr: 'شركة',
      nameEn: 'Company',
      zones: [Zone.KARKH, Zone.RUSAFA],
    };

    it('should accept valid company', () => {
      const result = createCompanySchema.parse(validCompany);
      expect(result.zones).toHaveLength(2);
    });

    it('should apply default commission', () => {
      const result = createCompanySchema.parse(validCompany);
      expect(result.commission).toBe(0);
    });

    it('should accept optional email and phone', () => {
      const result = createCompanySchema.parse({
        ...validCompany,
        email: 'company@example.com',
        phone: '1234567890',
      });
      expect(result.email).toBe('company@example.com');
    });

    it('should reject empty zones', () => {
      expect(() =>
        createCompanySchema.parse({ ...validCompany, zones: [] })
      ).toThrow();
    });
  });

  describe('updateCommissionSchema', () => {
    it('should accept valid commission', () => {
      const result = updateCommissionSchema.parse({ commission: 15 });
      expect(result.commission).toBe(15);
    });

    it('should reject negative commission', () => {
      expect(() =>
        updateCommissionSchema.parse({ commission: -5 })
      ).toThrow();
    });

    it('should reject commission over 100', () => {
      expect(() =>
        updateCommissionSchema.parse({ commission: 101 })
      ).toThrow();
    });
  });

  // ============================================
  // Admin Schemas
  // ============================================
  describe('createAdminSchema', () => {
    const validAdmin = {
      email: 'admin@example.com',
      password: 'admin12345',
      name: 'Admin User',
      role: UserRole.LOCATION_ADMIN,
      zones: [Zone.KARKH],
    };

    it('should accept valid admin', () => {
      const result = createAdminSchema.parse(validAdmin);
      expect(result.role).toBe(UserRole.LOCATION_ADMIN);
    });

    it('should reject SUPER_ADMIN role', () => {
      expect(() =>
        createAdminSchema.parse({ ...validAdmin, role: UserRole.SUPER_ADMIN })
      ).toThrow();
    });

    it('should reject SHOP_OWNER role', () => {
      expect(() =>
        createAdminSchema.parse({ ...validAdmin, role: UserRole.SHOP_OWNER })
      ).toThrow();
    });
  });

  describe('updateAdminZonesSchema', () => {
    it('should accept valid zones', () => {
      const result = updateAdminZonesSchema.parse({
        zones: [Zone.KARKH, Zone.RUSAFA],
      });
      expect(result.zones).toHaveLength(2);
    });

    it('should reject empty zones', () => {
      expect(() => updateAdminZonesSchema.parse({ zones: [] })).toThrow();
    });
  });

  // ============================================
  // Cart Schemas
  // ============================================
  describe('addToCartSchema', () => {
    it('should accept valid cart item', () => {
      const result = addToCartSchema.parse({
        productId: 'prod123',
        quantity: 3,
      });
      expect(result.quantity).toBe(3);
    });

    it('should reject zero quantity', () => {
      expect(() =>
        addToCartSchema.parse({ productId: 'prod123', quantity: 0 })
      ).toThrow();
    });

    it('should reject negative quantity', () => {
      expect(() =>
        addToCartSchema.parse({ productId: 'prod123', quantity: -1 })
      ).toThrow();
    });
  });

  // ============================================
  // Notification Schemas
  // ============================================
  describe('registerFcmTokenSchema', () => {
    it('should accept valid FCM token', () => {
      const result = registerFcmTokenSchema.parse({ fcmToken: 'abc123token' });
      expect(result.fcmToken).toBe('abc123token');
    });

    it('should reject empty token', () => {
      expect(() => registerFcmTokenSchema.parse({ fcmToken: '' })).toThrow();
    });
  });

  describe('sendNotificationSchema', () => {
    it('should accept valid notification', () => {
      const result = sendNotificationSchema.parse({
        title: 'Test Notification',
        body: 'This is a test',
      });
      expect(result.title).toBe('Test Notification');
    });

    it('should accept optional imageUrl', () => {
      const result = sendNotificationSchema.parse({
        title: 'Test',
        body: 'Body',
        imageUrl: 'https://example.com/img.jpg',
      });
      expect(result.imageUrl).toBe('https://example.com/img.jpg');
    });

    it('should reject invalid image URL', () => {
      expect(() =>
        sendNotificationSchema.parse({
          title: 'Test',
          body: 'Body',
          imageUrl: 'not-a-url',
        })
      ).toThrow();
    });
  });

  describe('sendToZoneSchema', () => {
    it('should accept valid zone notification', () => {
      const result = sendToZoneSchema.parse({
        title: 'Zone Alert',
        body: 'Message for zone',
        zone: Zone.KARKH,
      });
      expect(result.zone).toBe(Zone.KARKH);
    });
  });
});
