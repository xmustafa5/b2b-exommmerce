import { apiClient } from "./config";
import type {
  Payout,
  PayoutCreateInput,
  PayoutFilters,
  PayoutsResponse,
  PayoutBalance,
  PayoutSummary,
  PayoutReport,
  PayoutStatus,
} from "@/types/payout";

export const payoutsApi = {
  // Get payout history
  getHistory: async (filters?: PayoutFilters): Promise<PayoutsResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.companyId) params.append("companyId", filters.companyId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.method) params.append("method", filters.method);
    if (filters?.fromDate) params.append("fromDate", filters.fromDate);
    if (filters?.toDate) params.append("toDate", filters.toDate);
    if (filters?.minAmount) params.append("minAmount", String(filters.minAmount));
    if (filters?.maxAmount) params.append("maxAmount", String(filters.maxAmount));

    const { data } = await apiClient.get(`/payouts/history?${params}`);
    return data;
  },

  // Get available balance
  getBalance: async (companyId?: string): Promise<PayoutBalance> => {
    const params = companyId ? `?companyId=${companyId}` : "";
    const { data } = await apiClient.get(`/payouts/balance${params}`);
    return data;
  },

  // Get payout summary
  getSummary: async (companyId?: string): Promise<{ success: boolean; summary: PayoutSummary }> => {
    const params = companyId ? `?companyId=${companyId}` : "";
    const { data } = await apiClient.get(`/payouts/summary${params}`);
    return data;
  },

  // Create payout request
  createRequest: async (input: PayoutCreateInput): Promise<{ success: boolean; payout: Payout; message: string }> => {
    const { data } = await apiClient.post("/payouts/request", input);
    return data;
  },

  // Update payout status (Admin only)
  updateStatus: async (
    id: string,
    status: PayoutStatus,
    notes?: string
  ): Promise<{ success: boolean; payout: Payout; message: string }> => {
    const { data } = await apiClient.patch(`/payouts/${id}/status`, { status, notes });
    return data;
  },

  // Cancel payout
  cancel: async (id: string, reason: string): Promise<{ success: boolean; payout: Payout; message: string }> => {
    const { data } = await apiClient.delete(`/payouts/${id}`, { data: { reason } });
    return data;
  },

  // Get pending payouts for review (Admin only)
  getPending: async (): Promise<{ success: boolean; payouts: Payout[]; total: number }> => {
    const { data } = await apiClient.get("/payouts/pending");
    return data;
  },

  // Bulk approve payouts (Admin only)
  bulkApprove: async (
    payoutIds: string[]
  ): Promise<{ success: boolean; approved: number; payouts: Payout[]; message: string }> => {
    const { data } = await apiClient.post("/payouts/bulk-approve", { payoutIds });
    return data;
  },

  // Generate payout report
  generateReport: async (
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; report: PayoutReport }> => {
    const { data } = await apiClient.post("/payouts/report", {
      companyId,
      startDate,
      endDate,
    });
    return data;
  },

  // Schedule automatic payouts
  schedulePayouts: async (
    schedule: "WEEKLY" | "BIWEEKLY" | "MONTHLY",
    companyId?: string
  ): Promise<{
    success: boolean;
    schedule: {
      companyId: string;
      schedule: string;
      enabled: boolean;
      nextPayoutDate: string;
      createdAt: string;
    };
    message: string;
  }> => {
    const { data } = await apiClient.post("/payouts/schedule", {
      schedule,
      companyId,
    });
    return data;
  },

  // Validate bank details
  validateBankDetails: async (bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    iban?: string;
    swiftCode?: string;
  }): Promise<{ success: boolean; valid: boolean; message: string }> => {
    const { data } = await apiClient.post("/payouts/validate-bank", { bankDetails });
    return data;
  },
};
