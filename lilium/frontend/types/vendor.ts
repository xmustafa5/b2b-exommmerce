import type { Zone } from "./company";
import type { OrderStatus } from "./order";

// Note: Zone and OrderStatus are already exported from company and order modules

// Vendor Company (subset of Company with vendor-specific fields)
export interface VendorCompany {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  phone: string;
  address: string;
  zones: Zone[];
  deliveryFees: Record<Zone, number>;
  commission: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Vendor Company Update Input
export interface VendorCompanyUpdateInput {
  nameEn?: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  zones?: Zone[];
  deliveryFees?: Record<Zone, number>;
}

// Vendor Statistics
export interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

// Vendor Product
export interface VendorProduct {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  categoryId: string;
  category: {
    id: string;
    nameEn: string;
    nameAr: string;
  };
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Vendor Product Create Input
export interface VendorProductCreateInput {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sku: string;
  price: number;
  stock: number;
  isActive?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  categoryId: string;
}

// Vendor Product Update Input
export interface VendorProductUpdateInput {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sku?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  categoryId?: string;
}

// Vendor Product Stock Update
export interface VendorProductStockUpdate {
  stock: number;
}

// Vendor Product Filters
export interface VendorProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

// Vendor Order Item
export interface VendorOrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    nameEn: string;
    nameAr: string;
    sku: string;
    imageUrl?: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
}

// Vendor Order
export interface VendorOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  zone: Zone;
  shopId: string;
  shop: {
    id: string;
    nameEn: string;
    nameAr: string;
    phone: string;
    address: string;
  };
  items: VendorOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Vendor Order Filters
export interface VendorOrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  zone?: Zone;
  shopId?: string;
  startDate?: string;
  endDate?: string;
}

// Vendor Order Status Update
export interface VendorOrderStatusUpdate {
  status: OrderStatus;
}

// Vendor Customer
export interface VendorCustomer {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  email?: string;
  zone: Zone;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  createdAt: Date;
}

// Vendor Customer Filters
export interface VendorCustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  zone?: Zone;
}

// Export Types
export type VendorExportType = "products" | "orders" | "customers";
export type VendorExportFormat = "json" | "csv";

// API Response Types
export interface VendorCompanyResponse {
  success: boolean;
  company: VendorCompany;
}

export interface VendorStatsResponse {
  success: boolean;
  stats: VendorStats;
}

export interface VendorProductsResponse {
  success: boolean;
  data: VendorProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VendorProductResponse {
  success: boolean;
  product: VendorProduct;
}

export interface VendorOrdersResponse {
  success: boolean;
  data: VendorOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VendorOrderResponse {
  success: boolean;
  order: VendorOrder;
}

export interface VendorCustomersResponse {
  success: boolean;
  data: VendorCustomer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VendorExportResponse {
  success: boolean;
  data: any[];
  format: VendorExportFormat;
  exportedAt: string;
}
