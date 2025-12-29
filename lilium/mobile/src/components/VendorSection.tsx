import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useActiveCompanies } from '../hooks';
import { VendorCard } from './VendorCard';
import type { Company } from '../types';

interface VendorSectionProps {
  zone?: string;
  onVendorPress?: (vendor: Company) => void;
  onSeeAllPress?: () => void;
  horizontal?: boolean;
}

export const VendorSection: React.FC<VendorSectionProps> = ({
  zone,
  onVendorPress,
  onSeeAllPress,
  horizontal = false,
}) => {
  const { data, isLoading } = useActiveCompanies(zone);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#667EEA" />
      </View>
    );
  }

  const vendors = data?.companies || [];

  if (vendors.length === 0) {
    return null;
  }

  if (horizontal) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Popular Vendors</Text>
          {onSeeAllPress && (
            <TouchableOpacity onPress={onSeeAllPress}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {vendors.slice(0, 10).map((vendor) => (
            <View key={vendor.id} style={styles.horizontalCardWrapper}>
              <VendorCard
                vendor={vendor}
                onPress={() => onVendorPress?.(vendor)}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Vendors</Text>
        {onSeeAllPress && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.gridContainer}>
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            onPress={() => onVendorPress?.(vendor)}
          />
        ))}
      </View>
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
    marginBottom: 16,
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
  horizontalScrollContent: {
    paddingHorizontal: 12,
  },
  horizontalCardWrapper: {
    marginHorizontal: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
});

export default VendorSection;
