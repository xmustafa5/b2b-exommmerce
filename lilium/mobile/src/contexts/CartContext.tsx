import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';
import { cartApi, ServerCart } from '../services/api';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  addItem: (product: Product, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemQuantity: (productId: string) => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to convert server cart to local cart items
const serverCartToLocal = (serverCart: ServerCart): CartItem[] => {
  return serverCart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    product: item.product,
  }));
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      setIsAuthenticated(!!token);
    };
    checkAuth();

    // Listen for storage changes (login/logout)
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load cart from server when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCartFromServer();
    } else {
      // Clear cart when logged out
      setItems([]);
    }
  }, [isAuthenticated]);

  const loadCartFromServer = async () => {
    try {
      setLoading(true);
      setError(null);
      const serverCart = await cartApi.get();
      setItems(serverCartToLocal(serverCart));
    } catch (err: any) {
      console.error('Error loading cart from server:', err);
      // Don't set error for 401 (not authenticated)
      if (err.response?.status !== 401) {
        setError(err.message || 'Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      await loadCartFromServer();
    }
  }, [isAuthenticated]);

  const addItem = useCallback(async (product: Product, quantity: number) => {
    if (!isAuthenticated) {
      setError('Please log in to add items to cart');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure quantity is a valid number
      const validQuantity = Number(quantity) || 1;

      const serverCart = await cartApi.addItem(product.id, validQuantity);
      setItems(serverCartToLocal(serverCart));
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      setError(err.response?.data?.error || err.message || 'Failed to add item to cart');
      throw err; // Re-throw so UI can handle it
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const removeItem = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const serverCart = await cartApi.removeItem(productId);
      setItems(serverCartToLocal(serverCart));
    } catch (err: any) {
      console.error('Error removing from cart:', err);
      setError(err.response?.data?.error || err.message || 'Failed to remove item');
      // Refresh cart to get current state
      await loadCartFromServer();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const serverCart = await cartApi.removeItem(productId);
        setItems(serverCartToLocal(serverCart));
      } else {
        const serverCart = await cartApi.updateItem(productId, quantity);
        setItems(serverCartToLocal(serverCart));
      }
    } catch (err: any) {
      console.error('Error updating cart:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update quantity');
      // Refresh cart to get current state
      await loadCartFromServer();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await cartApi.clear();
      setItems([]);
    } catch (err: any) {
      console.error('Error clearing cart:', err);
      setError(err.response?.data?.error || err.message || 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getItemQuantity = useCallback((productId: string): number => {
    const item = items.find((item) => item.productId === productId);
    return item?.quantity || 0;
  }, [items]);

  const itemCount = items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);

  const subtotal = items.reduce(
    (total, item) => total + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        loading,
        error,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
