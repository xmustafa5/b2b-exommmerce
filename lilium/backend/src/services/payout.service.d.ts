import { FastifyInstance } from 'fastify';
declare enum PayoutStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
declare enum PayoutMethod {
    BANK_TRANSFER = "BANK_TRANSFER",
    CASH = "CASH",
    WALLET = "WALLET",
    CHECK = "CHECK"
}
interface CreatePayoutInput {
    companyId: string;
    amount: number;
    method: PayoutMethod;
    bankDetails?: {
        accountName: string;
        accountNumber: string;
        bankName: string;
        iban?: string;
        swiftCode?: string;
    };
    notes?: string;
    ordersIncluded?: string[];
}
interface PayoutFilter {
    companyId?: string;
    status?: PayoutStatus;
    method?: PayoutMethod;
    fromDate?: Date;
    toDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    limit?: number;
}
interface PayoutSummary {
    totalPayouts: number;
    totalAmount: number;
    pendingPayouts: number;
    pendingAmount: number;
    completedPayouts: number;
    completedAmount: number;
    averagePayoutAmount: number;
    lastPayoutDate?: Date;
    nextScheduledPayout?: Date;
}
export declare class PayoutService {
    private fastify;
    constructor(fastify: FastifyInstance);
    createPayout(data: CreatePayoutInput): Promise<any>;
    calculateAvailableBalance(companyId: string): Promise<number>;
    getPayoutHistory(filter: PayoutFilter): Promise<{
        payouts: any[];
        total: number;
    }>;
    updatePayoutStatus(payoutId: string, status: PayoutStatus, processedBy?: string, notes?: string): Promise<any>;
    getPayoutSummary(companyId: string): Promise<PayoutSummary>;
    scheduleAutomaticPayout(companyId: string, schedule: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'): Promise<any>;
    private calculateNextPayoutDate;
    generatePayoutReport(companyId: string, startDate: Date, endDate: Date): Promise<any>;
    validateBankDetails(bankDetails: any): boolean;
    cancelPayout(payoutId: string, reason: string): Promise<any>;
    getPendingPayoutsForReview(): Promise<any[]>;
    bulkApprovePayouts(payoutIds: string[], approvedBy: string): Promise<any>;
}
export {};
//# sourceMappingURL=payout.service.d.ts.map