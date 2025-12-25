import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesQueryKeys, productsQueryKeys } from '../constants/queryKeys';
import { favoritesApi } from '../services/api';
import type { Favorite } from '../types';

/**
 * Hook to fetch all user favorites
 */
export function useFavorites() {
  return useQuery<Favorite[]>({
    queryKey: favoritesQueryKeys.list(),
    queryFn: () => favoritesApi.getAll(),
  });
}

/**
 * Hook to check if a product is in favorites
 * Uses the favorites list to determine status
 */
export function useIsFavorite(productId: string) {
  const { data: favorites } = useFavorites();
  return favorites?.some((fav) => fav.productId === productId) ?? false;
}

/**
 * Hook to add a product to favorites
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => favoritesApi.add(productId),
    onSuccess: () => {
      // Invalidate favorites list to refetch
      queryClient.invalidateQueries({
        queryKey: favoritesQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to remove a product from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => favoritesApi.remove(productId),
    onSuccess: () => {
      // Invalidate favorites list to refetch
      queryClient.invalidateQueries({
        queryKey: favoritesQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to toggle favorite status with optimistic updates
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const toggle = async (productId: string, isFavorite: boolean) => {
    if (isFavorite) {
      await removeFavorite.mutateAsync(productId);
    } else {
      await addFavorite.mutateAsync(productId);
    }
  };

  return {
    toggle,
    isLoading: addFavorite.isPending || removeFavorite.isPending,
    isError: addFavorite.isError || removeFavorite.isError,
    error: addFavorite.error || removeFavorite.error,
  };
}
