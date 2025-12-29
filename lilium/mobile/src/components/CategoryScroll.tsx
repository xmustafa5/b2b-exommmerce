import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useActiveCategories } from '../hooks';
import type { Category } from '../types';

interface CategoryScrollProps {
  onCategoryPress?: (category: Category) => void;
  selectedCategoryId?: string;
}

// Default category icons/colors if no image
const CATEGORY_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#845EC2',
  '#FF9671',
  '#667EEA',
  '#F9C74F',
  '#90BE6D',
  '#577590',
];

export const CategoryScroll: React.FC<CategoryScrollProps> = ({
  onCategoryPress,
  selectedCategoryId,
}) => {
  const { data: categories, isLoading } = useActiveCategories();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#667EEA" />
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  const getCategoryColor = (index: number) => {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Categories option */}
        <TouchableOpacity
          style={[
            styles.categoryItem,
            !selectedCategoryId && styles.categoryItemSelected,
          ]}
          onPress={() => onCategoryPress?.(null as any)}
        >
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: '#667EEA' },
              !selectedCategoryId && styles.categoryIconSelected,
            ]}
          >
            <Text style={styles.categoryIconText}>All</Text>
          </View>
          <Text
            style={[
              styles.categoryName,
              !selectedCategoryId && styles.categoryNameSelected,
            ]}
            numberOfLines={1}
          >
            All
          </Text>
        </TouchableOpacity>

        {categories.map((category, index) => {
          const isSelected = selectedCategoryId === category.id;
          const color = getCategoryColor(index);

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemSelected,
              ]}
              onPress={() => onCategoryPress?.(category)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: color },
                  isSelected && styles.categoryIconSelected,
                ]}
              >
                {category.imageUrl ? (
                  <Image
                    source={{ uri: category.imageUrl }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.categoryIconText}>
                    {category.nameEn?.charAt(0) || '?'}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected,
                ]}
                numberOfLines={1}
              >
                {category.nameEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    height: 100,
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
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 70,
  },
  categoryItemSelected: {
    // Selected state styling
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIconSelected: {
    borderWidth: 3,
    borderColor: '#667EEA',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryNameSelected: {
    color: '#667EEA',
    fontWeight: '700',
  },
});

export default CategoryScroll;
