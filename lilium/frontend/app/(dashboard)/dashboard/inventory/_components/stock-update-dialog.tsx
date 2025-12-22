"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { useUpdateStock } from "@/hooks/useInventory";
import { getErrorMessage } from "@/actions/config";
import type { LowStockProduct, StockUpdateType } from "@/types/inventory";

const stockUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  type: z.enum(["RESTOCK", "ADJUSTMENT", "RETURN"]),
  notes: z.string().optional(),
});

type StockUpdateFormData = z.infer<typeof stockUpdateSchema>;

interface StockUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: LowStockProduct;
  onSuccess?: () => void;
}

const UPDATE_TYPES: { value: StockUpdateType; label: string; description: string }[] = [
  {
    value: "RESTOCK",
    label: "Restock",
    description: "Add new stock to inventory"
  },
  {
    value: "ADJUSTMENT",
    label: "Adjustment",
    description: "Set absolute stock value"
  },
  {
    value: "RETURN",
    label: "Return",
    description: "Add returned items back"
  },
];

export function StockUpdateDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: StockUpdateDialogProps) {
  const updateMutation = useUpdateStock();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StockUpdateFormData>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      quantity: 0,
      type: "RESTOCK",
      notes: "",
    },
  });

  const updateType = watch("type");
  const quantity = watch("quantity");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        quantity: 0,
        type: "RESTOCK",
        notes: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: StockUpdateFormData) => {
    try {
      await updateMutation.mutateAsync({
        productId: product.id,
        quantity: data.quantity,
        type: data.type,
        notes: data.notes || undefined,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update stock:", getErrorMessage(error));
    }
  };

  // Calculate new stock based on update type
  const getNewStock = () => {
    if (!quantity || quantity <= 0) return product.stock;

    switch (updateType) {
      case "RESTOCK":
      case "RETURN":
        return product.stock + quantity;
      case "ADJUSTMENT":
        return quantity;
      default:
        return product.stock;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            Update stock for &quot;{product.nameEn}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Stock Info */}
          <div className="rounded-lg bg-muted p-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Stock:</span>
                <span className="ml-2 font-medium">{product.stock}</span>
              </div>
              <div>
                <span className="text-muted-foreground">SKU:</span>
                <span className="ml-2 font-mono">{product.sku}</span>
              </div>
            </div>
          </div>

          {/* Update Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Update Type *</Label>
            <Select
              value={updateType}
              onValueChange={(value) => setValue("type", value as StockUpdateType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select update type" />
              </SelectTrigger>
              <SelectContent>
                {UPDATE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {updateType === "ADJUSTMENT" ? "New Stock Value *" : "Quantity to Add *"}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder={updateType === "ADJUSTMENT" ? "Enter new stock value" : "Enter quantity"}
              {...register("quantity")}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New Stock:</span>
              <span className="text-lg font-semibold">
                {getNewStock()}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Add notes about this stock update"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Stock"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
