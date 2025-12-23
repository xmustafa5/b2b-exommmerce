export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type PayoutMethod = "BANK_TRANSFER" | "CASH" | "WALLET" | "CHECK";

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  iban?: string | null;
  swiftCode?: string | null;
}

export interface Payout {
  id: string;
  companyId: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  bankDetails?: BankDetails | null;
  notes?: string | null;
  ordersIncluded: string[];
  processedBy?: string | null;
  processedAt?: string | null;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PayoutCreateInput {
  amount: number;
  method: PayoutMethod;
  bankDetails?: BankDetails;
  notes?: string;
  ordersIncluded?: string[];
}

export interface PayoutFilters {
  page?: number;
  limit?: number;
  companyId?: string;
  status?: PayoutStatus;
  method?: PayoutMethod;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PayoutsResponse {
  success: boolean;
  payouts: Payout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PayoutBalance {
  success: boolean;
  balance: number;
  currency: string;
}

export interface PayoutSummary {
  totalPayouts: number;
  totalAmount: number;
  pendingPayouts: number;
  pendingAmount: number;
  completedPayouts: number;
  completedAmount: number;
  averagePayoutAmount: number;
  lastPayoutDate?: string | null;
  nextScheduledPayout?: string | null;
}

export interface PayoutReport {
  company: {
    id: string;
    name: string;
    email: string;
    commissionRate: number;
  };
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    totalPayout: number;
  };
  orders: {
    orderId: string;
    date: string;
    revenue: number;
    commission: number;
    payout: number;
    status: string;
  }[];
  generatedAt: string;
}
