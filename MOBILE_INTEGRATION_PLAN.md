# MOBILE INTEGRATION PLAN
## Lilium B2B E-Commerce Mobile App - React Native Integration Guide

**Last Updated:** December 22, 2025
**Backend Status:** 100% Complete - Ready for Integration

---

## OVERVIEW

This document outlines the integration plan for connecting the React Native Mobile application with the completed backend API. The mobile app is located at `/lilium/mobile/` and uses:

- **Framework:** React Native 0.81.5 + Expo 54
- **State Management:** React Query + Zustand
- **Forms:** react-hook-form + Zod
- **HTTP Client:** Axios
- **Storage:** AsyncStorage
- **Notifications:** Firebase Cloud Messaging

---

## CURRENT MOBILE STATUS

### Already Implemented
| Feature | Status | Location |
|---------|--------|----------|
| Login/Auth | ✅ | `screens/LoginScreen.tsx` |
| Product Listing | ✅ | `screens/HomeScreen.tsx` |
| Product Detail | ✅ | `screens/ProductDetailScreen.tsx` |
| Shopping Cart | ✅ | `contexts/CartContext.tsx` |
| Checkout | ✅ | `screens/CheckoutScreen.tsx` |
| Order History | ✅ | `screens/OrdersScreen.tsx` |
| Order Detail | ✅ | `screens/OrderDetailScreen.tsx` |
| User Profile | ✅ | `screens/ProfileScreen.tsx` |
| Push Notifications | ✅ | `services/notifications.ts` |

### Missing Integrations
| Feature | Priority | Backend Ready |
|---------|----------|---------------|
| Favorites | HIGH | ✅ |
| Notify-Me (Back in Stock) | HIGH | ✅ |
| Cart Validation (Pre-checkout) | HIGH | ✅ |
| Promotions Display | HIGH | ✅ |
| Address Management | MEDIUM | ✅ |
| Search & Filters Enhancement | MEDIUM | ✅ |
| Order Tracking (Real-time) | MEDIUM | ✅ |
| Category Navigation | LOW | ✅ |

---

## INTEGRATION TASKS

### Phase 1: Core Features (High Priority)

#### 1.1 Favorites Feature
**Backend Endpoints:**
- `POST /api/users/favorites/:productId` - Add to favorites
- `DELETE /api/users/favorites/:productId` - Remove from favorites
- `GET /api/users/favorites` - List user favorites

**Implementation Steps:**

1. **Update Types** (`src/types/index.ts`):
```typescript
export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}
```

2. **Add API Methods** (`src/services/api.ts`):
```typescript
export const favoritesApi = {
  getAll: async (): Promise<Favorite[]> => {
    const { data } = await apiClient.get('/users/favorites');
    return data;
  },

  add: async (productId: string): Promise<Favorite> => {
    const { data } = await apiClient.post(`/users/favorites/${productId}`);
    return data;
  },

  remove: async (productId: string): Promise<void> => {
    await apiClient.delete(`/users/favorites/${productId}`);
  },

  check: async (productId: string): Promise<boolean> => {
    try {
      const favorites = await favoritesApi.getAll();
      return favorites.some(f => f.productId === productId);
    } catch {
      return false;
    }
  },
};
```

3. **Create Custom Hook** (`src/hooks/useFavorites.ts`):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '../services/api';

const favoritesKeys = {
  all: ['favorites'] as const,
  list: () => [...favoritesKeys.all, 'list'] as const,
};

export function useFavorites() {
  return useQuery({
    queryKey: favoritesKeys.list(),
    queryFn: favoritesApi.getAll,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: favoritesApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoritesKeys.all });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: favoritesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoritesKeys.all });
    },
  });
}

export function useIsFavorite(productId: string) {
  const { data: favorites } = useFavorites();
  return favorites?.some(f => f.productId === productId) ?? false;
}
```

4. **Create Favorites Screen** (`src/screens/FavoritesScreen.tsx`):
```typescript
import React from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useFavorites, useRemoveFavorite } from '../hooks/useFavorites';
import { useNavigation } from '@react-navigation/native';

export default function FavoritesScreen() {
  const { data: favorites, isLoading } = useFavorites();
  const removeFavorite = useRemoveFavorite();
  const navigation = useNavigation();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (!favorites?.length) {
    return (
      <View style={styles.empty}>
        <Text>No favorites yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
        >
          <Image source={{ uri: item.product.images?.[0] }} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.product.name}</Text>
            <Text style={styles.price}>{item.product.price} IQD</Text>
          </View>
          <TouchableOpacity
            onPress={() => removeFavorite.mutate(item.productId)}
          >
            <Text>Remove</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );
}
```

5. **Add Heart Button to ProductDetailScreen**:
```typescript
// In ProductDetailScreen.tsx
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from '../hooks/useFavorites';

// Inside component:
const isFavorite = useIsFavorite(productId);
const addFavorite = useAddFavorite();
const removeFavorite = useRemoveFavorite();

const handleFavoritePress = () => {
  if (isFavorite) {
    removeFavorite.mutate(productId);
  } else {
    addFavorite.mutate(productId);
  }
};

// In JSX:
<TouchableOpacity onPress={handleFavoritePress}>
  <Icon name={isFavorite ? "heart" : "heart-outline"} />
</TouchableOpacity>
```

6. **Add Favorites Tab to Navigation**:
```typescript
// In App.tsx - Add to MainTabs
<Tab.Screen
  name="Favorites"
  component={FavoritesScreen}
  options={{
    tabBarIcon: ({ color }) => <Icon name="heart" size={24} color={color} />,
  }}
/>
```

---

#### 1.2 Notify-Me (Back in Stock) Feature
**Backend Endpoints:**
- `POST /api/notify-me/:productId` - Subscribe
- `DELETE /api/notify-me/:productId` - Unsubscribe
- `GET /api/notify-me/my-subscriptions` - User's subscriptions
- `GET /api/notify-me/check/:productId` - Check if subscribed

**Implementation Steps:**

1. **Add Types** (`src/types/index.ts`):
```typescript
export interface NotifyMeSubscription {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  notified: boolean;
  createdAt: string;
}
```

2. **Add API Methods** (`src/services/api.ts`):
```typescript
export const notifyMeApi = {
  subscribe: async (productId: string): Promise<NotifyMeSubscription> => {
    const { data } = await apiClient.post(`/notify-me/${productId}`);
    return data;
  },

  unsubscribe: async (productId: string): Promise<void> => {
    await apiClient.delete(`/notify-me/${productId}`);
  },

  getMySubscriptions: async (): Promise<NotifyMeSubscription[]> => {
    const { data } = await apiClient.get('/notify-me/my-subscriptions');
    return data;
  },

  checkSubscription: async (productId: string): Promise<{ subscribed: boolean }> => {
    const { data } = await apiClient.get(`/notify-me/check/${productId}`);
    return data;
  },
};
```

3. **Create Hook** (`src/hooks/useNotifyMe.ts`):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifyMeApi } from '../services/api';

const notifyMeKeys = {
  all: ['notify-me'] as const,
  subscriptions: () => [...notifyMeKeys.all, 'subscriptions'] as const,
  check: (productId: string) => [...notifyMeKeys.all, 'check', productId] as const,
};

export function useMySubscriptions() {
  return useQuery({
    queryKey: notifyMeKeys.subscriptions(),
    queryFn: notifyMeApi.getMySubscriptions,
  });
}

export function useCheckSubscription(productId: string) {
  return useQuery({
    queryKey: notifyMeKeys.check(productId),
    queryFn: () => notifyMeApi.checkSubscription(productId),
    enabled: !!productId,
  });
}

export function useSubscribeNotifyMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notifyMeApi.subscribe,
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: notifyMeKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: notifyMeKeys.check(productId) });
    },
  });
}

export function useUnsubscribeNotifyMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notifyMeApi.unsubscribe,
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: notifyMeKeys.subscriptions() });
      queryClient.invalidateQueries({ queryKey: notifyMeKeys.check(productId) });
    },
  });
}
```

4. **Add to ProductDetailScreen** (for out-of-stock products):
```typescript
// Show "Notify Me" button when product is out of stock
const { data: subscription } = useCheckSubscription(productId);
const subscribe = useSubscribeNotifyMe();
const unsubscribe = useUnsubscribeNotifyMe();

// In JSX when stock === 0:
{product.stock === 0 && (
  <TouchableOpacity
    style={styles.notifyButton}
    onPress={() => {
      if (subscription?.subscribed) {
        unsubscribe.mutate(productId);
      } else {
        subscribe.mutate(productId);
      }
    }}
  >
    <Icon name="bell" />
    <Text>{subscription?.subscribed ? 'Cancel Notification' : 'Notify Me When Available'}</Text>
  </TouchableOpacity>
)}
```

---

#### 1.3 Cart Validation (Pre-Checkout)
**Backend Endpoints:**
- `POST /api/cart/validate-checkout` - Full validation
- `POST /api/cart/quick-stock-check` - Quick stock check

**Implementation Steps:**

1. **Add Types** (`src/types/index.ts`):
```typescript
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
    applicablePromotions: any[];
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
```

2. **Add API Methods** (`src/services/api.ts`):
```typescript
export const cartApi = {
  validateCheckout: async (
    items: Array<{ productId: string; quantity: number }>,
    addressId?: string
  ): Promise<CartValidationResult> => {
    const { data } = await apiClient.post('/cart/validate-checkout', {
      items,
      addressId,
    });
    return data;
  },

  quickStockCheck: async (
    items: Array<{ productId: string; quantity: number }>
  ): Promise<QuickStockCheck> => {
    const { data } = await apiClient.post('/cart/quick-stock-check', { items });
    return data;
  },
};
```

3. **Update CartContext** (`src/contexts/CartContext.tsx`):
```typescript
// Add validation method to context
const validateCart = async () => {
  const items = cartItems.map(item => ({
    productId: item.product.id,
    quantity: item.quantity,
  }));
  return await cartApi.validateCheckout(items);
};

// Export in context value
return (
  <CartContext.Provider value={{
    ...existingValues,
    validateCart,
  }}>
    {children}
  </CartContext.Provider>
);
```

4. **Update CheckoutScreen** (`src/screens/CheckoutScreen.tsx`):
```typescript
import { useCart } from '../contexts/CartContext';

export default function CheckoutScreen() {
  const { items, validateCart } = useCart();
  const [validation, setValidation] = useState<CartValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const runValidation = async () => {
      setValidating(true);
      try {
        const result = await validateCart();
        setValidation(result);

        if (!result.valid) {
          // Show errors to user
          Alert.alert('Cart Issues', result.errors.join('\n'));
        }
      } catch (error) {
        console.error('Validation failed:', error);
      } finally {
        setValidating(false);
      }
    };

    runValidation();
  }, [items]);

  // Show warnings if any
  {validation?.warnings.length > 0 && (
    <View style={styles.warnings}>
      {validation.warnings.map((warning, index) => (
        <Text key={index} style={styles.warningText}>{warning}</Text>
      ))}
    </View>
  )}

  // Show promotion savings preview
  {validation?.promotionPreview?.totalSavings > 0 && (
    <View style={styles.savings}>
      <Text>You save: {validation.promotionPreview.totalSavings} IQD</Text>
    </View>
  )}

  // Disable checkout button if invalid
  <Button
    title="Place Order"
    disabled={!validation?.valid || validating}
    onPress={handlePlaceOrder}
  />
}
```

---

#### 1.4 Promotions Display
**Backend Endpoints:**
- `GET /api/promotions` - List active promotions
- `POST /api/promotions/preview` - Preview savings

**Implementation Steps:**

1. **Add Types** (`src/types/index.ts`):
```typescript
export type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  startDate: string;
  endDate: string;
  buyQuantity?: number;
  getQuantity?: number;
}
```

2. **Add API Methods** (`src/services/api.ts`):
```typescript
export const promotionsApi = {
  getActive: async (): Promise<Promotion[]> => {
    const { data } = await apiClient.get('/promotions?isActive=true');
    return data.data || data;
  },

  preview: async (items: Array<{ productId: string; quantity: number }>): Promise<{
    applicablePromotions: any[];
    totalSavings: number;
  }> => {
    const { data } = await apiClient.post('/promotions/preview', { items });
    return data;
  },
};
```

3. **Create Promotions Banner Component** (`src/components/PromotionsBanner.tsx`):
```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi } from '../services/api';

export default function PromotionsBanner() {
  const { data: promotions } = useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: promotionsApi.getActive,
  });

  if (!promotions?.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {promotions.map((promo) => (
        <View key={promo.id} style={styles.card}>
          <Text style={styles.name}>{promo.name}</Text>
          <Text style={styles.description}>
            {promo.type === 'percentage' && `${promo.value}% OFF`}
            {promo.type === 'fixed' && `${promo.value} IQD OFF`}
            {promo.type === 'buy_x_get_y' && `Buy ${promo.buyQuantity} Get ${promo.getQuantity} Free`}
            {promo.type === 'bundle' && 'Bundle Deal'}
          </Text>
          {promo.code && <Text style={styles.code}>Code: {promo.code}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
```

4. **Add to HomeScreen**:
```typescript
// At the top of the product list
<PromotionsBanner />
```

---

### Phase 2: Medium Priority Features

#### 2.1 Address Management
**Backend Endpoints:**
- `GET /api/addresses` - List addresses
- `POST /api/addresses` - Create address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `PATCH /api/addresses/:id/default` - Set as default

**Implementation:**

1. **Create AddressesScreen** (`src/screens/AddressesScreen.tsx`)
2. **Create AddAddressScreen** (`src/screens/AddAddressScreen.tsx`)
3. **Create EditAddressScreen** (`src/screens/EditAddressScreen.tsx`)
4. **Add address selection to CheckoutScreen**

```typescript
// src/services/api.ts
export const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const { data } = await apiClient.get('/addresses');
    return data;
  },

  create: async (address: AddressCreateInput): Promise<Address> => {
    const { data } = await apiClient.post('/addresses', address);
    return data;
  },

  update: async (id: string, address: Partial<AddressCreateInput>): Promise<Address> => {
    const { data } = await apiClient.put(`/addresses/${id}`, address);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },

  setDefault: async (id: string): Promise<Address> => {
    const { data } = await apiClient.patch(`/addresses/${id}/default`);
    return data;
  },
};
```

---

#### 2.2 Enhanced Search & Filters
**Backend Query Parameters:**
- `search` - Text search
- `categoryId` - Filter by category
- `minPrice` / `maxPrice` - Price range
- `zone` - Zone filter
- `inStock` - Only in-stock items
- `sortBy` - Sort field
- `sortOrder` - asc/desc

**Implementation:**

1. **Create FilterModal** (`src/components/FilterModal.tsx`):
```typescript
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Switch } from 'react-native';
import Slider from '@react-native-community/slider';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ProductFilters) => void;
  initialFilters: ProductFilters;
}

export default function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
  const [filters, setFilters] = useState(initialFilters);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Filters</Text>

        {/* Price Range */}
        <Text>Price Range</Text>
        <Slider
          minimumValue={0}
          maximumValue={1000000}
          value={filters.maxPrice || 1000000}
          onValueChange={(value) => setFilters({ ...filters, maxPrice: value })}
        />

        {/* In Stock Only */}
        <View style={styles.row}>
          <Text>In Stock Only</Text>
          <Switch
            value={filters.inStock}
            onValueChange={(value) => setFilters({ ...filters, inStock: value })}
          />
        </View>

        {/* Category Picker */}
        {/* ... */}

        <TouchableOpacity onPress={() => onApply(filters)}>
          <Text>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
```

2. **Update HomeScreen** with filter support:
```typescript
const [filters, setFilters] = useState<ProductFilters>({});
const [filterModalVisible, setFilterModalVisible] = useState(false);

const { data: products } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => productsApi.getProducts(filters),
});

// Add filter button to header
<TouchableOpacity onPress={() => setFilterModalVisible(true)}>
  <Icon name="filter" />
</TouchableOpacity>

<FilterModal
  visible={filterModalVisible}
  onClose={() => setFilterModalVisible(false)}
  onApply={(newFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  }}
  initialFilters={filters}
/>
```

---

#### 2.3 Real-Time Order Tracking
**Backend WebSocket:**
- `ws://localhost:3000/ws` - WebSocket endpoint
- Events: `order:updated`, `order:new`

**Implementation:**

1. **Install WebSocket library**:
```bash
npm install react-native-websocket
```

2. **Create WebSocket Hook** (`src/hooks/useOrderTracking.ts`):
```typescript
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function useOrderTracking(orderId: string) {
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!orderId || !accessToken) return;

    const ws = new WebSocket(`ws://localhost:3000/ws?token=${accessToken}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Subscribe to order updates
      ws.send(JSON.stringify({ type: 'subscribe', orderId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'order:updated' && data.orderId === orderId) {
        setOrderStatus(data.status);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [orderId, accessToken]);

  return orderStatus;
}
```

3. **Add to OrderDetailScreen**:
```typescript
const liveStatus = useOrderTracking(orderId);
const displayStatus = liveStatus || order?.status;
```

---

### Phase 3: Low Priority Features

#### 3.1 Category Navigation
**Backend Endpoint:**
- `GET /api/categories` - List categories (hierarchical)

**Implementation:**
Create a categories screen with subcategory navigation.

---

## NAVIGATION UPDATES

Add new screens to navigation:

```typescript
// App.tsx
<Stack.Navigator>
  {/* Existing screens */}
  <Stack.Screen name="Favorites" component={FavoritesScreen} />
  <Stack.Screen name="Addresses" component={AddressesScreen} />
  <Stack.Screen name="AddAddress" component={AddAddressScreen} />
  <Stack.Screen name="EditAddress" component={EditAddressScreen} />
  <Stack.Screen name="Categories" component={CategoriesScreen} />
  <Stack.Screen name="NotifyMeList" component={NotifyMeListScreen} />
</Stack.Navigator>

// Update MainTabs
<Tab.Navigator>
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="Favorites" component={FavoritesScreen} />
  <Tab.Screen name="Cart" component={CartScreen} />
  <Tab.Screen name="Orders" component={OrdersScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>
```

---

## API CLIENT UPDATES

Update `src/services/api.ts` with all new endpoints:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';
// For Android emulator: http://10.0.2.2:3000/api
// For physical device: http://YOUR_IP:3000/api

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

// Export all API modules
export { authApi } from './auth';
export { productsApi } from './products';
export { ordersApi } from './orders';
export { favoritesApi } from './favorites';
export { notifyMeApi } from './notifyMe';
export { cartApi } from './cart';
export { promotionsApi } from './promotions';
export { addressesApi } from './addresses';
export { notificationsApi } from './notifications';
```

---

## TYPE DEFINITIONS

Complete type definitions for `src/types/index.ts`:

```typescript
// User & Auth
export type UserRole = 'SUPER_ADMIN' | 'LOCATION_ADMIN' | 'SHOP_OWNER';
export type Zone = 'KARKH' | 'RUSAFA';

export interface User {
  id: string;
  email: string;
  name?: string;
  businessName?: string;
  phone?: string;
  role: UserRole;
  zones: Zone[];
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Products
export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sku?: string;
  images: string[];
  categoryId?: string;
  category?: Category;
  zones: Zone[];
  isActive: boolean;
  isFeatured: boolean;
  minOrderQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  zone?: Zone;
  inStock?: boolean;
  isFeatured?: boolean;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Categories
export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  productCount?: number;
}

// Orders
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  address?: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

// Addresses
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

// Cart
export interface CartItem {
  product: Product;
  quantity: number;
}

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
    applicablePromotions: any[];
    totalSavings: number;
  };
}

// Promotions
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
}

// Favorites
export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

// Notify Me
export interface NotifyMeSubscription {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  notified: boolean;
  createdAt: string;
}

// Navigation
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ProductDetail: { productId: string };
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  OrderDetail: { orderId: string };
  Favorites: undefined;
  Addresses: undefined;
  AddAddress: undefined;
  EditAddress: { addressId: string };
  Categories: undefined;
  NotifyMeList: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Favorites: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};
```

---

## IMPLEMENTATION ORDER

| Week | Tasks | Priority |
|------|-------|----------|
| 1 | Favorites Feature (API + UI) | HIGH |
| 1 | Notify-Me Feature (API + UI) | HIGH |
| 2 | Cart Validation Pre-Checkout | HIGH |
| 2 | Promotions Banner Display | HIGH |
| 3 | Address Management (CRUD) | MEDIUM |
| 3 | Search & Filter Enhancements | MEDIUM |
| 4 | Real-Time Order Tracking | MEDIUM |
| 4 | Category Navigation | LOW |
| 5 | Testing & Bug Fixes | HIGH |

---

## PACKAGES TO INSTALL

```bash
# UI Components
npm install @react-native-community/slider

# WebSocket (for real-time updates)
npm install react-native-websocket

# Icons (if not already)
npm install @expo/vector-icons

# Animations (optional)
npm install react-native-reanimated
```

---

## TESTING CHECKLIST

- [ ] Login/Logout works correctly
- [ ] Products load with pagination
- [ ] Add/Remove favorites works
- [ ] Notify-me subscribe/unsubscribe works
- [ ] Cart validation shows errors/warnings
- [ ] Promotions banner displays correctly
- [ ] Address CRUD operations work
- [ ] Filters apply correctly
- [ ] Order placement succeeds
- [ ] Push notifications received
- [ ] WebSocket updates work (if implemented)

---

## NOTES

1. **Update API_BASE_URL** for different environments (simulator, emulator, physical device)
2. **Handle offline scenarios** gracefully with error messages
3. **Cache important data** using React Query's stale time
4. **Test on both iOS and Android**
5. **Ensure Firebase is configured** for push notifications

---

**Document Owner:** Development Team
**Created:** December 22, 2025
