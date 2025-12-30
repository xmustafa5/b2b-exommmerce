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
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useProducts, usePrefetchProduct, useActiveCategories, useActivePromotions, useFeaturedProducts, useActiveCompanies } from '../hooks';
import { Product, Category, Company, Promotion } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');
const SCREEN_WIDTH = width;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Modern color palette - Talabat inspired
const COLORS = {
  primary: '#FF5A5F', // Talabat-like coral/red
  secondary: '#00C48C', // Fresh green
  accent: '#FFB800', // Warm yellow
  purple: '#7C3AED', // Modern purple
  blue: '#3B82F6', // Bright blue
  dark: '#1A1A2E', // Dark background
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
};

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  'Electronics': '📱',
  'Groceries': '🛒',
  'Fashion': '👕',
  'Home': '🏠',
  'Beauty': '💄',
  'Sports': '⚽',
  'Toys': '🧸',
  'Books': '📚',
  'Health': '💊',
  'Automotive': '🚗',
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [showProducts, setShowProducts] = useState(false);
  const user = useAuthStore((state) => state.user);
  const prefetchProduct = usePrefetchProduct();

  // Data hooks
  const { data: categoriesData, isLoading: categoriesLoading } = useActiveCategories();
  const { data: promotions, isLoading: promotionsLoading } = useActivePromotions();
  const { data: featuredProducts, isLoading: featuredLoading } = useFeaturedProducts(user?.zones);
  const { data: companiesData, isLoading: companiesLoading } = useActiveCompanies(user?.zones?.[0]);

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
    navigation.navigate('VendorDetail', { vendorId: vendor.id });
  }, [navigation]);

  const handleSearchFocus = useCallback(() => {
    setShowProducts(true);
  }, []);

  const renderProduct = useCallback(({ item }: { item: Product }) => {
    const price = Number(item.price) || 0;
    const stock = Number(item.stock) || 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item.id)}
        onPressIn={() => handleProductPressIn(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.productImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          {stock <= 0 && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.nameEn}</Text>
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
  const categories = categoriesData || [];
  const vendors = companiesData?.companies || [];

  // Loading state
  if (isLoading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Products list view (after search or category selection)
  if (showProducts || search.length > 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
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
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChips}
          contentContainerStyle={styles.filterChipsContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, !selectedCategoryId && styles.filterChipActive]}
            onPress={() => handleCategoryPress(null)}
          >
            <Text style={[styles.filterChipText, !selectedCategoryId && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, selectedCategoryId === cat.id && styles.filterChipActive]}
              onPress={() => handleCategoryPress(cat)}
            >
              <Text style={[styles.filterChipText, selectedCategoryId === cat.id && styles.filterChipTextActive]}>
                {cat.nameEn}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        />
      </SafeAreaView>
    );
  }

  // Main Home Screen - Talabat Style
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        bounces={true}
      >
        {/* Hero Header with Gradient */}
        <View style={styles.heroHeader}>
          <View style={[styles.heroGradient, { paddingTop: insets.top + 10 }]}>
            {/* Location & Profile Row */}
            <View style={styles.topRow}>
              <View style={styles.locationContainer}>
                <Text style={styles.deliverToLabel}>Deliver to</Text>
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{user?.zones?.[0] || 'Select Zone'}</Text>
                  <Text style={styles.chevron}>▼</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.profileButton}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitial}>{user?.name?.charAt(0) || 'U'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Hello, {user?.name?.split(' ')[0] || 'there'}!</Text>
              <Text style={styles.welcomeSubtext}>What would you like to order today?</Text>
            </View>

            {/* Search Bar */}
            <TouchableOpacity style={styles.searchContainer} onPress={handleSearchFocus} activeOpacity={0.9}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <Text style={styles.searchPlaceholder}>Search for products, vendors...</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promotions Carousel - Modern Style */}
        {promotions && promotions.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Offers</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promosScroll}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH - 40}
            >
              {promotions.map((promo, index) => (
                <PromoCard key={promo.id} promo={promo} index={index} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories Grid - Modern Circular Style */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.slice(0, 8).map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(index) }]}>
                  {category.imageUrl ? (
                    <Image source={{ uri: category.imageUrl }} style={styles.categoryImage} />
                  ) : (
                    <Text style={styles.categoryEmoji}>
                      {CATEGORY_ICONS[category.nameEn] || '📦'}
                    </Text>
                  )}
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>{category.nameEn}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Vendors - Restaurant Style Cards */}
        {vendors.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Vendors</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vendorsScroll}
            >
              {vendors.slice(0, 10).map((vendor, index) => (
                <VendorCardModern
                  key={vendor.id}
                  vendor={vendor}
                  index={index}
                  onPress={() => handleVendorPress(vendor)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products - Grid */}
        {featuredProducts && featuredProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity onPress={() => setShowProducts(true)}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featuredProducts.slice(0, 10).map((product) => (
                <FeaturedProductCard
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Vendors Grid */}
        {vendors.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Vendors Near You</Text>
            </View>
            <View style={styles.vendorsGrid}>
              {vendors.map((vendor, index) => (
                <VendorGridCard
                  key={vendor.id}
                  vendor={vendor}
                  index={index}
                  onPress={() => handleVendorPress(vendor)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

// Promo Card Component
const PromoCard: React.FC<{ promo: Promotion; index: number }> = ({ promo, index }) => {
  const promoColors = [
    ['#FF5A5F', '#FF8E53'],
    ['#7C3AED', '#A855F7'],
    ['#00C48C', '#34D399'],
    ['#3B82F6', '#60A5FA'],
  ];
  const colors = promoColors[index % promoColors.length];

  const getPromoTitle = () => {
    switch (promo.type) {
      case 'percentage': return `${promo.value}% OFF`;
      case 'fixed': return `IQD ${promo.value.toLocaleString()} OFF`;
      case 'buy_x_get_y': return `BUY ${promo.buyQuantity} GET ${promo.getQuantity}`;
      case 'bundle': return 'BUNDLE DEAL';
      default: return 'SPECIAL OFFER';
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.9}>
      <View style={[styles.promoCard, { backgroundColor: colors[0] }]}>
        {/* Decorative Elements */}
        <View style={[styles.promoCircle1, { backgroundColor: colors[1] }]} />
        <View style={[styles.promoCircle2, { backgroundColor: colors[1] }]} />

        <View style={styles.promoContent}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoOffer}>{getPromoTitle()}</Text>
            <Text style={styles.promoName} numberOfLines={1}>{promo.name}</Text>
            {promo.minPurchase && promo.minPurchase > 0 && (
              <Text style={styles.promoMin}>Min. IQD {promo.minPurchase.toLocaleString()}</Text>
            )}
          </View>
          <View style={styles.promoRight}>
            <View style={styles.promoCodeBox}>
              <Text style={styles.promoCodeLabel}>CODE</Text>
              <Text style={styles.promoCode}>{promo.code}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Modern Vendor Card Component
const VendorCardModern: React.FC<{
  vendor: Company;
  index: number;
  onPress: () => void;
}> = ({ vendor, index, onPress }) => {
  const vendorColors = ['#FF5A5F', '#00C48C', '#7C3AED', '#3B82F6', '#FFB800', '#FF6B6B'];
  const color = vendorColors[index % vendorColors.length];

  return (
    <TouchableOpacity style={styles.vendorCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.vendorImageContainer, { backgroundColor: color }]}>
        {vendor.logo ? (
          <Image source={{ uri: vendor.logo }} style={styles.vendorLogo} resizeMode="cover" />
        ) : (
          <Text style={styles.vendorInitial}>{vendor.nameEn?.charAt(0) || 'V'}</Text>
        )}
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>4.5</Text>
          <Text style={styles.ratingStar}>★</Text>
        </View>
      </View>
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={1}>{vendor.nameEn}</Text>
        <Text style={styles.vendorProducts}>{vendor._count?.products || 0} products</Text>
        <View style={styles.vendorMeta}>
          <View style={styles.vendorDelivery}>
            <Text style={styles.deliveryIcon}>🚚</Text>
            <Text style={styles.deliveryTime}>{vendor.maxDeliveryTime || 30} min</Text>
          </View>
          {vendor.minOrderAmount && vendor.minOrderAmount > 0 && (
            <Text style={styles.minOrder}>Min: {vendor.minOrderAmount.toLocaleString()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Vendor Grid Card Component
const VendorGridCard: React.FC<{
  vendor: Company;
  index: number;
  onPress: () => void;
}> = ({ vendor, index, onPress }) => {
  const vendorColors = ['#FF5A5F', '#00C48C', '#7C3AED', '#3B82F6', '#FFB800', '#FF6B6B'];
  const color = vendorColors[index % vendorColors.length];

  return (
    <TouchableOpacity style={styles.vendorGridCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.vendorGridImage, { backgroundColor: color }]}>
        {vendor.logo ? (
          <Image source={{ uri: vendor.logo }} style={styles.vendorGridLogo} resizeMode="cover" />
        ) : (
          <Text style={styles.vendorGridInitial}>{vendor.nameEn?.charAt(0) || 'V'}</Text>
        )}
      </View>
      <View style={styles.vendorGridInfo}>
        <Text style={styles.vendorGridName} numberOfLines={1}>{vendor.nameEn}</Text>
        <Text style={styles.vendorGridMeta}>{vendor._count?.products || 0} products</Text>
        <View style={styles.vendorGridRow}>
          <View style={styles.vendorGridRating}>
            <Text style={styles.ratingStarSmall}>★</Text>
            <Text style={styles.ratingTextSmall}>4.5</Text>
          </View>
          <Text style={styles.vendorGridDelivery}>🚚 {vendor.maxDeliveryTime || 30}m</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Featured Product Card Component
const FeaturedProductCard: React.FC<{
  product: Product;
  onPress: () => void;
}> = ({ product, onPress }) => {
  const price = Number(product.price) || 0;
  const stock = Number(product.stock) || 0;

  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.featuredImageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.featuredImage} />
        ) : (
          <View style={[styles.featuredImage, styles.featuredPlaceholder]}>
            <Text style={styles.featuredPlaceholderText}>📦</Text>
          </View>
        )}
        {stock <= 0 && (
          <View style={styles.featuredOutOfStock}>
            <Text style={styles.featuredOutOfStockText}>Out of Stock</Text>
          </View>
        )}
        {product.isFeatured && (
          <View style={styles.featuredBadgeSmall}>
            <Text style={styles.featuredBadgeText}>★</Text>
          </View>
        )}
        {stock > 0 && (
          <TouchableOpacity style={styles.quickAddBtn}>
            <Text style={styles.quickAddText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName} numberOfLines={2}>{product.nameEn}</Text>
        <Text style={styles.featuredPrice}>IQD {price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Helper function for category colors
const getCategoryColor = (index: number): string => {
  const colors = [
    '#FFE4E4', '#E4F7FF', '#FFE4FF', '#E4FFE4',
    '#FFF4E4', '#E4E4FF', '#F4FFE4', '#FFE4F4',
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },

  // Hero Header Styles
  heroHeader: {
    backgroundColor: COLORS.primary,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroGradient: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationContainer: {
    flex: 1,
  },
  deliverToLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  chevron: {
    fontSize: 10,
    color: COLORS.white,
    marginLeft: 6,
  },
  profileButton: {
    padding: 2,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    marginBottom: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: COLORS.gray,
  },

  // Section Styles
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Promos Scroll
  promosScroll: {
    paddingRight: 16,
  },
  promoCard: {
    width: SCREEN_WIDTH - 48,
    height: 160,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  promoCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -60,
    right: -40,
    opacity: 0.2,
  },
  promoCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -40,
    left: -20,
    opacity: 0.15,
  },
  promoContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoLeft: {
    flex: 1,
  },
  promoOffer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  promoName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  promoMin: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  promoRight: {
    alignItems: 'flex-end',
  },
  promoCodeBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  promoCodeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  promoCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Categories Scroll
  categoriesScroll: {
    paddingRight: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.dark,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Vendors Scroll
  vendorsScroll: {
    paddingRight: 16,
  },
  vendorCard: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  vendorImageContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  vendorLogo: {
    width: '100%',
    height: '100%',
  },
  vendorInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginRight: 2,
  },
  ratingStar: {
    fontSize: 10,
    color: '#FFB800',
  },
  vendorInfo: {
    padding: 12,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  vendorProducts: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 8,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  minOrder: {
    fontSize: 10,
    color: COLORS.gray,
  },

  // Vendors Grid
  vendorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vendorGridCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  vendorGridImage: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorGridLogo: {
    width: '100%',
    height: '100%',
  },
  vendorGridInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  vendorGridInfo: {
    padding: 12,
  },
  vendorGridName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 2,
  },
  vendorGridMeta: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 6,
  },
  vendorGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorGridRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStarSmall: {
    fontSize: 12,
    color: '#FFB800',
    marginRight: 2,
  },
  ratingTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  vendorGridDelivery: {
    fontSize: 11,
    color: COLORS.gray,
  },

  // Featured Products
  featuredScroll: {
    paddingRight: 16,
  },
  featuredCard: {
    width: 150,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  featuredImageContainer: {
    height: 120,
    position: 'relative',
    backgroundColor: '#F8F8F8',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  featuredPlaceholderText: {
    fontSize: 32,
  },
  featuredOutOfStock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOutOfStockText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  featuredBadgeSmall: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickAddBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  quickAddText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
  featuredInfo: {
    padding: 10,
  },
  featuredName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
    height: 34,
    lineHeight: 17,
  },
  featuredPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Search View Styles
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    color: COLORS.dark,
  },
  searchInputFull: {
    flex: 1,
    height: 45,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.dark,
  },
  filterChips: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
  },
  filterChipsContent: {
    paddingHorizontal: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },

  // Product List Styles
  productsList: {
    padding: 8,
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
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F0F0F0',
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
  },
  outOfStockText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFB800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 6,
    lineHeight: 18,
    height: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  productStock: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  productStockOut: {
    color: '#FF6B6B',
  },
  productStockLow: {
    color: '#FFB800',
  },

  // Empty State
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
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
