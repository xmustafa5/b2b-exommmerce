import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesQueryKeys } from '../constants/queryKeys';
import { addressesApi } from '../services/api';
import type { Address, AddressCreateInput } from '../types';

/**
 * Hook to fetch all user addresses
 */
export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: addressesQueryKeys.list(),
    queryFn: () => addressesApi.getAll(),
  });
}

/**
 * Hook to fetch a single address by ID
 */
export function useAddress(id: string) {
  return useQuery<Address>({
    queryKey: addressesQueryKeys.detail(id),
    queryFn: () => addressesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to get the default address
 */
export function useDefaultAddress() {
  const { data: addresses } = useAddresses();
  return addresses?.find((addr) => addr.isDefault) || addresses?.[0] || null;
}

/**
 * Hook to create a new address
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddressCreateInput) => addressesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: addressesQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to update an existing address
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressCreateInput> }) =>
      addressesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: addressesQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: addressesQueryKeys.detail(id),
      });
    },
  });
}

/**
 * Hook to delete an address
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: addressesQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to set an address as default
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressesApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: addressesQueryKeys.all,
      });
    },
  });
}
