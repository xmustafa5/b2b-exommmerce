import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { productsApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import {
  useFavorites,
  useToggleFavorite,
  useCheckNotifyMe,
  useToggleNotifyMe,
} from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

// Helper for cross-platform alerts (Alert.alert doesn't work on web)
const showAlert = (title: string, message: string, buttons?: Array<{ text: string; style?: string; onPress?: () => void }>) => {
  if (Platform.OS === 'web') {
    // On web, use window.confirm for simple alerts
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { addItem, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getProductById(productId),
  });

  // Set initial quantity to minOrderQuantity when product loads
  useEffect(() => {
    if (product) {
      const minQty = Number(product.minOrderQuantity) || 1;
      setQuantity(minQty);
    }
  }, [product]);

  // Favorites
  const { data: favorites } = useFavorites();
  const { toggle: toggleFavorite, isLoading: isFavoriteLoading } = useToggleFavorite();
  const isFavorite = favorites?.some((fav) => fav.productId === productId) ?? false;

  // Notify-Me (for out of stock products)
  const { data: notifyMeStatus } = useCheckNotifyMe(productId);
  const { toggle: toggleNotifyMe, isLoading: isNotifyMeLoading } = useToggleNotifyMe();
  const isSubscribedToNotify = notifyMeStatus?.subscribed ?? false;

  const handleToggleFavorite = () => {
    toggleFavorite(productId, isFavorite);
  };

  const handleToggleNotifyMe = () => {
    toggleNotifyMe(productId, isSubscribedToNotify);
    if (!isSubscribedToNotify) {
      showAlert(
        'Notification Set',
        'We will notify you when this product is back in stock.'
      );
    }
  };

  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!product || addingToCart) return;

    const minQty = Number(product.minOrderQuantity) || 1;
    const stock = Number(product.stock) || 0;

    if (quantity < minQty) {
      showAlert(
        'Invalid Quantity',
        `Minimum order quantity is ${minQty}`
      );
      return;
    }

    if (quantity > stock) {
      showAlert('Out of Stock', `Only ${stock} items available`);
      return;
    }

    try {
      setAddingToCart(true);
      await addItem(product, quantity);
      showAlert('Success', 'Product added to cart', [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (err: any) {
      showAlert('Error', err.response?.data?.error || err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const incrementQuantity = () => {
    const stock = Number(product?.stock) || 0;
    if (product && quantity < stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load product</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentInCart = getItemQuantity(product.id);
  const stock = Number(product.stock) || 0;
  const price = Number(product.price) || 0;
  const minOrderQty = Number(product.minOrderQuantity) || 1;
  const isInStock = stock > 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Product Image with Favorite Button */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.favoriteButton, isFavoriteLoading && styles.disabledButton]}
            onPress={handleToggleFavorite}
            disabled={isFavoriteLoading}
          >
            <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>
              {isFavorite ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Product Name */}
          <Text style={styles.productName}>{product.nameEn}</Text>
          {product.nameAr && (
            <Text style={styles.productNameAr}>{product.nameAr}</Text>
          )}

          {/* Price */}
          <Text style={styles.price}>IQD {price.toLocaleString()}</Text>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            {isInStock ? (
              <View style={styles.inStockBadge}>
                <Text style={styles.inStockText}>In Stock: {stock}</Text>
              </View>
            ) : (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>

          {/* Min Order Quantity */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Minimum Order:</Text>
            <Text style={styles.infoValue}>{minOrderQty} units</Text>
          </View>

          {/* Currently in Cart */}
          {currentInCart > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>In Cart:</Text>
              <Text style={styles.infoValue}>{currentInCart} units</Text>
            </View>
          )}

          {/* Description */}
          {product.descriptionEn && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.descriptionEn}</Text>
            </View>
          )}

          {product.descriptionAr && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>الوصف</Text>
              <Text style={styles.descriptionText}>{product.descriptionAr}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {isInStock ? (
        <View style={styles.bottomBar}>
          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={decrementQuantity}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={incrementQuantity}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={[styles.addToCartButton, addingToCart && styles.disabledButton]}
            onPress={handleAddToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addToCartText}>Add to Cart</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* Notify Me Button for Out of Stock Products */
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.notifyMeButton,
              isSubscribedToNotify && styles.notifyMeButtonActive,
              isNotifyMeLoading && styles.disabledButton,
            ]}
            onPress={handleToggleNotifyMe}
            disabled={isNotifyMeLoading}
          >
            {isNotifyMeLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.notifyMeText}>
                {isSubscribedToNotify ? 'Notification Set' : 'Notify Me When Available'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  contentContainer: {
    backgroundColor: '#fff',
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productNameAr: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
    textAlign: 'right',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  stockContainer: {
    marginBottom: 16,
  },
  inStockBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  inStockText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  outOfStockBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  outOfStockText: {
    color: '#c62828',
    fontWeight: '600',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  descriptionContainer: {
    marginTop: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  favoriteIcon: {
    fontSize: 24,
    color: '#ccc',
  },
  favoriteIconActive: {
    color: '#e53935',
  },
  disabledButton: {
    opacity: 0.6,
  },
  notifyMeButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyMeButtonActive: {
    backgroundColor: '#4caf50',
  },
  notifyMeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
