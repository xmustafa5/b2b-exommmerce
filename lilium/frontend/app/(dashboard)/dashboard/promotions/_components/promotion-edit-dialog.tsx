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
import { useUpdatePromotion } from "@/hooks/usePromotions";
import { getErrorMessage } from "@/actions/config";
import type { Promotion, PromotionType } from "@/types/promotion";

const editPromotionSchema = z.object({
  nameEn: z.string().min(1, "Name (English) is required").max(100),
  nameAr: z.string().min(1, "Name (Arabic) is required").max(100),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  type: z.enum(["percentage", "fixed", "buy_x_get_y", "bundle"]),
  value: z.coerce.number().min(0, "Value must be positive"),
  minPurchase: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean().optional(),
  zones: z.array(z.string()).optional(),
  // Buy X Get Y specific
  buyQuantity: z.coerce.number().int().min(1).optional(),
  getQuantity: z.coerce.number().int().min(1).optional(),
  // Bundle specific
  bundlePrice: z.coerce.number().min(0).optional(),
});

type EditPromotionFormData = z.infer<typeof editPromotionSchema>;

interface PromotionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion;
  onSuccess?: () => void;
}

const ZONES = ["KARKH", "RUSAFA"];

const PROMOTION_TYPES: { value: PromotionType; label: string }[] = [
  { value: "percentage", label: "Percentage Discount" },
  { value: "fixed", label: "Fixed Amount Discount" },
  { value: "buy_x_get_y", label: "Buy X Get Y Free" },
  { value: "bundle", label: "Bundle Deal" },
];

export function PromotionEditDialog({
  open,
  onOpenChange,
  promotion,
  onSuccess,
}: PromotionEditDialogProps) {
  const updateMutation = useUpdatePromotion(promotion.id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditPromotionFormData>({
    resolver: zodResolver(editPromotionSchema),
    defaultValues: {
      nameEn: promotion.nameEn,
      nameAr: promotion.nameAr,
      descriptionEn: promotion.descriptionEn || "",
      descriptionAr: promotion.descriptionAr || "",
      type: promotion.type,
      value: promotion.value,
      minPurchase: promotion.minPurchase || undefined,
      maxDiscount: promotion.maxDiscount || undefined,
      startDate: promotion.startDate.split("T")[0],
      endDate: promotion.endDate.split("T")[0],
      isActive: promotion.isActive,
      zones: promotion.zones || [],
      buyQuantity: promotion.buyQuantity || undefined,
      getQuantity: promotion.getQuantity || undefined,
      bundlePrice: promotion.bundlePrice || undefined,
    },
  });

  const promotionType = watch("type");
  const selectedZones = watch("zones") || [];

  // Reset form when dialog opens or promotion changes
  useEffect(() => {
    if (open) {
      reset({
        nameEn: promotion.nameEn,
        nameAr: promotion.nameAr,
        descriptionEn: promotion.descriptionEn || "",
        descriptionAr: promotion.descriptionAr || "",
        type: promotion.type,
        value: promotion.value,
        minPurchase: promotion.minPurchase || undefined,
        maxDiscount: promotion.maxDiscount || undefined,
        startDate: promotion.startDate.split("T")[0],
        endDate: promotion.endDate.split("T")[0],
        isActive: promotion.isActive,
        zones: promotion.zones || [],
        buyQuantity: promotion.buyQuantity || undefined,
        getQuantity: promotion.getQuantity || undefined,
        bundlePrice: promotion.bundlePrice || undefined,
      });
    }
  }, [open, promotion, reset]);

  const onSubmit = async (data: EditPromotionFormData) => {
    try {
      const submitData = {
        ...data,
        // Convert date strings to ISO datetime format
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(`${data.endDate}T23:59:59`).toISOString(),
        minPurchase: data.minPurchase || undefined,
        maxDiscount: data.maxDiscount || undefined,
        zones: data.zones?.length ? data.zones : undefined,
        buyQuantity: data.buyQuantity || undefined,
        getQuantity: data.getQuantity || undefined,
        bundlePrice: data.bundlePrice || undefined,
      };

      await updateMutation.mutateAsync(submitData);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update promotion:", getErrorMessage(error));
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
          <DialogTitle>Edit Promotion</DialogTitle>
          <DialogDescription>
            Update the promotion details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameEn">Name (English) *</Label>
              <Input
                id="nameEn"
                placeholder="e.g., Summer Sale"
                {...register("nameEn")}
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">Name (Arabic) *</Label>
              <Input
                id="nameAr"
                placeholder="e.g., تخفيضات الصيف"
                dir="rtl"
                {...register("nameAr")}
              />
              {errors.nameAr && (
                <p className="text-sm text-destructive">{errors.nameAr.message}</p>
              )}
            </div>
          </div>

          {/* Description Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">Description (English)</Label>
              <textarea
                id="descriptionEn"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter promotion description"
                {...register("descriptionEn")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">Description (Arabic)</Label>
              <textarea
                id="descriptionAr"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="أدخل وصف العرض"
                dir="rtl"
                {...register("descriptionAr")}
              />
            </div>
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
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Promotion"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
