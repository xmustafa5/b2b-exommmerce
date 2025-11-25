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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateVendorProductStock } from "@/hooks/useVendors";
import type { VendorProduct } from "@/types/vendor";

interface VendorProductStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: VendorProduct;
}

export function VendorProductStockDialog({
  open,
  onOpenChange,
  product,
}: VendorProductStockDialogProps) {
  const [stock, setStock] = useState(product.stock);
  const updateStockMutation = useUpdateVendorProductStock(product.id);

  const handleUpdate = async () => {
    try {
      await updateStockMutation.mutateAsync({ stock });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update stock:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Stock - {product.nameEn}</DialogTitle>
          <DialogDescription>
            Update the stock quantity for this product
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={updateStockMutation.isPending}>
            {updateStockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
