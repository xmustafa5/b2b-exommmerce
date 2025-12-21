"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const client_1 = require("@prisma/client");
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "PENDING";
    PayoutStatus["PROCESSING"] = "PROCESSING";
    PayoutStatus["COMPLETED"] = "COMPLETED";
    PayoutStatus["FAILED"] = "FAILED";
    PayoutStatus["CANCELLED"] = "CANCELLED";
})(PayoutStatus || (PayoutStatus = {}));
var PayoutMethod;
(function (PayoutMethod) {
    PayoutMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PayoutMethod["CASH"] = "CASH";
    PayoutMethod["WALLET"] = "WALLET";
    PayoutMethod["CHECK"] = "CHECK";
})(PayoutMethod || (PayoutMethod = {}));
class PayoutService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    // Create a new payout request
    async createPayout(data) {
        try {
            // Verify company exists
            const company = await this.fastify.prisma.company.findUnique({
                where: { id: data.companyId }
            });
            if (!company) {
                throw this.fastify.httpErrors.notFound('Company not found');
            }
            // Calculate available balance for payout
            const availableBalance = await this.calculateAvailableBalance(data.companyId);
            if (data.amount > availableBalance) {
                throw this.fastify.httpErrors.badRequest(`Insufficient balance. Available: ${availableBalance} IQD`);
            }
            // Create payout record
            const payout = await this.fastify.prisma.$transaction(async (prisma) => {
                // Create the payout
                const newPayout = await prisma.$executeRaw `
          INSERT INTO "Payout" (
            id,
            "companyId",
            amount,
            method,
            status,
            "bankDetails",
            notes,
            "ordersIncluded",
            "requestedAt",
            "createdAt",
            "updatedAt"
          ) VALUES (
            ${client_1.Prisma.sql `gen_random_uuid()`},
            ${data.companyId},
            ${data.amount},
            ${data.method},
            ${PayoutStatus.PENDING},
            ${JSON.stringify(data.bankDetails || {})},
            ${data.notes || null},
            ${JSON.stringify(data.ordersIncluded || [])},
            ${new Date()},
            ${new Date()},
            ${new Date()}
          ) RETURNING *
        `;
                // Mark included orders as having pending payout
                if (data.ordersIncluded && data.ordersIncluded.length > 0) {
                    await prisma.order.updateMany({
                        where: {
                            id: { in: data.ordersIncluded },
                            items: {
                                some: {
                                    product: { companyId: data.companyId }
                                }
                            }
                        },
                        data: {
                            payoutStatus: 'PENDING'
                        }
                    });
                }
                return newPayout;
            });
            return {
                id: 'payout-' + Date.now(), // Temporary ID generation
                ...data,
                status: PayoutStatus.PENDING,
                requestedAt: new Date(),
                createdAt: new Date()
            };
        }
        catch (error) {
            if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Insufficient'))) {
                throw error;
            }
            throw this.fastify.httpErrors.badRequest('Failed to create payout');
        }
    }
    // Calculate available balance for payout
    async calculateAvailableBalance(companyId) {
        try {
            // Get company commission rate
            const company = await this.fastify.prisma.company.findUnique({
                where: { id: companyId },
                select: { commissionRate: true }
            });
            const commissionRate = (company?.commissionRate || 10) / 100;
            // Get completed orders not yet paid out
            const unpaidOrders = await this.fastify.prisma.order.findMany({
                where: {
                    items: {
                        some: {
                            product: { companyId }
                        }
                    },
                    status: 'COMPLETED',
                    payoutStatus: {
                        in: [null, 'UNPAID']
                    }
                },
                include: {
                    items: {
                        where: {
                            product: { companyId }
                        }
                    }
                }
            });
            let totalRevenue = 0;
            unpaidOrders.forEach(order => {
                order.items.forEach(item => {
                    totalRevenue += item.price * item.quantity;
                });
            });
            // Calculate balance after commission
            const totalCommission = totalRevenue * commissionRate;
            const availableBalance = totalRevenue - totalCommission;
            return availableBalance;
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to calculate available balance');
        }
    }
    // Get payout history
    async getPayoutHistory(filter) {
        try {
            const page = filter.page || 1;
            const limit = filter.limit || 20;
            const skip = (page - 1) * limit;
            const where = {};
            if (filter.companyId) {
                where.companyId = filter.companyId;
            }
            if (filter.status) {
                where.status = filter.status;
            }
            if (filter.method) {
                where.method = filter.method;
            }
            if (filter.fromDate || filter.toDate) {
                where.requestedAt = {};
                if (filter.fromDate) {
                    where.requestedAt.gte = filter.fromDate;
                }
                if (filter.toDate) {
                    where.requestedAt.lte = filter.toDate;
                }
            }
            if (filter.minAmount || filter.maxAmount) {
                where.amount = {};
                if (filter.minAmount) {
                    where.amount.gte = filter.minAmount;
                }
                if (filter.maxAmount) {
                    where.amount.lte = filter.maxAmount;
                }
            }
            // Simulate fetching payouts (would be actual DB query)
            const payouts = [];
            const total = 0;
            return { payouts, total };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to fetch payout history');
        }
    }
    // Update payout status
    async updatePayoutStatus(payoutId, status, processedBy, notes) {
        try {
            // Update payout status
            const updatedPayout = {
                id: payoutId,
                status,
                processedBy,
                processedAt: status === PayoutStatus.COMPLETED ? new Date() : undefined,
                notes,
                updatedAt: new Date()
            };
            // If payout is completed, mark related orders as paid
            if (status === PayoutStatus.COMPLETED) {
                // This would update the actual orders in the database
                // await this.fastify.prisma.order.updateMany({...})
            }
            return updatedPayout;
        }
        catch (error) {
            throw this.fastify.httpErrors.badRequest('Failed to update payout status');
        }
    }
    // Get payout summary for a company
    async getPayoutSummary(companyId) {
        try {
            // This would fetch actual data from the database
            // For now, returning mock data structure
            const availableBalance = await this.calculateAvailableBalance(companyId);
            return {
                totalPayouts: 0,
                totalAmount: 0,
                pendingPayouts: 0,
                pendingAmount: 0,
                completedPayouts: 0,
                completedAmount: 0,
                averagePayoutAmount: 0,
                lastPayoutDate: undefined,
                nextScheduledPayout: undefined
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to get payout summary');
        }
    }
    // Schedule automatic payouts (for future implementation)
    async scheduleAutomaticPayout(companyId, schedule) {
        try {
            // This would set up automatic payout scheduling
            // Could integrate with a job queue like Bull or Agenda
            return {
                companyId,
                schedule,
                enabled: true,
                nextPayoutDate: this.calculateNextPayoutDate(schedule),
                createdAt: new Date()
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.badRequest('Failed to schedule automatic payout');
        }
    }
    // Calculate next payout date based on schedule
    calculateNextPayoutDate(schedule) {
        const now = new Date();
        const nextDate = new Date(now);
        switch (schedule) {
            case 'WEEKLY':
                nextDate.setDate(now.getDate() + 7);
                break;
            case 'BIWEEKLY':
                nextDate.setDate(now.getDate() + 14);
                break;
            case 'MONTHLY':
                nextDate.setMonth(now.getMonth() + 1);
                break;
        }
        return nextDate;
    }
    // Generate payout report
    async generatePayoutReport(companyId, startDate, endDate) {
        try {
            const company = await this.fastify.prisma.company.findUnique({
                where: { id: companyId },
                select: {
                    name: true,
                    email: true,
                    commissionRate: true
                }
            });
            if (!company) {
                throw this.fastify.httpErrors.notFound('Company not found');
            }
            // Get all completed orders in date range
            const orders = await this.fastify.prisma.order.findMany({
                where: {
                    items: {
                        some: {
                            product: { companyId }
                        }
                    },
                    status: 'COMPLETED',
                    completedAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    items: {
                        where: {
                            product: { companyId }
                        }
                    }
                }
            });
            const commissionRate = (company.commissionRate || 10) / 100;
            let totalRevenue = 0;
            let totalOrders = orders.length;
            const orderDetails = [];
            orders.forEach(order => {
                let orderRevenue = 0;
                order.items.forEach(item => {
                    orderRevenue += item.price * item.quantity;
                });
                totalRevenue += orderRevenue;
                const commission = orderRevenue * commissionRate;
                const payout = orderRevenue - commission;
                orderDetails.push({
                    orderId: order.id,
                    date: order.completedAt,
                    revenue: orderRevenue,
                    commission,
                    payout,
                    status: order.payoutStatus || 'UNPAID'
                });
            });
            const totalCommission = totalRevenue * commissionRate;
            const totalPayout = totalRevenue - totalCommission;
            return {
                company: {
                    id: companyId,
                    name: company.name,
                    email: company.email,
                    commissionRate: company.commissionRate
                },
                period: {
                    start: startDate,
                    end: endDate
                },
                summary: {
                    totalOrders,
                    totalRevenue,
                    totalCommission,
                    totalPayout
                },
                orders: orderDetails,
                generatedAt: new Date()
            };
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw error;
            }
            throw this.fastify.httpErrors.internalServerError('Failed to generate payout report');
        }
    }
    // Validate bank details
    validateBankDetails(bankDetails) {
        if (!bankDetails)
            return false;
        const { accountName, accountNumber, bankName } = bankDetails;
        if (!accountName || !accountNumber || !bankName) {
            return false;
        }
        // Additional validation rules can be added here
        // For Iraqi banks, you might want to validate:
        // - Account number format
        // - IBAN format if provided
        // - Bank code validity
        return true;
    }
    // Cancel payout
    async cancelPayout(payoutId, reason) {
        try {
            // Only pending payouts can be cancelled
            const payout = await this.updatePayoutStatus(payoutId, PayoutStatus.CANCELLED, undefined, reason);
            // Release the orders back to unpaid status
            // This would be actual database operations
            return payout;
        }
        catch (error) {
            throw this.fastify.httpErrors.badRequest('Failed to cancel payout');
        }
    }
    // Get pending payouts for admin review
    async getPendingPayoutsForReview() {
        try {
            // This would fetch all pending payouts across all companies
            // For admin dashboard to review and approve
            return [];
        }
        catch (error) {
            throw this.fastify.httpErrors.internalServerError('Failed to fetch pending payouts');
        }
    }
    // Bulk approve payouts (admin function)
    async bulkApprovePayouts(payoutIds, approvedBy) {
        try {
            const results = await Promise.all(payoutIds.map(id => this.updatePayoutStatus(id, PayoutStatus.PROCESSING, approvedBy, 'Bulk approved')));
            return {
                approved: results.length,
                payouts: results
            };
        }
        catch (error) {
            throw this.fastify.httpErrors.badRequest('Failed to bulk approve payouts');
        }
    }
}
exports.PayoutService = PayoutService;
//# sourceMappingURL=payout.service.js.map