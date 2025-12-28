import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    saveCart();
  }, [items]);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const parsedItems = JSON.parse(cartData);
        // Ensure quantity and price are numbers
        const validatedItems = parsedItems.map((item: CartItem) => ({
          ...item,
          quantity: Number(item.quantity) || 1,
          product: item.product ? {
            ...item.product,
            price: Number(item.product.price) || 0,
            stock: Number(item.product.stock) || 0,
            minOrderQuantity: Number(item.product.minOrderQuantity) || 1,
          } : item.product,
        }));
        setItems(validatedItems);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addItem = (product: Product, quantity: number) => {
    // Ensure quantity is a valid number
    const validQuantity = Number(quantity) || 1;

    // Ensure product has numeric values
    const validProduct: Product = {
      ...product,
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      minOrderQuantity: Number(product.minOrderQuantity) || 1,
    };

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === validProduct.id);

      if (existingItem) {
        // Update quantity of existing item
        return prevItems.map((item) =>
          item.productId === validProduct.id
            ? { ...item, quantity: (Number(item.quantity) || 0) + validQuantity, product: validProduct }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { productId: validProduct.id, product: validProduct, quantity: validQuantity }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (productId: string): number => {
    const item = items.find((item) => item.productId === productId);
    return item?.quantity || 0;
  };

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
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
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
