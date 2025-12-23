import { apiClient } from "./config";
import type {
  Settlement,
  SettlementSummary,
  PendingCashCollection,
  CashReconciliation,
  DailySettlement,
  PlatformEarnings,
  CashFlowReport,
} from "@/types/settlement";

export const settlementsApi = {
  // Create settlement for a period
  createSettlement: async (
    periodStart: string,
    periodEnd: string,
    companyId?: string
  ): Promise<{ success: boolean; settlement: Settlement; message: string }> => {
    const { data } = await apiClient.post("/settlements/create", {
      companyId,
      periodStart,
      periodEnd,
    });
    return data;
  },

  // Get settlement summary
  getSummary: async (
    companyId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; summary: SettlementSummary }> => {
    const params = new URLSearchParams();
    if (companyId) params.append("companyId", companyId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const { data } = await apiClient.get(`/settlements/summary?${params}`);
    return data;
  },

  // Get settlement history
  getHistory: async (
    companyId?: string,
    limit?: number
  ): Promise<{ success: boolean; settlements: Settlement[]; total: number }> => {
    const params = new URLSearchParams();
    if (companyId) params.append("companyId", companyId);
    if (limit) params.append("limit", String(limit));

    const { data } = await apiClient.get(`/settlements/history?${params}`);
    return data;
  },

  // Get pending cash collections
  getPendingCash: async (
    companyId?: string
  ): Promise<{
    success: boolean;
    pendingCollections: PendingCashCollection[];
    total: number;
    totalAmount: number;
  }> => {
    const params = companyId ? `?companyId=${companyId}` : "";
    const { data } = await apiClient.get(`/settlements/pending-cash${params}`);
    return data;
  },

  // Mark cash as collected
  markCashCollected: async (
    orderId: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post("/settlements/cash-collected", {
      orderId,
      amount,
    });
    return data;
  },

  // Reconcile cash collections
  reconcileCash: async (
    startDate: string,
    endDate: string,
    companyId?: string
  ): Promise<{
    success: boolean;
    reconciliations: CashReconciliation[];
    total: number;
    message: string;
  }> => {
    const { data } = await apiClient.post("/settlements/reconcile-cash", {
      companyId,
      startDate,
      endDate,
    });
    return data;
  },

  // Process daily settlement
  processDailySettlement: async (
    companyId?: string
  ): Promise<{ success: boolean; settlement: DailySettlement; message: string }> => {
    const { data } = await apiClient.post("/settlements/daily", { companyId });
    return data;
  },

  // Verify settlement (Admin only)
  verifySettlement: async (
    settlementId: string,
    notes?: string
  ): Promise<{ success: boolean; settlement: Settlement; message: string }> => {
    const { data } = await apiClient.patch(`/settlements/${settlementId}/verify`, {
      notes,
    });
    return data;
  },

  // Get platform earnings (Admin only)
  getPlatformEarnings: async (
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; earnings: PlatformEarnings }> => {
    const params = new URLSearchParams();
    params.append("startDate", startDate);
    params.append("endDate", endDate);

    const { data } = await apiClient.get(`/settlements/platform-earnings?${params}`);
    return data;
  },

  // Get cash flow report
  getCashFlow: async (
    companyId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    success: boolean;
    cashFlow: CashFlowReport;
    period: { start: string; end: string };
    company: { id: string; name: string };
  }> => {
    const params = new URLSearchParams();
    if (companyId) params.append("companyId", companyId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const { data } = await apiClient.get(`/settlements/cash-flow?${params}`);
    return data;
  },
};
