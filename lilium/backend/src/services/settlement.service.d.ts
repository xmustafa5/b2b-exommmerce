import { FastifyInstance } from 'fastify';
interface Settlement {
    id: string;
    companyId: string;
    periodStart: Date;
    periodEnd: Date;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    totalPayout: number;
    cashCollected: number;
    cashToRemit: number;
    status: 'PENDING' | 'VERIFIED' | 'SETTLED' | 'DISPUTED';
    createdAt: Date;
    settledAt?: Date;
    notes?: string;
}
interface CashReconciliation {
    orderId: string;
    orderAmount: number;
    cashCollected: number;
    collectedBy: string;
    collectedAt: Date;
    verified: boolean;
    discrepancy?: number;
    notes?: string;
}
interface SettlementSummary {
    companyId: string;
    companyName: string;
    period: {
        start: Date;
        end: Date;
    };
    orders: {
        total: number;
        delivered: number;
        cashOrders: number;
        onlineOrders: number;
    };
    financials: {
        totalRevenue: number;
        cashCollected: number;
        onlinePayments: number;
        platformCommission: number;
        vendorPayout: number;
        pendingCash: number;
    };
    cashFlow: {
        toCollect: number;
        collected: number;
        toRemit: number;
        remitted: number;
    };
}
export declare class SettlementService {
    private fastify;
    constructor(fastify: FastifyInstance);
    /**
     * Create a settlement for a company for a specific period
     */
    createSettlement(companyId: string, periodStart: Date, periodEnd: Date): Promise<Settlement>;
    /**
     * Get settlement summary for a company
     */
    getSettlementSummary(companyId: string, startDate?: Date, endDate?: Date): Promise<SettlementSummary>;
    /**
     * Reconcile cash collections for a period
     */
    reconcileCash(companyId: string, startDate: Date, endDate: Date): Promise<CashReconciliation[]>;
    /**
     * Mark cash as collected for an order
     */
    markCashCollected(orderId: string, amount: number, collectedBy: string): Promise<void>;
    /**
     * Get pending cash collections for a company
     */
    getPendingCashCollections(companyId: string): Promise<any[]>;
    /**
     * Process daily settlement
     */
    processDailySettlement(companyId: string): Promise<Settlement>;
    /**
     * Verify settlement and mark as settled
     */
    verifySettlement(settlementId: string, verifiedBy: string, notes?: string): Promise<Settlement>;
    /**
     * Get settlement history
     */
    getSettlementHistory(companyId: string, limit?: number): Promise<Settlement[]>;
    /**
     * Calculate platform earnings for a period
     */
    calculatePlatformEarnings(startDate: Date, endDate: Date): Promise<any>;
}
export {};
//# sourceMappingURL=settlement.service.d.ts.map