import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, NotifyMeSubscription } from '../types';
import { useNotifyMeSubscriptions, useUnsubscribeNotifyMe } from '../hooks/useNotifyMe';

type Props = NativeStackScreenProps<RootStackParamList, 'NotifyMeList'>;

export const NotifyMeListScreen: React.FC<Props> = ({ navigation }) => {
  const { data: subscriptions, isLoading, error, refetch, isRefetching } = useNotifyMeSubscriptions();
  const unsubscribe = useUnsubscribeNotifyMe();

  const handleUnsubscribe = (subscription: NotifyMeSubscription) => {
    Alert.alert(
      'Remove Notification',
      `Stop receiving notifications when "${subscription.product?.nameEn || 'this product'}" is back in stock?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            unsubscribe.mutate(subscription.productId, {
              onSuccess: () => {
                Alert.alert('Removed', 'You will no longer receive notifications for this product.');
              },
              onError: () => {
                Alert.alert('Error', 'Failed to remove notification. Please try again.');
              },
            });
          },
        },
      ]
    );
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const renderSubscription = ({ item }: { item: NotifyMeSubscription }) => {
    const product = item.product;
    const isInStock = product && product.stock > 0;

    return (
      <TouchableOpacity
        style={styles.subscriptionCard}
        onPress={() => handleProductPress(item.productId)}
      >
        {/* Product Image */}
        {product?.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {product?.nameEn || 'Product'}
          </Text>
          <Text style={styles.productPrice}>
            IQD {product?.price?.toLocaleString() || '0'}
          </Text>
          <View style={styles.stockStatus}>
            <View
              style={[
                styles.stockIndicator,
                isInStock ? styles.inStock : styles.outOfStock,
              ]}
            />
            <Text
              style={[
                styles.stockText,
                isInStock ? styles.inStockText : styles.outOfStockText,
              ]}
            >
              {isInStock ? 'Back in Stock!' : 'Out of Stock'}
            </Text>
          </View>
          {item.notified && (
            <Text style={styles.notifiedBadge}>Notified</Text>
          )}
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleUnsubscribe(item)}
          disabled={unsubscribe.isPending}
        >
          {unsubscribe.isPending ? (
            <ActivityIndicator size="small" color="#f44336" />
          ) : (
            <Text style={styles.removeButtonText}>Remove</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>No Notifications Set</Text>
      <Text style={styles.emptyMessage}>
        When you subscribe to "Notify Me" for out-of-stock products, they will appear here.
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.browseButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load notifications</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Back in Stock Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {subscriptions?.length || 0} products
        </Text>
      </View>

      {/* Subscriptions List */}
      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscription}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
  },
  productDetails: {
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
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  inStock: {
    backgroundColor: '#4caf50',
  },
  outOfStock: {
    backgroundColor: '#f44336',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inStockText: {
    color: '#4caf50',
  },
  outOfStockText: {
    color: '#f44336',
  },
  notifiedBadge: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#2196f3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});
