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
import { useCreatePromotion } from "@/hooks/usePromotions";
import { getErrorMessage } from "@/actions/config";
import type { PromotionType } from "@/types/promotion";

const createPromotionSchema = z.object({
  code: z.string().min(1, "Promotion code is required").max(50),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed", "buy_x_get_y", "bundle"]),
  value: z.coerce.number().min(0, "Value must be positive"),
  minPurchase: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  zones: z.array(z.string()).optional(),
  // Buy X Get Y specific
  buyQuantity: z.coerce.number().int().min(1).optional(),
  getQuantity: z.coerce.number().int().min(1).optional(),
  // Bundle specific
  bundlePrice: z.coerce.number().min(0).optional(),
});

type CreatePromotionFormData = z.infer<typeof createPromotionSchema>;

interface PromotionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ZONES = ["KARKH", "RUSAFA"];

const PROMOTION_TYPES: { value: PromotionType; label: string }[] = [
  { value: "percentage", label: "Percentage Discount" },
  { value: "fixed", label: "Fixed Amount Discount" },
  { value: "buy_x_get_y", label: "Buy X Get Y Free" },
  { value: "bundle", label: "Bundle Deal" },
];

export function PromotionCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: PromotionCreateDialogProps) {
  const createMutation = useCreatePromotion();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePromotionFormData>({
    resolver: zodResolver(createPromotionSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      minPurchase: undefined,
      maxDiscount: undefined,
      startDate: "",
      endDate: "",
      isActive: true,
      usageLimit: undefined,
      zones: [],
      buyQuantity: undefined,
      getQuantity: undefined,
      bundlePrice: undefined,
    },
  });

  const promotionType = watch("type");
  const selectedZones = watch("zones") || [];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        code: "",
        name: "",
        description: "",
        type: "percentage",
        value: 0,
        minPurchase: undefined,
        maxDiscount: undefined,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        isActive: true,
        usageLimit: undefined,
        zones: [],
        buyQuantity: undefined,
        getQuantity: undefined,
        bundlePrice: undefined,
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: CreatePromotionFormData) => {
    try {
      const submitData = {
        ...data,
        minPurchase: data.minPurchase || undefined,
        maxDiscount: data.maxDiscount || undefined,
        usageLimit: data.usageLimit || undefined,
        zones: data.zones?.length ? data.zones : undefined,
        buyQuantity: data.buyQuantity || undefined,
        getQuantity: data.getQuantity || undefined,
        bundlePrice: data.bundlePrice || undefined,
      };

      await createMutation.mutateAsync(submitData);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create promotion:", getErrorMessage(error));
    }
  };

  const handleZoneToggle = (zone: string) => {
    const currentZones = selectedZones || [];
    if (currentZones.includes(zone)) {
      setValue(
        "zones",
        currentZones.filter((z) => z !== zone)
      );
    } else {
      setValue("zones", [...currentZones, zone]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Promotion</DialogTitle>
          <DialogDescription>
            Create a new promotion or discount for your products.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Promotion Code *</Label>
              <Input
                id="code"
                placeholder="e.g., SUMMER2024"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Sale"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Enter promotion description"
              {...register("description")}
            />
          </div>

          {/* Type and Value */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Promotion Type *</Label>
              <Select
                value={promotionType}
                onValueChange={(value) =>
                  setValue("type", value as PromotionType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROMOTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                {promotionType === "percentage"
                  ? "Discount Percentage *"
                  : "Discount Amount *"}
              </Label>
              <Input
                id="value"
                type="number"
                step={promotionType === "percentage" ? "1" : "0.01"}
                placeholder={promotionType === "percentage" ? "e.g., 10" : "e.g., 5.00"}
                {...register("value")}
              />
              {errors.value && (
                <p className="text-sm text-destructive">{errors.value.message}</p>
              )}
            </div>
          </div>

          {/* Buy X Get Y Fields */}
          {promotionType === "buy_x_get_y" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buyQuantity">Buy Quantity</Label>
                <Input
                  id="buyQuantity"
                  type="number"
                  min="1"
                  placeholder="e.g., 2"
                  {...register("buyQuantity")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="getQuantity">Get Quantity Free</Label>
                <Input
                  id="getQuantity"
                  type="number"
                  min="1"
                  placeholder="e.g., 1"
                  {...register("getQuantity")}
                />
              </div>
            </div>
          )}

          {/* Bundle Fields */}
          {promotionType === "bundle" && (
            <div className="space-y-2">
              <Label htmlFor="bundlePrice">Bundle Price</Label>
              <Input
                id="bundlePrice"
                type="number"
                step="0.01"
                placeholder="e.g., 49.99"
                {...register("bundlePrice")}
              />
            </div>
          )}

          {/* Limits */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="minPurchase">Min Purchase</Label>
              <Input
                id="minPurchase"
                type="number"
                step="0.01"
                placeholder="e.g., 50.00"
                {...register("minPurchase")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDiscount">Max Discount</Label>
              <Input
                id="maxDiscount"
                type="number"
                step="0.01"
                placeholder="e.g., 100.00"
                {...register("maxDiscount")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                min="0"
                placeholder="e.g., 100"
                {...register("usageLimit")}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-sm text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Zones */}
          <div className="space-y-2">
            <Label>Zones (leave empty for all zones)</Label>
            <div className="flex gap-2">
              {ZONES.map((zone) => (
                <Button
                  key={zone}
                  type="button"
                  variant={selectedZones.includes(zone) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleZoneToggle(zone)}
                >
                  {zone}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Promotion"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
