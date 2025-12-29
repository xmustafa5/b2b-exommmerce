"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MoreHorizontal, Eye, CheckCircle, XCircle, Download, Loader2, Package, Truck, PackageCheck } from "lucide-react";
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
import { useOrders, useConfirmOrder, useCancelOrder, useProcessOrder, useShipOrder, useDeliverOrder } from "@/hooks/useOrders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { exportApi } from "@/actions/export";
import { useToast } from "@/hooks/use-toast";
import type { OrderFilters, OrderStatus } from "@/types/order";

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10,
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useOrders(filters);
  const confirmMutation = useConfirmOrder();
  const cancelMutation = useCancelOrder();
  const processMutation = useProcessOrder();
  const shipMutation = useShipOrder();
  const deliverMutation = useDeliverOrder();

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportApi.ordersCSV({
        status: filters.status,
      });
      toast({
        title: "Success",
        description: "Orders exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to export orders",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirm = (id: string) => {
    confirmMutation.mutate(id);
  };

  const handleCancel = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelMutation.mutate({ id, reason: "Cancelled by vendor" });
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Orders" />

      <div className="flex-1 space-y-6 p-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by order number..."
              className="w-64 pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === "all" ? undefined : (value as OrderStatus),
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
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.paymentStatus || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  paymentStatus:
                    value === "all" ? undefined : (value as "PENDING" | "PAID"),
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !data?.data?.length ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <p>No orders found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.length || 0} items
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{order.shop?.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-32">
                            {order.shop?.address}
                          </p>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              statusColors[order.status]
                            }`}
                          >
                            {statusLabels[order.status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              order.paymentStatus === "PAID"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/orders/${order.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* PENDING: Confirm or Cancel */}
                              {order.status === "PENDING" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleConfirm(order.id)}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Confirm Order
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCancel(order.id)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                </>
                              )}
                              {/* CONFIRMED: Start Processing or Cancel */}
                              {order.status === "CONFIRMED" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => processMutation.mutate(order.id)}
                                  >
                                    <Package className="mr-2 h-4 w-4 text-purple-600" />
                                    Start Processing
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCancel(order.id)}
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                </>
                              )}
                              {/* PROCESSING: Ship Order */}
                              {order.status === "PROCESSING" && (
                                <DropdownMenuItem
                                  onClick={() => shipMutation.mutate(order.id)}
                                >
                                  <Truck className="mr-2 h-4 w-4 text-indigo-600" />
                                  Ship Order
                                </DropdownMenuItem>
                              )}
                              {/* SHIPPED: Mark as Delivered */}
                              {order.status === "SHIPPED" && (
                                <DropdownMenuItem
                                  onClick={() => deliverMutation.mutate(order.id)}
                                >
                                  <PackageCheck className="mr-2 h-4 w-4 text-green-600" />
                                  Mark as Delivered
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data.meta && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(data.meta.page - 1) * data.meta.limit + 1} to{" "}
                      {Math.min(
                        data.meta.page * data.meta.limit,
                        data.meta.total
                      )}{" "}
                      of {data.meta.total} orders
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
                        disabled={data.meta.page <= 1}
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
                        disabled={data.meta.page >= data.meta.totalPages}
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
    </div>
  );
}
