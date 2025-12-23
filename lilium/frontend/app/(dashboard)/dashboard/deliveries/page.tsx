"use client";

import { useState } from "react";
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  MoreHorizontal,
  RefreshCw,
  Banknote,
  User,
  TrendingUp,
  AlertCircle,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useActiveDeliveries,
  useDeliveryMetrics,
} from "@/hooks/useDelivery";
import { useToast } from "@/hooks/use-toast";
import type { DeliveryOrder, MetricsPeriod } from "@/types/delivery";
import { UpdateStatusDialog } from "./_components/update-status-dialog";
import { CashCollectionDialog } from "./_components/cash-collection-dialog";
import { AssignDriverDialog } from "./_components/assign-driver-dialog";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  READY_FOR_DELIVERY: "bg-cyan-100 text-cyan-700",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_FOR_DELIVERY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export default function DeliveriesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [metricsPeriod, setMetricsPeriod] = useState<MetricsPeriod>("today");

  // Dialogs
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);

  // Queries
  const { data: activeData, isLoading: isLoadingActive, refetch: refetchActive } = useActiveDeliveries();
  const { data: metricsData, isLoading: isLoadingMetrics } = useDeliveryMetrics(metricsPeriod);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpdateStatus = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };

  const handleRecordCash = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setCashDialogOpen(true);
  };

  const handleAssignDriver = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setDriverDialogOpen(true);
  };

  const metrics = metricsData?.metrics;
  const activeOrders = activeData?.activeOrders;
  const summary = activeData?.summary;

  const renderOrderRow = (order: DeliveryOrder) => (
    <TableRow key={order.id}>
      <TableCell>
        <p className="font-medium">{order.orderNumber}</p>
        <p className="text-xs text-muted-foreground">
          {formatTime(order.createdAt)}
        </p>
      </TableCell>
      <TableCell>
        <p className="font-medium">{order.user.name}</p>
        <p className="text-xs text-muted-foreground truncate max-w-40">
          {order.user.address}
        </p>
      </TableCell>
      <TableCell>
        {order.user.zone && (
          <Badge variant="outline">{order.user.zone}</Badge>
        )}
      </TableCell>
      <TableCell>
        <p className="text-sm">
          {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </p>
      </TableCell>
      <TableCell className="font-medium">
        {formatCurrency(order.total)}
      </TableCell>
      <TableCell>
        <Badge className={statusColors[order.status]}>
          {statusLabels[order.status]}
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
            <DropdownMenuItem onClick={() => handleUpdateStatus(order)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAssignDriver(order)}>
              <User className="mr-2 h-4 w-4" />
              Assign Driver
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {order.paymentMethod === "COD" && (
              <DropdownMenuItem onClick={() => handleRecordCash(order)}>
                <Banknote className="mr-2 h-4 w-4" />
                Record Cash
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="flex flex-col">
      <Header title="Delivery Management" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingActive ? "-" : summary?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preparing</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {isLoadingActive ? "-" : summary?.preparing || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Being prepared
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
              <Truck className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {isLoadingActive ? "-" : summary?.onTheWay || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                En route to customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoadingMetrics
                  ? "-"
                  : `${metrics?.successRate?.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {metricsPeriod === "today"
                  ? "Today"
                  : metricsPeriod === "week"
                  ? "This week"
                  : "This month"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between border-b px-4">
                <TabsList className="h-auto rounded-none border-b-0 bg-transparent p-0">
                  <TabsTrigger
                    value="active"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Active Deliveries
                    {summary && summary.total > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {summary.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="metrics"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Metrics
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 py-2">
                  {activeTab === "metrics" && (
                    <Select
                      value={metricsPeriod}
                      onValueChange={(value) =>
                        setMetricsPeriod(value as MetricsPeriod)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {activeTab === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchActive()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  )}
                </div>
              </div>

              {/* Active Deliveries Tab */}
              <TabsContent value="active" className="m-0">
                {isLoadingActive ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : !activeOrders ||
                  (activeOrders.accepted.length === 0 &&
                    activeOrders.preparing.length === 0 &&
                    activeOrders.onTheWay.length === 0) ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <CheckCircle className="mb-4 h-12 w-12" />
                    <p>No active deliveries</p>
                    <p className="text-sm">All orders have been delivered</p>
                  </div>
                ) : (
                  <div className="space-y-6 p-6">
                    {/* Accepted Orders */}
                    {activeOrders.accepted.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                          <AlertCircle className="h-4 w-4 text-blue-500" />
                          Accepted Orders ({activeOrders.accepted.length})
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Zone</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeOrders.accepted.map(renderOrderRow)}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Preparing Orders */}
                    {activeOrders.preparing.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                          <Clock className="h-4 w-4 text-purple-500" />
                          Preparing ({activeOrders.preparing.length})
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Zone</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeOrders.preparing.map(renderOrderRow)}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Out for Delivery Orders */}
                    {activeOrders.onTheWay.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                          <Truck className="h-4 w-4 text-indigo-500" />
                          Out for Delivery ({activeOrders.onTheWay.length})
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Zone</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeOrders.onTheWay.map(renderOrderRow)}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="m-0 p-6">
                {isLoadingMetrics ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : !metrics ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="mb-4 h-12 w-12" />
                    <p>No metrics available</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Orders
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {metrics.totalOrders}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Completed Orders
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                          {metrics.completedOrders}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Cancelled Orders
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-red-600">
                          {metrics.cancelledOrders}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Revenue
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(metrics.totalRevenue)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Cash Collected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(metrics.cashCollected)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Avg. Delivery Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metrics.averageDeliveryTime > 0
                            ? `${Math.round(metrics.averageDeliveryTime)} min`
                            : "N/A"}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Orders by Status */}
                    <Card className="md:col-span-2 lg:col-span-3">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Orders by Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(metrics.ordersByStatus || {}).map(
                            ([status, count]) => (
                              <div
                                key={status}
                                className="flex items-center gap-2 rounded-lg border p-3"
                              >
                                <Badge className={statusColors[status]}>
                                  {statusLabels[status] || status}
                                </Badge>
                                <span className="font-bold">{count as number}</span>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Orders by Zone */}
                    {metrics.ordersByZone &&
                      Object.keys(metrics.ordersByZone).length > 0 && (
                        <Card className="md:col-span-2 lg:col-span-3">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                              Orders by Zone
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(metrics.ordersByZone).map(
                                ([zone, count]) => (
                                  <div
                                    key={zone}
                                    className="flex items-center gap-2 rounded-lg border p-3"
                                  >
                                    <Badge variant="outline">{zone}</Badge>
                                    <span className="font-bold">{count as number}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <UpdateStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        order={selectedOrder}
      />

      <CashCollectionDialog
        open={cashDialogOpen}
        onOpenChange={setCashDialogOpen}
        order={selectedOrder}
      />

      <AssignDriverDialog
        open={driverDialogOpen}
        onOpenChange={setDriverDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
}
