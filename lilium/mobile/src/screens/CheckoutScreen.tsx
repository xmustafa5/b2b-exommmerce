import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, CartValidationResult } from '../types';
import { useCart } from '../contexts/CartContext';
import { useCreateOrder, useValidateCheckout, usePreviewPromotions } from '../hooks';
import { checkoutSchema, CheckoutFormData } from '../schemas';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

export const CheckoutScreen: React.FC<Props> = ({ navigation }) => {
  const { items, subtotal, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const validateCheckout = useValidateCheckout();
  const previewPromotions = usePreviewPromotions();

  const [validationResult, setValidationResult] = useState<CartValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: '',
      notes: '',
    },
  });

  // Validate cart when screen loads or items change
  useEffect(() => {
    if (items.length > 0) {
      setIsValidating(true);
      const cartItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      validateCheckout.mutate(
        { items: cartItems },
        {
          onSuccess: (result) => {
            setValidationResult(result);
            setIsValidating(false);

            // Show warnings if any
            if (result.warnings.length > 0) {
              Alert.alert('Warning', result.warnings.join('\n'));
            }
          },
          onError: () => {
            setIsValidating(false);
          },
        }
      );

      // Also preview promotions
      previewPromotions.mutate(cartItems);
    }
  }, [items.length]);

  const onSubmit = (data: CheckoutFormData) => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    // Check if validation passed
    if (validationResult && !validationResult.valid) {
      Alert.alert(
        'Cannot Place Order',
        validationResult.errors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    const finalTotal = validationResult?.summary?.total ?? subtotal;
    const savings = previewPromotions.data?.totalSavings ?? 0;

    Alert.alert(
      'Confirm Order',
      `Total amount: IQD ${finalTotal.toLocaleString()}${savings > 0 ? `\nYou save: IQD ${savings.toLocaleString()}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: () => {
            createOrder.mutate(
              {
                items: items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                })),
                deliveryAddress: data.deliveryAddress.trim(),
                notes: data.notes?.trim() || undefined,
              },
              {
                onSuccess: (order) => {
                  clearCart();
                  navigation.replace('OrderConfirmation', { orderId: order.id });
                },
                onError: (error: any) => {
                  Alert.alert(
                    'Order Failed',
                    error.response?.data?.message || 'Failed to create order. Please try again.'
                  );
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.product.nameEn}
              </Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                IQD {(item.product.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Controller
            control={control}
            name="deliveryAddress"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.addressInput,
                  errors.deliveryAddress && styles.inputError,
                ]}
                placeholder="Enter your delivery address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          />
          {errors.deliveryAddress && (
            <Text style={styles.errorText}>{errors.deliveryAddress.message}</Text>
          )}
        </View>

        {/* Order Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.notesInput, errors.notes && styles.inputError]}
                placeholder="Any special instructions..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          />
          {errors.notes && (
            <Text style={styles.errorText}>{errors.notes.message}</Text>
          )}
        </View>

        {/* Promotions Preview */}
        {previewPromotions.data && previewPromotions.data.applicablePromotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Applied Promotions</Text>
            {previewPromotions.data.applicablePromotions.map((promo) => (
              <View key={promo.id} style={styles.promoRow}>
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>{promo.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.promoName}>{promo.name}</Text>
              </View>
            ))}
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Total Savings:</Text>
              <Text style={styles.savingsValue}>
                IQD {previewPromotions.data.totalSavings.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Validation Errors */}
        {validationResult && validationResult.errors.length > 0 && (
          <View style={[styles.section, styles.errorSection]}>
            <Text style={styles.errorSectionTitle}>Issues with your order:</Text>
            {validationResult.errors.map((error, index) => (
              <Text key={index} style={styles.validationError}>
                • {error}
              </Text>
            ))}
          </View>
        )}

        {/* Total */}
        <View style={styles.section}>
          {isValidating ? (
            <View style={styles.validatingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.validatingText}>Validating cart...</Text>
            </View>
          ) : (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>
                  IQD {(validationResult?.summary?.subtotal ?? subtotal).toLocaleString()}
                </Text>
              </View>
              {(validationResult?.summary?.discount ?? 0) > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount:</Text>
                  <Text style={styles.discountValue}>
                    -IQD {validationResult?.summary?.discount?.toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Delivery:</Text>
                <Text style={styles.totalValue}>
                  {(validationResult?.summary?.deliveryFee ?? 0) > 0
                    ? `IQD ${validationResult?.summary?.deliveryFee?.toLocaleString()}`
                    : 'Free'}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>
                  IQD {(validationResult?.summary?.total ?? subtotal).toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            createOrder.isPending && styles.disabledButton,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  addressInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    marginTop: 8,
    paddingTop: 16,
  },
  grandTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bottomContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  promoBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  promoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  promoName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  savingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4caf50',
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  discountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  errorSection: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  validationError: {
    fontSize: 14,
    color: '#c62828',
    marginBottom: 4,
  },
  validatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  validatingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});
