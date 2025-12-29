import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFeaturedProducts } from '../hooks';
import type { Product } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 160;

interface FeaturedProductsProps {
  zones?: string[];
  onProductPress?: (product: Product) => void;
  onSeeAllPress?: () => void;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  zones,
  onProductPress,
  onSeeAllPress,
}) => {
  const { data: products, isLoading } = useFeaturedProducts(zones);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#667EEA" />
      </View>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Featured Products</Text>
        {onSeeAllPress && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.slice(0, 10).map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.card}
            onPress={() => onProductPress?.(product)}
            activeOpacity={0.8}
          >
            {/* Product Image */}
            <View style={styles.imageContainer}>
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>No Image</Text>
                </View>
              )}

              {/* Stock Badge */}
              {product.stock <= 0 && (
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              )}

              {/* Featured Badge */}
              {product.isFeatured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredText}>⭐</Text>
                </View>
              )}
            </View>

            {/* Product Info */}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {product.nameEn}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  IQD {product.price.toLocaleString()}
                </Text>
              </View>

              <View style={styles.stockRow}>
                <Text style={[
                  styles.stock,
                  product.stock <= 0 && styles.stockOut,
                  product.stock > 0 && product.stock <= 5 && styles.stockLow,
                ]}>
                  {product.stock <= 0
                    ? 'Out of stock'
                    : product.stock <= 5
                    ? `Only ${product.stock} left`
                    : `${product.stock} in stock`}
                </Text>
              </View>
            </View>

            {/* Quick Add Button */}
            {product.stock > 0 && (
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#999',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  featuredText: {
    fontSize: 14,
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 18,
    height: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#667EEA',
  },
  stockRow: {
    marginTop: 2,
  },
  stock: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  stockOut: {
    color: '#FF6B6B',
  },
  stockLow: {
    color: '#FF9671',
  },
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667EEA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default FeaturedProducts;
