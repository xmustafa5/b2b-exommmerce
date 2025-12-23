// User types aligned with backend API

export type UserRole = "SUPER_ADMIN" | "LOCATION_ADMIN" | "SHOP_OWNER" | "VENDOR";
export type Zone = "KARKH" | "RUSAFA";

// Base User interface
export interface User {
  id: string;
  email: string;
  name: string;
  businessName?: string | null;
  phone?: string | null;
  role: UserRole;
  zones?: Zone[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Admin-specific interface (for admins list)
export interface Admin {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  zones: Zone[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Shop owner interface
export interface ShopOwner {
  id: string;
  email: string;
  name: string;
  businessName?: string | null;
  phone?: string | null;
  zones: Zone[];
  isActive: boolean;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

// Create admin input
export interface AdminCreateInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "LOCATION_ADMIN";
  zones: Zone[];
}

// Update admin input
export interface AdminUpdateInput {
  name?: string;
  phone?: string;
  isActive?: boolean;
  zones?: Zone[];
}

// Update user input (for regular users)
export interface UserUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
}

// Admin filters
export interface AdminFilters {
  role?: "SUPER_ADMIN" | "LOCATION_ADMIN";
  zone?: Zone;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Shop owner filters
export interface ShopOwnerFilters {
  zone?: Zone;
  search?: string;
  page?: number;
  limit?: number;
}

// Pagination response
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Admin list response
export interface AdminListResponse {
  admins: Admin[];
  pagination: PaginationInfo;
}

// Shop owner list response
export interface ShopOwnerListResponse {
  shopOwners: ShopOwner[];
  pagination: PaginationInfo;
}

// Admin stats
export interface AdminStats {
  totalAdmins: number;
  superAdmins: number;
  locationAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
  adminsByZone: Array<{
    zones: Zone[];
    count: number;
  }>;
}
