"use client";

import { useState } from "react";
import { Search, ShoppingCart, Eye, ArrowUpDown } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendorOrders } from "@/hooks/useVendors";
import type { VendorOrderFilters } from "@/types/vendor";
import type { OrderStatus } from "@/types/order";
import { VendorOrderViewDialog } from "./vendor-order-view-dialog";
import { VendorOrderStatusDialog } from "./vendor-order-status-dialog";

const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  PROCESSING: "default",
  READY_FOR_DELIVERY: "default",
  OUT_FOR_DELIVERY: "default",
  DELIVERED: "outline",
  CANCELLED: "destructive",
  RETURNED: "destructive",
};

export function VendorOrdersTab() {
  const [filters, setFilters] = useState<VendorOrderFilters>({});
  const [search, setSearch] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [updatingOrder, setUpdatingOrder] = useState<any>(null);

  const { data, isLoading } = useVendorOrders(filters);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleOpenView = (order: any) => {
    setViewingOrder(order);
    setViewDialogOpen(true);
  };

  const handleOpenStatus = (order: any) => {
    setUpdatingOrder(order);
    setStatusDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Orders</CardTitle>

            <div className="flex gap-2">
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status:
                      value === "all" ? undefined : (value as OrderStatus),
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="READY_FOR_DELIVERY">Ready for Delivery</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !data?.data.length ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
              <ShoppingCart className="mb-4 h-12 w-12" />
              <p>No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.shop.nameEn}</p>
                        {order.shop.nameAr && (
                          <p className="text-xs text-muted-foreground" dir="rtl">
                            {order.shop.nameAr}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.zone}</Badge>
                    </TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ORDER_STATUS_COLORS[order.status]}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenView(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenStatus(order)}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {data && data.pagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {data.data.length} of {data.pagination.total} orders
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page === 1}
                  onClick={() =>
                    setFilters({ ...filters, page: data.pagination.page - 1 })
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    data.pagination.page >= data.pagination.totalPages
                  }
                  onClick={() =>
                    setFilters({ ...filters, page: data.pagination.page + 1 })
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {viewingOrder && (
        <VendorOrderViewDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          order={viewingOrder}
        />
      )}

      {updatingOrder && (
        <VendorOrderStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          order={updatingOrder}
        />
      )}
    </>
  );
}
