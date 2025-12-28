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
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, CartValidationResult, Address } from '../types';
import { useCart } from '../contexts/CartContext';
import { useCreateOrder, useValidateCheckout, usePreviewPromotions, useAddresses } from '../hooks';
import { checkoutSchema, CheckoutFormData } from '../schemas';

// Helper for cross-platform alerts
const showAlert = (
  title: string,
  message: string,
  buttons?: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }>
) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      // Execute the first button's onPress if it exists (for simple OK alerts)
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

// Helper to format address for delivery
const formatAddressForDelivery = (address: Address): string => {
  const parts = [
    address.label,
    address.street,
    address.building && `Building: ${address.building}`,
    address.floor && `Floor: ${address.floor}`,
    address.apartment && `Apt: ${address.apartment}`,
    address.city,
    address.zone,
  ].filter(Boolean);

  if (address.landmark) {
    parts.push(`(Near: ${address.landmark})`);
  }

  return parts.join(', ');
};

export const CheckoutScreen: React.FC<Props> = ({ navigation }) => {
  const { items, subtotal, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const validateCheckout = useValidateCheckout();
  const previewPromotions = usePreviewPromotions();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();

  const [validationResult, setValidationResult] = useState<CartValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: '',
      notes: '',
    },
  });

  // Pre-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses, selectedAddress]);

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
              showAlert('Warning', result.warnings.join('\n'));
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
    console.log('onSubmit called', { data, selectedAddress, items: items.length, validationResult });

    if (items.length === 0) {
      showAlert('Empty Cart', 'Your cart is empty');
      return;
    }

    // Must have a selected address with an ID
    if (!selectedAddress) {
      showAlert('Address Required', 'Please select a delivery address');
      return;
    }

    // Check if validation passed - skip if validation hasn't completed yet
    if (validationResult && validationResult.valid === false) {
      showAlert(
        'Cannot Place Order',
        validationResult.errors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    // Get companyId from the first item's product
    // In a multi-vendor scenario, you might need to group orders by company
    const firstItem = items[0];
    const companyId = firstItem?.product?.companyId;

    if (!companyId) {
      showAlert('Error', 'Unable to determine the vendor for this order');
      return;
    }

    const finalTotal = validationResult?.summary?.total ?? subtotal;
    const savings = previewPromotions.data?.totalSavings ?? 0;

    console.log('Showing confirm dialog', { finalTotal, savings });

    showAlert(
      'Confirm Order',
      `Total amount: IQD ${finalTotal.toLocaleString()}${savings > 0 ? `\nYou save: IQD ${savings.toLocaleString()}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: () => {
            console.log('Place Order confirmed, calling createOrder.mutate');
            createOrder.mutate(
              {
                items: items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                })),
                addressId: selectedAddress.id,
                companyId: companyId,
                zone: selectedAddress.zone as 'KARKH' | 'RUSAFA',
                notes: data.notes?.trim() || undefined,
                paymentMethod: 'cash',
              },
              {
                onSuccess: (order) => {
                  console.log('Order created successfully', order);
                  clearCart();
                  navigation.replace('OrderConfirmation', { orderId: order.id });
                },
                onError: (error: any) => {
                  console.error('Order creation failed', error);
                  showAlert(
                    'Order Failed',
                    error.response?.data?.message || error.response?.data?.error || 'Failed to create order. Please try again.'
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {addresses && addresses.length > 0 && (
              <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                <Text style={styles.changeAddressText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {addressesLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : addresses && addresses.length > 0 ? (
            <>
              {selectedAddress ? (
                <TouchableOpacity
                  style={styles.selectedAddressCard}
                  onPress={() => setAddressModalVisible(true)}
                >
                  <View style={styles.addressCardHeader}>
                    <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                    {selectedAddress.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressDetails}>
                    {formatAddressForDelivery(selectedAddress)}
                  </Text>
                  {selectedAddress.phone && (
                    <Text style={styles.addressPhone}>Phone: {selectedAddress.phone}</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.selectAddressButton}
                  onPress={() => setAddressModalVisible(true)}
                >
                  <Text style={styles.selectAddressText}>Select a delivery address</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View>
              <Text style={styles.noAddressText}>No saved addresses</Text>
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
              <TouchableOpacity
                style={styles.addAddressLink}
                onPress={() => navigation.navigate('AddAddress')}
              >
                <Text style={styles.addAddressLinkText}>+ Add a saved address</Text>
              </TouchableOpacity>
            </View>
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
          onPress={() => {
            // If we have a selected address, bypass form validation for deliveryAddress
            if (selectedAddress) {
              const notes = getValues('notes');
              onSubmit({ deliveryAddress: '', notes: notes || '' });
            } else {
              handleSubmit(onSubmit)();
            }
          }}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Address</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={addresses || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.addressOption,
                    selectedAddress?.id === item.id && styles.addressOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedAddress(item);
                    setAddressModalVisible(false);
                  }}
                >
                  <View style={styles.addressOptionHeader}>
                    <Text style={styles.addressOptionLabel}>{item.label}</Text>
                    {item.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressOptionDetails} numberOfLines={2}>
                    {formatAddressForDelivery(item)}
                  </Text>
                  {selectedAddress?.id === item.id && (
                    <Text style={styles.selectedCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addNewAddressButton}
                  onPress={() => {
                    setAddressModalVisible(false);
                    navigation.navigate('AddAddress');
                  }}
                >
                  <Text style={styles.addNewAddressText}>+ Add New Address</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>
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
  // Address Selection Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  changeAddressText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedAddressCard: {
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addressDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  selectAddressButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  selectAddressText: {
    fontSize: 14,
    color: '#666',
  },
  noAddressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  addAddressLink: {
    marginTop: 12,
  },
  addAddressLinkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },
  addressOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressOptionSelected: {
    backgroundColor: '#f0f7ff',
  },
  addressOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  addressOptionDetails: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    marginTop: 4,
  },
  selectedCheck: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  addNewAddressButton: {
    padding: 16,
    alignItems: 'center',
  },
  addNewAddressText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
