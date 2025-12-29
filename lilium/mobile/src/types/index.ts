// User types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  LOCATION_ADMIN = 'LOCATION_ADMIN',
  SHOP_OWNER = 'SHOP_OWNER',
}

export enum Zone {
  KARKH = 'KARKH',
  RUSAFA = 'RUSAFA',
}

export interface User {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  role: UserRole;
  zones: Zone[];
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// Product types
export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number;
  stock: number;
  categoryId: string;
  category?: Category;
  companyId: string;
  imageUrl?: string;
  images: string[];
  zones: Zone[];
  minOrderQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order types
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  zone?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: {
    productId: string;
    quantity: number;
  }[];
  addressId: string;
  companyId: string;
  zone: 'KARKH' | 'RUSAFA';
  notes?: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer';
  deliveryDate?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

// Cart types
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

// Favorites types
export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

// Notify-Me (Back in Stock) types
export interface NotifyMeSubscription {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  notified: boolean;
  createdAt: string;
}

// Cart Validation types
export interface CartValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  validatedItems: Array<{
    productId: string;
    requestedQuantity: number;
    availableQuantity: number;
    isAvailable: boolean;
    price: number;
    adjustedQuantity?: number;
  }>;
  summary: {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
    itemCount: number;
  };
  promotionPreview?: {
    applicablePromotions: Promotion[];
    totalSavings: number;
  };
}

export interface QuickStockCheck {
  allAvailable: boolean;
  items: Array<{
    productId: string;
    requested: number;
    available: number;
    inStock: boolean;
  }>;
}

// Promotions types
export type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  buyQuantity?: number;
  getQuantity?: number;
  zones?: Zone[];
}

// Address types
export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  zone: Zone;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  phone?: string;
  isDefault: boolean;
}

export interface AddressCreateInput {
  label: string;
  street: string;
  city: string;
  zone: Zone;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  phone?: string;
  isDefault?: boolean;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Home: { categoryId?: string } | undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  Orders: undefined;
  OrderDetail: { orderId: string };
  Profile: undefined;
  Favorites: undefined;
  Addresses: undefined;
  AddAddress: undefined;
  EditAddress: { addressId: string };
  Categories: undefined;
  NotifyMeList: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  FavoritesTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};
