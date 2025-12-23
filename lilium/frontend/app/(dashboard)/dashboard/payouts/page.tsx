"use client";

import { useState } from "react";
import {
  Search,
  MoreHorizontal,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Check,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  usePendingPayouts,
  usePayoutHistory,
  useBulkApprovePayouts,
} from "@/hooks/usePayouts";
import { useToast } from "@/hooks/use-toast";
import type { Payout, PayoutFilters, PayoutStatus } from "@/types/payout";
import { PayoutStatusDialog } from "./_components/payout-status-dialog";
import { PayoutCancelDialog } from "./_components/payout-cancel-dialog";

const statusColors: Record<PayoutStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

const methodLabels: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  WALLET: "Wallet",
  CHECK: "Check",
};

export default function PayoutsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<PayoutFilters>({
    page: 1,
    limit: 20,
  });
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);

  // Dialogs
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  // Queries
  const { data: pendingData, isLoading: isLoadingPending } = usePendingPayouts();
  const { data: historyData, isLoading: isLoadingHistory } = usePayoutHistory(filters);
  const bulkApproveMutation = useBulkApprovePayouts();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenStatus = (payout: Payout) => {
    setSelectedPayout(payout);
    setStatusDialogOpen(true);
  };

  const handleOpenCancel = (payout: Payout) => {
    setSelectedPayout(payout);
    setCancelDialogOpen(true);
  };

  const handleToggleSelect = (payoutId: string) => {
    setSelectedPayouts((prev) =>
      prev.includes(payoutId)
        ? prev.filter((id) => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const handleSelectAll = () => {
    if (!pendingData?.payouts) return;
    if (selectedPayouts.length === pendingData.payouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(pendingData.payouts.map((p) => p.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayouts.length === 0) return;

    try {
      const result = await bulkApproveMutation.mutateAsync(selectedPayouts);
      toast({
        title: "Success",
        description: result.message,
      });
      setSelectedPayouts([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve payouts",
        variant: "destructive",
      });
    }
  };

  const pendingPayouts = pendingData?.payouts || [];
  const allPayouts = historyData?.payouts || [];

  // Calculate stats
  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalProcessing = allPayouts
    .filter((p) => p.status === "PROCESSING")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = allPayouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col">
      <Header title="Payouts Management" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingPayouts.length} requests waiting
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalProcessing)}
              </div>
              <p className="text-xs text-muted-foreground">Being processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCompleted)}
              </div>
              <p className="text-xs text-muted-foreground">Total paid out</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payouts for Review */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Payouts for Review</CardTitle>
              {selectedPayouts.length > 0 && (
                <Button
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                >
                  {bulkApproveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Approve {selectedPayouts.length} Selected
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPending ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : pendingPayouts.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                <CheckCircle className="mb-2 h-8 w-8" />
                <p>No pending payouts to review</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          pendingPayouts.length > 0 &&
                          selectedPayouts.length === pendingPayouts.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPayouts.includes(payout.id)}
                          onCheckedChange={() => handleToggleSelect(payout.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{payout.company?.name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">
                          {payout.company?.email}
                        </p>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payout.amount)}
                      </TableCell>
                      <TableCell>{methodLabels[payout.method]}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(payout.requestedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenStatus(payout)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenCancel(payout)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Payout
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* All Payouts History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Payout History</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : (value as PayoutStatus),
                      page: 1,
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.method || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      method: value === "all" ? undefined : (value as any),
                      page: 1,
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="WALLET">Wallet</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : allPayouts.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <DollarSign className="mb-4 h-12 w-12" />
                <p>No payouts found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <p className="font-medium">{payout.company?.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">
                            {payout.company?.email}
                          </p>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell>{methodLabels[payout.method]}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[payout.status]}>
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payout.requestedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payout.processedAt ? formatDate(payout.processedAt) : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenStatus(payout)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Update Status
                              </DropdownMenuItem>
                              {payout.status === "PENDING" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleOpenCancel(payout)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Payout
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {historyData && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(historyData.page - 1) * historyData.limit + 1} to{" "}
                      {Math.min(historyData.page * historyData.limit, historyData.total)} of{" "}
                      {historyData.total} payouts
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            page: (prev.page || 1) - 1,
                          }))
                        }
                        disabled={historyData.page <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            page: (prev.page || 1) + 1,
                          }))
                        }
                        disabled={historyData.page >= historyData.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Dialog */}
      {selectedPayout && (
        <PayoutStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          payout={selectedPayout}
        />
      )}

      {/* Cancel Dialog */}
      {selectedPayout && (
        <PayoutCancelDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          payout={selectedPayout}
        />
      )}
    </div>
  );
}
