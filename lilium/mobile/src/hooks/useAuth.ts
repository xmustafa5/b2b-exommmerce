import { useQuery } from '@tanstack/react-query';
import { authQueryKeys } from '../constants/queryKeys';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to fetch current user profile
 */
export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authQueryKeys.profile(),
    queryFn: () => authApi.getMe(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Consider profile fresh for 5 minutes
  });
}

/**
 * Hook to get auth state from store (convenience hook)
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
