import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import type { Promotion } from '../types';
import { useActivePromotions } from '../hooks';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_MARGIN = 8;

interface PromotionCarouselProps {
  onPromotionPress?: (promotion: Promotion) => void;
}

// Vibrant gradient colors for different promo types
const PROMO_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  percentage: { bg: '#FF6B6B', accent: '#FF8E8E', text: '#FFF' },
  fixed: { bg: '#4ECDC4', accent: '#6EDDD5', text: '#FFF' },
  buy_x_get_y: { bg: '#845EC2', accent: '#9B7AD5', text: '#FFF' },
  bundle: { bg: '#FF9671', accent: '#FFB499', text: '#FFF' },
  default: { bg: '#667EEA', accent: '#7C8FED', text: '#FFF' },
};

export const PromotionCarousel: React.FC<PromotionCarouselProps> = ({
  onPromotionPress,
}) => {
  const { data: promotions, isLoading } = useActivePromotions();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-scroll effect
  useEffect(() => {
    if (!promotions || promotions.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % promotions.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * (CARD_WIDTH + CARD_MARGIN * 2),
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, promotions]);

  if (isLoading || !promotions || promotions.length === 0) {
    return null;
  }

  const getPromoColors = (type: string) => {
    return PROMO_COLORS[type] || PROMO_COLORS.default;
  };

  const getPromoTitle = (promo: Promotion): string => {
    switch (promo.type) {
      case 'percentage':
        return `${promo.value}% OFF`;
      case 'fixed':
        return `IQD ${promo.value.toLocaleString()} OFF`;
      case 'buy_x_get_y':
        return `BUY ${promo.buyQuantity} GET ${promo.getQuantity} FREE`;
      case 'bundle':
        return 'BUNDLE DEAL';
      default:
        return 'SPECIAL OFFER';
    }
  };

  const getPromoSubtitle = (promo: Promotion): string => {
    if (promo.minPurchase && promo.minPurchase > 0) {
      return `Min. order IQD ${promo.minPurchase.toLocaleString()}`;
    }
    return promo.description || 'Limited time offer';
  };

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (CARD_WIDTH + CARD_MARGIN * 2));
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        contentContainerStyle={styles.scrollContent}
      >
        {promotions.map((promo, index) => {
          const colors = getPromoColors(promo.type);
          return (
            <TouchableOpacity
              key={promo.id}
              style={[styles.card, { backgroundColor: colors.bg }]}
              onPress={() => onPromotionPress?.(promo)}
              activeOpacity={0.9}
            >
              {/* Decorative circles */}
              <View style={[styles.circle, styles.circle1, { backgroundColor: colors.accent }]} />
              <View style={[styles.circle, styles.circle2, { backgroundColor: colors.accent }]} />

              <View style={styles.cardContent}>
                <View style={styles.leftContent}>
                  <Text style={[styles.promoTitle, { color: colors.text }]}>
                    {getPromoTitle(promo)}
                  </Text>
                  <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>
                    {promo.name}
                  </Text>
                  <Text style={[styles.promoSubtitle, { color: colors.text }]} numberOfLines={1}>
                    {getPromoSubtitle(promo)}
                  </Text>
                </View>

                <View style={styles.rightContent}>
                  <View style={[styles.codeContainer, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <Text style={[styles.codeLabel, { color: colors.text }]}>Use Code</Text>
                    <Text style={[styles.codeText, { color: colors.text }]}>{promo.code}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pagination dots */}
      {promotions.length > 1 && (
        <View style={styles.pagination}>
          {promotions.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: 140,
    borderRadius: 16,
    marginHorizontal: CARD_MARGIN,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  circle1: {
    width: 150,
    height: 150,
    top: -50,
    right: -30,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: -20,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  promoName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.9,
  },
  promoSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  codeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
    marginBottom: 2,
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#667EEA',
  },
});

export default PromotionCarousel;
