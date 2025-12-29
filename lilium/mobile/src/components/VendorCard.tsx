import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import type { Company } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

interface VendorCardProps {
  vendor: Company;
  onPress?: () => void;
}

// Default vendor colors if no logo
const VENDOR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#845EC2',
  '#FF9671',
  '#667EEA',
  '#F9C74F',
];

export const VendorCard: React.FC<VendorCardProps> = ({ vendor, onPress }) => {
  const getVendorColor = () => {
    // Generate consistent color based on vendor id
    const index = vendor.id.charCodeAt(0) % VENDOR_COLORS.length;
    return VENDOR_COLORS[index];
  };

  const productCount = vendor._count?.products || 0;
  const deliveryTime = vendor.maxDeliveryTime || 60;
  const minOrder = vendor.minOrderAmount || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Vendor Logo/Image */}
      <View style={[styles.logoContainer, { backgroundColor: getVendorColor() }]}>
        {vendor.logo ? (
          <Image
            source={{ uri: vendor.logo }}
            style={styles.logo}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.logoPlaceholder}>
            {vendor.nameEn?.charAt(0) || vendor.nameAr?.charAt(0) || 'V'}
          </Text>
        )}
      </View>

      {/* Vendor Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {vendor.nameEn}
        </Text>

        {vendor.nameAr && (
          <Text style={styles.nameAr} numberOfLines={1}>
            {vendor.nameAr}
          </Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statText}>{productCount} items</Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryRow}>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryIcon}>🚚</Text>
            <Text style={styles.deliveryText}>{deliveryTime} min</Text>
          </View>
          {minOrder > 0 && (
            <Text style={styles.minOrder}>Min: {minOrder.toLocaleString()} IQD</Text>
          )}
        </View>

        {/* Zones */}
        <View style={styles.zonesRow}>
          {vendor.zones?.map((zone) => (
            <View key={zone} style={styles.zoneBadge}>
              <Text style={styles.zoneText}>{zone}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 16,
  },
  logoContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  nameAr: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  deliveryText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  minOrder: {
    fontSize: 10,
    color: '#999',
  },
  zonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  zoneBadge: {
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  zoneText: {
    fontSize: 10,
    color: '#667EEA',
    fontWeight: '600',
  },
});

export default VendorCard;
