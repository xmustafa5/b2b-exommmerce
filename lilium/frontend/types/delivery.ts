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
