"use client";

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
import { useDeleteVendorProduct } from "@/hooks/useVendors";
import type { VendorProduct } from "@/types/vendor";

interface VendorProductDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: VendorProduct;
}

export function VendorProductDeleteDialog({
  open,
  onOpenChange,
  product,
}: VendorProductDeleteDialogProps) {
  const deleteMutation = useDeleteVendorProduct();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(product.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{product.nameEn}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
