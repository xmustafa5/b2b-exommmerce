"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBulkUpdateStock } from "@/hooks/useInventory";
import { getErrorMessage } from "@/actions/config";
import type { StockUpdateType, LowStockProduct } from "@/types/inventory";

interface BulkUpdateItem {
  id: string;
  product: LowStockProduct;
  quantity: number;
  type: StockUpdateType;
  notes: string;
}

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: LowStockProduct[];
  onSuccess?: () => void;
}

const UPDATE_TYPES: { value: StockUpdateType; label: string }[] = [
  { value: "RESTOCK", label: "Restock" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "RETURN", label: "Return" },
];

export function BulkUpdateDialog({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BulkUpdateDialogProps) {
  const bulkUpdateMutation = useBulkUpdateStock();
  const [updates, setUpdates] = useState<BulkUpdateItem[]>([]);

  // Initialize updates when dialog opens
  useState(() => {
    if (open && selectedProducts.length > 0) {
      setUpdates(
        selectedProducts.map((product) => ({
          id: product.id,
          product,
          quantity: 0,
          type: "RESTOCK" as StockUpdateType,
          notes: "",
        }))
      );
    }
  });

  const handleQuantityChange = (id: string, quantity: number) => {
    setUpdates((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleTypeChange = (id: string, type: StockUpdateType) => {
    setUpdates((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, type } : item
      )
    );
  };

  const handleRemove = (id: string) => {
    setUpdates((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddProduct = (product: LowStockProduct) => {
    if (!updates.find((u) => u.id === product.id)) {
      setUpdates((prev) => [
        ...prev,
        {
          id: product.id,
          product,
          quantity: 0,
          type: "RESTOCK",
          notes: "",
        },
      ]);
    }
  };

  const handleSubmit = async () => {
    const validUpdates = updates.filter((u) => u.quantity > 0);

    if (validUpdates.length === 0) {
      return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        updates: validUpdates.map((u) => ({
          productId: u.id,
          quantity: u.quantity,
          type: u.type,
          notes: u.notes || undefined,
        })),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to bulk update stock:", getErrorMessage(error));
    }
  };

  const getNewStock = (item: BulkUpdateItem) => {
    if (!item.quantity || item.quantity <= 0) return item.product.stock;

    switch (item.type) {
      case "RESTOCK":
      case "RETURN":
        return item.product.stock + item.quantity;
      case "ADJUSTMENT":
        return item.quantity;
      default:
        return item.product.stock;
    }
  };

  const validCount = updates.filter((u) => u.quantity > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Stock Update</DialogTitle>
          <DialogDescription>
            Update stock for multiple products at once.
          </DialogDescription>
        </DialogHeader>

        {updates.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <p>No products selected for bulk update.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-28">Current</TableHead>
                  <TableHead className="w-36">Type</TableHead>
                  <TableHead className="w-28">Quantity</TableHead>
                  <TableHead className="w-28">New Stock</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.product.nameEn}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.product.sku}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.product.stock}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.type}
                        onValueChange={(value) =>
                          handleTypeChange(item.id, value as StockUpdateType)
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UPDATE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {getNewStock(item)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {bulkUpdateMutation.data && (
              <div className="rounded-lg border p-3">
                <p className="text-sm">
                  <span className="text-green-600">
                    Success: {bulkUpdateMutation.data.successCount}
                  </span>
                  {bulkUpdateMutation.data.failureCount > 0 && (
                    <span className="ml-4 text-destructive">
                      Failed: {bulkUpdateMutation.data.failureCount}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={bulkUpdateMutation.isPending || validCount === 0}
          >
            {bulkUpdateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              `Update ${validCount} Product${validCount !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
