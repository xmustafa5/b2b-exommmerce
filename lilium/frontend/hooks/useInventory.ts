import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/actions/inventory";
import { inventoryQueryKeys, productsQueryKeys } from "@/constants/queryKeys";
import type {
  StockUpdateInput,
  BulkStockUpdateInput,
  InventoryFilters,
  StockHistoryFilters,
} from "@/types/inventory";

// Get all products with low stock
export function useLowStockProducts(filters?: InventoryFilters) {
  return useQuery({
    queryKey: inventoryQueryKeys.lowStock(filters?.zone, filters?.threshold),
    queryFn: () => inventoryApi.getLowStock(filters),
  });
}

// Get all out of stock products
export function useOutOfStockProducts(zone?: string) {
  return useQuery({
    queryKey: inventoryQueryKeys.outOfStock(zone),
    queryFn: () => inventoryApi.getOutOfStock(zone),
  });
}

// Get stock history for a product
export function useStockHistory(
  productId: string,
  filters?: StockHistoryFilters
) {
  return useQuery({
    queryKey: inventoryQueryKeys.history(productId, filters),
    queryFn: () => inventoryApi.getHistory(productId, filters),
    enabled: !!productId,
  });
}

// Get inventory report
export function useInventoryReport(zone?: string) {
  return useQuery({
    queryKey: inventoryQueryKeys.report(zone),
    queryFn: () => inventoryApi.getReport(zone),
  });
}

// Get restock suggestions
export function useRestockSuggestions(days?: number) {
  return useQuery({
    queryKey: inventoryQueryKeys.restockSuggestions(days),
    queryFn: () => inventoryApi.getRestockSuggestions(days),
  });
}

// Update stock for a single product
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StockUpdateInput) => inventoryApi.updateStock(data),
    onSuccess: (_, variables) => {
      // Invalidate all inventory queries
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.all,
      });
      // Also invalidate the specific product
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(variables.productId),
      });
      // Invalidate products list as stock might have changed
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
    },
  });
}

// Bulk update stock for multiple products
export function useBulkUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkStockUpdateInput) =>
      inventoryApi.bulkUpdateStock(data),
    onSuccess: () => {
      // Invalidate all inventory and product queries
      queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.all,
      });
    },
  });
}
