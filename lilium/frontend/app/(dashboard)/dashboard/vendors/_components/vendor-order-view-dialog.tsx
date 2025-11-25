"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { VendorOrder } from "@/types/vendor";

interface VendorOrderViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: VendorOrder;
}

export function VendorOrderViewDialog({
  open,
  onOpenChange,
  order,
}: VendorOrderViewDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Shop</p>
              <p className="font-medium">{order.shop.nameEn}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{order.status.replace(/_/g, " ")}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Zone</p>
              <p className="font-medium">{order.zone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Fee</p>
              <p className="font-medium">{formatCurrency(order.deliveryFee)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product.nameEn}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
