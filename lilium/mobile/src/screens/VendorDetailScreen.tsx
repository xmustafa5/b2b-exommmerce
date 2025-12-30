import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Product, Category } from '../types';
import { useCompany, useCompanyProducts } from '../hooks/useCompanies';
import { useActiveCategories } from '../hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'VendorDetail'>;

// Modern color palette
const COLORS = {
  primary: '#FF5A5F',
  secondary: '#00C48C',
  accent: '#FFB800',
  purple: '#7C3AED',
  blue: '#3B82F6',
  dark: '#1A1A2E',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
};

// Vendor header colors
const VENDOR_COLORS = [
  '#FF5A5F', '#00C48C', '#7C3AED', '#3B82F6', '#FFB800', '#FF6B6B',
  '#845EC2', '#4ECDC4', '#FF9671', '#667EEA',
];

export const VendorDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { vendorId } = route.params;
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Fetch vendor details
  const { data: vendor, isLoading: vendorLoading, refetch: refetchVendor } = useCompany(vendorId);

  // Fetch vendor products
  const productParams = useMemo(() => ({
    page,
    limit: 20,
    categoryId: selectedCategory,
  }), [page, selectedCategory]);

  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
    isFetching,
  } = useCompanyProducts(vendorId, productParams);

  // Fetch categories
  const { data: categories } = useActiveCategories();

  const handleRefresh = useCallback(() => {
    refetchVendor();
    refetchProducts();
  }, [refetchVendor, refetchProducts]);

  const handleProductPress = useCallback((productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  }, [navigation]);

  const handleCategoryPress = useCallback((categoryId: string | undefined) => {
    setSelectedCategory(categoryId);
    setPage(1);
  }, []);

  const getVendorColor = useMemo(() => {
    const index = vendorId.charCodeAt(0) % VENDOR_COLORS.length;
    return VENDOR_COLORS[index];
  }, [vendorId]);

  const products = productsData?.products || [];

  // Loading state
  if (vendorLoading && !vendor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading vendor...</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😞</Text>
        <Text style={styles.errorText}>Vendor not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderProduct = ({ item }: { item: Product }) => {
    const price = Number(item.price) || 0;
    const stock = Number(item.stock) || 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.productImageWrapper}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.productPlaceholder]}>
              <Text style={styles.productPlaceholderIcon}>📦</Text>
            </View>
          )}
          {stock <= 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>★</Text>
            </View>
          )}
          {stock > 0 && (
            <TouchableOpacity style={styles.addToCartBtn}>
              <Text style={styles.addToCartText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.nameEn}</Text>
          {item.nameAr && (
            <Text style={styles.productNameAr} numberOfLines={1}>{item.nameAr}</Text>
          )}
          <View style={styles.productPriceRow}>
            <Text style={styles.productPrice}>IQD {price.toLocaleString()}</Text>
            <Text style={[
              styles.productStock,
              stock <= 0 && styles.stockOut,
              stock > 0 && stock <= 5 && styles.stockLow,
            ]}>
              {stock <= 0 ? 'Out of stock' : stock <= 5 ? `${stock} left` : `${stock} in stock`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      {/* Vendor Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: getVendorColor, paddingTop: insets.top + 20 }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={[styles.headerBackBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>

        {/* Decorative Circles */}
        <View style={[styles.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        <View style={[styles.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />

        {/* Vendor Logo */}
        <View style={styles.vendorLogoContainer}>
          {vendor.logo ? (
            <Image source={{ uri: vendor.logo }} style={styles.vendorLogo} resizeMode="cover" />
          ) : (
            <View style={[styles.vendorLogoPlaceholder, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.vendorLogoText}>{vendor.nameEn?.charAt(0) || 'V'}</Text>
            </View>
          )}
        </View>

        {/* Vendor Name */}
        <Text style={styles.vendorName}>{vendor.nameEn}</Text>
        {vendor.nameAr && (
          <Text style={styles.vendorNameAr}>{vendor.nameAr}</Text>
        )}

        {/* Vendor Stats */}
        <View style={styles.vendorStats}>
          <View style={styles.statItem}>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>★</Text>
              <Text style={styles.statValue}>4.5</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statValue}>{vendor._count?.products || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>🚚</Text>
              <Text style={styles.statValue}>{vendor.maxDeliveryTime || 30}m</Text>
            </View>
            <Text style={styles.statLabel}>Delivery</Text>
          </View>
        </View>
      </View>

      {/* Vendor Info Card */}
      <View style={styles.infoCard}>
        {vendor.description && (
          <Text style={styles.vendorDescription}>{vendor.description}</Text>
        )}

        <View style={styles.infoRow}>
          {vendor.phone && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={styles.infoText}>{vendor.phone}</Text>
            </View>
          )}
          {vendor.email && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>✉️</Text>
              <Text style={styles.infoText}>{vendor.email}</Text>
            </View>
          )}
        </View>

        {vendor.minOrderAmount && vendor.minOrderAmount > 0 && (
          <View style={styles.minOrderBanner}>
            <Text style={styles.minOrderIcon}>💰</Text>
            <Text style={styles.minOrderText}>
              Minimum order: IQD {vendor.minOrderAmount.toLocaleString()}
            </Text>
          </View>
        )}

        {/* Zones */}
        {vendor.zones && vendor.zones.length > 0 && (
          <View style={styles.zonesContainer}>
            <Text style={styles.zonesLabel}>Delivers to:</Text>
            <View style={styles.zonesList}>
              {vendor.zones.map((zone) => (
                <View key={zone} style={styles.zoneBadge}>
                  <Text style={styles.zoneText}>{zone}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Products</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => handleCategoryPress(undefined)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories?.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === category.id && styles.categoryChipTextActive]}>
                {category.nameEn}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory
          ? 'Try selecting a different category'
          : 'This vendor has no products yet'}
      </Text>
      {selectedCategory && (
        <TouchableOpacity
          style={styles.clearFilterBtn}
          onPress={() => handleCategoryPress(undefined)}
        >
          <Text style={styles.clearFilterText}>Clear Filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!productsLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={getVendorColor} />
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={productsLoading ? null : renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !productsLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Hero Section
  heroSection: {
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerBackIcon: {
    fontSize: 22,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -60,
  },
  heroCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -50,
    left: -40,
  },
  vendorLogoContainer: {
    marginBottom: 16,
  },
  vendorLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  vendorLogoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  vendorLogoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  vendorName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  vendorNameAr: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  vendorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -15,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  vendorDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  minOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  minOrderIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  minOrderText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  zonesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  zonesLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginRight: 8,
  },
  zonesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  zoneBadge: {
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  zoneText: {
    fontSize: 12,
    color: COLORS.purple,
    fontWeight: '600',
  },

  // Category Section
  categorySection: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    elevation: 3,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },

  // Product List
  listContent: {
    paddingBottom: 100,
  },
  columnWrapper: {
    paddingHorizontal: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    margin: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  productImageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#F0F0F0',
  },
  productPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPlaceholderIcon: {
    fontSize: 36,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadgeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  addToCartBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addToCartText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: 'bold',
    marginTop: -2,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 2,
    height: 36,
    lineHeight: 18,
  },
  productNameAr: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 6,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  productStock: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  stockOut: {
    color: '#FF6B6B',
  },
  stockLow: {
    color: COLORS.accent,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  clearFilterBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearFilterText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default VendorDetailScreen;
