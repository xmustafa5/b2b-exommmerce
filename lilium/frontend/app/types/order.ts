export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    shopName?: string;
    zone: string;
    phone?: string;
  };
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  deliveryAddress: {
    street: string;
    area: string;
    city: string;
    zone: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  notes?: string;
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    nameAr: string;
    images: string[];
    sku?: string;
  };
  quantity: number;
  price: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  note?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface OrderFilters {
  status?: OrderStatus;
  zone?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByZone: {
    zone: string;
    count: number;
    revenue: number;
  }[];
  ordersByStatus: {
    status: OrderStatus;
    count: number;
  }[];
  recentOrders: Order[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  note?: string;
}

export interface CancelOrderInput {
  reason?: string;
}
