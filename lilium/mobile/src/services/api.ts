import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LoginRequest,
  LoginResponse,
  ProductsResponse,
  Product,
  CreateOrderInput,
  Order,
  OrdersResponse,
  Favorite,
  NotifyMeSubscription,
  CartValidationResult,
  QuickStockCheck,
  Promotion,
  Category,
  Address,
  AddressCreateInput,
} from '../types';

// API Base URL - Change this to your backend URL
// For development:
// - iOS Simulator: http://localhost:3000/api
// - Android Emulator: http://10.0.2.2:3000/api
// - Physical Device: http://YOUR_IP:3000/api
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // Mobile uses /auth/login/mobile endpoint (for SHOP_OWNER role)
    const response = await api.post('/auth/login/mobile', data);
    return response.data;
  },

  getMe: async (): Promise<any> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

// Products API
export const productsApi = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    zones?: string[];
  }): Promise<ProductsResponse> => {
    const response = await api.get('/products', { params });
    // Transform API response to match expected ProductsResponse type
    const apiData = response.data;
    return {
      products: (apiData.data || []).map((p: any) => ({
        ...p,
        // Map API field names to mobile type field names
        minOrderQuantity: p.minOrderQty || p.minOrderQuantity || 1,
        imageUrl: p.images?.[0] || p.imageUrl,
      })),
      total: apiData.pagination?.total || 0,
      page: apiData.pagination?.page || 1,
      totalPages: apiData.pagination?.totalPages || 1,
    };
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    const p = response.data;
    return {
      ...p,
      minOrderQuantity: p.minOrderQty || p.minOrderQuantity || 1,
      imageUrl: p.images?.[0] || p.imageUrl,
    };
  },

  getFeaturedProducts: async (zones?: string[]): Promise<Product[]> => {
    const response = await api.get('/products/featured', {
      params: { zones: zones?.join(',') },
    });
    const products = response.data.data || response.data || [];
    return products.map((p: any) => ({
      ...p,
      minOrderQuantity: p.minOrderQty || p.minOrderQuantity || 1,
      imageUrl: p.images?.[0] || p.imageUrl,
    }));
  },
};

// Orders API
export const ordersApi = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<OrdersResponse> => {
    const response = await api.get('/orders', { params });
    // Backend returns { orders, pagination: { page, limit, total, totalPages } }
    // Mobile expects { orders, total, page, totalPages }
    const apiData = response.data;
    return {
      orders: apiData.orders || [],
      total: apiData.pagination?.total || 0,
      page: apiData.pagination?.page || 1,
      totalPages: apiData.pagination?.totalPages || 1,
    };
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    // Map backend order to mobile Order type
    const order = response.data;
    return {
      ...order,
      totalAmount: order.total || order.totalAmount,
      deliveryAddress: order.address ?
        `${order.address.name}, ${order.address.street}, ${order.address.area}` :
        order.deliveryAddress || '',
    };
  },

  createOrder: async (data: CreateOrderInput): Promise<Order> => {
    const response = await api.post('/orders', data);
    const order = response.data;
    return {
      ...order,
      totalAmount: order.total || order.totalAmount,
      deliveryAddress: order.address ?
        `${order.address.name}, ${order.address.street}, ${order.address.area}` :
        order.deliveryAddress || '',
    };
  },
};

// Notifications API
export const notificationsApi = {
  registerToken: async (fcmToken: string): Promise<void> => {
    await api.post('/notifications/register-token', { fcmToken });
  },

  unregisterToken: async (): Promise<void> => {
    await api.delete('/notifications/unregister-token');
  },

  getStatus: async (): Promise<{ firebaseInitialized: boolean; tokenRegistered: boolean }> => {
    const response = await api.get('/notifications/status');
    return response.data;
  },

  testNotification: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/notifications/test');
    return response.data;
  },
};

// Favorites API
export const favoritesApi = {
  getAll: async (): Promise<Favorite[]> => {
    const response = await api.get('/users/favorites');
    return response.data;
  },

  add: async (productId: string): Promise<Favorite> => {
    const response = await api.post(`/users/favorites/${productId}`);
    return response.data;
  },

  remove: async (productId: string): Promise<void> => {
    await api.delete(`/users/favorites/${productId}`);
  },
};

// Notify-Me (Back in Stock) API
export const notifyMeApi = {
  subscribe: async (productId: string): Promise<NotifyMeSubscription> => {
    const response = await api.post(`/notify-me/${productId}`);
    // Backend returns { success, data, message } - extract data
    return response.data.data || response.data;
  },

  unsubscribe: async (productId: string): Promise<void> => {
    await api.delete(`/notify-me/${productId}`);
  },

  getMySubscriptions: async (): Promise<NotifyMeSubscription[]> => {
    const response = await api.get('/notify-me/my-subscriptions');
    // Backend returns { success, data: [...], count } - extract data array
    const subscriptions = response.data.data || response.data || [];
    // Map product fields for mobile compatibility
    return subscriptions.map((s: any) => ({
      ...s,
      product: s.product ? {
        ...s.product,
        imageUrl: s.product.images?.[0] || s.product.imageUrl,
        minOrderQuantity: s.product.minOrderQty || s.product.minOrderQuantity || 1,
      } : undefined,
    }));
  },

  checkSubscription: async (productId: string): Promise<{ subscribed: boolean }> => {
    const response = await api.get(`/notify-me/check/${productId}`);
    // Backend returns { success, isSubscribed, notified, subscribedAt }
    return { subscribed: response.data.isSubscribed || false };
  },
};

// Cart API (Validation)
export const cartApi = {
  validateCheckout: async (
    items: Array<{ productId: string; quantity: number }>,
    addressId?: string
  ): Promise<CartValidationResult> => {
    const response = await api.post('/cart/validate-checkout', { items, addressId });
    return response.data;
  },

  quickStockCheck: async (
    items: Array<{ productId: string; quantity: number }>
  ): Promise<QuickStockCheck> => {
    const response = await api.post('/cart/quick-stock-check', { items });
    return response.data;
  },
};

// Promotions API
export const promotionsApi = {
  getActive: async (): Promise<Promotion[]> => {
    const response = await api.get('/promotions', { params: { isActive: true } });
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Promotion> => {
    const response = await api.get(`/promotions/${id}`);
    return response.data;
  },

  preview: async (items: Array<{ productId: string; quantity: number }>): Promise<{
    applicablePromotions: Promotion[];
    totalSavings: number;
  }> => {
    const response = await api.post('/promotions/preview', { items });
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (filters?: { isActive?: boolean }): Promise<Category[]> => {
    const response = await api.get('/categories', { params: filters });
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
};

// Helper to transform backend address to mobile Address type
const transformAddress = (addr: any): Address => ({
  id: addr.id,
  userId: addr.userId,
  label: addr.name || addr.label, // Backend uses 'name', mobile uses 'label'
  street: addr.street,
  city: addr.area || addr.city, // Backend uses 'area', mobile uses 'city'
  zone: addr.zone,
  building: addr.building,
  floor: addr.floor,
  apartment: addr.apartment,
  landmark: addr.landmark,
  phone: addr.phone,
  isDefault: addr.isDefault,
});

// Helper to transform mobile AddressCreateInput to backend format
const transformAddressInput = (data: AddressCreateInput | Partial<AddressCreateInput>): any => ({
  name: data.label, // Mobile uses 'label', backend expects 'name'
  street: data.street,
  area: data.city, // Mobile uses 'city', backend expects 'area'
  zone: data.zone,
  building: data.building,
  floor: data.floor,
  apartment: data.apartment,
  landmark: data.landmark,
  phone: data.phone,
  isDefault: data.isDefault,
});

// Addresses API
export const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    const addresses = response.data.data || response.data || [];
    return addresses.map(transformAddress);
  },

  getById: async (id: string): Promise<Address> => {
    const response = await api.get(`/addresses/${id}`);
    return transformAddress(response.data);
  },

  create: async (data: AddressCreateInput): Promise<Address> => {
    const response = await api.post('/addresses', transformAddressInput(data));
    return transformAddress(response.data);
  },

  update: async (id: string, data: Partial<AddressCreateInput>): Promise<Address> => {
    const response = await api.put(`/addresses/${id}`, transformAddressInput(data));
    return transformAddress(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  setDefault: async (id: string): Promise<Address> => {
    const response = await api.patch(`/addresses/${id}/default`);
    return transformAddress(response.data);
  },
};

export { api };
export default api;
