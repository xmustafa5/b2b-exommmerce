import { OrderService } from '../../services/order.service';
import { OrderStatus, Zone } from '@prisma/client';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockFastify: any;
  let mockPrisma: any;

  const mockUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    businessName: 'Test Business',
    zones: [Zone.KARKH],
  };

  const mockAddress = {
    id: 'addr1',
    userId: 'user1',
    zone: Zone.KARKH,
    name: 'Home',
    street: '123 Main St',
    area: 'Downtown',
    phone: '1234567890',
  };

  const mockProducts = [
    {
      id: 'prod1',
      nameEn: 'Product 1',
      nameAr: 'منتج 1',
      price: 10000,
      stock: 100,
      minOrderQty: 1,
      zones: [Zone.KARKH, Zone.RUSAFA],
      isActive: true,
    },
    {
      id: 'prod2',
      nameEn: 'Product 2',
      nameAr: 'منتج 2',
      price: 20000,
      stock: 50,
      minOrderQty: 5,
      zones: [Zone.KARKH],
      isActive: true,
    },
  ];

  const mockOrder = {
    id: 'order1',
    userId: 'user1',
    addressId: 'addr1',
    status: OrderStatus.PENDING,
    subtotal: 30000,
    deliveryFee: 5000,
    total: 35000,
    notes: 'Test order',
    createdAt: new Date(),
    orderItems: [
      {
        id: 'item1',
        productId: 'prod1',
        quantity: 1,
        price: 10000,
        total: 10000,
        product: mockProducts[0],
      },
      {
        id: 'item2',
        productId: 'prod2',
        quantity: 1,
        price: 20000,
        total: 20000,
        product: mockProducts[1],
      },
    ],
    address: mockAddress,
    user: mockUser,
    statusHistory: [{ status: OrderStatus.PENDING, note: 'Order created' }],
  };

  beforeEach(() => {
    mockPrisma = {
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      address: {
        findFirst: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      stockHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockFastify = {
      prisma: mockPrisma,
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
    };

    orderService = new OrderService(mockFastify);
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await orderService.getOrders(1, 20);

      expect(result.orders).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should filter orders by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      await orderService.getOrders(1, 20, { status: OrderStatus.PENDING });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PENDING,
          }),
        })
      );
    });

    it('should filter orders by userId', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      await orderService.getOrders(1, 20, { userId: 'user1' });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1',
          }),
        })
      );
    });

    it('should filter orders by date range', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await orderService.getOrders(1, 20, { startDate, endDate });

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should filter orders by zone for LOCATION_ADMIN', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.order.count.mockResolvedValue(1);

      await orderService.getOrders(1, 20, {}, 'LOCATION_ADMIN', [Zone.KARKH]);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            address: { zone: { in: [Zone.KARKH] } },
          }),
        })
      );
    });

    it('should calculate correct pagination', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      mockPrisma.order.count.mockResolvedValue(45);

      const result = await orderService.getOrders(2, 20);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('getOrderById', () => {
    it('should return order by ID', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order1');

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order1' },
        include: expect.any(Object),
      });
    });

    it('should filter by userId for SHOP_OWNER', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await orderService.getOrderById('order1', 'user1', 'SHOP_OWNER');

      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order1', userId: 'user1' },
        })
      );
    });

    it('should throw error when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(orderService.getOrderById('nonexistent')).rejects.toThrow(
        'Order not found'
      );
    });
  });

  describe('createOrder', () => {
    const validOrderInput = {
      userId: 'user1',
      addressId: 'addr1',
      items: [
        { productId: 'prod1', quantity: 1 },
        { productId: 'prod2', quantity: 5 },
      ],
      notes: 'Test order',
    };

    it('should create a new order', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(mockAddress);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        return fn({
          order: { create: jest.fn().mockResolvedValue(mockOrder) },
          product: { update: jest.fn() },
          stockHistory: { create: jest.fn() },
        });
      });

      const result = await orderService.createOrder(validOrderInput);

      expect(result).toEqual(mockOrder);
    });

    it('should throw error when address not found', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(null);

      await expect(orderService.createOrder(validOrderInput)).rejects.toThrow(
        'Address not found or does not belong to user'
      );
    });

    it('should throw error when some products not found', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(mockAddress);
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[0]]); // Only return one product

      await expect(orderService.createOrder(validOrderInput)).rejects.toThrow(
        'Some products not found or inactive'
      );
    });

    it('should throw error when insufficient stock', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(mockAddress);
      mockPrisma.product.findMany.mockResolvedValue([
        { ...mockProducts[0], stock: 0 }, // Only one product with zero stock
      ]);

      await expect(
        orderService.createOrder({
          userId: 'user1',
          addressId: 'addr1',
          items: [{ productId: 'prod1', quantity: 1 }], // Only one item
        })
      ).rejects.toThrow('Insufficient stock for Product 1');
    });

    it('should throw error when below minimum order quantity', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(mockAddress);
      mockPrisma.product.findMany.mockResolvedValue([mockProducts[1]]); // Product with minOrderQty = 5

      await expect(
        orderService.createOrder({
          userId: 'user1',
          addressId: 'addr1',
          items: [{ productId: 'prod2', quantity: 2 }], // Below minimum
        })
      ).rejects.toThrow('Minimum order quantity for Product 2 is 5');
    });

    it('should throw error when product not available in zone', async () => {
      const rusafaAddress = { ...mockAddress, zone: Zone.RUSAFA };
      const karkhOnlyProduct = [{ ...mockProducts[1], zones: [Zone.KARKH] }];

      mockPrisma.address.findFirst.mockResolvedValue(rusafaAddress);
      mockPrisma.product.findMany.mockResolvedValue(karkhOnlyProduct);

      await expect(
        orderService.createOrder({
          userId: 'user1',
          addressId: 'addr1',
          items: [{ productId: 'prod2', quantity: 5 }],
        })
      ).rejects.toThrow('Product Product 2 is not available in RUSAFA zone');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
      });
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      const result = await orderService.updateOrderStatus(
        'order1',
        OrderStatus.CONFIRMED,
        'Order confirmed'
      );

      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw error when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        orderService.updateOrderStatus('nonexistent', OrderStatus.CONFIRMED)
      ).rejects.toThrow('Order not found');
    });

    it('should throw error for invalid status transition', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      await expect(
        orderService.updateOrderStatus('order1', OrderStatus.PENDING)
      ).rejects.toThrow('Cannot transition from DELIVERED to PENDING');
    });

    it('should allow cancellation from pending', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
        orderItems: mockOrder.orderItems,
      });
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await orderService.updateOrderStatus(
        'order1',
        OrderStatus.CANCELLED
      );

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel pending order', async () => {
      mockPrisma.order.findUnique
        .mockResolvedValueOnce({ ...mockOrder, status: OrderStatus.PENDING })
        .mockResolvedValueOnce({ ...mockOrder, status: OrderStatus.PENDING, orderItems: mockOrder.orderItems });
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await orderService.cancelOrder('order1', 'user1', 'SHOP_OWNER');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw error when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        orderService.cancelOrder('nonexistent', 'user1', 'SHOP_OWNER')
      ).rejects.toThrow('Order not found');
    });

    it('should throw error when shop owner tries to cancel others order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        userId: 'otherUser',
        status: OrderStatus.PENDING,
      });

      await expect(
        orderService.cancelOrder('order1', 'user1', 'SHOP_OWNER')
      ).rejects.toThrow('Not authorized to cancel this order');
    });

    it('should throw error when shop owner tries to cancel non-pending order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      await expect(
        orderService.cancelOrder('order1', 'user1', 'SHOP_OWNER')
      ).rejects.toThrow('Can only cancel pending orders');
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      mockPrisma.order.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(15) // confirmed
        .mockResolvedValueOnce(20) // processing
        .mockResolvedValueOnce(25) // shipped
        .mockResolvedValueOnce(20) // delivered
        .mockResolvedValueOnce(10); // cancelled
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { total: 5000000 },
      });

      const result = await orderService.getOrderStats();

      expect(result.totalOrders).toBe(100);
      expect(result.pendingOrders).toBe(10);
      expect(result.confirmedOrders).toBe(15);
      expect(result.processingOrders).toBe(20);
      expect(result.shippedOrders).toBe(25);
      expect(result.deliveredOrders).toBe(20);
      expect(result.cancelledOrders).toBe(10);
      expect(result.totalRevenue).toBe(5000000);
    });

    it('should filter stats by zone', async () => {
      mockPrisma.order.count.mockResolvedValue(50);
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { total: 2500000 },
      });

      await orderService.getOrderStats(Zone.KARKH);

      expect(mockPrisma.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            address: { zone: Zone.KARKH },
          }),
        })
      );
    });

    it('should return 0 revenue when no orders', async () => {
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { total: null },
      });

      const result = await orderService.getOrderStats();

      expect(result.totalRevenue).toBe(0);
    });
  });
});
