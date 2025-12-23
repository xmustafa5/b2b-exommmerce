import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settlementsQueryKeys } from "@/constants/queryKeys";
import { settlementsApi } from "@/actions/settlements";

// Get settlement summary
export function useSettlementSummary(
  companyId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: settlementsQueryKeys.summary(companyId, startDate, endDate),
    queryFn: () => settlementsApi.getSummary(companyId, startDate, endDate),
  });
}

// Get settlement history
export function useSettlementHistory(companyId?: string, limit?: number) {
  return useQuery({
    queryKey: settlementsQueryKeys.history(companyId, limit),
    queryFn: () => settlementsApi.getHistory(companyId, limit),
  });
}

// Get pending cash collections
export function usePendingCashCollections(companyId?: string) {
  return useQuery({
    queryKey: settlementsQueryKeys.pendingCash(companyId),
    queryFn: () => settlementsApi.getPendingCash(companyId),
  });
}

// Get platform earnings (Admin only)
export function usePlatformEarnings(startDate: string, endDate: string) {
  return useQuery({
    queryKey: settlementsQueryKeys.platformEarnings(startDate, endDate),
    queryFn: () => settlementsApi.getPlatformEarnings(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// Get cash flow report
export function useCashFlow(
  companyId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: settlementsQueryKeys.cashFlow(companyId, startDate, endDate),
    queryFn: () => settlementsApi.getCashFlow(companyId, startDate, endDate),
  });
}

// Create settlement
export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      periodStart,
      periodEnd,
      companyId,
    }: {
      periodStart: string;
      periodEnd: string;
      companyId?: string;
    }) => settlementsApi.createSettlement(periodStart, periodEnd, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementsQueryKeys.all });
    },
  });
}

// Mark cash as collected
export function useMarkCashCollected() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, amount }: { orderId: string; amount: number }) =>
      settlementsApi.markCashCollected(orderId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementsQueryKeys.all });
    },
  });
}

// Reconcile cash
export function useReconcileCash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      startDate,
      endDate,
      companyId,
    }: {
      startDate: string;
      endDate: string;
      companyId?: string;
    }) => settlementsApi.reconcileCash(startDate, endDate, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementsQueryKeys.all });
    },
  });
}

// Process daily settlement
export function useProcessDailySettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId?: string) =>
      settlementsApi.processDailySettlement(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementsQueryKeys.all });
    },
  });
}

// Verify settlement (Admin only)
export function useVerifySettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ settlementId, notes }: { settlementId: string; notes?: string }) =>
      settlementsApi.verifySettlement(settlementId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementsQueryKeys.all });
    },
  });
}
