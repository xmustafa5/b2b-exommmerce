import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your machine's local IP address for development
// Replace with your actual IP or use ngrok for testing
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'  // For iOS simulator
  // ? 'http://10.0.2.2:3000/api' // For Android emulator
  // ? 'http://YOUR_LOCAL_IP:3000/api' // For physical device
  : 'https://your-production-api.com/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
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
      // Handle unauthorized access
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // You might want to navigate to login screen here
      // Navigation will be handled by the auth state management
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    if (response.data.tokens?.accessToken) {
      await AsyncStorage.setItem('token', response.data.tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    if (response.data.tokens?.accessToken) {
      await AsyncStorage.setItem('token', response.data.tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
  },
};

// Users API
export const usersApi = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: { name?: string; email?: string }) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Health API
export const healthApi = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    zone?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByCategory: async (categoryId: string) => {
    const response = await api.get('/products', {
      params: { category: categoryId },
    });
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: {
    addressId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    notes?: string;
  }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};

// Favorites API
export const favoritesApi = {
  getAll: async () => {
    const response = await api.get('/users/me/favorites');
    return response.data;
  },

  add: async (productId: string) => {
    const response = await api.post(`/users/favorites/${productId}`);
    return response.data;
  },

  remove: async (productId: string) => {
    const response = await api.delete(`/users/favorites/${productId}`);
    return response.data;
  },
};

// Promotions API
export const promotionsApi = {
  getActive: async (zone: string) => {
    const response = await api.get(`/promotions/active/${zone}`);
    return response.data;
  },

  applyToCart: async (cartItems: Array<{ productId: string; quantity: number; price: number }>) => {
    const response = await api.post('/promotions/apply-to-cart', { cartItems });
    return response.data;
  },
};