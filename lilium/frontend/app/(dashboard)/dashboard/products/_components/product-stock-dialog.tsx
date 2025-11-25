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
import { useUpdateStock } from "@/hooks/useProducts";
import { getErrorMessage } from "@/actions/config";
import type { Product } from "@/types/product";

const stockUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  operation: z.enum(["add", "subtract", "set"], {
    required_error: "Operation is required",
  }),
});

type StockUpdateFormData = z.infer<typeof stockUpdateSchema>;

interface ProductStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onSuccess?: () => void;
}

export function ProductStockDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductStockDialogProps) {
  const updateStockMutation = useUpdateStock();

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
      quantity: 1,
      operation: "add",
    },
  });

  const operation = watch("operation");
  const quantity = watch("quantity");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        quantity: 1,
        operation: "add",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: StockUpdateFormData) => {
    try {
      await updateStockMutation.mutateAsync({
        id: product.id,
        data: {
          quantity: data.quantity,
          operation: data.operation,
        },
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update stock:", getErrorMessage(error));
    }
  };

  // Calculate new stock value
  const calculateNewStock = () => {
    if (!quantity) return product.stock;

    switch (operation) {
      case "add":
        return product.stock + quantity;
      case "subtract":
        return Math.max(0, product.stock - quantity);
      case "set":
        return quantity;
      default:
        return product.stock;
    }
  };

  const newStock = calculateNewStock();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            Adjust inventory for {product.nameEn} (SKU: {product.sku})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Stock Display */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-2xl font-bold">
                  {product.stock} {product.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">New Stock</p>
                <p className={`text-2xl font-bold ${
                  newStock > product.stock
                    ? "text-green-600"
                    : newStock < product.stock
                    ? "text-orange-600"
                    : ""
                }`}>
                  {newStock} {product.unit}
                </p>
              </div>
            </div>
          </div>

          {/* Operation Select */}
          <div className="space-y-2">
            <Label htmlFor="operation">Operation *</Label>
            <Select
              value={operation}
              onValueChange={(value) =>
                setValue("operation", value as "add" | "subtract" | "set")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add to stock</SelectItem>
                <SelectItem value="subtract">Subtract from stock</SelectItem>
                <SelectItem value="set">Set stock to</SelectItem>
              </SelectContent>
            </Select>
            {errors.operation && (
              <p className="text-sm text-destructive">
                {errors.operation.message}
              </p>
            )}
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity * ({product.unit})
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Enter quantity"
              {...register("quantity")}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>

          {/* Warning for subtract operation */}
          {operation === "subtract" && newStock === 0 && (
            <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
              ⚠️ This will reduce stock to zero. The product will be out of stock.
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
            <Button type="submit" disabled={updateStockMutation.isPending}>
              {updateStockMutation.isPending ? (
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
