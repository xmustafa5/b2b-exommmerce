"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { VendorProduct } from "@/types/vendor";

interface VendorProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: VendorProduct;
}

export function VendorProductEditDialog({
  open,
  onOpenChange,
  product,
}: VendorProductEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product - {product.nameEn}</DialogTitle>
        </DialogHeader>
        <p>Edit dialog implementation pending</p>
      </DialogContent>
    </Dialog>
  );
}
