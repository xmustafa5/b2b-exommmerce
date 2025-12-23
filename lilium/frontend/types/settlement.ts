export type SettlementStatus = "PENDING" | "VERIFIED" | "PAID";

export interface Settlement {
  id: string;
  companyId: string;
  companyName?: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  platformFee: number;
  netAmount: number;
  status: SettlementStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SettlementSummary {
  companyId: string;
  companyName: string;
  period: {
    start: string;
    end: string;
  };
  totalSales: number;
  totalPlatformFees: number;
  totalCashCollected: number;
  pendingCashAmount: number;
  netPayable: number;
  cashFlow: {
    inflow: number;
    outflow: number;
    balance: number;
  };
}

export interface PendingCashCollection {
  orderId: string;
  orderNumber: string;
  orderAmount: number;
  customerName: string;
  orderDate: string;
  dueDate: string;
}

export interface CashReconciliation {
  orderId: string;
  orderNumber: string;
  expectedAmount: number;
  collectedAmount: number;
  discrepancy: number;
  status: "MATCHED" | "SHORTAGE" | "OVERAGE";
  collectedAt: string;
}

export interface DailySettlement {
  id: string;
  companyId: string;
  date: string;
  totalOrders: number;
  totalSales: number;
  platformFee: number;
  netAmount: number;
  cashCollected: number;
  pendingCash: number;
  status: SettlementStatus;
  createdAt: string;
}

export interface PlatformEarnings {
  period: {
    start: string;
    end: string;
  };
  totalSales: number;
  totalPlatformFees: number;
  totalOrders: number;
  averageFeeRate: number;
  byCompany: {
    companyId: string;
    companyName: string;
    sales: number;
    platformFee: number;
    orderCount: number;
  }[];
}

export interface CashFlowReport {
  inflow: number;
  outflow: number;
  balance: number;
  pendingCollections: number;
  settledAmount: number;
  unsettledAmount: number;
}

export interface SettlementFilters {
  companyId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}
