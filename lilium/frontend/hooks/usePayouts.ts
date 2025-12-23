import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payoutsQueryKeys } from "@/constants/queryKeys";
import { payoutsApi } from "@/actions/payouts";
import type { PayoutFilters, PayoutCreateInput, PayoutStatus } from "@/types/payout";

// Get payout history
export function usePayoutHistory(filters?: PayoutFilters) {
  return useQuery({
    queryKey: payoutsQueryKeys.list(filters),
    queryFn: () => payoutsApi.getHistory(filters),
  });
}

// Get available balance
export function usePayoutBalance(companyId?: string) {
  return useQuery({
    queryKey: payoutsQueryKeys.balance(companyId),
    queryFn: () => payoutsApi.getBalance(companyId),
  });
}

// Get payout summary
export function usePayoutSummary(companyId?: string) {
  return useQuery({
    queryKey: payoutsQueryKeys.summary(companyId),
    queryFn: () => payoutsApi.getSummary(companyId),
  });
}

// Get pending payouts (Admin only)
export function usePendingPayouts() {
  return useQuery({
    queryKey: payoutsQueryKeys.pending(),
    queryFn: payoutsApi.getPending,
  });
}

// Create payout request
export function useCreatePayoutRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PayoutCreateInput) => payoutsApi.createRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutsQueryKeys.all });
    },
  });
}

// Update payout status (Admin only)
export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: PayoutStatus;
      notes?: string;
    }) => payoutsApi.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutsQueryKeys.all });
    },
  });
}

// Cancel payout
export function useCancelPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      payoutsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutsQueryKeys.all });
    },
  });
}

// Bulk approve payouts (Admin only)
export function useBulkApprovePayouts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payoutIds: string[]) => payoutsApi.bulkApprove(payoutIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutsQueryKeys.all });
    },
  });
}

// Generate payout report
export function useGeneratePayoutReport() {
  return useMutation({
    mutationFn: ({
      companyId,
      startDate,
      endDate,
    }: {
      companyId: string;
      startDate: string;
      endDate: string;
    }) => payoutsApi.generateReport(companyId, startDate, endDate),
  });
}

// Schedule automatic payouts
export function useSchedulePayouts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schedule,
      companyId,
    }: {
      schedule: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
      companyId?: string;
    }) => payoutsApi.schedulePayouts(schedule, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutsQueryKeys.all });
    },
  });
}

// Validate bank details
export function useValidateBankDetails() {
  return useMutation({
    mutationFn: (bankDetails: {
      accountName: string;
      accountNumber: string;
      bankName: string;
      iban?: string;
      swiftCode?: string;
    }) => payoutsApi.validateBankDetails(bankDetails),
  });
}
