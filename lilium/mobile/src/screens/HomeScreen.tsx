import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useProducts, usePrefetchProduct } from '../hooks';
import { Product, Category, Company } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  PromotionCarousel,
  CategoryScroll,
  VendorSection,
  FeaturedProducts,
} from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [showProducts, setShowProducts] = useState(false);
  const user = useAuthStore((state) => state.user);
  const prefetchProduct = usePrefetchProduct();

  // Use custom hook with memoized filters
  const filters = useMemo(() => ({
    page,
    limit: 20,
    search: search || undefined,
    zones: user?.zones,
    categoryId: selectedCategoryId,
  }), [page, search, user?.zones, selectedCategoryId]);

  const { data, isLoading, refetch, isFetching } = useProducts(filters);

  const handleProductPress = useCallback((productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  }, [navigation]);

  const handleProductPressIn = useCallback((productId: string) => {
    prefetchProduct(productId);
  }, [prefetchProduct]);

  const handleCategoryPress = useCallback((category: Category | null) => {
    setSelectedCategoryId(category?.id || undefined);
    setShowProducts(true);
    setPage(1);
  }, []);

  const handleVendorPress = useCallback((vendor: Company) => {
    // Navigate to vendor detail screen or filter products by vendor
    // For now, we'll just log it
    console.log('Vendor pressed:', vendor.nameEn);
    // navigation.navigate('VendorDetail', { vendorId: vendor.id });
  }, [navigation]);

  const handleSearchFocus = useCallback(() => {
    setShowProducts(true);
  }, []);

  const renderProduct = useCallback(({ item }: { item: Product }) => {
    const price = Number(item.price) || 0;
    const stock = Number(item.stock) || 0;
    const minQty = Number(item.minOrderQuantity) || 1;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item.id)}
        onPressIn={() => handleProductPressIn(item.id)}
        activeOpacity={0.8}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Out of stock overlay */}
        {stock <= 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Featured badge */}
        {item.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>⭐</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.nameEn}
          </Text>
          <Text style={styles.productPrice}>IQD {price.toLocaleString()}</Text>
          <Text style={[
            styles.productStock,
            stock <= 0 && styles.productStockOut,
            stock > 0 && stock <= 5 && styles.productStockLow,
          ]}>
            {stock <= 0 ? 'Out of stock' : stock <= 5 ? `Only ${stock} left` : `${stock} in stock`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleProductPress, handleProductPressIn]);

  const products = data?.products || [];

  if (isLoading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667EEA" />
      </View>
    );
  }

  // If showing products list (after search or category selection)
  if (showProducts || search.length > 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Search Header */}
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowProducts(false);
              setSearch('');
              setSelectedCategoryId(undefined);
            }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.searchInputFull}
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            autoFocus={search.length === 0 && !selectedCategoryId}
          />
        </View>

        {/* Category filter chips */}
        <CategoryScroll
          onCategoryPress={handleCategoryPress}
          selectedCategoryId={selectedCategoryId}
        />

        {/* Products Grid */}
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubtext}>Try a different search or category</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
        />
      </View>
    );
  }

  // Home screen with Talabat-style layout
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.businessName || user?.name || 'Welcome'}</Text>
          </View>
          <View style={styles.headerRight}>
            {user?.zones && user.zones.length > 0 && (
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneIcon}>📍</Text>
                <Text style={styles.zoneText}>{user.zones[0]}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearchFocus}
          activeOpacity={0.8}
        >
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search products, vendors...</Text>
          </View>
        </TouchableOpacity>

        {/* Promotions Carousel */}
        <PromotionCarousel />

        {/* Categories Horizontal Scroll */}
        <CategoryScroll
          onCategoryPress={handleCategoryPress}
          selectedCategoryId={selectedCategoryId}
        />

        {/* Featured Products */}
        <FeaturedProducts
          zones={user?.zones}
          onProductPress={(product) => handleProductPress(product.id)}
        />

        {/* Vendors Section */}
        <VendorSection
          zone={user?.zones?.[0]}
          onVendorPress={handleVendorPress}
          horizontal
        />

        {/* All Vendors Grid */}
        <VendorSection
          zone={user?.zones?.[0]}
          onVendorPress={handleVendorPress}
        />

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  zoneIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  zoneText: {
    fontSize: 12,
    color: '#667EEA',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  searchInputFull: {
    flex: 1,
    height: 45,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  productsList: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  outOfStockText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
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
    zIndex: 2,
  },
  featuredText: {
    fontSize: 14,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 18,
    height: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667EEA',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  productStockOut: {
    color: '#FF6B6B',
  },
  productStockLow: {
    color: '#FF9671',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
