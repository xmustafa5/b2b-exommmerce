import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersQueryKeys, adminsQueryKeys } from "@/constants/queryKeys";
import { usersApi, adminsApi } from "@/actions/users";
import type {
  UserUpdateInput,
  AdminCreateInput,
  AdminUpdateInput,
  AdminFilters,
  ShopOwnerFilters,
  Zone,
} from "@/types/user";

// ============== Regular Users Hooks ==============

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKeys.all,
    queryFn: usersApi.getAll,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: usersQueryKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdateInput) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

// ============== Admins Hooks ==============

export function useAdmins(filters?: AdminFilters) {
  return useQuery({
    queryKey: adminsQueryKeys.list(filters),
    queryFn: () => adminsApi.getAll(filters),
  });
}

export function useAdmin(id: string) {
  return useQuery({
    queryKey: adminsQueryKeys.detail(id),
    queryFn: () => adminsApi.getById(id),
    enabled: !!id,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminsQueryKeys.stats(),
    queryFn: adminsApi.getStats,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQueryKeys.all });
    },
  });
}

export function useUpdateAdmin(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminUpdateInput) => adminsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminsQueryKeys.all });
    },
  });
}

export function useUpdateAdminZones(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (zones: Zone[]) => adminsApi.updateZones(id, zones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminsQueryKeys.all });
    },
  });
}

export function useToggleAdminActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminsApi.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQueryKeys.all });
    },
  });
}

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      adminsApi.resetPassword(id, newPassword),
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQueryKeys.all });
    },
  });
}

// ============== Shop Owners Hooks ==============

export function useShopOwners(filters?: ShopOwnerFilters) {
  return useQuery({
    queryKey: adminsQueryKeys.shopOwners(filters),
    queryFn: () => adminsApi.getShopOwners(filters),
  });
}

export function useToggleShopOwnerActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminsApi.toggleShopOwnerActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQueryKeys.shopOwners() });
    },
  });
}
