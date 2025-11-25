"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateVendorOrderStatus } from "@/hooks/useVendors";
import type { VendorOrder } from "@/types/vendor";
import type { OrderStatus } from "@/types/order";

interface VendorOrderStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: VendorOrder;
}

export function VendorOrderStatusDialog({
  open,
  onOpenChange,
  order,
}: VendorOrderStatusDialogProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const updateStatusMutation = useUpdateVendorOrderStatus(order.id);

  const handleUpdate = async () => {
    try {
      await updateStatusMutation.mutateAsync({ status });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status - {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Change the status of this order
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Order Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={updateStatusMutation.isPending}>
            {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
