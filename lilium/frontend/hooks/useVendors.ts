import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorsApi } from "@/actions/vendors";
import { vendorsQueryKeys } from "@/constants/queryKeys";
import type {
  VendorCompanyUpdateInput,
  VendorProductCreateInput,
  VendorProductUpdateInput,
  VendorProductStockUpdate,
  VendorProductFilters,
  VendorOrderFilters,
  VendorOrderStatusUpdate,
  VendorCustomerFilters,
  VendorExportType,
  VendorExportFormat,
} from "@/types/vendor";

// ============================================
// Company Management Hooks
// ============================================

// Get vendor's company
export function useVendorCompany() {
  return useQuery({
    queryKey: vendorsQueryKeys.company,
    queryFn: () => vendorsApi.getCompany(),
  });
}

// Update vendor's company
export function useUpdateVendorCompany(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorCompanyUpdateInput) =>
      vendorsApi.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.company,
      });
    },
  });
}

// ============================================
// Dashboard Statistics Hooks
// ============================================

// Get vendor dashboard stats
export function useVendorStats() {
  return useQuery({
    queryKey: vendorsQueryKeys.stats,
    queryFn: () => vendorsApi.getStats(),
  });
}

// ============================================
// Product Management Hooks
// ============================================

// List vendor products
export function useVendorProducts(filters?: VendorProductFilters) {
  return useQuery({
    queryKey: vendorsQueryKeys.products.list(filters),
    queryFn: () => vendorsApi.getProducts(filters),
  });
}

// Get vendor product by ID
export function useVendorProduct(id: string) {
  return useQuery({
    queryKey: vendorsQueryKeys.products.detail(id),
    queryFn: () => vendorsApi.getProductById(id),
    enabled: !!id,
  });
}

// Create product
export function useCreateVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorProductCreateInput) =>
      vendorsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.products.all,
      });
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.stats,
      });
    },
  });
}

// Update product
export function useUpdateVendorProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorProductUpdateInput) =>
      vendorsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.products.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.products.all,
      });
    },
  });
}

// Delete product
export function useDeleteVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vendorsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.products.all,
      });
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.stats,
      });
    },
  });
}

// Update product stock
export function useUpdateVendorProductStock(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorProductStockUpdate) =>
      vendorsApi.updateProductStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.products.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.products.all,
      });
    },
  });
}

// ============================================
// Order Management Hooks
// ============================================

// List vendor orders
export function useVendorOrders(filters?: VendorOrderFilters) {
  return useQuery({
    queryKey: vendorsQueryKeys.orders.list(filters),
    queryFn: () => vendorsApi.getOrders(filters),
  });
}

// Get vendor order by ID
export function useVendorOrder(id: string) {
  return useQuery({
    queryKey: vendorsQueryKeys.orders.detail(id),
    queryFn: () => vendorsApi.getOrderById(id),
    enabled: !!id,
  });
}

// Update order status
export function useUpdateVendorOrderStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorOrderStatusUpdate) =>
      vendorsApi.updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.orders.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.orders.all,
      });
      queryClient.invalidateQueries({
        queryKey: vendorsQueryKeys.stats,
      });
    },
  });
}

// ============================================
// Customer Management Hooks
// ============================================

// Get vendor customers
export function useVendorCustomers(filters?: VendorCustomerFilters) {
  return useQuery({
    queryKey: vendorsQueryKeys.customers.list(filters),
    queryFn: () => vendorsApi.getCustomers(filters),
  });
}

// ============================================
// Data Export Hooks
// ============================================

// Export vendor data
export function useExportVendorData() {
  return useMutation({
    mutationFn: ({
      type,
      format = "json",
    }: {
      type: VendorExportType;
      format?: VendorExportFormat;
    }) => vendorsApi.exportData(type, format),
  });
}
