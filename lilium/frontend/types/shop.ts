export type DeliveryZone = "KARKH" | "RUSAFA";

export interface Shop {
  id: string;
  name: string;
  nameAr: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryZone: DeliveryZone;
  isActive: boolean;
  companyId: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ShopCreateInput {
  name: string;
  nameAr?: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  deliveryZone: DeliveryZone;
  companyId: string;
  ownerId?: string;
}

export interface ShopUpdateInput extends Partial<ShopCreateInput> {
  isActive?: boolean;
}

export interface ShopFilters {
  search?: string;
  companyId?: string;
  deliveryZone?: DeliveryZone;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ShopsResponse {
  data: Shop[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
