// User types
export interface User {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'LOCATION_ADMIN' | 'SHOP_OWNER';
  zones: string[];
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sku: string;
  price: number;
  stock: number;
  minOrderQuantity: number;
  zones: string[];
  images: string[];
  categoryId: string;
  category?: Category;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order types
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  addressId: string;
  address?: Address;
  zone: string;
  createdAt: string;
  updatedAt: string;
}

// Address types
export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  building: string;
  zone: 'KARKH' | 'RUSAFA';
  city: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Promotion types
export interface Promotion {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  zones: string[];
  isActive: boolean;
  products?: Array<{ productId: string; product: Product }>;
  categories?: Array<{ categoryId: string; category: Category }>;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  appliedPromotions?: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    discountAmount: number;
  }>;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ProductDetails: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  MyOrders: undefined;
  OrderDetails: { orderId: string };
  Profile: undefined;
  Favorites: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
};
