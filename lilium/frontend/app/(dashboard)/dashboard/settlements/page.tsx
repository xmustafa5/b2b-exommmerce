"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Banknote,
  BarChart3,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSettlementHistory,
  useSettlementSummary,
  usePendingCashCollections,
} from "@/hooks/useSettlements";
import { useToast } from "@/hooks/use-toast";
import type { Settlement, PendingCashCollection, SettlementStatus } from "@/types/settlement";
import { VerifySettlementDialog } from "./_components/verify-settlement-dialog";
import { CashCollectionDialog } from "./_components/cash-collection-dialog";

const statusColors: Record<SettlementStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  VERIFIED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
};

export default function SettlementsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("settlements");

  // Dialogs
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<PendingCashCollection | null>(null);

  // Queries
  const { data: summaryData, isLoading: isLoadingSummary } = useSettlementSummary();
  const { data: historyData, isLoading: isLoadingHistory } = useSettlementHistory(undefined, 20);
  const { data: pendingCashData, isLoading: isLoadingPendingCash } = usePendingCashCollections();

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
    });
  };

  const handleOpenVerify = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setVerifyDialogOpen(true);
  };

  const handleOpenCashCollection = (collection: PendingCashCollection) => {
    setSelectedCollection(collection);
    setCashDialogOpen(true);
  };

  const summary = summaryData?.summary;
  const settlements = historyData?.settlements || [];
  const pendingCollections = pendingCashData?.pendingCollections || [];

  // Stats
  const pendingSettlements = settlements.filter((s) => s.status === "PENDING").length;
  const totalPending = settlements
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + s.netAmount, 0);

  return (
    <div className="flex flex-col">
      <Header title="Settlements" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingSummary ? "-" : formatCurrency(summary?.totalSales || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Platform total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoadingSummary
                  ? "-"
                  : formatCurrency(summary?.totalPlatformFees || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Commission earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingSettlements} settlements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Cash</CardTitle>
              <Banknote className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {isLoadingPendingCash
                  ? "-"
                  : formatCurrency(pendingCashData?.totalAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingCollections.length} orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="settlements"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Settlements
                </TabsTrigger>
                <TabsTrigger
                  value="pending-cash"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Pending Cash
                  {pendingCollections.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingCollections.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Settlements Tab */}
              <TabsContent value="settlements" className="m-0 p-6">
                {isLoadingHistory ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : settlements.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <DollarSign className="mb-4 h-12 w-12" />
                    <p>No settlements found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Platform Fee</TableHead>
                        <TableHead className="text-right">Net Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settlements.map((settlement) => (
                        <TableRow key={settlement.id}>
                          <TableCell>
                            <p className="font-medium">
                              {formatDate(settlement.periodStart)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              to {formatDate(settlement.periodEnd)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {settlement.companyName || "N/A"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(settlement.totalSales)}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            -{formatCurrency(settlement.platformFee)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(settlement.netAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[settlement.status]}>
                              {settlement.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {settlement.status === "PENDING" && (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenVerify(settlement)}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Verify Settlement
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* Pending Cash Tab */}
              <TabsContent value="pending-cash" className="m-0 p-6">
                {isLoadingPendingCash ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : pendingCollections.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <CheckCircle className="mb-4 h-12 w-12" />
                    <p>All cash collections are up to date</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingCollections.map((collection) => (
                        <TableRow key={collection.orderId}>
                          <TableCell className="font-medium">
                            {collection.orderNumber}
                          </TableCell>
                          <TableCell>{collection.customerName}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(collection.orderAmount)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(collection.orderDate)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(collection.dueDate)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleOpenCashCollection(collection)}
                            >
                              <Banknote className="mr-2 h-4 w-4" />
                              Collect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Verify Settlement Dialog */}
      {selectedSettlement && (
        <VerifySettlementDialog
          open={verifyDialogOpen}
          onOpenChange={setVerifyDialogOpen}
          settlement={selectedSettlement}
        />
      )}

      {/* Cash Collection Dialog */}
      {selectedCollection && (
        <CashCollectionDialog
          open={cashDialogOpen}
          onOpenChange={setCashDialogOpen}
          collection={selectedCollection}
        />
      )}
    </div>
  );
}
