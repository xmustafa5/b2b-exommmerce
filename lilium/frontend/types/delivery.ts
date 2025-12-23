export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED";

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string | null;
  status: DeliveryStatus;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledDate: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  proofOfDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    total: number;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string | null;
  vehiclePlate: string | null;
  isActive: boolean;
  isAvailable: boolean;
  currentZone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAssignInput {
  driverId: string;
  scheduledDate?: string;
  notes?: string;
}

export interface DeliveryUpdateInput {
  status?: DeliveryStatus;
  notes?: string;
  proofOfDelivery?: string;
}

export interface DeliveryFilters {
  status?: DeliveryStatus;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DeliveriesResponse {
  data: Delivery[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Order Status Types for delivery workflow
export type OrderDeliveryStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

// Order Status Update Input
export interface OrderStatusUpdateInput {
  status: OrderDeliveryStatus;
  notes?: string;
  estimatedTime?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Bulk Status Update Input
export interface BulkStatusUpdateInput {
  orderIds: string[];
  status: OrderDeliveryStatus;
}

// Bulk Status Update Response
export interface BulkStatusUpdateResponse {
  success: boolean;
  updated: number;
  failed: number;
  message: string;
}

// Order with delivery details
export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: OrderDeliveryStatus;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    address: string;
    zone?: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      price: number;
      company?: {
        id: string;
        name: string;
      };
    };
  }[];
}

// Cash Collection Input
export interface CashCollectionInput {
  amount: number;
  notes?: string;
}

// Cash Collection Response
export interface CashCollectionRecord {
  id: string;
  orderId: string;
  amount: number;
  collectedBy: string;
  collectedAt: string;
  notes?: string;
}

// Driver Assignment Input
export interface DriverAssignmentInput {
  driverId: string;
}

// Driver Assignment Response
export interface DriverAssignment {
  orderId: string;
  driverId: string;
  assignedAt: string;
}

// Delivery Metrics
export interface DeliveryMetrics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageDeliveryTime: number;
  successRate: number;
  totalRevenue: number;
  cashCollected: number;
  ordersByStatus: Record<string, number>;
  ordersByZone: Record<string, number>;
}

// Tracking Info
export interface DeliveryTracking {
  orderId: string;
  status: OrderDeliveryStatus;
  estimatedDelivery?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  history: {
    status: string;
    timestamp: string;
    notes?: string;
  }[];
  driver?: {
    name: string;
    phone: string;
  };
}

// Active Deliveries Dashboard
export interface ActiveDeliveriesDashboard {
  activeOrders: {
    accepted: DeliveryOrder[];
    preparing: DeliveryOrder[];
    onTheWay: DeliveryOrder[];
  };
  summary: {
    total: number;
    accepted: number;
    preparing: number;
    onTheWay: number;
  };
}

// Delivery Metrics Period
export type MetricsPeriod = "today" | "week" | "month";
