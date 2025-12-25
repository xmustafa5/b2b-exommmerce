import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { Promotion } from '../types';
import { useActivePromotions } from '../hooks';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface PromotionsBannerProps {
  onPromotionPress?: (promotion: Promotion) => void;
}

export const PromotionsBanner: React.FC<PromotionsBannerProps> = ({
  onPromotionPress,
}) => {
  const { data: promotions, isLoading } = useActivePromotions();

  if (isLoading || !promotions || promotions.length === 0) {
    return null;
  }

  const getPromoIcon = (type: string): string => {
    switch (type) {
      case 'percentage':
        return '%';
      case 'fixed':
        return 'IQD';
      case 'buy_x_get_y':
        return '+1';
      case 'bundle':
        return 'BUNDLE';
      default:
        return 'SALE';
    }
  };

  const getPromoDescription = (promo: Promotion): string => {
    switch (promo.type) {
      case 'percentage':
        return `${promo.value}% OFF`;
      case 'fixed':
        return `IQD ${promo.value.toLocaleString()} OFF`;
      case 'buy_x_get_y':
        return `Buy ${promo.buyQuantity}, Get ${promo.getQuantity} Free`;
      case 'bundle':
        return 'Bundle Deal';
      default:
        return 'Special Offer';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Promotions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
      >
        {promotions.map((promo) => (
          <TouchableOpacity
            key={promo.id}
            style={styles.promoCard}
            onPress={() => onPromotionPress?.(promo)}
            activeOpacity={0.8}
          >
            <View style={styles.promoHeader}>
              <View style={styles.promoTypeBadge}>
                <Text style={styles.promoTypeText}>{getPromoIcon(promo.type)}</Text>
              </View>
              <View style={styles.promoInfo}>
                <Text style={styles.promoName} numberOfLines={1}>
                  {promo.name}
                </Text>
                <Text style={styles.promoValue}>{getPromoDescription(promo)}</Text>
              </View>
            </View>

            {promo.description && (
              <Text style={styles.promoDescription} numberOfLines={2}>
                {promo.description}
              </Text>
            )}

            <View style={styles.promoFooter}>
              <Text style={styles.promoCode}>Code: {promo.code}</Text>
              <Text style={styles.promoExpiry}>
                Ends {formatDate(promo.endDate)}
              </Text>
            </View>

            {promo.minPurchase && promo.minPurchase > 0 && (
              <Text style={styles.promoCondition}>
                Min. purchase: IQD {promo.minPurchase.toLocaleString()}
              </Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  promoCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoTypeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promoTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  promoInfo: {
    flex: 1,
  },
  promoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  promoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  promoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  promoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  promoCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4caf50',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promoExpiry: {
    fontSize: 12,
    color: '#999',
  },
  promoCondition: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default PromotionsBanner;
