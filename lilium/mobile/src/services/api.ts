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
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getFeaturedProducts: async (zones?: string[]): Promise<Product[]> => {
    const response = await api.get('/products/featured', {
      params: { zones: zones?.join(',') },
    });
    return response.data;
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
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (data: CreateOrderInput): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
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
    return response.data;
  },

  unsubscribe: async (productId: string): Promise<void> => {
    await api.delete(`/notify-me/${productId}`);
  },

  getMySubscriptions: async (): Promise<NotifyMeSubscription[]> => {
    const response = await api.get('/notify-me/my-subscriptions');
    return response.data;
  },

  checkSubscription: async (productId: string): Promise<{ subscribed: boolean }> => {
    const response = await api.get(`/notify-me/check/${productId}`);
    return response.data;
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

// Addresses API
export const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Address> => {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  create: async (data: AddressCreateInput): Promise<Address> => {
    const response = await api.post('/addresses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<AddressCreateInput>): Promise<Address> => {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  setDefault: async (id: string): Promise<Address> => {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data;
  },
};

export { api };
export default api;
