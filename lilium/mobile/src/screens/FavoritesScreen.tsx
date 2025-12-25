import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Favorite } from '../types';
import { useFavorites, useRemoveFavorite } from '../hooks';
import { useCart } from '../contexts/CartContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

export const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const { data: favorites, isLoading, refetch, isFetching } = useFavorites();
  const removeFavorite = useRemoveFavorite();
  const { addItem } = useCart();

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleRemoveFavorite = (productId: string, productName: string) => {
    Alert.alert(
      'Remove from Favorites',
      `Remove "${productName}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFavorite.mutate(productId);
          },
        },
      ]
    );
  };

  const handleAddToCart = (favorite: Favorite) => {
    const { product } = favorite;
    if (product.stock > 0) {
      addItem(product, product.minOrderQuantity);
      Alert.alert('Added to Cart', `${product.nameEn} added to cart`);
    } else {
      Alert.alert('Out of Stock', 'This product is currently out of stock');
    }
  };

  const renderFavorite = ({ item }: { item: Favorite }) => {
    const { product } = item;
    const isInStock = product.stock > 0;

    return (
      <TouchableOpacity
        style={styles.favoriteCard}
        onPress={() => handleProductPress(product.id)}
      >
        {/* Product Image */}
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.nameEn}
          </Text>
          <Text style={styles.productPrice}>
            IQD {product.price.toLocaleString()}
          </Text>
          <View style={styles.stockContainer}>
            {isInStock ? (
              <Text style={styles.inStockText}>In Stock: {product.stock}</Text>
            ) : (
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(product.id, product.nameEn)}
          >
            <Text style={styles.removeButtonText}>♥</Text>
          </TouchableOpacity>
          {isInStock && (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item)}
            >
              <Text style={styles.addToCartText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !favorites) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <Text style={styles.headerSubtitle}>
          {favorites?.length || 0} {favorites?.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Favorites List */}
      <FlatList
        data={favorites || []}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.favoritesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>♡</Text>
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Save products you love by tapping the heart icon
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      />
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
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  favoritesList: {
    padding: 16,
  },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 10,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  stockContainer: {
    marginTop: 4,
  },
  inStockText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  outOfStockText: {
    fontSize: 12,
    color: '#c62828',
    fontWeight: '500',
  },
  actionsContainer: {
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    color: '#e53935',
  },
  addToCartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    color: '#ddd',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
