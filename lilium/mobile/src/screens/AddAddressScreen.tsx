import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { Zone } from '../types';
import { useCreateAddress } from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAddress'>;

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label must be less than 50 characters'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  zone: z.nativeEnum(Zone, { message: 'Please select a zone' }),
  building: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  landmark: z.string().optional(),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export const AddAddressScreen: React.FC<Props> = ({ navigation }) => {
  const createAddress = useCreateAddress();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      street: '',
      city: 'Baghdad',
      zone: Zone.KARKH,
      building: '',
      floor: '',
      apartment: '',
      landmark: '',
      phone: '',
      isDefault: false,
    },
  });

  const onSubmit = (data: AddressFormData) => {
    createAddress.mutate(
      {
        label: data.label,
        street: data.street,
        city: data.city,
        zone: data.zone,
        building: data.building || undefined,
        floor: data.floor || undefined,
        apartment: data.apartment || undefined,
        landmark: data.landmark || undefined,
        phone: data.phone || undefined,
        isDefault: data.isDefault,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Address added successfully', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Failed to add address. Please try again.'
          );
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Label */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address Label *</Text>
          <Controller
            control={control}
            name="label"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.label && styles.inputError]}
                placeholder="e.g., Home, Office, Store"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          {errors.label && <Text style={styles.errorText}>{errors.label.message}</Text>}
        </View>

        {/* Zone Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Zone *</Text>
          <Controller
            control={control}
            name="zone"
            render={({ field: { onChange, value } }) => (
              <View style={styles.zoneContainer}>
                {Object.values(Zone).map((zone) => (
                  <TouchableOpacity
                    key={zone}
                    style={[styles.zoneButton, value === zone && styles.zoneButtonActive]}
                    onPress={() => onChange(zone)}
                  >
                    <Text
                      style={[styles.zoneButtonText, value === zone && styles.zoneButtonTextActive]}
                    >
                      {zone}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.zone && <Text style={styles.errorText}>{errors.zone.message}</Text>}
        </View>

        {/* Street */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Street Address *</Text>
          <Controller
            control={control}
            name="street"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.textArea, errors.street && styles.inputError]}
                placeholder="Enter street name, neighborhood"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            )}
          />
          {errors.street && <Text style={styles.errorText}>{errors.street.message}</Text>}
        </View>

        {/* City */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="City"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}
        </View>

        {/* Building Details Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Building</Text>
            <Controller
              control={control}
              name="building"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Building name/no."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Floor</Text>
            <Controller
              control={control}
              name="floor"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Floor"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
              )}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Apartment</Text>
            <Controller
              control={control}
              name="apartment"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Apt"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
        </View>

        {/* Landmark */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Landmark (Optional)</Text>
          <Controller
            control={control}
            name="landmark"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Near a famous place, mosque, etc."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone (Optional)</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Contact phone for this address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
              />
            )}
          />
        </View>

        {/* Default Address Toggle */}
        <View style={styles.inputGroup}>
          <Controller
            control={control}
            name="isDefault"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Set as default address</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.saveButton, createAddress.isPending && styles.saveButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={createAddress.isPending}
        >
          {createAddress.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 60,
  },
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  zoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  zoneButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  zoneButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  zoneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  zoneButtonTextActive: {
    color: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
